const response = require('../utils/response');

// 24 caracteres hexadecimales. No se usa mongoose.Types.ObjectId.isValid()
// porque acepta cualquier texto de 12 caracteres (por ejemplo 'abcdefghijkl').
const OBJECT_ID = /^[a-f\d]{24}$/i;

// Se monta antes de authorize: con alcance own, authorize consulta el documento
// por id, y un id mal formado haría que Mongoose lance CastError (500).
function validateObjectId(messageKey) {
  return function objectIdValidation(req, res, next) {
    if (!OBJECT_ID.test(req.params.id)) {
      return response.badRequest(res, req.__(messageKey));
    }
    return next();
  };
}

module.exports = validateObjectId;