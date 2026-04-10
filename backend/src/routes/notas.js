const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ==================== NOTAS ====================

// Get all notas (para admin) o mis notas
router.get('/', authenticateToken, (req, res) => {
  try {
    let notas;
    if (req.user.role === 'admin') {
      notas = req.db.all(`
        SELECT n.*, e.nombre as empresa_nombre, u.name as vendedor_nombre
        FROM notas n
        LEFT JOIN empresas e ON n.empresa_id = e.id
        LEFT JOIN users u ON n.vendedor_id = u.id
        ORDER BY n.created_at DESC
      `);
    } else {
      notas = req.db.all(`
        SELECT n.*, e.nombre as empresa_nombre
        FROM notas n
        LEFT JOIN empresas e ON n.empresa_id = e.id
        WHERE n.vendedor_id = ?
        ORDER BY n.created_at DESC
      `, [req.user.id]);
    }
    res.json(notas);
  } catch (error) {
    console.error('Get notas error:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
});

// Get notas por empresa
router.get('/empresa/:empresa_id', authenticateToken, (req, res) => {
  try {
    const { empresa_id } = req.params;
    const notas = req.db.all(`
      SELECT n.*, u.name as vendedor_nombre
      FROM notas n
      LEFT JOIN users u ON n.vendedor_id = u.id
      WHERE n.empresa_id = ?
      ORDER BY n.created_at DESC
    `, [empresa_id]);
    res.json(notas);
  } catch (error) {
    console.error('Get notas error:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
});

// Create nota
router.post('/', authenticateToken, (req, res) => {
  try {
    const { empresa_id, contenido } = req.body;
    if (!empresa_id || !contenido) {
      return res.status(400).json({ error: 'Empresa y contenido requeridos' });
    }
    
    const id = uuidv4();
    req.db.run(
      'INSERT INTO notas (id, empresa_id, vendedor_id, contenido) VALUES (?, ?, ?, ?)',
      [id, empresa_id, req.user.id, contenido]
    );
    
    res.status(201).json({ id, empresa_id, contenido });
  } catch (error) {
    console.error('Create nota error:', error);
    res.status(500).json({ error: 'Error al crear nota' });
  }
});

// Delete nota
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    req.db.run('DELETE FROM notas WHERE id = ?', [id]);
    res.json({ message: 'Nota eliminada' });
  } catch (error) {
    console.error('Delete nota error:', error);
    res.status(500).json({ error: 'Error al eliminar nota' });
  }
});

// ==================== TAREAS ====================

// Get tareas del usuario (mis tareas)
router.get('/mis-tareas', authenticateToken, (req, res) => {
  try {
    const tareas = req.db.all(`
      SELECT t.*, e.nombre as empresa_nombre
      FROM tareas t
      LEFT JOIN empresas e ON t.empresa_id = e.id
      WHERE t.vendedor_id = ?
      ORDER BY 
        CASE t.estado 
          WHEN 'pendiente' THEN 1 
          WHEN 'en_progreso' THEN 2 
          ELSE 3 
        END,
        CASE t.prioridad 
          WHEN 'alta' THEN 1 
          WHEN 'media' THEN 2 
          ELSE 3 
        END,
        t.fecha_limite ASC
    `, [req.user.id]);
    res.json(tareas);
  } catch (error) {
    console.error('Get tareas error:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Get tareas por empresa
router.get('/empresa/:empresa_id/tareas', authenticateToken, (req, res) => {
  try {
    const { empresa_id } = req.params;
    const tareas = req.db.all(`
      SELECT t.*, u.name as vendedor_nombre
      FROM tareas t
      LEFT JOIN users u ON t.vendedor_id = u.id
      WHERE t.empresa_id = ?
      ORDER BY t.created_at DESC
    `, [empresa_id]);
    res.json(tareas);
  } catch (error) {
    console.error('Get tareas error:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Create tarea
router.post('/tareas', authenticateToken, (req, res) => {
  try {
    const { empresa_id, titulo, descripcion, fecha_limite, prioridad } = req.body;
    if (!empresa_id || !titulo) {
      return res.status(400).json({ error: 'Empresa y título requeridos' });
    }
    
    const id = uuidv4();
    req.db.run(
      `INSERT INTO tareas (id, empresa_id, vendedor_id, titulo, descripcion, fecha_limite, prioridad) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, empresa_id, req.user.id, titulo, descripcion || '', fecha_limite || null, prioridad || 'media']
    );
    
    res.status(201).json({ id, empresa_id, titulo, estado: 'pendiente' });
  } catch (error) {
    console.error('Create tarea error:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

// Update tarea estado
router.put('/tareas/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, fecha_limite, prioridad, estado } = req.body;
    
    const updates = [];
    const values = [];
    
    if (titulo !== undefined) { updates.push('titulo = ?'); values.push(titulo); }
    if (descripcion !== undefined) { updates.push('descripcion = ?'); values.push(descripcion); }
    if (fecha_limite !== undefined) { updates.push('fecha_limite = ?'); values.push(fecha_limite); }
    if (prioridad !== undefined) { updates.push('prioridad = ?'); values.push(prioridad); }
    if (estado !== undefined) { updates.push('estado = ?'); values.push(estado); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);
    
    req.db.run(`UPDATE tareas SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const updated = req.db.get('SELECT * FROM tareas WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    console.error('Update tarea error:', error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

// Delete tarea
router.delete('/tareas/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    req.db.run('DELETE FROM tareas WHERE id = ?', [id]);
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error('Delete tarea error:', error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

module.exports = router;
