const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const app = require('../app');
const { Permission } = require('../models/relationals');
const values = { key: 'test.read', description: 'Prueba' };
let record;
beforeEach(() => {
  record = { id: 17, ...values, update: mock.fn().mockResolvedValue(), destroy: mock.fn().mockResolvedValue(), setPermissions: mock.fn().mockResolvedValue() };
});
it('lista y consulta los datos devueltos por el modelo', async () => {
  Permission.findAll.mockResolvedValue([record]);
  Permission.findByPk.mockResolvedValue(record);
  const list = await request(app).get('/api/permissions').expect(200);
  expect(list.body.data).toEqual([{ id: 17, ...values }]);
  const found = await request(app).get('/api/permissions/17').expect(200);
  expect(found.body.data.id).toBe(17);
});
it('crea, actualiza y elimina mediante el modelo', async () => {
  Permission.create.mockResolvedValue(record);
  Permission.findByPk.mockResolvedValue(record);
  const res = await request(app).post('/api/permissions').send(values).expect(201);
  expect(res.body.data.id).toBe(17);
  expect(Permission.create).toHaveBeenCalledWith(values);
  await request(app).put('/api/permissions/17').send(values).expect(200);
  expect(record.update).toHaveBeenCalledWith(values);
  await request(app).delete('/api/permissions/17').expect(200);
  expect(record.destroy).toHaveBeenCalledTimes(1);
});
it.each(['get', 'put', 'delete'])('responde 404 al no existir el registro: %s', async method => {
  const res = await request(app)[method]('/api/permissions/999').send(values).expect(404);
  expect(res.body).toEqual({ message: 'Permiso no encontrado', data: null });
});
it.each([{}, [], { name: 1, key: 1 }, { name: ' ', key: ' ', description: ' ' }])('rechaza entradas inválidas %p sin escribir', async body => {
  Permission.findByPk.mockResolvedValue(record);
  await request(app).post('/api/permissions').send(body).expect(400);
  await request(app).put('/api/permissions/17').send(body).expect(400);
  expect(Permission.create).not.toHaveBeenCalled();
  expect(record.update).not.toHaveBeenCalled();
});
