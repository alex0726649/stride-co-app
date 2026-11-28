const { validationResult } = require('express-validator');

// Convierte el resultado de express-validator en { campo: mensajeTraducido } para las vistas.
// Cada regla usa .withMessage('pantalla.clave') con una clave de locales/; aquí se traduce
// al idioma de la petición. Solo se conserva el primer error de cada campo.
function fieldErrors(req) {
  const errors = {};
  for (const error of validationResult(req).array()) {
    const field = error.path ?? error.param;
    if (field && !errors[field]) errors[field] = req.__(error.msg);
  }
  return errors;
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

module.exports = { fieldErrors, hasErrors };
