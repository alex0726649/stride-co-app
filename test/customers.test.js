const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { User, Role } = require('../models/relationals');
const { Customer } = require('../models/documents');
const matrix = require('../database/rbac-matrix.json');

// El id de usuario coincide con su rol: 1 admin, 2 sales, 3 user (cliente).
const ROLES = { 1: 'admin', 2: 'sales', 3: 'user' };

const ownId = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';
const missingId = '507f1f77bcf86cd799439099';

const ownCustomer = {
  _id: ownId,
  userId: 3,
  email: 'ana@example.com',
  phone: '6141234567',
  addresses: [{ type: 'SHIPPING', city: 'Chihuahua' }],
};
const otherCustomer = { _id: otherId, userId: 4, email: 'luis@example.com', addresses: [] };

const validBody = {
  userId: 3,
  email: 'ana@example.com',
  phone: '6141234567',
  addresses: [{ type: 'SHIPPING', street: 'Av. Universidad', city: 'Chihuahua' }],
};

function as(userId, method, path) {
  const token = jwt.sign({ sub: String(userId) }, config.get('jwt.secret'), {
    issuer: config.get('jwt.issuer'),
    audience: config.get('jwt.audience'),
  });
  return request(app)[method](path).auth(token, { type: 'bearer' });
}

beforeEach(() => {
  User.findByPk.mockImplementation(async id => ({ id: Number(id), active: true, role_id: Number(id) }));
  Role.findByPk.mockImplementation(async id => ({
    name: ROLES[id],
    permissions: matrix.permissions.filter(permission => permission.roles.includes(ROLES[id])),
  }));
  const documents = { [ownId]: ownCustomer, [otherId]: otherCustomer };
  Customer.findById.mockImplementation(async id => documents[id] || null);
});

describe('/api/customers', () => {
  it.each([1, 2])('admin y ventas listan clientes (any): usuario %s', async userId => {
    Customer.find.mockResolvedValue([ownCustomer, otherCustomer]);
    await as(userId, 'get', '/api/customers')
      .expect(200)
      .expect({ message: 'Lista de clientes', data: [ownCustomer, otherCustomer] });
  });

  it('un cliente no puede listar a todos los clientes (403)', async () => {
    await as(3, 'get', '/api/customers').expect(403);
    expect(Customer.find).not.toHaveBeenCalled();
  });

  it('un cliente consulta su propio perfil (own)', async () => {
    await as(3, 'get', `/api/customers/${ownId}`)
      .expect(200)
      .expect({ message: 'Cliente encontrado', data: ownCustomer });
  });

  it('un cliente no puede consultar el perfil de otro (403)', async () => {
    await as(3, 'get', `/api/customers/${otherId}`).expect(403);
  });

  it('traduce el mensaje al inglés', async () => {
    await as(1, 'get', `/api/customers/${ownId}?lang=en`)
      .expect(200)
      .expect({ message: 'Customer found', data: ownCustomer });
  });

  it.each(['get', 'put', 'delete'])('ObjectId mal formado responde 400 sin consultar Mongo: %s', async method => {
    for (const id of ['abc', 'abcdefghijkl', '507f1f77bcf86cd79943901z', '507f1f77bcf86cd7994390111']) {
      const res = await as(3, method, `/api/customers/${id}`).send({ phone: '1' }).expect(400);
      expect(res.body).toEqual({ message: expect.any(String), data: null });
    }
    expect(Customer.findById).not.toHaveBeenCalled();
    expect(Customer.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(Customer.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it.each(['get', 'put', 'delete'])('responde 404 si el cliente no existe: %s', async method => {
    Customer.findByIdAndUpdate.mockResolvedValue(null);
    Customer.findByIdAndDelete.mockResolvedValue(null);
    await as(1, method, `/api/customers/${missingId}`)
      .send({ phone: '6140000000' })
      .expect(404)
      .expect({ message: 'Cliente no encontrado', data: null });
  });

  it('un cliente crea su propio perfil y solo se guardan campos editables', async () => {
    Customer.create.mockImplementation(async data => ({ _id: ownId, ...data }));
    const res = await as(3, 'post', '/api/customers')
      .send({ ...validBody, _id: otherId, createdAt: '2020-01-01', extra: true })
      .expect(201);
    expect(res.body.message).toBe('Cliente creado');
    expect(Customer.create).toHaveBeenCalledWith(validBody);
  });

  it('un cliente no puede crear el perfil de otro usuario (403)', async () => {
    await as(3, 'post', '/api/customers').send({ ...validBody, userId: 4 }).expect(403);
    expect(Customer.create).not.toHaveBeenCalled();
  });

  it.each([
    { ...validBody, email: 'sin-arroba' },
    { ...validBody, addresses: [{ type: 'HOME' }] },
    { ...validBody, addresses: 'calle' },
    { ...validBody, userId: '3' },
    { ...validBody, userId: 1.5 },
    { ...validBody, userId: 0 },
    { email: 'ana@example.com' },
  ])('rechaza el cuerpo inválido al crear %#', async body => {
    const res = await as(1, 'post', '/api/customers').send(body).expect(400);
    expect(res.body).toEqual({ message: expect.any(String), data: null });
    expect(Customer.create).not.toHaveBeenCalled();
  });

  it('responde 400 si Mongo reporta un valor duplicado', async () => {
    Customer.create.mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 }));
    await as(1, 'post', '/api/customers').send(validBody).expect(400);
  });

  it('el dueño actualiza su perfil; solo campos editables y con validadores', async () => {
    Customer.findByIdAndUpdate.mockImplementation(async (id, data) => ({ ...ownCustomer, ...data }));
    await as(3, 'put', `/api/customers/${ownId}`)
      .send({ phone: '6149999999', _id: otherId })
      .expect(200)
      .expect(res => expect(res.body.message).toBe('Cliente actualizado'));
    expect(Customer.findByIdAndUpdate).toHaveBeenCalledWith(
      ownId,
      { phone: '6149999999' },
      { new: true, runValidators: true },
    );
  });

  it('el dueño no puede reasignar su perfil a otro usuario (403)', async () => {
    await as(3, 'put', `/api/customers/${ownId}`).send({ userId: 4 }).expect(403);
    expect(Customer.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { email: 'mal' },
    { addresses: [{ type: 'X' }] },
  ])('rechaza actualizaciones inválidas %#', async body => {
    await as(1, 'put', `/api/customers/${ownId}`).send(body).expect(400);
    expect(Customer.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('solo admin elimina clientes (user no tiene delete:own)', async () => {
    Customer.findByIdAndDelete.mockResolvedValue(ownCustomer);
    await as(3, 'delete', `/api/customers/${ownId}`).expect(403);
    await as(1, 'delete', `/api/customers/${ownId}`)
      .expect(200)
      .expect({ message: 'Cliente eliminado', data: null });
    expect(Customer.findByIdAndDelete).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['get', '/api/customers'],
    ['get', `/api/customers/${ownId}`],
    ['post', '/api/customers'],
    ['put', `/api/customers/${ownId}`],
    ['delete', `/api/customers/${ownId}`],
  ])('exige JWT: %s %s', async (method, path) => {
    await request(app)[method](path).send(validBody).expect(401);
    expect(Customer.find).not.toHaveBeenCalled();
    expect(Customer.create).not.toHaveBeenCalled();
    expect(Customer.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(Customer.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('un error de Mongo responde 500 sin exponer detalles', async () => {
    Customer.find.mockRejectedValue(new Error('detalle privado de MongoDB'));
    await as(1, 'get', '/api/customers')
      .expect(500)
      .expect({ message: 'Error interno del servidor', data: null });
  });
});
describe('esquema Customer', () => {
  // setup.js sustituye Customer por funciones simuladas; aquí se usa el modelo
  // real solo para validar el esquema (validate() no necesita conexión).
  const { Customer: RealCustomer } = mock.requireActual('../models/documents');

  async function errorsOf(data) {
    try {
      await new RealCustomer(data).validate();
      return {};
    } catch (error) {
      return error.errors;
    }
  }

  it('acepta un documento válido', async () => {
    await expect(new RealCustomer(validBody).validate()).resolves.toBeUndefined();
  });

  it('valida email, addresses.type y userId', async () => {
    expect((await errorsOf({ ...validBody, email: 'mal' })).email).toBeDefined();
    expect((await errorsOf({ ...validBody, addresses: [{ type: 'HOME' }] }))['addresses.0.type']).toBeDefined();
    expect((await errorsOf({ ...validBody, userId: 1.5 })).userId).toBeDefined();
    expect((await errorsOf({ ...validBody, userId: 'abc' })).userId).toBeDefined();
  });
});