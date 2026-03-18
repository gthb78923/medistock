import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../services/api'

function Logs() {
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/admin/logs')
        setLogs(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const coloresAccion = {
    login: 'bg-green-500/20 text-green-400',
    login_fallido: 'bg-red-500/20 text-red-400',
    logout: 'bg-gray-500/20 text-gray-400',
    registro: 'bg-blue-500/20 text-blue-400',
    crear_insumo: 'bg-purple-500/20 text-purple-400',
    editar_insumo: 'bg-yellow-500/20 text-yellow-400',
    eliminar_insumo: 'bg-red-500/20 text-red-400',
    crear_expediente: 'bg-teal-500/20 text-teal-400',
    desactivar_usuario: 'bg-orange-500/20 text-orange-400',
  }

  const logsFiltrados = logs.filter(l =>
    l.accion.toLowerCase().includes(filtro.toLowerCase()) ||
    (l.usuario_nombre && l.usuario_nombre.toLowerCase().includes(filtro.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Logs de auditoría</h1>
            <p className="text-gray-500 text-sm mt-1">Registro de todos los eventos importantes del sistema</p>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Filtrar por acción o usuario..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full md:w-80 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Fecha</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Usuario</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Acción</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Detalle</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((log) => (
                  <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-all">
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.fecha).toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{log.usuario_nombre || 'Sistema'}</p>
                      <p className="text-gray-500 text-xs">{log.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${coloresAccion[log.accion] || 'bg-gray-500/20 text-gray-400'}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{log.detalle}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{log.ip}</td>
                  </tr>
                ))}
                {logsFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No hay logs registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Logs