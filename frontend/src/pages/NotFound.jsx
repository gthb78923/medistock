import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-blue-400 text-6xl font-bold mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Página no encontrada</h1>
        <p className="text-gray-400 mb-8">La ruta que buscas no existe o no tienes acceso.</p>
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default NotFound