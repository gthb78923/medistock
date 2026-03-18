// ============================================
// pages/auth/Registro.jsx — Solo para pacientes
// ============================================
// Los doctores y admins NO se auto-registran.
// Solo el admin puede crearlos desde su panel interno.
// Esto es principio de mínimo privilegio del PDF.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Input from '../../components/Input'
import Boton from '../../components/Boton'
import Logo from '../../components/Logo'
import { validarEmail, validarPassword, validarNombre } from '../../utils/validaciones'
import { manejarError } from '../../utils/manejarError'  // ← NUEVO IMPORT AGREGADO

function Registro() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [exitoso, setExitoso] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleChange = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value })
    setErrores({ ...errores, [campo]: null })
    setErrorGeneral('')
  }

  const validar = () => {
    const nuevosErrores = {
      nombre: validarNombre(form.nombre),
      email: validarEmail(form.email),
      password: validarPassword(form.password),
      confirmarPassword: form.password !== form.confirmarPassword
        ? 'Las contraseñas no coinciden.' : null,
    }
    setErrores(nuevosErrores)
    return !Object.values(nuevosErrores).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return

    setCargando(true)
    try {
      // El rol siempre es paciente, no viene del formulario
      // Un usuario externo NUNCA puede asignarse rol de admin o doctor
      await api.post('/auth/registro', {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: 'paciente'
      })

      setExitoso(true)
      setTimeout(() => navigate('/login'), 2000)

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

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Crear cuenta</h2>
          <p className="text-gray-500 text-sm mb-6">Registro disponible para pacientes. El personal médico es registrado por el administrador.</p>

          {exitoso && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-4">
              <p className="text-green-400 text-sm">✅ Cuenta creada. Redirigiendo al login...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nombre completo"
              value={form.nombre}
              onChange={handleChange('nombre')}
              error={errores.nombre}
              placeholder="Juan Pérez"
            />
            <Input
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              error={errores.email}
              placeholder="juan@email.com"
            />
            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              error={errores.password}
              placeholder="••••••••"
            />

            {/* Indicador de fortaleza de contraseña - ACTUALIZADO */}
            {form.password && (
              <div className="flex flex-col gap-1 bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">La contraseña debe tener:</p>
                {[
                  { texto: 'Mínimo 8 caracteres', ok: form.password.length >= 8 },
                  { texto: 'Una mayúscula', ok: /[A-Z]/.test(form.password) },
                  { texto: 'Una minúscula', ok: /[a-z]/.test(form.password) },
                  { texto: 'Un número', ok: /\d/.test(form.password) },
                  { texto: 'Un carácter especial (!@#$...)', ok: /[!@#$%^&*(),.?":{}|<>]/.test(form.password) },
                ].map(({ texto, ok }) => (
                  <span key={texto} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-400' : 'text-gray-500'}`}>
                    {ok ? '✓' : '○'} {texto}
                  </span>
                ))}
              </div>
            )}

            <Input
              label="Confirmar contraseña"
              type="password"
              value={form.confirmarPassword}
              onChange={handleChange('confirmarPassword')}
              error={errores.confirmarPassword}
              placeholder="••••••••"
            />

            {errorGeneral && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{errorGeneral}</p>
              </div>
            )}

            <Boton type="submit" cargando={cargando}>Crear cuenta</Boton>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Registro