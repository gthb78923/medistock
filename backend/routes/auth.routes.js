// ============================================
// routes/auth.routes.js
// ============================================
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/db.js'
import {
  reglasRegistro,
  reglasLogin,
  validar
} from '../middlewares/validacion.js'
import { invalidarToken } from '../middlewares/tokenBlacklist.js'
import { verificarToken } from '../middlewares/auth.js'
import { AppError } from '../utils/AppError.js'  // ← NUEVO IMPORT AGREGADO

const router = Router()

// ── Mapa de intentos fallidos por IP ──────────────────────
// Bloqueo temporal tras 5 intentos fallidos consecutivos.
// Protección contra ataques de fuerza bruta.
const intentosFallidos = new Map()
const MAX_INTENTOS = 5
const TIEMPO_BLOQUEO = 15 * 60 * 1000 // 15 minutos en ms

const verificarBloqueo = (ip) => {
  const datos = intentosFallidos.get(ip)
  if (!datos) return false
  if (Date.now() - datos.ultimoIntento > TIEMPO_BLOQUEO) {
    intentosFallidos.delete(ip)
    return false
  }
  return datos.intentos >= MAX_INTENTOS
}

const registrarIntento = (ip, exitoso) => {
  if (exitoso) {
    intentosFallidos.delete(ip)
    return
  }
  const datos = intentosFallidos.get(ip) || { intentos: 0, ultimoIntento: 0 }
  intentosFallidos.set(ip, {
    intentos: datos.intentos + 1,
    ultimoIntento: Date.now()
  })
}

// ============================================
// POST /api/auth/registro
// ============================================
router.post('/registro', reglasRegistro, validar, async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body

    // Verificar que el email no esté registrado
    const existente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    )
    if (existente.rows.length > 0) {
      throw new AppError('El email ya está registrado.', 409)  // ← REEMPLAZADO
    }

    // Hash seguro con bcrypt costo 12
    const passwordHasheada = await bcrypt.hash(password, 12)

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, rol`,
      [nombre, email, passwordHasheada, rol]
    )

    const nuevoUsuario = resultado.rows[0]

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [nuevoUsuario.id, 'registro', `Nuevo usuario: ${rol}`, req.ip]
    )

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente.',
      usuario: nuevoUsuario
    })

  } catch (err) {
    console.error('[ERROR] registro:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', reglasLogin, validar, async (req, res) => {
  const ip = req.ip

  try {
    // ── Verificar si la IP está bloqueada ─────────────────
    if (verificarBloqueo(ip)) {
      console.warn(`[BLOQUEO] IP bloqueada por intentos excesivos: ${ip}`)
      return res.status(429).json({
        error: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta en 15 minutos.'
      })
    }

    const { email, password } = req.body

    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    )

    const usuario = resultado.rows[0]

    // Mensaje genérico — no revela si el email existe o no
    if (!usuario) {
      registrarIntento(ip, false)
      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [null, 'login_fallido', `Email no encontrado: ${email}`, ip]
      )
      throw new AppError('Credenciales incorrectas.', 401)  // ← REEMPLAZADO
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValida) {
      registrarIntento(ip, false)
      const datos = intentosFallidos.get(ip)
      const intentosRestantes = MAX_INTENTOS - (datos?.intentos || 0)

      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [usuario.id, 'login_fallido', 'Contraseña incorrecta', ip]
      )

      throw new AppError(  // ← REEMPLAZADO
        `Credenciales incorrectas. ${intentosRestantes > 0
          ? `${intentosRestantes} intentos restantes.`
          : 'Cuenta bloqueada temporalmente.'}`,
        401
      )
    }

    // Login exitoso — limpiar intentos fallidos
    registrarIntento(ip, true)

    // ── Verificar si el usuario tiene MFA activo ──────────
    if (usuario.mfa_activo) {
      // No emitimos el token aún.
      // Devolvemos solo el userId para el segundo paso.
      // El token real se emite en /api/mfa/validar-login
      return res.json({
        mfa_requerido: true,
        userId: usuario.id,
        mensaje: 'Ingresa el código de tu app de autenticación.'
      })
    }

    // Sin MFA — emitir token directamente
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h',
        issuer: 'medistock',
        audience: 'medistock-app'
      }
    )

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [usuario.id, 'login', 'Inicio de sesión exitoso', ip]
    )

    res.json({
      mensaje: 'Login exitoso.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    })

  } catch (err) {
    console.error('[ERROR] login:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/auth/logout
// ============================================
// Invalida el token actual agregándolo a la blacklist.
// Aunque el token no haya expirado, ya no funcionará.
router.post('/logout', verificarToken, async (req, res) => {
  try {
    const token = req.token
    const decoded = jwt.decode(token)

    // Agregar a blacklist hasta que expire naturalmente
    invalidarToken(token, decoded.exp)

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [req.usuario.id, 'logout', 'Sesión cerrada correctamente', req.ip]
    )

    res.json({ mensaje: 'Sesión cerrada correctamente.' })
  } catch (err) {
    console.error('[ERROR] logout:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

export default router