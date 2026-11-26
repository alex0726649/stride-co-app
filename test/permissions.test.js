const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { User, Role, Permission } = require('../models/relationals');

const adminRole = { id: 1, name: 'admin' };
const userRole = { id: 2, name: 'user' };
const adminPermissions = ['create', 'read', 'update', 'delete'].map(action => ({ key: `permissions:${action}:any` }));
const routes = [['post', '/api/permissions'], ['get', '/api/permissions'], ['get', '/api/permissions/17'], ['put', '/api/permissions/17'], ['delete', '/api/permissions/17']];
const values = { key: 'reports:read:any', description: 'Consultar reportes' };

let record;

function token(id) {
  return jwt.sign({ sub: id }, config.get('jwt.secret'), {
    issuer: config.get('jwt.issuer'),
    audience: config.get('jwt.audience'),
  });
}

function as(userId, method, path) {
  return request(app)[method](path).auth(token(userId), { type: 'bearer' });
}

const asAdmin = (method, path) => as('101', method, path);

// Permiso real de Sequelize (toJSON real) con los métodos de escritura simulados.
function permission() {
  const built = Permission.build(
    { id: 17, ...values, roles: [{ id: 1, name: 'admin' }] },
    { include: [{ model: Role, as: 'roles' }] },
  );
  built.update = mock.fn().mockImplementation(async changes => { built.set(changes); return built; });
  built.destroy = mock.fn().mockResolvedValue();
  built.countRoles = mock.fn().mockResolvedValue(0);
  return built;
}

beforeEach(() => {
  record = permission();
  User.findByPk.mockImplementation(async id => {
    if (id === '101') return { id: 101, role_id: adminRole.id, active: true };
    if (id === '102') return { id: 102, role_id: userRole.id, active: true };
    return null;
  });
  // El RBAC consulta el rol del usuario; el controller consulta Permission.
  Role.findByPk.mockImplementation(async id => {
    if (id === adminRole.id) return { ...adminRole, permissions: adminPermissions };
    if (id === userRole.id) return { ...userRole, permissions: [{ key: 'orders:read:own' }] };
    return null;
  });
  Permission.findByPk.mockImplementation(async id => (String(id) === '17' ? record : null));
});

describe('autenticación y autorización', () => {
  it.each(routes)('sin token responde 401: %s %s', async (method, path) => {
    await request(app)[method](path).send(values).expect(401)
      .expect({ message: 'No autorizado', data: null });
    expect(Permission.findAll).not.toHaveBeenCalled();
  });

  it.each(routes)('un rol sin permissions:*:any responde 403: %s %s', async (method, path) => {
    await as('102', method, `${path}?lang=en`).send(values).expect(403)
      .expect({ message: 'Forbidden', data: null });
    expect(Permission.create).not.toHaveBeenCalled();
    expect(record.update).not.toHaveBeenCalled();
    expect(record.destroy).not.toHaveBeenCalled();
  });
});

describe('consultas', () => {
  it('lista y consulta permisos con los roles que los tienen', async () => {
    Permission.findAll.mockResolvedValue([record]);
    const list = await asAdmin('get', '/api/permissions').expect(200);
    expect(list.body.message).toBe('Lista de permisos');
    expect(list.body.data[0]).toMatchObject({ key: values.key, roles: [{ id: 1, name: 'admin' }] });

    const found = await asAdmin('get', '/api/permissions/17?lang=en').expect(200);
    expect(found.body.message).toBe('Permission found');
    expect(found.body.data.id).toBe(17);
    expect(Permission.findByPk).toHaveBeenCalledWith('17', {
      include: { model: Role, as: 'roles', attributes: ['id', 'name'], through: { attributes: [] } },
    });
  });

  it.each(['get', 'put', 'delete'])('responde 404 traducido si el permiso no existe: %s', async method => {
    await asAdmin(method, '/api/permissions/999').send(values).expect(404)
      .expect({ message: 'Permiso no encontrado', data: null });
    await asAdmin(method, '/api/permissions/999?lang=en').send(values).expect(404)
      .expect({ message: 'Permission not found', data: null });
  });

  it.each(['abc', '0', '-1', '1.5', '99999999999'])('rechaza el id %p con 400 sin consultar la BD', async id => {
    for (const method of ['get', 'put', 'delete']) {
      await asAdmin(method, `/api/permissions/${id}`).send(values).expect(400)
        .expect({ message: 'El ID debe ser un entero positivo válido', data: null });
    }
    expect(Permission.findByPk).not.toHaveBeenCalled();
  });
});

describe('escrituras', () => {
  it('crea el permiso con key y description recortados', async () => {
    Permission.create.mockImplementation(async data => Permission.build({ id: 18, ...data }));
    const res = await asAdmin('post', '/api/permissions')
      .send({ key: ' reports:read:any ', description: ' Consultar reportes ' }).expect(201);
    expect(Permission.create).toHaveBeenCalledWith(values);
    expect(res.body).toMatchObject({ message: 'Permiso creado', data: { id: 18, ...values } });
  });

  it('actualiza solo los campos enviados', async () => {
    const res = await asAdmin('put', '/api/permissions/17').send({ description: 'Nueva' }).expect(200);
    expect(record.update).toHaveBeenCalledWith({ description: 'Nueva' });
    expect(res.body).toMatchObject({ message: 'Permiso actualizado', data: { key: values.key, description: 'Nueva' } });
  });

  it.each([
    ['vacío', {}],
    ['arreglo', []],
    ['sin alcance', { key: 'orders:read', description: 'x' }],
    ['acción desconocida', { key: 'orders:list:any', description: 'x' }],
    ['alcance desconocido', { key: 'orders:read:all', description: 'x' }],
    ['con mayúsculas', { key: 'Orders:read:any', description: 'x' }],
    ['con puntos', { key: 'orders.read.any', description: 'x' }],
    ['key numérica', { key: 1, description: 'x' }],
    ['key de más de 100 caracteres', { key: `${'a'.repeat(95)}:read:any`, description: 'x' }],
    ['description en blanco', { key: 'orders:read:any', description: '   ' }],
    ['description de 256 caracteres', { key: 'orders:read:any', description: 'x'.repeat(256) }],
    ['campos desconocidos', { name: 'x' }],
  ])('rechaza cuerpo inválido (%s) sin escribir', async (_label, body) => {
    await asAdmin('post', '/api/permissions').send(body).expect(400);
    await asAdmin('put', '/api/permissions/17').send(body).expect(400);
    expect(Permission.create).not.toHaveBeenCalled();
    expect(record.update).not.toHaveBeenCalled();
  });

  it('crear sin description responde 400', async () => {
    await asAdmin('post', '/api/permissions').send({ key: 'reports:read:any' }).expect(400);
    expect(Permission.create).not.toHaveBeenCalled();
  });

  it('explica el formato de la key en ambos idiomas', async () => {
    await asAdmin('post', '/api/permissions').send({ key: 'bad', description: 'x' }).expect(400)
      .expect({ message: 'La key debe tener el formato recurso:acción:alcance, por ejemplo orders:read:own', data: null });
    await asAdmin('post', '/api/permissions?lang=en').send({ key: 'bad', description: 'x' }).expect(400)
      .expect({ message: 'The key must follow the resource:action:possession format, for example orders:read:own', data: null });
  });

  it('responde 400 traducido si la key ya existe', async () => {
    const duplicate = Object.assign(new Error('Validation error'), { name: 'SequelizeUniqueConstraintError' });
    Permission.create.mockRejectedValue(duplicate);
    await asAdmin('post', '/api/permissions').send(values).expect(400)
      .expect({ message: 'Ya existe un permiso con esa key', data: null });
    record.update.mockRejectedValue(duplicate);
    await asAdmin('put', '/api/permissions/17?lang=en').send({ key: 'orders:read:any' }).expect(400)
      .expect({ message: 'A permission with that key already exists', data: null });
  });

  it('elimina un permiso sin roles y devuelve lo eliminado', async () => {
    const res = await asAdmin('delete', '/api/permissions/17').expect(200);
    expect(record.countRoles).toHaveBeenCalledTimes(1);
    expect(record.destroy).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({ message: 'Permiso eliminado', data: { id: 17, key: values.key } });
  });

  it('no elimina un permiso asignado a roles', async () => {
    record.countRoles.mockResolvedValue(3);
    await asAdmin('delete', '/api/permissions/17?lang=en').expect(400)
      .expect({ message: 'A permission assigned to roles cannot be deleted; remove it from those roles first', data: null });
    expect(record.destroy).not.toHaveBeenCalled();
  });

  it('un error inesperado de BD responde 500 JSON sin detalles', async () => {
    Permission.findAll.mockRejectedValue(new Error('detalle privado'));
    await asAdmin('get', '/api/permissions').expect(500)
      .expect({ message: 'Error interno del servidor', data: null });
    Permission.create.mockRejectedValue(new Error('detalle privado'));
    await asAdmin('post', '/api/permissions').send(values).expect(500)
      .expect({ message: 'Error interno del servidor', data: null });
  });
});
