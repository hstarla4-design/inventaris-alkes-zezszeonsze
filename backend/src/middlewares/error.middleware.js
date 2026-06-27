import { logger } from "../utils/logger.js";

export function errorMiddleware(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    logger.error(error.message, { stack: error.stack });
  }
  res.status(statusCode).json({
    error: {
      message: error.message || "Internal server error",
      details: error.details || null,
    },
  });
}
