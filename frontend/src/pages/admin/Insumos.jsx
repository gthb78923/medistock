import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../services/api'
import Input from '../../components/Input'
import Boton from '../../components/Boton'

// ── Formulario para crear o editar insumo ──────────────────
function FormInsumo({ inicial, onGuardar, onCancelar }) {
  const [form, setForm] = useState(inicial || {
    nombre: '', categoria: '', cantidad_actual: '', cantidad_minima: '', unidad: ''
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre || form.cantidad_actual === '' || form.cantidad_minima === '') {
      setError('Nombre, cantidad actual y cantidad mínima son requeridos.')
      return
    }
    setCargando(true)
    try {
      await onGuardar(form)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
      <h3 className="text-white font-semibold mb-4">
        {inicial ? 'Editar insumo' : 'Nuevo insumo'}
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nombre" value={form.nombre} onChange={handleChange('nombre')} placeholder="Guantes de látex" />
        <Input label="Categoría" value={form.categoria} onChange={handleChange('categoria')} placeholder="Material" />
        <Input label="Cantidad actual" type="number" value={form.cantidad_actual} onChange={handleChange('cantidad_actual')} placeholder="100" />
        <Input label="Cantidad mínima (alerta)" type="number" value={form.cantidad_minima} onChange={handleChange('cantidad_minima')} placeholder="20" />
        <Input label="Unidad" value={form.unidad} onChange={handleChange('unidad')} placeholder="cajas, piezas, ml..." />
        {error && <p className="text-red-400 text-sm md:col-span-2">{error}</p>}
        <div className="flex gap-3 md:col-span-2">
          <Boton type="submit" cargando={cargando}>Guardar</Boton>
          <Boton type="button" variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        </div>
      </form>
    </div>
  )
}

// ── Formulario para registrar movimiento ───────────────────
function FormMovimiento({ insumo, onGuardar, onCancelar }) {
  const [form, setForm] = useState({ tipo: 'salida', cantidad: '', motivo: '' })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.cantidad || form.cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0.')
      return
    }
    setCargando(true)
    try {
      await onGuardar(form)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mt-2">
      <h4 className="text-white text-sm font-semibold mb-3">Registrar movimiento — {insumo.nombre}</h4>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="entrada">Entrada (llegó mercancía)</option>
            <option value="salida">Salida (se usó o consumió)</option>
          </select>
        </div>
        <Input label="Cantidad" type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} placeholder="10" />
        <Input label="Motivo (opcional)" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Consulta paciente / Compra proveedor" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Boton type="submit" cargando={cargando}>Registrar</Boton>
          <Boton type="button" variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        </div>
      </form>
    </div>
  )
}

// ── Página principal de insumos ────────────────────────────
function Insumos() {
  const [insumos, setInsumos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [movimiento, setMovimiento] = useState(null)
  const [busqueda, setBusqueda] = useState('')

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

  const handleCrear = async (form) => {
    await api.post('/insumos', form)
    setMostrarForm(false)
    cargar()
  }

  const handleEditar = async (form) => {
    await api.put(`/insumos/${editando.id}`, form)
    setEditando(null)
    cargar()
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este insumo?')) return
    await api.delete(`/insumos/${id}`)
    cargar()
  }

  const handleMovimiento = async (form) => {
    await api.post(`/insumos/${movimiento.id}/movimiento`, form)
    setMovimiento(null)
    cargar()
  }

  // Filtro de búsqueda en el frontend
  const insumosFiltrados = insumos.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (i.categoria && i.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Gestión de insumos</h1>
          <Boton onClick={() => { setMostrarForm(true); setEditando(null) }}>
            + Nuevo insumo
          </Boton>
        </div>

        {/* Formulario de creación */}
        {mostrarForm && !editando && (
          <FormInsumo onGuardar={handleCrear} onCancelar={() => setMostrarForm(false)} />
        )}

        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full md:w-80 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabla de insumos */}
        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Nombre</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Categoría</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Stock</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Mínimo</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Unidad</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {insumosFiltrados.map((insumo) => (
                  <>
                    <tr key={insumo.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {insumo.alerta_stock && (
                            <span className="text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded-full">⚠️ Stock bajo</span>
                          )}
                          <span className="text-white text-sm">{insumo.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{insumo.categoria || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${insumo.alerta_stock ? 'text-red-400' : 'text-green-400'}`}>
                          {insumo.cantidad_actual}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{insumo.cantidad_minima}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{insumo.unidad || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setMovimiento(movimiento?.id === insumo.id ? null : insumo)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                          >
                            Movimiento
                          </button>
                          <button
                            onClick={() => { setEditando(insumo); setMostrarForm(false) }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(insumo.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Formulario de movimiento inline */}
                    {movimiento?.id === insumo.id && (
                      <tr key={`mov-${insumo.id}`} className="bg-gray-800/30">
                        <td colSpan="6" className="px-6 py-2">
                          <FormMovimiento
                            insumo={insumo}
                            onGuardar={handleMovimiento}
                            onCancelar={() => setMovimiento(null)}
                          />
                        </td>
                      </tr>
                    )}

                    {/* Formulario de edición inline */}
                    {editando?.id === insumo.id && (
                      <tr key={`edit-${insumo.id}`} className="bg-gray-800/30">
                        <td colSpan="6" className="px-6 py-2">
                          <FormInsumo
                            inicial={editando}
                            onGuardar={handleEditar}
                            onCancelar={() => setEditando(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {insumosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No hay insumos registrados.
                    </td>
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

export default Insumos