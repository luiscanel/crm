import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, Building2, Users, Calendar, Trophy, TrendingUp,
  Target, Clock, Star, ArrowUp, ArrowDown, Flame, Award,
  Zap, Sparkles, MessageSquare
} from 'lucide-react';

// Frases motivacionales
const frasesMotivacionales = [
  "¡Cada llamada es una oportunidad! 🚀",
  "El éxito está en la perseverancia 💪",
  "Hoy es un gran día para cerrar tratos 🔥",
  "Tu próximo cliente podría ser el mejor 🎯",
  "La ventas es crear relaciones de confianza 🤝",
  "¡Vas muy bien, sigue así! ⭐",
  "Cada 'no' te acerca a un 'sí' 🎉",
  "Eres capaz de lograr grandes cosas 🌟"
];

function getSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return '¡Buenos días!';
  if (hora < 18) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [generalStats, setGeneralStats] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gamificacionStats, setGamificacionStats] = useState(null);
  const [fraseDelDia, setFraseDelDia] = useState('');
  const [citasProximas, setCitasProximas] = useState([]);

  useEffect(() => {
    loadData();
    // Frase del día basada en el día del año
    const diaDelAno = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    setFraseDelDia(frasesMotivacionales[diaDelAno % frasesMotivacionales.length]);
  }, []);

  const loadData = async () => {
    try {
      const [general, daily, charts, gamStats, citas] = await Promise.all([
        api.getDashboardGeneral(),
        api.getLlamadasDaily(),
        api.getDashboardCharts(7),
        api.getDashboardStats(),
        api.getCitasUpcoming()
      ]);
      setGeneralStats(general);
      setDailyStats(daily);
      setChartData(charts);
      setGamificacionStats(gamStats);
      setCitasProximas(citas || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Llamadas Hoy',
      value: generalStats?.llamadas?.hoy || 0,
      icon: Phone,
      color: 'bg-blue-500',
      subtext: `Meta: ${dailyStats?.meta_llamadas || 25}`
    },
    {
      label: 'Empresas',
      value: generalStats?.total_empresas || 0,
      icon: Building2,
      color: 'bg-green-500',
      subtext: `${generalStats?.empresas_contactadas_hoy || 0} hoy`
    },
    {
      label: 'Leads Interesados',
      value: generalStats?.leads_interesados || 0,
      icon: Users,
      color: 'bg-purple-500',
      subtext: 'En pipeline'
    },
    {
      label: 'Citas Pendientes',
      value: generalStats?.citas_pendientes || 0,
      icon: Calendar,
      color: 'bg-orange-500',
      subtext: `${generalStats?.citas_mes || 0} este mes`
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header con saludo motivacional */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">{getSaludo()}</p>
            <h1 className="text-3xl font-bold mt-1">
              Hola, {user?.name}! 👋
            </h1>
            <p className="text-primary-100 mt-2 text-lg">
              {fraseDelDia}
            </p>
          </div>
          {gamificacionStats?.streak > 0 && (
            <div className="text-center bg-white/20 rounded-xl p-4">
              <Flame className="w-8 h-8 mx-auto text-orange-300" />
              <p className="text-2xl font-bold">{gamificacionStats.streak}</p>
              <p className="text-xs text-primary-200">días streak</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-500">{stat.subtext}</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Progress & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Progress */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Progreso Diario
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Llamadas ({dailyStats?.llamadas_hoy || 0}/25)
                </span>
                <span className="text-sm text-gray-500">
                  {dailyStats?.progreso_llamadas?.toFixed(0) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${dailyStats?.progreso_llamadas || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Empresas Únicas ({dailyStats?.empresas_unicas_hoy || 0}/25)
                </span>
                <span className="text-sm text-gray-500">
                  {dailyStats?.progreso_empresas?.toFixed(0) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${dailyStats?.progreso_empresas || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Goal indicator */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Cumplimiento de meta diaria
                </p>
                <p className="text-xs text-gray-500">
                  {generalStats?.cumplimiento_meta || 0}%
                </p>
              </div>
              <div className="ml-auto">
                {generalStats?.cumplimiento_meta >= 100 ? (
                  <span className="badge badge-success">Meta cumplida!</span>
                ) : (
                  <span className="badge badge-warning">
                    {(100 - (generalStats?.cumplimiento_meta || 0)).toFixed(0)}% restante
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Última Semana
          </h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {chartData.map((day, index) => {
              const maxCalls = Math.max(...chartData.map(d => d.llamadas), 1);
              const height = (day.llamadas / maxCalls) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
                    style={{ height: `${height}%`, minHeight: day.llamadas > 0 ? '8px' : '0' }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(day.fecha).toLocaleDateString('es', { weekday: 'short' })}
                  </span>
                  <span className="text-xs text-gray-400">{day.llamadas}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* This Week */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Esta Semana</p>
              <p className="text-lg font-semibold text-gray-900">
                {generalStats?.llamadas?.semana || 0} llamadas
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {generalStats?.llamadas?.semana >= 125 ? (
              <span className="text-green-600 flex items-center gap-1">
                <ArrowUp size={16} /> ¡Excelente semana!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ArrowDown size={16} /> {125 - (generalStats?.llamadas?.semana || 0)} para meta semanal
              </span>
            )}
          </div>
        </div>

        {/* This Month */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Este Mes</p>
              <p className="text-lg font-semibold text-gray-900">
                {generalStats?.llamadas?.mes || 0} llamadas
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {generalStats?.citas_mes || 0} citasrealizadas
          </div>
        </div>

        {/* Points */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tus Puntos</p>
              <p className="text-lg font-semibold text-gray-900">{user?.puntos || 0}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <a href="/gamificacion" className="text-primary-600 hover:underline">
              Ver logros y badges →
            </a>
          </div>
        </div>
      </div>

      {/* Nueva sección de Logros y Gamificación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Próximo Badge */}
        {gamificacionStats?.next_badge && (
          <div className="card border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Próximo Logro</p>
                <p className="text-xs text-gray-500">{gamificacionStats.next_badge.nombre}</p>
              </div>
            </div>
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${gamificacionStats.next_badge.porcentaje}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {gamificacionStats.next_badge.progreso_label}
            </p>
          </div>
        )}

        {/* Ranking */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Tu Posición</p>
              <p className="text-xs text-gray-500">Leaderboard</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            #{gamificacionStats?.ranking?.posicion || '-'}
            <span className="text-sm text-gray-500 font-normal"> / {gamificacionStats?.ranking?.total || '-'}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {gamificacionStats?.ranking?.posicion === 1 ? '🏆 ¡Líder del equipo!' : '¡Sigue así!'}
          </p>
        </div>

        {/* Comparación vs Ayer */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${gamificacionStats?.diferencia >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
              {gamificacionStats?.diferencia >= 0 ? (
                <ArrowUp className="w-5 h-5 text-green-600" />
              ) : (
                <ArrowDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">vs Ayer</p>
              <p className="text-xs text-gray-500">Llamadas</p>
            </div>
          </div>
          <p className={`text-2xl font-bold ${gamificacionStats?.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gamificacionStats?.diferencia >= 0 ? '+' : ''}{gamificacionStats?.diferencia || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {gamificacionStats?.diferencia >= 0 ? '¡Vas muy bien!' : 'Mañana será mejor 💪'}
          </p>
        </div>

        {/* Mejor Día */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Mejor Día</p>
              <p className="text-xs text-gray-500">Récord personal</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {gamificacionStats?.best_day?.cantidad || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {gamificacionStats?.best_day?.fecha ? 
              new Date(gamificacionStats.best_day.fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' }) 
              : 'Sin récord aún'}
          </p>
        </div>
      </div>

      {/* Citas Próximas */}
      {citasProximas.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Citas Próximas
          </h3>
          <div className="space-y-3">
            {citasProximas.slice(0, 3).map((cita) => (
              <div key={cita.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    {new Date(cita.fecha).getDate()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cita.empresa_nombre}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(cita.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                  cita.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {cita.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}