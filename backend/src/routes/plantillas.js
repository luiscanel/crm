const express = require('express');
const router = express.Router();
const plantillas = require('../data/plantillas');

// GET /api/plantillas - Listar todas las plantillas
router.get('/', (req, res) => {
  try {
    res.json(plantillas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/plantillas/:id - Obtener una plantilla específica
router.get('/:id', (req, res) => {
  try {
    const plantilla = plantillas.find(p => p.id === req.params.id);
    if (!plantilla) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    res.json(plantilla);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/plantillas/canal/:canal - Filtrar por canal (whatsapp, telefono, email)
router.get('/canal/:canal', (req, res) => {
  try {
    const canal = req.params.canal;
    const filtered = plantillas.filter(p => p.canal === canal);
    res.json(filtered);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
