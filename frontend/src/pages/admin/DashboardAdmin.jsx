import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Navbar from '../../components/Navbar'
import api from '../../services/api'

function HomeAdmin() {
  const [stats, setStats] = useState({
    totalInsumos: 0,
    insumosAlerta: 0,
    totalUsuarios: 0,
    citasPendientes: 0,
  })
  const [insumosAlerta, setInsumosAlerta] = useState([])
  const [grafica, setGrafica] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const [insumos, usuarios, citas] = await Promise.all([
          api.get('/insumos'),
          api.get('/admin/usuarios'),
          api.get('/citas'),
        ])

        const alertas = insumos.data.filter(i => i.alerta_stock)

        setStats({
          totalInsumos: insumos.data.length,
          insumosAlerta: alertas.length,
          totalUsuarios: usuarios.data.length,
          citasPendientes: citas.data.filter(c => c.estado === 'pendiente').length,
        })

        setInsumosAlerta(alertas)

        // Datos para la gráfica — top 6 insumos por stock actual
        const graficaData = insumos.data
          .sort((a, b) => b.cantidad_actual - a.cantidad_actual)
          .slice(0, 6)
          .map(i => ({
            nombre: i.nombre.length > 12 ? i.nombre.slice(0, 12) + '...' : i.nombre,
            stock: i.cantidad_actual,
            minimo: i.cantidad_minima,
            alerta: i.alerta_stock,
          }))
        setGrafica(graficaData)

      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Panel de administrador</h1>
        <p className="text-gray-400 mt-1">Resumen general del sistema</p>
      </div>

      {cargando ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <>
          {/* Alertas prominentes */}
          {insumosAlerta.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="text-red-400 font-semibold">
                    {insumosAlerta.length} {insumosAlerta.length === 1 ? 'insumo con' : 'insumos con'} stock bajo
                  </p>
                  <p className="text-red-400/70 text-sm">Requieren reabastecimiento urgente</p>
                </div>
                <Link
                  to="/admin/insumos"
                  className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Ver insumos →
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {insumosAlerta.map(i => (
                  <span key={i.id} className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded-full">
                    {i.nombre} — {i.cantidad_actual} {i.unidad}
                  </span>
                ))}
              </div>
            </div>
          )}

          {stats.citasPendientes > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <p className="text-yellow-400 font-medium">
                  {stats.citasPendientes} {stats.citasPendientes === 1 ? 'cita pendiente' : 'citas pendientes'} en el sistema
                </p>
              </div>
            </div>
          )}

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total insumos', valor: stats.totalInsumos, icono: '📦', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', to: '/admin/insumos' },
              { label: 'Stock bajo', valor: stats.insumosAlerta, icono: '⚠️', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', to: '/admin/insumos' },
              { label: 'Usuarios', valor: stats.totalUsuarios, icono: '👥', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', to: '/admin/usuarios' },
              { label: 'Citas pendientes', valor: stats.citasPendientes, icono: '📅', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', to: '/admin/logs' },
            ].map((s) => (
              <Link key={s.label} to={s.to} className={`rounded-xl p-5 border ${s.bg} hover:opacity-80 transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{s.icono}</span>
                </div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.valor}</p>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

            {/* Gráfica de inventario */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-white font-semibold mb-4">Stock por insumo</h2>
              {grafica.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay insumos registrados</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={grafica} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="nombre" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                      {grafica.map((entry, index) => (
                        <Cell key={index} fill={entry.alerta ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span className="text-gray-500 text-xs">Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                  <span className="text-gray-500 text-xs">Stock bajo</span>
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-white font-semibold mb-4">Accesos rápidos</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/admin/insumos', icono: '📦', label: 'Insumos', color: 'bg-blue-600/20 border-blue-500/30 text-blue-400' },
                  { to: '/admin/usuarios', icono: '👥', label: 'Usuarios', color: 'bg-purple-600/20 border-purple-500/30 text-purple-400' },
                  { to: '/admin/expedientes', icono: '🗂️', label: 'Expedientes', color: 'bg-green-600/20 border-green-500/30 text-green-400' },
                  { to: '/admin/logs', icono: '📋', label: 'Logs', color: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-400' },
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

function DashboardAdmin() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeAdmin />} />
      </Routes>
    </div>
  )
}

export default DashboardAdmin