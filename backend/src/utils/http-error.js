export class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(message = "Resource not found") {
  return new HttpError(404, message);
}
