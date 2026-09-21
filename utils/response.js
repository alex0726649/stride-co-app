/**
 * Utilidad para estandarizar las respuestas JSON de la API.
 * Asegura que todas las respuestas sigan el formato { message, data }.
 */

const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    message,
    data
  });
};

module.exports = {
  success: (res, message, data) => sendResponse(res, 200, message, data),
  created: (res, message, data) => sendResponse(res, 201, message, data),
  badRequest: (res, message) => sendResponse(res, 400, message),
  notFound: (res, message) => sendResponse(res, 404, message),
  serverError: (res, message = 'Error interno del servidor') => sendResponse(res, 500, message),
};
