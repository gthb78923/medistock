// ============================================
// routes/insumos.routes.js — Gestión de inventario
// ============================================
// Aquí viven todas las operaciones del inventario médico.
// Admin puede hacer todo. Doctor y paciente solo pueden ver.

import { Router } from 'express'
import pool from '../db/db.js'
import { verificarToken, verificarRol } from '../middlewares/auth.js'
// ── IMPORTAR VALIDACIONES ─────────────────────────────────
import {
  reglasInsumo,
  reglasMovimiento,
  validarId,
  validar
} from '../middlewares/validacion.js'

const router = Router()

// ============================================
// GET /api/insumos — Ver todos los insumos
// ============================================
// Acceso: admin y doctor
// NOTA: Esta ruta NO necesita validación porque solo es lectura
router.get('/', verificarToken, verificarRol('admin', 'doctor'), async (req, res) => {
  try {
    const resultado = await pool.query(
      // Trae todos los insumos ordenados por nombre
      // Marca con alerta_stock si la cantidad está por debajo del mínimo
      `SELECT *, 
        CASE WHEN cantidad_actual <= cantidad_minima 
        THEN true ELSE false END AS alerta_stock
       FROM insumos 
       ORDER BY nombre ASC`
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error('Error obteniendo insumos:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ============================================
// POST /api/insumos — Crear nuevo insumo
// ============================================
// Acceso: solo admin
router.post('/', 
  verificarToken, 
  verificarRol('admin'), 
  reglasInsumo,           // ← VALIDACIÓN AGREGADA
  validar,                // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { nombre, categoria, cantidad_actual, cantidad_minima, unidad } = req.body

      // Ya no necesitamos las validaciones manuales porque las hace reglasInsumo + validar
      // Pero mantenemos la lógica de negocio

      const resultado = await pool.query(
        `INSERT INTO insumos (nombre, categoria, cantidad_actual, cantidad_minima, unidad)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [nombre, categoria, cantidad_actual, cantidad_minima, unidad]
      )

      // ── Log de auditoría ───────────────────────────────────
      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'crear_insumo', `Insumo creado: ${nombre}`, req.ip]
      )

      res.status(201).json(resultado.rows[0])
    } catch (err) {
      console.error('Error creando insumo:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

// ============================================
// PUT /api/insumos/:id — Editar insumo
// ============================================
// Acceso: solo admin
router.put('/:id', 
  verificarToken, 
  verificarRol('admin'), 
  validarId,              // ← VALIDACIÓN AGREGADA (para el :id)
  reglasInsumo,           // ← VALIDACIÓN AGREGADA
  validar,                // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { id } = req.params
      const { nombre, categoria, cantidad_actual, cantidad_minima, unidad } = req.body

      // Ya no necesitamos el isNaN(id) porque validarId ya lo hace

      const resultado = await pool.query(
        `UPDATE insumos 
         SET nombre=$1, categoria=$2, cantidad_actual=$3, cantidad_minima=$4, unidad=$5
         WHERE id=$6
         RETURNING *`,
        [nombre, categoria, cantidad_actual, cantidad_minima, unidad, id]
      )

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Insumo no encontrado.' })
      }

      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'editar_insumo', `Insumo editado: ID ${id}`, req.ip]
      )

      res.json(resultado.rows[0])
    } catch (err) {
      console.error('Error editando insumo:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

// ============================================
// DELETE /api/insumos/:id — Eliminar insumo
// ============================================
// Acceso: solo admin
router.delete('/:id', 
  verificarToken, 
  verificarRol('admin'), 
  validarId,              // ← VALIDACIÓN AGREGADA (para el :id)
  validar,                // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { id } = req.params

      // Ya no necesitamos el isNaN(id) porque validarId ya lo hace

      const resultado = await pool.query(
        'DELETE FROM insumos WHERE id=$1 RETURNING *',
        [id]
      )

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Insumo no encontrado.' })
      }

      await pool.query(
        `INSERT INTO logs (usuario_id, accion, detalle, ip)
         VALUES ($1, $2, $3, $4)`,
        [req.usuario.id, 'eliminar_insumo', `Insumo eliminado: ID ${id}`, req.ip]
      )

      res.json({ mensaje: 'Insumo eliminado correctamente.' })
    } catch (err) {
      console.error('Error eliminando insumo:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

// ============================================
// POST /api/insumos/:id/movimiento — Registrar entrada o salida
// ============================================
// Acceso: admin y doctor
// El doctor puede registrar que usó insumos en una consulta
router.post('/:id/movimiento', 
  verificarToken, 
  verificarRol('admin', 'doctor'), 
  validarId,              // ← VALIDACIÓN AGREGADA (para el :id)
  reglasMovimiento,       // ← VALIDACIÓN AGREGADA
  validar,                // ← VALIDACIÓN AGREGADA
  async (req, res) => {
    try {
      const { id } = req.params
      const { tipo, cantidad, motivo } = req.body

      // Ya no necesitamos las validaciones manuales porque las hace reglasMovimiento + validar

      // ── Verificar que el insumo existe y tiene stock suficiente ──
      const insumo = await pool.query('SELECT * FROM insumos WHERE id=$1', [id])
      if (insumo.rows.length === 0) {
        return res.status(404).json({ error: 'Insumo no encontrado.' })
      }

      if (tipo === 'salida' && insumo.rows[0].cantidad_actual < cantidad) {
        return res.status(400).json({ error: 'Stock insuficiente para registrar esta salida.' })
      }

      // ── Actualizar cantidad del insumo ─────────────────────
      const operacion = tipo === 'entrada' ? '+' : '-'
      await pool.query(
        `UPDATE insumos SET cantidad_actual = cantidad_actual ${operacion} $1 WHERE id=$2`,
        [cantidad, id]
      )

      // ── Registrar el movimiento ────────────────────────────
      await pool.query(
        `INSERT INTO movimientos (insumo_id, usuario_id, tipo, cantidad, motivo)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, req.usuario.id, tipo, cantidad, motivo]
      )

      res.json({ mensaje: `Movimiento de ${tipo} registrado correctamente.` })
    } catch (err) {
      console.error('Error registrando movimiento:', err.message)
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
})

export default router