const createError = require('http-errors');

// La traducción pertenece al transporte; el servicio solo identifica el error.
module.exports = (status, messageKey) => createError(status, { messageKey });
