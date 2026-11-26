const { Inventory } = require('../models/relationals');
const response = require('../utils/response');

const MAX_POSTGRES_INTEGER = 2_147_483_647;
const inventoryFields = ['id', 'variant_id', 'stock', 'reserved'];

function isValidId(id) {
  return /^[1-9]\d*$/.test(id) && Number(id) <= MAX_POSTGRES_INTEGER;
}

function isValidQuantity(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_POSTGRES_INTEGER;
}

async function listInventory(req, res, next) {
  try {
    const records = await Inventory.findAll({ attributes: inventoryFields, order: [['id', 'ASC']] });
    return response.success(res, req.__('inventory.list'), records);
  } catch (error) {
    return next(error);
  }
}

async function getInventoryById(req, res, next) {
  const { id } = req.params;
  if (!isValidId(id)) return response.badRequest(res, req.__('inventory.invalidId'));

  try {
    const record = await Inventory.findByPk(id, { attributes: inventoryFields });
    if (!record) return response.notFound(res, req.__('inventory.notFound'));
    return response.success(res, req.__('inventory.found'), record);
  } catch (error) {
    return next(error);
  }
}

async function updateInventory(req, res, next) {
  const { id } = req.params;
  if (!isValidId(id)) return response.badRequest(res, req.__('inventory.invalidId'));

  const { stock, reserved } = req.body || {};
  if (!isValidQuantity(stock) || !isValidQuantity(reserved)) {
    return response.badRequest(res, req.__('inventory.invalidQuantity'));
  }
  if (reserved > stock) return response.badRequest(res, req.__('inventory.excessReserved'));

  try {
    const [updated, records] = await Inventory.update(
      { stock, reserved },
      { where: { id }, returning: inventoryFields },
    );
    if (!updated) return response.notFound(res, req.__('inventory.notFound'));
    return response.success(res, req.__('inventory.updated'), records[0]);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listInventory, getInventoryById, updateInventory };
