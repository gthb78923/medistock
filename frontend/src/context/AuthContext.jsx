// ============================================
// context/AuthContext.jsx — Estado global de autenticación
// ============================================
// React Context permite compartir datos entre componentes
// sin tener que pasarlos de padre a hijo manualmente.
// Aquí guardamos quién está logueado y su rol.

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'  // ← IMPORT AGREGADO

const AuthContext = createContext()

// ── AuthProvider ──────────────────────────────────────────
// Envuelve toda la app. Cualquier componente dentro puede
// acceder al usuario actual con useAuth()
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Al cargar la app, revisa si hay sesión guardada en localStorage
    // Esto hace que si refrescas la página no pierdas la sesión
    const token = localStorage.getItem('token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (token && usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado))
    }
    setCargando(false)
  }, [])

  // ── login ──────────────────────────────────────────────
  // Guarda el token y usuario en localStorage y en el estado
  const login = (token, datosUsuario) => {
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(datosUsuario))
    setUsuario(datosUsuario)
  }

  // ── logout ─────────────────────────────────────────────
  // Llama al backend para invalidar el token antes de borrar
  const logout = async () => {
    try {
      // Invalida el token en el servidor
      await api.post('/auth/logout')
    } catch (err) {
      // Si falla la llamada igual limpiamos localmente
      console.error('Error en logout:', err)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      setUsuario(null)
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── useAuth ───────────────────────────────────────────────
// Hook personalizado para usar el contexto fácilmente
// Uso: const { usuario, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}