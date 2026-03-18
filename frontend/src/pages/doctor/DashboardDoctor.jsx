import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

function HomeDoctor() {
  const { usuario } = useAuth()
  const [stats, setStats] = useState({
    citasPendientes: 0,
    citasHoy: 0,
    totalPacientes: 0,
    totalConsultas: 0,
  })
  const [citasProximas, setCitasProximas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const [citasRes, pacientesRes, expedientesRes] = await Promise.all([
          api.get('/citas'),
          api.get('/admin/pacientes'),
          api.get('/expedientes'),
        ])

        const hoy = new Date().toISOString().split('T')[0]
        const citas = citasRes.data

        setStats({
          citasPendientes: citas.filter(c => c.estado === 'pendiente').length,
          citasHoy: citas.filter(c => c.fecha === hoy && c.estado !== 'cancelada').length,
          totalPacientes: pacientesRes.data.length,
          totalConsultas: expedientesRes.data.length,
        })

        // Próximas 3 citas confirmadas o pendientes
        const proximas = citas
          .filter(c => c.estado !== 'cancelada' && c.fecha >= hoy)
          .slice(0, 3)
        setCitasProximas(proximas)

      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Saludo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Buenos días, {usuario?.nombre?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1">Panel médico — MediStock</p>
      </div>

      {cargando ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <>
          {/* Alerta de citas pendientes */}
          {stats.citasPendientes > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="text-yellow-400 font-medium">
                    Tienes {stats.citasPendientes} {stats.citasPendientes === 1 ? 'cita pendiente' : 'citas pendientes'} de confirmar
                  </p>
                  <p className="text-yellow-400/70 text-sm">Revisa tu agenda para confirmar o cancelar</p>
                </div>
              </div>
              <Link
                to="/doctor/agenda"
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm px-4 py-2 rounded-lg transition-all"
              >
                Ver agenda →
              </Link>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Citas hoy', valor: stats.citasHoy, icono: '📅', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Pendientes', valor: stats.citasPendientes, icono: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
              { label: 'Mis pacientes', valor: stats.totalPacientes, icono: '👥', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { label: 'Consultas dadas', valor: stats.totalConsultas, icono: '🗂️', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-5 border ${s.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{s.icono}</span>
                </div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.valor}</p>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Próximas citas */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Próximas citas</h2>
                <Link to="/doctor/agenda" className="text-blue-400 text-sm hover:text-blue-300">Ver todas →</Link>
              </div>
              {citasProximas.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay citas próximas</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {citasProximas.map((cita) => (
                    <div key={cita.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {cita.paciente_nombre?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{cita.paciente_nombre}</p>
                          <p className="text-gray-500 text-xs">{cita.motivo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-300 text-xs">{new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-gray-500 text-xs">{cita.hora}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-white font-semibold mb-4">Accesos rápidos</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/doctor/agenda', icono: '📅', label: 'Mi agenda', color: 'bg-blue-600/20 border-blue-500/30 text-blue-400' },
                  { to: '/doctor/pacientes', icono: '👥', label: 'Pacientes', color: 'bg-green-600/20 border-green-500/30 text-green-400' },
                  { to: '/doctor/expedientes', icono: '🗂️', label: 'Expedientes', color: 'bg-purple-600/20 border-purple-500/30 text-purple-400' },
                  { to: '/doctor/insumos', icono: '📦', label: 'Insumos', color: 'bg-orange-600/20 border-orange-500/30 text-orange-400' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-xl p-4 border text-center hover:opacity-80 transition-all ${item.color}`}
                  >
                    <div className="text-2xl mb-2">{item.icono}</div>
                    <p className="text-sm font-medium">{item.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DashboardDoctor() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeDoctor />} />
      </Routes>
    </div>
  )
}

export default DashboardDoctor