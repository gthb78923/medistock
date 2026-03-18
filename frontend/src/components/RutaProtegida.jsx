// ============================================
// components/RutaProtegida.jsx — Guardia de rutas
// ============================================
// Si alguien intenta entrar a /admin sin ser admin,
// este componente lo redirige automáticamente.
// Es la defensa en profundidad del frontend.

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario, cargando } = useAuth()

  // Mientras verifica si hay sesión guardada, no muestra nada
  if (cargando) return null

  // Si no hay usuario logueado, manda al login
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  // Si el rol del usuario no está en los roles permitidos, manda al dashboard
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  // Si todo está bien, muestra la página
  return children
}

export default RutaProtegida