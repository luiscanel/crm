import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, Mail, Target, Users, Trophy, Calendar, TrendingUp } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - App Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Teknao CRM</h1>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Gestiona tus llamadas<br/>y cierra más ventas
          </h2>
          <p className="text-primary-100 text-xl mb-12">
            La herramienta diseñada para equipos de ventas B2B que quieren resultados.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-5">
            <Target className="w-8 h-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">Gestión de Leads</h3>
            <p className="text-primary-200 text-sm">Organiza y prioriza tus prospectos</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-5">
            <Calendar className="w-8 h-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">Seguimiento</h3>
            <p className="text-primary-200 text-sm">Agenda citas y recordatorios</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-5">
            <TrendingUp className="w-8 h-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">Métricas</h3>
            <p className="text-primary-200 text-sm">Visualiza tu progreso diario</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-5">
            <Trophy className="w-8 h-8 text-white mb-3" />
            <h3 className="text-white font-semibold mb-1">Gamificación</h3>
            <p className="text-primary-200 text-sm">Motiva a tu equipo con puntos</p>
          </div>
        </div>

        <p className="text-primary-200 text-sm mt-8">
          © 2026 Teknao CRM B2B
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Teknao CRM</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido</h2>
            <p className="text-gray-500 mb-8">Inicia sesión para continuar</p>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3"
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </form>

            </div>
        </div>
      </div>
    </div>
  );
}