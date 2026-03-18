// ============================================
// routes/citas.routes.js — Sistema de citas
// ============================================
// Paciente solicita, doctor confirma o cancela.
// Admin ve todo.

import { Router } from 'express'
import pool from '../db/db.js'
import { verificarToken, verificarRol } from '../middlewares/auth.js'
// ── IMPORTAR VALIDACIONES ─────────────────────────────────
import {
  reglasCita,
  validarId,
  validar
} from '../middlewares/validacion.js'

const router = Router()

// ============================================
// GET /api/citas — Ver citas según rol
// ============================================
// NOTA: Esta ruta NO necesita validación porque solo es lectura
router.get('/', verificarToken, async (req, res) => {
  try {
    let resultado

    if (req.usuario.rol === 'admin') {
      // Admin ve todas las citas
      resultado = await pool.query(
        `SELECT c.*,
          p.nombre AS paciente_nombre,
          d.nombre AS doctor_nombre
         FROM citas c
         JOIN usuarios p ON c.paciente_id = p.id
         JOIN usuarios d ON c.doctor_id = d.id
         ORDER BY c.fecha ASC, c.hora ASC`
      )
    } else if (req.usuario.rol === 'doctor') {
      // Doctor ve solo sus citas
      resultado = await pool.query(
        `SELECT c.*,
          p.nombre AS paciente_nombre,
          p.email AS paciente_email
         FROM citas c
         JOIN usuarios p ON c.paciente_id = p.id
         WHERE c.doctor_id = $1
         ORDER BY c.fecha ASC, c.hora ASC`,
        [req.usuario.id]
      )
    } else {
      // Paciente ve solo sus citas
      resultado = await pool.query(
        `SELECT c.*,
          d.nombre AS doctor_nombre
         FROM citas c
         JOIN usuarios d ON c.doctor_id = d.id
         WHERE c.paciente_id = $1
         ORDER BY c.fecha ASC, c.hora ASC`,
        [req.usuario.id]
      )
    }

    res.json(resultado.rows)
  } catch (err) {
    console.error('Error obteniendo citas:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/citas — Solicitar cita
// ============================================
// Solo pacientes pueden solicitar citas
router.post('/', 
  verificarToken, 
  verificarRol('paciente'), 
  reglasCita,              // ← VALIDACIÓN AGREGADA
  validar,                 // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { doctor_id, fecha, hora, motivo } = req.body

      // Ya no necesitamos las validaciones manuales básicas porque las hace reglasCita + validar
      // Pero mantenemos las validaciones de negocio específicas

      // Validar que la fecha no sea en el pasado
      const fechaCita = new Date(fecha)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      if (fechaCita < hoy) {
        return res.status(400).json({ error: 'La fecha no puede ser en el pasado.' })
      }

      // Verificar que el doctor existe y es realmente doctor
      const doctor = await pool.query(
        'SELECT id FROM usuarios WHERE id=$1 AND rol=$2 AND activo=true',
        [doctor_id, 'doctor']
      )
      if (doctor.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor no encontrado.' })
      }

      // Verificar que el doctor no tenga otra cita a esa hora
      const conflicto = await pool.query(
        `SELECT id FROM citas 
         WHERE doctor_id=$1 AND fecha=$2 AND hora=$3 
         AND estado != 'cancelada'`,
        [doctor_id, fecha, hora]
      )
      if (conflicto.rows.length > 0) {
        return res.status(409).json({ error: 'El doctor ya tiene una cita a esa hora.' })
      }

      const resultado = await pool.query(
        `INSERT INTO citas (paciente_id, doctor_id, fecha, hora, motivo)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.usuario.id, doctor_id, fecha, hora, motivo]
      )

      // Log de auditoría
      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'solicitar_cita', `Cita solicitada con doctor ID: ${doctor_id} para ${fecha} ${hora}`, req.ip]
      )

      res.status(201).json(resultado.rows[0])
    } catch (err) {
      console.error('Error creando cita:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

// ============================================
// PUT /api/citas/:id — Confirmar o cancelar cita
// ============================================
// Doctor y admin pueden cambiar el estado
router.put('/:id', 
  verificarToken, 
  verificarRol('doctor', 'admin'), 
  validarId,               // ← VALIDACIÓN AGREGADA (para el :id)
  validar,                 // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { id } = req.params
      const { estado, notas_doctor } = req.body

      // Ya no necesitamos el isNaN(id) porque validarId ya lo hace
      // Ya no necesitamos validar el estado manualmente porque validar lo cubre

      const resultado = await pool.query(
        `UPDATE citas 
         SET estado=$1, notas_doctor=$2
         WHERE id=$3
         RETURNING *`,
        [estado, notas_doctor, id]
      )

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Cita no encontrada.' })
      }

      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'actualizar_cita', `Cita ID ${id} marcada como: ${estado}`, req.ip]
      )

      res.json(resultado.rows[0])
    } catch (err) {
      console.error('Error actualizando cita:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

// ============================================
// DELETE /api/citas/:id — Cancelar cita (paciente)
// ============================================
// El paciente puede cancelar su propia cita
router.delete('/:id', 
  verificarToken, 
  verificarRol('paciente'), 
  validarId,               // ← VALIDACIÓN AGREGADA (para el :id)
  validar,                 // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { id } = req.params

      // Ya no necesitamos el isNaN(id) porque validarId ya lo hace

      // Verificar que la cita pertenece a este paciente
      const cita = await pool.query(
        'SELECT * FROM citas WHERE id=$1 AND paciente_id=$2',
        [id, req.usuario.id]
      )

      if (cita.rows.length === 0) {
        return res.status(404).json({ error: 'Cita no encontrada.' })
      }

      await pool.query(
        'UPDATE citas SET estado=$1 WHERE id=$2',
        ['cancelada', id]
      )

      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'cancelar_cita', `Cita ID ${id} cancelada por el paciente`, req.ip]
      )

      res.json({ mensaje: 'Cita cancelada correctamente.' })
    } catch (err) {
      console.error('Error cancelando cita:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

// ============================================
// GET /api/citas/doctores — Lista de doctores
// ============================================
// El paciente necesita ver los doctores disponibles
// para poder solicitar una cita.
// Solo devuelve nombre e id, nada sensible.
// NOTA: Esta ruta NO necesita validación porque solo es lectura
router.get('/doctores', verificarToken, verificarRol('paciente', 'admin', 'doctor'), async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nombre 
       FROM usuarios 
       WHERE rol = 'doctor' AND activo = true
       ORDER BY nombre ASC`
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error('Error obteniendo doctores:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

export default router