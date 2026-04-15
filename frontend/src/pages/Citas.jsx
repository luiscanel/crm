import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Clock, CheckCircle, XCircle, Video, Phone, MapPin, Trash2 } from 'lucide-react';

const tiposCita = [
  { value: 'llamada', label: 'Llamada', icon: Phone, color: 'bg-blue-100 text-blue-600' },
  { value: 'videollamada', label: 'Videollamada', icon: Video, color: 'bg-purple-100 text-purple-600' },
  { value: 'presencial', label: 'Presencial', icon: MapPin, color: 'bg-green-100 text-green-600' }
];

const estadosCita = [
  { value: 'pendiente', label: 'Pendiente', color: 'badge-warning' },
  { value: 'realizada', label: 'Realizada', color: 'badge-success' },
  { value: 'cancelada', label: 'Cancelada', color: 'badge-danger' }
];

export default function Citas() {
  const { user, refreshUser } = useAuth();
  const [citas, setCitas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [formData, setFormData] = useState({
    empresa_id: '',
    contacto_id: '',
    tipo: 'llamada',
    fecha_hora: '',
    notas: '',
    link_videollamada: ''
  });

  useEffect(() => {
    loadData();
  }, [filterEstado, user]);

  const loadData = async () => {
    try {
      // Backend filters empresas by vendedor automatically
      const [citasData, empresasResponse] = await Promise.all([
        api.getCitas({ estado: filterEstado }),
        api.getEmpresas()
      ]);
      
      // Filter citas by vendedor if not admin/supervisor (API might not filter)
      let filteredCitas = citasData;
      if (user?.role === 'vendedor') {
        filteredCitas = citasData.filter(c => c.vendedor_id === user.id);
      }
      
      setCitas(filteredCitas);
      setEmpresas(empresasResponse.data || empresasResponse);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await api.createCita(formData);
      if (result.puntos_totales) {
        alert(`Cita agendada! +10 puntos`);
        refreshUser(); // Refresh user puntos
      }
      setShowModal(false);
      setFormData({
        empresa_id: '',
        contacto_id: '',
        tipo: 'llamada',
        fecha_hora: '',
        notas: '',
        link_videollamada: ''
      });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateEstado = async (id, estado) => {
    try {
      await api.updateCita(id, { estado });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTipoIcon = (tipo) => {
    const tipoObj = tiposCita.find(t => t.value === tipo);
    if (tipoObj) {
      return <tipoObj.icon className="w-4 h-4" />;
    }
    return null;
  };

  const getEstadoBadge = (estado) => {
    const estadoObj = estadosCita.find(e => e.value === estado);
    return estadoObj ? (
      <span className={`badge ${estadoObj.color}`}>{estadoObj.label}</span>
    ) : null;
  };

  const getEmpresaOptions = () => {
    // Show all empresas assigned to the vendedor, not just interested ones
    return empresas;
  };

  const handleDelete = async (citaId) => {
    if (!confirm('¿Estás seguro de eliminar esta cita? Se revertirán los 10 puntos ganados.')) return;
    
    try {
      const result = await api.deleteCita(citaId);
      alert(`Cita eliminada. Puntos revertidos: ${result.puntos_revertidos || 0}`);
      loadCitas();
      refreshUser();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Group citas by date
  const groupedCitas = citas.reduce((acc, cita) => {
    const date = new Date(cita.fecha_hora).toLocaleDateString('es', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(cita);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 mt-1">{citas.length} citas registradas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Agendar Cita
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="input md:w-48"
        >
          <option value="">Todos los estados</option>
          {estadosCita.map(e => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
      </div>

      {/* Citas Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : citas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay citas registradas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {citas.map((cita) => {
            const tipoObj = tiposCita.find(t => t.value === cita.tipo);
            const estadoObj = estadosCita.find(e => e.value === cita.estado);
            const fecha = new Date(cita.fecha_hora);
            const isToday = fecha.toDateString() === new Date().toDateString();
            const isPast = fecha < new Date() && cita.estado === 'pendiente';
            
            return (
              <div 
                key={cita.id}
                className={`card hover:shadow-lg transition-shadow ${
                  isPast ? 'border-l-4 border-red-400' : 
                  isToday ? 'border-l-4 border-primary-600' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tipoObj?.color || 'bg-gray-100'
                  }`}>
                    {tipoObj && <tipoObj.icon className="w-5 h-5" />}
                  </div>
                  <span className={`badge ${estadoObj?.color}`}>{estadoObj?.label}</span>
                </div>
                
                {/* Empresa */}
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {cita.empresa_nombre}
                </h3>
                
                {/* Fecha y Hora */}
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar size={16} className="text-primary-600" />
                  <span className="font-medium">
                    {isToday ? 'Hoy' : fecha.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <Clock size={16} className="text-primary-600 ml-2" />
                  <span>{fecha.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                
                {/* Contacto */}
                {cita.contacto_nombre && (
                  <div className="text-sm text-gray-500 mb-2">
                    👤 {cita.contacto_nombre}
                  </div>
                )}
                
                {/* Notas */}
                {cita.notas && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {cita.notas}
                  </p>
                )}
                
                {/* Link Videollamada */}
                {cita.link_videollamada && (
                  <a 
                    href={cita.link_videollamada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-600 hover:underline mb-3 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200"
                  >
                    <Video size={16} />
                    <span className="font-medium">Unirse a Videollamada</span>
                    <span className="text-xs text-purple-400 ml-auto">Jitsi</span>
                  </a>
                )}
                
                {/* Acciones */}
                {cita.estado === 'pendiente' && (
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleUpdateEstado(cita.id, 'realizada')}
                      className="btn btn-success flex-1 text-sm py-2"
                    >
                      <CheckCircle size={16} /> Realizada
                    </button>
                    <button
                      onClick={() => handleDelete(cita.id)}
                      className="btn btn-danger text-sm py-2 px-3"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Agendar Cita
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Empresa *</label>
                <select
                  value={formData.empresa_id}
                  onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value, contacto_id: '' })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar empresa...</option>
                  {getEmpresaOptions().map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Contacto */}
              {formData.empresa_id && (
                <div>
                  <label className="label">Contacto (opcional)</label>
                  <select
                    value={formData.contacto_id}
                    onChange={(e) => setFormData({ ...formData, contacto_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Seleccionar contacto...</option>
                    {empresas.find(e => e.id === formData.empresa_id)?.contactos?.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} {c.apellido ? `- ${c.apellido}` : ''}</option>
                    )) || []}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Tipo de Cita</label>
                <div className="grid grid-cols-3 gap-2">
                  {tiposCita.map(tipo => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo: tipo.value })}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        formData.tipo === tipo.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <tipo.icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">{tipo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Fecha y Hora *</label>
                <input
                  type="datetime-local"
                  value={formData.fecha_hora}
                  onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Notas de la cita..."
                />
              </div>

              {/* Checkbox generar link Jitsi */}
              {formData.tipo === 'videollamada' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-800">Videollamada Jitsi</p>
                      <p className="text-xs text-purple-600">Se generará un link automático para la videollamada</p>
                    </div>
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">Auto</span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>+10 puntos</strong> al agendar una cita
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={!formData.empresa_id || !formData.fecha_hora}
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}