const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all citas (with optional filters)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id, vendedor_id, estado, fecha, estado_aprobacion } = req.query;
    
    let query = `
      SELECT ct.*, e.nombre as empresa_nombre, c.nombre as contacto_nombre, c.telefono as contacto_telefono, c.email as contacto_email, u.name as vendedor_nombre
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

    if (estado_aprobacion) {
      query += ' AND ct.estado_aprobacion = ?';
      params.push(estado_aprobacion);
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

// Get citas pendientes de aprobación (supervisor)
router.get('/pendientes-aprobacion', authenticateToken, requireRole(['admin', 'supervisor']), (req, res) => {
  try {
    const db = req.db;
    
    const query = `
      SELECT ct.*, e.nombre as empresa_nombre, c.nombre as contacto_nombre, c.telefono as contacto_telefono, c.email as contacto_email, u.name as vendedor_nombre
      FROM citas ct
      LEFT JOIN empresas e ON ct.empresa_id = e.id
      LEFT JOIN contactos c ON ct.contacto_id = c.id
      LEFT JOIN users u ON ct.vendedor_id = u.id
      WHERE ct.estado_aprobacion = 'pendiente_aprobacion'
      ORDER BY ct.created_at DESC
    `;

    const citas = db.all(query, []);
    res.json(citas);
  } catch (error) {
    console.error('Get pending approval citas error:', error);
    res.status(500).json({ error: 'Error al obtener citas pendientes' });
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
      AND ct.estado_aprobacion = 'aprobada'
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

// Create cita - vendedor crea cita pendiente de aprobación
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id, contacto_id, tipo, fecha_hora, notas, link_videollamada } = req.body;

    if (!empresa_id || !tipo || !fecha_hora) {
      return res.status(400).json({ error: 'Empresa, tipo y fecha de cita requeridos' });
    }

    // Verify empresa exists
    const empresa = db.get('SELECT id, nombre FROM empresas WHERE id = ?', [empresa_id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Generar link de Jitsi automáticamente si es videollamada y no hay link
    let meetingUrl = link_videollamada || '';
    if (tipo === 'videollamada' && !meetingUrl) {
      const meetingId = uuidv4().substring(0, 8).replace(/-/g, '');
      meetingUrl = `https://meet.jit.si/TeknaoCRM-${meetingId}`;
    }

    const id = uuidv4();

    // Create cita with pendiente_aprobacion state - NO POINTS YET
    db.run(
      `INSERT INTO citas (id, empresa_id, vendedor_id, contacto_id, tipo, fecha_hora, estado, estado_aprobacion, notas, link_videollamada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, empresa_id, req.user.id, contacto_id || null, tipo, fecha_hora, 'pendiente', 'pendiente_aprobacion', notas || '', meetingUrl]
    );

    // Update empresa estado to "cita_agendada"
    db.run(
      'UPDATE empresas SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cita_agendada', empresa_id]
    );

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'create_cita_pendiente', 'cita', id, 
        `Cita creada con ${empresa.nombre} - Tipo: ${tipo} - Esperando aprobación`]
    );

    res.status(201).json({ 
      message: 'Cita creada y pendiente de aprobación',
      id,
      estado_aprobacion: 'pendiente_aprobacion'
    });
  } catch (error) {
    console.error('Create cita error:', error);
    res.status(500).json({ error: 'Error al agendar cita' });
  }
});

// Aprobar cita - supervisor
router.post('/:id/aprobar', authenticateToken, requireRole(['admin', 'supervisor']), (req, res) => {
  try {
    const db = req.db;
    const { nota } = req.body;

    const existing = db.get('SELECT * FROM citas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (existing.estado_aprobacion !== 'pendiente_aprobacion') {
      return res.status(400).json({ error: 'Esta cita ya fue procesada' });
    }

    // Update cita as approved
    db.run(
      `UPDATE citas SET estado_aprobacion = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, approval_note = ? WHERE id = ?`,
      ['aprobada', req.user.id, nota || '', req.params.id]
    );

    // Add +10 points to vendedor
    db.run('UPDATE users SET puntos = puntos + 10 WHERE id = ?', [existing.vendedor_id]);

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'approve_cita', 'cita', req.params.id, 
        `Cita aprobada por supervisor - Puntos: +10 al vendedor`]
    );

    const vendedor = db.get('SELECT name, puntos FROM users WHERE id = ?', [existing.vendedor_id]);

    res.json({ 
      message: 'Cita aprobada',
      puntos_vendedor: vendedor.puntos
    });
  } catch (error) {
    console.error('Approve cita error:', error);
    res.status(500).json({ error: 'Error al aprobar cita' });
  }
});

// Rechazar cita - supervisor
router.post('/:id/rechazar', authenticateToken, requireRole(['admin', 'supervisor']), (req, res) => {
  try {
    const db = req.db;
    const { nota } = req.body;

    const existing = db.get('SELECT * FROM citas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (existing.estado_aprobacion !== 'pendiente_aprobacion') {
      return res.status(400).json({ error: 'Esta cita ya fue procesada' });
    }

    // Update cita as rejected
    db.run(
      `UPDATE citas SET estado_aprobacion = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, approval_note = ? WHERE id = ?`,
      ['rechazada', req.user.id, nota || '', req.params.id]
    );

    // Log activity - NO POINTS for rejected
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'reject_cita', 'cita', req.params.id, 
        `Cita rechazada por supervisor - Sin puntos`]
    );

    res.json({ 
      message: 'Cita rechazada',
      puntos_concedidos: 0
    });
  } catch (error) {
    console.error('Reject cita error:', error);
    res.status(500).json({ error: 'Error al rechazar cita' });
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
      // Only give completion points if cita was approved
      if (existing.estado_aprobacion === 'aprobada') {
        db.run('UPDATE users SET puntos = puntos + 5 WHERE id = ?', [existing.vendedor_id]);
        
        db.run(
          `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), existing.vendedor_id, 'complete_cita', 'cita', req.params.id, 'Cita completada - Puntos: +5']
        );
      }
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

    // Only delete if not yet approved (no points to revert)
    if (existing.estado_aprobacion === 'aprobada') {
      // Reverse 10 puntos that were awarded when cita was approved (don't go below 0)
      const usuario = db.get('SELECT puntos FROM users WHERE id = ?', [existing.vendedor_id]);
      const puntosReales = Math.min(10, usuario.puntos);
      if (puntosReales > 0) {
        db.run('UPDATE users SET puntos = puntos - ? WHERE id = ?', [puntosReales, existing.vendedor_id]);
      }
    }
    
    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'delete_cita', 'cita', req.params.id, `Cita eliminada`]
    );

    db.run('DELETE FROM citas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cita eliminada' });
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

    // Citas by estado_aprobacion
    const porAprobacion = db.all(`SELECT estado_aprobacion, COUNT(*) as count FROM citas GROUP BY estado_aprobacion`);

    // Citas today
    const citasHoy = db.get(
      `SELECT COUNT(*) as count FROM citas WHERE fecha_hora LIKE ?`,
      [today + '%']
    );

    // Pending approval count
    const pendientes = db.get(
      `SELECT COUNT(*) as count FROM citas WHERE estado_aprobacion = 'pendiente_aprobacion'`
    );

    res.json({
      total_mes: citasMes.count,
      hoy: citasHoy.count,
      pendientes_aprobacion: pendientes.count,
      por_estado: porEstado,
      por_aprobacion: porAprobacion
    });
  } catch (error) {
    console.error('Get cita stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de citas' });
  }
});

module.exports = router;
