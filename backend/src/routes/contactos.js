const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all contactos (optionally by empresa)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id } = req.query;
    
    let query = 'SELECT c.*, e.nombre as empresa_nombre FROM contactos c LEFT JOIN empresas e ON c.empresa_id = e.id WHERE 1=1';
    const params = [];

    if (empresa_id) {
      query += ' AND c.empresa_id = ?';
      params.push(empresa_id);
    }

    query += ' ORDER BY c.created_at DESC';

    const contactos = db.all(query, params);
    res.json(contactos);
  } catch (error) {
    console.error('Get contactos error:', error);
    res.status(500).json({ error: 'Error al obtener contactos' });
  }
});

// Get single contacto
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const contacto = db.get(`
      SELECT c.*, e.nombre as empresa_nombre 
      FROM contactos c 
      LEFT JOIN empresas e ON c.empresa_id = e.id 
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (!contacto) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    // Get calls and citas for this contact
    const llamadas = db.all('SELECT * FROM llamadas WHERE contacto_id = ? ORDER BY fecha_llamada DESC', [req.params.id]);
    const citas = db.all('SELECT * FROM citas WHERE contacto_id = ? ORDER BY fecha_hora DESC', [req.params.id]);

    res.json({ ...contacto, llamadas, citas });
  } catch (error) {
    console.error('Get contacto error:', error);
    res.status(500).json({ error: 'Error al obtener contacto' });
  }
});

// Create contacto
router.post('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id, nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas } = req.body;

    if (!empresa_id || !nombre) {
      return res.status(400).json({ error: 'Empresa y nombre del contacto requeridos' });
    }

    // Verify empresa exists
    const empresa = db.get('SELECT id, nombre FROM empresas WHERE id = ?', [empresa_id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const id = uuidv4();

    db.run(
      `INSERT INTO contactos (id, empresa_id, nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, empresa_id, nombre, cargo || '', telefono || '', email || '', canal_preferido || '', nivel_interes || 'bajo', notas || '']
    );

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'create_contacto', 'contacto', id, `Created contacto: ${nombre} at ${empresa.nombre}`]
    );

    res.status(201).json({ message: 'Contacto creado', id });
  } catch (error) {
    console.error('Create contacto error:', error);
    res.status(500).json({ error: 'Error al crear contacto' });
  }
});

// Update contacto
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas } = req.body;

    const existing = db.get('SELECT * FROM contactos WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    db.run(`
      UPDATE contactos 
      SET nombre = COALESCE(?, nombre),
          cargo = COALESCE(?, cargo),
          telefono = COALESCE(?, telefono),
          email = COALESCE(?, email),
          canal_preferido = COALESCE(?, canal_preferido),
          nivel_interes = COALESCE(?, nivel_interes),
          notas = COALESCE(?, notas),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas, req.params.id]);

    res.json({ message: 'Contacto actualizado' });
  } catch (error) {
    console.error('Update contacto error:', error);
    res.status(500).json({ error: 'Error al actualizar contacto' });
  }
});

// Delete contacto
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const existing = db.get('SELECT * FROM contactos WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    db.run('DELETE FROM contactos WHERE id = ?', [req.params.id]);

    res.json({ message: 'Contacto eliminado' });
  } catch (error) {
    console.error('Delete contacto error:', error);
    res.status(500).json({ error: 'Error al eliminar contacto' });
  }
});

module.exports = router;