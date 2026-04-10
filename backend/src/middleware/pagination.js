/**
 * Pagination middleware
 */

const paginate = (defaultLimit = 20, maxLimit = 100) => {
  return (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || defaultLimit, maxLimit);
    const offset = (page - 1) * limit;

    req.pagination = {
      page,
      limit,
      offset
    };

    next();
  };
};

// Helper function to build pagination response
const buildPaginationResponse = (items, total, page, limit) => {
  return {
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

module.exports = { paginate, buildPaginationResponse };