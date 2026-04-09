import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Trash2, Edit, UserCheck, UserX } from 'lucide-react';

// Only admin can manage users
export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendedor'
  });

  // Only admin can see this page
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update user - only admin can change role
        const updateData = { name: formData.name };
        if (isAdmin) {
          updateData.role = formData.role;
        }
        await api.updateUser(editingId, updateData);
      } else {
        await api.register(formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', email: '', password: '', role: 'vendedor' });
      loadUsers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'vendedor'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert('No tienes permiso para eliminar usuarios');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      // Note: Backend would need delete endpoint
      alert('Funcionalidad de eliminación en desarrollo');
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-800' },
      supervisor: { label: 'Supervisor', color: 'bg-purple-100 text-purple-800' },
      vendedor: { label: 'Vendedor', color: 'bg-green-100 text-green-800' }
    };
    const r = roles[role] || roles.vendedor;
    return <span className={`badge ${r.color}`}>{r.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">{users.length} usuarios registrados</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Access denied for non-admin */}
      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800">No tienes permiso para gestionar usuarios. Solo los administradores pueden acceder a esta página.</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Puntos</th>
                <th>Fecha Registro</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-500">{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <span className="font-medium text-yellow-600">{user.puntos}</span>
                  </td>
                  <td className="text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es')}
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        {currentUser?.id !== user.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Nuevo Usuario
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}