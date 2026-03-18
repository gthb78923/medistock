import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../services/api'
import Boton from '../../components/Boton'
import Input from '../../components/Input'

function InsumosDoctor() {
  const [insumos, setInsumos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [movimiento, setMovimiento] = useState(null)
  const [formMov, setFormMov] = useState({ tipo: 'salida', cantidad: '', motivo: '' })
  const [error, setError] = useState('')

  const cargar = async () => {
    try {
      const res = await api.get('/insumos')
      setInsumos(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleMovimiento = async (e) => {
    e.preventDefault()
    if (!formMov.cantidad || formMov.cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0.')
      return
    }
    try {
      await api.post(`/insumos/${movimiento.id}/movimiento`, formMov)
      setMovimiento(null)
      setFormMov({ tipo: 'salida', cantidad: '', motivo: '' })
      setError('')
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Insumos disponibles</h1>
        <p className="text-gray-400 text-sm mb-6">Puedes consultar el stock y registrar el uso de insumos en consultas.</p>

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-3">
            {insumos.map((insumo) => (
              <div key={insumo.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{insumo.nombre}</p>
                        {insumo.alerta_stock && (
                          <span className="text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full">⚠️ Stock bajo</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">{insumo.categoria} — {insumo.unidad}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-bold text-lg ${insumo.alerta_stock ? 'text-red-400' : 'text-green-400'}`}>
                        {insumo.cantidad_actual}
                      </p>
                      <p className="text-gray-500 text-xs">en stock</p>
                    </div>
                    <button
                      onClick={() => setMovimiento(movimiento?.id === insumo.id ? null : insumo)}
                      className="text-sm px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                    >
                      Registrar uso
                    </button>
                  </div>
                </div>

                {movimiento?.id === insumo.id && (
                  <div className="border-t border-gray-800 p-4 bg-gray-800/30">
                    <form onSubmit={handleMovimiento} className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-300">Tipo de movimiento</label>
                        <select
                          value={formMov.tipo}
                          onChange={(e) => setFormMov({ ...formMov, tipo: e.target.value })}
                          className="px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="salida">Salida (se usó en consulta)</option>
                          <option value="entrada">Entrada (reposición)</option>
                        </select>
                      </div>
                      <Input
                        label="Cantidad"
                        type="number"
                        value={formMov.cantidad}
                        onChange={(e) => setFormMov({ ...formMov, cantidad: e.target.value })}
                        placeholder="Ej: 2"
                      />
                      <Input
                        label="Motivo"
                        value={formMov.motivo}
                        onChange={(e) => setFormMov({ ...formMov, motivo: e.target.value })}
                        placeholder="Ej: Consulta paciente Juan Pérez"
                      />
                      {error && <p className="text-red-400 text-sm">{error}</p>}
                      <div className="flex gap-3">
                        <Boton type="submit">Registrar</Boton>
                        <Boton type="button" variante="secundario" onClick={() => setMovimiento(null)}>Cancelar</Boton>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InsumosDoctor