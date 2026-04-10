import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Star, Target, Award, Medal, Crown, Zap, CheckCircle, Gift, ShoppingBag, Phone, Calendar, Users, Building2, Handshake, TrendingUp } from 'lucide-react';

export default function Gamificacion() {
  const { user, refreshUser } = useAuth();
  const [points, setPoints] = useState(null);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [retos, setRetos] = useState([]);
  const [summary, setSummary] = useState(null);
  const [premios, setPremios] = useState([]);
  const [misPremios, setMisPremios] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('premios');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pointsData, badgesData, leaderboardData, retosData, summaryData, premiosData, misPremiosData, misSolicitudesData] = await Promise.all([
        api.getPoints(),
        api.getBadges(),
        api.getLeaderboard(),
        api.getRetos(),
        api.getGamificationSummary(),
        api.getPremios(),
        api.getMisPremios(),
        api.getMisSolicitudes()
      ]);
      setPoints(pointsData);
      setBadges(badgesData);
      setLeaderboard(leaderboardData);
      setRetos(retosData);
      setSummary(summaryData);
      setPremios(premiosData);
      setMisPremios(misPremiosData);
      setMisSolicitudes(misSolicitudesData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCanjear = async (premioId) => {
    if (!confirm('¿Solicitar este premio? Necesitas aprobación del admin.')) return;
    try {
      const result = await api.solicitarPremio(premioId);
      alert(`Solicitud enviada: ${result.premio.nombre}. Pendiente de aprobación.`);
      loadData(); // Refresh data
    } catch (error) {
      alert(error.message || 'Error al solicitar premio');
    }
  };

  // Get badge icon based on tipo
  const getBadgeIcon = (badge) => {
    if (badge.earned) {
      // Show gold Trophy for earned badges
      return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    }
    
    // Different icons based on tipo for unearned badges
    const iconsByType = {
      'llamada': { icon: Phone, color: 'text-blue-400', bg: 'bg-blue-50' },
      'contacto': { icon: Handshake, color: 'text-green-400', bg: 'bg-green-50' },
      'cita': { icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-50' },
      'empresa': { icon: Building2, color: 'text-orange-400', bg: 'bg-orange-50' },
      'conversion': { icon: TrendingUp, color: 'text-teal-400', bg: 'bg-teal-50' }
    };
    
    return iconsByType[badge.tipo] || { icon: Award, color: 'text-gray-400', bg: 'bg-gray-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">🎮 Gamificación</h1>
        <p className="text-gray-500 mt-1">Gana puntos, completa retos y desbloquea insignias</p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-80">Tus Puntos</p>
              <p className="text-3xl font-bold">{user?.puntos || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Llamadas</p>
              <p className="text-2xl font-bold text-gray-900">{points?.total_llamadas || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Citas</p>
              <p className="text-2xl font-bold text-gray-900">{points?.citas_agendadas || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Medal className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Insignias</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.insignias || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retos Activos */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Retos Activos</h2>
          </div>
          
          {retos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay retos activos</p>
          ) : (
            <div className="space-y-4">
              {retos.map((reto) => (
                <div key={reto.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{reto.objetivo}</p>
                      <p className="text-sm text-gray-500 capitalize">{reto.tipo}</p>
                    </div>
                    <span className="badge badge-warning">+{reto.puntos} pts</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          reto.completado ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${reto.porcentaje}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {reto.progreso} / {reto.meta}
                    </span>
                  </div>
                  
                  {reto.completado && (
                    <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      ¡Reto completado!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Ranking de Vendedores</h2>
          </div>
          
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay vendedores</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((vendedor, index) => (
                <div 
                  key={vendedor.id} 
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    vendedor.id === user?.id ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-300 text-orange-900' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {vendedor.name}
                      {vendedor.id === user?.id && <span className="text-primary-600 text-sm ml-2">(Tú)</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {vendedor.total_llamadas} llamadas • {vendedor.total_citas} citas
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">{vendedor.puntos}</p>
                    <p className="text-xs text-gray-500">puntos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-6 h-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Insignias</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const badgeStyle = getBadgeIcon(badge);
            const IconComponent = badgeStyle.icon;
            
            return (
              <div 
                key={badge.id}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  badge.earned 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${badgeStyle.bg}`}>
                  <IconComponent className={`w-8 h-8 ${badge.earned ? 'text-yellow-500' : badgeStyle.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900">{badge.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1">{badge.descripcion}</p>
                {badge.earned && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Obtenida el {new Date(badge.obtained_at).toLocaleDateString('es')}
                  </p>
                )}
                {!badge.earned && badge.tipo === 'llamada' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Requiere: {badge.requisito} llamadas
                  </p>
                )}
                {!badge.earned && badge.tipo === 'cita' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Requiere: {badge.requisito} citas
                  </p>
                )}
                {!badge.earned && badge.tipo === 'conversion' && (
                  <p className="text-xs text-gray-500 mt-2">
                  Requiere: {badge.requisito}% conversión
                </p>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* Tabs for Premios and Mis Premios */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('premios')}
            className={`pb-3 px-2 font-medium ${activeTab === 'premios' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          >
            <Gift className="w-5 h-5 inline mr-2" />
            Premios Disponibles
          </button>
          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`pb-3 px-2 font-medium ${activeTab === 'solicitudes' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          >
            <ShoppingBag className="w-5 h-5 inline mr-2" />
            Mis Solicitudes
          </button>
          <button
            onClick={() => setActiveTab('canjeados')}
            className={`pb-3 px-2 font-medium ${activeTab === 'canjeados' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          >
            <ShoppingBag className="w-5 h-5 inline mr-2" />
            Mis Premios Canjeados
          </button>
        </div>

        {activeTab === 'premios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premios.filter(p => !p.ya_canjeado).map((premio) => (
              <div key={premio.id} className={`border-2 rounded-lg p-4 ${premio.puede_canjear ? 'border-green-500 bg-green-50' : 'border-gray-200 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">
                    {premio.icono === 'pizza' && '🍕'}
                    {premio.icono === 'cine' && '🎬'}
                    {premio.icono === 'desayuno' && '☕'}
                    {premio.icono === 'tarjeta' && '🎁'}
                    {premio.icono === 'lunch' && '🛒'}
                    {!premio.icono && '🎯'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{premio.nombre}</h4>
                    <p className="text-sm text-gray-500">{premio.descripcion}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-gray-900">{premio.puntos_requeridos} pts</span>
                  </div>
                  {premio.puede_canjear ? (
                    <button
                      onClick={() => handleCanjear(premio.id)}
                      className="btn btn-primary text-sm py-1"
                    >
                      Solicitar
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">No tienes suficientes puntos</span>
                  )}
                </div>
              </div>
            ))}
            {premios.filter(p => !p.ya_canjeado).length === 0 && (
              <p className="text-gray-500 text-center col-span-3 py-4">No hay premios disponibles</p>
            )}
          </div>
        )}

        {activeTab === 'solicitudes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {misSolicitudes.map((solicitud) => (
              <div key={solicitud.id} className={`border-2 rounded-lg p-4 ${
                solicitud.estado === 'pendiente' ? 'border-yellow-400 bg-yellow-50' :
                solicitud.estado === 'aprobado' ? 'border-green-500 bg-green-50' :
                'border-red-400 bg-red-50'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">
                    {solicitud.premio_icono === 'pizza' && '🍕'}
                    {solicitud.premio_icono === 'cine' && '🎬'}
                    {solicitud.premio_icono === 'desayuno' && '☕'}
                    {solicitud.premio_icono === 'tarjeta' && '🎁'}
                    {solicitud.premio_icono === 'lunch' && '🛒'}
                    {!solicitud.premio_icono && '🎯'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{solicitud.premio_nombre}</h4>
                    <p className="text-sm text-gray-500">{solicitud.puntos_gastados} pts</p>
                  </div>
                </div>
                <div className="mt-2">
                  {solicitud.estado === 'pendiente' && (
                    <span className="badge badge-warning">Pendiente de aprobación</span>
                  )}
                  {solicitud.estado === 'aprobado' && (
                    <span className="badge badge-success">✓ Aprobado</span>
                  )}
                  {solicitud.estado === 'rechazado' && (
                    <span className="badge badge-danger">✗ Rechazado</span>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Solicitado: {new Date(solicitud.solicitada_at).toLocaleDateString('es')}
                  </p>
                </div>
              </div>
            ))}
            {misSolicitudes.length === 0 && (
              <p className="text-gray-500 text-center col-span-3 py-4">No tienes solicitudes de premios</p>
            )}
          </div>
        )}

        {activeTab === 'canjeados' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {misPremios.map((premio) => (
              <div key={premio.id} className="border-2 border-yellow-400 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {premio.icono === 'pizza' && '🍕'}
                    {premio.icono === 'cine' && '🎬'}
                    {premio.icono === 'desayuno' && '☕'}
                    {premio.icono === 'tarjeta' && '🎁'}
                    {premio.icono === 'lunch' && '🛒'}
                    {!premio.icono && '🎯'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{premio.nombre}</h4>
                    <p className="text-sm text-gray-500">Canjeado el {new Date(premio.canjeado_at).toLocaleDateString('es')}</p>
                  </div>
                </div>
              </div>
            ))}
            {misPremios.length === 0 && (
              <p className="text-gray-500 text-center col-span-3 py-4">Aún no has canjeado premios</p>
            )}
          </div>
        )}
      </div>

      {/* Points Explanation */}
      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Sistema de Puntos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-2xl font-bold text-primary-600">+1</p>
            <p className="text-sm text-gray-500">Por llamada</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-2xl font-bold text-green-600">+3</p>
            <p className="text-sm text-gray-500">Contacto efectivo</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-2xl font-bold text-blue-600">+5</p>
            <p className="text-sm text-gray-500">Empresa interesada</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-2xl font-bold text-purple-600">+10</p>
            <p className="text-sm text-gray-500">Cita agendada</p>
          </div>
        </div>
      </div>
    </div>
  );
}