const { randomUUID } = require('node:crypto');
const { api, login, cleanup } = require('./helpers');
const { customers } = require('../../locales/es.json');

describe('E2E Mongo - Clientes', () => {
  let token;
  let userId;
  const customerIds = [];

  function request(method, path = '/api/customers') {
    return api()[method](path).auth(token, { type: 'bearer' }).set('Accept-Language', 'es');
  }

  async function create(body) {
    const res = await request('post').send(body);
    if (res.status >= 200 && res.status < 300 && res.body.data?._id) customerIds.push(res.body.data._id);
    return res;
  }

  beforeAll(async () => {
    token = await login('admin');
    const me = await request('get', '/api/auth/me').expect(200);
    userId = me.body.id;
    expect(userId).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await cleanup(token, [{ path: '/api/customers', ids: customerIds }]);
  });

  it('crea, consulta, lista, actualiza y borra un cliente hasta obtener 404', async () => {
    const email = `e2e-customer-${randomUUID()}@example.test`;
    const created = await create({ userId, email, phone: '6141234567' });
    expect(created.status).toBe(201);
    const id = created.body.data._id;
    expect(id).toMatch(/^[a-f0-9]{24}$/i);
    const path = '/api/customers/' + id;

    const detail = await request('get', path).expect(200);
    expect(detail.body.data).toMatchObject({ _id: id, userId, email, phone: '6141234567' });
    const list = await request('get').expect(200);
    expect(list.body.data).toContainEqual(expect.objectContaining({ _id: id, email }));

    const phone = '6149876543';
    await request('put', path).send({ phone }).expect(200);
    const updated = await request('get', path).expect(200);
    expect(updated.body.data).toMatchObject({ _id: id, email, phone });

    await request('delete', path).expect(200);
    await request('get', path).expect(404).expect({ message: customers.notFound, data: null });
  });

  it('rechaza un correo inválido', async () => {
    const res = await create({ userId, email: 'correo-invalido' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: customers.invalidEmail, data: null });
  });

  it('rechaza un identificador mal formado', async () => {
    await request('get', '/api/customers/id-invalido').expect(400)
      .expect({ message: customers.invalidId, data: null });
  });
});
