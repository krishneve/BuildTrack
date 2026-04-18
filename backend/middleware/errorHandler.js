const { sendError } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`, err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 400, "Validation failed", errors);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return sendError(res, 400, `Invalid ${err.path}: ${err.value}`);
  }

  // Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, `${field} already exists.`);
  }

  // Default
  return sendError(
    res,
    err.statusCode || 500,
    err.message || "Internal server error"
  );
};

const notFound = (req, res) => {
  return sendError(res, 404, `Route not found: ${req.originalUrl}`);
};

module.exports = { errorHandler, notFound };
