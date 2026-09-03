function sendJson(response, statusCode, data) {
  return response.status(statusCode).json(data);
}

function sendError(response, statusCode, message) {
  return sendJson(response, statusCode, { message });
}

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

module.exports = {
  sendJson,
  sendError,
  asyncHandler,
};
