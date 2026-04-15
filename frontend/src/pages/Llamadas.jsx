import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Phone, Plus, Search, Building2, Clock, CheckCircle, XCircle, HelpCircle, Trash2, FileText, Award } from 'lucide-react';

const estadosLlamada = [
  { value: 'no_contesto', label: 'No Contestó', icon: XCircle, color: 'text-gray-600' },
  { value: 'voicemail', label: 'Buzón de Voz', icon: XCircle, color: 'text-orange-600' },
  { value: 'numero_erroneo', label: 'Número Erróneo', icon: XCircle, color: 'text-red-400' },
  { value: 'fuera_servicio', label: 'Fuera de Servicio', icon: XCircle, color: 'text-red-300' },
  { value: 'llamada_rechazada', label: 'Llamada Rechazada', icon: XCircle, color: 'text-red-600' },
  { value: 'llamada_efectiva', label: 'Llamada Efectiva', icon: CheckCircle, color: 'text-green-600' },
  { value: 'interesado', label: 'Interesado', icon: HelpCircle, color: 'text-blue-600' },
  { value: 'no_interesado', label: 'No Interesado', icon: XCircle, color: 'text-red-600' }
];

// Guión para cold calling
const guionLlamada = `📞 SCRIPT DE LLAMADA FRÍA

1. SALUDO:
"Buenos días/tardes, mi nombre es [TU NOMBRE] y estoy llamando de [NOMBRE DE TU EMPRESA]. ¿Con quién tengo el gusto?"

2. PRESENTACIÓN:
"Le contacto porque ayudarle a [BENEFICIO PRINCIPAL]. ¿Actualmente tienen este tipo de necesidad?"

3. PREGUNTAS CALIFICADORAS:
- ¿Cómo lo están haciendo actualmente?
- ¿Qué retos enfrentan con eso?
- ¿Quién toma decisiones en este tema?

4. MANEJO DE OBJECIONES:
- "No tengo tiempo" → "Entiendo, solo serán 2 minutos"
- "Ya tenemos proveedor" → "Perfecto, ¿están satisfechos?"

5. CIERRE:
"¿Le parece si nos reunimos 15 min esta semana para mostrarle cómo podemos ayudar?"`;

export default function Llamadas() {
  const { user, refreshUser } = useAuth();
  const [llamadas, setLlamadas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dailyStats, setDailyStats] = useState(null);
  const [filterEstado, setFilterEstado] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    empresa_id: '',
    contacto_id: '',
    estado: '',
    observaciones: '',
    suggested_estado: ''
  });

  useEffect(() => {
    loadData();
  }, [filterEstado]);

  const loadData = async () => {
    try {
      const [llamadasData, empresasData, dailyData] = await Promise.all([
        api.getLlamadas({ estado: filterEstado }),
        api.getEmpresas(),
        api.getLlamadasDaily()
      ]);
      // Handle both array responses and wrapped responses {data: [...], pagination: {...}}
      const llamadas = Array.isArray(llamadasData) ? llamadasData : (llamadasData.data || []);
      const empresas = Array.isArray(empresasData) ? empresasData : (empresasData.data || []);
      setLlamadas(llamadas);
      setEmpresas(empresas);
      setDailyStats(dailyData && !dailyData.error ? dailyData : null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const result = await api.createLlamada(formData);
      console.log('Llamada result:', result);
      
      if (result.error) {
        alert(result.error);
        setSubmitting(false);
        return;
      }
      
      // Si se sugirió cambiar el estado de la empresa, actualizar
      if (formData.suggested_estado && formData.empresa_id) {
        await api.updateEmpresa(formData.empresa_id, { estado: formData.suggested_estado });
      }
      
      if (result.puntos_ganados) {
        // Verificar insignias después de ganar puntos
        const badgeResult = await api.checkBadges();
        if (badgeResult.new_badges && badgeResult.new_badges.length > 0) {
          const badgesMsg = badgeResult.new_badges.map(b => `🏆 ${b.nombre}`).join(', ');
          alert(`Llamada registrada! +${result.puntos_ganados} puntos\n\n🎉 ¡Nueva(s) insignia(s): ${badgesMsg}!`);
        } else {
          alert(`Llamada registrada! +${result.puntos_ganados} puntos`);
        }
        refreshUser();
      }
      
      setShowModal(false);
      setFormData({ empresa_id: '', contacto_id: '', estado: '', observaciones: '', suggested_estado: '' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar llamada: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoIcon = (estado) => {
    const estadoObj = estadosLlamada.find(e => e.value === estado);
    if (estadoObj) {
      return <estadoObj.icon className={`w-4 h-4 ${estadoObj.color}`} />;
    }
    return null;
  };

  const getEstadoLabel = (estado) => {
    const estadoObj = estadosLlamada.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  };

  const handleDelete = async (llamadaId) => {
    if (!confirm('¿Estás seguro de eliminar esta llamada? Se revertirán los puntos ganados.')) return;
    
    try {
      const result = await api.deleteLlamada(llamadaId);
      if (result.error) {
        alert(result.error);
      } else {
        alert(`Llamada eliminada. Puntos revertidos: ${result.puntos_revertidos}`);
        loadData();
        refreshUser();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar llamada');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Llamadas</h1>
          <p className="text-gray-500 mt-1">
            {llamadas.length} llamadas registradas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Registrar Llamada
        </button>
      </div>

      {/* Botón para ver guión */}
      <div className="mb-4">
        <button
          onClick={() => alert(guionLlamada)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <FileText size={20} />
          Ver Guión de Llamada
        </button>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Llamadas Hoy</p>
              <p className="text-3xl font-bold">{dailyStats?.llamadas_hoy || 0}</p>
            </div>
            <Phone className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-sm mt-2 opacity-80">Meta: {dailyStats?.meta_llamadas || 25}</p>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Empresas Únicas</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats?.empresas_unicas_hoy || 0}</p>
            </div>
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm mt-2 text-gray-500">Meta: {dailyStats?.meta_empresas || 25}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Progreso Llamadas</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats?.progreso_llamadas?.toFixed(0) || 0}%</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${dailyStats?.progreso_llamadas || 0}%` }}
            />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Progreso Empresas</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats?.progreso_empresas?.toFixed(0) || 0}%</p>
            </div>
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${dailyStats?.progreso_empresas || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="input md:w-48"
        >
          <option value="">Todos los estados</option>
          {estadosLlamada.map(e => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : llamadas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay llamadas registradas
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Observaciones</th>
                <th>Vendedor</th>
                {user.role === 'admin' && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {llamadas.map((llamada) => (
                <tr key={llamada.id}>
                  <td className="text-gray-500">
                    {new Date(llamada.fecha_llamada).toLocaleString('es')}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{llamada.empresa_nombre}</span>
                    </div>
                    {llamada.contacto_nombre && (
                      <p className="text-xs text-gray-500">{llamada.contacto_nombre}</p>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getEstadoIcon(llamada.estado)}
                      <span>{getEstadoLabel(llamada.estado)}</span>
                    </div>
                  </td>
                  <td className="max-w-xs truncate">
                    {llamada.observaciones || '-'}
                  </td>
                  <td className="text-gray-500">
                    {llamada.vendedor_nombre}
                  </td>
                  {user.role === 'admin' && (
                    <td>
                      <button
                        onClick={() => handleDelete(llamada.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Registrar Llamada
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Empresa *</label>
                <select
                  value={formData.empresa_id}
                  onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar empresa...</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Estado de Llamada *</label>
                <div className="grid grid-cols-2 gap-2">
                  {estadosLlamada.map(estado => (
                    <button
                      key={estado.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, estado: estado.value })}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.estado === estado.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <estado.icon className={`w-4 h-4 ${estado.color}`} />
                        <span className="text-sm">{estado.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugerencia de cambio de estado de empresa */}
              {formData.empresa_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 mb-2">💡 ¿Cambiar estado de la empresa?</p>
                      <select
                        value={formData.suggested_estado || ''}
                        onChange={(e) => setFormData({ ...formData, suggested_estado: e.target.value })}
                        className="input text-sm"
                      >
                        <option value="">Sin cambios</option>
                        <option value="nuevo">Nuevo</option>
                        <option value="contactado">Contactado</option>
                        <option value="interesado">Interesado</option>
                        <option value="seguimiento">Seguimiento</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                      <p className="text-xs text-blue-600 mt-1">Esto es opcional, puedes cambiar el estado después</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Notas sobre la llamada..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Puntos:</strong> +1 por llamada, +3 por llamada efectiva (contacto/interesado)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={!formData.empresa_id || !formData.estado || submitting}
                >
                  {submitting ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}