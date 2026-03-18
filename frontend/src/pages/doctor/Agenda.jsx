import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../services/api'

const coloresEstado = {
  pendiente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmada: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelada: 'bg-red-500/20 text-red-400 border-red-500/30',
}

function Agenda() {
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const [notaActiva, setNotaActiva] = useState(null)
  const [nota, setNota] = useState('')

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

  const handleActualizar = async (id, estado) => {
    try {
      await api.put(`/citas/${id}`, {
        estado,
        notas_doctor: nota
      })
      setNotaActiva(null)
      setNota('')
      cargar()
    } catch (err) {
      console.error(err)
    }
  }

  const citasFiltradas = citas.filter(c => {
    if (filtro === 'todas') return true
    return c.estado === filtro
  })

  const conteos = {
    pendiente: citas.filter(c => c.estado === 'pendiente').length,
    confirmada: citas.filter(c => c.estado === 'confirmada').length,
    cancelada: citas.filter(c => c.estado === 'cancelada').length,
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Mi agenda</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona las citas de tus pacientes</p>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pendientes', valor: conteos.pendiente, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Confirmadas', valor: conteos.confirmada, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Canceladas', valor: conteos.cancelada, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 border ${item.bg} text-center`}>
              <p className={`text-2xl font-bold ${item.color}`}>{item.valor}</p>
              <p className="text-gray-400 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['todas', 'pendiente', 'confirmada', 'cancelada'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                filtro === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : citasFiltradas.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-white font-medium">No hay citas {filtro !== 'todas' ? filtro + 's' : ''}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {citasFiltradas.map((cita) => (
              <div key={cita.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{cita.paciente_nombre}</p>
                      <p className="text-gray-500 text-sm">{cita.paciente_email}</p>
                      <p className="text-gray-400 text-sm mt-1">Motivo: {cita.motivo}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border capitalize ${coloresEstado[cita.estado]}`}>
                      {cita.estado}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-sm">📅</span>
                      <span className="text-white text-sm">
                        {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-sm">🕐</span>
                      <span className="text-white text-sm">{cita.hora}</span>
                    </div>
                  </div>

                  {cita.estado === 'pendiente' && (
                    <div className="flex flex-col gap-3">
                      {notaActiva === cita.id && (
                        <input
                          type="text"
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                          placeholder="Nota opcional para el paciente..."
                          className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      )}
                      <div className="flex gap-2">
                        {notaActiva !== cita.id ? (
                          <button
                            onClick={() => setNotaActiva(cita.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
                          >
                            + Agregar nota
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleActualizar(cita.id, 'confirmada')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                        >
                          ✓ Confirmar
                        </button>
                        <button
                          onClick={() => handleActualizar(cita.id, 'cancelada')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                        >
                          ✗ Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {cita.notas_doctor && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 mt-3">
                      <p className="text-blue-400 text-xs uppercase tracking-wide mb-1">Tu nota</p>
                      <p className="text-gray-300 text-sm">{cita.notas_doctor}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Agenda