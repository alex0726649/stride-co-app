const request = require('supertest');
const app = require('../app');
const valid = { key: 'reports.read', description: 'Consultar reportes de venta' };
const original = { id: 1, key: 'products.manage', description: 'Publicar, editar y despublicar productos del catalogo' };

function expectError(res, status) {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.body).toEqual({ message: expect.any(String), data: null });
  expect(res.body.message.length).toBeGreaterThan(0);
}

describe('/api/permissions', () => {
  it('lista los permisos y consulta cada ID', async () => {
    const res = await request(app).get('/api/permissions');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lista de permisos');
    expect(res.body.data).toHaveLength(5);
    expect(res.body.data[0]).toEqual(original);
    for (const permission of res.body.data) {
      const found = await request(app).get(`/api/permissions/${permission.id}`);
      expect(found.status).toBe(200);
      expect(found.body).toEqual({ message: 'Permiso encontrado', data: permission });
    }
  });

  it('expone claves unicas en los datos fijos', async () => {
    const res = await request(app).get('/api/permissions');
    const keys = res.body.data.map(permission => permission.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(['get', 'put', 'delete'])('%s rechaza IDs inexistentes antes de validar campos', async method => {
    for (const id of ['999', 'no-existe', '0', '-1', '1.5', '1abc']) {
      const res = await request(app)[method](`/api/permissions/${id}`).send({});
      expectError(res, 404);
      expect(res.body.message).toBe('Permiso no encontrado');
    }
  });

  it('simula escrituras sin modificar fixtures ni reflejar IDs enviados', async () => {
    const before = await request(app).get('/api/permissions');
    const body = { ...valid, id: 99, extra: true };
    const created = await request(app).post('/api/permissions').send(body);
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ message: 'Creacion de permiso simulada', data: { id: 6, ...valid } });
    expectError(await request(app).get('/api/permissions/6'), 404);
    const updated = await request(app).put('/api/permissions/1').send(body);
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ message: 'Actualizacion de permiso simulada', data: { id: 1, ...valid } });
    const deleted = await request(app).delete('/api/permissions/1');
    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ message: 'Eliminacion de permiso simulada', data: null });
    expect((await request(app).get('/api/permissions/1')).body.data).toEqual(original);
    expect((await request(app).get('/api/permissions')).body).toEqual(before.body);
  });

  it('normaliza espacios alrededor de key y description', async () => {
    const res = await request(app).post('/api/permissions').send({ key: '  reports.read  ', description: '  Consultar reportes de venta  ' });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ id: 6, ...valid });
  });

  describe('unicidad de key', () => {
    it.each(['products.manage', 'orders.read.all', '  inventory.manage  '])('rechaza al crear con un key existente: %j', async key => {
      const res = await request(app).post('/api/permissions').send({ ...valid, key });
      expectError(res, 400);
      expect(res.body.message).toBe('El key ya esta registrado y debe ser unico');
    });

    it('rechaza al actualizar con el key de otro permiso', async () => {
      const res = await request(app).put('/api/permissions/1').send({ ...valid, key: 'orders.read.all' });
      expectError(res, 400);
      expect(res.body.message).toBe('El key ya esta registrado y debe ser unico');
    });

    it('permite que una actualizacion conserve su propio key', async () => {
      const res = await request(app).put('/api/permissions/1').send({ key: original.key, description: 'Descripcion actualizada' });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ id: 1, key: original.key, description: 'Descripcion actualizada' });
    });
  });

  describe.each(['post', 'put'])('validaciones de %s', method => {
    const url = method === 'post' ? '/api/permissions' : '/api/permissions/1';
    it.each(['key', 'description'])('requiere %s', async field => {
      const body = { ...valid };
      delete body[field];
      expectError(await request(app)[method](url).send(body), 400);
    });
    it.each(['key', 'description'])('valida texto no vacio en %s', async field => {
      for (const value of ['', '   ', null, 123, {}, []]) {
        expectError(await request(app)[method](url).send({ ...valid, [field]: value }), 400);
      }
    });
    it('rechaza cuerpo ausente, arreglo, primitivo y JSON malformado', async () => {
      expectError(await request(app)[method](url), 400);
      for (const body of ['[]', 'null', '"texto"', '{']) {
        expectError(await request(app)[method](url).set('Content-Type', 'application/json').send(body), 400);
      }
    });
  });
});