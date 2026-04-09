const { initDatabase } = require('./src/models/database');
const crypto = require('crypto');

(async () => {
  const db = await initDatabase();
  
  const servicios = [
    { nombre: 'Mesa de Ayuda (Help Desk)', descripcion: 'Soporte técnico por tickets, atención a usuarios', precio: 2000 },
    { nombre: 'Monitorización 24/7', descripcion: 'Supervisión continua de servidores y red', precio: 1500 },
    { nombre: 'Instalación de Software', descripcion: 'Configuración y despliegue de aplicaciones', precio: 500 },
    { nombre: 'Mantenimiento Preventivo', descripcion: 'Revisión trimestral de infraestructura', precio: 1200 },
    { nombre: 'Consultoría IT', descripcion: 'Análisis y recomendaciones tecnológicas', precio: 1000 },
    { nombre: 'Capacitación IT', descripcion: 'Entrenamiento a empleados y usuarios', precio: 800 },
    { nombre: 'Migración de Datos', descripcion: 'Traslado de sistemas y datos', precio: 3000 },
    { nombre: 'Configuración Cloud', descripcion: 'AWS/Azure/GCP setup y gestión', precio: 2500 },
    { nombre: 'Telefonía VoIP', descripcion: 'Instalación y configuración de VoIP', precio: 1800 },
    { nombre: 'Cámaras de Seguridad IP', descripcion: 'Sistema CCTV IP profesional', precio: 4000 },
    { nombre: 'Pack Pyme', descripcion: 'Redes + Antivirus + Backup', precio: 3500 },
    { nombre: 'Pack Seguridad', descripcion: 'Firewall + Malware + Backup', precio: 4000 },
    { nombre: 'Pack Premium', descripcion: 'Todo incluido - solución integral', precio: 8000 },
  ];

  servicios.forEach(s => {
    db.run('INSERT INTO servicios (id, nombre, descripcion, precio) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), s.nombre, s.descripcion, s.precio]);
  });

  const count = db.get('SELECT COUNT(*) as count FROM servicios');
  console.log('✅ Nuevos:', servicios.length, '| Total:', count.count);
})();
