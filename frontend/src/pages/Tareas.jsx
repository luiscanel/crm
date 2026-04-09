import { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckSquare, Plus, X, AlertCircle, Clock, Check, GripVertical } from 'lucide-react';

export default function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [form, setForm] = useState({
    empresa_id: '',
    titulo: '',
    descripcion: '',
    fecha_vencimiento: '',
    prioridad: 'media'
  });

  useEffect(() => {
    loadTareas();
    loadEmpresas();
  }, []);

  const loadTareas = async () => {
    try {
      const data = await api.getMisTareas();
      setTareas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresas = async () => {
    try {
      const data = await api.getEmpresas();
      setEmpresas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createTarea(form);
      setShowNewModal(false);
      setForm({
        empresa_id: '',
        titulo: '',
        descripcion: '',
        fecha_vencimiento: '',
        prioridad: 'media'
      });
      loadTareas();
    } catch (e) {
      alert('Error al crear tarea');
    }
  };

  const toggleEstado = async (tarea) => {
    const nuevoEstado = tarea.estado === 'pendiente' ? 'completada' : 'pendiente';
    try {
      await api.updateTarea(tarea.id, { estado: nuevoEstado });
      loadTareas();
    } catch (e) {
      alert('Error al actualizar tarea');
    }
  };

  const moveTarea = async (tarea, newEstado) => {
    try {
      await api.updateTarea(tarea.id, { estado: newEstado });
      loadTareas();
    } catch (e) {
      alert('Error al mover tarea');
    }
  };

  const deleteTarea = async (id) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.deleteTarea(id);
      loadTareas();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const prioridadColor = (p) => {
    switch (p) {
      case 'alta': return 'bg-red-100 text-red-700';
      case 'media': return 'bg-yellow-100 text-yellow-700';
      case 'baja': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const prioridadKanban = (p) => {
    switch (p) {
      case 'alta': return 'border-l-4 border-red-500';
      case 'media': return 'border-l-4 border-yellow-500';
      case 'baja': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const estadoIcon = (tarea) => {
    if (tarea.estado === 'completada') {
      return <Check size={18} className="text-green-600" />;
    }
    return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
  };

  const pendientes = tareas.filter(t => t.estado === 'pendiente');
  const enProgreso = tareas.filter(t => t.estado === 'en_progreso');
  const completadas = tareas.filter(t => t.estado === 'completada');

  // Kanban columns
  const columns = [
    { id: 'pendiente', title: 'Pendiente', color: 'bg-red-50', tasks: pendientes },
    { id: 'en_progreso', title: 'En Progreso', color: 'bg-yellow-50', tasks: enProgreso },
    { id: 'completada', title: 'Completada', color: 'bg-green-50', tasks: completadas }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Tareas</h1>
          <p className="text-gray-500">Gestiona tus tareas pendientes</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Kanban
            </button>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={20} />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendientes.length}</p>
              <p className="text-sm text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enProgreso.length}</p>
              <p className="text-sm text-gray-500">En Progreso</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completadas.length}</p>
              <p className="text-sm text-gray-500">Completadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vista Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-3 gap-4">
          {columns.map(col => (
            <div key={col.id} className={`rounded-xl p-4 ${col.color}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">{col.title}</h3>
                <span className="bg-white px-2 py-1 rounded-lg text-sm font-medium text-gray-600">
                  {col.tasks.length}
                </span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {col.tasks.map(tarea => (
                  <div
                    key={tarea.id}
                    className={`bg-white rounded-lg p-3 shadow-sm ${prioridadKanban(tarea.prioridad)}`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className={`font-medium text-sm ${tarea.estado === 'completada' ? 'line-through text-gray-400' : ''}`}>
                        {tarea.titulo}
                      </h4>
                      <button onClick={() => deleteTarea(tarea.id)} className="p-1 hover:bg-red-50 rounded">
                        <X size={14} className="text-red-400" />
                      </button>
                    </div>
                    {tarea.descripcion && (
                      <p className="text-xs text-gray-500 mt-1">{tarea.descripcion}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${prioridadColor(tarea.prioridad)}`}>
                        {tarea.prioridad}
                      </span>
                      <div className="flex gap-1">
                        {col.id !== 'pendiente' && (
                          <button
                            onClick={() => moveTarea(tarea, col.id === 'completada' ? 'en_progreso' : 'pendiente')}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            ←
                          </button>
                        )}
                        {col.id !== 'completada' && (
                          <button
                            onClick={() => moveTarea(tarea, col.id === 'pendiente' ? 'en_progreso' : 'completada')}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {col.tasks.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Sin tareas</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay tareas aún</p>
              <button onClick={() => setShowNewModal(true)} className="btn btn-outline mt-4">
                Crear primera tarea
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tareas.map((tarea) => (
                <div key={tarea.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-start gap-4 ${tarea.estado === 'completada' ? 'opacity-60' : ''}`}>
                  <button onClick={() => toggleEstado(tarea)} className="mt-1">
                    {estadoIcon(tarea)}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${tarea.estado === 'completada' ? 'line-through text-gray-400' : ''}`}>
                        {tarea.titulo}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${prioridadColor(tarea.prioridad)}`}>
                        {tarea.prioridad}
                      </span>
                    </div>
                    {tarea.descripcion && (
                      <p className="text-sm text-gray-500 mt-1">{tarea.descripcion}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{tarea.empresa_nombre}</span>
                      {tarea.fecha_vencimiento && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(tarea.fecha_vencimiento).toLocaleDateString('es-GT')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteTarea(tarea.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <X size={18} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Tarea Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nueva Tarea</h2>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Empresa</label>
                <select
                  value={form.empresa_id}
                  onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar empresa</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="input"
                  placeholder="¿Qué necesitas hacer?"
                  required
                />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Detalles adicionales..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha límite</label>
                  <input
                    type="date"
                    value={form.fecha_vencimiento}
                    onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                    className="input"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Crear Tarea
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
