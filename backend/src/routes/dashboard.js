const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get general dashboard stats
router.get('/general', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // Filtro por vendedor si no es admin/supervisor
    let whereEmpresas = '';
    let paramsEmpresas = [];
    let whereLlamadas = '';
    let paramsLlamadas = [];
    let whereCitas = '';
    let paramsCitas = [];
    
    if (req.user.role === 'vendedor') {
      whereEmpresas = 'WHERE vendedor_id = ?';
      paramsEmpresas = [req.user.id];
      whereLlamadas = 'WHERE vendedor_id = ?';
      paramsLlamadas = [req.user.id];
      whereCitas = 'WHERE vendedor_id = ?';
      paramsCitas = [req.user.id];
    }
    
    // Total empresas
    const totalEmpresas = db.get(`SELECT COUNT(*) as count FROM empresas ${whereEmpresas}`, paramsEmpresas);
    
    // Llamadas today/week/month
    const llamadasHoy = db.get(`SELECT COUNT(*) as count FROM llamadas ${whereLlamadas} AND date(fecha_llamada) = date('now')`, paramsLlamadas);
    const llamadasSemana = db.get(`SELECT COUNT(*) as count FROM llamadas ${whereLlamadas} AND fecha_llamada >= ?`, paramsLlamadas.concat([startOfWeek + ' 00:00:00']));
    const llamadasMes = db.get(`SELECT COUNT(*) as count FROM llamadas ${whereLlamadas} AND fecha_llamada >= ?`, paramsLlamadas.concat([startOfMonth + ' 00:00:00']));
    
    // Empresas contactadas hoy (unique)
    let empresasContactadasHoy;
    if (req.user.role === 'vendedor') {
      empresasContactadasHoy = db.get("SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE vendedor_id = ? AND date(fecha_llamada) = date('now')", [req.user.id]);
    } else {
      empresasContactadasHoy = db.get("SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE date(fecha_llamada) = date('now')");
    }
    
    // Leads interesados
    let leadsInteresados;
    if (req.user.role === 'vendedor') {
      leadsInteresados = db.get("SELECT COUNT(*) as count FROM empresas WHERE vendedor_id = ? AND (estado = 'interesado' OR estado = 'cita_agendada')", [req.user.id]);
    } else {
      leadsInteresados = db.get("SELECT COUNT(*) as count FROM empresas WHERE estado = 'interesado' OR estado = 'cita_agendada'");
    }
    
    // Citas
    let citasPendientes;
    let citasMes;
    if (req.user.role === 'vendedor') {
      citasPendientes = db.get("SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ? AND estado = 'pendiente'", [req.user.id]);
      citasMes = db.get("SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ? AND estado = 'realizada' AND date(fecha_hora) >= ?", [req.user.id, startOfMonth]);
    } else {
      citasPendientes = db.get("SELECT COUNT(*) as count FROM citas WHERE estado = 'pendiente'");
      citasMes = db.get("SELECT COUNT(*) as count FROM citas WHERE estado = 'realizada' AND date(fecha_hora) >= ?", [startOfMonth]);
    }
    
    // Get weekly goal from retos table
    const metaSemanal = db.get("SELECT meta FROM retos WHERE tipo = 'semanal' AND activo = 1 ORDER BY created_at DESC LIMIT 1");
    const metaSemanalValor = metaSemanal?.meta || 125;
    const metaDiaria = 25;
    
    // Calculate goal compliance
    const cumplimientoLlamadas = Math.min((llamadasHoy.count / metaDiaria) * 100, 100);
    
    res.json({
      total_empresas: totalEmpresas.count,
      llamadas: {
        hoy: llamadasHoy.count,
        semana: llamadasSemana.count,
        mes: llamadasMes.count
      },
      empresas_contactadas_hoy: empresasContactadasHoy.count,
      leads_interesados: leadsInteresados.count,
      citas_pendientes: citasPendientes.count,
      citas_mes: citasMes.count,
      cumplimiento_meta: cumplimientoLlamadas.toFixed(1),
      meta_semanal: metaSemanalValor
    });
  } catch (error) {
    console.error('Get general stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas generales' });
  }
});

// Get vendedor performance
router.get('/vendedor/:id', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // User info
    const user = db.get('SELECT id, name, email, puntos FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    
    // Llamadas
    const llamadasHoy = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?', [id, today + '%']);
    const llamadasSemana = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada >= ?', [id, startOfWeek + ' 00:00:00']);
    const llamadasMes = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada >= ?', [id, startOfMonth + ' 00:00:00']);
    
    // Empresas únicas contactadas
    const empresasSemana = db.get('SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada >= ?', [id, startOfWeek + ' 00:00:00']);
    
    // Efectivos
    const contactosEfectivos = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND es_contacto_efectivo = 1', [id]);
    
    // Interesados (SQLite compatible)
    const interesados = db.get(`
      SELECT COUNT(DISTINCT e.id) as count 
      FROM empresas e
      WHERE e.vendedor_id = ? AND (e.estado = 'interesado' OR e.estado = 'cita_agendada')
    `, [id]);
    
    // Citas (SQLite compatible)
    const citasAgendadas = db.get('SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ?', [id]);
    const citasRealizadas = db.get("SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ? AND estado = 'realizada'", [id]);
    
    // Conversion rate
    const conversionRate = llamadasMes.count > 0 
      ? ((contactosEfectivos.count + interesados.count) / llamadasMes.count * 100).toFixed(1)
      : 0;
    
    // Badges
    const badges = db.all('SELECT b.* FROM badges b JOIN user_badges ub ON b.id = ub.badge_id WHERE ub.user_id = ?', [id]);
    
    // Retos completados
    const retosCompletados = db.get('SELECT COUNT(*) as count FROM user_retos WHERE user_id = ? AND completado = 1', [id]);
    
    res.json({
      vendedor: user,
      llamadas: {
        hoy: llamadasHoy.count,
        semana: llamadasSemana.count,
        mes: llamadasMes.count
      },
      empresas_unicas_semana: empresasSemana.count,
      contactos_efectivos: contactosEfectivos.count,
      leads_interesados: interesados.count,
      citas: {
        agendadas: citasAgendadas.count,
        realizadas: citasRealizadas.count
      },
      conversion_rate: conversionRate,
      badges,
      retos_completados: retosCompletados.count
    });
  } catch (error) {
    console.error('Get vendedor stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del vendedor' });
  }
});

// Get activity log (audit trail)
router.get('/activity', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { user_id, entity_type, limit = 50 } = req.query;
    
    let query = 'SELECT al.*, u.name as user_name FROM activity_log al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1';
    const params = [];
    
    if (user_id) {
      query += ' AND al.user_id = ?';
      params.push(user_id);
    }
    
    if (entity_type) {
      query += ' AND al.entity_type = ?';
      params.push(entity_type);
    }
    
    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const activities = db.all(query, params);
    res.json(activities);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
});

// Get reports (exportable data)
router.get('/report', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { tipo = 'diario', fecha_inicio, fecha_fin } = req.query;
    
    let startDate, endDate;
    const hoy = new Date();
    
    switch (tipo) {
      case 'diario':
        startDate = endDate = hoy.toISOString().split('T')[0];
        break;
      case 'semanal':
        startDate = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = hoy.toISOString().split('T')[0];
        break;
      case 'mensual':
        startDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        endDate = hoy.toISOString().split('T')[0];
        break;
      default:
        startDate = fecha_inicio || startDate;
        endDate = fecha_fin || endDate;
    }
    
    // Llamadas por vendedor
    const llamadasPorVendedor = db.all(`
      SELECT u.name as vendedor, COUNT(*) as total_llamadas,
        SUM(CASE WHEN l.es_contacto_efectivo = 1 THEN 1 ELSE 0 END) as efectivos,
        SUM(CASE WHEN l.estado = 'interesado' THEN 1 ELSE 0 END) as interesados
      FROM llamadas l
      JOIN users u ON l.vendedor_id = u.id
      WHERE l.fecha_llamada BETWEEN ? AND ?
      GROUP BY u.id
      ORDER BY total_llamadas DESC
    `, [startDate + ' 00:00:00', endDate + ' 23:59:59']);
    
    // Empresas por estado
    const empresasPorEstado = db.all(`
      SELECT estado, COUNT(*) as count 
      FROM empresas 
      WHERE updated_at BETWEEN ? AND ?
      GROUP BY estado
    `, [startDate + ' 00:00:00', endDate + ' 23:59:59']);
    
    // Citas por tipo
    const citasPorTipo = db.all(`
      SELECT tipo, estado, COUNT(*) as count 
      FROM citas 
      WHERE fecha_hora BETWEEN ? AND ?
      GROUP BY tipo, estado
    `, [startDate + ' 00:00:00', endDate + ' 23:59:59']);
    
    res.json({
      periodo: { inicio: startDate, fin: endDate, tipo },
      llamadas_por_vendedor: llamadasPorVendedor,
      empresas_por_estado: empresasPorEstado,
      citas_por_tipo: citasPorTipo
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Get chart data for dashboard
router.get('/charts', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { days = 7 } = req.query;
    const chartData = [];
    
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const llamadas = db.get('SELECT COUNT(*) as count FROM llamadas WHERE fecha_llamada LIKE ?', [date + '%']);
      const empresas = db.get('SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE fecha_llamada LIKE ?', [date + '%']);
      const citas = db.get("SELECT COUNT(*) as count FROM citas WHERE fecha_hora LIKE ? AND estado = 'pendiente'", [date + '%']);
      
      chartData.push({
        fecha: date,
        llamadas: llamadas.count,
        empresas_contactadas: empresas.count,
        citas_pendientes: citas.count
      });
    }
    
    res.json(chartData);
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({ error: 'Error al obtener datos para gráfico' });
  }
});

// Get all vendedores with metrics (for admin dashboard)
router.get('/vendedores', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { periodo = 'semana' } = req.query;
    
    let startDate;
    const hoy = new Date();
    
    switch (periodo) {
      case 'dia':
        startDate = hoy.toISOString().split('T')[0];
        break;
      case 'semana':
        startDate = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'mes':
        startDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    // Get all vendedores
    const usuarios = db.all("SELECT id, name, email, role FROM users WHERE role IN ('vendedor', 'admin', 'supervisor')");
    
    const metrics = usuarios.map(usuario => {
      // Llamadas en el periodo
      const llamadasPeriodo = db.get(
        'SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada >= ?',
        [usuario.id, startDate + ' 00:00:00']
      );
      
      // Llamadas de hoy
      const hoyStr = hoy.toISOString().split('T')[0];
      const llamadasHoy = db.get(
        'SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?',
        [usuario.id, hoyStr + '%']
      );
      
      // Empresas únicas contactadas en periodo
      const empresasUnicas = db.get(
        'SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada >= ?',
        [usuario.id, startDate + ' 00:00:00']
      );
      
      // Contactos efectivos
      const contactosEfectivos = db.get(
        'SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND es_contacto_efectivo = 1 AND fecha_llamada >= ?',
        [usuario.id, startDate + ' 00:00:00']
      );
      
      // Leads interesados
      const interesados = db.get(
        `SELECT COUNT(*) as count FROM empresas WHERE vendedor_id = ? AND estado IN ('interesado', 'cita_agendada')`,
        [usuario.id]
      );
      
      // Citas agendadas
      const citasAgendadas = db.get(
        'SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ? AND estado = ?',
        [usuario.id, 'pendiente']
      );
      
      // Citas realizadas en periodo
      const citasRealizadas = db.get(
        'SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ? AND estado = ? AND fecha_hora >= ?',
        [usuario.id, 'realizada', startDate + ' 00:00:00']
      );
      
      // Puntos
      const user = db.get('SELECT puntos FROM users WHERE id = ?', [usuario.id]);
      
      return {
        id: usuario.id,
        nombre: usuario.name,
        email: usuario.email,
        rol: usuario.role,
        llamadas: {
          periodo: llamadasPeriodo.count,
          hoy: llamadasHoy.count
        },
        empresas_unicas: empresasUnicas.count,
        contactos_efectivos: contactosEfectivos.count,
        leads_interesados: interesados.count,
        citas: {
          agendadas: citasAgendadas.count,
          realizadas: citasRealizadas.count
        },
        puntos: user?.puntos || 0,
        conversion_rate: llamadasPeriodo.count > 0 
          ? (contactosEfectivos.count / llamadasPeriodo.count * 100).toFixed(1)
          : 0
      };
    });
    
    res.json({
      periodo,
      fecha_inicio: startDate,
      fecha_fin: hoy.toISOString().split('T')[0],
      vendedores: metrics
    });
  } catch (error) {
    console.error('Get vendedores metrics error:', error);
    res.status(500).json({ error: 'Error al obtener métricas de vendedores' });
  }
});

// Get metrics comparison between periods
router.get('/comparacion', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    
    const hoy = new Date();
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hace14Dias = new Date(hoy.getTime() - 14 * 24 * 60 * 60 * 1000);
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Esta semana vs semana anterior
    const semanaActual = db.get(
      'SELECT COUNT(*) as count FROM llamadas WHERE fecha_llamada >= ?',
      [hace7Dias.toISOString().split('T')[0] + ' 00:00:00']
    );
    const semanaAnterior = db.get(
      'SELECT COUNT(*) as count FROM llamadas WHERE fecha_llamada BETWEEN ? AND ?',
      [hace14Dias.toISOString().split('T')[0] + ' 00:00:00', hace7Dias.toISOString().split('T')[0] + ' 23:59:59']
    );
    
    // Este mes vs mes anterior
    const mesActual = db.get(
      'SELECT COUNT(*) as count FROM llamadas WHERE fecha_llamada >= ?',
      [hace30Dias.toISOString().split('T')[0] + ' 00:00:00']
    );
    const mesAnterior = db.get(
      'SELECT COUNT(*) as count FROM llamadas WHERE fecha_llamada BETWEEN ? AND ?',
      [new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0] + ' 00:00:00', hace30Dias.toISOString().split('T')[0] + ' 23:59:59']
    );
    
    // Leads interesados actual vs anterior
    const interesadosAhora = db.get(
      "SELECT COUNT(*) as count FROM empresas WHERE estado IN ('interesado', 'cita_agendada')"
    );
    const interesadosAntes = db.get(
      "SELECT COUNT(*) as count FROM empresas WHERE updated_at < ? AND estado IN ('interesado', 'cita_agendada')",
      [hace30Dias.toISOString().split('T')[0] + ' 00:00:00']
    );
    
    res.json({
      llamadas: {
        semana_actual: semanaActual.count,
        semana_anterior: semanaAnterior.count,
        variacion_semanal: semanaAnterior.count > 0 
          ? ((semanaActual.count - semanaAnterior.count) / semanaAnterior.count * 100).toFixed(1)
          : 0,
        mes_actual: mesActual.count,
        mes_anterior: mesAnterior.count,
        variacion_mensual: mesAnterior.count > 0 
          ? ((mesActual.count - mesAnterior.count) / mesAnterior.count * 100).toFixed(1)
          : 0
      },
      leads: {
        actuales: interesadosAhora.count,
        hace_30_dias: interesadosAntes.count,
        nuevos: Math.max(0, interesadosAhora.count - interesadosAntes.count)
      }
    });
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({ error: 'Error al obtener comparaciones' });
  }
});

// Get daily metrics for a specific vendedor
router.get('/vendedor/:id/diario', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const { dias = 30 } = req.query;
    
    const dailyData = [];
    
    for (let i = parseInt(dias) - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const llamadas = db.get(
        'SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?',
        [id, date + '%']
      );
      
      const empresas = db.get(
        'SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?',
        [id, date + '%']
      );
      
      const efectivos = db.get(
        'SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ? AND es_contacto_efectivo = 1',
        [id, date + '%']
      );
      
      dailyData.push({
        fecha: date,
        llamadas: llamadas.count,
        empresas_contactadas: empresas.count,
        contactos_efectivos: efectivos.count
      });
    }
    
    res.json(dailyData);
  } catch (error) {
    console.error('Get daily metrics error:', error);
    res.status(500).json({ error: 'Error al obtener métricas diarias' });
  }
});

// Get conversion funnel data
router.get('/conversion', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // Total llamadas este mes
    const totalLlamadas = db.get(
      'SELECT COUNT(*) as count FROM llamadas WHERE fecha_llamada >= ?',
      [startOfMonth + ' 00:00:00']
    );
    
    // Llamadas efectivas (estado: llamado efectivo o interesado)
    const llamadasEfectivas = db.get(
      "SELECT COUNT(*) as count FROM llamadas WHERE fecha_llamada >= ? AND estado IN ('llamada_efectiva', 'interesado')",
      [startOfMonth + ' 00:00:00']
    );
    
    // Citas agendadas este mes
    const citasAgendadas = db.get(
      "SELECT COUNT(*) as count FROM citas WHERE DATE(fecha_hora) >= ?",
      [startOfMonth]
    );
    
    // Citas realizadas
    const citasRealizadas = db.get(
      "SELECT COUNT(*) as count FROM citas WHERE DATE(fecha_hora) >= ? AND estado = 'realizada'",
      [startOfMonth]
    );
    
    // Empresas cerradas este mes
    const empresasCerradas = db.get(
      "SELECT COUNT(*) as count FROM empresas WHERE DATE(updated_at) >= ? AND estado = 'cerrado'",
      [startOfMonth]
    );
    
    res.json({
      llamadas: totalLlamadas.count,
      llamadas_efectivas: llamadasEfectivas.count,
      citas_agendadas: citasAgendadas.count,
      citas_realizadas: citasRealizadas.count,
      empresas_cerradas: empresasCerradas.count,
      tasa_conversion: totalLlamadas.count > 0 
        ? ((empresasCerradas.count / totalLlamadas.count) * 100).toFixed(1) 
        : 0
    });
  } catch (error) {
    console.error('Get conversion error:', error);
    res.status(500).json({ error: 'Error al obtener conversión' });
  }
});

module.exports = router;