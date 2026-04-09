-- ================================================
-- INSERTAR USUARIOS EXISTENTES
-- Copia y ejecuta esto en SQL Editor de Supabase
-- ================================================

-- Insertar usuarios del CRM
INSERT INTO users (id, name, email, password, role, puntos, created_at) VALUES
('7ac91c65-5212-477f-9e1c-d1d3bfaa4827', 'Luis Cifuentes', 'luis.c@teknao.com.gt', '$2a$10$lisp.c5satINuijJUhFLnOpMlEYVxfrGeSw7Yo69YYJA3Dp6YX8na', 'admin', 0, '2026-04-09 00:44:26'),
('8c80f6e5-9265-4840-be63-034929934c3a', 'Vendedor', 'vendedor1@crm.com', '$2a$10$hMxU8j2Ey/JWRGmyeazSGuZqqtqqueShOTFDAJ0VnL4tRZSorcwyS', 'vendedor', 0, '2026-04-09 04:20:11')
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- VERIFICAR DATOS
-- ================================================
SELECT 'USUARIOS:' as info, COUNT(*) as total FROM users
UNION ALL SELECT 'BADGES:', COUNT(*) FROM badges
UNION ALL SELECT 'RETOS:', COUNT(*) FROM retos
UNION ALL SELECT ' PREMIOS:', COUNT(*) FROM premios;
