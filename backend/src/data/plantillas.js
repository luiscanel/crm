// Plantillas de mensajes predefinidas
const plantillas = [
  {
    id: 'presentacion',
    nombre: 'Presentación Inicial',
    canal: 'whatsapp',
    texto: `Hola [NOMBRE], te contacto de Teknao CRM.

Somos una empresa especializada en soluciones de gestión empresarial B2B.

¿Te gustaría que te agendemos una breve llamada para mostrarte cómo podemos ayudarte a optimizar tus procesos de ventas?

Quedo atento/a a tu respuesta.`
  },
  {
    id: 'seguimiento',
    nombre: 'Seguimiento Post-Llamada',
    canal: 'whatsapp',
    texto: `Hola [NOMBRE], gracias por tu tiempo en nuestra llamada de hoy.

Como acordamos, te envío información adicional sobre nuestras soluciones.

¿Tienes alguna duda que pueda aclararte?

Saludos cordiales.`
  },
  {
    id: 'cita_confirmacion',
    nombre: 'Confirmación de Cita',
    canal: 'whatsapp',
    texto: `Hola [NOMBRE], confirmo tu cita con Teknao CRM para el [FECHA] a las [HORA].

Nuestra reunión será vía [VIDEO/LLAMADA/PRESENCIAL].

¿Necesitas algo adicional antes de nuestra cita?

¡Nos vemos pronto!`
  },
  {
    id: 'cold_calling',
    nombre: 'Cold Calling - Primer Contacto',
    canal: 'telefono',
    texto: `Buenos días/tardes, soy [VENDEDOR] de Teknao CRM.

Le llamo porque trabajamos con empresas como la suya ofreciendo soluciones de gestión empresarial.

¿Tiene 2 minutos para comentarle de qué se trata?

[SI ACEPTA: Le explico brevemente...]
[SI RECHAZA: Perfecto, le agradezco su tiempo. Que tenga un buen día.]`
  },
  {
    id: 'interesado',
    nombre: 'Lead Interesado',
    canal: 'whatsapp',
    texto: `Hola [NOMBRE], me alegra saber que estás interesado/a en nuestras soluciones.

Te envío nuestra propuesta comercial para que la revises.

¿Podemos agendar una llamada para resolver cualquier duda?

Quedo a tu disposición.`
  },
  {
    id: 'propuesta',
    nombre: 'Envío de Propuesta',
    canal: 'email',
    texto: `Estimado/a [NOMBRE],

Adjunto encontrará la propuesta comercial solicitada.

La propuesta incluye:
- Descripción de las soluciones
- Inversión y formas de pago
- Cronograma de implementación
- Garantías y soporte

Quedo a su disposición para cualquier aclaración.

Saludos cordiales,
[VENDEDOR]`
  },
  {
    id: 'agradecimiento',
    nombre: 'agradecimiento post-reunión',
    canal: 'email',
    texto: `Estimado/a [NOMBRE],

Gracias por su tiempo en la reunión de hoy.

Fue un placer conocer más sobre sus necesidades. Estoy seguro de que nuestra solución puede ayudarle a [BENEFICIO].

Adjunto encontrará el resumen de lo hablado y los siguientes pasos acordados.

Quedo atento/a a sus comentarios.

Saludos,
[VENDEDOR]`
  },
  {
    id: 'seguimiento_2',
    nombre: 'Seguimiento 2 semanas',
    canal: 'whatsapp',
    texto: `Hola [NOMBRE], hope you're doing well!

Solo quería hacer seguimiento a nuestra última conversación.

¿Tuviste oportunidad de revisar la información que te envié?

Cualquier duda, con gusto te apoyo.

Saludos!`
  }
];

module.exports = plantillas;
