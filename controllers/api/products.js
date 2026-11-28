const response = require('../../utils/response');
const service = require('../../services/product.service');

// La API conserva su lista de campos editables (active se usa solo en el panel).
function apiBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  return Object.fromEntries(['category_id', 'name', 'description', 'brand', 'price']
    .filter(key => body[key] !== undefined).map(key => [key, body[key]]));
}

async function list(req, res, next) {
  try {
    return response.success(res, req.__('products.list'), await service.listAll());
  } catch (error) { next(error); }
}

async function find(req, res, next) {
  try {
    return response.success(res, req.__('products.found'), await service.findById(req.params.id));
  } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    return response.created(res, req.__('products.created'), await service.create(apiBody(req.body)));
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  try {
    return response.success(res, req.__('products.updated'), await service.update(req.params.id, apiBody(req.body)));
  } catch (error) { next(error); }
}

async function destroy(req, res, next) {
  try {
    return response.success(res, req.__('products.deleted'), await service.destroy(req.params.id));
  } catch (error) { next(error); }
}

module.exports = { list, find, create, update, destroy };
