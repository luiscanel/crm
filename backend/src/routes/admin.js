const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Seed data - solo admin (LIMPIO - solo usuario admin)
// Este endpoint ahora SOLO limpia data de demo, no crea nada
router.post('/seed', authenticateToken, isAdmin, (req, res) => {
  try {
    const db = req.db;
    
    // Get all users
    const users = db.all('SELECT * FROM users');
    console.log('Users found:', users.length);
    if (users.length === 0) {
      return res.status(400).json({ error: 'No hay usuarios en el sistema' });
    }
    
    // NO crear vendedor demo automaticamente
    // Solo limpiar data de prueba si existe
    
    // Verificar si hay empresas de demo (telefonos +50212345xxx)
    const empresasDemo = db.all("SELECT * FROM empresas WHERE telefono LIKE '+50212345%'");
    
    if (empresasDemo.length > 0) {
      // Eliminar empresas demo
      for (const emp of empresasDemo) {
        db.run('DELETE FROM empresas WHERE id = ?', [emp.id]);
      }
      console.log('Deleted demo empresas:', empresasDemo.length);
    }
    
    // Eliminar usuario vendedor demo si existe
    const vendedorDemo = db.get("SELECT * FROM users WHERE email = 'vendedor@teknao.com'");
    if (vendedorDemo) {
      db.run('DELETE FROM users WHERE id = ?', [vendedorDemo.id]);
      console.log('Deleted vendedor demo user');
    }
    
    res.json({ 
      message: 'Seed cleanup completo',
      users_count: users.length,
      empresas_eliminadas: empresasDemo.length,
      vendedor_demo_eliminado: vendedorDemo ? true : false
    });
    
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear ALL seed data - solo admin
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
