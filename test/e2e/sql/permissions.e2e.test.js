const { randomUUID } = require('node:crypto');
const es = require('../../../locales/es.json');
const { sqlFixtures } = require('./fixtures');

describe('E2E SQL - Permissions', () => {
  let fixtures;

  beforeAll(async () => {
    fixtures = sqlFixtures();
    await fixtures.authenticate();
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  it('completa el ciclo de vida: 201, GET por id, GET lista, PUT, verificación de persistencia, DELETE y GET 404', async () => {
    // La parte recurso de la clave solo admite letras minúsculas ([a-z]+)
    const suffix = randomUUID().replaceAll('-', '').replace(/\d/g, digit => 'ghijklmnop'[digit]);
    const resource = `perm${suffix}`;
    const permKey = `${resource}:read:any`;
    const permPayload = {
      key: permKey,
      description: 'Permiso temporal creado para prueba E2E',
    };

    // 1. POST -> 201
    const createRes = await fixtures.post('/api/permissions', permPayload);
    const permId = createRes.body?.data?.id;

    expect(createRes.status).toBe(201);
    expect(createRes.body.message).toBe(es.permissions.created);
    expect(createRes.body.data.key).toBe(permKey);
    expect(permId).toBeGreaterThan(0);

    // 2. GET por id -> 200
    const getRes = await fixtures.request('get', `/api/permissions/${permId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.message).toBe(es.permissions.found);
    expect(getRes.body.data.id).toBe(permId);
    expect(getRes.body.data.key).toBe(permKey);

    // 3. Presencia en GET de lista -> 200
    const listRes = await fixtures.request('get', '/api/permissions');
    expect(listRes.status).toBe(200);
    expect(listRes.body.message).toBe(es.permissions.list);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some(p => p.id === permId)).toBe(true);

    // 4. PUT -> 200
    const updatePayload = {
      description: 'Descripción de permiso actualizada en E2E',
    };
    const updateRes = await fixtures.request('put', `/api/permissions/${permId}`).send(updatePayload);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe(es.permissions.updated);
    expect(updateRes.body.data.description).toBe(updatePayload.description);

    // 5. Nueva lectura que confirme persistencia -> 200
    const verifyRes = await fixtures.request('get', `/api/permissions/${permId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.description).toBe(updatePayload.description);

    // 6. DELETE -> 200
    const deleteRes = await fixtures.request('delete', `/api/permissions/${permId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe(es.permissions.deleted);

    // 7. GET 404 del id que acabas de eliminar
    const notFoundRes = await fixtures.request('get', `/api/permissions/${permId}`);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.message).toBe(es.permissions.notFound);
    expect(notFoundRes.body.data).toBeNull();
  });

  it('rechaza la creación con 400 y mensaje traducido cuando la clave tiene formato inválido', async () => {
    // Clave inválida con números o formato no admitido por parsePermissionKey
    const invalidPayload = {
      key: 'perm123_INVALID:read:any',
      description: 'Permiso con key inválida',
    };

    const badRes = await fixtures.post('/api/permissions', invalidPayload);
    expect(badRes.status).toBe(400);
    expect(badRes.body.message).toBe(es.permissions.invalidKey);
    expect(badRes.body.data).toBeNull();
  });
});
