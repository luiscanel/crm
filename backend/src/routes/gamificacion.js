const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { notifyPremioCanjeado } = require('../services/websocket');

const router = express.Router();

// Get user points and stats
router.get('/points', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const user = db.get('SELECT id, name, puntos FROM users WHERE id = ?', [req.user.id]);
    
    // Get calls count
    const totalLlamadas = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ?', [req.user.id]);
    
    // Get effective contacts
    const contactosEfectivos = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND es_contacto_efectivo = 1', [req.user.id]);
    
    // Get interested empresas
    const empresasInteresadas = db.get(`
      SELECT COUNT(DISTINCT e.id) as count 
      FROM empresas e
      JOIN llamadas l ON e.id = l.empresa_id
      WHERE l.vendedor_id = ? AND e.estado = 'interesado'
    `, [req.user.id]);
    
    // Get citas agendadas
    const citasAgendadas = db.get('SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ?', [req.user.id]);

    res.json({
      puntos: user.puntos,
      total_llamadas: totalLlamadas.count,
      contactos_efectivos: contactosEfectivos.count,
      empresas_interesadas: empresasInteresadas.count,
      citas_agendadas: citasAgendadas.count
    });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: 'Error al obtener puntos' });
  }
});

// Get all badges
router.get('/badges', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const allBadges = db.all('SELECT * FROM badges');
    
    // Get user's earned badges
    const userBadges = db.all(`
      SELECT b.*, ub.obtained_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = ?
    `, [req.user.id]);
    
    const earnedBadgeIds = userBadges.map(b => b.id);
    
    // Mark badges as earned or not
    const badges = allBadges.map(badge => ({
      ...badge,
      earned: earnedBadgeIds.includes(badge.id),
      obtained_at: userBadges.find(ub => ub.id === badge.id)?.obtained_at || null
    }));
    
    res.json(badges);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Error al obtener insignias' });
  }
});

// Check and award badges
router.post('/badges/check', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;
    
    // Get user stats
    const totalLlamadas = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ?', [userId]);
    const citasAgendadas = db.get('SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ?', [userId]);
    
    // Calculate conversion rate
    const empresasInteresadas = db.get(`
      SELECT COUNT(DISTINCT e.id) as count 
      FROM empresas e
      JOIN llamadas l ON e.id = l.empresa_id
      WHERE l.vendedor_id = ? AND e.estado IN ('interesado', 'cita_agendada')
    `, [userId]);
    
    const conversionRate = totalLlamadas.count > 0 
      ? (empresasInteresadas.count / totalLlamadas.count) * 100 
      : 0;
    
    // Contactos efectivos
    const contactosEfectivos = db.get(
      'SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND es_contacto_efectivo = 1',
      [userId]
    );
    
    // Empresas creadas
    const empresasCreadas = db.get(
      'SELECT COUNT(*) as count FROM empresas WHERE vendedor_id = ?',
      [userId]
    );
    
    // Puntos del usuario
    const userPuntos = db.get('SELECT puntos FROM users WHERE id = ?', [userId]);
    const userPuntosCount = userPuntos?.puntos || 0;
    
    // Racha (días seguidos) - por ahora simplificado
    const rachaDias = 0; // Se implementaría con lógica de tracking diario
    
    // Check each badge
    const allBadges = db.all('SELECT * FROM badges');
    const newBadges = [];
    
    for (const badge of allBadges) {
      // Check if user already has this badge
      const existing = db.get('SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?', [userId, badge.id]);
      if (existing) continue;
      
      let earned = false;
      
      switch (badge.tipo) {
        case 'llamadas':
          earned = totalLlamadas.count >= badge.requisito;
          break;
        case 'citas':
          earned = citasAgendadas.count >= badge.requisito;
          break;
        case 'conversion':
          earned = conversionRate >= badge.requisito;
          break;
        case 'contactos':
          earned = (contactosEfectivos?.count || 0) >= badge.requisito;
          break;
        case 'empresas':
          earned = (empresasCreadas?.count || 0) >= badge.requisito;
          break;
        case 'puntos':
          earned = userPuntosCount >= badge.requisito;
          break;
        case 'racha':
          earned = rachaDias >= badge.requisito;
          break;
      }
      
      if (earned) {
        db.run('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badge.id]);
        newBadges.push(badge);
      }
    }
    
    res.json({ 
      message: newBadges.length > 0 ? `¡Felicidades! Has obtenido ${newBadges.length} nueva(s) insignia(s)` : 'No hay nuevas insignias',
      new_badges: newBadges,
      stats: {
        total_llamadas: totalLlamadas.count,
        citas_agendadas: citasAgendadas.count,
        conversion_rate: conversionRate.toFixed(2),
        contactos_efectivos: contactosEfectivos?.count || 0,
        empresas_creadas: empresasCreadas?.count || 0,
        puntos: userPuntosCount
      }
    });
  } catch (error) {
    console.error('Check badges error:', error);
    res.status(500).json({ error: 'Error al verificar insignias' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const vendedores = db.all(`
      SELECT u.id, u.name, u.puntos,
        (SELECT COUNT(*) FROM llamadas WHERE vendedor_id = u.id) as total_llamadas,
        (SELECT COUNT(*) FROM citas WHERE vendedor_id = u.id) as total_citas
      FROM users u
      WHERE u.role = 'vendedor'
      ORDER BY u.puntos DESC
    `);
    
    res.json(vendedores);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

// Get active challenges (retos)
router.get('/retos', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const today = new Date().toISOString().split('T')[0];
    
    // Get active retos
    const activeRetos = db.all(`
      SELECT * FROM retos 
      WHERE activo = 1 
      AND (fecha_fin >= ? OR fecha_fin IS NULL)
      ORDER BY tipo, created_at
    `, [today]);
    
    // Get user's progress on each reto
    const userRetos = db.all('SELECT * FROM user_retos WHERE user_id = ?', [req.user.id]);
    
    // Calculate current progress for each reto
    const retosConProgreso = activeRetos.map(reto => {
      let progreso = 0;
      const hoy = new Date().toISOString().split('T')[0];
      
      switch (reto.tipo) {
        case 'diario':
          // Daily calls
          const callsToday = db.get(
            `SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?`,
            [req.user.id, hoy]
          );
          progreso = callsToday.count;
          break;
        case 'semanal':
          // Weekly empresas contacted
          const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const empresasSemana = db.get(
            `SELECT COUNT(DISTINCT empresa_id) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada BETWEEN ? AND ?`,
            [req.user.id, inicioSemana + ' 00:00:00', hoy + ' 23:59:59']
          );
          progreso = empresasSemana.count;
          break;
        case 'mensual':
          // Monthly conversion
          const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
          const llamadasMes = db.get(
            `SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada >= ?`,
            [req.user.id, inicioMes + ' 00:00:00']
          );
          progreso = llamadasMes.count;
          break;
      }
      
      const completed = progreso >= reto.meta;
      
      // Update or create user_reto record
      const existingUserReto = userRetos.find(ur => ur.reto_id === reto.id);
      if (!existingUserReto) {
        db.run(
          `INSERT INTO user_retos (user_id, reto_id, progreso, completado) VALUES (?, ?, ?, ?)`,
          [req.user.id, reto.id, progreso, completed ? 1 : 0]
        );
      } else if (existingUserReto.progreso !== progreso) {
        db.run(
          `UPDATE user_retos SET progreso = ?, completado = ? WHERE user_id = ? AND reto_id = ?`,
          [progreso, completed ? 1 : 0, req.user.id, reto.id]
        );
      }
      
      return {
        ...reto,
        progreso,
        porcentaje: Math.min((progreso / reto.meta) * 100, 100),
        completado: completed
      };
    });
    
    res.json(retosConProgreso);
  } catch (error) {
    console.error('Get retos error:', error);
    res.status(500).json({ error: 'Error al obtener retos' });
  }
});

// Get gamification summary
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;
    
    // Points
    const user = db.get('SELECT puntos FROM users WHERE id = ?', [userId]);
    
    // Badges count
    const badgesCount = db.get('SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?', [userId]);
    
    // Retos completados
    const retosCompletados = db.get('SELECT COUNT(*) as count FROM user_retos WHERE user_id = ? AND completado = 1', [userId]);
    
    // Total calls
    const totalLlamadas = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ?', [userId]);
    
    res.json({
      puntos: user.puntos,
      insignias: badgesCount.count,
      retos_completados: retosCompletados.count,
      total_llamadas: totalLlamadas.count
    });
  } catch (error) {
    console.error('Get gamification summary error:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

// Get all available premios
router.get('/premios', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const user = db.get('SELECT puntos FROM users WHERE id = ?', [req.user.id]);
    
    const premios = db.all(`
      SELECT p.*, 
        CASE WHEN p.cantidad_disponible = -1 THEN 9999 ELSE p.cantidad_disponible END as disponible
      FROM premios p 
      WHERE p.activo = 1
      ORDER BY p.puntos_requeridos ASC
    `);
    
    // Check which ones the user has already claimed
    const claimed = db.all('SELECT premio_id FROM user_premios WHERE user_id = ?', [req.user.id]);
    const claimedIds = claimed.map(c => c.premio_id);
    
    const response = premios.map(p => ({
      ...p,
      puede_canjear: user.puntos >= p.puntos_requeridos,
      ya_canjeado: claimedIds.includes(p.id)
    }));
    
    res.json(response);
  } catch (error) {
    console.error('Get premios error:', error);
    res.status(500).json({ error: 'Error al obtener premios' });
  }
});

// Get user's claimed premios
router.get('/mis-premios', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    
    const misPremios = db.all(`
      SELECT p.*, up.canjeado_at
      FROM user_premios up
      JOIN premios p ON up.premio_id = p.id
      WHERE up.user_id = ?
      ORDER BY up.canjeado_at DESC
    `, [req.user.id]);
    
    res.json(misPremios);
  } catch (error) {
    console.error('Get mis premios error:', error);
    res.status(500).json({ error: 'Error al obtener mis premios' });
  }
});

// Canjear un premio - crea solicitud pendiente
router.post('/solicitar-premio', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const { premio_id } = req.body;
    
    if (!premio_id) {
      return res.status(400).json({ error: 'Premio requerido' });
    }
    
    const premio = db.get('SELECT * FROM premios WHERE id = ? AND activo = 1', [premio_id]);
    if (!premio) {
      return res.status(404).json({ error: 'Premio no encontrado' });
    }
    
    // Check if already requested
    const alreadyRequested = db.get('SELECT 1 FROM solicitudes_premios WHERE usuario_id = ? AND premio_id = ? AND estado = ?', [req.user.id, premio_id, 'pendiente']);
    if (alreadyRequested) {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente para este premio' });
    }
    
    const user = db.get('SELECT puntos, name FROM users WHERE id = ?', [req.user.id]);
    if (user.puntos < premio.puntos_requeridos) {
      return res.status(400).json({ error: 'Puntos insuficientes' });
    }
    
    // Create pending request
    const { v4: uuidv4 } = require('uuid');
    const solicitudId = uuidv4();
    
    db.run(
      `INSERT INTO solicitudes_premios (id, usuario_id, premio_id, puntos_gastados, estado) VALUES (?, ?, ?, ?, ?)`,
      [solicitudId, req.user.id, premio_id, premio.puntos_requeridos, 'pendiente']
    );
    
    // Log activity
    db.run(
      `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'solicitar_premio', 'solicitud_premio', solicitudId, `Solicitó: ${premio.nombre} (${premio.puntos_requeridos} pts) - Pendiente de aprobación`]
    );
    
    // Send WhatsApp to admin
    const adminUser = db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminUser) {
      const userInfo = db.get('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
      const mensaje = `🎁 *Nueva Solicitud de Premio*\n\n👤 *Vendedor:* ${userInfo.name}\n📧 *Email:* ${userInfo.email}\n🎯 *Premio:* ${premio.nombre}\n💰 *Puntos:* ${premio.puntos_requeridos} pts\n\n📋 *ID Solicitud:* ${solicitudId}\n\n⚠️ *Acción requerida:* Aprobar o rechazar en el panel de admin.`;
      
      // Try to send WhatsApp (CallMeBot API - configured in env or default)
      const whatsappNumber = process.env.ADMIN_WHATSAPP || '50230620160';
      const whatsappApiKey = process.env.WHATSAPP_API_KEY || '';
      
      if (whatsappApiKey) {
        const fetch = require('node-fetch');
        const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${whatsappNumber}&text=${encodeURIComponent(mensaje)}&apikey=${whatsappApiKey}`;
        fetch(waUrl).catch(e => console.log('WhatsApp send error:', e.message));
      } else {
        console.log(`📱 WhatsApp no configurado. Mensaje para admin: ${mensaje}`);
      }
    }
    
    res.json({ 
      message: 'Solicitud enviada. Pendiente de aprobación del admin.',
      solicitud_id: solicitudId,
      premio: premio,
      puntos: user.puntos,
      estado: 'pendiente'
    });
  } catch (error) {
    console.error('SolicitarPremio error:', error);
    res.status(500).json({ error: 'Error al solicitar premio' });
  }
});

// Aprobar/Rechazar solicitud de premio (admin)
router.post('/aprobar-solicitud', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    
    // Only admin can approve
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo el admin puede aprobar premios' });
    }
    
    const { solicitud_id, aprobar } = req.body;
    
    if (!solicitud_id) {
      return res.status(400).json({ error: 'ID de solicitud requerido' });
    }
    
    const solicitud = db.get('SELECT * FROM solicitudes_premios WHERE id = ?', [solicitud_id]);
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
    }
    
    const { v4: uuidv4 } = require('uuid');
    
    if (aprobar) {
      // Deduct points and award premio
      db.run('UPDATE users SET puntos = puntos - ? WHERE id = ?', [solicitud.puntos_gastados, solicitud.usuario_id]);
      db.run('INSERT INTO user_premios (user_id, premio_id) VALUES (?, ?)', [solicitud.usuario_id, solicitud.premio_id]);
      db.run("UPDATE solicitudes_premios SET estado = ?, resuelta_at = datetime('now'), resuelta_por = ? WHERE id = ?", ['aprobado', req.user.id, solicitud_id]);
      
      const premio = db.get('SELECT nombre FROM premios WHERE id = ?', [solicitud.premio_id]);
      db.run(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), req.user.id, 'aprobar_premio', 'solicitud_premio', solicitud_id, `Aprobó: ${premio.nombre} para usuario ${solicitud.usuario_id}`]
      );
      
      res.json({ message: 'Premio aprobado', estado: 'aprobado' });
      
      // Send WebSocket notification
      try {
        notifyPremioCanjeado(solicitud.usuario_id, { nombre: premio.nombre, costo: solicitud.puntos_gastados });
      } catch (wsError) {
        console.error('WebSocket notification error:', wsError);
      }
    } else {
      // Just reject
      db.run("UPDATE solicitudes_premios SET estado = ?, resuelta_at = datetime('now'), resuelta_por = ? WHERE id = ?", ['rechazado', req.user.id, solicitud_id]);
      
      const premio = db.get('SELECT nombre FROM premios WHERE id = ?', [solicitud.premio_id]);
      db.run(
        `INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), req.user.id, 'rechazar_premio', 'solicitud_premio', solicitud_id, `Rechazó: ${premio.nombre} para usuario ${solicitud.usuario_id}`]
      );
      
      res.json({ message: 'Premio rechazado', estado: 'rechazado' });
    }
  } catch (error) {
    console.error('AprobarSolicitud error:', error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
});

// Get solicitudes de premios (admin)
router.get('/solicitudes', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    
    // Only admin can see all requests
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo el admin puede ver las solicitudes' });
    }
    
    const solicitudes = db.all(`
      SELECT sp.*, p.nombre as premio_nombre, p.icono as premio_icono, u.name as usuario_nombre, u.email as usuario_email
      FROM solicitudes_premios sp
      JOIN premios p ON sp.premio_id = p.id
      JOIN users u ON sp.usuario_id = u.id
      WHERE sp.estado = 'pendiente'
      ORDER BY sp.solicitud_at DESC
    `);
    
    res.json(solicitudes);
  } catch (error) {
    console.error('Get solicitudes error:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// Get mis solicitudes
router.get('/mis-solicitudes', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    
    const solicitudes = db.all(`
      SELECT sp.*, p.nombre as premio_nombre, p.icono as premio_icono
      FROM solicitudes_premios sp
      JOIN premios p ON sp.premio_id = p.id
      WHERE sp.usuario_id = ?
      ORDER BY sp.solicitud_at DESC
    `, [req.user.id]);
    
    res.json(solicitudes);
  } catch (error) {
    console.error('Get mis solicitudes error:', error);
    res.status(500).json({ error: 'Error al obtener mis solicitudes' });
  }
});

// Get dashboard stats for vendedor (streak, best day, ranking)
router.get('/dashboard-stats', authenticateToken, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;
    
    // Get yesterday and today's calls
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const llamadasHoy = db.get(
      `SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?`,
      [userId, today + '%']
    );
    
    const llamadasAyer = db.get(
      `SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?`,
      [userId, yesterday + '%']
    );
    
    // Calculate streak (consecutive days meeting goal of 25+ calls)
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const count = db.get(
        `SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND fecha_llamada LIKE ?`,
        [userId, dateStr + '%']
      );
      if (count.count >= 25) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Get best day (most calls in a single day)
    const bestDay = db.get(`
      SELECT fecha_llamada, COUNT(*) as count 
      FROM llamadas 
      WHERE vendedor_id = ?
      GROUP BY date(fecha_llamada)
      ORDER BY count DESC
      LIMIT 1
    `, [userId]);
    
    // Get ranking position among all sellers
    const allSellers = db.all(`
      SELECT id, name, puntos FROM users WHERE role IN ('vendedor', 'admin')
      ORDER BY puntos DESC
    `);
    
    const rankingPosition = allSellers.findIndex(u => u.id === userId) + 1;
    const sellersCount = allSellers.length;
    
    // Get next badge progress
    const userBadges = db.all(`SELECT badge_id FROM user_badges WHERE user_id = ?`, [userId]);
    const earnedBadgeIds = userBadges.map(b => b.badge_id);
    
    let nextBadge = null;
    if (earnedBadgeIds.length > 0) {
      const placeholders = earnedBadgeIds.map(() => '?').join(',');
      nextBadge = db.get(`
        SELECT * FROM badges WHERE id NOT IN (${placeholders})
        ORDER BY requisito ASC
        LIMIT 1
      `, earnedBadgeIds);
    } else {
      nextBadge = db.get(`SELECT * FROM badges ORDER BY requisito ASC LIMIT 1`);
    }
    
    // Get user stats for badge progress
    let userProgress = 0;
    let progressLabel = '';
    if (nextBadge) {
      if (nextBadge.tipo === 'llamadas') {
        userProgress = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ?', [userId]).count;
        progressLabel = `${userProgress}/${nextBadge.requisito} llamadas`;
      } else if (nextBadge.tipo === 'contactos') {
        userProgress = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ? AND es_contacto_efectivo = 1', [userId]).count;
        progressLabel = `${userProgress}/${nextBadge.requisito} contactos`;
      } else if (nextBadge.tipo === 'citas') {
        userProgress = db.get('SELECT COUNT(*) as count FROM citas WHERE vendedor_id = ?', [userId]).count;
        progressLabel = `${userProgress}/${nextBadge.requisito} citas`;
      } else if (nextBadge.tipo === 'puntos') {
        userProgress = db.get('SELECT puntos FROM users WHERE id = ?', [userId]).puntos;
        progressLabel = `${userProgress}/${nextBadge.requisito} puntos`;
      } else if (nextBadge.tipo === 'empresas') {
        userProgress = db.get('SELECT COUNT(*) as count FROM empresas WHERE vendedor_id = ?', [userId]).count;
        progressLabel = `${userProgress}/${nextBadge.requisito} empresas`;
      } else if (nextBadge.tipo === 'conversion') {
        const totalLlamadas = db.get('SELECT COUNT(*) as count FROM llamadas WHERE vendedor_id = ?', [userId]);
        const empresasInteresadas = db.get(
          `SELECT COUNT(DISTINCT e.id) as count FROM empresas e WHERE e.vendedor_id = ? AND e.estado IN ('interesado', 'cita_agendada')`,
          [userId]
        );
        userProgress = totalLlamadas.count > 0 
          ? (empresasInteresadas.count / totalLlamadas.count) * 100 
          : 0;
        progressLabel = `${userProgress.toFixed(1)}%/${nextBadge.requisito}% conversión`;
      } else if (nextBadge.tipo === 'racha') {
        userProgress = streak;
        progressLabel = `${userProgress}/${nextBadge.requisito} días seguidos`;
      }
    }
    
    res.json({
      llamadas_hoy: llamadasHoy.count,
      llamadas_ayer: llamadasAyer.count,
      diferencia: llamadasHoy.count - llamadasAyer.count,
      streak: streak,
      best_day: bestDay ? {
        fecha: bestDay.fecha_llamada,
        cantidad: bestDay.count
      } : null,
      ranking: {
        posicion: rankingPosition,
        total: sellersCount
      },
      next_badge: nextBadge ? {
        id: nextBadge.id,
        nombre: nextBadge.nombre,
        icono: nextBadge.icono,
        requisito_tipo: nextBadge.tipo,
        requisito_valor: nextBadge.requisito,
        progreso: userProgress,
        progreso_label: progressLabel,
        porcentaje: nextBadge.requisito > 0 ? Math.min((userProgress / nextBadge.requisito) * 100, 100) : 0
      } : null
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;