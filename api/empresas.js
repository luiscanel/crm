const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../../db');
const { authenticateToken } = require('./middleware');

const router = express.Router();

// Get all empresas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { estado, vendedor_id, search, fecha_desde, fecha_hasta } = req.query;
    
    let sql = `
      SELECT e.*, 
        (SELECT COUNT(*) FROM llamadas WHERE empresa_id = e.id) as total_llamadas,
        (SELECT COUNT(*) FROM llamadas WHERE empresa_id = e.id AND fecha_llamada::date = CURRENT_DATE) as llamadas_hoy
      FROM empresas e
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'vendedor') {
      sql += ` AND e.vendedor_id = $${paramIndex++}`;
      params.push(req.user.id);
    } else if (vendedor_id) {
      sql += ` AND e.vendedor_id = $${paramIndex++}`;
      params.push(vendedor_id);
    }

    if (estado) {
      sql += ` AND e.estado = $${paramIndex++}`;
      params.push(estado);
    }

    if (search) {
      sql += ` AND (e.nombre LIKE $${paramIndex} OR e.industria LIKE $${paramIndex} OR e.ubicacion LIKE $${paramIndex})`;
      params.push(`%${search}%`);
    }

    if (fecha_desde) {
      sql += ` AND e.created_at::date >= $${paramIndex++}`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      sql += ` AND e.created_at::date <= $${paramIndex++}`;
      params.push(fecha_hasta);
    }

    sql += ' ORDER BY e.created_at DESC';
    
    const empresas = await query(sql, params);
    res.json(empresas);
  } catch (error) {
    console.error('Get empresas error:', error);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
});

// Get empresa by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const empresa = await queryOne('SELECT * FROM empresas WHERE id = $1', [req.params.id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    const contactos = await query('SELECT * FROM contactos WHERE empresa_id = $1', [req.params.id]);
    const llamadas = await query('SELECT * FROM llamadas WHERE empresa_id = $1 ORDER BY fecha_llamada DESC', [req.params.id]);
    const citas = await query('SELECT * FROM citas WHERE empresa_id = $1 ORDER BY fecha_hora DESC', [req.params.id]);
    
    res.json({ ...empresa, contactos, llamadas, citas });
  } catch (error) {
    console.error('Get empresa error:', error);
    res.status(500).json({ error: 'Error al obtener empresa' });
  }
});

// Create empresa
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nombre, industria, tamano, ubicacion, telefono, email, direccion, notas, vendedor_id } = req.body;
    
    const assignedVendedor = req.user.role === 'vendedor' ? req.user.id : (vendedor_id || req.user.id);
    const id = uuidv4();
    
    await query(
      'INSERT INTO empresas (id, nombre, industria, tamano, ubicacion, telefono, email, direccion, estado, vendedor_id, notas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [id, nombre, industria, tamano, ubicacion, telefono, email, direccion, 'nuevo', assignedVendedor, notas]
    );
    
    res.status(201).json({ id, message: 'Empresa creada exitosamente' });
  } catch (error) {
    console.error('Create empresa error:', error);
    res.status(500).json({ error: 'Error al crear empresa' });
  }
});

// Update empresa
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { nombre, industria, tamano, ubicacion, telefono, email, direccion, estado, vendedor_id, notas } = req.body;
    
    const existing = await queryOne('SELECT * FROM empresas WHERE id = $1', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (nombre !== undefined) { updates.push(`nombre = $${paramIndex++}`); values.push(nombre); }
    if (industria !== undefined) { updates.push(`industria = $${paramIndex++}`); values.push(industria); }
    if (tamano !== undefined) { updates.push(`tamano = $${paramIndex++}`); values.push(tamano); }
    if (ubicacion !== undefined) { updates.push(`ubicacion = $${paramIndex++}`); values.push(ubicacion); }
    if (telefono !== undefined) { updates.push(`telefono = $${paramIndex++}`); values.push(telefono); }
    if (email !== undefined) { updates.push(`email = $${paramIndex++}`); values.push(email); }
    if (direccion !== undefined) { updates.push(`direccion = $${paramIndex++}`); values.push(direccion); }
    if (estado !== undefined) { updates.push(`estado = $${paramIndex++}`); values.push(estado); }
    if (vendedor_id !== undefined) { updates.push(`vendedor_id = $${paramIndex++}`); values.push(vendedor_id); }
    if (notas !== undefined) { updates.push(`notas = $${paramIndex++}`); values.push(notas); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(req.params.id);
    await query(`UPDATE empresas SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`, values);
    
    res.json({ message: 'Empresa actualizada exitosamente' });
  } catch (error) {
    console.error('Update empresa error:', error);
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
});

// Delete empresa
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM empresas WHERE id = $1', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    await query('DELETE FROM empresas WHERE id = $1', [req.params.id]);
    res.json({ message: 'Empresa eliminada exitosamente' });
  } catch (error) {
    console.error('Delete empresa error:', error);
    res.status(500).json({ error: 'Error al eliminar empresa' });
  }
});

module.exports = router;
