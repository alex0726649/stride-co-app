const { Customer } = require('../models/documents');

// list
async function list(req, res, next) {
  try {
    const customers = await Customer.find();
    res.json({ message: 'GET customers', data: customers });
  } catch (error) {
    next(error);
  }
}

// find
async function find(req, res, next) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado', data: null });
    res.json({ message: 'Cliente encontrado', data: customer });
  } catch (error) {
    next(error);
  }
}

// create
async function create(req, res, next) {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ message: 'Cliente creado', data: customer });
  } catch (error) {
    next(error);
  }
}

// update
async function update(req, res, next) {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado', data: null });
    res.json({ message: 'Cliente actualizado', data: customer });
  } catch (error) {
    next(error);
  }
}

// destroy
async function destroy(req, res, next) {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado', data: null });
    res.json({ message: 'Cliente eliminado', data: { id: customer._id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, find, create, update, destroy };
