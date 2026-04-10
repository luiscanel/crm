/**
 * Contacto Service - Business logic for contactos
 */

const { v4: uuidv4 } = require('uuid');
const { validateContacto } = require('../utils/validators');

class ContactoService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all contactos for an empresa
   */
  getByEmpresa(empresa_id) {
    return this.db.all('SELECT * FROM contactos WHERE empresa_id = ? ORDER BY created_at DESC', [empresa_id]);
  }

  /**
   * Get contacto by ID
   */
  getById(id) {
    return this.db.get('SELECT * FROM contactos WHERE id = ?', [id]);
  }

  /**
   * Create new contacto
   */
  create(data) {
    // Validate data
    const validation = validateContacto(data);
    if (!validation.valid) {
      return { error: validation.errors };
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO contactos (id, empresa_id, nombre, cargo, telefono, email, canal_preferido, nivel_interes, notas, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.empresa_id,
      data.nombre,
      data.cargo || null,
      data.telefono || null,
      data.email || null,
      data.canal_preferido || null,
      data.nivel_interes || null,
      data.notas || null,
      now,
      now
    );

    return this.getById(id);
  }

  /**
   * Update contacto
   */
  update(id, data) {
    const contacto = this.getById(id);
    if (!contacto) {
      return { error: ['Contacto no encontrado'] };
    }

    const updates = [];
    const params = [];

    if (data.nombre !== undefined) { updates.push('nombre = ?'); params.push(data.nombre); }
    if (data.cargo !== undefined) { updates.push('cargo = ?'); params.push(data.cargo); }
    if (data.telefono !== undefined) { updates.push('telefono = ?'); params.push(data.telefono); }
    if (data.email !== undefined) { updates.push('email = ?'); params.push(data.email); }
    if (data.canal_preferido !== undefined) { updates.push('canal_preferido = ?'); params.push(data.canal_preferido); }
    if (data.nivel_interes !== undefined) { updates.push('nivel_interes = ?'); params.push(data.nivel_interes); }
    if (data.notas !== undefined) { updates.push('notas = ?'); params.push(data.notas); }

    if (updates.length === 0) {
      return contacto;
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.db.prepare(`UPDATE contactos SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    return this.getById(id);
  }

  /**
   * Delete contacto
   */
  delete(id) {
    const contacto = this.getById(id);
    if (!contacto) {
      return { error: ['Contacto no encontrado'] };
    }

    this.db.prepare('DELETE FROM contactos WHERE id = ?').run(id);
    return { success: true, message: 'Contacto eliminado' };
  }

  /**
   * Get all contactos with filters
   */
  getAll(filters = {}) {
    const { nivel_interes, canal_preferido, page = 1, limit = 50 } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (nivel_interes) {
      whereClause += ' AND nivel_interes = ?';
      params.push(nivel_interes);
    }

    if (canal_preferido) {
      whereClause += ' AND canal_preferido = ?';
      params.push(canal_preferido);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const offset = (pageNum - 1) * limitNum;

    const countResult = this.db.get(`SELECT COUNT(*) as total FROM contactos ${whereClause}`, params);
    const total = countResult.total;

    const contactos = this.db.all(`
      SELECT c.*, e.nombre as empresa_nombre
      FROM contactos c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    return {
      data: contactos,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    };
  }
}

module.exports = ContactoService;