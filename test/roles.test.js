const request = require('supertest');
const app = require('../app');
const valid = { name: 'Supervisor', description: 'Rol de prueba' };
const original = { id: 1, name: 'Vendedor', description: 'Consulta y administra sus pedidos asignados' };

function expectError(res, status) {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.body).toEqual({ message: expect.any(String), data: null });
  expect(res.body.message.length).toBeGreaterThan(0);
}

describe('/api/roles', () => {
  it('lista los roles y consulta cada ID', async () => {
    const res = await request(app).get('/api/roles');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lista de roles');
    expect(res.body.data).toHaveLength(4);
    expect(res.body.data[0]).toEqual(original);
    for (const role of res.body.data) {
      const found = await request(app).get(`/api/roles/${role.id}`);
      expect(found.status).toBe(200);
      expect(found.body).toEqual({ message: 'Rol encontrado', data: role });
    }
  });

  it.each(['get', 'put', 'delete'])('%s rechaza IDs inexistentes antes de validar campos', async method => {
    for (const id of ['999', 'no-existe', '0', '-1', '1.5', '1abc']) {
      const res = await request(app)[method](`/api/roles/${id}`).send({});
      expectError(res, 404);
      expect(res.body.message).toBe('Rol no encontrado');
    }
  });

  it('simula escrituras sin modificar fixtures ni reflejar IDs enviados', async () => {
    const before = await request(app).get('/api/roles');
    const body = { ...valid, id: 99, extra: true };
    const created = await request(app).post('/api/roles').send(body);
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ message: 'Creacion de rol simulada', data: { id: 5, ...valid } });
    expectError(await request(app).get('/api/roles/5'), 404);
    const updated = await request(app).put('/api/roles/1').send(body);
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ message: 'Actualizacion de rol simulada', data: { id: 1, ...valid } });
    const deleted = await request(app).delete('/api/roles/1');
    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ message: 'Eliminacion de rol simulada', data: null });
    expect((await request(app).get('/api/roles/1')).body.data).toEqual(original);
    expect((await request(app).get('/api/roles')).body).toEqual(before.body);
  });

  describe.each(['post', 'put'])('validaciones de %s', method => {
    const url = method === 'post' ? '/api/roles' : '/api/roles/1';
    it('requiere name', async () => {
      const body = { ...valid };
      delete body.name;
      expectError(await request(app)[method](url).send(body), 400);
    });
    it.each(['', '   ', null, 123, {}, []])('rechaza name invalido: %j', async value => {
      expectError(await request(app)[method](url).send({ ...valid, [`name`]: value }), 400);
    });
    it.each([123, null, {}, []])('rechaza description que no es texto: %j', async value => {
      expectError(await request(app)[method](url).send({ ...valid, description: value }), 400);
    });
    it('acepta description ausente y la devuelve vacia', async () => {
      const res = await request(app)[method](url).send({ name: 'Auditor' });
      expect(res.status).toBe(method === 'post' ? 201 : 200);
      expect(res.body.data).toEqual({ id: method === 'post' ? 5 : 1, name: 'Auditor', description: '' });
    });
    it('rechaza cuerpo ausente, arreglo, primitivo y JSON malformado', async () => {
      expectError(await request(app)[method](url), 400);
      for (const body of ['[]', 'null', '"texto"', '{']) {
        expectError(await request(app)[method](url).set('Content-Type', 'application/json').send(body), 400);
      }
    });
  });
});