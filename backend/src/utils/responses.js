/**
 * API Response utilities
 */

function success(data = null, message = null) {
  const response = { success: true };
  if (message) response.message = message;
  if (data !== null) response.data = data;
  return response;
}

function error(message, statusCode = 400, details = null) {
  const response = { success: false, error: message };
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }
  return response;
}

function paginated(items, total, page, limit) {
  return {
    success: true,
    data: items,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
}

function handleError(res, err, customMessage = 'Error interno del servidor') {
  console.error('Error:', err.message);
  
  if (err.statusCode) {
    return res.status(err.statusCode).json(error(err.message, err.statusCode));
  }
  
  return res.status(500).json(error(customMessage));
}

module.exports = {
  success,
  error,
  paginated,
  handleError
};