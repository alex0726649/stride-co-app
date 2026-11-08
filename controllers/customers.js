const { Customer } = require('../models/documents');
const response = require('../utils/response');

const MAX_INT = 2147483647; // userId referencia a users.id (INTEGER en PostgreSQL)
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDRESS_TYPES = ['SHIPPING', 'BILLING'];
const ADDRESS_FIELDS = ['type', 'street', 'number', 'city', 'state', 'zipCode', 'country'];
const EDITABLE_FIELDS = ['userId', 'phone', 'email', 'addresses'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeAddress(address) {
  const clean = {};
  for (const field of ADDRESS_FIELDS) {
    if (address[field] !== undefined) clean[field] = address[field];
  }
  return clean;
}

// Toma solo los campos editables y los valida. En create todos los obligatorios
// deben venir; en update (partial) solo se validan los que se envían.
function parseBody(req, { partial }) {
  const invalidBody = { error: req.__('customers.invalidBody') };
  if (!isPlainObject(req.body)) return invalidBody;

  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  }
  if (partial && Object.keys(data).length === 0) return invalidBody;

  if (!partial || data.userId !== undefined) {
    if (!Number.isInteger(data.userId) || data.userId < 1 || data.userId > MAX_INT) {
      return { error: req.__('customers.invalidUserId') };
    }
  }

  if (data.email !== undefined
    && (typeof data.email !== 'string' || !EMAIL_FORMAT.test(data.email.trim()))) {
    return { error: req.__('customers.invalidEmail') };
  }

  if (data.phone !== undefined && typeof data.phone !== 'string') return invalidBody;

  if (data.addresses !== undefined) {
    if (!Array.isArray(data.addresses)) return invalidBody;
    for (const address of data.addresses) {
      if (!isPlainObject(address)) return invalidBody;
      if (!ADDRESS_TYPES.includes(address.type)) {
        return { error: req.__('customers.invalidAddressType') };
      }
      for (const field of ADDRESS_FIELDS.slice(1)) {
        if (address[field] !== undefined && typeof address[field] !== 'string') return invalidBody;
      }
    }
    data.addresses = data.addresses.map(sanitizeAddress);
  }

  return { data };
}

// Errores de Mongoose que son culpa de la entrada, no del servidor.
function handleInputError(req, res, error) {
  if (error && error.code === 11000) {
    return response.badRequest(res, req.__('customers.duplicate'));
  }
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
    return response.badRequest(res, req.__('customers.invalidBody'));
  }
  return null;
}

async function list(req, res, next) {
  try {
    const customers = await Customer.find();
    return response.success(res, req.__('customers.list'), customers);
  } catch (error) {
    return next(error);
  }
}

async function find(req, res, next) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return response.notFound(res, req.__('customers.notFound'));
    return response.success(res, req.__('customers.found'), customer);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  const { error, data } = parseBody(req, { partial: false });
  if (error) return response.badRequest(res, error);

  try {
    const customer = await Customer.create(data);
    return response.created(res, req.__('customers.created'), customer);
  } catch (err) {
    return handleInputError(req, res, err) || next(err);
  }
}

async function update(req, res, next) {
  const { error, data } = parseBody(req, { partial: true });
  if (error) return response.badRequest(res, error);

  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!customer) return response.notFound(res, req.__('customers.notFound'));
    return response.success(res, req.__('customers.updated'), customer);
  } catch (err) {
    return handleInputError(req, res, err) || next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return response.notFound(res, req.__('customers.notFound'));
    return response.success(res, req.__('customers.deleted'), null);
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, find, create, update, destroy };