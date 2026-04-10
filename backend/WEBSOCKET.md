# WebSocket Notifications - Guía de Uso

## Conexión

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

// Autenticación
ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'auth', userId: 'user-id-here' }));
});

// Recibir mensajes
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Evento:', msg.type, msg.data);
});
```

## Eventos del Servidor

| Evento | Descripción |
|--------|------------|
| `authenticated` | Confirmación de autenticación |
| `llamada_completada` | Nueva llamada registrada |
| `empresa_actualizada` | Empresa cambió de estado |
| `reto_completado` | Reto alcanzado |
| `premio_canjeado` | Premio canjeado |
| `leaderboard_actualizado` | Ranking actualizado |

## Integración en Rutas

Para habilitar notificaciones cuando ocurren eventos, importa el servicio:

```javascript
const { 
  notifyLlamadaCompletada,
  notifyEmpresaActualizada 
} = require('./services/websocket');

// En el handler de llamada completada:
notifyLlamadaCompletada(req.user.id, empresa.nombre, puntos);

// En el handler de empresa actualizada:
notifyEmpresaActualizada(req.user.id, empresa);
```

## Endpoint de Estado

```bash
# Ver clientes conectados
# (futuro endpoint de health del WebSocket)
```