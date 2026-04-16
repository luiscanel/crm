const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { getSettings, sendEmail, sendEmailWithTemplate } = require('../services/email');

const router = express.Router();

// Get all citas (with optional filters)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id, vendedor_id, estado, fecha } = req.query;
    
    let query = `
      SELECT ct.*, e.nombre as empresa_nombre, c.nombre as contacto_nombre, u.name as vendedor_nombre
      FROM citas ct
      LEFT JOIN empresas e ON ct.empresa_id = e.id
      LEFT JOIN contactos c ON ct.contacto_id = c.id
      LEFT JOIN users u ON ct.vendedor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'vendedor') {
      query += ' AND ct.vendedor_id = ?';
      params.push(req.user.id);
    } else if (vendedor_id) {
      query += ' AND ct.vendedor_id = ?';
      params.push(vendedor_id);
    }

    if (empresa_id) {
      query += ' AND ct.empresa_id = ?';
      params.push(empresa_id);
    }

    if (estado) {
      query += ' AND ct.estado = ?';
      params.push(estado);
    }

    if (fecha) {
      query += ' AND ct.fecha_hora LIKE ?';
      params.push(fecha + '%');
    }

    query += ' ORDER BY ct.fecha_hora ASC';

    const citas = db.all(query, params);
    res.json(citas);
  } catch (error) {
    console.error('Get citas error:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// Get upcoming citas (next 7 days)
router.get('/upcoming', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = `
      SELECT ct.*, e.nombre as empresa_nombre, c.nombre as contacto_nombre
      FROM citas ct
      LEFT JOIN empresas e ON ct.empresa_id = e.id
      LEFT JOIN contactos c ON ct.contacto_id = c.id
      WHERE ct.estado = 'pendiente' 
      AND ct.fecha_hora BETWEEN ? AND ?
    `;
    const params = [today + ' 00:00:00', nextWeek + ' 23:59:59'];

    if (req.user.role === 'vendedor') {
      query += ' AND ct.vendedor_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY ct.fecha_hora ASC';

    const citas = db.all(query, params);
    res.json(citas);
  } catch (error) {
    console.error('Get upcoming citas error:', error);
    res.status(500).json({ error: 'Error al obtener citas próximas' });
  }
});

// Create cita
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const { empresa_id, contacto_id, tipo, fecha_hora, notas, link_videollamada, enviar_correo } = req.body;

    if (!empresa_id || !tipo || !fecha_hora) {
      return res.status(400).json({ error: 'Empresa, tipo y fecha de cita requeridos' });
    }

    // Verify empresa exists
    const empresa = db.get('SELECT id, nombre FROM empresas WHERE id = ?', [empresa_id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Get contacto info if provided
    let contacto = null;
    let contactoEmail = null;
    if (contacto_id) {
      contacto = db.get('SELECT nombre, email FROM contactos WHERE id = ?', [contacto_id]);
      contactoEmail = contacto?.email;
    }

    // Generar link de Jitsi automáticamente si es videollamada y no hay link
    let meetingUrl = link_videollamada || '';
    if (tipo === 'videollamada' && !meetingUrl) {
      const meetingId = uuidv4().substring(0, 8).replace(/-/g, '');
      meetingUrl = `https://meet.jit.si/TeknaoCRM-${meetingId}`;
    }

    const id = uuidv4();

    db.run(
      `INSERT INTO citas (id, empresa_id, vendedor_id, contacto_id, tipo, fecha_hora, estado, notas, link_videollamada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, empresa_id, req.user.id, contacto_id || null, tipo, fecha_hora, 'pendiente', notas || '', meetingUrl]
    );

    // Check if empresa already had a pending cita - only award points if this is the FIRST cita
    const empresaActual = db.get('SELECT estado FROM empresas WHERE id = ?', [empresa_id]);
    const citaPrevia = db.get('SELECT id FROM citas WHERE empresa_id = ? AND estado = ?', [empresa_id, 'pendiente']);
    
    // Only give points if: empresa was NOT already in cita_agendada AND no previous pending cita
    if (empresaActual.estado !== 'cita_agendada' && !citaPrevia) {
      db.run('UPDATE users SET puntos = puntos + 10 WHERE id = ?', [req.user.id]);
    }

    // Update empresa estado to "cita_agendada"
    db.run(
      'UPDATE empresas SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cita_agendada', empresa_id]
    );

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'create_cita', 'cita', id, 
        `Scheduled cita with ${empresa.nombre} - Tipo: ${tipo} - Puntos: +10`]
    );

    // Send email if requested
    let emailSent = false;
    let emailError = null;
    if (enviar_correo && contactoEmail) {
      console.log('[CITA EMAIL] Sending email to:', contactoEmail);
      console.log('[CITA EMAIL] Enviar correo:', enviar_correo);
      try {
        const settings = getSettings(db);
        console.log('[CITA EMAIL] Settings loaded:', {
          smtp_host: settings.smtp_host ? 'set' : 'missing',
          smtp_user: settings.smtp_user ? 'set' : 'missing',
          smtp_password: settings.smtp_password ? 'set' : 'missing',
          smtp_from_email: settings.smtp_from_email
        });
        
        if (settings.smtp_host && settings.smtp_user && settings.smtp_password) {
          const fechaObj = new Date(fecha_hora);
          const fechaFormateada = fechaObj.toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const horaFormateada = fechaObj.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
          
          console.log('[CITA EMAIL] About to send email...');
          
          await sendEmail(
            settings,
            contactoEmail,
            `📅 Cita agendada - ${empresa.nombre}`,
            `
              <h2>📅 Confirmación de Cita</h2>
              <p>Hola <strong>${contacto.nombre}</strong>,</p>
              <p>Se ha agendado una cita con <strong>${empresa.nombre}</strong>.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
                <p><strong>⏰ Hora:</strong> ${horaFormateada}</p>
                <p><strong>🏢 Empresa:</strong> ${empresa.nombre}</p>
                <p><strong>📋 Tipo:</strong> ${tipo === 'videollamada' ? 'Videollamada' : tipo === 'presencial' ? 'Presencial' : 'Llamada telefónica'}</p>
                ${notas ? `<p><strong>📝 Notas:</strong> ${notas}</p>` : ''}
                ${meetingUrl ? `<p><strong>🔗 Enlace:</strong> <a href="${meetingUrl}">${meetingUrl}</a></p>` : ''}
              </div>
              <p>Saludos,<br>Equipo Teknao CRM</p>
            `
          );
          emailSent = true;
          console.log('[CITA EMAIL] Email sent successfully!');
        } else {
          emailError = 'SMTP no configurado';
          console.log('[CITA EMAIL] SMTP not configured');
        }
      } catch (err) {
        console.error('[CITA EMAIL] Error sending cita email:', err);
        emailError = err.message;
      }
    }

    const userUpdated = db.get('SELECT puntos FROM users WHERE id = ?', [req.user.id]);

    res.status(201).json({ 
      message: 'Cita agendada', 
      id,
      puntos_totales: userUpdated.puntos,
      email_sent: emailSent,
      email_error: emailError
    });
  } catch (error) {
    console.error('Create cita error:', error);
    res.status(500).json({ error: 'Error al agendar cita' });
  }
});

// Update cita
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { tipo, fecha_hora, estado, notas, link_videollamada } = req.body;

    const existing = db.get('SELECT * FROM citas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Generar link Jitsi si se cambia a videollamada y no hay link
    let newMeetingUrl = existing.link_videollamada;
    if (tipo === 'videollamada' && !existing.link_videollamada) {
      const meetingId = uuidv4().substring(0, 8).replace(/-/g, '');
      newMeetingUrl = `https://meet.jit.si/TeknaoCRM-${meetingId}`;
    } else if (link_videollamada !== undefined) {
      newMeetingUrl = link_videollamada;
    }

    db.run(`
      UPDATE citas 
      SET tipo = COALESCE(?, tipo),
          fecha_hora = COALESCE(?, fecha_hora),
          estado = COALESCE(?, estado),
          notas = COALESCE(?, notas),
          link_videollamada = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [tipo, fecha_hora, estado, notas, newMeetingUrl, req.params.id]);

    // If cita completed, assign extra points
    if (estado === 'realizada' && existing.estado !== 'realizada') {
      db.run('UPDATE users SET puntos = puntos + 5 WHERE id = ?', [req.user.id]);
      
      db.run(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), req.user.id, 'complete_cita', 'cita', req.params.id, 'Cita completada - Puntos: +5']
      );
    }

    res.json({ message: 'Cita actualizada' });
  } catch (error) {
    console.error('Update cita error:', error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// Delete cita
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const existing = db.get('SELECT * FROM citas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Reverse 10 puntos that were awarded when cita was created (don't go below 0)
    const usuario = db.get('SELECT puntos FROM users WHERE id = ?', [existing.vendedor_id]);
    const puntosReales = Math.min(10, usuario.puntos);
    if (puntosReales > 0) {
      db.run('UPDATE users SET puntos = puntos - ? WHERE id = ?', [puntosReales, existing.vendedor_id]);
    }
    
    // Log activity
    const { v4: uuidv4 } = require('uuid');
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'delete_cita', 'cita', req.params.id, `Deleted cita (-10 puntos revertidos)`]
    );

    db.run('DELETE FROM citas WHERE id = ?', [req.params.id]);

    res.json({ message: 'Cita eliminada', puntos_revertidos: 10 });
  } catch (error) {
    console.error('Delete cita error:', error);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
});

// Get cita stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // Citas this month
    const citasMes = db.get(
      `SELECT COUNT(*) as count FROM citas WHERE fecha_hora >= ?`,
      [startOfMonth + ' 00:00:00']
    );

    // Citas by estado
    const porEstado = db.all(`SELECT estado, COUNT(*) as count FROM citas GROUP BY estado`);

    // Citas today
    const citasHoy = db.get(
      `SELECT COUNT(*) as count FROM citas WHERE fecha_hora LIKE ?`,
      [today + '%']
    );

    res.json({
      total_mes: citasMes.count,
      hoy: citasHoy.count,
      por_estado: porEstado
    });
  } catch (error) {
    console.error('Get cita stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de citas' });
  }
});

module.exports = router;