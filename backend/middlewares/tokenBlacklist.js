// ============================================
// middlewares/tokenBlacklist.js
// ============================================
// Cuando un usuario hace logout, su token se agrega
// a esta lista negra. Aunque el token sea válido,
// si está en la blacklist se rechaza.
//
// En producción esto viviría en Redis para persistir
// entre reinicios del servidor. Para este proyecto
// usamos un Map en memoria que funciona perfectamente.

const blacklist = new Map()

// ── Agregar token a la blacklist ──────────────────────────
export const invalidarToken = (token, expiracion) => {
  // Solo guardamos el token hasta que expire naturalmente
  // Así la blacklist no crece infinitamente
  const ahora = Date.now()
  const expiraEn = (expiracion * 1000) - ahora

  if (expiraEn > 0) {
    blacklist.set(token, true)
    // Se elimina automáticamente cuando expira el token
    setTimeout(() => blacklist.delete(token), expiraEn)
  }
}

// ── Verificar si un token está en la blacklist ────────────
export const estaInvalidado = (token) => {
  return blacklist.has(token)
}