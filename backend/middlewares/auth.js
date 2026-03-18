// ============================================
// middlewares/auth.js
// ============================================
import jwt from 'jsonwebtoken'
import { estaInvalidado } from './tokenBlacklist.js'

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' })
  }

  // ── Verificar si el token fue invalidado (logout) ──────
  // Aunque el token sea criptográficamente válido,
  // si está en la blacklist se rechaza.
  if (estaInvalidado(token)) {
    return res.status(401).json({ error: 'Sesión cerrada. Inicia sesión nuevamente.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'medistock',
      audience: 'medistock-app'
    })
    req.usuario = decoded
    req.token = token // guardamos el token para poder invalidarlo en logout
    next()
  } catch (err) {
    // Distinguimos entre token expirado y token inválido
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' })
    }
    return res.status(403).json({ error: 'Token inválido.' })
  }
}

export const verificarRol = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      // Log interno del intento de acceso no autorizado
      console.warn(`[ACCESO DENEGADO] Usuario ${req.usuario.email} (${req.usuario.rol}) intentó acceder a ruta restringida: ${req.path}`)
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' })
    }
    next()
  }
}