// ============================================
// index.js — Servidor principal de MediStock
// ============================================
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import hpp from 'hpp'

// ── Importar rutas ────────────────────────────────────────
import authRoutes from './routes/auth.routes.js'
import insumosRoutes from './routes/insumos.routes.js'
import expedientesRoutes from './routes/expedientes.routes.js'
import adminRoutes from './routes/admin.routes.js'
import citasRoutes from './routes/citas.routes.js'
import mfaRoutes from './routes/mfa.routes.js'

// ── Importar sanitización ─────────────────────────────────
import { sanitizarXSS } from './middlewares/validacion.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// ── Helmet configurado explícitamente ─────────────────────
// Cada header tiene un propósito de seguridad específico.
app.use(helmet({
  // Previene que la app se cargue en un iframe (clickjacking)
  frameguard: { action: 'deny' },

  // Previene que el navegador adivine el tipo de contenido
  noSniff: true,

  // Fuerza HTTPS en navegadores que ya visitaron el sitio
  hsts: {
    maxAge: 31536000,        // 1 año en segundos
    includeSubDomains: true, // aplica a subdominios también
  },

  // Desactiva la cabecera X-Powered-By que revela que usas Express
  hidePoweredBy: true,

  // Política de seguridad de contenido básica
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],           // solo recursos del mismo origen
      scriptSrc: ["'self'"],            // solo scripts propios
      styleSrc: ["'self'", "'unsafe-inline'"], // estilos propios y Tailwind
      imgSrc: ["'self'", "data:"],      // imágenes propias y base64 (para el QR del MFA)
      connectSrc: ["'self'"],           // solo conexiones al mismo origen
    }
  }
}))

// CORS — temporalmente acepta cualquier origen para configurar Vercel
app.use(cors({
  origin: true, // temporal, lo restringimos después
  credentials: true
}))

// Parsear JSON
app.use(express.json())

// ── HPP — HTTP Parameter Pollution ────────────────────────
// Previene ataques donde se envían múltiples valores
// para el mismo parámetro en la URL.
// Ejemplo: ?rol=paciente&rol=admin -> solo toma el último
app.use(hpp())

// ── Timeout de peticiones ─────────────────────────────────
// Si una petición tarda más de 10 segundos, se cancela.
// Previene ataques de denegación de servicio por peticiones lentas.
app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    console.warn(`[TIMEOUT] Petición lenta cancelada: ${req.method} ${req.path}`)
    res.status(408).json({ error: 'La petición tardó demasiado.' })
  })
  next()
})

// Sanitización XSS global — limpia todos los inputs
app.use(sanitizarXSS)

// Rate limiting — máximo 100 peticiones por IP cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas peticiones, intenta más tarde' }
})
app.use('/api/', limiter)

// ============================================
// RUTAS
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'Servidor MediStock corriendo ✅' })
})

app.use('/api/auth', authRoutes)
app.use('/api/insumos', insumosRoutes)
app.use('/api/expedientes', expedientesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/citas', citasRoutes)
app.use('/api/mfa', mfaRoutes)

// ============================================
// MANEJO GLOBAL DE ERRORES
// ============================================

// ── Rutas no encontradas ──────────────────────────────────
app.use((req, res, next) => {
  console.warn(`[404] Ruta no encontrada: ${req.method} ${req.path} — IP: ${req.ip}`)
  res.status(404).json({ error: 'Ruta no encontrada.' })
})

// ── Manejador global de errores ───────────────────────────
app.use((err, req, res, next) => {
  const esErrorOperacional = err.isOperacional || false

  if (esErrorOperacional) {
    console.warn(`[ERROR OPERACIONAL] ${req.method} ${req.path}:`, err.message)
    return res.status(err.statusCode || 400).json({ error: err.message })
  }

  console.error(`[ERROR CRÍTICO] ${req.method} ${req.path}:`, {
    mensaje: err.message,
    stack: err.stack,
    ip: req.ip,
    usuario: req.usuario?.email || 'no autenticado'
  })

  res.status(500).json({ error: 'Error interno del servidor.' })
})

// ============================================
// ARRANCAR EL SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})