// ============================================
// routes/mfa.routes.js — Autenticación de dos factores
// ============================================
// TOTP (Time-based One-Time Password) es el estándar
// usado por Google Authenticator, Authy, etc.
// Funciona así:
// 1. El servidor genera una clave secreta única por usuario
// 2. El usuario la escanea con su app de autenticación
// 3. La app genera códigos de 6 dígitos que cambian cada 30 segundos
// 4. En cada login el usuario debe ingresar ese código

import { Router } from 'express'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import pool from '../db/db.js'
import { verificarToken } from '../middlewares/auth.js'

const router = Router()

// ============================================
// POST /api/mfa/configurar
// ============================================
// Genera la clave secreta y el QR para que el usuario
// configure su app de autenticación
router.post('/configurar', verificarToken, async (req, res) => {
  try {
    // Generar clave secreta única para este usuario
    const secreto = speakeasy.generateSecret({
      name: `MediStock (${req.usuario.email})`,
      length: 32
    })

    // Guardar el secreto temporalmente (aún no activo)
    // Solo se activa cuando el usuario verifica con un código válido
    await pool.query(
      'UPDATE usuarios SET mfa_secret = $1 WHERE id = $2',
      [secreto.base32, req.usuario.id]
    )

    // Generar imagen del QR para escanear con Google Authenticator
    const qrImagen = await qrcode.toDataURL(secreto.otpauth_url)

    res.json({
      secreto: secreto.base32, // por si quieren ingresarlo manualmente
      qr: qrImagen             // imagen base64 del QR
    })
  } catch (err) {
    console.error('[ERROR] configurar MFA:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/mfa/verificar
// ============================================
// El usuario ingresa el código de 6 dígitos de su app.
// Si es válido, activa el MFA en su cuenta.
router.post('/verificar', verificarToken, async (req, res) => {
  try {
    const { codigo } = req.body

    if (!codigo || !/^\d{6}$/.test(codigo)) {
      return res.status(400).json({ error: 'El código debe ser de 6 dígitos.' })
    }

    // Obtener el secreto del usuario
    const resultado = await pool.query(
      'SELECT mfa_secret FROM usuarios WHERE id = $1',
      [req.usuario.id]
    )

    const secreto = resultado.rows[0]?.mfa_secret
    if (!secreto) {
      return res.status(400).json({ error: 'Primero debes configurar el MFA.' })
    }

    // Verificar que el código sea válido
    // window: 1 significa que acepta el código del intervalo anterior
    // por si hay pequeña diferencia de tiempo entre dispositivos
    const esValido = speakeasy.totp.verify({
      secret: secreto,
      encoding: 'base32',
      token: codigo,
      window: 1
    })

    if (!esValido) {
      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'mfa_fallido', 'Código MFA incorrecto en configuración', req.ip]
      )
      return res.status(401).json({ error: 'Código incorrecto. Intenta de nuevo.' })
    }

    // Activar MFA en la cuenta
    await pool.query(
      'UPDATE usuarios SET mfa_activo = true WHERE id = $1',
      [req.usuario.id]
    )

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [req.usuario.id, 'mfa_activado', 'MFA activado correctamente', req.ip]
    )

    res.json({ mensaje: 'MFA activado correctamente. Tu cuenta ahora es más segura.' })
  } catch (err) {
    console.error('[ERROR] verificar MFA:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/mfa/validar-login
// ============================================
// Se llama después del login cuando el usuario tiene MFA activo.
// Recibe el código y emite el token JWT final.
router.post('/validar-login', async (req, res) => {
  try {
    const { userId, codigo } = req.body

    if (!userId || !codigo) {
      return res.status(400).json({ error: 'Datos incompletos.' })
    }

    if (!/^\d{6}$/.test(codigo)) {
      return res.status(400).json({ error: 'El código debe ser de 6 dígitos.' })
    }

    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1 AND activo = true AND mfa_activo = true',
      [userId]
    )

    const usuario = resultado.rows[0]
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }

    const esValido = speakeasy.totp.verify({
      secret: usuario.mfa_secret,
      encoding: 'base32',
      token: codigo,
      window: 1
    })

    if (!esValido) {
      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [usuario.id, 'mfa_fallido', 'Código MFA incorrecto en login', req.ip]
      )
      return res.status(401).json({ error: 'Código incorrecto.' })
    }

    // Código válido — emitir token JWT final
    const { default: jwt } = await import('jsonwebtoken')
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h', issuer: 'medistock', audience: 'medistock-app' }
    )

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [usuario.id, 'login_mfa', 'Login con MFA exitoso', req.ip]
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

// ============================================
// POST /api/mfa/desactivar
// ============================================
router.post('/desactivar', verificarToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE usuarios SET mfa_activo = false, mfa_secret = null WHERE id = $1',
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

export default router