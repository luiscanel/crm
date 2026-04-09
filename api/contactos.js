const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../db');
const { authenticateToken } = require('../auth/middleware');

const router = express.Router();

// Get all contactos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { empresa_id } = req.query;
    
    let sql = `
      SELECT c.*, e.nombre as empresa_nombre
      FROM contactos c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (empresa_id) {
      sql += ` AND c.empresa_id = $${paramIndex++}`;
      params.push(empresa_id);
    }

    sql += ' ORDER BY c.created_at DESC';
    
    const contactos = await query(sql, params);
    res.json(contactos);
  } catch (error) {
    console.error('Get contactos error:', error);
    res.status(500).json({ error: 'Error al obtener contactos' });
  }
});

// Get contacto by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const contacto = await queryOne('SELECT * FROM contactos WHERE id = $1', [req.params.id]);
    if (!contacto) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    
    res.json(contacto);
  } catch (error) {
    console.error('Get contacto error:', error);
    res.status(500).json({ error: 'Error al obtener contacto' });
  }
});

// Create contacto
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { empresa_id, nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas } = req.body;
    
    const empresa = await queryOne('SELECT id, nombre FROM empresas WHERE id = $1', [empresa_id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    const id = uuidv4();
    await query(
      'INSERT INTO contactos (id, empresa_id, nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, empresa_id, nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas]
    );
    
    res.status(201).json({ id, message: 'Contacto creado exitosamente' });
  } catch (error) {
    console.error('Create contacto error:', error);
    res.status(500).json({ error: 'Error al crear contacto' });
  }
});

// Update contacto
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas } = req.body;
    
    const existing = await queryOne('SELECT * FROM contactos WHERE id = $1', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (nombre !== undefined) { updates.push(`nombre = $${paramIndex++}`); values.push(nombre); }
    if (cargo !== undefined) { updates.push(`cargo = $${paramIndex++}`); values.push(cargo); }
    if (telefono !== undefined) { updates.push(`telefono = $${paramIndex++}`); values.push(telefono); }
    if (email !== undefined) { updates.push(`email = $${paramIndex++}`); values.push(email); }
    if (canal_preferido !== undefined) { updates.push(`canal_preferido = $${paramIndex++}`); values.push(canal_preferido); }
    if (nivel_interes !== undefined) { updates.push(`nivel_interes = $${paramIndex++}`); values.push(nivel_interes); }
    if (notas !== undefined) { updates.push(`notas = $${paramIndex++}`); values.push(notas); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(req.params.id);
    await query(`UPDATE contactos SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
    
    res.json({ message: 'Contacto actualizado exitosamente' });
  } catch (error) {
    console.error('Update contacto error:', error);
    res.status(500).json({ error: 'Error al actualizar contacto' });
  }
});

// Delete contacto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM contactos WHERE id = $1', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    
    await query('DELETE FROM contactos WHERE id = $1', [req.params.id]);
    res.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error('Delete contacto error:', error);
    res.status(500).json({ error: 'Error al eliminar contacto' });
  }
});

module.exports = router;
