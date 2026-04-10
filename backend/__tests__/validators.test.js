/**
 * Unit tests for validators utility
 */

const { 
  validateEmail, 
  validatePhone, 
  validateEmpresa, 
  validateContacto,
  validateLlamada,
  validateUser,
  VALID_ESTADOS,
  VALID_ROLES
} = require('../src/utils/validators');

describe('validateEmail', () => {
  test('should return valid for empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(true);
  });

  test('should return valid for correct email', () => {
    const result = validateEmail('test@example.com');
    expect(result.valid).toBe(true);
  });

  test('should return invalid for incorrect email', () => {
    const result = validateEmail('invalid-email');
    expect(result.valid).toBe(false);
  });
});

describe('validatePhone', () => {
  test('should return valid for empty phone', () => {
    const result = validatePhone('');
    expect(result.valid).toBe(true);
  });

  test('should return valid for correct phone', () => {
    const result = validatePhone('+50212345678');
    expect(result.valid).toBe(true);
  });

  test('should return invalid for incorrect phone', () => {
    const result = validatePhone('123');
    expect(result.valid).toBe(false);
  });
});

describe('validateEmpresa', () => {
  test('should return valid for correct empresa', () => {
    const data = {
      nombre: 'Empresa Test',
      industria: 'Tecnología',
      tamano: 'Pequeña',
      telefono: '50212345678'
    };
    const result = validateEmpresa(data);
    expect(result.valid).toBe(true);
  });

  test('should return invalid for short nombre', () => {
    const data = { nombre: 'A' };
    const result = validateEmpresa(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Nombre debe tener al menos 2 caracteres');
  });

  test('should return invalid for invalid estado', () => {
    const data = { nombre: 'Test', estado: 'invalid_status' };
    const result = validateEmpresa(data);
    expect(result.valid).toBe(false);
  });
});

describe('validateContacto', () => {
  test('should return valid for correct contacto', () => {
    const data = {
      empresa_id: '123',
      nombre: 'Juan Perez',
      email: 'juan@test.com'
    };
    const result = validateContacto(data);
    expect(result.valid).toBe(true);
  });

  test('should return invalid without empresa_id', () => {
    const data = { nombre: 'Juan' };
    const result = validateContacto(data);
    expect(result.valid).toBe(false);
  });
});

describe('validateUser', () => {
  test('should return valid for correct user', () => {
    const data = {
      email: 'test@teknao.com',
      name: 'Test User',
      role: 'vendedor'
    };
    const result = validateUser(data);
    expect(result.valid).toBe(true);
  });

  test('should return invalid for invalid role', () => {
    const data = { email: 'test@teknao.com', name: 'Test', role: 'invalid' };
    const result = validateUser(data);
    expect(result.valid).toBe(false);
  });
});

describe('VALID_ESTADOS', () => {
  test('should have all expected estados', () => {
    expect(VALID_ESTADOS).toContain('nuevo');
    expect(VALID_ESTADOS).toContain('contactado');
    expect(VALID_ESTADOS).toContain('interesado');
    expect(VALID_ESTADOS).toContain('cerrado');
  });
});

describe('VALID_ROLES', () => {
  test('should have all expected roles', () => {
    expect(VALID_ROLES).toContain('admin');
    expect(VALID_ROLES).toContain('supervisor');
    expect(VALID_ROLES).toContain('vendedor');
  });
});