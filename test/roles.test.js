const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { User, Role, Permission } = require('../models/relationals');

const adminRole = { id: 1, name: 'admin' };
const userRole = { id: 2, name: 'user' };
const rolePermissions = ['create', 'read', 'update', 'delete'].map(action => ({ key: `roles:${action}:any` }));
const routes = [['post', '/api/roles'], ['get', '/api/roles'], ['get', '/api/roles/17'], ['put', '/api/roles/17'], ['delete', '/api/roles/17']];

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

// Rol real de Sequelize (toJSON real) con los métodos de escritura simulados.
function role() {
  const built = Role.build(
    { id: 17, name: 'editor', description: 'Prueba', permissions: [{ id: 3, key: 'products:read:any', description: 'Leer' }] },
    { include: [{ model: Permission, as: 'permissions' }] },
  );
  built.update = mock.fn().mockImplementation(async changes => { built.set(changes); return built; });
  built.destroy = mock.fn().mockResolvedValue();
  built.setPermissions = mock.fn().mockResolvedValue();
  return built;
}

beforeEach(() => {
  record = role();
  User.findByPk.mockImplementation(async id => {
    if (id === '101') return { id: 101, role_id: adminRole.id, active: true };
    if (id === '102') return { id: 102, role_id: userRole.id, active: true };
    return null;
  });
  Role.findByPk.mockImplementation(async (id, options) => {
    // La consulta del RBAC pide solo id y name; la del controller pide el rol completo.
    if (options?.attributes) {
      if (id === adminRole.id) return { ...adminRole, permissions: rolePermissions };
      if (id === userRole.id) return { ...userRole, permissions: [{ key: 'orders:read:own' }] };
      return null;
    }
    return String(id) === '17' ? record : null;
  });
});

describe('autenticación y autorización', () => {
  it.each(routes)('sin token responde 401: %s %s', async (method, path) => {
    await request(app)[method](path).send({ name: 'x' }).expect(401)
      .expect({ message: 'No autorizado', data: null });
    expect(Role.findAll).not.toHaveBeenCalled();
  });

  it.each(routes)('un rol sin roles:*:any responde 403: %s %s', async (method, path) => {
    await as('102', method, `${path}?lang=en`).send({ name: 'x' }).expect(403)
      .expect({ message: 'Forbidden', data: null });
    expect(Role.create).not.toHaveBeenCalled();
    expect(record.update).not.toHaveBeenCalled();
    expect(record.destroy).not.toHaveBeenCalled();
  });
});

describe('consultas', () => {
  it('lista y consulta roles con sus permisos', async () => {
    Role.findAll.mockResolvedValue([record]);
    const list = await asAdmin('get', '/api/roles').expect(200);
    expect(list.body.message).toBe('Lista de roles');
    expect(list.body.data[0].permissions[0].key).toBe('products:read:any');

    const found = await asAdmin('get', '/api/roles/17?lang=en').expect(200);
    expect(found.body.message).toBe('Role found');
    expect(found.body.data).toMatchObject({ id: 17, name: 'editor' });
    expect(Role.findByPk).toHaveBeenCalledWith('17', {
      include: { model: Permission, as: 'permissions', through: { attributes: [] } },
    });
  });

  it.each(['get', 'put', 'delete'])('responde 404 traducido si el rol no existe: %s', async method => {
    await asAdmin(method, '/api/roles/999').send({ name: 'x' }).expect(404)
      .expect({ message: 'Rol no encontrado', data: null });
    await asAdmin(method, '/api/roles/999?lang=en').send({ name: 'x' }).expect(404)
      .expect({ message: 'Role not found', data: null });
  });

  it.each(['abc', '0', '-1', '1.5', '99999999999'])('rechaza el id %p con 400 sin consultar la BD', async id => {
    for (const method of ['get', 'put', 'delete']) {
      await asAdmin(method, `/api/roles/${id}`).send({ name: 'x' }).expect(400)
        .expect({ message: 'El ID debe ser un entero positivo válido', data: null });
    }
    expect(Role.findByPk).not.toHaveBeenCalledWith(id, expect.anything());
    expect(Role.findByPk).not.toHaveBeenCalledWith(id);
  });
});

describe('escrituras', () => {
  it('crea el rol, asigna permisos existentes y lo devuelve con ellos', async () => {
    Role.create.mockResolvedValue(record);
    Permission.findAll.mockResolvedValue([{ id: 3 }]);
    const res = await asAdmin('post', '/api/roles')
      .send({ name: '  editor ', description: 'Prueba', permission_ids: [3] }).expect(201);
    expect(res.body.message).toBe('Rol creado');
    expect(Role.create).toHaveBeenCalledWith({ name: 'editor', description: 'Prueba' });
    expect(record.setPermissions).toHaveBeenCalledWith([3]);
    expect(res.body.data.permissions).toHaveLength(1);
  });

  it('crea sin permission_ids sin tocar role_permission', async () => {
    Role.create.mockResolvedValue(record);
    await asAdmin('post', '/api/roles').send({ name: 'editor' }).expect(201);
    expect(record.setPermissions).not.toHaveBeenCalled();
    expect(Permission.findAll).not.toHaveBeenCalled();
  });

  it('rechaza permisos que no existen sin crear el rol', async () => {
    Permission.findAll.mockResolvedValue([{ id: 3 }]);
    await asAdmin('post', '/api/roles?lang=en').send({ name: 'editor', permission_ids: [3, 999] }).expect(400)
      .expect({ message: 'permission_ids must be an array of existing permission IDs, without duplicates', data: null });
    expect(Role.create).not.toHaveBeenCalled();
  });

  it('actualiza solo los campos enviados', async () => {
    const res = await asAdmin('put', '/api/roles/17').send({ description: 'Nueva' }).expect(200);
    expect(res.body.message).toBe('Rol actualizado');
    expect(record.update).toHaveBeenCalledWith({ description: 'Nueva' });
    expect(record.setPermissions).not.toHaveBeenCalled();
    expect(res.body.data).toMatchObject({ name: 'editor', description: 'Nueva' });
  });

  it('permission_ids vacío quita todas las asignaciones', async () => {
    await asAdmin('put', '/api/roles/17').send({ permission_ids: [] }).expect(200);
    expect(record.setPermissions).toHaveBeenCalledWith([]);
    expect(Permission.findAll).not.toHaveBeenCalled();
  });

  it.each([
    ['vacío', {}],
    ['arreglo', []],
    ['name numérico', { name: 1 }],
    ['name en blanco', { name: '   ' }],
    ['name de 51 caracteres', { name: 'x'.repeat(51) }],
    ['description numérica', { name: 'editor', description: 5 }],
    ['permission_ids no arreglo', { name: 'editor', permission_ids: '3' }],
    ['permission_ids repetidos', { name: 'editor', permission_ids: [3, 3] }],
    ['permission_ids con cero', { name: 'editor', permission_ids: [0] }],
    ['campos desconocidos', { key: 'x' }],
  ])('rechaza cuerpo inválido (%s) sin escribir', async (_label, body) => {
    await asAdmin('post', '/api/roles').send(body).expect(400);
    await asAdmin('put', '/api/roles/17').send(body).expect(400);
    expect(Role.create).not.toHaveBeenCalled();
    expect(record.update).not.toHaveBeenCalled();
    expect(record.setPermissions).not.toHaveBeenCalled();
  });

  it('responde 400 traducido si el nombre ya existe', async () => {
    const duplicate = Object.assign(new Error('Validation error'), { name: 'SequelizeUniqueConstraintError' });
    Role.create.mockRejectedValue(duplicate);
    await asAdmin('post', '/api/roles').send({ name: 'admin' }).expect(400)
      .expect({ message: 'Ya existe un rol con ese nombre', data: null });
    record.update.mockRejectedValue(duplicate);
    await asAdmin('put', '/api/roles/17?lang=en').send({ name: 'admin' }).expect(400)
      .expect({ message: 'A role with that name already exists', data: null });
  });

  it('elimina un rol sin usuarios y devuelve lo eliminado', async () => {
    const res = await asAdmin('delete', '/api/roles/17').expect(200);
    expect(User.count).toHaveBeenCalledWith({ where: { role_id: 17 } });
    expect(record.destroy).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({ message: 'Rol eliminado', data: { id: 17, name: 'editor' } });
  });

  it('no elimina un rol con usuarios asignados', async () => {
    User.count.mockResolvedValue(2);
    await asAdmin('delete', '/api/roles/17?lang=en').expect(400)
      .expect({ message: 'A role with assigned users cannot be deleted', data: null });
    expect(record.destroy).not.toHaveBeenCalled();
  });

  it('un error inesperado de BD responde 500 JSON sin detalles', async () => {
    Role.findAll.mockRejectedValue(new Error('detalle privado'));
    await asAdmin('get', '/api/roles').expect(500)
      .expect({ message: 'Error interno del servidor', data: null });
    Role.create.mockRejectedValue(new Error('detalle privado'));
    await asAdmin('post', '/api/roles').send({ name: 'editor' }).expect(500)
      .expect({ message: 'Error interno del servidor', data: null });
  });
});
