const response = require('../utils/response');
const { Product } = require('../models/relationals');

const ID_FORMAT = /^[1-9]\d*$/;

function validate(req, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return req.__('products.invalidBody');
  }
  for (const field of ['name', 'description', 'brand']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return req.__('products.invalidBody');
    }
  }
  if (typeof body.price !== 'number' || body.price < 0) {
    return req.__('products.invalidPrice');
  }
  return null;
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
    if (!ID_FORMAT.test(req.params.id)) {
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

    const product = await Product.create(req.body);
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
    if (!ID_FORMAT.test(req.params.id)) {
      return response.badRequest(res, req.__('products.invalidId'));
    }
    const product = await Product.findByPk(req.params.id);
    if (!product) return response.notFound(res, req.__('products.notFound'));

    const error = validate(req, req.body);
    if (error) return response.badRequest(res, error);

    await product.update(req.body);
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
    if (!ID_FORMAT.test(req.params.id)) {
      return response.badRequest(res, req.__('products.invalidId'));
    }
    const product = await Product.findByPk(req.params.id);
    if (!product) return response.notFound(res, req.__('products.notFound'));

    await product.destroy();
    return response.success(res, req.__('products.deleted'), null);
  } catch (error) {
    next(error);
  }
}

module.exports = { list, find, create, update, destroy };