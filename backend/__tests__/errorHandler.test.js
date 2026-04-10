/**
 * Unit tests for error handler middleware
 */

const { AppError, errorHandler, notFoundHandler, asyncHandler } = require('../src/middleware/errorHandler');

describe('AppError', () => {
  test('should create error with default 500 status', () => {
    const error = new AppError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  test('should create error with custom status', () => {
    const error = new AppError('Not found', 404);
    expect(error.statusCode).toBe(404);
  });
});

describe('errorHandler', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('should handle operational error with custom message', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new AppError('Not found', 404);
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not found'
    });
    
    process.env.NODE_ENV = originalEnv;
  });

  test('should handle validation errors (422)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new AppError('Validation failed', 422);
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed'
    });
    
    process.env.NODE_ENV = originalEnv;
  });

  test('should return generic message for non-operational errors', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Generic error');
    error.isOperational = false;
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Error interno del servidor'
    });
    
    process.env.NODE_ENV = originalEnv;
  });
});

describe('notFoundHandler', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { originalUrl: '/test' };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('should call next with 404 error', () => {
    notFoundHandler(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    const passedError = mockNext.mock.calls[0][0];
    expect(passedError.statusCode).toBe(404);
    expect(passedError.message).toContain('/test');
  });
});

describe('asyncHandler', () => {
  test('should wrap async function and catch errors', async () => {
    const mockReq = {};
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockNext = jest.fn();
    
    const asyncFn = asyncHandler(async (req, res, next) => {
      throw new AppError('Async error', 400);
    });
    
    await asyncFn(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
    const passedError = mockNext.mock.calls[0][0];
    expect(passedError.message).toBe('Async error');
  });

  test('should call next with result of function', async () => {
    const mockReq = {};
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockNext = jest.fn();
    
    const asyncFn = asyncHandler(async (req, res) => {
      return res.json({ ok: true });
    });
    
    await asyncFn(mockReq, mockRes, mockNext);
    
    expect(mockRes.json).toHaveBeenCalledWith({ ok: true });
  });
});