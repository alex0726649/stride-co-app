const response = require('../utils/response');
const { isValidAddress, publicAddress } = require('../utils/address');
const MOCK_DATE = '2026-09-01T12:00:00.000Z';
const MOCK_UPDATE_DATE = '2026-09-02T12:00:00.000Z';

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
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE
  },
];

function findCustomerById(id) {
  return customers.find((c) => c._id === id);
}

function validateCustomer(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'El cuerpo debe ser un objeto JSON';
  const { userId, phone, email } = body;
  if (!Number.isSafeInteger(userId) || userId <= 0) return 'userId es obligatorio y debe ser un entero positivo';
  if (typeof phone !== 'string' || phone.trim() === '') return 'phone es obligatorio y debe ser un texto no vacío';
  if (typeof email !== 'string' || email.trim() === '') return 'email es obligatorio y debe ser un texto no vacío';
  if (body.addresses !== undefined && (!Array.isArray(body.addresses)
    || !body.addresses.every(address => isValidAddress(address) && ['shipping', 'billing'].includes(address.type)))) {
    return 'addresses debe ser un arreglo de direcciones completas con type shipping o billing';
  }
  return null;
}

function publicAddresses(addresses) {
  return addresses.map(address => ({ type: address.type, ...publicAddress(address) }));
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
    addresses: addresses === undefined ? [] : publicAddresses(addresses),
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE
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
    addresses: addresses === undefined ? customer.addresses : publicAddresses(addresses),
    updatedAt: MOCK_UPDATE_DATE
  };
  return response.success(res, 'Actualización de cliente simulada', updatedCustomer);
}

function destroy(req, res) {
  const customer = findCustomerById(req.params.id);
  if (!customer) return response.notFound(res, 'Cliente no encontrado');
  return response.success(res, 'Eliminación de cliente simulada', null);
}

module.exports = { list, find, create, update, destroy };
