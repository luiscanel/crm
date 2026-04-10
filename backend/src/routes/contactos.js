const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation helpers
const validChannels = ['telefono', 'email', 'whatsapp', 'presencial', 'linkedin'];
const validInterestLevels = ['bajo', 'medio', 'alto'];

function validateEmail(email) {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true;
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

function validateContacto(data) {
  const errors = [];
  
  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  if (data.email && !validateEmail(data.email)) {
    errors.push('Email inválido');
  }
  if (data.telefono && !validatePhone(data.telefono)) {
    errors.push('Teléfono inválido');
  }
  if (data.canal_preferido && !validChannels.includes(data.canal_preferido)) {
    errors.push('Canal preferido inválido');
  }
  if (data.nivel_interes && !validInterestLevels.includes(data.nivel_interes)) {
    errors.push('Nivel de interés inválido');
  }
  
  return errors;
}

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

    // Validate input
    const validationErrors = validateContacto({ nombre, telefono, email, canal_preferido, nivel_interes });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
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

// Export contactos to CSV
router.get('/export', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { empresa_id } = req.query;
    
    let query = 'SELECT c.*, e.nombre as empresa_nombre FROM contactos c LEFT JOIN empresas e ON c.empresa_id = e.id WHERE 1=1';
    const params = [];

    if (empresa_id) {
      query += ' AND c.empresa_id = ?';
      params.push(empresa_id);
    }

    const contactos = db.all(query, params);

    // Build CSV
    const headers = ['nombre', 'cargo', 'telefono', 'email', 'canal_preferido', 'nivel_interes', 'empresa_nombre', 'notas', 'created_at'];
    const csvRows = [headers.join(',')];

    for (const cont of contactos) {
      const row = headers.map(h => {
        const val = cont[h] || '';
        const escaped = String(val).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
      });
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=contactos_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Export contactos error:', error);
    res.status(500).json({ error: 'Error al exportar contactos' });
  }
});

// Import contactos from CSV
router.post('/import', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { contactos } = req.body;

    if (!Array.isArray(contactos) || contactos.length === 0) {
      return res.status(400).json({ error: 'Array de contactos requerido' });
    }

    // Limit to prevent abuse
    if (contactos.length > 500) {
      return res.status(400).json({ error: 'Máximo 500 contactos por importación' });
    }

    const inserted = [];
    const errors = [];

    for (let i = 0; i < contactos.length; i++) {
      const cont = contactos[i];
      
      // Validate before inserting
      const validationErrors = validateContacto(cont);
      if (validationErrors.length > 0) {
        errors.push({ row: i + 1, errors: validationErrors });
        continue;
      }

      if (!cont.nombre || !cont.empresa_nombre) {
        errors.push({ row: i + 1, error: 'Nombre y empresa requeridos' });
        continue;
      }

      try {
        // Find empresa by name
        const empresa = db.get('SELECT id, nombre FROM empresas WHERE nombre = ?', [cont.empresa_nombre]);
        if (!empresa) {
          errors.push({ row: i + 1, error: `Empresa no encontrada: ${cont.empresa_nombre}` });
          continue;
        }

        const id = uuidv4();

        db.run(
          `INSERT INTO contactos (id, empresa_id, nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, empresa.id, cont.nombre, cont.cargo || '', cont.telefono || '', cont.email || '', cont.canal_preferido || '', cont.nivel_interes || 'bajo', cont.notas || '']
        );

        inserted.push({ nombre: cont.nombre, id });
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    // Log activity
    if (inserted.length > 0) {
      db.run(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), req.user.id, 'import_contactos', 'contacto', null, `Importados ${inserted.length} contactos`]
      );
    }

    res.json({ 
      message: `Importados ${inserted.length} contactos`,
      inserted,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Import contactos error:', error);
    res.status(500).json({ error: 'Error al importar contactos' });
  }
});

module.exports = router;