// ============================================
// components/Input.jsx — Campo de formulario reutilizable
// ============================================
// En lugar de repetir el mismo HTML en cada formulario,
// creamos un componente que acepta props y se adapta.

function Input({ label, type = 'text', value, onChange, error, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      {/* Etiqueta del campo */}
      <label className="text-sm font-medium text-gray-300">
        {label}
      </label>

      {/* Campo de texto */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          px-4 py-2.5 rounded-lg bg-gray-800 border text-white
          placeholder-gray-500 outline-none transition-all
          focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-500' : 'border-gray-600'}
        `}
      />

      {/* Mensaje de error debajo del campo, solo si hay error */}
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}

export default Input