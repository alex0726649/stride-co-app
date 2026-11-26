const { randomUUID } = require('node:crypto');
const es = require('../../../locales/es.json');
const { sqlFixtures, productBody, variantBody } = require('./fixtures');

describe('E2E SQL - Variants', () => {
  let fixtures;

  beforeAll(async () => {
    fixtures = sqlFixtures();
    await fixtures.authenticate();
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  it('completa el ciclo de vida: 201, detalle con producto e inventario, GET lista, PUT, verificación de persistencia, DELETE y GET 404', async () => {
    // 1. Crea producto temporal para asociar la variante
    const prodName = `Prod Base Variante ${randomUUID()}`;
    const createProdRes = await fixtures.post('/api/products', productBody(prodName));
    expect(createProdRes.status).toBe(201);
    const productId = createProdRes.body?.data?.id;
    expect(productId).toBeGreaterThan(0);

    // 2. POST variante -> 201
    const uniqueSku = `SKU-VAR-${randomUUID()}`;
    const createVarRes = await fixtures.post('/api/variants', variantBody(productId, uniqueSku));
    const variantId = createVarRes.body?.data?.id;

    expect(createVarRes.status).toBe(201);
    expect(createVarRes.body.message).toBe(es.variants.created);
    expect(variantId).toBeGreaterThan(0);

    // 3. GET por id (detalle): comprueba que incluye el producto y el inventario -> 200
    const getVarRes = await fixtures.request('get', `/api/variants/${variantId}`);
    expect(getVarRes.status).toBe(200);
    expect(getVarRes.body.message).toBe(es.variants.found);
    expect(getVarRes.body.data.id).toBe(variantId);
    expect(getVarRes.body.data.sku).toBe(uniqueSku);

    // Comprueba que incluye el producto
    expect(getVarRes.body.data.product).toBeDefined();
    expect(getVarRes.body.data.product.id).toBe(productId);

    // Comprueba que incluye el inventario asociado
    expect(getVarRes.body.data.inventory).toBeDefined();
    expect(getVarRes.body.data.inventory.variant_id).toBe(variantId);
    expect(getVarRes.body.data.inventory.stock).toBe(0);
    expect(getVarRes.body.data.inventory.reserved).toBe(0);

    // 4. Presencia en GET de lista -> 200
    const listVarRes = await fixtures.request('get', '/api/variants');
    expect(listVarRes.status).toBe(200);
    expect(listVarRes.body.message).toBe(es.variants.list);
    expect(Array.isArray(listVarRes.body.data)).toBe(true);
    expect(listVarRes.body.data.some(v => v.id === variantId)).toBe(true);

    // 5. PUT -> 200
    const updatePayload = {
      product_id: productId,
      sku: uniqueSku,
      size: '28',
      color: 'Azul',
      active: false,
    };
    const updateVarRes = await fixtures.request('put', `/api/variants/${variantId}`).send(updatePayload);
    expect(updateVarRes.status).toBe(200);
    expect(updateVarRes.body.message).toBe(es.variants.updated);
    expect(updateVarRes.body.data.size).toBe(updatePayload.size);
    expect(updateVarRes.body.data.color).toBe(updatePayload.color);
    expect(updateVarRes.body.data.active).toBe(updatePayload.active);

    // 6. Nueva lectura que confirme persistencia -> 200
    const verifyRes = await fixtures.request('get', `/api/variants/${variantId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.size).toBe(updatePayload.size);
    expect(verifyRes.body.data.color).toBe(updatePayload.color);
    expect(verifyRes.body.data.active).toBe(updatePayload.active);

    // 7. DELETE variante -> 200
    const deleteVarRes = await fixtures.request('delete', `/api/variants/${variantId}`);
    expect(deleteVarRes.status).toBe(200);
    expect(deleteVarRes.body.message).toBe(es.variants.deleted);

    // 8. GET 404 del id que acabas de eliminar
    const notFoundRes = await fixtures.request('get', `/api/variants/${variantId}`);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.message).toBe(es.variants.notFound);
    expect(notFoundRes.body.data).toBeNull();
  });

  it('rechaza la creación con 400 y mensaje traducido si product_id es inválido', async () => {
    const invalidPayload = variantBody(0, `SKU-INVALIDO-${randomUUID()}`);

    const badRes = await fixtures.post('/api/variants', invalidPayload);
    expect(badRes.status).toBe(400);
    expect(badRes.body.message).toBe(es.variants.invalidProductId);
    expect(badRes.body.data).toBeNull();
  });
});
