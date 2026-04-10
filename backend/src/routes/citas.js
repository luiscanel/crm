const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

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

    const id = uuidv4();

    db.run(
      `INSERT INTO citas (id, empresa_id, vendedor_id, contacto_id, tipo, fecha_hora, estado, notas, link_videollamada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, empresa_id, req.user.id, contacto_id || null, tipo, fecha_hora, 'pendiente', notas || '', link_videollamada || '']
    );

    // Assign points for scheduling cita (+10 points)
    db.run('UPDATE users SET puntos = puntos + 10 WHERE id = ?', [req.user.id]);

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

    const userUpdated = db.get('SELECT puntos FROM users WHERE id = ?', [req.user.id]);

    res.status(201).json({ 
      message: 'Cita agendada', 
      id,
      puntos_totales: userUpdated.puntos
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
    const { tipo, fecha_hora, estado, notas } = req.body;

    const existing = db.get('SELECT * FROM citas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    db.run(`
      UPDATE citas 
      SET tipo = COALESCE(?, tipo),
          fecha_hora = COALESCE(?, fecha_hora),
          estado = COALESCE(?, estado),
          notas = COALESCE(?, notas),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [tipo, fecha_hora, estado, notas, req.params.id]);

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

    // Reverse 10 puntos that were awarded when cita was created
    db.run('UPDATE users SET puntos = puntos - 10 WHERE id = ?', [existing.vendedor_id]);
    
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