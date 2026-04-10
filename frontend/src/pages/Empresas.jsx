import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Edit, Edit2, Trash2, Eye, Building2, 
  MapPin, Users, Phone, Mail, MessageCircle, Download, Upload, FileText, ExternalLink
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const estados = [
  { value: 'nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  { value: 'contactado', label: 'Contactado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'interesado', label: 'Interesado', color: 'bg-green-100 text-green-800' },
  { value: 'cita_agendada', label: 'Cita Agendada', color: 'bg-purple-100 text-purple-800' },
  { value: 'seguimiento', label: 'Seguimiento', color: 'bg-orange-100 text-orange-800' },
  { value: 'cerrado', label: 'Cerrado', color: 'bg-gray-100 text-gray-800' }
];

const tamanos = ['Micro', 'Pequeña', 'Mediana', 'Grande', 'Corporación'];

export default function Empresas() {
  const { user, refreshUser } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showContactoModal, setShowContactoModal] = useState(false);
  const [contactoFormData, setContactoFormData] = useState({
    nombre: '',
    cargo: '',
    telefono: '',
    email: ''
  });
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    industria: '',
    tamano: '',
    ubicacion: '',
    telefono: '',
    email: '',
    sitio_web: '',
    estado: 'nuevo',
    vendedor_id: '',
    fecha_cita: '',
    tipo_cita: 'reunion',
    notas_cita: '',
    fecha_seguimiento: ''
  });

  // Check if user can edit/delete (admin or supervisor)
  const canEdit = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'vendedor';

  useEffect(() => {
    loadEmpresas();
  }, [search, filterEstado, filterFechaDesde, filterFechaHasta]);

  const loadEmpresas = async () => {
    try {
      const response = await api.getEmpresas({ 
        search, 
        estado: filterEstado,
        fecha_desde: filterFechaDesde,
        fecha_hasta: filterFechaHasta
      });
      // Handle both paginated and non-paginated responses
      setEmpresas(response.data || response);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        nombre: formData.nombre,
        industria: formData.industria,
        tamano: formData.tamano,
        ubicacion: formData.ubicacion,
        telefono: formData.telefono,
        email: formData.email,
        sitio_web: formData.sitio_web,
        estado: formData.estado,
        vendedor_id: formData.vendedor_id || null,
        ...(editingId && formData.estado === 'cita_agendada' && {
          fecha_cita: formData.fecha_cita,
          tipo_cita: formData.tipo_cita,
          notas_cita: formData.notas_cita
        })
      };
      
      if (editingId) {
        await api.updateEmpresa(editingId, dataToSend);
      } else {
        await api.createEmpresa(dataToSend);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ nombre: '', industria: '', tamano: '', ubicacion: '', estado: 'nuevo', vendedor_id: '', fecha_cita: '', tipo_cita: 'reunion', notas_cita: '' });
      loadEmpresas();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (empresa) => {
    setEditingId(empresa.id);
    setFormData({
      nombre: empresa.nombre || '',
      industria: empresa.industria || '',
      tamano: empresa.tamano || '',
      ubicacion: empresa.ubicacion || '',
      estado: empresa.estado || 'nuevo',
      vendedor_id: empresa.vendedor_id || '',
      fecha_cita: '',
      tipo_cita: 'reunion',
      notas_cita: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canEdit) {
      alert('No tienes permiso para eliminar');
      return;
    }
    if (confirm('¿Estás seguro de eliminar esta empresa?')) {
      try {
        const result = await api.deleteEmpresa(id);
        if (result.puntos_revertidos > 0) {
          alert(`Empresa eliminada. Puntos revertidos: ${result.puntos_revertidos}`);
        } else {
          alert('Empresa eliminada');
        }
        loadEmpresas();
        refreshUser();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleAddContacto = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing contacto
        await api.updateContacto(editingId, contactoFormData);
      } else {
        // Create new contacto
        await api.createContacto({
          empresa_id: showDetail.id,
          ...contactoFormData
        });
      }
      setShowContactoModal(false);
      setContactoFormData({ nombre: '', cargo: '', telefono: '', email: '' });
      setEditingId(null);
      // Reload detail
      const updated = await api.getEmpresa(showDetail.id);
      setShowDetail(updated);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEditContacto = (contacto) => {
    setContactoFormData({
      nombre: contacto.nombre,
      cargo: contacto.cargo || '',
      telefono: contacto.telefono || '',
      email: contacto.email || ''
    });
    setEditingId(contacto.id);
    setShowContactoModal(true);
  };

  const handleDeleteContacto = async (id) => {
    if (!confirm('¿Eliminar este contacto?')) return;
    try {
      await api.deleteContacto(id);
      // Reload detail
      const updated = await api.getEmpresa(showDetail.id);
      setShowDetail(updated);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getEstadoBadge = (estado) => {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? (
      <span className={`badge ${estadoObj.color}`}>{estadoObj.label}</span>
    ) : null;
  };

  // Export to CSV from backend
  const exportToCSV = async () => {
    try {
      const blob = await api.exportEmpresas();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `empresas_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar');
    }
  };

  // Import from CSV
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        if (lines.length < 2) {
          alert('Archivo vacío o sin datos');
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const empresas = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          // Simple CSV parse (handle quoted fields)
          const values = [];
          let current = '';
          let inQuotes = false;
          for (const char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          
          const empresa = {};
          headers.forEach((h, idx) => {
            empresa[h.toLowerCase()] = values[idx] || '';
          });
          
          if (empresa.nombre) {
            empresas.push(empresa);
          }
        }

        const result = await api.importEmpresas(empresas);
        if (result.inserted) {
          alert(`Importadas ${result.inserted.length} empresas`);
          loadEmpresas();
        }
        if (result.errors) {
          alert(`Errores: ${JSON.stringify(result.errors)}`);
        }
      } catch (error) {
        console.error('Error importing:', error);
        alert('Error al importar');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const empresasData = await api.getEmpresasForExport();
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Reporte de Empresas', 14, 20);
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 14, 28);
      doc.text(`Total empresas: ${empresasData.length}`, 14, 34);

      const tableData = empresasData.map(e => [
        e.nombre,
        e.industria || '-',
        e.estado,
        e.telefono || '-',
        e.ubicacion || '-'
      ]);

      doc.autoTable({
        startY: 40,
        head: [['Nombre', 'Industria', 'Estado', 'Teléfono', 'Ubicación']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });

      doc.save(`empresas_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas (Leads)</h1>
          <p className="text-gray-500 mt-1">{empresas.length} empresas registradas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Empresa
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-outline flex items-center gap-2"
          >
            <Download size={20} />
            CSV
          </button>
          <button
            onClick={exportToPDF}
            className="btn btn-outline flex items-center gap-2"
          >
            <FileText size={20} />
            PDF
          </button>
          <label className="btn btn-outline flex items-center gap-2 cursor-pointer">
            <Upload size={20} />
            Importar
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar empresas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="input md:w-48"
        >
          <option value="">Todos los estados</option>
          {estados.map(e => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterFechaDesde}
          onChange={(e) => setFilterFechaDesde(e.target.value)}
          className="input md:w-40"
          placeholder="Desde"
        />
        <input
          type="date"
          value={filterFechaHasta}
          onChange={(e) => setFilterFechaHasta(e.target.value)}
          className="input md:w-40"
          placeholder="Hasta"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : empresas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay empresas registradas
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Industria</th>
                <th>Tamaño</th>
                <th>Ubicación</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Llamadas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{empresa.nombre}</p>
                        <p className="text-xs text-gray-500">{empresa.total_llamadas} llamadas</p>
                      </div>
                    </div>
                  </td>
                  <td>{empresa.industria || '-'}</td>
                  <td>{empresa.tamano || '-'}</td>
                  <td>
                    {empresa.ubicacion ? (
                      <span className="flex items-center gap-1 text-gray-600">
                        <MapPin size={14} />
                        {empresa.ubicacion}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    {empresa.telefono ? (
                      <div className="flex items-center gap-1">
                        <a 
                          href={`https://wa.me/52${empresa.telefono.replace(/\D/g, '')}?text=Hola%20de%20${encodeURIComponent(empresa.nombre)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 flex items-center gap-1"
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle size={16} />
                          {empresa.telefono}
                        </a>
                      </div>
                    ) : '-'}
                  </td>
                  <td>{getEstadoBadge(empresa.estado)}</td>
                  <td>
                    <span className="text-gray-900">{empresa.llamadas_hoy || 0}</span>
                    <span className="text-gray-400"> / {empresa.total_llamadas || 0}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setLoadingDetail(true);
                          try {
                            console.log('Fetching empresa:', empresa.id);
                            const detail = await api.getEmpresa(empresa.id);
                            console.log('Detail response:', detail);
                            setShowDetail(detail);
                          } catch (err) {
                            console.error('Error:', err);
                            alert('Error al cargar detalles: ' + err.message);
                          } finally {
                            setLoadingDetail(false);
                          }
                        }}
                        className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleEdit(empresa)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(empresa.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? 'Editar Empresa' : 'Nueva Empresa'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Industria</label>
                <input
                  type="text"
                  value={formData.industria}
                  onChange={(e) => setFormData({ ...formData, industria: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Tamaño</label>
                <select
                  value={formData.tamano}
                  onChange={(e) => setFormData({ ...formData, tamano: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar...</option>
                  {tamanos.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Ubicación</label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="input"
                  placeholder="Ciudad, País"
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="input"
                  placeholder="5512345678"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <label className="label">Sitio Web</label>
                <input
                  type="text"
                  value={formData.sitio_web || ''}
                  onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                  className="input"
                  placeholder="https://empresa.com"
                />
              </div>
              {editingId && canEdit && (
                <div>
                  <label className="label">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="input"
                  >
                    {estados.map(e => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fecha de seguimiento */}
              {editingId && canEdit && (
                <div>
                  <label className="label">Recordar Seguimiento</label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_seguimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_seguimiento: e.target.value })}
                    className="input"
                  />
                </div>
              )}
              
              {/* Cita fields - show when estado is cita_agendada */}
              {editingId && canEdit && formData.estado === 'cita_agendada' && (
                <>
                  <div>
                    <label className="label">Fecha y Hora de Cita</label>
                    <input
                      type="datetime-local"
                      value={formData.fecha_cita}
                      onChange={(e) => setFormData({ ...formData, fecha_cita: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Tipo de Cita</label>
                    <select
                      value={formData.tipo_cita}
                      onChange={(e) => setFormData({ ...formData, tipo_cita: e.target.value })}
                      className="input"
                    >
                      <option value="reunion">Reunión</option>
                      <option value="demo">Demo</option>
                      <option value="llamada">Llamada</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Notas de Cita</label>
                    <textarea
                      value={formData.notas_cita}
                      onChange={(e) => setFormData({ ...formData, notas_cita: e.target.value })}
                      className="input"
                      rows={2}
                      placeholder="Notas adicionales para la cita..."
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingId(null); setFormData({ nombre: '', industria: '', tamano: '', ubicacion: '', telefono: '', email: '', sitio_web: '', estado: 'nuevo', vendedor_id: '', fecha_cita: '', tipo_cita: 'reunion', notas_cita: '', fecha_seguimiento: '' }); }}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{showDetail.nombre}</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Industria</p>
                <p className="font-medium">{showDetail.industria || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tamaño</p>
                <p className="font-medium">{showDetail.tamano || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ubicación</p>
                <p className="font-medium">{showDetail.ubicacion || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                {getEstadoBadge(showDetail.estado)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{showDetail.telefono || '-'}</p>
                  {showDetail.telefono && (
                    <a 
                      href={`tel:${showDetail.telefono}`}
                      className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      title="Llamar"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{showDetail.email || '-'}</p>
                  {showDetail.email && (
                    <a 
                      href={`mailto:${showDetail.email}`}
                      className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      title="Enviar Email"
                    >
                      <Mail size={16} />
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sitio Web</p>
                {showDetail.sitio_web ? (
                  <a 
                    href={showDetail.sitio_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-600 hover:underline flex items-center gap-1"
                  >
                    {showDetail.sitio_web.replace(/^https?:\/\//, '')}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <p className="font-medium">-</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Contactos</h3>
                <button 
                  onClick={() => setShowContactoModal(true)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  + Agregar
                </button>
              </div>
              {showDetail.contactos && showDetail.contactos.length > 0 ? (
                <div className="space-y-3">
                  {showDetail.contactos.map((contacto) => (
                    <div key={contacto.id} className="p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {contacto.nombre.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-lg text-gray-900">{contacto.nombre}</p>
                              <p className="text-sm text-blue-600 font-medium">{contacto.cargo || 'Sin cargo'}</p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditContacto(contacto)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Editar contacto"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteContacto(contacto.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar contacto"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {contacto.telefono && (
                              <div className="flex items-center gap-2">
                                <Phone size={16} className="text-green-500" />
                                <a href={`tel:${contacto.telefono}`} className="text-gray-600 hover:text-primary-600">
                                  {contacto.telefono}
                                </a>
                                <a 
                                  href={`https://wa.me/52${contacto.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(contacto.nombre.split(' ')[0])},%20me%20contacto%20de%20su%20empresa.%20¿Podemos%20hablar?`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-500 hover:text-green-600 ml-1"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle size={18} />
                                </a>
                              </div>
                            )}
                            {contacto.email && (
                              <p className="flex items-center gap-2 text-gray-600">
                                <Mail size={16} className="text-red-500" />
                                <a href={`mailto:${contacto.email}`} className="hover:text-primary-600">
                                  {contacto.email}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay contactos registrados</p>
                  <button 
                    onClick={() => setShowContactoModal(true)}
                    className="mt-2 text-primary-600 hover:underline text-sm"
                  >
                    + Agregar primer contacto
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">Historial de Llamadas</h3>
              {showDetail.llamadas?.length > 0 ? (
                showDetail.llamadas.slice(0, 5).map(llamada => (
                  <div key={llamada.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(llamada.fecha_llamada).toLocaleString('es')}
                      </p>
                      <p className="text-xs text-gray-500">{llamada.observaciones || 'Sin observaciones'}</p>
                    </div>
                    <span className={`badge ${
                      llamada.estado === 'interesado' ? 'badge-success' :
                      llamada.estado === 'no_contesto' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {llamada.estado}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay llamadas registradas</p>
              )}
            </div>

            {/* Notas */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">Notas</h3>
              {showDetail.notas?.length > 0 ? (
                showDetail.notas.slice(0, 5).map(nota => (
                  <div key={nota.id} className="p-3 bg-yellow-50 rounded-lg mb-2">
                    <p className="text-sm">{nota.contenido}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {nota.vendedor_nombre} - {new Date(nota.created_at).toLocaleString('es')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay notas</p>
              )}
            </div>

            {/* Tareas */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">Tareas</h3>
              {showDetail.tareas?.length > 0 ? (
                showDetail.tareas.slice(0, 5).map(tarea => (
                  <div key={tarea.id} className={`flex items-center justify-between p-3 rounded-lg mb-2 ${tarea.estado === 'completada' ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <div>
                      <p className="text-sm font-medium">{tarea.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {tarea.fecha_vencimiento && `Vence: ${new Date(tarea.fecha_vencimiento).toLocaleDateString('es')}`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      tarea.prioridad === 'alta' ? 'bg-red-100 text-red-700' :
                      tarea.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {tarea.prioridad}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay tareas</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Contacto Modal */}
      {showContactoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? 'Editar Contacto' : 'Agregar Contacto'}
            </h2>
            <form onSubmit={handleAddContacto} className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  value={contactoFormData.nombre}
                  onChange={(e) => setContactoFormData({ ...contactoFormData, nombre: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Cargo</label>
                <input
                  type="text"
                  value={contactoFormData.cargo}
                  onChange={(e) => setContactoFormData({ ...contactoFormData, cargo: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  type="tel"
                  value={contactoFormData.telefono}
                  onChange={(e) => setContactoFormData({ ...contactoFormData, telefono: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={contactoFormData.email}
                  onChange={(e) => setContactoFormData({ ...contactoFormData, email: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowContactoModal(false); setEditingId(null); setContactoFormData({ nombre: '', cargo: '', telefono: '', email: '' }); }}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={!contactoFormData.nombre}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}