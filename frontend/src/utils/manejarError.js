// ============================================
// utils/manejarError.js
// ============================================
// Centraliza cómo el frontend maneja los errores
// de las peticiones al backend.
//
// Esto evita que cada componente tenga su propia
// lógica de manejo de errores inconsistente.

export const manejarError = (err) => {
  // Error de red — el servidor no responde
  if (!err.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión.'
  }

  const status = err.response.status
  const mensaje = err.response.data?.error

  switch (status) {
    case 400:
      return mensaje || 'Datos inválidos. Revisa el formulario.'
    case 401:
      return mensaje || 'No autorizado. Inicia sesión nuevamente.'
    case 403:
      return mensaje || 'No tienes permisos para esta acción.'
    case 404:
      return mensaje || 'Recurso no encontrado.'
    case 409:
      return mensaje || 'Este registro ya existe.'
    case 429:
      return mensaje || 'Demasiadas peticiones. Espera un momento.'
    case 500:
      return 'Error interno del servidor. Intenta más tarde.'
    default:
      return mensaje || 'Ocurrió un error inesperado.'
  }
}