// Custom error class that extends the built-in Error class
class AppError extends Error {
  constructor(message, statusCode) {
    // Call the parent Error constructor with the message
    super(message);

    // Store the HTTP status code (e.g., 404, 500)
    this.statusCode = statusCode;

    // Define error type: 'fail' for client errors (4xx), 'error' for server errors (5xx)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Mark the error as "operational" (expected/handled error, not a programming bug)
    this.isOperational = true;

    // Remove constructor call from stack trace and keep it clean for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
