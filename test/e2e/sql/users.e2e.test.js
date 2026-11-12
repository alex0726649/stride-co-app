const { randomUUID } = require('node:crypto');
const es = require('../../../locales/es.json');
const { findForbiddenKeys } = require('../helpers');
const { sqlFixtures } = require('./fixtures');

describe('E2E SQL - Users', () => {
  let fixtures;
  let userRoleId;

  beforeAll(async () => {
    fixtures = sqlFixtures();
    await fixtures.authenticate();

    // Toma el id del rol user desde GET /api/roles
    const rolesRes = await fixtures.request('get', '/api/roles');
    expect(rolesRes.status).toBe(200);
    const userRole = rolesRes.body?.data?.find(r => r.name === 'user');
    expect(userRole).toBeDefined();
    userRoleId = userRole.id;
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  it('completa el ciclo de vida: 201, GET por id, GET lista, PUT, verificación de persistencia, DELETE, GET 404 y exclusión de claves sensibles', async () => {
    const uniqueEmail = `e2e-user-${randomUUID()}@stride-demo.example`;
    const userPayload = {
      first_name: 'Usuario',
      last_name: 'E2E',
      email: uniqueEmail,
      role_id: userRoleId,
      password: 'StrideDemo-Password-2026!',
    };

    // 1. POST (alta) -> 201
    const createRes = await fixtures.post('/api/users', userPayload);
    const userId = createRes.body?.data?.id;

    expect(createRes.status).toBe(201);
    expect(createRes.body.message).toBe(es.users.created);
    expect(createRes.body.data.email).toBe(uniqueEmail);
    expect(createRes.body.data.role_id).toBe(userRoleId);
    expect(findForbiddenKeys(createRes.body)).toEqual([]);

    // 2. GET por id (detalle) -> 200
    const getRes = await fixtures.request('get', `/api/users/${userId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.message).toBe(es.users.found);
    expect(getRes.body.data.id).toBe(userId);
    expect(getRes.body.data.email).toBe(uniqueEmail);
    expect(findForbiddenKeys(getRes.body)).toEqual([]);

    // 3. Presencia en GET de lista -> 200
    const listRes = await fixtures.request('get', '/api/users');
    expect(listRes.status).toBe(200);
    expect(listRes.body.message).toBe(es.users.list);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some(u => u.id === userId)).toBe(true);
    expect(findForbiddenKeys(listRes.body)).toEqual([]);

    // 4. PUT (actualización) -> 200
    const updatePayload = {
      first_name: 'UsuarioModificado',
      last_name: 'E2EActualizado',
    };
    const updateRes = await fixtures.request('put', `/api/users/${userId}`).send(updatePayload);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe(es.users.updated);
    expect(updateRes.body.data.first_name).toBe(updatePayload.first_name);
    expect(updateRes.body.data.last_name).toBe(updatePayload.last_name);
    expect(findForbiddenKeys(updateRes.body)).toEqual([]);

    // 5. Nueva lectura que confirme persistencia -> 200
    const verifyRes = await fixtures.request('get', `/api/users/${userId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.first_name).toBe(updatePayload.first_name);
    expect(verifyRes.body.data.last_name).toBe(updatePayload.last_name);
    expect(findForbiddenKeys(verifyRes.body)).toEqual([]);

    // 6. DELETE (baja) -> 200
    const deleteRes = await fixtures.request('delete', `/api/users/${userId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe(es.users.deleted);
    expect(findForbiddenKeys(deleteRes.body)).toEqual([]);

    // 7. GET 404 del id que acabas de eliminar
    const notFoundRes = await fixtures.request('get', `/api/users/${userId}`);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.message).toBe(es.users.notFound);
    expect(notFoundRes.body.data).toBeNull();
  });

  it('rechaza la creación con 400 y mensaje traducido ante datos inválidos', async () => {
    const invalidPayload = {
      first_name: 'Invalido',
      last_name: 'Test',
      email: 'correo-no-valido',
      role_id: userRoleId,
      password: 'password123',
    };

    const badRes = await fixtures.post('/api/users', invalidPayload);
    expect(badRes.status).toBe(400);
    expect(badRes.body.message).toBe(es.users.invalidBody);
    expect(badRes.body.data).toBeNull();
  });
});
