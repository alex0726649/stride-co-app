const { randomUUID } = require('node:crypto');
const { api, login, cleanup } = require('./helpers');
const { customers } = require('../../locales/es.json');

describe('E2E Mongo - Clientes', () => {
  let token;
  let userId;
  const customerIds = [];

  function request(method, path = '/api/customers') {
    return api()[method](path)
      .set('Accept-Language', 'es')
      .set('Authorization', `Bearer ${token}`);
  }

  async function createCustomer(body) {
    const res = await request('post').send(body);
    const id = res.body?.data?._id;
    if (res.status >= 200 && res.status < 300 && id) {
      customerIds.push(id);
    }
    return res;
  }

  beforeAll(async () => {
    token = await login('admin');
    const me = await request('get', '/api/auth/me');
    expect(me.status).toBe(200);
    userId = me.body.id;
    expect(userId).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await cleanup(token, [{ path: '/api/customers', ids: [...customerIds].reverse() }]);
  });

  it('completa el ciclo de vida: crea, consulta por id, lista, actualiza, verifica persistencia, borra y confirma 404', async () => {
    const email = `e2e-customer-${randomUUID()}@example.test`;
    const initialPhone = '6141234567';

    // 1. Crear cliente (POST /api/customers) -> 201
    const createRes = await createCustomer({ userId, email, phone: initialPhone });
    expect(createRes.status).toBe(201);
    expect(createRes.body.message).toBe(customers.created);

    const customerId = createRes.body?.data?._id;
    expect(customerId).toBeDefined();
    expect(customerId).toMatch(/^[a-f0-9]{24}$/i);
    expect(createRes.body.data.email).toBe(email);
    expect(createRes.body.data.userId).toBe(userId);
    expect(createRes.body.data.phone).toBe(initialPhone);

    const path = `/api/customers/${customerId}`;

    // 2. Consultar por id (GET /api/customers/:id) -> 200
    const detailRes = await request('get', path);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.message).toBe(customers.found);
    expect(detailRes.body.data).toMatchObject({
      _id: customerId,
      userId,
      email,
      phone: initialPhone,
    });

    // 3. Listar clientes (GET /api/customers) -> 200 y presencia en la lista
    const listRes = await request('get');
    expect(listRes.status).toBe(200);
    expect(listRes.body.message).toBe(customers.list);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data).toContainEqual(
      expect.objectContaining({ _id: customerId, email })
    );

    // 4. Actualizar cliente (PUT /api/customers/:id) -> 200
    const updatedPhone = '6149876543';
    const updateRes = await request('put', path).send({ phone: updatedPhone });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe(customers.updated);
    expect(updateRes.body.data).toMatchObject({
      _id: customerId,
      email,
      phone: updatedPhone,
    });

    // 5. Verificar persistencia tras actualización (GET /api/customers/:id) -> 200
    const verifyRes = await request('get', path);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data).toMatchObject({
      _id: customerId,
      email,
      phone: updatedPhone,
    });

    // 6. Borrar cliente (DELETE /api/customers/:id) -> 200
    const deleteRes = await request('delete', path);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe(customers.deleted);
    expect(deleteRes.body.data).toBeNull();

    // 7. Consulta tras borrar devuelve 404
    const notFoundRes = await request('get', path);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.message).toBe(customers.notFound);
    expect(notFoundRes.body.data).toBeNull();
  });

  it('rechaza datos inválidos (correo inválido) devolviendo 400 y mensaje traducido', async () => {
    const badRes = await createCustomer({ userId, email: 'correo-invalido' });
    expect(badRes.status).toBe(400);
    expect(badRes.body.message).toBe(customers.invalidEmail);
    expect(badRes.body.data).toBeNull();
  });

  it('rechaza un identificador mal formado devolviendo 400 y mensaje traducido', async () => {
    const res = await request('get', '/api/customers/id-invalido');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(customers.invalidId);
    expect(res.body.data).toBeNull();
  });
});
