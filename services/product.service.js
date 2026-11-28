const { Op } = require('sequelize');
const { Product } = require('../models/relationals');
const serviceError = require('./service-error');

const MAX_INT = 2147483647;
const MAX_PRICE = 99999999.99;
const PAGE_SIZE = 12;
const EDITABLE_FIELDS = ['category_id', 'name', 'description', 'brand', 'price', 'active'];

function validId(id) {
  return /^[1-9]\d*$/.test(id) && Number(id) <= MAX_INT;
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150 ||
      typeof body.description !== 'string' || !body.description.trim() ||
      typeof body.brand !== 'string' || !body.brand.trim() || body.brand.length > 100 ||
      (body.active !== undefined && typeof body.active !== 'boolean')) {
    throw serviceError(400, 'products.invalidBody');
  }
  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0 || body.price > MAX_PRICE) {
    throw serviceError(400, 'products.invalidPrice');
  }
}

function pickEditable(body) {
  return Object.fromEntries(EDITABLE_FIELDS.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
}

async function listAll({ includeVariants = true } = {}) {
  return includeVariants ? Product.findAll({ include: 'variants' }) : Product.findAll();
}

async function findById(id, { includeVariants = true } = {}) {
  if (!validId(id)) throw serviceError(400, 'products.invalidId');
  const product = includeVariants ? await Product.findByPk(id, { include: 'variants' }) : await Product.findByPk(id);
  if (!product) throw serviceError(404, 'products.notFound');
  return product;
}

async function create(body) {
  validate(body);
  try {
    return await Product.create(pickEditable(body));
  } catch (error) {
    if (error.name === 'SequelizeValidationError') throw serviceError(400, 'products.invalidBody');
    throw error;
  }
}

async function update(id, body) {
  const product = await findById(id, { includeVariants: false });
  validate(body);
  try {
    await product.update(pickEditable(body));
    return product;
  } catch (error) {
    if (error.name === 'SequelizeValidationError') throw serviceError(400, 'products.invalidBody');
    throw error;
  }
}

async function deactivate(id) {
  const product = await findById(id, { includeVariants: false });
  await product.update({ active: false });
  return product;
}

// La API conserva su borrado físico; el panel usará deactivate.
async function destroy(id) {
  const product = await findById(id);
  if (Array.isArray(product.variants) && product.variants.length) throw serviceError(400, 'products.inUse');
  await product.destroy();
  return null;
}

async function listActive({ q, category, page } = {}) {
  const where = { active: true };
  if (typeof q === 'string' && q.trim()) {
    // Escapar comodines para que la búsqueda represente el texto capturado.
    const term = `%${q.trim().replace(/[\\%_]/g, '\\$&')}%`;
    where[Op.or] = [{ name: { [Op.iLike]: term } }, { brand: { [Op.iLike]: term } }];
  }
  if (typeof category === 'string' && category.trim()) where.category_id = category.trim();
  const total = await Product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = typeof page === 'number' || typeof page === 'string' ? Number(page) : NaN;
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const products = await Product.findAll({ where, order: [['id', 'ASC']], limit: PAGE_SIZE, offset: (currentPage - 1) * PAGE_SIZE });
  return { products, page: currentPage, totalPages, total };
}

async function findActiveById(id) {
  if (!validId(id)) throw serviceError(404, 'products.notFound');
  const product = await Product.findByPk(id, {
    include: [{ association: 'variants', where: { active: true }, required: false, include: ['inventory'] }],
  });
  if (!product || !product.active) throw serviceError(404, 'products.notFound');
  const data = typeof product.toJSON === 'function' ? product.toJSON() : product;
  return { ...data, variants: (data.variants || []).filter(variant => variant.active).map(variant => ({
    ...variant, available: variant.inventory ? variant.inventory.stock - variant.inventory.reserved : 0,
  })) };
}

async function listCategories() {
  const rows = await Product.findAll({ attributes: ['category_id'], where: { active: true }, group: ['category_id'], order: [['category_id', 'ASC']] });
  return rows.map(row => row.category_id);
}

module.exports = { listAll, findById, create, update, deactivate, destroy, listActive, findActiveById, listCategories };
