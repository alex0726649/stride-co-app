const response = require('../utils/response');
const { Product } = require('../models/relationals');

const MAX_INT = 2147483647;          // límite de INTEGER en la BD
const MAX_PRICE = 99999999.99;       // límite de DECIMAL(10,2)
const EDITABLE_FIELDS = ['category_id', 'name', 'description', 'brand', 'price'];

function hasValidId(id) {
  return /^[1-9]\d*$/.test(id) && Number(id) <= MAX_INT;
}

function validate(req, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return req.__('products.invalidBody');
  }
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150) {
    return req.__('products.invalidBody');
  }
  if (typeof body.description !== 'string' || !body.description.trim()) {
    return req.__('products.invalidBody');
  }
  if (typeof body.brand !== 'string' || !body.brand.trim() || body.brand.length > 100) {
    return req.__('products.invalidBody');
  }
  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0 || body.price > MAX_PRICE) {
    return req.__('products.invalidPrice');
  }
  return null;
}

// Solo deja pasar los campos editables; evita que el cliente fije el id u otros campos.
function pickEditable(body) {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

async function list(req, res, next) {
  try {
    const products = await Product.findAll({ include: 'variants' });
    return response.success(res, req.__('products.list'), products);
  } catch (error) {
    next(error);
  }
}

async function find(req, res, next) {
  try {
    if (!hasValidId(req.params.id)) {
      return response.badRequest(res, req.__('products.invalidId'));
    }
    const product = await Product.findByPk(req.params.id, { include: 'variants' });
    if (!product) return response.notFound(res, req.__('products.notFound'));
    return response.success(res, req.__('products.found'), product);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const error = validate(req, req.body);
    if (error) return response.badRequest(res, error);

    const product = await Product.create(pickEditable(req.body));
    return response.created(res, req.__('products.created'), product);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return response.badRequest(res, req.__('products.invalidBody'));
    }
    next(error);
  }
}

async function update(req, res, next) {
  try {
    if (!hasValidId(req.params.id)) {
      return response.badRequest(res, req.__('products.invalidId'));
    }
    const product = await Product.findByPk(req.params.id);
    if (!product) return response.notFound(res, req.__('products.notFound'));

    const error = validate(req, req.body);
    if (error) return response.badRequest(res, error);

    await product.update(pickEditable(req.body));
    return response.success(res, req.__('products.updated'), product);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return response.badRequest(res, req.__('products.invalidBody'));
    }
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    if (!hasValidId(req.params.id)) {
      return response.badRequest(res, req.__('products.invalidId'));
    }
    const product = await Product.findByPk(req.params.id, { include: 'variants' });
    if (!product) return response.notFound(res, req.__('products.notFound'));
    // No se permite borrar un producto con variantes asociadas (evita
    // borrado en cascada o un 500 por la restricción de llave foránea).
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return response.badRequest(res, req.__('products.inUse'));
    }

    await product.destroy();
    return response.success(res, req.__('products.deleted'), null);
  } catch (error) {
    next(error);
  }
}

module.exports = { list, find, create, update, destroy };