const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../db');
const { authenticateToken } = require('../auth/middleware');

const router = express.Router();

// Get all llamadas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { empresa_id, vendedor_id, estado, fecha } = req.query;
    
    let sql = `
      SELECT l.*, e.nombre as empresa_nombre, u.name as vendedor_nombre
      FROM llamadas l
      LEFT JOIN empresas e ON l.empresa_id = e.id
      LEFT JOIN users u ON l.vendedor_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'vendedor') {
      sql += ` AND l.vendedor_id = $${paramIndex++}`;
      params.push(req.user.id);
    } else if (vendedor_id) {
      sql += ` AND l.vendedor_id = $${paramIndex++}`;
      params.push(vendedor_id);
    }

    if (empresa_id) {
      sql += ` AND l.empresa_id = $${paramIndex++}`;
      params.push(empresa_id);
    }

    if (estado) {
      sql += ` AND l.estado = $${paramIndex++}`;
      params.push(estado);
    }

    sql += ' ORDER BY l.fecha_llamada DESC LIMIT 100';
    
    const llamadas = await query(sql, params);
    res.json(llamadas);
  } catch (error) {
    console.error('Get llamadas error:', error);
    res.status(500).json({ error: 'Error al obtener llamadas' });
  }
});

// Create llamada
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { empresa_id, contacto_id, estado, observaciones } = req.body;
    
    const empresa = await queryOne('SELECT * FROM empresas WHERE id = $1', [empresa_id]);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    const esEfectivo = estado === 'contacto_efectivo' || estado === 'interesado';
    const puntosGanados = esEfectivo ? 10 : 5;
    
    const id = uuidv4();
    await query(
      'INSERT INTO llamadas (id, empresa_id, contacto_id, vendedor_id, estado, observaciones, es_contacto_efectivo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, empresa_id, contacto_id || null, req.user.id, estado, observaciones || '', esEfectivo ? 1 : 0]
    );
    
    await query('UPDATE users SET puntos = puntos + $1 WHERE id = $2', [puntosGanados, req.user.id]);
    
    if (estado === 'interesado' || estado === 'contacto_efectivo') {
      await query('UPDATE empresas SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [estado, empresa_id]);
    }
    
    const userUpdated = await queryOne('SELECT puntos FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Llamada registrada', puntos: userUpdated.puntos });
  } catch (error) {
    console.error('Create llamada error:', error);
    res.status(500).json({ error: 'Error al registrar llamada' });
  }
});

// Delete llamada
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const llamada = await queryOne('SELECT * FROM llamadas WHERE id = $1', [req.params.id]);
    if (!llamada) {
      return res.status(404).json({ error: 'Llamada no encontrada' });
    }
    
    const puntosAActualizar = llamada.es_contacto_efectivo ? 10 : 5;
    
    await query('DELETE FROM llamadas WHERE id = $1', [req.params.id]);
    await query('UPDATE users SET puntos = puntos - $1 WHERE id = $2', [puntosAActualizar, llamada.vendedor_id]);
    
    res.json({ message: 'Llamada eliminada' });
  } catch (error) {
    console.error('Delete llamada error:', error);
    res.status(500).json({ error: 'Error al eliminar llamada' });
  }
});

// Stats diaria
router.get('/stats/daily', authenticateToken, async (req, res) => {
  try {
    const llamadasHoy = await queryOne("SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = $1 AND fecha_llamada::date = CURRENT_DATE", [req.user.id]);
    const empresasUnicasHoy = await queryOne("SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE vendedor_id = $1 AND fecha_llamada::date = CURRENT_DATE", [req.user.id]);
    
    res.json({
      llamadas_hoy: parseInt(llamadasHoy?.count || 0),
      empresas_unicas_hoy: parseInt(empresasUnicasHoy?.count || 0)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
