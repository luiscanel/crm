/**
 * Empresa Service - Business logic for empresas
 */

const { v4: uuidv4 } = require('uuid');
const { validateEmpresa } = require('../utils/validators');

class EmpresaService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all empresas with pagination and filters
   */
  getAll(filters = {}) {
    const { estado, vendedor_id, search, fecha_desde, fecha_hasta, page = 1, limit = 20 } = filters;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (vendedor_id) {
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
    const totalResult = this.db.get(countQuery, params);
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

    const empresas = this.db.all(query, params);

    return {
      data: empresas,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    };
  }

  /**
   * Get empresa by ID
   */
  getById(id) {
    const empresa = this.db.get('SELECT * FROM empresas WHERE id = ?', [id]);
    
    if (!empresa) return null;

    // Get related data
    const contactos = this.db.all('SELECT * FROM contactos WHERE empresa_id = ?', [id]);
    const llamadas = this.db.all(`
      SELECT l.*, c.nombre as contacto_nombre
      FROM llamadas l
      LEFT JOIN contactos c ON l.contacto_id = c.id
      WHERE l.empresa_id = ?
      ORDER BY l.fecha_llamada DESC
      LIMIT 10
    `, [id]);
    const citas = this.db.all('SELECT * FROM citas WHERE empresa_id = ? ORDER BY fecha_hora DESC', [id]);

    return { ...empresa, contactos, llamadas, citas };
  }

  /**
   * Create new empresa
   */
  create(data) {
    // Validate data
    const validation = validateEmpresa(data);
    if (!validation.valid) {
      return { error: validation.errors };
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO empresas (id, nombre, industria, tamano, ubicacion, telefono, email, estado, vendedor_id, notas, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.nombre,
      data.industria || null,
      data.tamano || null,
      data.ubicacion || null,
      data.telefono || null,
      data.email || null,
      data.estado || 'nuevo',
      data.vendedor_id || null,
      data.notas || null,
      now,
      now
    );

    return this.getById(id);
  }

  /**
   * Update empresa
   */
  update(id, data) {
    const empresa = this.getById(id);
    if (!empresa) {
      return { error: ['Empresa no encontrada'] };
    }

    // Validate data
    const validation = validateEmpresa(data, true);
    if (!validation.valid) {
      return { error: validation.errors };
    }

    const updates = [];
    const params = [];

    if (data.nombre !== undefined) { updates.push('nombre = ?'); params.push(data.nombre); }
    if (data.industria !== undefined) { updates.push('industria = ?'); params.push(data.industria); }
    if (data.tamano !== undefined) { updates.push('tamano = ?'); params.push(data.tamano); }
    if (data.ubicacion !== undefined) { updates.push('ubicacion = ?'); params.push(data.ubicacion); }
    if (data.telefono !== undefined) { updates.push('telefono = ?'); params.push(data.telefono); }
    if (data.email !== undefined) { updates.push('email = ?'); params.push(data.email); }
    if (data.estado !== undefined) { updates.push('estado = ?'); params.push(data.estado); }
    if (data.vendedor_id !== undefined) { updates.push('vendedor_id = ?'); params.push(data.vendedor_id); }
    if (data.notas !== undefined) { updates.push('notas = ?'); params.push(data.notas); }

    if (updates.length === 0) {
      return empresa;
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.db.prepare(`UPDATE empresas SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    return this.getById(id);
  }

  /**
   * Delete empresa
   */
  delete(id) {
    const empresa = this.getById(id);
    if (!empresa) {
      return { error: ['Empresa no encontrada'] };
    }

    this.db.prepare('DELETE FROM empresas WHERE id = ?').run(id);
    return { success: true, message: 'Empresa eliminada' };
  }

  /**
   * Get empresas by estado
   */
  getByEstado(estado) {
    return this.db.all('SELECT * FROM empresas WHERE estado = ? ORDER BY created_at DESC', [estado]);
  }

  /**
   * Get empresas by vendedor
   */
  getByVendedor(vendedor_id) {
    return this.db.all('SELECT * FROM empresas WHERE vendedor_id = ? ORDER BY created_at DESC', [vendedor_id]);
  }

  /**
   * Get stats summary
   */
  getStats(vendedorId = null) {
    let whereClause = '';
    const params = [];
    
    if (vendedorId) {
      whereClause = 'WHERE vendedor_id = ?';
      params.push(vendedorId);
    }

    const stats = this.db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'nuevo' THEN 1 ELSE 0 END) as nuevo,
        SUM(CASE WHEN estado = 'contactado' THEN 1 ELSE 0 END) as contactado,
        SUM(CASE WHEN estado = 'interesado' THEN 1 ELSE 0 END) as interesado,
        SUM(CASE WHEN estado = 'cita_agendada' THEN 1 ELSE 0 END) as cita_agendada,
        SUM(CASE WHEN estado = 'seguimiento' THEN 1 ELSE 0 END) as seguimiento,
        SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) as cerrado
      FROM empresas ${whereClause}
    `, params);

    return stats;
  }
}

module.exports = EmpresaService;