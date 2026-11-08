const { isObjectIdOrHexString } = require('mongoose');
const { Customer, Order } = require('../models/documents');
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
    if (!isPositiveInteger(body.salesPersonId)) return { error: 'invalidSalesPerson' };
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
    let subtotal = 0;
    for (const item of body.items) {
      if (!item || !isPositiveInteger(item.productId) || !isPositiveInteger(item.quantity)
        || !Number.isFinite(item.unitPrice) || item.unitPrice < 0) return { error: 'invalidItems' };
      const { productId, quantity, unitPrice } = item;
      items.push({ productId, quantity, unitPrice });
      subtotal += quantity * unitPrice;
    }
    if (!Number.isFinite(subtotal)) return { error: 'invalidItems' };
    data.items = items;
    data.totals = { subtotal, shipping: 0, discount: 0, total: subtotal };
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
    const order = await Order.create(data);
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
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: data }, {
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
