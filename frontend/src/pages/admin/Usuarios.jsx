import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../services/api'
import Input from '../../components/Input'
import Boton from '../../components/Boton'
import { validarEmail, validarPassword, validarNombre } from '../../utils/validaciones'

// ── Formulario para crear doctor o admin ───────────────────
// Solo el admin puede crear estos roles, nunca el registro público
function FormUsuario({ onGuardar, onCancelar }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'doctor' })
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleChange = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value })
    setErrores({ ...errores, [campo]: null })
  }

  const validar = () => {
    const nuevosErrores = {
      nombre: validarNombre(form.nombre),
      email: validarEmail(form.email),
      password: validarPassword(form.password),
    }
    setErrores(nuevosErrores)
    return !Object.values(nuevosErrores).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setCargando(true)
    try {
      await onGuardar(form)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
      <h3 className="text-white font-semibold mb-1">Crear usuario del personal</h3>
      <p className="text-gray-500 text-sm mb-4">Solo el administrador puede crear cuentas de doctor o admin.</p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nombre completo" value={form.nombre} onChange={handleChange('nombre')} error={errores.nombre} placeholder="Dr. María López" />
        <Input label="Email" type="email" value={form.email} onChange={handleChange('email')} error={errores.email} placeholder="doctor@clinica.com" />
        <Input label="Contraseña temporal" type="password" value={form.password} onChange={handleChange('password')} error={errores.password} placeholder="Min. 8 chars, mayúscula y número" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Rol</label>
          <select
            value={form.rol}
            onChange={handleChange('rol')}
            className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="doctor">Doctor / Enfermero</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {error && <p className="text-red-400 text-sm md:col-span-2">{error}</p>}
        <div className="flex gap-3 md:col-span-2">
          <Boton type="submit" cargando={cargando}>Crear usuario</Boton>
          <Boton type="button" variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        </div>
      </form>
    </div>
  )
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = async () => {
    try {
      const res = await api.get('/admin/usuarios')
      setUsuarios(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleCrear = async (form) => {
    await api.post('/auth/registro', form)
    setMostrarForm(false)
    cargar()
  }

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Desactivar este usuario? Ya no podrá iniciar sesión.')) return
    await api.put(`/admin/${id}/desactivar`)
    cargar()
  }

  const coloresRol = {
    admin: 'bg-purple-500/20 text-purple-400',
    doctor: 'bg-blue-500/20 text-blue-400',
    paciente: 'bg-green-500/20 text-green-400',
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Gestión de usuarios</h1>
          <Boton onClick={() => setMostrarForm(!mostrarForm)}>+ Nuevo usuario</Boton>
        </div>

        {mostrarForm && (
          <FormUsuario onGuardar={handleCrear} onCancelar={() => setMostrarForm(false)} />
        )}

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Nombre</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Email</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Rol</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Estado</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-all">
                    <td className="px-6 py-4 text-white text-sm">{u.nombre}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${coloresRol[u.rol]}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.activo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.activo && (
                        <button
                          onClick={() => handleDesactivar(u.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Usuarios