import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Clock, CheckCircle, XCircle, Video, Phone, MapPin, Trash2, AlertCircle, Copy } from 'lucide-react';

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

const estadosAprobacion = [
  { value: 'pendiente_aprobacion', label: '⏳ Pendiente de Aprobación', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'aprobada', label: '✅ Aprobada', color: 'bg-green-100 text-green-800' },
  { value: 'rechazada', label: '❌ Rechazada', color: 'bg-red-100 text-red-800' }
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
      const [citasData, empresasResponse] = await Promise.all([
        api.getCitas({ estado: filterEstado }),
        api.getEmpresas()
      ]);
      
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
      alert('Cita creada y esperando aprobación del supervisor');
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
      alert('Error al crear cita: ' + error.message);
    }
  };

  const getEstadoAprobacionBadge = (estado) => {
    const estadoObj = estadosAprobacion.find(e => e.value === estado);
    if (estadoObj) {
      return (
        <span className={`text-xs px-2 py-1 rounded-full ${estadoObj.color}`}>
          {estadoObj.label}
        </span>
      );
    }
    return null;
  };

  const handleUpdateEstado = async (id, estado) => {
    try {
      await api.updateCita(id, { estado });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return;
    try {
      await api.deleteCita(id);
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

  const getEmpresaOptions = () => {
    if (user?.role === 'vendedor') {
      return empresas.filter(e => e.vendedor_id === user.id || !e.vendedor_id);
    }
    return empresas;
  };

  const formatFecha = (fecha) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-GT', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatHora = (fecha) => {
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Agendar Cita
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="input w-48"
        >
          <option value="">Todos los estados</option>
          {estadosCita.map(e => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
      </div>

      {/* Lista de citas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {citas.map(cita => (
          <div key={cita.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{cita.empresa_nombre}</h3>
                <p className="text-sm text-gray-500">{cita.contacto_nombre || 'Sin contacto'}</p>
              </div>
              <div className={`p-2 rounded-lg ${tiposCita.find(t => t.value === cita.tipo)?.color || 'bg-gray-100'}`}>
                {getTipoIcon(cita.tipo)}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Calendar size={16} />
              <span>{formatFecha(cita.fecha_hora)}</span>
              <Clock size={16} className="ml-2" />
              <span>{formatHora(cita.fecha_hora)}</span>
            </div>

            {/* Estado de aprobación */}
            <div className="mb-3">
              {getEstadoAprobacionBadge(cita.estado_aprobacion)}
            </div>

            {/* Link Jitsi si es videollamada */}
            {cita.link_videollamada && cita.estado_aprobacion === 'aprobada' && (
              <a
                href={cita.link_videollamada}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:underline flex items-center gap-1 mb-3"
              >
                <Video size={14} />
                Unirse a videollamada
              </a>
            )}

            {/* Notas */}
            {cita.notas && (
              <p className="text-sm text-gray-600 mb-3">{cita.notas}</p>
            )}

            {/* Acciones según estado */}
            <div className="flex gap-2 pt-3 border-t">
              {cita.estado_aprobacion === 'aprobada' && (
                <button
                  onClick={() => handleUpdateEstado(cita.id, 'realizada')}
                  className="btn btn-success flex-1 text-sm py-2"
                >
                  <CheckCircle size={16} /> Realizada
                </button>
              )}
              {cita.estado_aprobacion === 'pendiente_aprobacion' && user?.role === 'vendedor' && (
                <span className="text-sm text-yellow-600 flex items-center gap-1 py-2">
                  <AlertCircle size={16} /> Esperando...
                </span>
              )}
              <button
                onClick={() => handleDelete(cita.id)}
                className="btn btn-danger text-sm py-2 px-3"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {citas.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay citas agendadas
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

              {formData.tipo === 'videollamada' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-800">Videollamada Jitsi</p>
                      <p className="text-xs text-purple-600">Se generará un link automático</p>
                    </div>
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">Auto</span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⏳ Esperando aprobación</strong><br/>
                  Un supervisor debe aprobar esta cita para que sea válida y puedas ganar puntos.
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
