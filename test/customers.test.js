const request = require('supertest');
const app = require('../app');
const { Customer } = require('../models/documents');
const id = '507f1f77bcf86cd799439011';
const document = { _id: id, firstName: 'Ana', email: 'ana@example.com' };

it('lista y consulta documentos mediante ODM', async () => {
  Customer.find.mockResolvedValue([document]);
  Customer.findById.mockResolvedValue(document);
  const list = await request(app).get('/api/customers').expect(200);
  expect(list.body.data).toEqual([document]);
  const found = await request(app).get('/api/customers/' + id).expect(200);
  expect(found.body.data).toEqual(document);
  expect(Customer.findById).toHaveBeenCalledWith(id);

});
it('crea y actualiza documentos mediante ODM', async () => {
  Customer.create.mockResolvedValue(document);
  Customer.findByIdAndUpdate.mockResolvedValue(document);
  const created = await request(app).post('/api/customers').send(document).expect(201);
  expect(created.body.data).toEqual(document);
  expect(Customer.create).toHaveBeenCalledWith(document);
  await request(app).put('/api/customers/' + id).send(document).expect(200);
  expect(Customer.findByIdAndUpdate).toHaveBeenCalledWith(id, document, { new: true });
});
it('elimina mediante ODM', async () => {
  Customer.findByIdAndDelete.mockResolvedValue(document);
  const res = await request(app).delete('/api/customers/' + id).expect(200);
  expect(res.body.data).toEqual({ id });
  expect(Customer.findByIdAndDelete).toHaveBeenCalledWith(id);
});
it.each(['get', 'put', 'delete'])('documento inexistente devuelve 404: %s', async method => {
  Customer.findById.mockResolvedValue(null);
  Customer.findByIdAndUpdate.mockResolvedValue(null);
  Customer.findByIdAndDelete.mockResolvedValue(null);
  await request(app)[method]('/api/customers/' + id).send({}).expect(404);
});
it.each(['get', 'post', 'put', 'delete'])('error de ODM pasa al manejador: %s', async method => {
  const error = new Error('dato privado de MongoDB');
  Customer.findById.mockImplementation(() => { throw error; });
  Customer.create.mockRejectedValue(error);
  Customer.findByIdAndUpdate.mockRejectedValue(error);
  Customer.findByIdAndDelete.mockRejectedValue(error);
  const res = await request(app)[method]('/api/customers' + (method === 'post' ? '' : '/' + id)).send(document).expect(500);
  expect(res.body).toEqual({ message: 'Error interno del servidor', data: null });
});
