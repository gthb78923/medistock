// ============================================
// routes/admin.routes.js — Panel de administrador
// ============================================
// Solo el admin puede acceder a estas rutas.
// Ver logs de auditoría y gestionar usuarios.

import { Router } from 'express'
import pool from '../db/db.js'
import { verificarToken, verificarRol } from '../middlewares/auth.js'

const router = Router()

// ============================================
// GET /api/admin/logs — Ver todos los logs
// ============================================
router.get('/logs', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT l.*, u.nombre AS usuario_nombre, u.email
       FROM logs l
       LEFT JOIN usuarios u ON l.usuario_id = u.id
       ORDER BY l.fecha DESC
       LIMIT 100` // limitamos a los últimos 100 eventos
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error('Error obteniendo logs:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// GET /api/admin/usuarios — Ver todos los usuarios
// ============================================
router.get('/usuarios', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const resultado = await pool.query(
      // Nunca devolvemos password_hash en esta consulta
      `SELECT id, nombre, email, rol, activo, creado_en
       FROM usuarios
       ORDER BY creado_en DESC`
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error('Error obteniendo usuarios:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// PUT /api/admin/usuarios/:id/desactivar — Desactivar usuario
// ============================================
// En lugar de borrar usuarios (lo cual rompe historial),
// los desactivamos. Un usuario desactivado no puede hacer login.
router.put('/:id/desactivar', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const { id } = req.params

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' })
    }

    // ── Evitar que el admin se desactive a sí mismo ────────
    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta.' })
    }

    const resultado = await pool.query(
      `UPDATE usuarios SET activo=false WHERE id=$1 RETURNING id, nombre, email`,
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }

    await pool.query(
      `INSERT INTO logs (usuario_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4)`,
      [req.usuario.id, 'desactivar_usuario', `Usuario desactivado: ID ${id}`, req.ip]
    )

    res.json({ mensaje: 'Usuario desactivado correctamente.' })
  } catch (err) {
    console.error('Error desactivando usuario:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// GET /api/admin/pacientes — Lista de pacientes
// ============================================
// El doctor necesita ver los pacientes para crear expedientes.
// Solo devuelve usuarios con rol paciente, sin datos sensibles.
router.get('/pacientes', verificarToken, verificarRol('admin', 'doctor'), async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nombre, email 
       FROM usuarios 
       WHERE rol = 'paciente' AND activo = true
       ORDER BY nombre ASC`
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error('Error obteniendo pacientes:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})
export default router