const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Seed data - solo admin
router.post('/seed', authenticateToken, isAdmin, (req, res) => {
  try {
    const db = req.db;
    
    // Get all users
    const users = db.all('SELECT * FROM users');
    console.log('Users found:', users.length);
    if (users.length === 0) {
      return res.status(400).json({ error: 'No hay usuarios en el sistema' });
    }
    
    // Create vendedor if not exists
    let vendedorUser = users.find(u => u.role === 'vendedor');
    if (!vendedorUser) {
      const { v4: uuidv4 } = require('uuid');
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('vendedor123', 10);
      const vendedorId = uuidv4();
      db.run(
        `INSERT INTO users (id, email, password, name, role, puntos) VALUES (?, ?, ?, ?, ?, ?)`,
        [vendedorId, 'vendedor@teknao.com', hashedPassword, 'Vendedor Demo', 'vendedor', 0]
      );
      vendedorUser = { id: vendedorId };
      console.log('Created vendedor user');
    }
    
    // Create 10 empresas
    const empresasData = [
      { nombre: 'Tech Solutions GT', industria: 'Tecnología', tamano: 'Mediana', ubicacion: 'Ciudad de Guatemala', telefono: '+50212345601', estado: 'nuevo' },
      { nombre: 'Constructora Central', industria: 'Construcción', tamano: 'Grande', ubicacion: 'Antigua Guatemala', telefono: '+50212345602', estado: 'contactado' },
      { nombre: 'AgroExport SA', industria: 'Agricultura', tamano: 'Grande', ubicacion: 'Cobán', telefono: '+50212345603', estado: 'interesado' },
      { nombre: 'Hotel Paradise', industria: 'Hotelería', tamano: 'Mediana', ubicacion: 'Tikal', telefono: '+50212345604', estado: 'cita_agendada' },
      { nombre: 'Banco Regional', industria: 'Finanzas', tamano: 'Corporación', ubicacion: 'Ciudad de Guatemala', telefono: '+50212345605', estado: 'seguimiento' },
      { nombre: 'Clinica Salud', industria: 'Salud', tamano: 'Mediana', ubicacion: 'Quetzaltenango', telefono: '+50212345606', estado: 'nuevo' },
      { nombre: 'Escuela Bilingüe', industria: 'Educación', tamano: 'Pequeña', ubicacion: 'Guatemala Sur', telefono: '+50212345607', estado: 'contactado' },
      { nombre: 'AutoRepuestos Maya', industria: 'Automotriz', tamano: 'Mediana', ubicacion: 'Ciudad de Guatemala', telefono: '+50212345608', estado: 'interesado' },
      { nombre: 'Restaurante Gourmet', industria: 'Restaurantes', tamano: 'Pequeña', ubicacion: 'Antigua Guatemala', telefono: '+50212345609', estado: 'nuevo' },
      { nombre: 'Distribuidores del Norte', industria: 'Logística', tamano: 'Grande', ubicacion: 'Huehuetenango', telefono: '+50212345610', estado: 'cerrado' }
    ];
    
    const empresasIds = [];
    for (const emp of empresasData) {
      const id = uuidv4();
      empresasIds.push(id);
      const vendedorId = vendedorUser.id;
      
      try {
        db.run(
          `INSERT INTO empresas (id, nombre, industria, tamano, ubicacion, telefono, estado, vendedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, emp.nombre, emp.industria, emp.tamano, emp.ubicacion, emp.telefono, emp.estado, vendedorId]
        );
      } catch(e) {
        console.error('Error inserting empresa:', e.message);
      }
    }
    
    // Create 20 contactos (2 per empresa)
    const contactosData = [];
    const nombres = ['Juan Pérez', 'María López', 'Carlos García', 'Ana Rodríguez', 'Luis Martínez', 'Sofia Hernández', 'Diego Torres', 'Carmen Ramírez', 'Jorge Castillo', 'Laura Flores'];
    const cargos = ['Gerente', 'Director', 'Jefe de Ventas', 'Gerente de Operaciones', 'Dueño', 'Gerente General', 'Coordinador', 'Gerente de Compras', 'Presidente', 'Gerente de Finanzas'];
    
    for (let i = 0; i < empresasIds.length; i++) {
      for (let j = 0; j < 2; j++) {
        const idx = (i * 2 + j) % nombres.length;
        const contactoId = uuidv4();
        contactosData.push(contactoId);
        
        db.run(
          `INSERT INTO contactos (id, empresa_id, nombre, cargo, telefono, canal_preferido, nivel_interes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [contactoId, empresasIds[i], nombres[idx], cargos[idx], `+50298765${String(i * 2 + j).padStart(3, '0')}`, 'whatsapp', 'medio']
        );
      }
    }
    
    // Create 15 llamadas
    const estadosLlamada = ['nuevo', 'contactado', 'interesado', 'llamada_efectiva'];
    for (let i = 0; i < 15; i++) {
      const empresaId = empresasIds[i % empresasIds.length];
      const llamadaId = uuidv4();
    const vendedorId = vendedorUser.id;
      const esEfectivo = Math.random() > 0.5;
      
      db.run(
        `INSERT INTO llamadas (id, empresa_id, vendedor_id, estado, observaciones, es_contacto_efectivo, fecha_llamada) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [llamadaId, empresaId, vendedorId, estadosLlamada[i % estadosLlamada.length], `Llamada de seguimiento #${i + 1}`, esEfectivo ? 1 : 0]
      );
    }
    
    // Create 5 citas
    const tiposCita = ['llamada', 'videollamada', 'presencial'];
    const estadosCita = ['pendiente', 'realizada'];
    for (let i = 0; i < 5; i++) {
      const citaId = uuidv4();
      const empresaId = empresasIds[i];
    const vendedorId = vendedorUser.id;
      
      db.run(
        `INSERT INTO citas (id, empresa_id, vendedor_id, tipo, fecha_hora, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [citaId, empresaId, vendedorId, tiposCita[i % tiposCita.length], `2026-04-${String(15 + i).padStart(2, '0')} 10:00:00`, estadosCita[i % estadosCita.length], `Cita programada #${i + 1}`]
      );
    }
    
    // Create 10 tareas
    const prioridades = ['alta', 'media', 'baja'];
    const estadosTarea = ['pendiente', 'en_progreso', 'completada'];
    for (let i = 0; i < 10; i++) {
      const tareaId = uuidv4();
      const empresaId = empresasIds[i % empresasIds.length];
    const vendedorId = vendedorUser.id;
      
      db.run(
        `INSERT INTO tareas (id, empresa_id, vendedor_id, titulo, descripcion, prioridad, estado, fecha_limite) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tareaId, empresaId, vendedorId, `Tarea #${i + 1}: Seguimiento`, `seguimiento requerido para empresa`, prioridades[i % prioridades.length], estadosTarea[i % estadosTarea.length], `2026-04-${String(20 + i).padStart(2, '0')}`]
      );
    }
    
    // Create 5 notas
    for (let i = 0; i < 5; i++) {
      const notaId = uuidv4();
      const empresaId = empresasIds[i];
    const vendedorId = vendedorUser.id;
      
      db.run(
        `INSERT INTO notas (id, empresa_id, vendedor_id, contenido) VALUES (?, ?, ?, ?)`,
        [notaId, empresaId, vendedorId, `Nota de seguimiento #${i + 1}: Cliente muy interesado en nuestros servicios.`]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Datos de prueba creados',
      created: {
        empresas: empresasIds.length,
        contactos: contactosData.length,
        llamadas: 15,
        citas: 5,
        tareas: 10,
        notas: 5
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Error al crear datos de prueba' });
  }
});

// Clear seed data - solo admin
router.post('/clear-seed', authenticateToken, isAdmin, (req, res) => {
  try {
    const db = req.db;
    
    // Delete in correct order (respecting foreign keys)
    db.run('DELETE FROM notas');
    db.run('DELETE FROM tareas');
    db.run('DELETE FROM citas');
    db.run('DELETE FROM llamadas');
    db.run('DELETE FROM contactos');
    db.run('DELETE FROM empresas');
    db.run('DELETE FROM activity_log');
    db.run('DELETE FROM solicitudespremios');
    
    res.json({ success: true, message: 'Datos de prueba eliminados' });
  } catch (error) {
    console.error('Clear seed error:', error);
    res.status(500).json({ error: 'Error al eliminar datos de prueba' });
  }
});

// Get seed status
router.get('/seed-status', authenticateToken, isAdmin, (req, res) => {
  try {
    const db = req.db;
    
    const empresas = db.get('SELECT COUNT(*) as count FROM empresas');
    const contactos = db.get('SELECT COUNT(*) as count FROM contactos');
    const llamadas = db.get('SELECT COUNT(*) as count FROM llamadas');
    const citas = db.get('SELECT COUNT(*) as count FROM citas');
    const tareas = db.get('SELECT COUNT(*) as count FROM tareas');
    const notas = db.get('SELECT COUNT(*) as count FROM notas');
    
    res.json({
      empresas: empresas.count,
      contactos: contactos.count,
      llamadas: llamadas.count,
      citas: citas.count,
      tareas: tareas.count,
      notas: notas.count
    });
  } catch (error) {
    console.error('Seed status error:', error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
});

// Seed retos activos
router.post('/seed-retos', authenticateToken, isAdmin, (req, res) => {
  try {
    const db = req.db;
    
    const retos = [
      { id: 'r001', tipo: 'diario', objetivo: 'Llamadas Diarias', meta: 25, puntos: 50 },
      { id: 'r002', tipo: 'diario', objetivo: 'Empresas Únicas Diarias', meta: 15, puntos: 30 },
      { id: 'r003', tipo: 'semanal', objetivo: 'Llamadas Semanales', meta: 100, puntos: 200 },
      { id: 'r004', tipo: 'semanal', objetivo: 'Citas Semanales', meta: 5, puntos: 150 },
      { id: 'r005', tipo: 'mensual', objetivo: 'Llamadas Mensuales', meta: 400, puntos: 500 },
      { id: 'r006', tipo: 'mensual', objetivo: 'Conversion Mensual', meta: 10, puntos: 300 },
    ];
    
    for (const r of retos) {
      db.run(`INSERT OR REPLACE INTO retos (id, tipo, objetivo, meta, puntos, activo, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now', '+30 days'))`, 
        [r.id, r.tipo, r.objetivo, r.meta, r.puntos]);
    }
    
    res.json({ success: true, message: `${retos.length} retos creados` });
  } catch (error) {
    console.error('Seed retos error:', error);
    res.status(500).json({ error: 'Error al crear retos' });
  }
});

// Seed premios
router.post('/seed-premios', authenticateToken, isAdmin, (req, res) => {
  try {
    const db = req.db;
    
    const premios = [
      { id: 'p001', nombre: 'Pizza Familiar', descripcion: 'Una pizza familiar de Marks', icono: 'pizza', tipo: 'entretenimiento', puntos_requeridos: 50, cantidad_disponible: -1 },
      { id: 'p002', nombre: 'Cine + Palomitas', descripcion: 'Entrada al cine + paleta de popcorn', icono: 'cine', tipo: 'entretenimiento', puntos_requeridos: 75, cantidad_disponible: -1 },
      { id: 'p003', nombre: 'Desayuno VIP', descripcion: 'Desayuno en restaurant de moda', icono: 'desayuno', tipo: 'comida', puntos_requeridos: 100, cantidad_disponible: -1 },
      { id: 'p004', nombre: 'Tarjeta de Regalo Q50', descripcion: 'Tarjeta de regalo de Q50', icono: 'tarjeta', tipo: 'dinero', puntos_requeridos: 150, cantidad_disponible: 10 },
      { id: 'p005', nombre: 'Almuerzo team', descripcion: 'Almuerzo para todo el equipo', icono: 'lunch', tipo: 'comida', puntos_requeridos: 200, cantidad_disponible: -1 },
      { id: 'p006', nombre: 'Medio día libre', descripcion: 'Medio día de descanso', icono: 'clock', tipo: 'tiempo', puntos_requeridos: 300, cantidad_disponible: 5 },
      { id: 'p007', nombre: 'Bono Q200', descripcion: 'Bono de dinero Q200', icono: 'money', tipo: 'dinero', puntos_requeridos: 500, cantidad_disponible: 3 },
      { id: 'p008', nombre: 'Día completo libre', descripcion: 'Día completo de descanso', icono: 'sun', tipo: 'tiempo', puntos_requeridos: 600, cantidad_disponible: 2 },
    ];
    
    for (const p of premios) {
      db.run(`INSERT OR REPLACE INTO premios (id, nombre, descripcion, icono, tipo, puntos_requeridos, cantidad_disponible, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`, 
        [p.id, p.nombre, p.descripcion, p.icono, p.tipo, p.puntos_requeridos, p.cantidad_disponible]);
    }
    
    res.json({ success: true, message: `${premios.length} premios creados` });
  } catch (error) {
    console.error('Seed premios error:', error);
    res.status(500).json({ error: 'Error al crear premios' });
  }
});

module.exports = router;
