const express = require('express');
const router = express.Router();

// GET - Obtener todas las configuraciones
router.get('/', (req, res) => {
  try {
    const db = req.db;
    const settings = db.all('SELECT key, value FROM settings');
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    res.json(result);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

// GET - Obtener una configuración específica
router.get('/:key', (req, res) => {
  try {
    const db = req.db;
    const setting = db.get('SELECT key, value FROM settings WHERE key = ?', req.params.key);
    if (!setting) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error getting setting:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// POST - Crear o actualizar configuración
router.post('/', (req, res) => {
  try {
    const db = req.db;
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'La clave es requerida' });
    }

    const existing = db.get('SELECT id FROM settings WHERE key = ?', key);
    
    if (existing) {
      db.run('UPDATE settings SET value = ?, updated_at = datetime("now") WHERE key = ?', value, key);
    } else {
      const { v4: uuidv4 } = require('uuid');
      db.run('INSERT INTO settings (id, key, value) VALUES (?, ?, ?)', uuidv4(), key, value);
    }
    
    res.json({ key, value });
  } catch (error) {
    console.error('Error saving setting:', error);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

// PUT - Actualizar configuración
router.put('/:key', (req, res) => {
  try {
    const db = req.db;
    const { key } = req.params;
    const { value } = req.body;
    
    const existing = db.get('SELECT id FROM settings WHERE key = ?', key);
    if (!existing) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    db.run('UPDATE settings SET value = ?, updated_at = datetime("now") WHERE key = ?', value, key);
    res.json({ key, value });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// DELETE - Eliminar configuración
router.delete('/:key', (req, res) => {
  try {
    const db = req.db;
    const { key } = req.params;
    const result = db.run('DELETE FROM settings WHERE key = ?', key);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    res.json({ message: 'Configuración eliminada' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Error al eliminar configuración' });
  }
});

module.exports = router;