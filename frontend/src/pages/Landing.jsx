import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

function ContadorAnimado({ objetivo, sufijo = '' }) {
  const [valor, setValor] = useState(0)
  useEffect(() => {
    const duracion = 2000
    const pasos = 60
    const incremento = objetivo / pasos
    let actual = 0
    const intervalo = setInterval(() => {
      actual += incremento
      if (actual >= objetivo) {
        setValor(objetivo)
        clearInterval(intervalo)
      } else {
        setValor(Math.floor(actual))
      }
    }, duracion / pasos)
    return () => clearInterval(intervalo)
  }, [objetivo])
  return <span>{valor.toLocaleString()}{sufijo}</span>
}

// ── FAQ Item ───────────────────────────────────────────────
function FAQItem({ pregunta, respuesta }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-800/50 transition-all"
      >
        <span className="text-white font-medium">{pregunta}</span>
        <span className={`text-gray-400 text-xl transition-transform duration-200 ${abierto ? 'rotate-45' : ''}`}>+</span>
      </button>
      {abierto && (
        <div className="px-6 pb-4 bg-gray-900/50">
          <p className="text-gray-400 text-sm leading-relaxed">{respuesta}</p>
        </div>
      )}
    </div>
  )
}

function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ── Barra superior de anuncio ──────────────────── */}
      <div className="bg-blue-600 px-6 py-2 text-center">
        <p className="text-white text-sm">
          🎉 MediStock ahora incluye agenda de citas y expedientes digitales —{' '}
          <Link to="/registro" className="underline font-semibold hover:text-blue-200">
            Empieza hoy
          </Link>
        </p>
      </div>

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="border-b border-gray-800/50 px-6 py-4 sticky top-0 bg-gray-950/90 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />

          <div className="hidden md:flex items-center gap-8">
            <a href="#funciona" className="text-gray-400 hover:text-white text-sm transition-all">Cómo funciona</a>
            <a href="#caracteristicas" className="text-gray-400 hover:text-white text-sm transition-all">Características</a>
            <a href="#roles" className="text-gray-400 hover:text-white text-sm transition-all">Para quién</a>
            <a href="#precios" className="text-gray-400 hover:text-white text-sm transition-all">Precios</a>
            <a href="#faq" className="text-gray-400 hover:text-white text-sm transition-all">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-all hidden md:block">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-all font-medium">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="flex items-center justify-center px-6 py-28 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            <span className="text-blue-400 text-sm">Plataforma clínica con seguridad de nivel empresarial</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            La gestión clínica
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              que tu consultorio merece
            </span>
          </h1>

          <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Centraliza expedientes, inventario y citas en una sola plataforma segura. Diseñada para consultorios que toman en serio la privacidad de sus pacientes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link to="/registro" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-center">
              Crear cuenta gratis →
            </Link>
            <Link to="/login" className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-all text-center">
              Ya tengo cuenta
            </Link>
          </div>

          {/* Estadísticas animadas */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { numero: 500, sufijo: '+', label: 'Consultorios' },
              { numero: 12000, sufijo: '+', label: 'Pacientes' },
              { numero: 98, sufijo: '%', label: 'Satisfacción' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white">
                  <ContadorAnimado objetivo={stat.numero} sufijo={stat.sufijo} />
                </p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Logos de confianza ─────────────────────────── */}
      <section className="border-t border-gray-800/50 px-6 py-10">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-600 text-sm mb-6">Con la confianza de clínicas y consultorios en toda Latinoamérica</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            {['Clínica Salud+', 'MedCenter CDMX', 'ConsultorioPro', 'Grupo Médico Norte', 'HealthCare MX'].map((nombre) => (
              <span key={nombre} className="text-gray-400 font-semibold text-sm tracking-wide">{nombre}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ──────────────────────────────── */}
      <section id="funciona" className="px-6 py-24 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Cómo funciona</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Tres pasos para digitalizar tu consultorio de forma segura</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { paso: '01', titulo: 'Crea tu cuenta', descripcion: 'El administrador configura el consultorio y agrega al personal médico. Los pacientes se registran solos en segundos.', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
              { paso: '02', titulo: 'Gestiona tu clínica', descripcion: 'Doctores crean expedientes, gestionan insumos y atienden citas. Todo desde un panel intuitivo y seguro.', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
              { paso: '03', titulo: 'Pacientes conectados', descripcion: 'Tus pacientes consultan su historial, solicitan citas y ven sus medicamentos desde cualquier dispositivo.', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
            ].map((item) => (
              <div key={item.paso}>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${item.bg} mb-4`}>
                  <span className={`font-bold ${item.color}`}>{item.paso}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{item.titulo}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quién es ──────────────────────────────── */}
      <section id="roles" className="px-6 py-24 border-t border-gray-800/50 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Diseñado para cada rol</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Cada persona en tu consultorio tiene su propio panel adaptado a sus necesidades</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icono: '🏥',
                rol: 'Administrador',
                color: 'border-purple-500/30 bg-purple-500/5',
                badge: 'bg-purple-500/20 text-purple-400',
                descripcion: 'Control total del consultorio desde un solo lugar.',
                features: ['Gestión de inventario médico', 'Control de usuarios y roles', 'Logs de auditoría completos', 'Gráficas y estadísticas', 'Alertas de stock bajo'],
              },
              {
                icono: '👨‍⚕️',
                rol: 'Doctor',
                color: 'border-blue-500/30 bg-blue-500/5',
                badge: 'bg-blue-500/20 text-blue-400',
                descripcion: 'Todo lo que necesitas para atender a tus pacientes.',
                features: ['Agenda de citas propia', 'Expedientes digitales', 'Buscador de pacientes', 'Registro de insumos usados', 'Confirmar o cancelar citas'],
              },
              {
                icono: '🧑‍💼',
                rol: 'Paciente',
                color: 'border-green-500/30 bg-green-500/5',
                badge: 'bg-green-500/20 text-green-400',
                descripcion: 'Accede a tu historial médico cuando lo necesites.',
                features: ['Solicitar citas en línea', 'Ver expediente personal', 'Medicamentos recetados', 'Historial de consultas', 'Imprimir expediente'],
              },
            ].map((item) => (
              <div key={item.rol} className={`rounded-xl p-6 border ${item.color}`}>
                <div className="text-4xl mb-3">{item.icono}</div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-white font-bold text-lg">{item.rol}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.badge}`}>{item.rol}</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">{item.descripcion}</p>
                <div className="flex flex-col gap-2">
                  {item.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="text-gray-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Características ────────────────────────────── */}
      <section id="caracteristicas" className="px-6 py-24 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Todo lo que necesitas</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Funcionalidades diseñadas para el flujo real de un consultorio médico</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icono: '🔐', titulo: 'Roles y permisos', descripcion: 'Admin, doctor y paciente con accesos estrictamente separados. Mínimo privilegio por diseño.', badge: 'Seguridad' },
              { icono: '📅', titulo: 'Agenda de citas', descripcion: 'Pacientes solicitan citas, doctores las confirman. Gestión completa desde el panel.', badge: 'Nuevo' },
              { icono: '🗂️', titulo: 'Expedientes digitales', descripcion: 'Historial clínico completo por paciente. Diagnósticos, medicamentos y notas del médico.', badge: 'Core' },
              { icono: '📦', titulo: 'Control de inventario', descripcion: 'Stock de insumos en tiempo real con alertas automáticas cuando el nivel baja del mínimo.', badge: 'Core' },
              { icono: '📋', titulo: 'Auditoría completa', descripcion: 'Cada acción queda registrada: quién, qué, cuándo y desde dónde. Trazabilidad total.', badge: 'Seguridad' },
              { icono: '🛡️', titulo: 'Cifrado y protección', descripcion: 'bcrypt, JWT, rate limiting, queries parametrizadas y headers de seguridad HTTP.', badge: 'Seguridad' },
            ].map((item) => (
              <div key={item.titulo} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-600 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{item.icono}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.badge === 'Seguridad' ? 'bg-blue-500/20 text-blue-400' :
                    item.badge === 'Nuevo' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>{item.badge}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{item.titulo}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precios ────────────────────────────────────── */}
      <section id="precios" className="px-6 py-24 border-t border-gray-800/50 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Planes simples y transparentes</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Sin costos ocultos. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                nombre: 'Básico', precio: 'Gratis', periodo: 'para siempre',
                descripcion: 'Para consultorios pequeños que están comenzando.',
                features: ['1 doctor', 'Hasta 50 pacientes', 'Expedientes digitales', 'Inventario básico'],
                cta: 'Comenzar gratis', destacado: false,
              },
              {
                nombre: 'Profesional', precio: '$499', periodo: 'por mes',
                descripcion: 'Para consultorios en crecimiento.',
                features: ['Hasta 5 doctores', 'Pacientes ilimitados', 'Agenda de citas', 'Reportes exportables', 'Soporte prioritario'],
                cta: 'Elegir Profesional', destacado: true,
              },
              {
                nombre: 'Clínica', precio: '$1,299', periodo: 'por mes',
                descripcion: 'Para clínicas con múltiples especialidades.',
                features: ['Doctores ilimitados', 'Múltiples sucursales', 'API de integración', 'Auditoría avanzada', 'Soporte 24/7'],
                cta: 'Contactar ventas', destacado: false,
              },
            ].map((plan) => (
              <div key={plan.nombre} className={`rounded-xl p-6 border relative ${plan.destacado ? 'bg-blue-600 border-blue-500' : 'bg-gray-900 border-gray-800'}`}>
                {plan.destacado && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">MÁS POPULAR</span>
                  </div>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{plan.nombre}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-bold text-white">{plan.precio}</span>
                  <span className={`text-sm mb-1 ${plan.destacado ? 'text-blue-200' : 'text-gray-500'}`}>{plan.periodo}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.destacado ? 'text-blue-200' : 'text-gray-400'}`}>{plan.descripcion}</p>
                <div className="flex flex-col gap-2 mb-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className={plan.destacado ? 'text-blue-200' : 'text-green-400'}>✓</span>
                      <span className={`text-sm ${plan.destacado ? 'text-blue-100' : 'text-gray-300'}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/registro" className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${plan.destacado ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimoniales ──────────────────────────────── */}
      <section className="px-6 py-24 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { texto: 'MediStock transformó la forma en que manejamos el inventario. Las alertas de stock bajo nos han evitado quedarnos sin insumos críticos.', nombre: 'Dra. Patricia Solis', rol: 'Directora médica, Clínica Salud+', avatar: 'PS' },
              { texto: 'Mis pacientes adoran poder ver su expediente desde su celular. La plataforma es intuitiva y el soporte es excelente.', nombre: 'Dr. Roberto Méndez', rol: 'Médico general, Consultorio Méndez', avatar: 'RM' },
              { texto: 'La auditoría completa nos da tranquilidad. Sabemos exactamente quién accedió a qué información y cuándo.', nombre: 'Lic. Carmen Torres', rol: 'Administradora, Centro Médico Torres', avatar: 'CT' },
            ].map((t) => (
              <div key={t.nombre} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.texto}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.nombre}</p>
                    <p className="text-gray-500 text-xs">{t.rol}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-24 border-t border-gray-800/50 bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Preguntas frecuentes</h2>
            <p className="text-gray-400">Todo lo que necesitas saber antes de empezar</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { pregunta: '¿Mis datos médicos están seguros?', respuesta: 'Absolutamente. MediStock usa cifrado bcrypt para contraseñas, tokens JWT con expiración, queries parametrizadas para prevenir inyecciones SQL, y headers de seguridad HTTP en todas las respuestas. Además, cada acción queda registrada en logs de auditoría.' },
              { pregunta: '¿Puede un paciente ver los expedientes de otros pacientes?', respuesta: 'No. El sistema de roles y permisos garantiza que cada paciente solo puede ver su propio expediente. Es imposible técnicamente acceder a información de otro paciente, incluso manipulando la URL.' },
              { pregunta: '¿Cómo funciona el sistema de citas?', respuesta: 'El paciente solicita una cita eligiendo doctor, fecha y hora. El doctor recibe la solicitud en su agenda y puede confirmarla o cancelarla con una nota opcional. El paciente ve el estado actualizado en tiempo real.' },
              { pregunta: '¿Quién puede crear cuentas de doctor o administrador?', respuesta: 'Solo el administrador del consultorio puede crear cuentas de doctor y admin desde el panel interno. Los pacientes se registran solos en la página pública, pero nunca pueden asignarse roles de personal médico.' },
              { pregunta: '¿Puedo imprimir el expediente de un paciente?', respuesta: 'Sí. Los pacientes tienen un botón de imprimir en su dashboard que genera un resumen completo de su historial clínico listo para llevar al médico.' },
              { pregunta: '¿Qué pasa si el stock de un insumo baja demasiado?', respuesta: 'El sistema genera alertas automáticas visibles en el dashboard del administrador cuando un insumo cae por debajo del mínimo configurado. La gráfica de inventario también lo marca en rojo para identificarlo de inmediato.' },
            ].map((item) => (
              <FAQItem key={item.pregunta} pregunta={item.pregunta} respuesta={item.respuesta} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────── */}
      <section className="px-6 py-24 border-t border-gray-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <Logo size="lg" showText={false} />
          <h2 className="text-3xl font-bold text-white mt-6 mb-4">Digitaliza tu consultorio hoy</h2>
          <p className="text-gray-400 mb-8">Únete a cientos de consultorios que ya confían en MediStock para gestionar su información médica de forma segura.</p>
          <Link to="/registro" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-xl transition-all text-lg">
            Crear cuenta gratis →
          </Link>
          <p className="text-gray-600 text-sm mt-4">Sin tarjeta de crédito. Sin compromisos.</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6">
            <a href="#faq" className="text-gray-600 hover:text-gray-400 text-sm transition-all">FAQ</a>
            <a href="#precios" className="text-gray-600 hover:text-gray-400 text-sm transition-all">Precios</a>
            <a href="#caracteristicas" className="text-gray-600 hover:text-gray-400 text-sm transition-all">Características</a>
            <Link to="/login" className="text-gray-600 hover:text-gray-400 text-sm transition-all">Iniciar sesión</Link>
          </div>
          <p className="text-gray-700 text-sm">© 2025 MediStock. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  )
}

export default Landing