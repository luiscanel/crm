const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all tareas for current user
router.get('/mis-tareas', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { estado } = req.query;
    
    let query = `
      SELECT t.*, e.nombre as empresa_nombre 
      FROM tareas t 
      LEFT JOIN empresas e ON t.empresa_id = e.id 
      WHERE t.vendedor_id = ?
    `;
    const params = [req.user.id];
    
    if (estado) {
      query += ' AND t.estado = ?';
      params.push(estado);
    }
    
    query += ' ORDER BY t.fecha_limite ASC';
    
    const tareas = db.all(query, params);
    res.json(tareas);
  } catch (error) {
    console.error('Get tareas error:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Get tareas by empresa
router.get('/empresa/:empresaId', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    
    const tareas = db.all(
      'SELECT * FROM tareas WHERE empresa_id = ? ORDER BY fecha_limite ASC',
      [req.params.empresaId]
    );
    res.json(tareas);
  } catch (error) {
    console.error('Get tareas error:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Create tarea
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id, titulo, descripcion, fecha_limite, prioridad } = req.body;
    
    const id = uuidv4();
    
    db.run(
      `INSERT INTO tareas (id, vendedor_id, empresa_id, titulo, descripcion, fecha_limite, prioridad, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [id, req.user.id, empresa_id, titulo, descripcion || '', fecha_limite || null, prioridad || 'media']
    );
    
    const tarea = db.get('SELECT * FROM tareas WHERE id = ?', [id]);
    res.json(tarea);
  } catch (error) {
    console.error('Create tarea error:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

// Update tarea
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { titulo, descripcion, fecha_limite, prioridad, estado } = req.body;
    
    const existing = db.get('SELECT * FROM tareas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Only owner can update
    if (existing.vendedor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    db.run(
      `UPDATE tareas SET titulo = ?, descripcion = ?, fecha_limite = ?, prioridad = ?, estado = ? WHERE id = ?`,
      [titulo || existing.titulo, descripcion || existing.descripcion, fecha_limite || existing.fecha_limite, prioridad || existing.prioridad, estado || existing.estado, req.params.id]
    );
    
    const tarea = db.get('SELECT * FROM tareas WHERE id = ?', [req.params.id]);
    res.json(tarea);
  } catch (error) {
    console.error('Update tarea error:', error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

// Delete tarea
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    
    const existing = db.get('SELECT * FROM tareas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Only owner or admin can delete
    if (existing.vendedor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    
    db.run('DELETE FROM tareas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error('Delete tarea error:', error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

module.exports = router;
