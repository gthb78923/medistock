// ============================================
// index.js — Servidor principal de MediStock
// ============================================
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import hpp from 'hpp'

// Solo carga .env en desarrollo local
// En Render las variables ya están disponibles directamente
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

// ── Importar rutas ────────────────────────────────────────
import authRoutes from './routes/auth.routes.js'
import insumosRoutes from './routes/insumos.routes.js'
import expedientesRoutes from './routes/expedientes.routes.js'
import adminRoutes from './routes/admin.routes.js'
import citasRoutes from './routes/citas.routes.js'
import mfaRoutes from './routes/mfa.routes.js'

// ── Importar sanitización ─────────────────────────────────
import { sanitizarXSS } from './middlewares/validacion.js'

const app = express()
const PORT = process.env.PORT || 3000

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================
app.use(helmet({
  frameguard: { action: 'deny' },
  noSniff: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  hidePoweredBy: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    }
  }
}))

app.use(cors({
  origin: 'https://medistock-iota.vercel.app',
  credentials: true
}))

app.use(express.json())
app.use(hpp())

app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    console.warn(`[TIMEOUT] Petición lenta cancelada: ${req.method} ${req.path}`)
    res.status(408).json({ error: 'La petición tardó demasiado.' })
  })
  next()
})

app.use(sanitizarXSS)

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
app.use((req, res, next) => {
  console.warn(`[404] Ruta no encontrada: ${req.method} ${req.path} — IP: ${req.ip}`)
  res.status(404).json({ error: 'Ruta no encontrada.' })
})

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