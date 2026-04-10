/**
 * WebSocket service for real-time notifications
 * 
 * Emite eventos para:
 * - Nueva llamada completada
 * - Empresa actualizada
 * - Nuevo reto completado
 * - Premio canjeado
 * - Leaderboard actualizado
 */

const WebSocket = require('ws');

let wss = null;
const clients = new Map(); // userId -> websocket

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
function init(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('🔌 WebSocket cliente conectado');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'auth') {
          // Authenticate user
          const { userId } = message;
          clients.set(userId, ws);
          ws.userId = userId;
          console.log(`👤 User ${userId} autenticado en WebSocket`);
          ws.send(JSON.stringify({ type: 'authenticated', userId }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`👋 User ${ws.userId} desconectado`);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  console.log('📡 WebSocket server inicializado en /ws');
  
  return wss;
}

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} type - Event type
 * @param {object} data - Event data
 */
function emitToUser(userId, type, data) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    return true;
  }
  return false;
}

/**
 * Broadcast event to all connected users
 * @param {string} type - Event type
 * @param {object} data - Event data
 */
function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  
  let count = 0;
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      count++;
    }
  });
  
  return count;
}

// Event emitters for specific scenarios

/**
 * Notify when a llamada is completed
 */
function notifyLlamadaCompletada(userId, empresaNombre, puntos) {
  return emitToUser(userId, 'llamada_completada', {
    empresa: empresaNombre,
    puntos,
    message: `¡Llamada completada! +${puntos} puntos`
  });
}

/**
 * Notify when empresa status changes
 */
function notifyEmpresaActualizada(userId, empresa) {
  return emitToUser(userId, 'empresa_actualizada', {
    empresa: empresa.nombre,
    nuevoEstado: empresa.estado,
    message: `Empresa "${empresa.nombre}" ahora está ${empresa.estado}`
  });
}

/**
 * Notify when a challenge/reto is completed
 */
function notifyRetoCompletado(userId, reto) {
  return emitToUser(userId, 'reto_completado', {
    titulo: reto.titulo,
    puntos: reto.puntos,
    message: `¡Reto "${reto.titulo}" completado! +${reto.puntos} puntos`
  });
}

/**
 * Notify when a prize is redeemed
 */
function notifyPremioCanjeado(userId, premio) {
  return emitToUser(userId, 'premio_canjeado', {
    nombre:Premio.nombre,
    puntosGastados: premio.costo,
    message: `¡Canjeaste "${premio.nombre}" por ${premio.costo} puntos!`
  });
}

/**
 * Broadcast leaderboard update
 */
function notifyLeaderboardActualizado(leaderboard) {
  return broadcast('leaderboard_actualizado', { leaderboard });
}

/**
 * Get connected users count
 */
function getConnectedUsersCount() {
  return clients.size;
}

module.exports = {
  init,
  emitToUser,
  broadcast,
  notifyLlamadaCompletada,
  notifyEmpresaActualizada,
  notifyRetoCompletado,
  notifyPremioCanjeado,
  notifyLeaderboardActualizado,
  getConnectedUsersCount
};