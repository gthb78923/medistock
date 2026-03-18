// ============================================
// pages/auth/ValidarMFA.jsx
// ============================================
// Segunda pantalla del login cuando el usuario tiene MFA activo.
// El usuario ingresa el código de su app para completar el login.

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Boton from '../../components/Boton'
import Logo from '../../components/Logo'

function ValidarMFA() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // El userId viene del primer paso del login
  const userId = location.state?.userId

  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // Si no hay userId, redirigir al login
  if (!userId) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(codigo)) {
      setError('El código debe ser de 6 dígitos.')
      return
    }
    setCargando(true)
    setError('')
    try {
      const res = await api.post('/mfa/validar-login', { userId, codigo })
      login(res.data.token, res.data.usuario)

      const rol = res.data.usuario.rol
      if (rol === 'admin') navigate('/admin')
      else if (rol === 'doctor') navigate('/doctor')
      else navigate('/paciente')

    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <p className="text-gray-400">Verificación de dos factores</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-white text-xl font-bold mb-2">Código de verificación</h2>
            <p className="text-gray-400 text-sm">
              Abre tu app de autenticación e ingresa el código de 6 dígitos que aparece para MediStock.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              maxLength={6}
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.replace(/\D/g, ''))
                setError('')
              }}
              placeholder="000000"
              className="text-center text-3xl tracking-widest px-4 py-4 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <Boton type="submit" cargando={cargando}>
              Verificar código
            </Boton>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-gray-500 hover:text-gray-300 text-sm text-center transition-all"
            >
              ← Volver al login
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ValidarMFA