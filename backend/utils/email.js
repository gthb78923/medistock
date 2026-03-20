// ============================================
// utils/email.js — Servicio de envío de emails
// ============================================
// Usamos Resend para enviar emails transaccionales.
// Es el servicio más sencillo disponible actualmente.

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const enviarCodigoMFA = async (email, nombre, codigo) => {
  try {
    await resend.emails.send({
      from: 'MediStock <onboarding@resend.dev>', // dominio gratuito de Resend
      to: email,
      subject: 'Tu código de verificación — MediStock',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 16px;">
          
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="background: #2563eb; width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">M</span>
            </div>
            <h1 style="color: #fff; margin: 0; font-size: 24px;">MediStock</h1>
            <p style="color: #94a3b8; margin: 4px 0 0;">Sistema de gestión clínica</p>
          </div>

          <h2 style="color: #fff; font-size: 18px; margin-bottom: 8px;">
            Hola, ${nombre} 👋
          </h2>
          <p style="color: #94a3b8; margin-bottom: 32px;">
            Alguien intentó iniciar sesión en tu cuenta. Usa el siguiente código para completar el acceso:
          </p>

          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Tu código de verificación</p>
            <p style="color: #fff; font-size: 40px; font-weight: bold; letter-spacing: 12px; margin: 0;">${codigo}</p>
            <p style="color: #64748b; font-size: 12px; margin: 12px 0 0;">Expira en 5 minutos</p>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="color: #92400e; font-size: 13px; margin: 0;">
              ⚠️ Si no fuiste tú, ignora este correo. Nadie más puede usar este código.
            </p>
          </div>

          <p style="color: #475569; font-size: 12px; text-align: center; margin: 0;">
            Este código es de un solo uso y expira en 5 minutos.
          </p>
        </div>
      `
    })
    return true
  } catch (err) {
    console.error('[EMAIL] Error enviando código MFA:', err.message)
    return false
  }
}