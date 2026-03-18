const nodemailer = require('nodemailer');
const { AppError } = require('../utils/errors');

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser || !smtpPass) {
  throw new AppError('Configuración SMTP incompleta. Verifique SMTP_USER y SMTP_PASS.', 500);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

function buildPasswordResetHtml(resetLink) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
      <h2 style="color: #111827;">Restablecer tu contraseña</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Haz clic en el siguiente botón para continuar:</p>
      <p style="margin: 24px 0;">
        <a
          href="${resetLink}"
          style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; display: inline-block;"
        >
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Wallets Security Notification</p>
    </div>
  `;
}

function buildOtpEmailHtml(otpCode, purpose) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
      <h2 style="color: #111827;">Código de seguridad</h2>
      <p>Se solicitó una verificación para: <strong>${purpose}</strong>.</p>
      <p style="margin: 20px 0;">Tu código de seguridad es:</p>
      <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #111827; margin: 10px 0 20px;">${otpCode}</p>
      <p>Este código expira en 15 minutos.</p>
      <p>Si no reconoces esta solicitud, ignora este correo y revisa la seguridad de tu cuenta.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Wallets Security Notification</p>
    </div>
  `;
}

async function sendPasswordResetEmail(userEmail, resetToken, clientOrigin) {
  if (!userEmail || !resetToken || !clientOrigin) {
    throw new AppError('No se pudo construir el correo de recuperación por parámetros incompletos.', 500);
  }

  const resetLink = `${clientOrigin}/reset-password?token=${resetToken}`;

  try {
    await transporter.sendMail({
      from: `"Wallets Security" <${smtpUser}>`,
      to: userEmail,
      subject: 'Restablecimiento de contraseña',
      html: buildPasswordResetHtml(resetLink),
      text: `Restablece tu contraseña aquí: ${resetLink}. Este enlace expira en 1 hora.`,
    });
  } catch (error) {
    throw new AppError('No se pudo enviar el correo de recuperación en este momento.', 500, error?.message);
  }
}

async function sendOtpEmail(userEmail, otpCode, purpose) {
  if (!userEmail || !otpCode || !purpose) {
    throw new AppError('No se pudo construir el correo OTP por parámetros incompletos.', 500);
  }

  try {
    await transporter.sendMail({
      from: `"Wallets Security" <${smtpUser}>`,
      to: userEmail,
      subject: 'Código de verificación de seguridad',
      html: buildOtpEmailHtml(otpCode, purpose),
      text: `Tu código de seguridad para ${purpose} es: ${otpCode}. Expira en 15 minutos.`,
    });
  } catch (error) {
    throw new AppError('No se pudo enviar el correo OTP en este momento.', 500, error?.message);
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendOtpEmail,
};
