// ============================================
// pages/auth/Login.jsx — Página de inicio de sesión
// ============================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Input from '../../components/Input'
import Boton from '../../components/Boton'
import Logo from '../../components/Logo'
import { validarEmail, validarPassword } from '../../utils/validaciones'
import { manejarError } from '../../utils/manejarError'  // ← NUEVO IMPORT AGREGADO

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // ── Estado del formulario ──────────────────────────────
  const [form, setForm] = useState({ email: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [cargando, setCargando] = useState(false)

  // ── Actualizar campo del formulario ───────────────────
  const handleChange = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value })
    // Borra el error del campo cuando el usuario empieza a escribir
    setErrores({ ...errores, [campo]: null })
    setErrorGeneral('')
  }

  // ── Validar antes de enviar ────────────────────────────
  const validar = () => {
    const nuevosErrores = {
      email: validarEmail(form.email),
      password: validarPassword(form.password),
    }
    setErrores(nuevosErrores)
    // Retorna true si no hay ningún error
    return !Object.values(nuevosErrores).some(Boolean)
  }

  // ── Enviar formulario ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return

    setCargando(true)
    try {
      const respuesta = await api.post('/auth/login', form)

      // Si el usuario tiene MFA activo, redirigir a validación
      if (respuesta.data.mfa_requerido) {
        navigate('/auth/mfa', { state: { userId: respuesta.data.userId } })
        return
      }

      const { token, usuario } = respuesta.data

      // Guarda sesión y redirige según el rol
      login(token, usuario)

      if (usuario.rol === 'admin') navigate('/admin')
      else if (usuario.rol === 'doctor') navigate('/doctor')
      else navigate('/paciente')

    } catch (err) {
      // Usa el manejador de errores centralizado
      setErrorGeneral(manejarError(err))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Logo y título ──────────────────────────── */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <p className="text-gray-400 mt-1">Sistema de gestión clínica</p>
        </div>

        {/* ── Tarjeta del formulario ─────────────────── */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <Input
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              error={errores.email}
              placeholder="doctor@clinica.com"
            />

            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              error={errores.password}
              placeholder="••••••••"
            />

            {/* Error general del servidor */}
            {errorGeneral && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{errorGeneral}</p>
              </div>
            )}

            <Boton type="submit" cargando={cargando}>
              Iniciar sesión
            </Boton>

          </form>

          {/* ── Link a registro ────────────────────────── */}
          <p className="text-center text-gray-500 text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-blue-400 hover:text-blue-300 font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Login