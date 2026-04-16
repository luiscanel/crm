import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Copy, Phone, Video, MapPin, Calendar, Clock, MessageCircle, AlertCircle, Mail } from 'lucide-react';

const tiposCita = {
  llamada: { label: 'Llamada', icon: Phone, color: 'bg-blue-100 text-blue-600' },
  videollamada: { label: 'Videollamada', icon: Video, color: 'bg-purple-100 text-purple-600' },
  presencial: { label: 'Presencial', icon: MapPin, color: 'bg-green-100 text-green-600' }
};

export default function CitasPendientes() {
  const { user, refreshUser } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCita, setSelectedCita] = useState(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [copied, setCopied] = useState(false);
  const [nota, setNota] = useState('');

  useEffect(() => {
    loadCitas();
  }, []);

  const loadCitas = async () => {
    try {
      const data = await api.getCitasPendientesAprobacion();
      setCitas(data);
    } catch (error) {
      console.error('Error loading citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsappTemplate = (cita) => {
    const fecha = new Date(cita.fecha_hora);
    const fechaStr = fecha.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' });
    const horaStr = fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

    const tipoLabel = tiposCita[cita.tipo]?.label || cita.tipo;
    
    let mensaje = `📅 *Confirmación de Cita*%0A%0A`;
    mensaje += `Hola *${cita.contacto_nombre || 'Estimado'}*,%0A%0A`;
    mensaje += `Le confirmamos su cita con *${cita.empresa_nombre}*.%0A%0A`;
    mensaje += `📅 *Fecha:* ${fechaStr}%0A`;
    mensaje += `⏰ *Hora:* ${horaStr}%0A`;
    mensaje += `📋 *Tipo:* ${tipoLabel}%0A%0A`;
    
    if (cita.link_videollamada) {
      mensaje += `🔗 *Enlace:* ${cita.link_videollamada}%0A%0A`;
    }
    
    if (cita.notas) {
      mensaje += `📝 *Notas:* ${cita.notas}%0A%0A`;
    }
    
    mensaje += `Por favor confirme su asistencia.%0A%0A`;
    mensaje += `Saludos,%0A*Equipo Teknao*`;

    return mensaje;
  };

  const handleSelectCita = (cita) => {
    setSelectedCita(cita);
    setWhatsappTemplate(generateWhatsappTemplate(cita));
    setNota('');
  };

  const handleAprobar = async () => {
    if (!selectedCita) return;
    try {
      const result = await api.aprobarCita(selectedCita.id, { nota });
      alert(`✅ Cita aprobada\nPuntos del vendedor: ${result.puntos_vendedor}`);
      refreshUser();
      loadCitas();
      setSelectedCita(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aprobar: ' + error.message);
    }
  };

  const handleRechazar = async () => {
    if (!selectedCita) return;
    if (!confirm('¿Estás seguro de rechazar esta cita?')) return;
    try {
      const result = await api.rechazarCita(selectedCita.id, { nota });
      alert('❌ Cita rechazada');
      loadCitas();
      setSelectedCita(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al rechazar: ' + error.message);
    }
  };

  const copyToClipboard = async () => {
    const decoded = whatsappTemplate.replace(/%0A/g, '\n').replace(/%20/g, ' ').replace(/\*/g, '');
    await navigator.clipboard.writeText(decoded);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsapp = () => {
    if (!selectedCita?.contacto_telefono) {
      alert('El contacto no tiene teléfono registrado');
      return;
    }
    const telefono = selectedCita.contacto_telefono.replace(/\D/g, '');
    const url = `https://wa.me/502${telefono}?text=${whatsappTemplate}`;
    window.open(url, '_blank');
  };

  const sendEmail = async (cita) => {
    if (!cita.contacto_email) {
      alert('El contacto no tiene email registrado');
      return;
    }
    
    const subject = encodeURIComponent(`📅 Confirmación de Cita - ${cita.empresa_nombre}`);
    const body = encodeURIComponent(whatsappTemplate.replace(/%0A/g, '\n').replace(/%20/g, ' ').replace(/\*/g, ''));
    
    window.open(`mailto:${cita.contacto_email}?subject=${subject}&body=${body}`, '_blank');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprobación de Citas</h1>
          <p className="text-gray-500">Citas pendientes de aprobación</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          <span className="text-yellow-800 font-semibold">{citas.length} pendiente{citas.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {citas.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">¡Todo al día!</h2>
          <p className="text-gray-500">No hay citas pendientes de aprobación</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de citas */}
          <div className="lg:col-span-1 space-y-3">
            {citas.map(cita => (
              <div 
                key={cita.id} 
                onClick={() => handleSelectCita(cita)}
                className={`card cursor-pointer transition-all ${
                  selectedCita?.id === cita.id ? 'ring-2 ring-primary-600' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{cita.empresa_nombre}</h3>
                    <p className="text-sm text-gray-500">{cita.contacto_nombre || 'Sin contacto'}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${tiposCita[cita.tipo]?.color || 'bg-gray-100'}`}>
                    {tiposCita[cita.tipo]?.icon && <tiposCita[cita.tipo].icon className="w-4 h-4" />}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <Calendar size={14} />
                  <span>{formatFecha(cita.fecha_hora)}</span>
                  <Clock size={14} className="ml-2" />
                  <span>{formatHora(cita.fecha_hora)}</span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Vendedor: {cita.vendedor_nombre}
                </div>
              </div>
            ))}
          </div>

          {/* Detalles y acciones */}
          <div className="lg:col-span-2">
            {selectedCita ? (
              <div className="card space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCita.empresa_nombre}</h2>
                    <p className="text-gray-500">{selectedCita.contacto_nombre}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    tiposCita[selectedCita.tipo]?.color || 'bg-gray-100'
                  }`}>
                    {tiposCita[selectedCita.tipo]?.label || selectedCita.tipo}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-semibold">{formatFecha(selectedCita.fecha_hora)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hora</p>
                    <p className="font-semibold">{formatHora(selectedCita.fecha_hora)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vendedor</p>
                    <p className="font-semibold">{selectedCita.vendedor_nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-semibold">{selectedCita.contacto_telefono || 'No registrado'}</p>
                  </div>
                </div>

                {selectedCita.notas && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notas</p>
                    <p className="bg-gray-50 p-3 rounded-lg">{selectedCita.notas}</p>
                  </div>
                )}

                {selectedCita.link_videollamada && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Enlace de Videollamada</p>
                    <a 
                      href={selectedCita.link_videollamada} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      {selectedCita.link_videollamada}
                    </a>
                  </div>
                )}

                {/* Plantilla WhatsApp */}
                <div className="border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-800 flex items-center gap-2">
                      <MessageCircle size={18} />
                      Plantilla WhatsApp
                    </h3>
                    <button
                      onClick={copyToClipboard}
                      className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                      <Copy size={14} />
                      {copied ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                    {whatsappTemplate.replace(/%0A/g, '\n').replace(/%20/g, ' ').replace(/\*/g, '')}
                  </div>
                  <button
                    onClick={openWhatsapp}
                    disabled={!selectedCita.contacto_telefono}
                    className="btn btn-success w-full mt-3 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Enviar por WhatsApp
                  </button>

                  {/* Botón enviar correo */}
                  {selectedCita.contacto_email && (
                    <button
                      onClick={() => sendEmail(selectedCita)}
                      className="btn btn-primary w-full mt-2 flex items-center justify-center gap-2"
                    >
                      <Mail size={18} />
                      Enviar correo electrónico
                    </button>
                  )}

                  {!selectedCita.contacto_email && !selectedCita.contacto_telefono && (
                    <p className="text-sm text-yellow-600 mt-2 text-center">
                      ⚠️ El contacto no tiene email ni teléfono registrado
                    </p>
                  )}
                </div>

                {/* Nota opcional */}
                <div>
                  <label className="label">Nota (opcional)</label>
                  <textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="Agregar una nota..."
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleRechazar}
                    className="btn btn-danger flex-1 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Rechazar
                  </button>
                  <button
                    onClick={handleAprobar}
                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Aprobar (+10 pts)
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Selecciona una cita</h2>
                <p className="text-gray-500">Haz clic en una cita de la lista para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
