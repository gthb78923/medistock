// ============================================
// services/api.js — Conexión con el backend
// ============================================
// Axios es como fetch pero más cómodo.
// Aquí configuramos la URL base del backend y
// un interceptor que agrega automáticamente el
// token JWT a cada petición que hagamos.

import axios from 'axios'

// ── Instancia base de axios ───────────────────────────────
// Todas las peticiones usarán esta URL como base
const api = axios.create({
  baseURL: 'https://medistock-backend-dgyt.onrender.com/api',
  timeout: 10000, // si el servidor no responde en 10s, cancela
})

// ── Interceptor de peticiones ─────────────────────────────
// Antes de enviar CUALQUIER petición, este código se ejecuta.
// Toma el token del localStorage y lo agrega al header.
// Así no tienes que agregarlo manualmente en cada llamada.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Interceptor de respuestas ─────────────────────────────
// Mejorado con manejo detallado de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Error de red sin respuesta del servidor
    if (!error.response) {
      console.error('[RED] Sin respuesta del servidor:', error.message)
      return Promise.reject(error)
    }

    const status = error.response.status

    // Token expirado o inválido — cerrar sesión automáticamente
    if (status === 401) {
      const mensaje = error.response.data?.error || ''
      const esErrorDeAuth = mensaje.includes('Token') ||
        mensaje.includes('Sesión') ||
        mensaje.includes('expirad') ||
        mensaje.includes('Acceso denegado') ||
        mensaje.includes('token')

      if (esErrorDeAuth) {
        console.warn('[AUTH] Token inválido o expirado — cerrando sesión')
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        window.location.href = '/login'
      }
    }

    // Error 403 — acceso denegado, log en consola
    if (status === 403) {
      console.warn('[ACCESO] Intento de acceso a recurso no permitido')
    }

    // Error 500 — log en consola para debugging
    if (status >= 500) {
      console.error('[SERVIDOR] Error interno:', error.response.data)
    }

    return Promise.reject(error)
  }
)

export default api