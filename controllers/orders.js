const { isObjectIdOrHexString } = require('mongoose');
const { Customer, Order } = require('../models/documents');
const { Product, Role, User } = require('../models/relationals');
const response = require('../utils/response');
const { PAYMENT_METHODS, ORDER_STATUSES, isPositiveInteger } = require('../utils/order-fields');

function validateId(req, res, next) {
  if (!isObjectIdOrHexString(req.params.id)) {
    return response.badRequest(res, req.__('orders.invalidId'));
  }
  return next();
}

function parseBody(body, partial) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'invalidBody' };
  const data = {};
  if (!partial || Object.hasOwn(body, 'customerId')) {
    if (!isObjectIdOrHexString(body.customerId)) return { error: 'invalidCustomer' };
    data.customerId = body.customerId;
  }
  if (Object.hasOwn(body, 'salesPersonId')) {
    if (!isPositiveInteger(body.salesPersonId) || body.salesPersonId > 2_147_483_647) {
      return { error: 'invalidSalesPerson' };
    }
    data.salesPersonId = body.salesPersonId;
  }
  if (!partial || Object.hasOwn(body, 'paymentMethod')) {
    if (!PAYMENT_METHODS.includes(body.paymentMethod)) return { error: 'invalidPayment' };
    data.paymentMethod = body.paymentMethod;
  }
  if (Object.hasOwn(body, 'status')) {
    if (!ORDER_STATUSES.includes(body.status)) return { error: 'invalidStatus' };
    data.status = body.status;
  }
  if (!partial || Object.hasOwn(body, 'items')) {
    if (!Array.isArray(body.items) || body.items.length === 0) return { error: 'invalidItems' };
    const items = [];
    for (const item of body.items) {
      if (!item || !isPositiveInteger(item.productId) || item.productId > 2_147_483_647
        || !isPositiveInteger(item.quantity)) return { error: 'invalidItems' };
      const { productId, quantity } = item;
      items.push({ productId, quantity });
    }
    data.items = items;
  }
  if (Object.keys(data).length === 0) return { error: 'invalidBody' };
  return { data };
}

function validateBody(partial) {
  return function validateOrderBody(req, res, next) {
    const { data, error } = parseBody(req.body, partial);
    if (error) return response.badRequest(res, req.__(`orders.${error}`));
    req.orderInput = data;
    return next();
  };
}

async function isSalesPerson(id) {
  const user = await User.findByPk(id, {
    attributes: ['id'],
    include: [{ model: Role, as: 'role', attributes: ['name'] }],
  });
  return user?.role?.name === 'sales';
}

async function priceItems(items) {
  const ids = [...new Set(items.map(item => item.productId))];
  const products = await Product.findAll({ where: { id: ids }, attributes: ['id', 'price'] });
  const prices = new Map(products.map(product => [product.id, Math.round(Number(product.price) * 100)]));

  let subtotalCents = 0;
  const priced = [];
  for (const item of items) {
    const cents = prices.get(item.productId);
    if (cents === undefined) return { error: 'invalidProduct' };
    subtotalCents += item.quantity * cents;
    if (!Number.isSafeInteger(subtotalCents)) return { error: 'invalidItems' };
    priced.push({ ...item, unitPrice: cents / 100 });
  }
  const subtotal = subtotalCents / 100;
  return { items: priced, totals: { subtotal, shipping: 0, discount: 0, total: subtotal } };
}

function handleWriteError(error, req, res, next) {
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) {
    return response.badRequest(res, req.__('orders.invalidBody'));
  }
  return next(error);
}

async function list(req, res, next) {
  try {
    const orders = await Order.find().populate('customerId', 'userId phone email addresses');
    return response.success(res, req.__('orders.list'), orders);
  } catch (error) {
    return next(error);
  }
}

async function find(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate('customerId', 'userId phone email addresses');
    if (!order) return response.notFound(res, req.__('orders.notFound'));
    return response.success(res, req.__('orders.found'), order);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = req.orderInput;
    if (!(await Customer.findById(data.customerId))) {
      return response.badRequest(res, req.__('orders.invalidCustomer'));
    }
    if (data.salesPersonId !== undefined && !(await isSalesPerson(data.salesPersonId))) {
      return response.badRequest(res, req.__('orders.invalidSalesPerson'));
    }
    const priced = await priceItems(data.items);
    if (priced.error) return response.badRequest(res, req.__(`orders.${priced.error}`));
    if (req.rbac.scope === 'own') {
      data.status = ORDER_STATUSES[0];
      delete data.salesPersonId;
    }
    const order = await Order.create({ ...data, ...priced });
    return response.created(res, req.__('orders.created'), order);
  } catch (error) {
    return handleWriteError(error, req, res, next);
  }
}

async function update(req, res, next) {
  try {
    const data = req.orderInput;
    if (data.customerId && !(await Customer.findById(data.customerId))) {
      return response.badRequest(res, req.__('orders.invalidCustomer'));
    }
    if (data.salesPersonId !== undefined && !(await isSalesPerson(data.salesPersonId))) {
      return response.badRequest(res, req.__('orders.invalidSalesPerson'));
    }
    if (data.items) {
      const priced = await priceItems(data.items);
      if (priced.error) return response.badRequest(res, req.__(`orders.${priced.error}`));
      Object.assign(data, priced);
    }
    const filter = { _id: req.params.id };
    if (req.rbac.scope === 'own') filter.salesPersonId = req.user.id;
    const order = await Order.findOneAndUpdate(filter, { $set: data }, {
      new: true,
      runValidators: true,
    });
    if (!order) return response.notFound(res, req.__('orders.notFound'));
    return response.success(res, req.__('orders.updated'), order);
  } catch (error) {
    return handleWriteError(error, req, res, next);
  }
}

async function destroy(req, res, next) {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return response.notFound(res, req.__('orders.notFound'));
    return response.success(res, req.__('orders.deleted'), { id: order._id });
  } catch (error) {
    return next(error);
  }
}

module.exports = { validateId, validateBody, list, find, create, update, destroy };
