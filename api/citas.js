const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../db');
const { authenticateToken } = require('../auth/middleware');

const router = express.Router();

// Get all citas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { empresa_id, vendedor_id, estado, fecha_desde, fecha_hasta } = req.query;
    
    let sql = `
      SELECT ct.*, e.nombre as empresa_nombre, u.name as vendedor_nombre
      FROM citas ct
      LEFT JOIN empresas e ON ct.empresa_id = e.id
      LEFT JOIN users u ON ct.vendedor_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'vendedor') {
      sql += ` AND ct.vendedor_id = $${paramIndex++}`;
      params.push(req.user.id);
    } else if (vendedor_id) {
      sql += ` AND ct.vendedor_id = $${paramIndex++}`;
      params.push(vendedor_id);
    }

    if (empresa_id) {
      sql += ` AND ct.empresa_id = $${paramIndex++}`;
      params.push(empresa_id);
    }

    if (estado) {
      sql += ` AND ct.estado = $${paramIndex++}`;
      params.push(estado);
    }

    if (fecha_desde && fecha_hasta) {
      sql += ` AND ct.fecha_hora BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(fecha_desde + ' 00:00:00', fecha_hasta + ' 23:59:59');
    }

    sql += ' ORDER BY ct.fecha_hora ASC';
    
    const citas = await query(sql, params);
    res.json(citas);
  } catch (error) {
    console.error('Get citas error:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// Create cita
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { empresa_id, contacto_id, tipo, fecha_hora, motivo, estado = 'pendiente', link_videollamada } = req.body;
    
    const empresa = await queryOne('SELECT id, nombre FROM empresas WHERE id = $1', [empresa_id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    const id = uuidv4();
    await query(
      'INSERT INTO citas (id, empresa_id, contacto_id, tipo, fecha_hora, motivo, estado, link_videollamada, vendedor_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, empresa_id, contacto_id || null, tipo, fecha_hora, motivo, estado, link_videollamada, req.user.id]
    );
    
    await query('UPDATE users SET puntos = puntos + 10 WHERE id = $1', [req.user.id]);
    await query('UPDATE empresas SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['cita_agendada', empresa_id]);
    
    const userUpdated = await queryOne('SELECT puntos FROM users WHERE id = $1', [req.user.id]);
    res.status(201).json({ id, message: 'Cita creada', puntos: userUpdated.puntos });
  } catch (error) {
    console.error('Create cita error:', error);
    res.status(500).json({ error: 'Error al crear cita' });
  }
});

// Update cita
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { tipo, fecha_hora, estado, notas, link_videollamada } = req.body;
    
    const existing = await queryOne('SELECT * FROM citas WHERE id = $1', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (tipo !== undefined) { updates.push(`tipo = $${paramIndex++}`); values.push(tipo); }
    if (fecha_hora !== undefined) { updates.push(`fecha_hora = $${paramIndex++}`); values.push(fecha_hora); }
    if (estado !== undefined) { updates.push(`estado = $${paramIndex++}`); values.push(estado); }
    if (notas !== undefined) { updates.push(`notas = $${paramIndex++}`); values.push(notas); }
    if (link_videollamada !== undefined) { updates.push(`link_videollamada = $${paramIndex++}`); values.push(link_videollamada); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(req.params.id);
    await query(`UPDATE citas SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
    
    if (estado === 'realizada') {
      await query('UPDATE users SET puntos = puntos + 5 WHERE id = $1', [existing.vendedor_id]);
    }
    
    res.json({ message: 'Cita actualizada' });
  } catch (error) {
    console.error('Update cita error:', error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// Delete cita
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM citas WHERE id = $1', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    await query('DELETE FROM citas WHERE id = $1', [req.params.id]);
    res.json({ message: 'Cita eliminada' });
  } catch (error) {
    console.error('Delete cita error:', error);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
});

module.exports = router;
