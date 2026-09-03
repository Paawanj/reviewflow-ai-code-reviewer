function requestLogger(request, response, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${request.method} ${request.originalUrl}`);
  next();
}

module.exports = requestLogger;
