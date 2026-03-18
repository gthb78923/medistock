// ============================================
// db/db.js — Pool de conexiones optimizado
// ============================================
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },

  // ── Configuración para mayor robustez ─────────────────
  max: 10,                // máximo 10 conexiones simultáneas
  min: 2,                 // mantiene 2 conexiones siempre activas
  idleTimeoutMillis: 30000,    // cierra conexiones inactivas tras 30s
  connectionTimeoutMillis: 5000, // error si no conecta en 5s
})

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool:', err.message)
})

export default pool