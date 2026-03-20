// ============================================
// pages/MFA.jsx — Configurar MFA por correo
// ============================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Boton from '../components/Boton'
import Logo from '../components/Logo'

function MFA() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [activado, setActivado] = useState(false)
  const [error, setError] = useState('')

  const handleActivar = async () => {
    setCargando(true)
    try {
      await api.post('/mfa/activar')
      setActivado(true)
      setTimeout(() => navigate('/'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al activar MFA.')
    } finally {
      setCargando(false)
    }
  }

  const handleDesactivar = async () => {
    setCargando(true)
    try {
      await api.post('/mfa/desactivar')
      setActivado(false)
      setError('')
      alert('MFA desactivado correctamente.')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al desactivar.')
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
          <p className="text-gray-400">Autenticación de dos factores</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">

          {activado ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-white text-xl font-bold mb-2">MFA activado</h2>
              <p className="text-gray-400 text-sm">
                Desde ahora cada vez que inicies sesión recibirás un código de verificación en tu correo <strong className="text-white">{usuario?.email}</strong>.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-white text-xl font-bold mb-2">Autenticación de dos factores</h2>
              <p className="text-gray-400 text-sm mb-6">
                Activa el MFA para proteger tu cuenta. Cada vez que inicies sesión recibirás un código de 6 dígitos en tu correo que deberás ingresar para completar el acceso.
              </p>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm font-medium mb-1">¿Cómo funciona?</p>
                <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
                  <li>Ingresas tu email y contraseña normalmente</li>
                  <li>El sistema envía un código de 6 dígitos a tu correo</li>
                  <li>Ingresas el código para completar el login</li>
                  <li>El código expira en 5 minutos y es de un solo uso</li>
                </ol>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 mb-6">
                <p className="text-gray-400 text-sm">
                  Tu correo: <strong className="text-white">{usuario?.email}</strong>
                </p>
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <div className="flex flex-col gap-3">
                <Boton onClick={handleActivar} cargando={cargando}>
                  Activar MFA en mi cuenta
                </Boton>
                <Boton variante="peligro" onClick={handleDesactivar} cargando={cargando}>
                  Desactivar MFA
                </Boton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MFA