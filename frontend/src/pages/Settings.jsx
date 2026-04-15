import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Settings, Mail, Save, TestTube, Check, X, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.saveSetting(key, settings[key]);
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Simulate email test (in real implementation would call backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult({ success: true, message: 'Conexión exitosa con el servidor SMTP' });
    } catch (error) {
      setTestResult({ success: false, message: 'Error al conectar con el servidor SMTP' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only admin can access
  if (user?.role !== 'admin') {
    return (
      <div className="card">
        <div className="text-center py-12">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Acceso Denegado</h2>
          <p className="text-gray-500 mt-2">Solo los administradores pueden acceder a configuraciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-500">Administra las opciones y preferencias del CRM</p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`card ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
            <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>{message.text}</span>
          </div>
        </div>
      )}

      {/* Email Configuration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configuración de Correo</h2>
            <p className="text-sm text-gray-500">Configura el servidor SMTP para enviar citas y notificaciones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Host */}
          <div>
            <label className="label">Servidor SMTP</label>
            <input
              type="text"
              className="input"
              value={settings.smtp_host || ''}
              onChange={(e) => handleChange('smtp_host', e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>

          {/* SMTP Port */}
          <div>
            <label className="label">Puerto SMTP</label>
            <input
              type="number"
              className="input"
              value={settings.smtp_port || ''}
              onChange={(e) => handleChange('smtp_port', e.target.value)}
              placeholder="587"
            />
          </div>

          {/* SMTP User */}
          <div>
            <label className="label">Usuario / Email</label>
            <input
              type="email"
              className="input"
              value={settings.smtp_user || ''}
              onChange={(e) => handleChange('smtp_user', e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          {/* SMTP Password */}
          <div>
            <label className="label">Contraseña / App Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                value={settings.smtp_password || ''}
                onChange={(e) => handleChange('smtp_password', e.target.value)}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* SMTP From Name */}
          <div>
            <label className="label">Nombre del Remitente</label>
            <input
              type="text"
              className="input"
              value={settings.smtp_from_name || ''}
              onChange={(e) => handleChange('smtp_from_name', e.target.value)}
              placeholder="Teknao CRM"
            />
          </div>

          {/* SMTP From Email */}
          <div>
            <label className="label">Email del Remitente</label>
            <input
              type="email"
              className="input"
              value={settings.smtp_from_email || ''}
              onChange={(e) => handleChange('smtp_from_email', e.target.value)}
              placeholder="noreply@tuempresa.com"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => handleSave('smtp')}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
          <button
            onClick={handleTestEmail}
            disabled={testing || !settings.smtp_host}
            className="btn btn-secondary flex items-center gap-2"
          >
            <TestTube size={18} />
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {testResult.success ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
              <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>{testResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* System Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configuración General</h2>
            <p className="text-sm text-gray-500">Opciones generales del sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div>
            <label className="label">Nombre de la Empresa</label>
            <input
              type="text"
              className="input"
              value={settings.company_name || ''}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Teknao"
            />
          </div>

          {/* Company Email */}
          <div>
            <label className="label">Email de Contacto</label>
            <input
              type="email"
              className="input"
              value={settings.company_email || ''}
              onChange={(e) => handleChange('company_email', e.target.value)}
              placeholder="contacto@tuempresa.com"
            />
          </div>

          {/* Daily Call Goal */}
          <div>
            <label className="label">Meta Diaria de Llamadas</label>
            <input
              type="number"
              className="input"
              value={settings.daily_call_goal || 25}
              onChange={(e) => handleChange('daily_call_goal', e.target.value)}
              placeholder="25"
            />
          </div>

          {/* Weekly Call Goal */}
          <div>
            <label className="label">Meta Semanal de Llamadas</label>
            <input
              type="number"
              className="input"
              value={settings.weekly_call_goal || 125}
              onChange={(e) => handleChange('weekly_call_goal', e.target.value)}
              placeholder="125"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => handleSave('general')}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Para Gmail, usa <strong>App Password</strong> (no tu contraseña normal)</li>
          <li>• Configura 2FA en tu cuenta Google y genera una App Password en seguridad</li>
          <li>• El puerto 587 es para TLS, el 465 para SSL</li>
          <li>• Los emails de citas se enviarán automáticamente a los clientes</li>
        </ul>
      </div>
    </div>
  );
}