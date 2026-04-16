const express = require('express');
const router = express.Router();
const { testConnection, getSettings } = require('../services/email');

// POST - Test SMTP connection
router.post('/test-email', async (req, res) => {
  try {
    const db = req.db;
    const settings = getSettings(db);
    
    // Validate required fields
    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Configuración SMTP incompleta. Por favor completa todos los campos.' 
      });
    }
    
    // Test connection
    const result = await testConnection(settings);
    
    res.json(result);
  } catch (error) {
    console.error('Error testing SMTP:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al conectar con el servidor SMTP' 
    });
  }
});

// POST - Send test email
router.post('/send-test-email', async (req, res) => {
  try {
    const db = req.db;
    const { email } = req.body;
    const settings = getSettings(db);
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email de destino requerido' 
      });
    }
    
    // Send test email
    const result = await sendEmail(
      settings,
      email,
      'Prueba de configuración - Teknao CRM',
      `
        <h2>✅ Prueba de Configuración</h2>
        <p>Este es un correo de prueba para verificar la configuración SMTP del CRM.</p>
        <p>Si recibes este mensaje, la configuración está funcionando correctamente.</p>
        <p>Saludos,<br>Equipo Teknao CRM</p>
      `
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al enviar correo de prueba' 
    });
  }
});

module.exports = router;
