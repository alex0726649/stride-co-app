const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const app = require('../app');
const { Role } = require('../models/relationals');
const values = { name: 'Editor', description: 'Prueba' };
let record;
beforeEach(() => {
  record = { id: 17, ...values, update: mock.fn().mockResolvedValue(), destroy: mock.fn().mockResolvedValue(), setPermissions: mock.fn().mockResolvedValue() };
});
it('lista y consulta los datos devueltos por el modelo', async () => {
  Role.findAll.mockResolvedValue([record]);
  Role.findByPk.mockResolvedValue(record);
  const list = await request(app).get('/api/roles').expect(200);
  expect(list.body.data).toEqual([{ id: 17, ...values }]);
  const found = await request(app).get('/api/roles/17').expect(200);
  expect(found.body.data.id).toBe(17);
});
it('crea, actualiza y elimina mediante el modelo', async () => {
  Role.create.mockResolvedValue(record);
  Role.findByPk.mockResolvedValue(record);
  const res = await request(app).post('/api/roles').send(values).expect(201);
  expect(res.body.data.id).toBe(17);
  expect(Role.create).toHaveBeenCalledWith(values);
  await request(app).put('/api/roles/17').send(values).expect(200);
  expect(record.update).toHaveBeenCalledWith(values);
  await request(app).delete('/api/roles/17').expect(200);
  expect(record.destroy).toHaveBeenCalledTimes(1);
});
it.each(['get', 'put', 'delete'])('responde 404 al no existir el registro: %s', async method => {
  const res = await request(app)[method]('/api/roles/999').send(values).expect(404);
  expect(res.body).toEqual({ message: 'Rol no encontrado', data: null });
});
it.each([{}, [], { name: 1, key: 1 }, { name: ' ', key: ' ', description: ' ' }])('rechaza entradas inválidas %p sin escribir', async body => {
  Role.findByPk.mockResolvedValue(record);
  await request(app).post('/api/roles').send(body).expect(400);
  await request(app).put('/api/roles/17').send(body).expect(400);
  expect(Role.create).not.toHaveBeenCalled();
  expect(record.update).not.toHaveBeenCalled();
});

it('asigna permisos y permite vaciarlos al actualizar', async () => {
  Role.create.mockResolvedValue(record);
  Role.findByPk.mockResolvedValue(record);
  await request(app).post('/api/roles').send({ ...values, permission_ids: [1, 2] }).expect(201);
  expect(record.setPermissions).toHaveBeenCalledWith([1, 2]);
  await request(app).put('/api/roles/17').send({ ...values, permission_ids: [] }).expect(200);
  expect(record.setPermissions).toHaveBeenLastCalledWith([]);
});
it('propaga errores SQL al manejador sin revelar detalles', async () => {
  Role.findAll.mockRejectedValue(new Error('dato privado'));
  const res = await request(app).get('/api/roles').expect(500);
  expect(res.body.message).toBe('Error interno del servidor');
});
