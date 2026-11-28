const service = require('../../services/inventory.service');
const response = require('../../utils/response');

async function listInventory(req, res, next) {
  try {
    return response.success(res, req.__('inventory.list'), await service.listAll());
  } catch (error) { return next(error); }
}

async function getInventoryById(req, res, next) {
  try {
    return response.success(res, req.__('inventory.found'), await service.findById(req.params.id));
  } catch (error) { return next(error); }
}

async function updateInventory(req, res, next) {
  try {
    return response.success(res, req.__('inventory.updated'), await service.updateById(req.params.id, req.body || {}));
  } catch (error) { return next(error); }
}

module.exports = { listInventory, getInventoryById, updateInventory };
