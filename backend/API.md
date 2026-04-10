# Teknao CRM API - Documentación Técnica

## Base URL
```
Production: http://localhost:3001/api
```

## Autenticación
Todas las rutas (excepto `/auth/login`) requieren token JWT en el header:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (email, password) |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/auth/me` | Obtener usuario actual |

### Empresas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/empresas` | Listar empresas |
| GET | `/api/empresas/:id` | Obtener empresa |
| POST | `/api/empresas` | Crear empresa |
| PUT | `/api/empresas/:id` | Actualizar empresa |
| DELETE | `/api/empresas/:id` | Eliminar empresa |

### Contactos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/contactos` | Listar contactos |
| GET | `/api/contactos/:id` | Obtener contacto |
| POST | `/api/contactos` | Crear contacto |
| PUT | `/api/contactos/:id` | Actualizar contacto |
| DELETE | `/api/contactos/:id` | Eliminar contacto |

### Llamadas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/llamadas` | Listar llamadas |
| POST | `/api/llamadas` | Registrar llamada |
| DELETE | `/api/llamadas/:id` | Eliminar llamada |

### Citas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/citas` | Listar citas |
| GET | `/api/citas/upcoming` | Citas próximas |
| POST | `/api/citas` | Crear cita |
| PUT | `/api/citas/:id` | Actualizar cita |
| DELETE | `/api/citas/:id` | Eliminar cita |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/general` | Estadísticas generales |
| GET | `/api/dashboard/vendedor/:id` | Stats de vendedor |
| GET | `/api/dashboard/activity` | Actividad reciente |
| GET | `/api/dashboard/vendedores` | Comparación vendedores |

### Gamificación
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/gamificacion/points` | Puntos del usuario |
| GET | `/api/gamificacion/badges` | Insignias disponibles |
| GET | `/api/gamificacion/leaderboard` | Ranking |
| GET | `/api/gamificacion/retos` | Retos activos |
| GET | `/api/gamificacion/premios` | Catálogo de premios |
| POST | `/api/gamificacion/premios/solicitar` | Solicitar premio |
| GET | `/api/gamificacion/solicitudes` | Ver solicitudes (admin) |
| POST | `/api/gamificacion/solicitudes/:id/aprobar` | Aprobar/rechazar |

### Notas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notas` | Listar notas |
| POST | `/api/notas` | Crear nota |
| DELETE | `/api/notas/:id` | Eliminar nota |
| GET | `/api/notas/mis-tareas` | Mis tareas |
| POST | `/api/notas/tareas` | Crear tarea |
| PUT | `/api/notas/tareas/:id` | Actualizar tarea |
| DELETE | `/api/notas/tareas/:id` | Eliminar tarea |

## Códigos de Respuesta
- `200` - Éxito
- `201` - Creado
- `400` - Error de validación
- `401` - No autenticado
- `403` - No autorizado
- `404` - No encontrado
- `500` - Error del servidor

## Puntos por Acción
| Acción | Puntos |
|--------|--------|
| Registrar llamada | +1 |
| Contacto efectivo | +3 extra |
| Estado "interesado" | +5 |
| Cita agendada | +10 |
| Cita realizada | +5 extra |

## Variables de Entorno
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
WHATSAPP_API_KEY=
ADMIN_WHATSAPP=50230620160
```
