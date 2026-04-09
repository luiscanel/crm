const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all empresas (with optional filters)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { estado, vendedor_id, search, fecha_desde, fecha_hasta } = req.query;
    
    let query = `
      SELECT e.*, 
        (SELECT COUNT(*) FROM llamadas WHERE empresa_id = e.id) as total_llamadas,
        (SELECT COUNT(*) FROM llamadas WHERE empresa_id = e.id AND fecha_llamada LIKE DATE('now') || '%') as llamadas_hoy
      FROM empresas e
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'vendedor') {
      query += ' AND e.vendedor_id = ?';
      params.push(req.user.id);
    } else if (vendedor_id) {
      query += ' AND e.vendedor_id = ?';
      params.push(vendedor_id);
    }

    if (estado) {
      query += ' AND e.estado = ?';
      params.push(estado);
    }

    if (search) {
      query += ' AND (e.nombre LIKE ? OR e.industria LIKE ? OR e.ubicacion LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (fecha_desde) {
      query += ' AND DATE(e.created_at) >= ?';
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      query += ' AND DATE(e.created_at) <= ?';
      params.push(fecha_hasta);
    }

    query += ' ORDER BY e.created_at DESC';

    const empresas = db.all(query, params);
    res.json(empresas);
  } catch (error) {
    console.error('Get empresas error:', error);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
});

// Get single empresa
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const empresa = db.get('SELECT * FROM empresas WHERE id = ?', [req.params.id]);
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Get contactos
    const contactos = db.all('SELECT * FROM contactos WHERE empresa_id = ?', [req.params.id]);
    
    // Get llamadas
    const llamadas = db.all(`
      SELECT l.*, c.nombre as contacto_nombre
      FROM llamadas l
      LEFT JOIN contactos c ON l.contacto_id = c.id
      WHERE l.empresa_id = ?
      ORDER BY l.fecha_llamada DESC
    `, [req.params.id]);

    // Get citas
    const citas = db.all(`
      SELECT ct.*, c.nombre as contacto_nombre
      FROM citas ct
      LEFT JOIN contactos c ON ct.contacto_id = c.id
      WHERE ct.empresa_id = ?
      ORDER BY ct.fecha_hora DESC
    `, [req.params.id]);

    // Get notas
    const notas = db.all(`
      SELECT n.*, u.name as vendedor_nombre
      FROM notas n
      LEFT JOIN users u ON n.vendedor_id = u.id
      WHERE n.empresa_id = ?
      ORDER BY n.created_at DESC
    `, [req.params.id]);

    // Get tareas
    const tareas = db.all(`
      SELECT t.*, u.name as vendedor_nombre
      FROM tareas t
      LEFT JOIN users u ON t.vendedor_id = u.id
      WHERE t.empresa_id = ?
      ORDER BY t.created_at DESC
    `, [req.params.id]);

    res.json({ ...empresa, contactos, llamadas, citas, notas, tareas });
  } catch (error) {
    console.error('Get empresa error:', error);
    res.status(500).json({ error: 'Error al obtener empresa' });
  }
});

// Create empresa
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { nombre, industria, tamano, ubicacion, telefono, vendedor_id } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre de empresa requerido' });
    }

    const id = uuidv4();
    const assignedVendedor = req.user.role === 'vendedor' ? req.user.id : (vendedor_id || req.user.id);

    db.run(
      `INSERT INTO empresas (id, nombre, industria, tamano, ubicacion, telefono, estado, vendedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nombre, industria || '', tamano || '', ubicacion || '', telefono || '', 'nuevo', assignedVendedor]
    );

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'create_empresa', 'empresa', id, `Created empresa: ${nombre}`]
    );

    res.status(201).json({ message: 'Empresa creada', id });
  } catch (error) {
    console.error('Create empresa error:', error);
    res.status(500).json({ error: 'Error al crear empresa' });
  }
});

// Update empresa
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { nombre, industria, tamano, ubicacion, telefono, estado, vendedor_id, fecha_cita, tipo_cita, notas_cita, fecha_seguimiento } = req.body;

    const existing = db.get('SELECT * FROM empresas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Check if changing to cita_agendada
    const isChangingToCitaAgendada = estado === 'cita_agendada' && existing.estado !== 'cita_agendada';

    db.run(`
      UPDATE empresas 
      SET nombre = COALESCE(?, nombre),
          industria = COALESCE(?, industria),
          tamano = COALESCE(?, tamano),
          ubicacion = COALESCE(?, ubicacion),
          telefono = COALESCE(?, telefono),
          estado = COALESCE(?, estado),
          vendedor_id = COALESCE(?, vendedor_id),
          fecha_seguimiento = COALESCE(?, fecha_seguimiento),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nombre, industria, tamano, ubicacion, telefono, estado, vendedor_id, fecha_seguimiento, req.params.id]);

    // Auto-create cita when state changes to cita_agendada
    if (isChangingToCitaAgendada && fecha_cita) {
      const { v4: uuidv4 } = require('uuid');
      const citaId = uuidv4();
      
      db.run(
        `INSERT INTO citas (id, empresa_id, tipo, fecha_hora, estado, notas, vendedor_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [citaId, req.params.id, tipo_cita || 'reunion', fecha_cita, 'pendiente', notas_cita || 'Cita agendada desde empresa', req.user.id]
      );
      
      // Award puntos for cita from empresa
      db.run('UPDATE users SET puntos = puntos + 10 WHERE id = ?', [req.user.id]);
      
      // Log
      db.run(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), req.user.id, 'create_cita', 'cita', citaId, `Cita automática creada para empresa ${nombre || existing.nombre} (+10 puntos)`]
      );
    }

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'update_empresa', 'empresa', req.params.id, `Updated empresa: ${nombre || existing.nombre}`]
    );

    res.json({ message: 'Empresa actualizada' });
  } catch (error) {
    console.error('Update empresa error:', error);
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
});

// Delete empresa
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;

    // Only admin/supervisor can delete
    if (req.user.role === 'vendedor') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar empresas' });
    }

    const existing = db.get('SELECT * FROM empresas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Get calls associated with this empresa to reverse puntos
    const llamadas = db.all('SELECT * FROM llamadas WHERE empresa_id = ?', [req.params.id]);
    
    let puntosARevertir = 0;
    
    // Reverse puntos for each call
    for (const llamada of llamadas) {
      puntosARevertir += 1; // Base point per call
      if (llamada.es_contacto_efectivo) {
        puntosARevertir += 3; // Contact effective points
      }
    }
    
    // Reverse 5 puntos if empresa was interested
    if (existing.estado === 'interesado') {
      puntosARevertir += 5;
    }
    
    // Reverse 10 puntos if empresa was in cita_agendada (the cita gave +10 puntos)
    if (existing.estado === 'cita_agendada') {
      puntosARevertir += 10;
    }
    
    // Delete empresa (this will cascade to llamadas)
    db.run('DELETE FROM empresas WHERE id = ?', [req.params.id]);
    
    // Reverse puntos if any were awarded
    if (puntosARevertir > 0) {
      db.run('UPDATE users SET puntos = puntos - ? WHERE id = ?', [puntosARevertir, existing.vendedor_id]);
    }

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'delete_empresa', 'empresa', req.params.id, `Deleted empresa: ${existing.nombre} (-${puntosARevertir} puntos revertidos)`]
    );

    res.json({ message: 'Empresa eliminada', puntos_revertidos: puntosARevertir });
  } catch (error) {
    console.error('Delete empresa error:', error);
    res.status(500).json({ error: 'Error al eliminar empresa' });
  }
});

// Get empresa statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const today = new Date().toISOString().split('T')[0];
    
    // Total empresas
    const totalEmpresas = db.get('SELECT COUNT(*) as count FROM empresas');
    
    // Empresas por estado
    const porEstado = db.all(`SELECT estado, COUNT(*) as count FROM empresas GROUP BY estado`);

    // Empresas contactadas hoy
    const contactadasHoy = db.get(
      `SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE fecha_llamada LIKE ?`,
      [today + '%']
    );

    // Empresas nuevo estado
    const nuevos = db.get("SELECT COUNT(*) as count FROM empresas WHERE estado = 'nuevo'");

    res.json({
      total: totalEmpresas.count,
      porEstado,
      contactadasHoy: contactadasHoy.count,
      nuevos: nuevos.count
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;