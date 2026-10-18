const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const app = require('../app');
const { Order } = require('../models/documents');
const id = '507f1f77bcf86cd799439011';
const document = { _id: id, customerId: '507f1f77bcf86cd799439012', status: 'pending' };
function query(result) { return { populate: mock.fn().mockResolvedValue(result) }; }

it('lista y consulta documentos mediante ODM y populate', async () => {
  Order.find.mockReturnValue(query([document]));
  Order.findById.mockReturnValue(query(document));
  const list = await request(app).get('/api/orders').expect(200);
  expect(list.body.data).toEqual([document]);
  const found = await request(app).get('/api/orders/' + id).expect(200);
  expect(found.body.data).toEqual(document);
  expect(Order.findById).toHaveBeenCalledWith(id);
  expect(Order.find.mock.results[0].value.populate).toHaveBeenCalledWith('customerId');
});
it('crea y actualiza documentos mediante ODM', async () => {
  Order.create.mockResolvedValue(document);
  Order.findByIdAndUpdate.mockResolvedValue(document);
  const created = await request(app).post('/api/orders').send(document).expect(201);
  expect(created.body.data).toEqual(document);
  expect(Order.create).toHaveBeenCalledWith(document);
  await request(app).put('/api/orders/' + id).send(document).expect(200);
  expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(id, document, { new: true });
});
it('elimina mediante ODM', async () => {
  Order.findByIdAndDelete.mockResolvedValue(document);
  const res = await request(app).delete('/api/orders/' + id).expect(200);
  expect(res.body.data).toEqual({ id });
  expect(Order.findByIdAndDelete).toHaveBeenCalledWith(id);
});
it.each(['get', 'put', 'delete'])('documento inexistente devuelve 404: %s', async method => {
  Order.findById.mockReturnValue(query(null));
  Order.findByIdAndUpdate.mockResolvedValue(null);
  Order.findByIdAndDelete.mockResolvedValue(null);
  await request(app)[method]('/api/orders/' + id).send({}).expect(404);
});
it.each(['get', 'post', 'put', 'delete'])('error de ODM pasa al manejador: %s', async method => {
  const error = new Error('dato privado de MongoDB');
  Order.findById.mockImplementation(() => { throw error; });
  Order.create.mockRejectedValue(error);
  Order.findByIdAndUpdate.mockRejectedValue(error);
  Order.findByIdAndDelete.mockRejectedValue(error);
  const res = await request(app)[method]('/api/orders' + (method === 'post' ? '' : '/' + id)).send(document).expect(500);
  expect(res.body).toEqual({ message: 'Error interno del servidor', data: null });
});
