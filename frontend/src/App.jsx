// Vercel deploy trigger
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardAdmin from './pages/DashboardAdmin';
import Empresas from './pages/Empresas';
import Kanban from './pages/Kanban';
import Llamadas from './pages/Llamadas';
import Citas from './pages/Citas';
import Tareas from './pages/Tareas';
import Gamificacion from './pages/Gamificacion';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import SolicitudesPremios from './pages/SolicitudesPremios';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If allowedRoles is specified, check user role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { user, loading, showTimeoutWarning } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Default route based on role
  const defaultRoute = user?.role === 'admin' ? '/admin' : '/';

  // Show DashboardAdmin on "/" for admin, Dashboard for vendedores
  const dashboardComponent = user?.role === 'admin' ? <DashboardAdmin /> : <Dashboard />;

  return (
    <>
      {/* Timeout Warning Modal */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sesión por expirar</h3>
              <p className="text-gray-600 mb-4">
                Tu sesión expirará en <b>5 minutos</b> debido a inactividad.
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Mueve el mouse o presiona cualquier tecla para continuar.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to={defaultRoute} replace /> : <Login />} 
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={dashboardComponent} />
          <Route path="empresas" element={<Empresas />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="llamadas" element={<Llamadas />} />
          <Route path="citas" element={<Citas />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="gamificacion" element={<Gamificacion />} />
          <Route path="reportes" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Reportes /></ProtectedRoute>} />
          <Route path="usuarios" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Usuarios /></ProtectedRoute>} />
          <Route path="solicitudes-premios" element={<ProtectedRoute allowedRoles={['admin']}><SolicitudesPremios /></ProtectedRoute>} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardAdmin />} />
          <Route path="empresas" element={<Empresas />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="llamadas" element={<Llamadas />} />
          <Route path="citas" element={<Citas />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="gamificacion" element={<Gamificacion />} />
          <Route path="reportes" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Reportes /></ProtectedRoute>} />
          <Route path="usuarios" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Usuarios /></ProtectedRoute>} />
          <Route path="solicitudes-premios" element={<ProtectedRoute allowedRoles={['admin']}><SolicitudesPremios /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}