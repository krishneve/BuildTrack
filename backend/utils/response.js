/**
 * Standardized API response helpers
 * All responses follow: { success, message, data, meta }
 */

const sendSuccess = (res, statusCode = 200, message = "Success", data = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: Object.keys(meta).length ? meta : undefined,
  });
};

const sendError = (res, statusCode = 500, message = "Internal server error", errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const sendPaginated = (res, data, page, limit, total, message = "Fetched successfully") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
