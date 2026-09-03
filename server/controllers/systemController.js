const { sendJson } = require("../utils/response");

function getHello(request, response) {
  return sendJson(response, 200, {
    message: "Hello from the backend!",
  });
}

module.exports = {
  getHello,
};
