// ============================================
// routes/mfa.routes.js — MFA por correo
// ============================================
// El flujo es:
// 1. Login exitoso con email+password
// 2. Si tiene MFA activo, se envía código al correo
// 3. Usuario ingresa el código de 6 dígitos
// 4. Se verifica y se emite el JWT final

import { Router } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db/db.js'
import { verificarToken } from '../middlewares/auth.js'
import { enviarCodigoMFA } from '../utils/email.js'

const router = Router()

// ── Genera código aleatorio de 6 dígitos ──────────────────
const generarCodigo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ============================================
// POST /api/mfa/activar
// ============================================
// Activa el MFA en la cuenta del usuario.
// A partir de este momento cada login enviará un código al correo.
router.post('/activar', verificarToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE usuarios SET mfa_activo = true WHERE id = $1',
      [req.usuario.id]
    )

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [req.usuario.id, 'mfa_activado', 'MFA por correo activado', req.ip]
    )

    res.json({ mensaje: 'MFA activado. Ahora necesitarás un código de tu correo para iniciar sesión.' })
  } catch (err) {
    console.error('[ERROR] activar MFA:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/mfa/desactivar
// ============================================
router.post('/desactivar', verificarToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE usuarios SET mfa_activo = false WHERE id = $1',
      [req.usuario.id]
    )

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [req.usuario.id, 'mfa_desactivado', 'MFA desactivado', req.ip]
    )

    res.json({ mensaje: 'MFA desactivado.' })
  } catch (err) {
    console.error('[ERROR] desactivar MFA:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/mfa/enviar-codigo
// ============================================
// Se llama automáticamente después del login cuando MFA está activo.
// Genera un código de 6 dígitos y lo envía al correo del usuario.
router.post('/enviar-codigo', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Datos incompletos.' })
    }

    const resultado = await pool.query(
      'SELECT id, nombre, email FROM usuarios WHERE id = $1 AND activo = true AND mfa_activo = true',
      [userId]
    )

    const usuario = resultado.rows[0]
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }

    // Invalidar códigos anteriores no usados del mismo usuario
    await pool.query(
      'UPDATE mfa_codigos SET usado = true WHERE usuario_id = $1 AND usado = false',
      [userId]
    )

    // Generar nuevo código con expiración de 5 minutos
    const codigo = generarCodigo()
    const expiraEn = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos

    await pool.query(
      `INSERT INTO mfa_codigos (usuario_id, codigo, expira_en)
       VALUES ($1, $2, $3)`,
      [userId, codigo, expiraEn]
    )

    // Enviar el código por correo
    const enviado = await enviarCodigoMFA(usuario.email, usuario.nombre, codigo)

    if (!enviado) {
      return res.status(500).json({ error: 'Error al enviar el correo. Intenta de nuevo.' })
    }

    // Por seguridad no confirmamos a qué correo se envió exactamente
    const emailOculto = usuario.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

    res.json({
      mensaje: `Código enviado a ${emailOculto}`,
      emailOculto
    })

  } catch (err) {
    console.error('[ERROR] enviar código MFA:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/mfa/validar-login
// ============================================
// Verifica el código ingresado por el usuario.
// Si es válido emite el JWT final.
router.post('/validar-login', async (req, res) => {
  try {
    const { userId, codigo } = req.body

    if (!userId || !codigo) {
      return res.status(400).json({ error: 'Datos incompletos.' })
    }

    if (!/^\d{6}$/.test(codigo)) {
      return res.status(400).json({ error: 'El código debe ser de 6 dígitos.' })
    }

    // Buscar el código más reciente no usado y no expirado
    const resultado = await pool.query(
      `SELECT * FROM mfa_codigos 
       WHERE usuario_id = $1 
       AND codigo = $2 
       AND usado = false 
       AND expira_en > NOW()
       ORDER BY creado_en DESC 
       LIMIT 1`,
      [userId, codigo]
    )

    if (resultado.rows.length === 0) {
      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [userId, 'mfa_fallido', 'Código MFA incorrecto o expirado', req.ip]
      )
      return res.status(401).json({ error: 'Código incorrecto o expirado.' })
    }

    // Marcar el código como usado — no puede reutilizarse
    await pool.query(
      'UPDATE mfa_codigos SET usado = true WHERE id = $1',
      [resultado.rows[0].id]
    )

    // Obtener datos del usuario para el JWT
    const usuarioRes = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [userId]
    )
    const usuario = usuarioRes.rows[0]

    // Emitir JWT final
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h', issuer: 'medistock', audience: 'medistock-app' }
    )

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [usuario.id, 'login_mfa', 'Login con MFA por correo exitoso', req.ip]
    )

    res.json({
      mensaje: 'Autenticación exitosa.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    })

  } catch (err) {
    console.error('[ERROR] validar MFA login:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

export default router