import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../services/api'
import Input from '../../components/Input'
import Boton from '../../components/Boton'

function FormExpediente({ inicial, onGuardar, onCancelar }) {
  const [pacientes, setPacientes] = useState([])
  const [form, setForm] = useState(inicial || {
    paciente_id: '',
    diagnostico: '',
    medicamentos: '',
    notas: ''
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/admin/pacientes')
        setPacientes(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    cargar()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.paciente_id || !form.diagnostico) {
      setError('Paciente y diagnóstico son requeridos.')
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
        {inicial ? 'Editar consulta' : 'Nueva consulta'}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Solo mostramos el selector de paciente si es nueva consulta */}
        {!inicial && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">Paciente</label>
            <select
              value={form.paciente_id}
              onChange={(e) => setForm({ ...form, paciente_id: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un paciente</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} — {p.email}</option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Diagnóstico"
          value={form.diagnostico}
          onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
          placeholder="Ej: Faringitis aguda"
        />
        <Input
          label="Medicamentos recetados"
          value={form.medicamentos}
          onChange={(e) => setForm({ ...form, medicamentos: e.target.value })}
          placeholder="Ej: Amoxicilina 500mg cada 8h por 7 días"
        />
        <Input
          label="Notas adicionales"
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          placeholder="Observaciones, seguimiento..."
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <Boton type="submit" cargando={cargando}>
            {inicial ? 'Guardar cambios' : 'Guardar consulta'}
          </Boton>
          <Boton type="button" variante="secundario" onClick={onCancelar}>Cancelar</Boton>
        </div>
      </form>
    </div>
  )
}

function Expedientes() {
  const [expedientes, setExpedientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

  const cargar = async () => {
    try {
      const res = await api.get('/expedientes')
      setExpedientes(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleGuardar = async (form) => {
    await api.post('/expedientes', form)
    setMostrarForm(false)
    cargar()
  }

  const handleEditar = async (form) => {
    await api.put(`/expedientes/${editando.id}`, form)
    setEditando(null)
    cargar()
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Expedientes de pacientes</h1>
          <Boton onClick={() => { setMostrarForm(!mostrarForm); setEditando(null) }}>
            + Nueva consulta
          </Boton>
        </div>

        {mostrarForm && !editando && (
          <FormExpediente onGuardar={handleGuardar} onCancelar={() => setMostrarForm(false)} />
        )}

        {cargando ? (
          <p className="text-gray-400">Cargando...</p>
        ) : expedientes.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="text-gray-400">No hay consultas registradas aún.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {expedientes.map((exp) => (
              <div key={exp.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-semibold">{exp.paciente_nombre}</h3>
                      <p className="text-gray-500 text-sm">Consulta #{exp.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm">
                        {new Date(exp.fecha).toLocaleDateString('es-MX', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                      <button
                        onClick={() => setEditando(editando?.id === exp.id ? null : exp)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
                      >
                        Editar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Diagnóstico</p>
                      <p className="text-gray-200 text-sm">{exp.diagnostico}</p>
                    </div>
                    {exp.medicamentos && (
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Medicamentos</p>
                        <p className="text-gray-200 text-sm">{exp.medicamentos}</p>
                      </div>
                    )}
                    {exp.notas && (
                      <div className="bg-gray-800 rounded-lg p-3 md:col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Notas</p>
                        <p className="text-gray-200 text-sm">{exp.notas}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Formulario de edición inline */}
                {editando?.id === exp.id && (
                  <div className="border-t border-gray-800 p-6 bg-gray-800/30">
                    <FormExpediente
                      inicial={editando}
                      onGuardar={handleEditar}
                      onCancelar={() => setEditando(null)}
                    />
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

export default Expedientes