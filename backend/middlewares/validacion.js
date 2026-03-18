// ============================================
// middlewares/validacion.js
// ============================================
// Este archivo centraliza TODAS las validaciones
// y sanitizaciones de entradas del sistema.
//
// La diferencia entre validar y sanitizar:
// - VALIDAR: verificar que el dato cumple las reglas
// - SANITIZAR: limpiar el dato para que no pueda hacer daño
//
// Ambas cosas se hacen SIEMPRE en el backend,
// independientemente de lo que haga el frontend.

import { body, param, validationResult } from 'express-validator'
import xss from 'xss'

// ============================================
// MIDDLEWARE EJECUTOR DE VALIDACIONES
// ============================================
// Este middleware se pone AL FINAL de cada cadena
// de validaciones. Si hay errores, responde con 400
// y lista los errores. Si no hay errores, deja pasar.
export const validar = (req, res, next) => {
  const errores = validationResult(req)
  if (!errores.isEmpty()) {
    // Registramos el intento fallido en consola (log interno)
    console.warn(`[VALIDACION FALLIDA] ${req.method} ${req.path} — IP: ${req.ip}`, errores.array())
    return res.status(400).json({
      // El usuario ve un mensaje limpio, no los detalles internos
      error: 'Datos de entrada inválidos.',
      detalles: errores.array().map(e => ({
        campo: e.path,
        mensaje: e.msg
      }))
    })
  }
  next()
}

// ============================================
// SANITIZADOR XSS GLOBAL
// ============================================
// Limpia TODOS los strings del body antes de que
// lleguen a cualquier ruta. Previene inyección de
// HTML y JavaScript malicioso en cualquier campo.
export const sanitizarXSS = (req, res, next) => {
  const limpiar = (obj) => {
    if (!obj) return obj
    const resultado = {}
    for (const key of Object.keys(obj)) {
      const valor = obj[key]
      if (typeof valor === 'string') {
        // xss() elimina cualquier tag HTML o script del string
        resultado[key] = xss(valor.trim())
      } else if (typeof valor === 'object' && !Array.isArray(valor)) {
        resultado[key] = limpiar(valor)
      } else {
        resultado[key] = valor
      }
    }
    return resultado
  }

  req.body = limpiar(req.body)
  next()
}

// ============================================
// REGLAS DE VALIDACIÓN POR ENTIDAD
// ============================================

// ── Registro de usuario ────────────────────────────────────
export const reglasRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.')
    // Solo letras, espacios y puntos — previene inyección en nombre
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.]+$/).withMessage('El nombre solo puede contener letras.'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido.')
    .isEmail().withMessage('Formato de email inválido.')
    .normalizeEmail() // convierte a minúsculas y elimina caracteres raros
    .isLength({ max: 150 }).withMessage('El email es demasiado largo.'),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida.')
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres.')
    .isLength({ max: 64 }).withMessage('La contraseña no puede exceder 64 caracteres.')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula.')
    .matches(/[a-z]/).withMessage('Debe contener al menos una minúscula.')
    .matches(/\d/).withMessage('Debe contener al menos un número.')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Debe contener al menos un carácter especial (!@#$%...).'),

  body('rol')
    .notEmpty().withMessage('El rol es requerido.')
    // Solo valores permitidos exactos — previene escalada de privilegios
    .isIn(['admin', 'doctor', 'paciente']).withMessage('Rol no válido.'),
]

// ── Login ──────────────────────────────────────────────────
export const reglasLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido.')
    .isEmail().withMessage('Formato de email inválido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida.')
    .isLength({ max: 64 }).withMessage('Contraseña inválida.'),
]

// ── Insumos ────────────────────────────────────────────────
export const reglasInsumo = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido.')
    .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres.'),

  body('categoria')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La categoría no puede exceder 100 caracteres.'),

  body('cantidad_actual')
    .notEmpty().withMessage('La cantidad actual es requerida.')
    .isInt({ min: 0 }).withMessage('La cantidad actual debe ser un número entero positivo.'),

  body('cantidad_minima')
    .notEmpty().withMessage('La cantidad mínima es requerida.')
    .isInt({ min: 0 }).withMessage('La cantidad mínima debe ser un número entero positivo.'),

  body('unidad')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La unidad no puede exceder 50 caracteres.'),
]

// ── Movimiento de insumo ───────────────────────────────────
export const reglasMovimiento = [
  body('tipo')
    .notEmpty().withMessage('El tipo es requerido.')
    .isIn(['entrada', 'salida']).withMessage('Tipo debe ser entrada o salida.'),

  body('cantidad')
    .notEmpty().withMessage('La cantidad es requerida.')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero mayor a 0.'),

  body('motivo')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('El motivo no puede exceder 255 caracteres.'),
]

// ── Expediente ─────────────────────────────────────────────
export const reglasExpediente = [
  body('paciente_id')
    .notEmpty().withMessage('El paciente es requerido.')
    .isInt({ min: 1 }).withMessage('ID de paciente inválido.'),

  body('diagnostico')
    .trim()
    .notEmpty().withMessage('El diagnóstico es requerido.')
    .isLength({ min: 3, max: 1000 }).withMessage('El diagnóstico debe tener entre 3 y 1000 caracteres.'),

  body('medicamentos')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Los medicamentos no pueden exceder 1000 caracteres.'),

  body('notas')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Las notas no pueden exceder 2000 caracteres.'),
]

// ── Cita ───────────────────────────────────────────────────
export const reglasCita = [
  body('doctor_id')
    .notEmpty().withMessage('El doctor es requerido.')
    .isInt({ min: 1 }).withMessage('ID de doctor inválido.'),

  body('fecha')
    .notEmpty().withMessage('La fecha es requerida.')
    .isDate().withMessage('Formato de fecha inválido.')
    .custom((valor) => {
      const fecha = new Date(valor)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      if (fecha < hoy) throw new Error('La fecha no puede ser en el pasado.')
      return true
    }),

  body('hora')
    .notEmpty().withMessage('La hora es requerida.')
    // Formato HH:MM
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato de hora inválido (HH:MM).'),

  body('motivo')
    .trim()
    .notEmpty().withMessage('El motivo es requerido.')
    .isLength({ min: 3, max: 255 }).withMessage('El motivo debe tener entre 3 y 255 caracteres.'),
]

// ── Parámetro ID en URL ────────────────────────────────────
// Valida que el :id en la URL sea un número real
// Previene ataques por manipulación de parámetros
export const validarId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido.'),
]