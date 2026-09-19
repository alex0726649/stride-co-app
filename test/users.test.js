const request = require('supertest');
const app = require('../app');
const valid = { first_name: 'Eva', last_name: 'Ejemplo', email: 'eva@example.com', role_id: 1 };
const original = { id: 1, first_name: 'Ana', last_name: 'Ejemplo', email: 'ana@example.com', role_id: 1 };

function expectError(res, status) {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.body).toEqual({ message: expect.any(String), data: null });
  expect(res.body.message.length).toBeGreaterThan(0);
}

describe('/api/users', () => {
  it('lista usuarios públicos y consulta cada ID', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Lista de usuarios', data: [original, {
      id: 2, first_name: 'Luis', last_name: 'Ejemplo', email: 'luis@example.com', role_id: 1,
    }] });
    for (const user of res.body.data) {
      const found = await request(app).get(`/api/users/${user.id}`);
      expect(found.status).toBe(200);
      expect(found.body).toEqual({ message: 'Usuario encontrado', data: user });
    }
  });

  it.each(['get', 'put', 'delete'])('%s rechaza IDs inexistentes antes de validar campos', async method => {
    for (const id of ['999', 'no-existe', '0', '-1', '1.5', '1abc']) {
      const res = await request(app)[method](`/api/users/${id}`).send({});
      expectError(res, 404);
      expect(res.body.message).toBe('Usuario no encontrado');
    }
  });

  it('simula escrituras sin modificar fixtures ni reflejar campos privados o IDs enviados', async () => {
    const before = await request(app).get('/api/users');
    const body = { ...valid, id: 99, password: 'privado', hash: 'privado', salt: 'privado', extra: true };
    const created = await request(app).post('/api/users').send(body);
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ message: 'Creación de usuario simulada', data: { id: 3, ...valid } });
    expectError(await request(app).get('/api/users/3'), 404);
    const updated = await request(app).put('/api/users/1').send(body);
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ message: 'Actualización de usuario simulada', data: { id: 1, ...valid } });
    const deleted = await request(app).delete('/api/users/1');
    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ message: 'Eliminación de usuario simulada', data: null });
    expect((await request(app).get('/api/users/1')).body.data).toEqual(original);
    expect((await request(app).get('/api/users')).body).toEqual(before.body);
  });

  describe.each(['post', 'put'])('validaciones de %s', method => {
    const url = method === 'post' ? '/api/users' : '/api/users/1';
    it.each(['first_name', 'last_name', 'email', 'role_id'])('requiere %s', async field => {
      const body = { ...valid };
      delete body[field];
      expectError(await request(app)[method](url).send(body), 400);
    });
    it.each(['first_name', 'last_name', 'email'])('valida texto no vacío en %s', async field => {
      for (const value of ['', '   ', null, 123, {}, []]) {
        expectError(await request(app)[method](url).send({ ...valid, [field]: value }), 400);
      }
    });
    it.each([0, -1, 1.5, '1', null, true, {}, [], 9007199254740992])('rechaza role_id inválido: %j', async value => {
      expectError(await request(app)[method](url).send({ ...valid, role_id: value }), 400);
    });
    it('rechaza cuerpo ausente, arreglo, primitivo y JSON malformado', async () => {
      expectError(await request(app)[method](url), 400);
      for (const body of ['[]', 'null', '"texto"', '{']) {
        expectError(await request(app)[method](url).set('Content-Type', 'application/json').send(body), 400);
      }
    });
  });
});
