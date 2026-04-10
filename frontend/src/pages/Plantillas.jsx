import { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  MessageSquare, Phone, Mail, Copy, Check, Search, 
  Send, X, User, Building2
} from 'lucide-react';

const canales = [
  { value: 'all', label: 'Todos', icon: MessageSquare },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'telefono', label: 'Teléfono', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail }
];

export default function Plantillas() {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Datos para personalización
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [vendedorNombre, setVendedorNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [tipoReunion, setTipoReunion] = useState('videollamada');

  useEffect(() => {
    loadPlantillas();
  }, []);

  const loadPlantillas = async () => {
    try {
      const data = await api.getPlantillas();
      setPlantillas(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPlantillas = () => {
    let filtered = filter === 'all' 
      ? plantillas 
      : plantillas.filter(p => p.canal === filter);
    
    if (search) {
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.texto.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  };

  const personalizeMensaje = (texto) => {
    return texto
      .replace(/\[NOMBRE\]/g, contactoNombre || '[NOMBRE]')
      .replace(/\[EMPRESA\]/g, empresaNombre || '[EMPRESA]')
      .replace(/\[VENDEDOR\]/g, vendedorNombre || '[VENDEDOR]')
      .replace(/\[FECHA\]/g, fecha || '[FECHA]')
      .replace(/\[HORA\]/g, hora || '[HORA]')
      .replace(/\[VIDEO\]/g, tipoReunion === 'videollamada' ? 'videollamada' : 'llamada')
      .replace(/\[BENEFICIO\]/g, 'mejorar sus procesos de ventas');
  };

  const copyToClipboard = async (texto) => {
    const personalizado = personalizeMensaje(texto);
    await navigator.clipboard.writeText(personalizado);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = (texto) => {
    const personalizado = personalizeMensaje(texto);
    const encoded = encodeURIComponent(personalizado);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const openEmail = (texto) => {
    const personalizado = personalizeMensaje(texto);
    const subject = encodeURIComponent('Información de Teknao CRM');
    const body = encodeURIComponent(personalizado);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filtered = getFilteredPlantillas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Mensajes</h1>
          <p className="text-gray-500 mt-1">{plantillas.length} plantillas disponibles</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        
        {/* Filtro por canal */}
        <div className="flex gap-2">
          {canales.map(canal => (
            <button
              key={canal.value}
              onClick={() => setFilter(canal.value)}
              className={`btn ${filter === canal.value ? 'btn-primary' : 'btn-outline'} flex items-center gap-2`}
            >
              <canal.icon size={16} />
              {canal.label}
            </button>
          ))}
        </div>
      </div>

      {/* Datos para personalización */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <User size={16} className="text-blue-600" />
          Datos para personalizar mensajes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-gray-600">Contacto</label>
            <input
              type="text"
              placeholder="Nombre del contacto"
              value={contactoNombre}
              onChange={(e) => setContactoNombre(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Empresa</label>
            <input
              type="text"
              placeholder="Nombre de empresa"
              value={empresaNombre}
              onChange={(e) => setEmpresaNombre(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Vendedor</label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={vendedorNombre}
              onChange={(e) => setVendedorNombre(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Tipo reunión</label>
            <select
              value={tipoReunion}
              onChange={(e) => setTipoReunion(e.target.value)}
              className="input text-sm"
            >
              <option value="videollamada">Videollamada</option>
              <option value="telefonica">Telefónica</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(plantilla => (
          <div 
            key={plantilla.id} 
            className="card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedPlantilla(plantilla);
              setShowPreview(true);
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {plantilla.canal === 'whatsapp' && (
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageSquare size={16} className="text-green-600" />
                  </span>
                )}
                {plantilla.canal === 'telefono' && (
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone size={16} className="text-blue-600" />
                  </span>
                )}
                {plantilla.canal === 'email' && (
                  <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Mail size={16} className="text-red-600" />
                  </span>
                )}
                <h3 className="font-semibold text-gray-900">{plantilla.nombre}</h3>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                plantilla.canal === 'whatsapp' ? 'bg-green-100 text-green-700' :
                plantilla.canal === 'telefono' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {plantilla.canal}
              </span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-3">{plantilla.texto}</p>
            <div className="mt-3 pt-2 border-t border-gray-100 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(plantilla.texto);
                }}
                className="btn btn-outline text-xs flex items-center gap-1"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              {plantilla.canal === 'whatsapp' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openWhatsApp(plantilla.texto);
                  }}
                  className="btn btn-outline text-xs text-green-600 flex items-center gap-1"
                >
                  <Send size={14} />
                  WhatsApp
                </button>
              )}
              {plantilla.canal === 'email' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEmail(plantilla.texto);
                  }}
                  className="btn btn-outline text-xs text-red-600 flex items-center gap-1"
                >
                  <Mail size={14} />
                  Email
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No se encontraron plantillas</p>
        </div>
      )}

      {/* Modal de vista previa */}
      {showPreview && selectedPlantilla && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {selectedPlantilla.canal === 'whatsapp' && (
                    <MessageSquare size={24} className="text-green-600" />
                  )}
                  {selectedPlantilla.canal === 'telefono' && (
                    <Phone size={24} className="text-blue-600" />
                  )}
                  {selectedPlantilla.canal === 'email' && (
                    <Mail size={24} className="text-red-600" />
                  )}
                  <h2 className="text-xl font-bold text-gray-900">{selectedPlantilla.nombre}</h2>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Vista previa del mensaje personalizado */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Vista previa:</h4>
                <p className="text-gray-800 whitespace-pre-wrap">
                  {personalizeMensaje(selectedPlantilla.texto)}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(selectedPlantilla.texto)}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copiado!' : 'Copiar mensaje'}
                </button>
                {selectedPlantilla.canal === 'whatsapp' && (
                  <button
                    onClick={() => openWhatsApp(selectedPlantilla.texto)}
                    className="btn bg-green-600 hover:bg-green-700 text-white flex-1 flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Abrir WhatsApp
                  </button>
                )}
                {selectedPlantilla.canal === 'email' && (
                  <button
                    onClick={() => openEmail(selectedPlantilla.texto)}
                    className="btn bg-red-600 hover:bg-red-700 text-white flex-1 flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Crear Email
                  </button>
                )}
                <button
                  onClick={() => setShowPreview(false)}
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