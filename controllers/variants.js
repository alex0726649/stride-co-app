const { sequelize, Product, ProductVariant, Inventory } = require('../models/relationals');
const response = require('../utils/response');

const MAX_POSTGRES_INTEGER = 2_147_483_647;
const textLimits = { sku: 100, size: 30, color: 50 };

function isPositiveId(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_POSTGRES_INTEGER;
}

function isValidRouteId(id) {
  return /^[1-9]\d*$/.test(id) && isPositiveId(Number(id));
}

function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'variants.invalidBody';
  if (!isPositiveId(body.product_id)) return 'variants.invalidProductId';

  for (const [field, limit] of Object.entries(textLimits)) {
    const value = body[field];
    if (typeof value !== 'string' || !value.trim() || value.includes('\0') || [...value].length > limit) {
      return 'variants.invalidBody';
    }
  }

  if (body.active !== undefined && typeof body.active !== 'boolean') return 'variants.invalidActive';
  return null;
}

function variantValues({ product_id, sku, size, color, active }) {
  const values = { product_id, sku, size, color };
  if (active !== undefined) values.active = active;
  return values;
}

function writeError(error, req, res, next) {
  if (error.name === 'SequelizeUniqueConstraintError' && Object.hasOwn(error.fields ?? {}, 'sku')) {
    return response.badRequest(res, req.__('variants.skuTaken'));
  }
  if (error.name === 'SequelizeForeignKeyConstraintError' && error.table === 'product_variants') {
    return response.badRequest(res, req.__('variants.productNotFound'));
  }
  if (error.name === 'SequelizeValidationError') return response.badRequest(res, req.__('variants.invalidBody'));
  return next(error);
}

async function list(req, res, next) {
  try {
    const variants = await ProductVariant.findAll({ order: [['id', 'ASC']] });
    return response.success(res, req.__('variants.list'), variants);
  } catch (error) {
    return next(error);
  }
}

async function find(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('variants.invalidId'));

  try {
    const variant = await ProductVariant.findByPk(id, { include: ['product', 'inventory'] });
    if (!variant) return response.notFound(res, req.__('variants.notFound'));
    return response.success(res, req.__('variants.found'), variant);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  const errorKey = validateBody(req.body);
  if (errorKey) return response.badRequest(res, req.__(errorKey));

  try {
    if (!(await Product.findByPk(req.body.product_id, { attributes: ['id'] }))) {
      return response.badRequest(res, req.__('variants.productNotFound'));
    }
    const { variant } = await ProductVariant.createWithInventory(variantValues(req.body));
    return response.created(res, req.__('variants.created'), variant);
  } catch (error) {
    return writeError(error, req, res, next);
  }
}

async function update(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('variants.invalidId'));

  try {
    const result = await sequelize.transaction(async transaction => {
      const variant = await ProductVariant.findByPk(id, { transaction, lock: true });
      if (!variant) return null;

      const errorKey = validateBody(req.body);
      if (errorKey) return { errorKey };
      if (!(await Product.findByPk(req.body.product_id, { attributes: ['id'], transaction }))) {
        return { errorKey: 'variants.productNotFound' };
      }

      await variant.update(variantValues(req.body), { transaction });
      return { variant };
    });

    if (!result) return response.notFound(res, req.__('variants.notFound'));
    if (result.errorKey) return response.badRequest(res, req.__(result.errorKey));
    return response.success(res, req.__('variants.updated'), result.variant);
  } catch (error) {
    return writeError(error, req, res, next);
  }
}

async function destroy(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('variants.invalidId'));

  try {
    const outcome = await sequelize.transaction(async transaction => {
      const variant = await ProductVariant.findByPk(id, { transaction, lock: true });
      if (!variant) return 'notFound';

      const inventory = await Inventory.findOne({ where: { variant_id: variant.id }, transaction, lock: true });
      if (inventory && (inventory.stock > 0 || inventory.reserved > 0)) return 'inUse';
      // El esquema SQL restringe el borrado mientras exista un inventario asociado.
      if (inventory) await inventory.destroy({ transaction });
      await variant.destroy({ transaction });
      return 'deleted';
    });

    if (outcome === 'notFound') return response.notFound(res, req.__('variants.notFound'));
    if (outcome === 'inUse') return response.badRequest(res, req.__('variants.inUse'));
    return response.success(res, req.__('variants.deleted'), null);
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, find, create, update, destroy };
