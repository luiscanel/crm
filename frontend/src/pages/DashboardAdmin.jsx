import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, Building2, Users, Calendar, TrendingUp, TrendingDown,
  Target, Award, BarChart3, ArrowUp, ArrowDown, PieChart, Database, Trash2, RefreshCw
} from 'lucide-react';

export default function DashboardAdmin() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState('semana');
  const [vendedoresData, setVendedoresData] = useState([]);
  const [comparacion, setComparacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);
  const [vendedorDiario, setVendedorDiario] = useState([]);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState(null);

  useEffect(() => {
    loadData();
    loadSeedStatus();
  }, [periodo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendedores, comp] = await Promise.all([
        api.getVendedoresMetrics(periodo),
        api.getComparacion()
      ]);
      setVendedoresData(vendedores.vendedores || []);
      setComparacion(comp);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendedorDiario = async (vendedorId) => {
    try {
      const data = await api.getVendedorDiario(vendedorId, 14);
      setVendedorDiario(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadSeedStatus = async () => {
    try {
      const status = await api.getSeedStatus();
      setSeedStatus(status);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSeed = async () => {
    if (!confirm('¿Crear datos de prueba? Esto agregará 10 empresas, 20 contactos, 15 llamadas, 5 citas, 10 tareas y 5 notas.')) return;
    setSeedLoading(true);
    try {
      const result = await api.seedData();
      if (result.success) {
        alert('Datos de prueba creados correctamente');
        loadSeedStatus();
      } else {
        alert(result.error || 'Error al crear datos');
      }
    } catch (error) {
      alert('Error al crear datos de prueba');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleClearSeed = async () => {
    if (!confirm('¿Eliminar todos los datos de prueba? Esto borrará todas las empresas, contactos, llamadas, citas, tareas y notas.')) return;
    setSeedLoading(true);
    try {
      const result = await api.clearSeed();
      if (result.success) {
        alert('Datos de prueba eliminados');
        loadSeedStatus();
      } else {
        alert(result.error || 'Error al eliminar datos');
      }
    } catch (error) {
      alert('Error al eliminar datos de prueba');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleVendedorClick = (vendedor) => {
    setVendedorSeleccionado(vendedor);
    loadVendedorDiario(vendedor.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Calcular totales
  const totales = vendedoresData.reduce((acc, v) => ({
    llamadas: acc.llamadas + v.llamadas.periodo,
    empresas: acc.empresas + v.empresas_unicas,
    efectivos: acc.efectivos + v.contactos_efectivos,
    interesados: acc.interesados + v.leads_interesados,
    citas: acc.citas + v.citas.realizadas,
    puntos: acc.puntos + v.puntos
  }), { llamadas: 0, empresas: 0, efectivos: 0, interesados: 0, citas: 0, puntos: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Admin 📊
          </h1>
          <p className="text-gray-500 mt-1">
            Métricas y rendimiento de todo el equipo
          </p>
        </div>
        
        {/* Period selector */}
        <div className="flex gap-2">
          {[
            { value: 'dia', label: 'Hoy' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodo === p.value 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Seed Buttons */}
      {user?.role === 'admin' && (
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={handleSeed}
              disabled={seedLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors disabled:opacity-50"
            >
              {seedLoading ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
              Seed
            </button>
            <button
              onClick={handleClearSeed}
              disabled={seedLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              Limpiar
            </button>
          </div>
          {seedStatus && (
            <div className="text-xs text-gray-500">
              Emp:{seedStatus.empresas} Cont:{seedStatus.contactos} Cits:{seedStatus.citas}
            </div>
          )}
        </div>
      )}

      {/* Comparación con periodo anterior */}
      {comparacion && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Llamadas {periodo}</p>
                <p className="text-2xl font-bold text-gray-900">{totales.llamadas}</p>
              </div>
              <div className={`flex items-center gap-1 ${comparacion.llamadas.variacion_semanal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparacion.llamadas.variacion_semanal >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span className="text-sm font-medium">{Math.abs(comparacion.llamadas.variacion_semanal)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs semana anterior</p>
          </div>

          <div className="card border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Leads Interesados</p>
                <p className="text-2xl font-bold text-gray-900">{comparacion.leads.actuales}</p>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUp size={16} />
                <span className="text-sm font-medium">+{comparacion.leads.nuevos}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">nuevos este mes</p>
          </div>

          <div className="card border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Empresas Únicas</p>
                <p className="text-2xl font-bold text-gray-900">{totales.empresas}</p>
              </div>
              <div className={`flex items-center gap-1 ${comparacion.llamadas.variacion_semanal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparacion.llamadas.variacion_semanal >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">en el periodo</p>
          </div>
        </div>
      )}

      {/* Tabla de vendedores */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Rendimiento por Vendedor
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vendedor</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  📞 Llamadas
                  <span className="text-xs text-gray-400 block">{periodo === 'dia' ? 'hoy' : periodo}</span>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  🏢 Empresas
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  ✅ Efectivos
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  🤝 Interesados
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  📅 Citas
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  📈 Conversión
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  ⭐ Puntos
                </th>
              </tr>
            </thead>
            <tbody>
              {vendedoresData.map((v) => (
                <tr 
                  key={v.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleVendedorClick(v)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {v.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{v.nombre}</p>
                        <p className="text-xs text-gray-500">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`text-lg font-bold ${v.llamadas.periodo > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {v.llamadas.periodo}
                    </span>
                    {v.llamadas.hoy > 0 && (
                      <span className="text-xs text-gray-400 block">({v.llamadas.hoy} hoy)</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-lg font-bold text-green-600">{v.empresas_unicas}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-lg font-bold text-purple-600">{v.contactos_efectivos}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-lg font-bold text-orange-600">{v.leads_interesados}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-lg font-bold text-cyan-600">{v.citas.realizadas}</span>
                    {v.citas.agendadas > 0 && (
                      <span className="text-xs text-gray-400 block">+{v.citas.agendadas} pend</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                      parseFloat(v.conversion_rate) >= 10 ? 'bg-green-100 text-green-700' :
                      parseFloat(v.conversion_rate) >= 5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {v.conversion_rate}%
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="inline-flex items-center gap-1 text-yellow-600 font-bold">
                      <Award size={16} />
                      {v.puntos}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="py-3 px-4 text-gray-900">TOTAL</td>
                <td className="text-center py-3 px-4 text-blue-600 text-lg">{totales.llamadas}</td>
                <td className="text-center py-3 px-4 text-green-600 text-lg">{totales.empresas}</td>
                <td className="text-center py-3 px-4 text-purple-600 text-lg">{totales.efectivos}</td>
                <td className="text-center py-3 px-4 text-orange-600 text-lg">{totales.interesados}</td>
                <td className="text-center py-3 px-4 text-cyan-600 text-lg">{totales.citas}</td>
                <td className="text-center py-3 px-4 text-gray-600 text-lg">
                  {totales.llamadas > 0 ? ((totales.efectivos + totales.interesados) / totales.llamadas * 100).toFixed(1) : 0}%
                </td>
                <td className="text-center py-3 px-4 text-yellow-600 text-lg">{totales.puntos}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Detalle del vendedor seleccionado */}
      {vendedorSeleccionado && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Detalle: {vendedorSeleccionado.nombre}
            </h2>
            <button 
              onClick={() => setVendedorSeleccionado(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Gráfico diario */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Últimas 2 semanas</h3>
            <div className="flex items-end justify-between h-40 gap-1">
              {vendedorDiario.map((day, index) => {
                const maxCalls = Math.max(...vendedorDiario.map(d => d.llamadas), 1);
                const height = (day.llamadas / maxCalls) * 100;
                const isToday = index === vendedorDiario.length - 1;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t transition-all hover:opacity-80 ${isToday ? 'bg-primary-500' : 'bg-gray-300'}`}
                      style={{ height: `${height}%`, minHeight: day.llamadas > 0 ? '8px' : '2px' }}
                      title={`${day.llamadas} llamadas`}
                    />
                    <span className={`text-xs mt-1 ${isToday ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                      {new Date(day.fecha).getDate()}
                    </span>
                    <span className="text-xs text-gray-300">{day.llamadas}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats del vendedor */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">Llamadas</p>
              <p className="text-2xl font-bold text-blue-600">{vendedorSeleccionado.llamadas.periodo}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">Empresas Únicas</p>
              <p className="text-2xl font-bold text-green-600">{vendedorSeleccionado.empresas_unicas}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-500">Efectivos</p>
              <p className="text-2xl font-bold text-purple-600">{vendedorSeleccionado.contactos_efectivos}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-500">Interesados</p>
              <p className="text-2xl font-bold text-orange-600">{vendedorSeleccionado.leads_interesados}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}