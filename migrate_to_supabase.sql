-- ================================================
-- CREAR TABLAS EN SUPABASE
-- Ejecutar este script en SQL Editor de Supabase
-- ================================================

-- Tabla users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'vendedor',
  puntos INTEGER DEFAULT 0,
  puntos_mes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla empresas
CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  estado TEXT DEFAULT 'nuevo',
  vendedor_id TEXT,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendedor_id) REFERENCES users(id)
);

-- Tabla contactos
CREATE TABLE IF NOT EXISTS contactos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  cargo TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabla llamadas
CREATE TABLE IF NOT EXISTS llamadas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  vendedor_id TEXT NOT NULL,
  estado TEXT DEFAULT 'sin_contacto',
  notas TEXT,
  es_contacto_efectivo INTEGER DEFAULT 0,
  fecha_llamada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (vendedor_id) REFERENCES users(id)
);

-- Tabla citas
CREATE TABLE IF NOT EXISTS citas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  vendedor_id TEXT NOT NULL,
  contacto_id TEXT,
  fecha_hora TIMESTAMP NOT NULL,
  motivo TEXT,
  estado TEXT DEFAULT 'pendiente',
  link_videollamada TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (vendedor_id) REFERENCES users(id),
  FOREIGN KEY (contacto_id) REFERENCES contactos(id)
);

-- Tabla notas
CREATE TABLE IF NOT EXISTS notas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL,
  vendedor_id TEXT NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (vendedor_id) REFERENCES users(id)
);

-- Tabla tareas
CREATE TABLE IF NOT EXISTS tareas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT,
  vendedor_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad TEXT DEFAULT 'media',
  estado TEXT DEFAULT 'pendiente',
  fecha_limite DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
  FOREIGN KEY (vendedor_id) REFERENCES users(id)
);

-- Tabla badges
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  tipo TEXT NOT NULL,
  requisito INTEGER NOT NULL
);

-- Tabla user_badges
CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

-- Tabla retos
CREATE TABLE IF NOT EXISTS retos (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  meta INTEGER NOT NULL,
  puntos INTEGER NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  activo INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla user_retos
CREATE TABLE IF NOT EXISTS user_retos (
  user_id TEXT NOT NULL,
  reto_id TEXT NOT NULL,
  progreso INTEGER DEFAULT 0,
  completado INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  PRIMARY KEY (user_id, reto_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reto_id) REFERENCES retos(id) ON DELETE CASCADE
);

-- Tabla premios
CREATE TABLE IF NOT EXISTS premios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  tipo TEXT NOT NULL,
  puntos_requeridos INTEGER NOT NULL,
  cantidad_disponible INTEGER DEFAULT -1,
  activo INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla user_premios
CREATE TABLE IF NOT EXISTS user_premios (
  user_id TEXT NOT NULL,
  premio_id TEXT NOT NULL,
  canjeado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, premio_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (premio_id) REFERENCES premios(id) ON DELETE CASCADE
);

-- Tabla solicitudes_premios
CREATE TABLE IF NOT EXISTS solicitudes_premios (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  premio_id TEXT NOT NULL,
  status TEXT DEFAULT 'pendiente',
  solicitud_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resuelto_at TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (premio_id) REFERENCES premios(id) ON DELETE CASCADE
);

-- Tabla activity_log
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  accion TEXT NOT NULL,
  entidad_tipo TEXT,
  entidad_id TEXT,
  detalles TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Habilitar RLS (Row Level Security) - opcional
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- ================================================
-- BADGES SEED (insignias por defecto)
-- ================================================
INSERT INTO badges (id, nombre, descripcion, icono, tipo, requisito) VALUES
('badge_llamadas_100', 'Máquina de Llamadas', 'Realiza 100 llamadas', '📞', 'llamadas', 100),
('badge_llamadas_250', 'Teléfono de Plata', 'Realiza 250 llamadas', '📞', 'llamadas', 250),
('badge_llamadas_500', 'Teléfono de Oro', 'Realiza 500 llamadas', '📞', 'llamadas', 500),
('badge_llamadas_1000', 'Maestro del Teléfono', 'Realiza 1000 llamadas', '📞', 'llamadas', 1000),
('badge_citas_20', 'Cazador de Citas', 'Agenda 20 citas', '📅', 'citas', 20),
('badge_citas_50', 'Agendador Profesional', 'Agenda 50 citas', '📅', 'citas', 50),
('badge_citas_100', 'Señor de las Citas', 'Agenda 100 citas', '📅', 'citas', 100),
('badge_citas_250', 'Creador de Oportunidades', 'Agenda 250 citas', '📅', 'citas', 250),
('badge_conversion_30', 'Conversión Pro', 'Logra más de 30% de tasa de interés', '🎯', 'conversion', 30),
('badge_conversion_50', 'Conquistador', 'Logra más de 50% de tasa de interés', '🎯', 'conversion', 50),
('badge_conversion_75', 'Estrella de Ventas', 'Logra más de 75% de tasa de interés', '🎯', 'conversion', 75),
('badge_contactos_50', 'Conectador', 'Logra 50 contactos efectivos', '🤝', 'contactos', 50),
('badge_contactos_100', 'Relaciones Públicas', 'Logra 100 contactos efectivos', '🤝', 'contactos', 100),
('badge_contactos_250', 'Rey de las Relaciones', 'Logra 250 contactos efectivos', '🤝', 'contactos', 250),
('badge_empresas_50', 'Cazador de Negocios', 'Crea 50 empresas', '🏢', 'empresas', 50),
('badge_empresas_100', 'Constructor de Cartera', 'Crea 100 empresas', '🏢', 'empresas', 100),
('badge_empresas_250', 'Imperio Empresarial', 'Crea 250 empresas', '🏢', 'empresas', 250),
('badge_racha_7', 'En Llamas', '7 días seguidos de actividad', '🔥', 'racha', 7),
('badge_racha_14', 'Fuego Ardiente', '14 días seguidos de actividad', '🔥', 'racha', 14),
('badge_racha_30', 'Invencible', '30 días seguidos de actividad', '🔥', 'racha', 30),
('badge_puntos_500', 'Coleccionista', 'Acumula 500 puntos', '⭐', 'puntos', 500),
('badge_puntos_1000', 'Estrella Emergente', 'Acumula 1000 puntos', '⭐', 'puntos', 1000),
('badge_puntos_2500', 'Campeón', 'Acumula 2500 puntos', '⭐', 'puntos', 2500)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- RETOS SEED (metas por defecto)
-- ================================================
INSERT INTO retos (id, tipo, objetivo, meta, puntos, fecha_inicio, fecha_fin, activo) VALUES
(uuid_generate_v4(), 'diario', 'Llamadas diarias', 25, 50, CURRENT_DATE, CURRENT_DATE, 1),
(uuid_generate_v4(), 'semanal', 'Llamadas semanales', 125, 100, CURRENT_DATE, CURRENT_DATE + 7, 1)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- PREMIOS SEED (recompensas por defecto)
-- ================================================
INSERT INTO premios (id, nombre, descripcion, icono, tipo, puntos_requeridos) VALUES
(uuid_generate_v4(), '🍕 Pizza Familiar', 'Canjea una pizza familiar cuando cumplas tu meta semanal', 'pizza', 'semanal', 500),
(uuid_generate_v4(), '🎬 Boleto Cine', 'Un boleto de cine por lograr tus objetivos', 'cine', 'semanal', 800),
(uuid_generate_v4(), '☕ Desayuno Gratis', 'Desayuno en la oficina por tu esfuerzo', 'desayuno', 'semanal', 350),
(uuid_generate_v4(), '🎁 Tarjeta de $500', 'Tarjeta de regalo de $500 por meta mensual', 'tarjeta', 'mensual', 2500),
(uuid_generate_v4(), '🛒 Lunch con el Equipo', 'Lunch para ti y tu equipo por logro excepcional', 'lunch', 'mensual', 1800)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- HABILITAR EXTENSION UUID
-- ================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
