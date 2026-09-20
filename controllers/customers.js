const response = require('../utils/response');

const customers = [
  {
    _id: 'cliente-1',
    userId: 1,
    phone: '6141234567',
    email: 'cliente@example.com',
    addresses: [
      {
        type: 'shipping',
        street: 'Calle Universidad',
        number: '123',
        city: 'Chihuahua',
        state: 'Chihuahua',
        postalCode: '31000',
        country: 'México'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

function findCustomerById(id) {
  return customers.find((c) => c._id === id);
}

function validateCustomer(body) {
  const { userId, phone, email } = body;
  if (!Number.isSafeInteger(userId) || userId <= 0) return 'userId es obligatorio y debe ser un entero positivo';
  if (typeof phone !== 'string' || phone.trim() === '') return 'phone es obligatorio y debe ser un texto no vacío';
  if (typeof email !== 'string' || email.trim() === '') return 'email es obligatorio y debe ser un texto no vacío';
  return null;
}

function list(req, res) {
  return response.success(res, 'Lista de clientes', customers);
}

function find(req, res) {
  const customer = findCustomerById(req.params.id);
  if (!customer) return response.notFound(res, 'Cliente no encontrado');
  return response.success(res, 'Cliente encontrado', customer);
}

function create(req, res) {
  const error = validateCustomer(req.body);
  if (error) return response.badRequest(res, error);

  const { userId, phone, email, addresses } = req.body;
  const newCustomer = {
    _id: 'cliente-nuevo',
    userId,
    phone,
    email,
    addresses: Array.isArray(addresses) ? addresses : [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return response.created(res, 'Creación de cliente simulada', newCustomer);
}

function update(req, res) {
  const customer = findCustomerById(req.params.id);
  if (!customer) return response.notFound(res, 'Cliente no encontrado');

  const error = validateCustomer(req.body);
  if (error) return response.badRequest(res, error);

  const { userId, phone, email, addresses } = req.body;
  const updatedCustomer = {
    ...customer,
    userId,
    phone,
    email,
    addresses: Array.isArray(addresses) ? addresses : customer.addresses,
    updatedAt: new Date()
  };
  return response.success(res, 'Actualización de cliente simulada', updatedCustomer);
}

function destroy(req, res) {
  const customer = findCustomerById(req.params.id);
  if (!customer) return response.notFound(res, 'Cliente no encontrado');
  return response.success(res, 'Eliminación de cliente simulada', null);
}

module.exports = { list, find, create, update, destroy };
