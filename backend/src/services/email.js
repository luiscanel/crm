const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Get settings from database
function getSettings(db) {
  const settings = db.all('SELECT key, value FROM settings');
  const result = {};
  settings.forEach(s => {
    result[s.key] = s.value;
  });
  return result;
}

// Create transporter based on settings
function createTransporter(settings) {
  if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
    throw new Error('Configuración SMTP incompleta');
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: parseInt(settings.smtp_port) || 587,
    secure: settings.smtp_port === '465',
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_password
    }
  });

  return transporter;
}

// Test SMTP connection
async function testConnection(settings) {
  const transporter = createTransporter(settings);
  
  // Verify connection
  await transporter.verify();
  
  return { success: true, message: 'Conexión exitosa con el servidor SMTP' };
}

// Send email
async function sendEmail(settings, to, subject, html) {
  const transporter = createTransporter(settings);
  
  const mailOptions = {
    from: `"${settings.smtp_from_name || 'Teknao CRM'}" <${settings.smtp_from_email || settings.smtp_user}>`,
    to: to,
    subject: subject,
    html: html
  };
  
  const info = await transporter.sendMail(mailOptions);
  
  return { success: true, messageId: info.messageId };
}

// Send email with template
async function sendEmailWithTemplate(settings, to, subject, templateName, data) {
  const templates = {
    cita_confirmada: `
      <h2>📅 Cita Confirmada</h2>
      <p>Hola <strong>${data.nombre}</strong>,</p>
      <p>Tu cita ha sido confirmada para:</p>
      <ul>
        <li><strong>Fecha:</strong> ${data.fecha}</li>
        <li><strong>Hora:</strong> ${data.hora}</li>
        <li><strong>Empresa:</strong> ${data.empresa}</li>
      </ul>
      <p>${data.notas ? `<strong>Notas:</strong> ${data.notas}` : ''}</p>
      <p>Saludos,<br>Equipo Teknao CRM</p>
    `,
    cita_recordatorio: `
      <h2>🔔 Recordatorio de Cita</h2>
      <p>Hola <strong>${data.nombre}</strong>,</p>
      <p>Te recordamos que tienes una cita pronto:</p>
      <ul>
        <li><strong>Fecha:</strong> ${data.fecha}</li>
        <li><strong>Hora:</strong> ${data.hora}</li>
        <li><strong>Empresa:</strong> ${data.empresa}</li>
      </ul>
      <p>Saludos,<br>Equipo Teknao CRM</p>
    `,
    cita_cancelada: `
      <h2>❌ Cita Cancelada</h2>
      <p>Hola <strong>${data.nombre}</strong>,</p>
      <p>Tu cita ha sido cancelada:</p>
      <ul>
        <li><strong>Fecha:</strong> ${data.fecha}</li>
        <li><strong>Empresa:</strong> ${data.empresa}</li>
      </ul>
      <p>${data.motivo ? `<strong>Motivo:</strong> ${data.motivo}` : ''}</p>
      <p>Saludos,<br>Equipo Teknao CRM</p>
    `
  };

  const html = templates[templateName] || data.customHtml;
  
  return sendEmail(settings, to, subject, html);
}

module.exports = {
  getSettings,
  createTransporter,
  testConnection,
  sendEmail,
  sendEmailWithTemplate
};
