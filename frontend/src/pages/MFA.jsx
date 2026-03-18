// ============================================
// pages/MFA.jsx — Configurar autenticación de dos factores
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
  const [paso, setPaso] = useState(1)
  const [qr, setQr] = useState('')
  const [secreto, setSecreto] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [exitoso, setExitoso] = useState(false)

  const handleConfigurar = async () => {
    setCargando(true)
    try {
      const res = await api.post('/mfa/configurar')
      setQr(res.data.qr)
      setSecreto(res.data.secreto)
      setPaso(2)
    } catch (err) {
      setError('Error al generar el QR.')
    } finally {
      setCargando(false)
    }
  }

  const handleVerificar = async () => {
    if (!/^\d{6}$/.test(codigo)) {
      setError('El código debe ser de 6 dígitos.')
      return
    }
    setCargando(true)
    setError('')
    try {
      await api.post('/mfa/verificar', { codigo })
      setExitoso(true)
      setTimeout(() => navigate('/'), 3000)
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
          <p className="text-gray-400">Autenticación de dos factores</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">

          {exitoso ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-white text-xl font-bold mb-2">MFA activado</h2>
              <p className="text-gray-400 text-sm">Tu cuenta ahora tiene doble factor de autenticación. Redirigiendo...</p>
            </div>
          ) : paso === 1 ? (
            <div>
              <h2 className="text-white text-xl font-bold mb-2">Configurar MFA</h2>
              <p className="text-gray-400 text-sm mb-6">
                El MFA agrega una capa extra de seguridad. Además de tu contraseña, necesitarás un código de 6 dígitos de tu app de autenticación cada vez que inicies sesión.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm font-medium mb-2">¿Qué app necesitas?</p>
                <p className="text-gray-400 text-sm">Descarga <strong className="text-white">Google Authenticator</strong> o <strong className="text-white">Authy</strong> en tu celular antes de continuar.</p>
              </div>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <Boton onClick={handleConfigurar} cargando={cargando}>
                Generar código QR
              </Boton>
            </div>
          ) : (
            <div>
              <h2 className="text-white text-xl font-bold mb-2">Escanea el código QR</h2>
              <p className="text-gray-400 text-sm mb-6">
                Abre Google Authenticator o Authy y escanea este código. Luego ingresa el código de 6 dígitos que aparece.
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl">
                  <img src={qr} alt="QR MFA" className="w-48 h-48" />
                </div>
              </div>

              {/* Clave manual por si no pueden escanear */}
              <div className="bg-gray-800 rounded-lg p-3 mb-6 text-center">
                <p className="text-gray-500 text-xs mb-1">¿No puedes escanear? Ingresa esta clave manualmente:</p>
                <p className="text-white text-sm font-mono tracking-widest">{secreto}</p>
              </div>

              {/* Input del código */}
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.replace(/\D/g, ''))
                    setError('')
                  }}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <Boton onClick={handleVerificar} cargando={cargando}>
                  Verificar y activar MFA
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