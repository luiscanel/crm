const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation helpers
const validStates = ['nuevo', 'contactado', 'interesado', 'cita_agendada', 'seguimiento', 'cerrado'];
const validSizes = ['Micro', 'Pequeña', 'Mediana', 'Grande', 'Corporación'];

function validateEmail(email) {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Optional
  // Allow: +5021234567, 5021234567, 12345678, +1-555-555-5555
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

function validateEmpresa(data, isUpdate = false) {
  const errors = [];
  
  // Solo validar nombre si se está enviando
  if (data.nombre !== undefined) {
    if (!data.nombre || data.nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }
    if (data.nombre && data.nombre.length > 200) {
      errors.push('El nombre no puede exceder 200 caracteres');
    }
  }
  if (data.email && !validateEmail(data.email)) {
    errors.push('Email inválido');
  }
  if (data.telefono && !validatePhone(data.telefono)) {
    errors.push('Teléfono inválido');
  }
  if (data.estado && !validStates.includes(data.estado)) {
    errors.push('Estado inválido');
  }
  if (data.tamano && !validSizes.includes(data.tamano)) {
    errors.push('Tamaño inválido');
  }
  
  return errors;
}

// Get all empresas (with optional filters)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { estado, vendedor_id, search, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;
    
    // Base WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (req.user.role === 'vendedor') {
      whereClause += ' AND e.vendedor_id = ?';
      params.push(req.user.id);
    } else if (vendedor_id) {
      whereClause += ' AND e.vendedor_id = ?';
      params.push(vendedor_id);
    }

    if (estado) {
      whereClause += ' AND e.estado = ?';
      params.push(estado);
    }

    if (search) {
      whereClause += ' AND (e.nombre LIKE ? OR e.industria LIKE ? OR e.ubicacion LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (fecha_desde) {
      whereClause += ' AND DATE(e.created_at) >= ?';
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereClause += ' AND DATE(e.created_at) <= ?';
      params.push(fecha_hasta);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM empresas e ${whereClause}`;
    const totalResult = db.get(countQuery, params);
    const total = totalResult.total;

    // Get paginated results
    let query = `
      SELECT e.*, 
        (SELECT COUNT(*) FROM llamadas WHERE empresa_id = e.id) as total_llamadas,
        (SELECT COUNT(*) FROM llamadas WHERE empresa_id = e.id AND fecha_llamada::date = CURRENT_DATE) as llamadas_hoy
      FROM empresas e
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limitNum, offset);

    const empresas = db.all(query, params);
    
    // Get contactos for each empresa
    const empresasWithContactos = empresas.map(empresa => {
      const contactos = db.all('SELECT id, nombre, email, telefono, cargo FROM contactos WHERE empresa_id = ?', [empresa.id]);
      return { ...empresa, contactos };
    });
    
    res.json({
      data: empresasWithContactos,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });
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
    const { nombre, industria, tamano, ubicacion, telefono, email, sitio_web, vendedor_id } = req.body;

    // Validate input
    if (!nombre) {
      return res.status(400).json({ error: 'Nombre de empresa requerido' });
    }

    const validationErrors = validateEmpresa({ nombre, industria, tamano, ubicacion, telefono, email, sitio_web });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const id = uuidv4();
    const assignedVendedor = req.user.role === 'vendedor' ? req.user.id : (vendedor_id || req.user.id);

    db.run(
      `INSERT INTO empresas (id, nombre, industria, tamano, ubicacion, telefono, email, sitio_web, estado, vendedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nombre, industria || '', tamano || '', ubicacion || '', telefono || '', email || '', sitio_web || '', 'nuevo', assignedVendedor]
    );

    // Award 1 point for creating empresa (reduce from 5)
    db.run('UPDATE users SET puntos = puntos + 1 WHERE id = ?', [req.user.id]);

    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'create_empresa', 'empresa', id, `Created empresa: ${nombre} (+1 punto)`]
    );

    res.status(201).json({ message: 'Empresa creada', id, puntos_ganados: 1 });
  } catch (error) {
    console.error('Create empresa error:', error);
    res.status(500).json({ error: 'Error al crear empresa' });
  }
});

// Update empresa
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { nombre, industria, tamano, ubicacion, telefono, email, sitio_web, estado, vendedor_id, fecha_cita, tipo_cita, notas_cita, fecha_seguimiento } = req.body;

    const existing = db.get('SELECT * FROM empresas WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Validate input
    const validationErrors = validateEmpresa({ nombre, industria, tamano, ubicacion, telefono, email, estado }, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
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
          email = COALESCE(?, email),
          sitio_web = COALESCE(?, sitio_web),
          estado = COALESCE(?, estado),
          vendedor_id = COALESCE(?, vendedor_id),
          fecha_seguimiento = COALESCE(?, fecha_seguimiento),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nombre, industria, tamano, ubicacion, telefono, email, sitio_web, estado, vendedor_id, fecha_seguimiento, req.params.id]);

    // Auto-create cita when state changes to cita_agendada
    if (isChangingToCitaAgendada && fecha_cita) {
      // Check if this empresa already has a pending cita - don't duplicate points
      const citaExistente = db.get('SELECT id FROM citas WHERE empresa_id = ? AND estado = ?', [req.params.id, 'pendiente']);
      
      if (!citaExistente) {
        const { v4: uuidv4 } = require('uuid');
        const citaId = uuidv4();
        
        db.run(
          `INSERT INTO citas (id, empresa_id, tipo, fecha_hora, estado, notas, vendedor_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [citaId, req.params.id, tipo_cita || 'reunion', fecha_cita, 'pendiente', notas_cita || 'Cita agendada desde empresa', req.user.id]
        );
        
        // Award puntos only if this is the FIRST cita for this empresa
        db.run('UPDATE users SET puntos = puntos + 10 WHERE id = ?', [req.user.id]);
        
        // Log
        db.run(
          `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), req.user.id, 'create_cita', 'cita', citaId, `Cita automática creada para empresa ${nombre || existing.nombre} (+10 puntos)`]
        );
      }
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
    
    // Reverse 1 point from empresa creation
    puntosARevertir += 1;
    
    // Reverse puntos for each call (now only +1 base +3 efectivo, no extra for interested)
    for (const llamada of llamadas) {
      puntosARevertir += 1; // Base point per call
      if (llamada.es_contacto_efectivo) {
        puntosARevertir += 3; // Contact effective points
      }
    }
    
    // Reverse 10 puntos if empresa was in cita_agendada (the cita gave +10 puntos)
    if (existing.estado === 'cita_agendada') {
      puntosARevertir += 10;
    }
    
    // Delete related records in correct order (manual cascade since SQLite needs it)
    db.run('DELETE FROM llamadas WHERE empresa_id = ?', [req.params.id]);
    db.run('DELETE FROM contactos WHERE empresa_id = ?', [req.params.id]);
    db.run('DELETE FROM citas WHERE empresa_id = ?', [req.params.id]);
    db.run('DELETE FROM notas WHERE empresa_id = ?', [req.params.id]);
    db.run('DELETE FROM tareas WHERE empresa_id = ?', [req.params.id]);
    
    // Delete empresa
    db.run('DELETE FROM empresas WHERE id = ?', [req.params.id]);
    
    // Reverse puntos if any were awarded (don't go below 0)
    if (puntosARevertir > 0) {
      const usuario = db.get('SELECT puntos FROM users WHERE id = ?', [existing.vendedor_id]);
      const puntosReales = Math.min(puntosARevertir, usuario.puntos);
      if (puntosReales > 0) {
        db.run('UPDATE users SET puntos = puntos - ? WHERE id = ?', [puntosReales, existing.vendedor_id]);
      }
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

// Export empresas to CSV
router.get('/export', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    
    let query = `SELECT e.*, u.name as vendedor_nombre FROM empresas e LEFT JOIN users u ON e.vendedor_id = u.id WHERE 1=1`;
    const params = [];

    if (req.user.role === 'vendedor') {
      query += ' AND e.vendedor_id = ?';
      params.push(req.user.id);
    }

    const empresas = db.all(query, params);

    // Build CSV
    const headers = ['nombre', 'industria', 'tamano', 'ubicacion', 'telefono', 'email', 'estado', 'vendedor_nombre', 'notas', 'fecha_seguimiento', 'created_at'];
    const csvRows = [headers.join(',')];

    for (const emp of empresas) {
      const row = headers.map(h => {
        const val = emp[h] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        const escaped = String(val).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
      });
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=empresas_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Export empresas error:', error);
    res.status(500).json({ error: 'Error al exportar empresas' });
  }
});

// Import empresas from CSV
router.post('/import', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresas } = req.body;

    if (!Array.isArray(empresas) || empresas.length === 0) {
      return res.status(400).json({ error: 'Array de empresas requerido' });
    }

    // Limit to prevent abuse
    if (empresas.length > 500) {
      return res.status(400).json({ error: 'Máximo 500 empresas por importación' });
    }

    const inserted = [];
    const errors = [];

    for (let i = 0; i < empresas.length; i++) {
      const emp = empresas[i];
      
      // Validate before inserting
      const validationErrors = validateEmpresa(emp);
      if (validationErrors.length > 0) {
        errors.push({ row: i + 1, errors: validationErrors });
        continue;
      }

      if (!emp.nombre) {
        errors.push({ row: i + 1, error: 'Nombre requerido' });
        continue;
      }

      try {
        const id = uuidv4();
        const assignedVendedor = req.user.role === 'vendedor' ? req.user.id : (emp.vendedor_id || req.user.id);

        db.run(
          `INSERT INTO empresas (id, nombre, industria, tamano, ubicacion, telefono, email, estado, vendedor_id, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, emp.nombre, emp.industria || '', emp.tamano || '', emp.ubicacion || '', emp.telefono || '', emp.email || '', emp.estado || 'nuevo', assignedVendedor, emp.notas || '']
        );

        inserted.push({ nombre: emp.nombre, id });
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    // Log activity
    if (inserted.length > 0) {
      db.run(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), req.user.id, 'import_empresas', 'empresa', null, `Importadas ${inserted.length} empresas`]
      );
    }

    res.json({ 
      message: `Importadas ${inserted.length} empresas`,
      inserted,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Import empresas error:', error);
    res.status(500).json({ error: 'Error al importar empresas' });
  }
});

module.exports = router;