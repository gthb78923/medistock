// ============================================
// components/Boton.jsx — Botón reutilizable
// ============================================

function Boton({ children, onClick, type = 'button', cargando = false, variante = 'primario' }) {
  const estilos = {
    primario: 'bg-blue-600 hover:bg-blue-700 text-white',
    secundario: 'bg-gray-700 hover:bg-gray-600 text-white',
    peligro: 'bg-red-600 hover:bg-red-700 text-white',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={cargando}
      className={`
        w-full py-2.5 px-4 rounded-lg font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${estilos[variante]}
      `}
    >
      {/* Si está cargando muestra animación, si no muestra el texto */}
      {cargando ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Cargando...
        </span>
      ) : children}
    </button>
  )
}

export default Boton