// ============================================
// utils/validaciones.js — Validaciones del frontend
// ============================================
// IMPORTANTE: estas validaciones son para UX (experiencia de usuario),
// no son la seguridad real. La seguridad real está en el backend.
// El frontend valida para dar feedback rápido al usuario,
// pero el backend valida de nuevo por si alguien saltó el frontend.

export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'El email es requerido.'
  if (!regex.test(email)) return 'Formato de email inválido.'
  return null // null significa sin error
}

export const validarPassword = (password) => {
  if (!password) return 'La contraseña es requerida.'
  if (password.length < 8) return 'Mínimo 8 caracteres.'
  if (password.length > 64) return 'Máximo 64 caracteres.'
  if (!/[A-Z]/.test(password)) return 'Debe tener al menos una mayúscula.'
  if (!/[a-z]/.test(password)) return 'Debe tener al menos una minúscula.'
  if (!/\d/.test(password)) return 'Debe tener al menos un número.'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Debe tener al menos un carácter especial.'
  return null
}

export const validarNombre = (nombre) => {
  if (!nombre) return 'El nombre es requerido.'
  if (nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.'
  // Sanitización básica: no permite caracteres extraños en nombres
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.]+$/.test(nombre)) return 'El nombre solo puede contener letras.'
  return null
}