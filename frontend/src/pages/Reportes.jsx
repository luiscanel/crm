import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Calendar, TrendingUp, Users, Phone, Building2 } from 'lucide-react';

export default function Reportes() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('diario');

  useEffect(() => {
    loadData();
  }, [reportType]);

  const loadData = async () => {
    try {
      const [reportData, activityData] = await Promise.all([
        api.getReport({ tipo: reportType }),
        api.getActivity({ limit: 20 })
      ]);
      setReport(reportData);
      setActivity(activityData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Simple CSV export
    if (!report) return;
    
    let csv = 'Reporte de ' + reportType + '\n\n';
    csv += 'Período: ' + report.periodo.inicio + ' - ' + report.periodo.fin + '\n\n';
    
    // Llamadas por vendedor
    csv += 'Llamadas por Vendedor\n';
    csv += 'Vendedor,Llamadas Totales,Efectivos,Interesados\n';
    report.llamadas_por_vendedor.forEach(v => {
      csv += `${v.vendedor},${v.total_llamadas},${v.efectivos},${v.interesados}\n`;
    });
    
    csv += '\nEmpresas por Estado\n';
    csv += 'Estado,Cantidad\n';
    report.empresas_por_estado.forEach(e => {
      csv += `${e.estado},${e.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 mt-1">Análisis y estadísticas del equipo de ventas</p>
        </div>
        <button
          onClick={exportToExcel}
          className="btn btn-primary flex items-center gap-2"
        >
          <Download size={20} />
          Exportar a Excel
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2">
        {['diario', 'semanal', 'mensual'].map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              reportType === type
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Period */}
      <div className="card">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={20} />
          <span>
            Período: <strong>{report?.periodo?.inicio}</strong> hasta <strong>{report?.periodo?.fin}</strong>
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Llamadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {report?.llamadas_por_vendedor?.reduce((acc, v) => acc + v.total_llamadas, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contactos Efectivos</p>
              <p className="text-2xl font-bold text-gray-900">
                {report?.llamadas_por_vendedor?.reduce((acc, v) => acc + v.efectivos, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Leads Interesados</p>
              <p className="text-2xl font-bold text-gray-900">
                {report?.llamadas_por_vendedor?.reduce((acc, v) => acc + v.interesados, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Empresas Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {report?.empresas_por_estado?.reduce((acc, e) => acc + e.count, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Llamadas por Vendedor */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Llamadas por Vendedor</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Total Llamadas</th>
                <th>Contactos Efectivos</th>
                <th>Interesados</th>
                <th>Tasa Conversión</th>
              </tr>
            </thead>
            <tbody>
              {report?.llamadas_por_vendedor?.map((v, i) => {
                const tasa = v.total_llamadas > 0 ? ((v.interesados / v.total_llamadas) * 100).toFixed(1) : 0;
                return (
                  <tr key={i}>
                    <td className="font-medium">{v.vendedor}</td>
                    <td>{v.total_llamadas}</td>
                    <td>{v.efectivos}</td>
                    <td>{v.interesados}</td>
                    <td>
                      <span className={`badge ${tasa >= 20 ? 'badge-success' : 'badge-warning'}`}>
                        {tasa}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empresas por Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Empresas por Estado</h3>
          <div className="space-y-3">
            {report?.empresas_por_estado?.map((e) => {
              const total = report.empresas_por_estado.reduce((acc, x) => acc + x.count, 0);
              const percentage = total > 0 ? (e.count / total) * 100 : 0;
              return (
                <div key={e.estado}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{e.estado}</span>
                    <span className="text-gray-500">{e.count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activity.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
                <div>
                  <p className="text-gray-700">{a.details}</p>
                  <p className="text-xs text-gray-400">
                    {a.user_name} • {new Date(a.created_at).toLocaleString('es')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}