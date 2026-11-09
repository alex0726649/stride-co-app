const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { Customer, Order } = require('../models/documents');
const OrderModel = require('../models/documents/order');
const { User, Role, Product } = require('../models/relationals');
const matrix = require('../database/rbac-matrix.json');

const id = '507f1f77bcf86cd799439011';
const customerId = '507f1f77bcf86cd799439012';
const otherCustomerId = '507f1f77bcf86cd799439013';
const items = [{ productId: 1, quantity: 2, unitPrice: 100 }];
const input = { customerId, paymentMethod: 'efectivo', items };
const document = { _id: id, ...input, salesPersonId: 2, status: 'Pendiente de pago' };
const customer = { _id: customerId, userId: 3, email: 'customer@example.com' };
const populated = { ...document, customerId: customer };
const roles = { 1: 'admin', 2: 'sales', 3: 'user', 4: 'user' };
const path = '/api/orders';
const detailPath = path + '/' + id;

function authenticated(method, url, user = 1) {
  const token = jwt.sign({ sub: String(user) }, config.get('jwt.secret'), {
    issuer: config.get('jwt.issuer'),
    audience: config.get('jwt.audience'),
  });
  return request(app)[method](url).auth(token, { type: 'bearer' });
}

function query(raw, result = raw) {
  // Las consultas Mongoose se pueden esperar directamente o encadenar a populate.
  return Object.assign(Promise.resolve(raw), { populate: mock.fn().mockResolvedValue(result) });
}

beforeEach(() => {
  User.findByPk.mockImplementation(async user => roles[user] ? {
    id: Number(user), role_id: Number(user), active: true, role: { name: roles[user] },
  } : null);
  Role.findByPk.mockImplementation(async id => ({
    name: roles[id],
    permissions: matrix.permissions.filter(permission => permission.roles.includes(roles[id])),
  }));
  Customer.findById.mockImplementation(async id => id === customerId ? customer : null);
  Product.findAll.mockResolvedValue([{ id: 1, price: '100.00' }]);
});

it('admin lista y consulta órdenes con datos de cliente y mensajes en ambos idiomas', async () => {
  Order.find.mockReturnValue(query([document], [populated]));
  Order.findById.mockReturnValue(query(document, populated));
  await authenticated('get', path).expect(200).expect({ message: 'Lista de órdenes', data: [populated] });
  await authenticated('get', detailPath + '?lang=en')
    .expect(200).expect({ message: 'Order found', data: populated });
  expect(Order.find.mock.results[0].value.populate).toHaveBeenCalledWith('customerId', expect.any(String));
  expect(Order.findById.mock.results[0].value.populate).toHaveBeenCalledWith('customerId', expect.any(String));
});

it('cliente consulta su orden, vendedor la asignada y otro cliente recibe 403', async () => {
  Order.findById.mockImplementation(() => query(document, populated));
  await authenticated('get', detailPath, 3).expect(200);
  await authenticated('get', detailPath, 2).expect(200);
  await authenticated('get', detailPath + '?lang=en', 4).expect(403)
    .expect({ message: 'Forbidden', data: null });
  await authenticated('get', path, 3).expect(403);
  expect(Order.find).not.toHaveBeenCalled();
});

it('una asignación antigua incorrecta no permite al comprador ver datos de otro cliente', async () => {
  const misassigned = { ...document, salesPersonId: 4 };
  const lookup = query(misassigned, { ...populated, salesPersonId: 4 });
  Order.findById.mockReturnValue(lookup);
  await authenticated('get', detailPath + '?lang=en', 4).expect(403)
    .expect({ message: 'Forbidden', data: null });
  expect(lookup.populate).not.toHaveBeenCalled();
});

it.each([['post', path, 1], ['post', path, 3], ['put', detailPath, 1]])(
  'rechaza usar una cuenta compradora como vendedor: %s %s (usuario %s)',
  async (method, url, user) => {
    await authenticated(method, url + '?lang=en', user).send({ ...input, salesPersonId: 4 }).expect(400)
      .expect({ message: 'The ID must belong to a salesperson account', data: null });
    expect(Order.create).not.toHaveBeenCalled();
    expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
  },
);

it('admin puede reasignar a una cuenta con rol vendedor', async () => {
  Order.findOneAndUpdate.mockResolvedValue(document);
  await authenticated('put', detailPath).send({ salesPersonId: 2 }).expect(200);
  expect(Order.findOneAndUpdate).toHaveBeenCalledWith({ _id: id },
    { $set: { salesPersonId: 2 } }, { new: true, runValidators: true });
});

it('comprador crea para su perfil con precio del catálogo, estado pendiente y sin vendedor', async () => {
  Order.create.mockResolvedValue(document);
  Customer.findById.mockImplementation(async id => id === customerId ? customer : { userId: 4 });
  await authenticated('post', path, 3)
    .send({ ...input, items: [{ productId: 1, quantity: 2, unitPrice: 0 }],
      totals: { total: 0 }, status: 'Pagado', salesPersonId: 2, _id: id }).expect(201);
  expect(Product.findAll).toHaveBeenCalledWith({ where: { id: [1] }, attributes: ['id', 'price'] });
  expect(Order.create).toHaveBeenCalledWith({
    ...input, status: 'Pendiente de pago', totals: { subtotal: 200, shipping: 0, discount: 0, total: 200 },
  });
  await authenticated('post', path, 3).send({ ...input, customerId: otherCustomerId }).expect(403);
  expect(Order.create).toHaveBeenCalledTimes(1);
});

it('vendedor puede cambiar el estado de una orden asignada sin reemplazar artículos', async () => {
  Order.findById.mockResolvedValue(document);
  Order.findOneAndUpdate.mockResolvedValue({ ...document, status: 'Pagado' });
  const updated = await authenticated('put', detailPath, 2).send({ status: 'Pagado' }).expect(200);
  expect(updated.body.data.items).toEqual(items);
  expect(Order.findOneAndUpdate).toHaveBeenCalledWith({ _id: id, salesPersonId: 2 }, { $set: { status: 'Pagado' } }, {
    new: true, runValidators: true,
  });
  await authenticated('put', detailPath, 2).send({ salesPersonId: 4 }).expect(403);
  await authenticated('put', detailPath, 3).send({ status: 'Cancelado' }).expect(403);
  expect(Order.findOneAndUpdate).toHaveBeenCalledTimes(1);
});

it('un vendedor que es comprador recibe 403 si la orden está asignada a otro vendedor', async () => {
  Order.findById.mockResolvedValue({ ...document, salesPersonId: 9 });
  Customer.findById.mockResolvedValue({ ...customer, userId: 2 });
  await authenticated('put', detailPath, 2).send({ status: 'Pagado' }).expect(403);
  expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
});

it('recalcula el total al editar artículos aunque el body mande precio cero', async () => {
  Product.findAll.mockResolvedValue([{ id: 1, price: '19.99' }]);
  Order.findById.mockResolvedValue(document);
  Order.findOneAndUpdate.mockResolvedValue(document);
  await authenticated('put', detailPath, 2)
    .send({ items: [{ productId: 1, quantity: 3, unitPrice: 0 }] }).expect(200);
  expect(Order.findOneAndUpdate).toHaveBeenCalledWith({ _id: id, salesPersonId: 2 }, {
    $set: {
      items: [{ productId: 1, quantity: 3, unitPrice: 19.99 }],
      totals: { subtotal: 59.97, shipping: 0, discount: 0, total: 59.97 },
    },
  }, { new: true, runValidators: true });
});

it('rechaza artículos que no tienen producto en el catálogo', async () => {
  Product.findAll.mockResolvedValue([]);
  await authenticated('post', path + '?lang=en').send(input).expect(400)
    .expect({ message: 'One of the products does not exist in the catalog', data: null });
  expect(Order.create).not.toHaveBeenCalled();
});

it('solo admin puede eliminar y el controlador conserva el ID de la respuesta', async () => {
  Order.findByIdAndDelete.mockResolvedValue(document);
  await authenticated('delete', detailPath, 2).expect(403);
  await authenticated('delete', detailPath).expect(200).expect({ message: 'Orden eliminada', data: { id } });
  expect(Order.findByIdAndDelete).toHaveBeenCalledTimes(1);
});

it.each(['get', 'post', 'put', 'delete'])('exige token: %s', async method => {
  await request(app)[method](method === 'post' ? path : detailPath).send(input).expect(401);
});

it.each(['get', 'put', 'delete'])('rechaza ObjectId inválido antes de consultar: %s', async method => {
  await authenticated(method, path + '/abcdefghijkl', method === 'delete' ? 1 : 2).send(input).expect(400);
  expect(Order.findById).not.toHaveBeenCalled();
  expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
  expect(Order.findByIdAndDelete).not.toHaveBeenCalled();
});

it.each([
  { items: [] }, { items: [null] }, { items: [{ ...items[0], quantity: 0 }] },
  { items: [{ ...items[0], quantity: '2' }] }, { paymentMethod: 'crypto' },
  { status: 'en proceso' }, { customerId: 'abc' }, { salesPersonId: -1 },
])('rechaza datos inválidos en altas y cambios %p', async patch => {
  await authenticated('post', path).send({ ...input, ...patch }).expect(400);
  await authenticated('put', detailPath).send(patch).expect(400);
  expect(Order.create).not.toHaveBeenCalled();
  expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
});

it('rechaza un cliente inexistente en una alta', async () => {
  await authenticated('post', path + '?lang=en').send({ ...input, customerId: otherCustomerId }).expect(400)
    .expect({ message: 'The specified customer is invalid', data: null });
  expect(Order.create).not.toHaveBeenCalled();
});

it.each(['get', 'put', 'delete'])('responde 404 para admin si la orden no existe: %s', async method => {
  Order.findById.mockReturnValue(query(null));
  Order.findOneAndUpdate.mockResolvedValue(null);
  Order.findByIdAndDelete.mockResolvedValue(null);
  await authenticated(method, detailPath).send({ status: 'Pagado' }).expect(404);
});

it('un error de MongoDB se traduce y oculta los detalles internos', async () => {
  Order.findOneAndUpdate.mockRejectedValue(new Error('dato privado de MongoDB'));
  await authenticated('put', detailPath + '?lang=en').send({ status: 'Pagado' }).expect(500)
    .expect({ message: 'Internal server error', data: null });
});

it('el esquema real valida artículos, método de pago, estado y cantidades', () => {
  expect(new OrderModel(input).validateSync()).toBeUndefined();
  for (const values of [{ items: [] }, { items: [{ ...items[0], quantity: 0 }] },
    { paymentMethod: 'no existe' }, { status: 'no existe' }]) {
    expect(new OrderModel({ ...input, ...values }).validateSync()).toBeDefined();
  }
});
