const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { Order } = require('../models/documents');
const { User, Role } = require('../models/relationals');
const id = '507f1f77bcf86cd799439011';
const document = { _id: id, customerId: '507f1f77bcf86cd799439012', status: 'pending' };
function query(result) { return { populate: mock.fn().mockResolvedValue(result) }; }

const accessToken = jwt.sign({ sub: '7' }, process.env.JWT_SECRET, {
  algorithm: 'HS256',
  expiresIn: '15m',
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
});

function authenticated(method, path) {
  return request(app)[method](path).auth(accessToken, { type: 'bearer' });
}

beforeEach(() => {
  User.findByPk.mockResolvedValue({ id: 7, active: true, role_id: 1 });
  Role.findByPk.mockResolvedValue({
    id: 1,
    name: 'admin',
    permissions: [
      { key: 'orders:create:any' },
      { key: 'orders:create:own' },
      { key: 'orders:read:any' },
      { key: 'orders:read:own' },
      { key: 'orders:update:any' },
      { key: 'orders:update:own' },
      { key: 'orders:delete:any' },
    ],
  });
});

it('lista y consulta documentos mediante ODM y populate', async () => {
  Order.find.mockReturnValue(query([document]));
  Order.findById.mockReturnValue(query(document));
  const list = await authenticated('get', '/api/orders').expect(200);
  expect(list.body.data).toEqual([document]);
  const found = await authenticated('get', '/api/orders/' + id).expect(200);
  expect(found.body.data).toEqual(document);
  expect(Order.findById).toHaveBeenCalledWith(id);
  expect(Order.find.mock.results[0].value.populate).toHaveBeenCalledWith('customerId');
});
it('crea y actualiza documentos mediante ODM', async () => {
  Order.create.mockResolvedValue(document);
  Order.findByIdAndUpdate.mockResolvedValue(document);
  const created = await authenticated('post', '/api/orders').send(document).expect(201);
  expect(created.body.data).toEqual(document);
  expect(Order.create).toHaveBeenCalledWith(document);
  await authenticated('put', '/api/orders/' + id).send(document).expect(200);
  expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(id, document, { new: true });
});
it('elimina mediante ODM', async () => {
  Order.findByIdAndDelete.mockResolvedValue(document);
  const res = await authenticated('delete', '/api/orders/' + id).expect(200);
  expect(res.body.data).toEqual({ id });
  expect(Order.findByIdAndDelete).toHaveBeenCalledWith(id);
});
it.each(['get', 'put', 'delete'])('documento inexistente devuelve 404: %s', async method => {
  Order.findById.mockReturnValue(query(null));
  Order.findByIdAndUpdate.mockResolvedValue(null);
  Order.findByIdAndDelete.mockResolvedValue(null);
  await authenticated(method, '/api/orders/' + id).send({}).expect(404);
});
it.each(['get', 'post', 'put', 'delete'])('error de ODM pasa al manejador: %s', async method => {
  const error = new Error('dato privado de MongoDB');
  Order.findById.mockImplementation(() => { throw error; });
  Order.create.mockRejectedValue(error);
  Order.findByIdAndUpdate.mockRejectedValue(error);
  Order.findByIdAndDelete.mockRejectedValue(error);
  const res = await authenticated(method, '/api/orders' + (method === 'post' ? '' : '/' + id))
    .send(document).expect(500);
  expect(res.body).toEqual({ message: 'Error interno del servidor', data: null });
});
