import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Gift, Check, X, Clock, Users, Star } from 'lucide-react';

export default function SolicitudesPremios() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getSolicitudes();
      setSolicitudes(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (solicitudId) => {
    if (!confirm('¿Aprobar esta solicitud de premio?')) return;
    setProcesando(solicitudId);
    try {
      await api.aprobarSolicitud(solicitudId, true);
      alert('Premio aprobado');
      loadData();
    } catch (error) {
      alert('Error al aprobar');
    } finally {
      setProcesando(null);
    }
  };

  const handleRechazar = async (solicitudId) => {
    if (!confirm('¿Rechazar esta solicitud de premio?')) return;
    setProcesando(solicitudId);
    try {
      await api.aprobarSolicitud(solicitudId, false);
      alert('Premio rechazado');
      loadData();
    } catch (error) {
      alert('Error al rechazar');
    } finally {
      setProcesando(null);
    }
  };

  const getIcono = (icono) => {
    switch(icono) {
      case 'pizza': return '🍕';
      case 'cine': return '🎬';
      case 'desayuno': return '☕';
      case 'tarjeta': return '🎁';
      case 'lunch': return '🛒';
      default: return '🎯';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎁 Solicitudes de Premios</h1>
          <p className="text-gray-500 mt-1">Aprobar o rechazar canjes de premios</p>
        </div>
        <div className="badge badge-warning">
          {solicitudes.length} pendiente{solicitudes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solicitudes.map((sol) => (
            <div key={sol.id} className="card border-2 border-yellow-400 bg-yellow-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{getIcono(sol.premio_icono)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{sol.premio_nombre}</h3>
                    <p className="text-sm text-gray-500">{sol.puntos_gastados} puntos</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-white rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{sol.usuario_nombre}</span>
                </div>
                <p className="text-xs text-gray-500">{sol.usuario_email}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {new Date(sol.solicitada_at).toLocaleDateString('es')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRechazar(sol.id)}
                    disabled={procesando === sol.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Rechazar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleAprobar(sol.id)}
                    disabled={procesando === sol.id}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Aprobar"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}