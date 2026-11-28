const { Inventory } = require('../models/relationals');
const serviceError = require('./service-error');

const MAX_INT = 2147483647;
const fields = ['id', 'variant_id', 'stock', 'reserved'];

function validateId(id) {
  if (!/^[1-9]\d*$/.test(id) || Number(id) > MAX_INT) throw serviceError(400, 'inventory.invalidId');
}

function quantities({ stock, reserved } = {}) {
  if (![stock, reserved].every(value => Number.isInteger(value) && value >= 0 && value <= MAX_INT)) {
    throw serviceError(400, 'inventory.invalidQuantity');
  }
  if (reserved > stock) throw serviceError(400, 'inventory.excessReserved');
  return { stock, reserved };
}

async function listAll() {
  return Inventory.findAll({ attributes: fields, order: [['id', 'ASC']] });
}

async function findById(id) {
  validateId(id);
  const record = await Inventory.findByPk(id, { attributes: fields });
  if (!record) throw serviceError(404, 'inventory.notFound');
  return record;
}

async function write(where, body) {
  const data = quantities(body);
  const [updated, records] = await Inventory.update(data, { where, returning: fields });
  if (!updated) throw serviceError(404, 'inventory.notFound');
  return records[0];
}

// La API identifica el registro de inventario, la web identifica su variante.
async function updateById(id, body) {
  validateId(id);
  return write({ id }, body);
}

async function update(variantId, body) {
  validateId(variantId);
  return write({ variant_id: variantId }, body);
}

async function list() {
  const records = await Inventory.findAll({
    attributes: fields, include: [{ association: 'variant', include: ['product'] }], order: [['id', 'ASC']],
  });
  return records.map(record => {
    const data = typeof record.toJSON === 'function' ? record.toJSON() : record;
    return { ...data, available: data.stock - data.reserved };
  });
}

module.exports = { listAll, findById, updateById, list, update };
