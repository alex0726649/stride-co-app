const { randomUUID } = require('node:crypto');
const { api, login, cleanup } = require('./helpers');
const { orders } = require('../../locales/es.json');

describe('E2E Mongo - Órdenes', () => {
  let token;
  let customer;
  let product;
  const resources = [
    { path: '/api/orders', ids: [] },
    { path: '/api/customers', ids: [] },
    { path: '/api/products', ids: [] },
  ];

  function request(method, path = '/api/orders') {
    return api()[method](path).auth(token, { type: 'bearer' }).set('Accept-Language', 'es');
  }

  async function create(path, body, idKey = '_id') {
    const res = await request('post', path).send(body);
    if (res.status >= 200 && res.status < 300 && res.body.data?.[idKey]) {
      resources.find(resource => resource.path === path).ids.push(res.body.data[idKey]);
    }
    return res;
  }

  beforeAll(async () => {
    token = await login('admin');
    const me = await request('get', '/api/auth/me').expect(200);
    const userId = me.body.id;
    expect(userId).toBeGreaterThan(0);
    const email = `e2e-order-${randomUUID()}@example.test`;
    const customerRes = await create('/api/customers', { userId, email });
    expect(customerRes.status).toBe(201);
    customer = customerRes.body.data;
    expect(customer._id).toMatch(/^[a-f0-9]{24}$/i);

    const productRes = await create('/api/products', {
      name: `Producto temporal ${randomUUID()}`,
      description: 'Producto temporal para E2E de órdenes',
      brand: 'Stride E2E',
      price: 120,
    }, 'id');
    expect(productRes.status).toBe(201);
    product = productRes.body.data;
    expect(product.id).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await cleanup(token, resources);
  });

  it('completa el ciclo de una orden y devuelve los datos del cliente vinculado', async () => {
    const items = [{ productId: product.id, quantity: 2 }];
    const created = await create('/api/orders', {
      customerId: customer._id, paymentMethod: 'efectivo', items,
    });
    expect(created.status).toBe(201);
    const id = created.body.data._id;
    expect(id).toMatch(/^[a-f0-9]{24}$/i);
    const path = '/api/orders/' + id;

    const detail = await request('get', path).expect(200);
    expect(detail.body.data).toMatchObject({
      _id: id,
      customerId: { _id: customer._id, email: customer.email, userId: customer.userId },
      status: 'Pendiente de pago',
      items: [{ ...items[0], unitPrice: 120 }],
      totals: { total: 240 },
    });
    const list = await request('get').expect(200);
    expect(list.body.data).toContainEqual(expect.objectContaining({ _id: id }));

    await request('put', path).send({ status: 'Pagado' }).expect(200);
    const updated = await request('get', path).expect(200);
    expect(updated.body.data).toMatchObject({ _id: id, status: 'Pagado' });

    await request('delete', path).expect(200).expect({ message: orders.deleted, data: { id } });
    await request('get', path).expect(404).expect({ message: orders.notFound, data: null });
  });

  it('rechaza una orden sin artículos', async () => {
    const res = await create('/api/orders', {
      customerId: customer._id, paymentMethod: 'efectivo', items: [],
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: orders.invalidItems, data: null });
  });

  it('rechaza un identificador mal formado', async () => {
    await request('get', '/api/orders/id-invalido').expect(400)
      .expect({ message: orders.invalidId, data: null });
  });
});
