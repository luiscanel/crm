/**
 * Unit tests for responses utility
 */

const { 
  success, 
  error, 
  paginated, 
  handleError
} = require('../src/utils/responses');

describe('success', () => {
  test('should return success with data', () => {
    const data = { id: 1, name: 'Test' };
    const result = success(data);
    
    expect(result).toEqual({
      success: true,
      data
    });
  });

  test('should return success with custom message', () => {
    const result = success({ id: 1 }, 'Operation completed');
    
    expect(result).toEqual({
      success: true,
      message: 'Operation completed',
      data: { id: 1 }
    });
  });

  test('should return success without data', () => {
    const result = success();
    
    expect(result).toEqual({ success: true });
  });
});

describe('error', () => {
  test('should return error with message', () => {
    const result = error('Something went wrong');
    
    expect(result).toEqual({
      success: false,
      error: 'Something went wrong'
    });
  });

  test('should include details in non-production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const result = error('Error', 500, { extra: 'info' });
    
    expect(result.details).toEqual({ extra: 'info' });
    
    process.env.NODE_ENV = originalEnv;
  });
});

describe('paginated', () => {
  test('should return paginated data', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = paginated(items, 10, 1, 5);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(items);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(5);
    expect(result.pagination.totalPages).toBe(2);
  });
});

describe('handleError', () => {
  test('should return 500 for generic error', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const err = new Error('Generic error');
    
    handleError(mockRes, err);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Error interno del servidor'
    });
  });

  test('should return custom status for error with statusCode', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const err = new Error('Not found');
    err.statusCode = 404;
    
    handleError(mockRes, err);
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not found'
    });
  });
});