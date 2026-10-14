const { Order } = require('../models/documents');

// list
async function list(req, res, next) {
  try {
    const orders = await Order.find().populate('customerId');
    res.json({ message: 'GET orders', data: orders });
  } catch (error) {
    next(error);
  }
}

// find
async function find(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate('customerId');
    if (!order) return res.status(404).json({ message: 'Orden no encontrada', data: null });
    res.json({ message: 'GET order by id', data: order });
  } catch (error) {
    next(error);
  }
}

// create
async function create(req, res, next) {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ message: 'Order created', data: order });
  } catch (error) {
    next(error);
  }
}

// update
async function update(req, res, next) {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Orden no encontrada', data: null });
    res.json({ message: 'Order updated', data: order });
  } catch (error) {
    next(error);
  }
}

// destroy
async function destroy(req, res, next) {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada', data: null });
    res.json({ message: 'Order deleted', data: { id: order._id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, find, create, update, destroy };
