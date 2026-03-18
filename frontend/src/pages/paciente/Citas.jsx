import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../services/api'
import Boton from '../../components/Boton'

// ── Colores según estado de la cita ───────────────────────
const coloresEstado = {
  pendiente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmada: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelada: 'bg-red-500/20 text-red-400 border-red-500/30',
}

// ── Formulario para solicitar cita ────────────────────────
function FormCita({ onGuardar, onCancelar }) {
  const [doctores, setDoctores] = useState([])
  const [form, setForm] = useState({
    doctor_id: '',
    fecha: '',
    hora: '',
    motivo: ''
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // Horas disponibles de consulta
  const horasDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ]

  // ── CORREGIDO: Cargar doctores usando la nueva ruta ─────
  useEffect(() => {
    const cargar = async () => {
      try {
        // Esta ruta permite que los pacientes vean doctores disponibles
        const res = await api.get('/citas/doctores')
        setDoctores(res.data)
      } catch (err) {
        console.error('Error cargando doctores:', err)
      }
    }
    cargar()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.doctor_id || !form.fecha || !form.hora || !form.motivo) {
      setError('Todos los campos son requeridos.')
      return
    }
    setCargando(true)
    try {
      await onGuardar(form)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar cita.')
    } finally {
      setCargando(false)
    }
  }

  // Fecha mínima es hoy
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
      <h3 className="text-white font-semibold mb-4">Solicitar nueva cita</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Doctor</label>
          <select
            value={form.doctor_id}
            onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
            className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un doctor</option>
            {doctores.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Fecha</label>
          <input
            type="date"
            min={hoy}
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Hora</label>
          <select
            value={form.hora}
            onChange={(e) => setForm({ ...form, hora: e.target.value })}
            className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una hora</option>
            {horasDisponibles.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Motivo de consulta</label>
          <input
            type="text"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            placeholder="Ej: Dolor de cabeza frecuente, revisión general..."
            className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-400 text-sm md:col-span-2">{error}</p>}

        <div className="flex gap-3 md:col-span-2">
          <Boton type="submit" cargando={cargando}>Solicitar cita</Boton>
          <Boton type="button" variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        </div>
      </form>
    </div>
  )
}

function Citas() {
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = async () => {
    try {
      const res = await api.get('/citas')
      setCitas(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleGuardar = async (form) => {
    await api.post('/citas', form)
    setMostrarForm(false)
    cargar()
  }

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return
    await api.delete(`/citas/${id}`)
    cargar()
  }

  const citasFuturas = citas.filter(c => c.estado !== 'cancelada')
  const citasCanceladas = citas.filter(c => c.estado === 'cancelada')

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Mis citas</h1>
            <p className="text-gray-400 text-sm mt-1">Solicita y gestiona tus citas médicas</p>
          </div>
          <Boton onClick={() => setMostrarForm(!mostrarForm)}>
            + Solicitar cita
          </Boton>
        </div>

        {mostrarForm && (
          <FormCita onGuardar={handleGuardar} onCancelar={() => setMostrarForm(false)} />
        )}

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : citasFuturas.length === 0 && citasCanceladas.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-white font-medium mb-1">No tienes citas registradas</p>
            <p className="text-gray-500 text-sm">Solicita tu primera cita con un doctor.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {citasFuturas.map((cita) => (
              <div key={cita.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{cita.doctor_nombre}</p>
                      <p className="text-gray-500 text-sm">{cita.motivo}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border capitalize ${coloresEstado[cita.estado]}`}>
                      {cita.estado}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-gray-400 text-sm">📅</span>
                      <span className="text-white text-sm">
                        {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-gray-400 text-sm">🕐</span>
                      <span className="text-white text-sm">{cita.hora}</span>
                    </div>
                  </div>

                  {cita.notas_doctor && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 mb-3">
                      <p className="text-blue-400 text-xs uppercase tracking-wide mb-1">Nota del doctor</p>
                      <p className="text-gray-300 text-sm">{cita.notas_doctor}</p>
                    </div>
                  )}

                  {cita.estado === 'pendiente' && (
                    <button
                      onClick={() => handleCancelar(cita.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      Cancelar cita
                    </button>
                  )}
                </div>
              </div>
            ))}

            {citasCanceladas.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-600 text-sm mb-3">Citas canceladas</p>
                {citasCanceladas.map((cita) => (
                  <div key={cita.id} className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-4 mb-2 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">{cita.doctor_nombre}</p>
                        <p className="text-gray-600 text-xs">{new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-MX')} — {cita.hora}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500">Cancelada</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Citas