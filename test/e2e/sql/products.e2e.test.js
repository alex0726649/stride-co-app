const { randomUUID } = require('node:crypto');
const es = require('../../../locales/es.json');
const { sqlFixtures, productBody, variantBody } = require('./fixtures');

describe('E2E SQL - Products', () => {
  let fixtures;

  beforeAll(async () => {
    fixtures = sqlFixtures();
    await fixtures.authenticate();
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  it('completa el ciclo de vida: 201, variante asociada, GET por id, GET lista, PUT, verificación de persistencia, DELETE en orden y GET 404', async () => {
    const uniqueProductName = `Producto E2E ${randomUUID()}`;
    const uniqueSku = `SKU-PROD-${randomUUID()}`;

    // 1. POST producto -> 201
    const createProdRes = await fixtures.post('/api/products', productBody(uniqueProductName));
    const productId = createProdRes.body?.data?.id;

    expect(createProdRes.status).toBe(201);
    expect(createProdRes.body.message).toBe(es.products.created);
    expect(createProdRes.body.data.name).toBe(uniqueProductName);
    expect(productId).toBeGreaterThan(0);

    // 2. Crea variante temporal asociada al producto -> 201
    const createVarRes = await fixtures.post('/api/variants', variantBody(productId, uniqueSku));
    const variantId = createVarRes.body?.data?.id;

    expect(createVarRes.status).toBe(201);
    expect(createVarRes.body.message).toBe(es.variants.created);
    expect(variantId).toBeGreaterThan(0);

    // 3. GET por id (detalle): confirma id y SKU dentro de variants -> 200
    const getProdRes = await fixtures.request('get', `/api/products/${productId}`);
    expect(getProdRes.status).toBe(200);
    expect(getProdRes.body.message).toBe(es.products.found);
    expect(getProdRes.body.data.id).toBe(productId);
    expect(Array.isArray(getProdRes.body.data.variants)).toBe(true);

    const variantInDetail = getProdRes.body.data.variants.find(v => v.id === variantId);
    expect(variantInDetail).toBeDefined();
    expect(variantInDetail.sku).toBe(uniqueSku);

    // 4. Presencia en GET de lista: confirma id y SKU dentro de variants -> 200
    const listProdRes = await fixtures.request('get', '/api/products');
    expect(listProdRes.status).toBe(200);
    expect(listProdRes.body.message).toBe(es.products.list);
    expect(Array.isArray(listProdRes.body.data)).toBe(true);

    const productInList = listProdRes.body.data.find(p => p.id === productId);
    expect(productInList).toBeDefined();
    expect(Array.isArray(productInList.variants)).toBe(true);

    const variantInList = productInList.variants.find(v => v.id === variantId);
    expect(variantInList).toBeDefined();
    expect(variantInList.sku).toBe(uniqueSku);

    // 5. PUT -> 200
    const updatePayload = {
      name: `Producto E2E Editado ${randomUUID()}`,
      description: 'Descripción de producto actualizada en E2E',
      brand: 'Stride E2E Mod',
      price: 189.99,
    };
    const updateProdRes = await fixtures.request('put', `/api/products/${productId}`).send(updatePayload);
    expect(updateProdRes.status).toBe(200);
    expect(updateProdRes.body.message).toBe(es.products.updated);
    expect(updateProdRes.body.data.name).toBe(updatePayload.name);
    expect(Number(updateProdRes.body.data.price)).toBe(updatePayload.price);

    // 6. Nueva lectura que confirme persistencia -> 200
    const verifyRes = await fixtures.request('get', `/api/products/${productId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.name).toBe(updatePayload.name);
    expect(Number(verifyRes.body.data.price)).toBe(updatePayload.price);

    // 7. Borra la variante antes del producto
    const deleteVarRes = await fixtures.request('delete', `/api/variants/${variantId}`);
    expect(deleteVarRes.status).toBe(200);
    expect(deleteVarRes.body.message).toBe(es.variants.deleted);

    // 8. Borra el producto -> 200
    const deleteProdRes = await fixtures.request('delete', `/api/products/${productId}`);
    expect(deleteProdRes.status).toBe(200);
    expect(deleteProdRes.body.message).toBe(es.products.deleted);

    // 9. GET 404 del id de producto que acabas de eliminar
    const notFoundRes = await fixtures.request('get', `/api/products/${productId}`);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.message).toBe(es.products.notFound);
    expect(notFoundRes.body.data).toBeNull();
  });

  it('rechaza la creación con 400 y mensaje traducido cuando el cuerpo es inválido', async () => {
    const invalidPayload = {
      description: 'Producto sin campo name',
      brand: 'Stride E2E',
      price: 100,
    };

    const badRes = await fixtures.post('/api/products', invalidPayload);
    expect(badRes.status).toBe(400);
    expect(badRes.body.message).toBe(es.products.invalidBody);
    expect(badRes.body.data).toBeNull();
  });
});
