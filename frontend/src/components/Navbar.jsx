// ============================================
// components/Navbar.jsx — Barra de navegación
// ============================================
// Muestra el nombre del usuario, su rol, y el botón de logout.
// Se adapta según el rol para mostrar distintos links.

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Links según rol - ACTUALIZADO con nuevas páginas
  const links = {
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/insumos', label: 'Insumos' },
      { to: '/admin/usuarios', label: 'Usuarios' },
      { to: '/admin/expedientes', label: 'Expedientes' },
      { to: '/admin/logs', label: 'Logs' },
    ],
    doctor: [
      { to: '/doctor', label: 'Dashboard' },
      { to: '/doctor/agenda', label: 'Mi agenda' },
      { to: '/doctor/pacientes', label: 'Pacientes' },
      { to: '/doctor/expedientes', label: 'Expedientes' },
      { to: '/doctor/insumos', label: 'Insumos' },
    ], 
    paciente: [
      { to: '/paciente', label: 'Mi expediente' },
      { to: '/paciente/citas', label: 'Mis citas' },
    ],
  }

  const colores = {
    admin: 'text-purple-400',
    doctor: 'text-blue-400',
    paciente: 'text-green-400',
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-6">
          <span className="text-white font-bold text-lg">MediStock</span>

          {/* Links de navegación */}
          <div className="hidden md:flex items-center gap-1">
            {links[usuario?.rol]?.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Usuario y logout - ACTUALIZADO con botón MFA */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-medium">{usuario?.nombre}</p>
            <p className={`text-xs capitalize ${colores[usuario?.rol]}`}>{usuario?.rol}</p>
          </div>
          <Link
            to="/configurar-mfa"
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent transition-all hidden sm:block"
            title="Configurar MFA"
          >
            🔐
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-all"
          >
            Cerrar sesión
          </button>
        </div>

      </div>
    </nav>
  )
}

export default Navbar