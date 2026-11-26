const { randomUUID } = require('node:crypto');
const es = require('../../../locales/es.json');
const { sqlFixtures } = require('./fixtures');

describe('E2E SQL - Roles', () => {
  let fixtures;

  beforeAll(async () => {
    fixtures = sqlFixtures();
    await fixtures.authenticate();
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  it('completa el ciclo de vida: 201, GET por id, GET lista, PUT, verificación de persistencia, DELETE y GET 404', async () => {
    const uniqueRoleName = `rol-e2e-${randomUUID()}`;
    const rolePayload = {
      name: uniqueRoleName,
      description: 'Rol temporal creado para prueba E2E',
    };

    // 1. POST -> 201
    const createRes = await fixtures.post('/api/roles', rolePayload);
    const roleId = createRes.body?.data?.id;

    expect(createRes.status).toBe(201);
    expect(createRes.body.message).toBe(es.roles.created);
    expect(createRes.body.data.name).toBe(uniqueRoleName);
    expect(roleId).toBeGreaterThan(0);

    // 2. GET por id -> 200
    const getRes = await fixtures.request('get', `/api/roles/${roleId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.message).toBe(es.roles.found);
    expect(getRes.body.data.id).toBe(roleId);
    expect(getRes.body.data.name).toBe(uniqueRoleName);

    // 3. Presencia en GET de lista -> 200
    const listRes = await fixtures.request('get', '/api/roles');
    expect(listRes.status).toBe(200);
    expect(listRes.body.message).toBe(es.roles.list);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some(r => r.id === roleId)).toBe(true);

    // 4. PUT -> 200
    const updatePayload = {
      description: 'Descripción de rol modificada en E2E',
    };
    const updateRes = await fixtures.request('put', `/api/roles/${roleId}`).send(updatePayload);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe(es.roles.updated);
    expect(updateRes.body.data.description).toBe(updatePayload.description);

    // 5. Nueva lectura que confirme persistencia -> 200
    const verifyRes = await fixtures.request('get', `/api/roles/${roleId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.description).toBe(updatePayload.description);

    // 6. DELETE -> 200
    const deleteRes = await fixtures.request('delete', `/api/roles/${roleId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe(es.roles.deleted);

    // 7. GET 404 del id que acabas de eliminar
    const notFoundRes = await fixtures.request('get', `/api/roles/${roleId}`);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.message).toBe(es.roles.notFound);
    expect(notFoundRes.body.data).toBeNull();
  });

  it('rechaza la creación con 400 y mensaje traducido cuando falta el nombre', async () => {
    const invalidPayload = {
      description: 'Rol sin nombre obligatorio',
    };

    const badRes = await fixtures.post('/api/roles', invalidPayload);
    expect(badRes.status).toBe(400);
    expect(badRes.body.message).toBe(es.roles.invalidName);
    expect(badRes.body.data).toBeNull();
  });
});
