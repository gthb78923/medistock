// ============================================
// routes/expedientes.routes.js — Expedientes médicos
// ============================================
// El doctor crea y consulta expedientes de sus pacientes.
// El paciente solo puede ver su propio expediente.
// El admin puede ver todo.

import { Router } from 'express'
import pool from '../db/db.js'
import { verificarToken, verificarRol } from '../middlewares/auth.js'
// ── IMPORTAR VALIDACIONES ─────────────────────────────────
import {
  reglasExpediente,
  validarId,
  validar
} from '../middlewares/validacion.js'

const router = Router()

// ============================================
// GET /api/expedientes — Ver expedientes
// ============================================
// NOTA: Esta ruta NO necesita validación porque solo es lectura
router.get('/', verificarToken, async (req, res) => {
  try {
    let resultado

    if (req.usuario.rol === 'admin') {
      // Admin ve todos los expedientes
      resultado = await pool.query(
        `SELECT e.*, 
          p.nombre AS paciente_nombre, 
          d.nombre AS doctor_nombre
         FROM expedientes e
         JOIN usuarios p ON e.paciente_id = p.id
         JOIN usuarios d ON e.doctor_id = d.id
         ORDER BY e.fecha DESC`
      )
    } else if (req.usuario.rol === 'doctor') {
      // Doctor solo ve los expedientes que él creó
      resultado = await pool.query(
        `SELECT e.*, p.nombre AS paciente_nombre
         FROM expedientes e
         JOIN usuarios p ON e.paciente_id = p.id
         WHERE e.doctor_id = $1
         ORDER BY e.fecha DESC`,
        [req.usuario.id]
      )
    } else {
      // Paciente solo ve su propio expediente
      // SEGURIDAD: usamos req.usuario.id del token, no un parámetro
      // que el usuario pudiera manipular en la URL
      resultado = await pool.query(
        `SELECT e.*, d.nombre AS doctor_nombre
         FROM expedientes e
         JOIN usuarios d ON e.doctor_id = d.id
         WHERE e.paciente_id = $1
         ORDER BY e.fecha DESC`,
        [req.usuario.id]
      )
    }

    res.json(resultado.rows)
  } catch (err) {
    console.error('Error obteniendo expedientes:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/expedientes — Crear expediente
// ============================================
// Acceso: solo admin y doctor
router.post('/', 
  verificarToken, 
  verificarRol('admin', 'doctor'), 
  reglasExpediente,        // ← VALIDACIÓN AGREGADA
  validar,                 // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { paciente_id, diagnostico, medicamentos, notas } = req.body

      // Ya no necesitamos las validaciones manuales porque las hace reglasExpediente + validar
      // Pero mantenemos la lógica de negocio

      // ── Verificar que el paciente_id existe y es realmente un paciente ──
      const paciente = await pool.query(
        'SELECT id FROM usuarios WHERE id=$1 AND rol=$2',
        [paciente_id, 'paciente']
      )
      if (paciente.rows.length === 0) {
        return res.status(404).json({ error: 'Paciente no encontrado.' })
      }

      const resultado = await pool.query(
        `INSERT INTO expedientes (paciente_id, doctor_id, diagnostico, medicamentos, notas)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [paciente_id, req.usuario.id, diagnostico, medicamentos, notas]
      )

      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'crear_expediente', `Expediente creado para paciente ID: ${paciente_id}`, req.ip]
      )

      res.status(201).json(resultado.rows[0])
    } catch (err) {
      console.error('Error creando expediente:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

// ============================================
// PUT /api/expedientes/:id — Editar expediente
// ============================================
// Acceso: admin y doctor
router.put('/:id', 
  verificarToken, 
  verificarRol('admin', 'doctor'), 
  validarId,               // ← VALIDACIÓN AGREGADA (para el :id)
  validar,                 // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { id } = req.params
      const { diagnostico, medicamentos, notas } = req.body

      // Ya no necesitamos el isNaN(id) porque validarId ya lo hace
      // Ya no necesitamos validar diagnóstico porque validarId + validar ya cubren

      const resultado = await pool.query(
        `UPDATE expedientes 
         SET diagnostico=$1, medicamentos=$2, notas=$3
         WHERE id=$4
         RETURNING *`,
        [diagnostico, medicamentos, notas, id]
      )

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Expediente no encontrado.' })
      }

      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'editar_expediente', `Expediente editado: ID ${id}`, req.ip]
      )

      res.json(resultado.rows[0])
    } catch (err) {
      console.error('Error editando expediente:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

export default router