import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardAdmin from './pages/DashboardAdmin';
import Empresas from './pages/Empresas';
import Llamadas from './pages/Llamadas';
import Citas from './pages/Citas';
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
  const { user, loading } = useAuth();
  
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
        <Route path="llamadas" element={<Llamadas />} />
        <Route path="citas" element={<Citas />} />
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
        <Route path="llamadas" element={<Llamadas />} />
        <Route path="citas" element={<Citas />} />
        <Route path="gamificacion" element={<Gamificacion />} />
        <Route path="reportes" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Reportes /></ProtectedRoute>} />
        <Route path="usuarios" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Usuarios /></ProtectedRoute>} />
        <Route path="solicitudes-premios" element={<ProtectedRoute allowedRoles={['admin']}><SolicitudesPremios /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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