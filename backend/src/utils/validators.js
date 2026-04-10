/**
 * Validation utilities
 */

const VALID_ESTADOS = ['nuevo', 'contactado', 'interesado', 'cita_agendada', 'seguimiento', 'cerrado'];
const VALID_TAMANOS = ['Micro', 'Pequeña', 'Mediana', 'Grande', 'Corporación'];
const VALID_CANALES = ['telefono', 'email', 'whatsapp', 'presencial', 'linkedin'];
const VALID_NIVELES = ['bajo', 'medio', 'alto'];
const VALID_ROLES = ['admin', 'supervisor', 'vendedor'];
const VALID_TAMANO_EMPRESA = ['pequenia', 'mediana', 'grande'];
const VALID_PRIORIDAD = ['baja', 'media', 'alta', 'urgente'];
const VALID_CITA_ESTADO = ['pendiente', 'confirmada', 'realizada', 'cancelada'];
const VALID_LLAMADA_ESTADO = ['sin_contacto', 'contactado', 'no_interesado', 'llamada_efectiva', 'interesado'];

function validateEmail(email) {
  if (!email) return { valid: true };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return { valid: emailRegex.test(email), error: 'Email inválido' };
}

function validatePhone(phone) {
  if (!phone) return { valid: true };
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return { valid: phoneRegex.test(phone), error: 'Teléfono inválido' };
}

function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: `${fieldName} es requerido` };
  }
  return { valid: true };
}

function validateLength(value, min, max, fieldName) {
  if (value && typeof value === 'string') {
    if (min && value.length < min) {
      return { valid: false, error: `${fieldName} debe tener al menos ${min} caracteres` };
    }
    if (max && value.length > max) {
      return { valid: false, error: `${fieldName} no puede exceder ${max} caracteres` };
    }
  }
  return { valid: true };
}

function validateEnum(value, validValues, fieldName) {
  if (value && !validValues.includes(value)) {
    return { valid: false, error: `${fieldName} inválido` };
  }
  return { valid: true };
}

function validateEmpresa(data) {
  const errors = [];

  const nameCheck = validateRequired(data.nombre, 'Nombre');
  if (!nameCheck.valid) errors.push(nameCheck.error);

  const lenCheck = validateLength(data.nombre, 2, 200, 'Nombre');
  if (!lenCheck.valid) errors.push(lenCheck.error);

  const emailCheck = validateEmail(data.email);
  if (!emailCheck.valid) errors.push(emailCheck.error);

  const phoneCheck = validatePhone(data.telefono);
  if (!phoneCheck.valid) errors.push(phoneCheck.error);

  const estadoCheck = validateEnum(data.estado, VALID_ESTADOS, 'Estado');
  if (!estadoCheck.valid) errors.push(estadoCheck.error);

  const tamanoCheck = validateEnum(data.tamano, VALID_TAMANOS, 'Tamaño');
  if (!tamanoCheck.valid) errors.push(tamanoCheck.error);

  return { valid: errors.length === 0, errors };
}

function validateContacto(data) {
  const errors = [];

  const empresaCheck = validateRequired(data.empresa_id, 'Empresa');
  if (!empresaCheck.valid) errors.push(empresaCheck.error);

  const nameCheck = validateRequired(data.nombre, 'Nombre');
  if (!nameCheck.valid) errors.push(nameCheck.error);

  const emailCheck = validateEmail(data.email);
  if (!emailCheck.valid) errors.push(emailCheck.error);

  const phoneCheck = validatePhone(data.telefono);
  if (!phoneCheck.valid) errors.push(phoneCheck.error);

  const canalCheck = validateEnum(data.canal_preferido, VALID_CANALES, 'Canal');
  if (!canalCheck.valid) errors.push(canalCheck.error);

  const nivelCheck = validateEnum(data.nivel_interes, VALID_NIVELES, 'Nivel de interés');
  if (!nivelCheck.valid) errors.push(nivelCheck.error);

  return { valid: errors.length === 0, errors };
}

function validateLlamada(data) {
  const errors = [];

  const empresaCheck = validateRequired(data.empresa_id, 'Empresa');
  if (!empresaCheck.valid) errors.push(empresaCheck.error);

  const estadoCheck = validateEnum(data.estado, VALID_LLAMADA_ESTADO, 'Estado');
  if (!estadoCheck.valid) errors.push(estadoCheck.error);

  return { valid: errors.length === 0, errors };
}

function validateCita(data) {
  const errors = [];

  const empresaCheck = validateRequired(data.empresa_id, 'Empresa');
  if (!empresaCheck.valid) errors.push(empresaCheck.error);

  const fechaCheck = validateRequired(data.fecha_hora, 'Fecha');
  if (!fechaCheck.valid) errors.push(fechaCheck.error);

  const tipoCheck = validateEnum(data.tipo, ['reunion', 'llamada', 'demo', 'otro'], 'Tipo');
  if (!tipoCheck.valid) errors.push(tipoCheck.error);

  const estadoCheck = validateEnum(data.estado, VALID_CITA_ESTADO, 'Estado');
  if (!estadoCheck.valid) errors.push(estadoCheck.error);

  return { valid: errors.length === 0, errors };
}

function validateUser(data) {
  const errors = [];

  const emailCheck = validateRequired(data.email, 'Email');
  if (!emailCheck.valid) errors.push(emailCheck.error);

  if (data.email) {
    const emailValid = validateEmail(data.email);
    if (!emailValid.valid) errors.push(emailValid.error);
  }

  if (data.password) {
    const passLen = validateLength(data.password, 6, 100, 'Contraseña');
    if (!passLen.valid) errors.push(passLen.error);
  }

  const nameCheck = validateRequired(data.name, 'Nombre');
  if (!nameCheck.valid) errors.push(nameCheck.error);

  const roleCheck = validateEnum(data.role, VALID_ROLES, 'Rol');
  if (!roleCheck.valid) errors.push(roleCheck.error);

  return { valid: errors.length === 0, errors };
}

module.exports = {
  VALID_ESTADOS,
  VALID_TAMANOS,
  VALID_CANALES,
  VALID_NIVELES,
  VALID_ROLES,
  VALID_TAMANO_EMPRESA,
  VALID_PRIORIDAD,
  VALID_CITA_ESTADO,
  VALID_LLAMADA_ESTADO,
  validateEmail,
  validatePhone,
  validateRequired,
  validateLength,
  validateEnum,
  validateEmpresa,
  validateContacto,
  validateLlamada,
  validateCita,
  validateUser
};