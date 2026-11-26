const { randomUUID } = require('node:crypto');
const es = require('../../../locales/es.json');
const { sqlFixtures, productBody, variantBody } = require('./fixtures');

describe('E2E SQL - Inventory', () => {
  let fixtures;
  let inventoryId;

  beforeAll(async () => {
    fixtures = sqlFixtures();
    await fixtures.authenticate();
  });

  afterAll(async () => {
    try {
      if (inventoryId > 0) {
        await fixtures.request('put', `/api/inventory/${inventoryId}`)
          .send({ stock: 0, reserved: 0 })
          .expect(200);
      }
    } finally {
      await fixtures.cleanup();
    }
  });

  it('completa el flujo de inventario: cantidades iniciales, listado, ajuste de stock y reserved, persistencia y 400 por reserved mayor que stock', async () => {
    // 1. Crea producto y variante temporal
    const prodRes = await fixtures.post('/api/products', productBody(`Producto Inventario ${randomUUID()}`));
    expect(prodRes.status).toBe(201);
    const productId = prodRes.body?.data?.id;
    expect(productId).toBeGreaterThan(0);

    const varSku = `SKU-INV-${randomUUID()}`;
    const varRes = await fixtures.post('/api/variants', variantBody(productId, varSku));
    expect(varRes.status).toBe(201);
    const variantId = varRes.body?.data?.id;
    expect(variantId).toBeGreaterThan(0);

    // 2. Obtiene el id de inventory desde el detalle de la variante
    const varDetailRes = await fixtures.request('get', `/api/variants/${variantId}`);
    expect(varDetailRes.status).toBe(200);
    expect(varDetailRes.body.data.inventory).toBeDefined();
    inventoryId = varDetailRes.body.data.inventory.id;
    expect(inventoryId).toBeGreaterThan(0);

    // 3. Comprueba las cantidades iniciales
    const invRes = await fixtures.request('get', `/api/inventory/${inventoryId}`);
    expect(invRes.status).toBe(200);
    expect(invRes.body.message).toBe(es.inventory.found);
    expect(invRes.body.data.id).toBe(inventoryId);
    expect(invRes.body.data.variant_id).toBe(variantId);
    expect(invRes.body.data.stock).toBe(0);
    expect(invRes.body.data.reserved).toBe(0);

    // 4. Consulta el listado
    const listRes = await fixtures.request('get', '/api/inventory');
    expect(listRes.status).toBe(200);
    expect(listRes.body.message).toBe(es.inventory.list);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some(i => i.id === inventoryId)).toBe(true);

    // 5. Ajusta stock y reserved
    const updatePayload = { stock: 25, reserved: 10 };
    const updateRes = await fixtures.request('put', `/api/inventory/${inventoryId}`).send(updatePayload);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe(es.inventory.updated);
    expect(updateRes.body.data.stock).toBe(updatePayload.stock);
    expect(updateRes.body.data.reserved).toBe(updatePayload.reserved);

    // 6. Vuelve a consultar para confirmar persistencia
    const verifyRes = await fixtures.request('get', `/api/inventory/${inventoryId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.stock).toBe(updatePayload.stock);
    expect(verifyRes.body.data.reserved).toBe(updatePayload.reserved);

    // 7. Verifica el 400 por reserved mayor que stock
    const excessPayload = { stock: 5, reserved: 20 };
    const badRes = await fixtures.request('put', `/api/inventory/${inventoryId}`).send(excessPayload);
    expect(badRes.status).toBe(400);
    expect(badRes.body.message).toBe(es.inventory.excessReserved);
    expect(badRes.body.data).toBeNull();
  });
});
