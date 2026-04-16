import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Play, HelpCircle, Building2, Phone, Calendar, Trophy, LayoutDashboard, Users, MessageCircle, CheckCircle, Mail } from 'lucide-react';

const tourSteps = [
  {
    target: 'dashboard-content',
    title: '📊 Tu Dashboard',
    content: 'Este es tu panel de control. Aquí ves:\n• 📞 Llamadas realizadas hoy\n• ✅ Llamadas efectivas (conectaron)\n• ⭐ Tus puntos acumulados\n• 🎯 Tu progreso vs la meta diaria',
    position: 'right',
    icon: LayoutDashboard
  },
  {
    target: 'sidebar',
    title: '📋 Menú de Navegación',
    content: 'Desde aquí navegas a todas las secciones del CRM. Cada ítem te lleva a una parte diferente de la aplicación.',
    position: 'right',
    icon: Users
  },
  {
    target: 'empresas-link',
    title: '🏢 Empresas (Leads)',
    content: 'Esta es tu lista de empresas/prospectos. Aquí gestionas todos tus leads para hacer seguimiento y convertirlos en clientes.',
    position: 'right',
    icon: Building2
  },
  {
    target: 'empresas-add',
    title: '➕ Agregar Nueva Empresa',
    content: 'Click aquí para crear una empresa nueva. Completa: Nombre, Teléfono, Email y Estado inicial (Nuevo).',
    position: 'bottom',
    icon: Building2
  },
  {
    target: 'llamadas-link',
    title: '📞 Registro de Llamadas',
    content: 'Desde aquí registras cada llamada que realizas. Por cada llamada ganas puntos para tu ranking personal.',
    position: 'right',
    icon: Phone
  },
  {
    target: 'citas-link',
    title: '📅 Citas - Nuevo Flujo',
    content: '📌 NUEVO FLUJO DE CITAS:\n\n1. Creas una cita → Queda "pendiente de aprobación"\n2. Un supervisor debe aprobar la cita\n3. Una vez aprobada, puedes enviar por WhatsApp al cliente\n4. Si la cita se aprueba, ganas +10 puntos',
    position: 'right',
    icon: Calendar
  },
  {
    target: 'citas-whatsapp',
    title: '💬 Enviar Cita por WhatsApp',
    content: 'Una vez que tu cita es APROBADA por el supervisor, aparecerá el botón "Enviar por WhatsApp".\n\nHaz click y se abrirá WhatsApp con el mensaje de confirmación listo para enviar.',
    position: 'right',
    icon: MessageCircle
  },
  {
    target: 'aprobacion-citas-link',
    title: '✅ Aprobar Citas (Supervisor)',
    content: '🛡️ PANEL DE SUPERVISOR\n\nAquí ves todas las citas pendientes de aprobación.\n\nACCIONES:\n• Revisa los detalles de cada cita\n• Aprueba o rechaza la cita\n• Al aprobar: se genera plantilla WhatsApp para copiar\n• Copia el mensaje o envíalo directo por WhatsApp\n• También puedes enviar por correo electrónico\n• Si approved → +10 puntos al vendedor',
    position: 'right',
    icon: CheckCircle
  },
  {
    target: 'pipeline-link',
    title: '🔄 Pipeline de Ventas',
    content: 'Vista visual del flujo de tus empresas. Arrastra las tarjetas entre columnas para cambiar el estado:\n• Nuevo → Contactado → Interesado → Cita Agendada → Seguimiento → Cerrado\n💡 El estado lo decides tú según tu análisis del lead.',
    position: 'right',
    icon: Building2
  },
  {
    target: 'gamificacion-link',
    title: '🏆 Gamificación',
    content: 'Aquí ves tu rendimiento: puntos, badges ganados, retos activos y tu posición en el ranking de vendedores.',
    position: 'right',
    icon: Trophy
  },
  {
    target: 'header-puntos',
    title: '💰 Tus Puntos',
    content: 'Siempre visible en el header. Aquí vez tus puntos acumulados por cada actividad (llamadas, citas, ventas).',
    position: 'left',
    icon: Trophy
  }
];

export default function Tour({ isOpen, onClose, onStart }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsMinimized(false);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Marcar como visto
      localStorage.setItem('tour_seen', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('tour_seen', 'true');
    onClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const IconComponent = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleFinish} />
      
      {/* Minimizado */}
      {isMinimized ? (
        <div 
          className="absolute bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-xl shadow-lg cursor-pointer flex items-center gap-3 hover:shadow-xl hover:scale-105 transition-all"
          onClick={() => setIsMinimized(false)}
        >
          <Play size={18} fill="currentColor" className="ml-1" />
          <span className="font-semibold">Continuar Tour</span>
        </div>
      ) : (
        /* Tour Card */
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <HelpCircle size={22} />
              </div>
              <div>
                <span className="font-bold text-lg">Tour Guiado</span>
                <p className="text-blue-100 text-xs">Aprende a usar el CRM</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMinimized(true)} 
              className="hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                Paso {currentStep + 1} de {tourSteps.length}
              </span>
              {step.icon && (
                <div className="bg-gray-100 p-1.5 rounded-lg">
                  <IconComponent size={14} className="text-gray-600" />
                </div>
              )}
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              {step.title}
            </h3>
            
            {/* Content */}
            <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
              {step.content}
            </p>

            {/* Tips opcionales según paso */}
            {step.target === 'empresas-add' && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-medium">💡 Tip:</p>
                <p className="text-sm text-amber-700 mt-1">
                  Un lead passa por estados: Nuevo → Contactado → Interesado → Cliente
                </p>
              </div>
            )}

            {step.target === 'llamadas-link' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800 font-medium">⭐ Ganas puntos por:</p>
                <ul className="text-sm text-green-700 mt-1 space-y-1">
                  <li>• +1 punto por llamada registrada</li>
                  <li>• +3 puntos por llamada efectiva (contacto)</li>
                  <li>• +10 puntos por agendar cita</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between rounded-b-2xl">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStep === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft size={18} />
              Anterior
            </button>

            <button
              onClick={handleFinish}
              className="text-gray-500 text-sm hover:text-gray-700 font-medium"
            >
              Saltar tour
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
            >
              {currentStep === tourSteps.length - 1 ? '¡Listo!' : 'Siguiente'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Botón flotante para iniciar tour
export function TourButton({ onClick }) {
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('tour_seen');
    if (seen) {
      setHasSeenTour(true);
    }
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onClick}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-2 font-semibold transition-all animate-bounce-slow"
      >
        <Play size={20} fill="currentColor" className="ml-1" />
        <span>Tour Guiado</span>
      </button>
      
      {!hasSeenTour && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
      )}
    </div>
  );
}