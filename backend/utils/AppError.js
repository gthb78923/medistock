// ============================================
// utils/AppError.js — Errores controlados
// ============================================
// Distinguimos entre dos tipos de errores:
//
// 1. OPERACIONALES: esperados, causados por el usuario
//    Ejemplos: email ya registrado, contraseña incorrecta,
//    recurso no encontrado, permisos insuficientes.
//    → Se muestran al usuario con mensaje claro.
//
// 2. DE PROGRAMACIÓN: bugs o fallos inesperados
//    Ejemplos: error de base de datos, null pointer, etc.
//    → Solo van a logs internos. El usuario ve mensaje genérico.

export class AppError extends Error {
  constructor(mensaje, statusCode) {
    super(mensaje)
    this.statusCode = statusCode
    this.isOperacional = true // marca este error como esperado
    Error.captureStackTrace(this, this.constructor)
  }
}

// Errores comunes predefinidos para reutilizar en las rutas
export const Errores = {
  NO_AUTORIZADO: new AppError('Acceso denegado.', 401),
  NO_ENCONTRADO: (recurso) => new AppError(`${recurso} no encontrado.`, 404),
  YA_EXISTE: (campo) => new AppError(`${campo} ya está registrado.`, 409),
  DATOS_INVALIDOS: (msg) => new AppError(msg, 400),
  SIN_PERMISOS: new AppError('No tienes permisos para esta acción.', 403),
}