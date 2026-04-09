// Use environment variable or fallback to relative path (for local dev)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export const api = {
  // Auth
  login: (email, password) => 
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(res => res.json()),

  register: (data) => 
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  getMe: () => 
    fetch(`${API_URL}/auth/me`, { headers: headers() }).then(res => res.json()),

  getUsers: () => 
    fetch(`${API_URL}/auth/users`, { headers: headers() }).then(res => res.json()),

  updateUser: (id, data) => 
    fetch(`${API_URL}/auth/users/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  // Empresas
  getEmpresas: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/empresas?${query}`, { headers: headers() }).then(res => res.json());
  },

  getEmpresa: (id) => 
    fetch(`${API_URL}/empresas/${id}`, { headers: headers() }).then(res => res.json()),

  createEmpresa: (data) => 
    fetch(`${API_URL}/empresas`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  updateEmpresa: (id, data) => 
    fetch(`${API_URL}/empresas/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  deleteEmpresa: (id) => 
    fetch(`${API_URL}/empresas/${id}`, {
      method: 'DELETE',
      headers: headers()
    }).then(res => res.json()),

  getEmpresaStats: () => 
    fetch(`${API_URL}/empresas/stats/summary`, { headers: headers() }).then(res => res.json()),

  // Contactos
  getContactos: (empresaId) => {
    const query = empresaId ? `?empresa_id=${empresaId}` : '';
    return fetch(`${API_URL}/contactos${query}`, { headers: headers() }).then(res => res.json());
  },

  createContacto: (data) => 
    fetch(`${API_URL}/contactos`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  updateContacto: (id, data) => 
    fetch(`${API_URL}/contactos/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  deleteContacto: (id) => 
    fetch(`${API_URL}/contactos/${id}`, {
      method: 'DELETE',
      headers: headers()
    }).then(res => res.json()),

  // Llamadas
  getLlamadas: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/llamadas?${query}`, { headers: headers() }).then(res => res.json());
  },

  createLlamada: (data) => 
    fetch(`${API_URL}/llamadas`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  deleteLlamada: (id) => 
    fetch(`${API_URL}/llamadas/${id}`, {
      method: 'DELETE',
      headers: headers()
    }).then(res => res.json()),

  getLlamadasDaily: () => 
    fetch(`${API_URL}/llamadas/stats/daily`, { headers: headers() }).then(res => res.json()),

  getLlamadasWeek: () => 
    fetch(`${API_URL}/llamadas/stats/week`, { headers: headers() }).then(res => res.json()),

  // Citas
  getCitas: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/citas?${query}`, { headers: headers() }).then(res => res.json());
  },

  getCitasUpcoming: () => 
    fetch(`${API_URL}/citas/upcoming`, { headers: headers() }).then(res => res.json()),

  createCita: (data) => 
    fetch(`${API_URL}/citas`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  updateCita: (id, data) => 
    fetch(`${API_URL}/citas/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  deleteCita: (id) => 
    fetch(`${API_URL}/citas/${id}`, {
      method: 'DELETE',
      headers: headers()
    }).then(res => res.json()),

  getCitasStats: () => 
    fetch(`${API_URL}/citas/stats`, { headers: headers() }).then(res => res.json()),

  // Gamificación
  getPoints: () => 
    fetch(`${API_URL}/gamificacion/points`, { headers: headers() }).then(res => res.json()),

  getBadges: () => 
    fetch(`${API_URL}/gamificacion/badges`, { headers: headers() }).then(res => res.json()),

  getDashboardStats: () => 
    fetch(`${API_URL}/gamificacion/dashboard-stats`, { headers: headers() }).then(res => res.json()),

  checkBadges: () => 
    fetch(`${API_URL}/gamificacion/badges/check`, {
      method: 'POST',
      headers: headers()
    }).then(res => res.json()),

  getLeaderboard: () => 
    fetch(`${API_URL}/gamificacion/leaderboard`, { headers: headers() }).then(res => res.json()),

  getRetos: () => 
    fetch(`${API_URL}/gamificacion/retos`, { headers: headers() }).then(res => res.json()),

  getGamificationSummary: () => 
    fetch(`${API_URL}/gamificacion/summary`, { headers: headers() }).then(res => res.json()),

  // Premios/Recompensas
  getPremios: () => 
    fetch(`${API_URL}/gamificacion/premios`, { headers: headers() }).then(res => res.json()),

  getMisPremios: () => 
    fetch(`${API_URL}/gamificacion/mis-premios`, { headers: headers() }).then(res => res.json()),

  solicitarPremio: (premio_id) => 
    fetch(`${API_URL}/gamificacion/solicitar-premio`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ premio_id })
    }).then(res => res.json()),

  getSolicitudes: () => 
    fetch(`${API_URL}/gamificacion/solicitudes`, { headers: headers() }).then(res => res.json()),

  getMisSolicitudes: () => 
    fetch(`${API_URL}/gamificacion/mis-solicitudes`, { headers: headers() }).then(res => res.json()),

  aprobarSolicitud: (solicitud_id, aprobar) => 
    fetch(`${API_URL}/gamificacion/aprobar-solicitud`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ solicitud_id, aprobar })
    }).then(res => res.json()),

  // Dashboard
  getDashboardGeneral: () => 
    fetch(`${API_URL}/dashboard/general`, { headers: headers() }).then(res => res.json()),

  getVendedorStats: (id) => 
    fetch(`${API_URL}/dashboard/vendedor/${id}`, { headers: headers() }).then(res => res.json()),

  getDashboardCharts: (days = 7) => 
    fetch(`${API_URL}/dashboard/charts?days=${days}`, { headers: headers() }).then(res => res.json()),

  // Admin dashboard - all vendedor metrics
  getVendedoresMetrics: (periodo = 'semana') => 
    fetch(`${API_URL}/dashboard/vendedores?periodo=${periodo}`, { headers: headers() }).then(res => res.json()),

  getVendedorDiario: (id, dias = 30) => 
    fetch(`${API_URL}/dashboard/vendedor/${id}/diario?dias=${dias}`, { headers: headers() }).then(res => res.json()),

  getComparacion: () => 
    fetch(`${API_URL}/dashboard/comparacion`, { headers: headers() }).then(res => res.json()),

  getReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/dashboard/report?${query}`, { headers: headers() }).then(res => res.json());
  },

  getActivity: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/dashboard/activity?${query}`, { headers: headers() }).then(res => res.json());
  },

  // Notas
  getNotas: (empresa_id) =>
    fetch(`${API_URL}/empresa/${empresa_id}/notas`, { headers: headers() }).then(res => res.json()),

  createNota: (data) =>
    fetch(`${API_URL}/notas`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  deleteNota: (id) =>
    fetch(`${API_URL}/notas/${id}`, {
      method: 'DELETE',
      headers: headers()
    }).then(res => res.json()),

  // Tareas
  getMisTareas: () =>
    fetch(`${API_URL}/mis-tareas`, { headers: headers() }).then(res => res.json()),

  getTareasEmpresa: (empresa_id) =>
    fetch(`${API_URL}/empresa/${empresa_id}/tareas`, { headers: headers() }).then(res => res.json()),

  createTarea: (data) =>
    fetch(`${API_URL}/tareas`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  updateTarea: (id, data) =>
    fetch(`${API_URL}/tareas/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

  deleteTarea: (id) =>
    fetch(`${API_URL}/tareas/${id}`, {
      method: 'DELETE',
      headers: headers()
    }).then(res => res.json()),

  // Dashboard conversion data
  getConversionData: () => 
    fetch(`${API_URL}/dashboard/conversion`, { headers: headers() }).then(res => res.json())
};