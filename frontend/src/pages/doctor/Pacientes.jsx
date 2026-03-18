import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../services/api'

function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const [expedientes, setExpedientes] = useState([])
  const [cargandoExp, setCargandoExp] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/admin/pacientes')
        setPacientes(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const verPerfil = async (paciente) => {
    setSeleccionado(paciente)
    setCargandoExp(true)
    try {
      // Traemos todos los expedientes y filtramos por paciente
      const res = await api.get('/expedientes')
      const suyos = res.data.filter(e => e.paciente_id === paciente.id || e.paciente_nombre === paciente.nombre)
      setExpedientes(suyos)
    } catch (err) {
      console.error(err)
    } finally {
      setCargandoExp(false)
    }
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">

        <h1 className="text-2xl font-bold text-white mb-6">Mis pacientes</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Lista de pacientes */}
          <div className="md:col-span-1">
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-sm"
            />

            {cargando ? (
              <p className="text-gray-400 text-sm">Cargando...</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pacientesFiltrados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => verPerfil(p)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      seleccionado?.id === p.id
                        ? 'bg-blue-600/20 border-blue-500/50'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {p.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-white text-sm font-medium truncate">{p.nombre}</p>
                        <p className="text-gray-500 text-xs truncate">{p.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {pacientesFiltrados.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No se encontraron pacientes</p>
                )}
              </div>
            )}
          </div>

          {/* Perfil del paciente seleccionado */}
          <div className="md:col-span-2">
            {!seleccionado ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center h-full flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">👤</div>
                <p className="text-white font-medium mb-1">Selecciona un paciente</p>
                <p className="text-gray-500 text-sm">Elige un paciente de la lista para ver su historial</p>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">

                {/* Header del perfil */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/10 border-b border-gray-800 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {seleccionado.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-white text-xl font-bold">{seleccionado.nombre}</h2>
                      <p className="text-gray-400 text-sm">{seleccionado.email}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                        Paciente activo
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-white font-bold text-xl">{expedientes.length}</p>
                      <p className="text-gray-500 text-xs">Consultas</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-white font-bold text-xl">
                        {expedientes[0]
                          ? new Date(expedientes[0].fecha).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
                          : '—'}
                      </p>
                      <p className="text-gray-500 text-xs">Última consulta</p>
                    </div>
                  </div>
                </div>

                {/* Historial */}
                <div className="p-6">
                  <h3 className="text-white font-semibold mb-4">Historial clínico</h3>
                  {cargandoExp ? (
                    <p className="text-gray-400 text-sm">Cargando...</p>
                  ) : expedientes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">Este paciente no tiene consultas registradas aún.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {expedientes.map((exp) => (
                        <div key={exp.id} className="bg-gray-800 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-white text-sm font-medium">Consulta #{exp.id}</p>
                            <span className="text-gray-500 text-xs">
                              {new Date(exp.fecha).toLocaleDateString('es-MX', {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Diagnóstico</p>
                              <p className="text-gray-200 text-sm">{exp.diagnostico}</p>
                            </div>
                            {exp.medicamentos && (
                              <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Medicamentos</p>
                                <p className="text-gray-200 text-sm">{exp.medicamentos}</p>
                              </div>
                            )}
                            {exp.notas && (
                              <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Notas</p>
                                <p className="text-gray-200 text-sm">{exp.notas}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pacientes