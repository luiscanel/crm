import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Plus, Search, Phone, Mail, MapPin, 
  GripVertical, ChevronRight, Eye
} from 'lucide-react';

const estados = [
  { value: 'nuevo', label: 'Nuevo', color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'contactado', label: 'Contactado', color: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'interesado', label: 'Interesado', color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'cita_agendada', label: 'Cita Agendada', color: 'bg-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
  { value: 'seguimiento', label: 'Seguimiento', color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'cerrado', label: 'Cerrado', color: 'bg-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' }
];

export default function Kanban() {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [draggedEmpresa, setDraggedEmpresa] = useState(null);
  const [showDetail, setShowDetail] = useState(null);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const response = await api.getEmpresas();
      setEmpresas(response.data || response);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmpresasByEstado = (estado) => {
    let filtered = empresas.filter(e => e.estado === estado);
    if (search) {
      filtered = filtered.filter(e => 
        e.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        e.industria?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  };

  const handleDragStart = (e, empresa) => {
    setDraggedEmpresa(empresa);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault();
    if (!draggedEmpresa || draggedEmpresa.estado === nuevoEstado) {
      setDraggedEmpresa(null);
      return;
    }

    try {
      await api.updateEmpresa(draggedEmpresa.id, { estado: nuevoEstado });
      loadEmpresas(); // Refresh data
    } catch (error) {
      console.error('Error updating:', error);
    }
    setDraggedEmpresa(null);
  };

  const viewDetails = async (empresa) => {
    try {
      const data = await api.getEmpresa(empresa.id);
      setShowDetail(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const estadoCounts = {};
  estados.forEach(e => {
    estadoCounts[e.value] = getEmpresasByEstado(e.value).length;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>
          <p className="text-gray-500 mt-1">{empresas.length} empresas en el pipeline</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar empresas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-64"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {estados.map((estado) => (
            <div
              key={estado.value}
              className={`w-72 flex-shrink-0 ${estado.bg} rounded-lg border ${estado.border}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, estado.value)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${estado.color}`}></div>
                    <h3 className="font-semibold text-gray-900">{estado.label}</h3>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                    {estadoCounts[estado.value]}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
                {getEmpresasByEstado(estado.value).map((empresa) => (
                  <div
                    key={empresa.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, empresa)}
                    onClick={() => viewDetails(empresa)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate flex-1">
                        {empresa.nombre}
                      </h4>
                      <GripVertical size={16} className="text-gray-400 cursor-grab" />
                    </div>
                    
                    {empresa.industria && (
                      <p className="text-sm text-gray-500 mb-2">{empresa.industria}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {empresa.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {empresa.telefono}
                        </span>
                      )}
                    </div>
                    
                    {empresa.ubicacion && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <MapPin size={12} /> {empresa.ubicacion}
                      </p>
                    )}
                    
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {empresa.total_llamadas || 0} llamadas
                      </span>
                      <span className="text-primary-600 flex items-center gap-1">
                        Ver <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}

                {getEmpresasByEstado(estado.value).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Sin empresas</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{showDetail.nombre}</h2>
                  <p className="text-gray-500">{showDetail.industria}</p>
                </div>
                <button
                  onClick={() => setShowDetail(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {showDetail.telefono && (
                  <a href={`tel:${showDetail.telefono}`} className="flex items-center gap-2 text-primary-600">
                    <Phone size={16} /> {showDetail.telefono}
                  </a>
                )}
                {showDetail.ubicacion && (
                  <span className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} /> {showDetail.ubicacion}
                  </span>
                )}
              </div>

              {/* Contactos */}
              {showDetail.contactos && showDetail.contactos.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Contactos</h3>
                  <div className="space-y-2">
                    {showDetail.contactos.map(contacto => (
                      <div key={contacto.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{contacto.nombre}</p>
                          <p className="text-sm text-gray-500">{contacto.cargo}</p>
                        </div>
                        <div className="flex gap-2">
                          {contacto.telefono && (
                            <a href={`tel:${contacto.telefono}`} className="p-2 text-primary-600 hover:bg-primary-50 rounded">
                              <Phone size={16} />
                            </a>
                          )}
                          {contacto.email && (
                            <a href={`mailto:${contacto.email}`} className="p-2 text-red-600 hover:bg-red-50 rounded">
                              <Mail size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{showDetail.llamadas?.length || 0}</p>
                  <p className="text-sm text-gray-600">Llamadas</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{showDetail.citas?.length || 0}</p>
                  <p className="text-sm text-gray-600">Citas</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{showDetail.notas?.length || 0}</p>
                  <p className="text-sm text-gray-600">Notas</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={`/empresas/${showDetail.id}`}
                  className="btn btn-primary flex-1 text-center"
                >
                  Ver en Empresas
                </a>
                <button
                  onClick={() => setShowDetail(null)}
                  className="btn btn-outline"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}