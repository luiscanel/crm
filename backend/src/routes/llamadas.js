const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all llamadas (with optional filters)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id, vendedor_id, fecha, estado } = req.query;
    
    let query = `
      SELECT l.*, e.nombre as empresa_nombre, c.nombre as contacto_nombre, u.name as vendedor_nombre
      FROM llamadas l
      LEFT JOIN empresas e ON l.empresa_id = e.id
      LEFT JOIN contactos c ON l.contacto_id = c.id
      LEFT JOIN users u ON l.vendedor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'vendedor') {
      query += ' AND l.vendedor_id = ?';
      params.push(req.user.id);
    } else if (vendedor_id) {
      query += ' AND l.vendedor_id = ?';
      params.push(vendedor_id);
    }

    if (empresa_id) {
      query += ' AND l.empresa_id = ?';
      params.push(empresa_id);
    }

    if (fecha) {
      query += ' AND l.fecha_llamada LIKE ?';
      params.push(fecha);
    }

    if (estado) {
      query += ' AND l.estado = ?';
      params.push(estado);
    }

    query += ' ORDER BY l.fecha_llamada DESC';

    const llamadas = db.all(query, params);
    res.json(llamadas);
  } catch (error) {
    console.error('Get llamadas error:', error);
    res.status(500).json({ error: 'Error al obtener llamadas' });
  }
});

// Create llamada
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id, contacto_id, estado, observaciones } = req.body;

    if (!empresa_id || !estado) {
      return res.status(400).json({ error: 'Empresa y estado de llamada requeridos' });
    }

    // Validate empresa exists
    const empresa = db.get('SELECT * FROM empresas WHERE id = ?', [empresa_id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Check if call already made to same empresa today (duplicate check)
    const today = new Date().toISOString().split('T')[0];
    const existingCallToday = db.get(
      `SELECT id FROM llamadas WHERE empresa_id = ? AND vendedor_id = ? AND fecha_llamada LIKE ?`,
      [empresa_id, req.user.id, today + '%']
    );

    // Allow multiple calls but flag as duplicate for metrics
    const esDuplicada = !!existingCallToday;

    const id = uuidv4();
    const esEfectivo = ['interesado', 'llamada_efectiva'].includes(estado);

    db.run(
      `INSERT INTO llamadas (id, empresa_id, contacto_id, vendedor_id, estado, observaciones, es_contacto_efectivo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, empresa_id, contacto_id || null, req.user.id, estado, observaciones || '', esEfectivo ? 1 : 0]
    );

    // Assign points based on call type
    let puntosGanados = 1; // Base point for any call
    
    if (esEfectivo) {
      puntosGanados += 3; // Contact effective
    }
    
    if (estado === 'interesado') {
      puntosGanados += 2; // Extra for interested
    }

    // Update user points
    db.run('UPDATE users SET puntos = puntos + ? WHERE id = ?', [puntosGanados, req.user.id]);

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'create_llamada', 'llamada', id, 
        `Call to ${empresa.nombre} - Estado: ${estado} - Puntos: +${puntosGanados}`]
    );

    // Update empresa estado based on call
    let nuevoEstadoEmpresa = empresa.estado;
    if (estado === 'interesado' && ['nuevo', 'contactado'].includes(empresa.estado)) {
      nuevoEstadoEmpresa = 'interesado';
    } else if (estado === 'llamada_efectiva' && empresa.estado === 'nuevo') {
      nuevoEstadoEmpresa = 'contactado';
    }
    
    if (nuevoEstadoEmpresa !== empresa.estado) {
      db.run(
        'UPDATE empresas SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nuevoEstadoEmpresa, empresa_id]
      );
    }

    // Update vendedor points in response
    const userUpdated = db.get('SELECT puntos FROM users WHERE id = ?', [req.user.id]);

    res.status(201).json({ 
      message: 'Llamada registrada', 
      id, 
      puntos_ganados: puntosGanados,
      puntos_totales: userUpdated.puntos,
      es_duplicada: esDuplicada
    });
  } catch (error) {
    console.error('Create llamada error:', error);
    res.status(500).json({ error: 'Error al registrar llamada' });
  }
});

// Get daily stats for current user
router.get('/stats/daily', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const today = new Date().toISOString().split('T')[0];
    
    // Total calls today
    const llamadasHoy = db.get(
      `SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?`,
      [req.user.id, today + '%']
    );

    // Unique empresas contacted today
    const empresasUnicasHoy = db.get(
      `SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?`,
      [req.user.id, today + '%']
    );

    // Calls by estado
    const porEstado = db.all(
      `SELECT estado, COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ? GROUP BY estado`,
      [req.user.id, today + '%']
    );

    // Get goals from retos table
    const metaDiaria = db.get("SELECT meta FROM retos WHERE tipo = 'diario' AND activo = 1 ORDER BY created_at DESC LIMIT 1");
    const metaLlamadas = metaDiaria?.meta || 25;
    const metaEmpresas = metaLlamadas; // Same target for both

    res.json({
      llamadas_hoy: llamadasHoy.count,
      empresas_unicas_hoy: empresasUnicasHoy.count,
      meta_llamadas: metaLlamadas,
      meta_empresas: metaEmpresas,
      progreso_llamadas: Math.min(llamadasHoy.count / metaLlamadas * 100, 100),
      progreso_empresas: Math.min(empresasUnicasHoy.count / metaEmpresas * 100, 100),
      por_estado: porEstado
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas diarias' });
  }
});

// Get calls for chart (last 7 days)
router.get('/stats/week', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const calls = db.get(
        `SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?`,
        [req.user.id, date + '%']
      );
      
      const uniqueEmpresas = db.get(
        `SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?`,
        [req.user.id, date + '%']
      );

      days.push({
        fecha: date,
        llamadas: calls.count,
        empresas_unicas: uniqueEmpresas.count
      });
    }

    res.json(days);
  } catch (error) {
    console.error('Get week stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas semanales' });
  }
});

// Delete call (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    // Only admin can delete calls
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo el admin puede eliminar llamadas' });
    }
    
    const db = req.db;
    const { id } = req.params;
    
    // Check if call exists
    const llamada = db.get('SELECT * FROM llamadas WHERE id = ?', [id]);
    if (!llamada) {
      return res.status(404).json({ error: 'Llamada no encontrada' });
    }
    
    // Get the puntos that were awarded to reverse them
    let puntosAActualizar = 1;
    if (llamada.es_contacto_efectivo) {
      puntosAActualizar += 3;
    }
    
    // Get empresa estado to check if was interesado
    const empresa = db.get('SELECT estado FROM empresas WHERE id = ?', [llamada.empresa_id]);
    if (empresa && empresa.estado === 'interesado') {
      puntosAActualizar += 2;
    }
    
    // Delete the call
    db.run('DELETE FROM llamadas WHERE id = ?', [id]);
    
    // Reverse the puntos (only if user still has them, don't go below 0)
    const usuario = db.get('SELECT puntos FROM users WHERE id = ?', [llamada.vendedor_id]);
    const puntosReales = Math.min(puntosAActualizar, usuario.puntos);
    if (puntosReales > 0) {
      db.run('UPDATE users SET puntos = puntos - ? WHERE id = ?', [puntosReales, llamada.vendedor_id]);
    }
    
    // Log activity
    const { v4: uuidv4 } = require('uuid');
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'delete_llamada', 'llamada', id, `Eliminó llamada ID: ${id} (-${puntosAActualizar} puntos revertidos)`]
    );
    
    res.json({ message: 'Llamada eliminada', puntos_revertidos: puntosAActualizar });
  } catch (error) {
    console.error('Delete call error:', error);
    res.status(500).json({ error: 'Error al eliminar llamada' });
  }
});

module.exports = router;