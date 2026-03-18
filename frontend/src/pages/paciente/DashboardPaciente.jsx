import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

// ── Información del consultorio ───────────────────────────
function InfoConsultorio() {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span>🏥</span> Información del consultorio
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">📍</span>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Ubicación</p>
            <p className="text-white text-sm">Av. Insurgentes Sur 1234</p>
            <p className="text-gray-400 text-xs">Col. Del Valle, CDMX</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">📞</span>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Teléfono</p>
            <p className="text-white text-sm">55 1234 5678</p>
            <p className="text-gray-400 text-xs">Lun–Vie 8:00–18:00</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">✉️</span>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Correo</p>
            <p className="text-white text-sm">contacto@medistock.mx</p>
            <p className="text-gray-400 text-xs">Respuesta en 24h</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HomePaciente() {
  const { usuario } = useAuth()
  const [expedientes, setExpedientes] = useState([])
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const [expRes, citasRes] = await Promise.all([
          api.get('/expedientes'),
          api.get('/citas')
        ])
        setExpedientes(expRes.data)
        setCitas(citasRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  // Próxima cita confirmada o pendiente
  const proximaCita = citas.find(c =>
    c.estado !== 'cancelada' &&
    new Date(c.fecha + 'T00:00:00') >= new Date()
  )

  // Último expediente
  const ultimoExp = expedientes[0]

  // Medicamentos activos del último expediente
  const medicamentosActivos = ultimoExp?.medicamentos

  // Función para imprimir expediente
  const handleImprimir = () => {
    const contenido = `
EXPEDIENTE MÉDICO — MEDISTOCK
==============================
Paciente: ${usuario?.nombre}
Fecha de impresión: ${new Date().toLocaleDateString('es-MX')}

HISTORIAL DE CONSULTAS
======================
${expedientes.map(exp => `
Consulta #${exp.id} — ${new Date(exp.fecha).toLocaleDateString('es-MX')}
Doctor: ${exp.doctor_nombre}
Diagnóstico: ${exp.diagnostico}
Medicamentos: ${exp.medicamentos || 'Ninguno'}
Notas: ${exp.notas || 'Sin notas'}
`).join('\n---\n')}
    `
    const ventana = window.open('', '_blank')
    ventana.document.write(`<pre style="font-family: monospace; padding: 2rem;">${contenido}</pre>`)
    ventana.document.close()
    ventana.print()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Saludo */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
        <p className="text-blue-400 text-sm mb-1">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-bold text-white">{usuario?.nombre}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {expedientes.length} {expedientes.length === 1 ? 'consulta registrada' : 'consultas registradas'} •{' '}
          {citas.filter(c => c.estado !== 'cancelada').length} citas activas
        </p>
      </div>

      {cargando ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* Próxima cita */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm font-medium">Próxima cita</p>
                <span className="text-2xl">📅</span>
              </div>
              {proximaCita ? (
                <div>
                  <p className="text-white font-semibold">{proximaCita.doctor_nombre}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(proximaCita.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })} a las {proximaCita.hora}
                  </p>
                  <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                    proximaCita.estado === 'confirmada'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {proximaCita.estado}
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 text-sm">No tienes citas próximas</p>
                  <Link to="/paciente/citas" className="text-blue-400 text-sm hover:text-blue-300 mt-1 inline-block">
                    Solicitar cita →
                  </Link>
                </div>
              )}
            </div>

            {/* Último diagnóstico */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm font-medium">Último diagnóstico</p>
                <span className="text-2xl">🗂️</span>
              </div>
              {ultimoExp ? (
                <div>
                  <p className="text-white font-semibold">{ultimoExp.diagnostico}</p>
                  <p className="text-gray-400 text-sm mt-1">Dr. {ultimoExp.doctor_nombre}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    {new Date(ultimoExp.fecha).toLocaleDateString('es-MX')}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Sin consultas registradas aún</p>
              )}
            </div>
          </div>

          {/* Medicamentos activos */}
          {medicamentosActivos && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💊</span>
                <p className="text-white font-medium">Medicamentos recetados</p>
                <span className="text-xs text-gray-500">(última consulta)</span>
              </div>
              <p className="text-gray-300 text-sm">{medicamentosActivos}</p>
            </div>
          )}

          {/* Información del consultorio */}
          <InfoConsultorio />

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            <Link to="/paciente/citas"
              className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center hover:bg-blue-600/30 transition-all">
              <div className="text-2xl mb-2">📅</div>
              <p className="text-blue-400 text-sm font-medium">Mis citas</p>
            </Link>
            <Link to="/paciente/expediente"
              className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4 text-center hover:bg-purple-600/30 transition-all">
              <div className="text-2xl mb-2">🗂️</div>
              <p className="text-purple-400 text-sm font-medium">Mi expediente</p>
            </Link>
            <button
              onClick={handleImprimir}
              className="bg-green-600/20 border border-green-500/30 rounded-xl p-4 text-center hover:bg-green-600/30 transition-all w-full"
            >
              <div className="text-2xl mb-2">🖨️</div>
              <p className="text-green-400 text-sm font-medium">Imprimir expediente</p>
            </button>
          </div>

          {/* Historial completo */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Historial clínico</h2>
          </div>

          {expedientes.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-white font-medium mb-1">Sin consultas registradas</p>
              <p className="text-gray-500 text-sm">Cuando un médico registre tu consulta, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {expedientes.map((exp) => (
                <div key={exp.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div>
                      <p className="text-white font-medium">Consulta #{exp.id}</p>
                      <p className="text-gray-500 text-sm">Dr. {exp.doctor_nombre}</p>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(exp.fecha).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Diagnóstico</p>
                      <p className="text-gray-200 text-sm">{exp.diagnostico}</p>
                    </div>
                    {exp.medicamentos && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Medicamentos</p>
                        <p className="text-gray-200 text-sm">{exp.medicamentos}</p>
                      </div>
                    )}
                    {exp.notas && (
                      <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Notas del médico</p>
                        <p className="text-gray-200 text-sm">{exp.notas}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DashboardPaciente() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePaciente />} />
      </Routes>
    </div>
  )
}

export default DashboardPaciente