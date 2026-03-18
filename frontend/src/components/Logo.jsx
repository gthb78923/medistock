// ============================================
// components/Logo.jsx — Logo oficial de MediStock
// ============================================
function Logo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { icon: 28, text: 'text-base' },
    md: { icon: 36, text: 'text-lg' },
    lg: { icon: 56, text: 'text-3xl' },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center gap-2.5">
      {/* Ícono SVG médico */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fondo redondeado */}
        <rect width="56" height="56" rx="14" fill="#2563EB" />

        {/* Cruz médica */}
        <rect x="22" y="12" width="12" height="32" rx="4" fill="white" />
        <rect x="12" y="22" width="32" height="12" rx="4" fill="white" />

        {/* Pulso de corazón superpuesto */}
        <path
          d="M10 28 L16 28 L19 22 L22 34 L25 26 L28 28 L46 28"
          stroke="#93C5FD"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </svg>

      {showText && (
        <span className={`font-bold text-white ${s.text}`}>
          MediStock
        </span>
      )}
    </div>
  )
}

export default Logo