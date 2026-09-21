const response = require('../utils/response');
const { isValidAddress, publicAddress } = require('../utils/address');

const VALID_PAYMENT_METHODS = ['efectivo', 'transferencia'];
const VALID_STATUSES = ['Pendiente de pago', 'Pagado', 'Cancelado'];
const MOCK_DATE = '2026-09-01T12:00:00.000Z';
const MOCK_UPDATE_DATE = '2026-09-02T12:00:00.000Z';
const mockShippingAddress = {
  street: 'Calle Universidad', number: '123', city: 'Chihuahua',
  state: 'Chihuahua', postalCode: '31000', country: 'México',
};

// Fixtures relacionados con el producto 1 y el cliente-1. Ninguna escritura los modifica.
const orders = [
  {
    _id: 'orden-1', customerId: 'cliente-1', salesPersonId: 1, paymentMethod: 'efectivo',
    items: [{ productId: 1, quantity: 2, unitPrice: 1299 }],
    totals: { subtotal: 2598, shipping: 0, discount: 0, total: 2598 },
    shippingAddress: { ...mockShippingAddress },
    statusHistory: [{ status: 'Pendiente de pago', changedById: 1, changedAt: MOCK_DATE }],
    createdAt: MOCK_DATE, updatedAt: MOCK_DATE,
  },
  {
    _id: 'orden-2', customerId: 'cliente-1', salesPersonId: 1, paymentMethod: 'transferencia',
    items: [{ productId: 1, quantity: 1, unitPrice: 1299 }],
    totals: { subtotal: 1299, shipping: 0, discount: 0, total: 1299 },
    shippingAddress: { ...mockShippingAddress },
    statusHistory: [
      { status: 'Pendiente de pago', changedById: 1, changedAt: MOCK_DATE },
      { status: 'Pagado', changedById: 1, changedAt: MOCK_UPDATE_DATE },
    ],
    createdAt: MOCK_DATE, updatedAt: MOCK_UPDATE_DATE,
  },
];

function findOrderById(id) {
  return orders.find(order => order._id === id);
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

function validateOrderBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'El cuerpo debe ser un objeto JSON';
  const { customerId, salesPersonId, paymentMethod, items } = body;
  if (typeof customerId !== 'string' || !customerId.trim()) return 'customerId es obligatorio y debe ser un texto no vacío';
  if (!Number.isSafeInteger(salesPersonId) || salesPersonId <= 0) return 'salesPersonId debe ser un entero positivo';
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) return `paymentMethod debe ser uno de: ${VALID_PAYMENT_METHODS.join(', ')}`;
  if (!Array.isArray(items) || items.length === 0) return 'items debe ser un arreglo no vacío';
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return 'Cada item debe ser un objeto JSON';
    if (!Number.isSafeInteger(item.productId) || item.productId <= 0) return 'Cada item debe tener productId entero positivo';
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) return 'Cada item debe tener quantity entero positivo';
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) return 'Cada item debe tener unitPrice numérico finito mayor o igual a cero';
  }
  if (!Number.isFinite(calculateSubtotal(items))) return 'El subtotal debe ser finito';
  if (body.shippingAddress !== undefined && !isValidAddress(body.shippingAddress)) return 'shippingAddress debe ser una dirección completa';
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) return `status debe ser uno de: ${VALID_STATUSES.join(', ')}`;
  return null;
}

function orderData(body, shippingAddress) {
  const subtotal = calculateSubtotal(body.items);
  return {
    customerId: body.customerId,
    salesPersonId: body.salesPersonId,
    paymentMethod: body.paymentMethod,
    items: body.items.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
    // En esta etapa no se calculan tarifas de envío ni descuentos reales.
    totals: { subtotal, shipping: 0, discount: 0, total: subtotal },
    shippingAddress: publicAddress(body.shippingAddress === undefined ? shippingAddress : body.shippingAddress),
  };
}

function listOrders(req, res) {
  return response.success(res, 'Lista de órdenes', orders);
}

function getOrderById(req, res) {
  const order = findOrderById(req.params.id);
  if (!order) return response.notFound(res, 'Orden no encontrada');
  return response.success(res, 'Orden encontrada', order);
}

function createOrder(req, res) {
  const error = validateOrderBody(req.body);
  if (error) return response.badRequest(res, error);
  return response.created(res, 'Creación de orden simulada', {
    _id: 'orden-nueva',
    ...orderData(req.body, mockShippingAddress),
    // changedById es una referencia mock; no identifica a un usuario autenticado.
    statusHistory: [{ status: 'Pendiente de pago', changedById: req.body.salesPersonId, changedAt: MOCK_DATE }],
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
  });
}

function updateOrder(req, res) {
  const order = findOrderById(req.params.id);
  if (!order) return response.notFound(res, 'Orden no encontrada');
  const error = validateOrderBody(req.body);
  if (error) return response.badRequest(res, error);
  const statusHistory = [...order.statusHistory];
  if (req.body.status !== undefined && req.body.status !== statusHistory.at(-1).status) {
    statusHistory.push({ status: req.body.status, changedById: req.body.salesPersonId, changedAt: MOCK_UPDATE_DATE });
  }
  return response.success(res, 'Actualización de orden simulada', {
    ...order,
    ...orderData(req.body, order.shippingAddress),
    statusHistory,
    updatedAt: MOCK_UPDATE_DATE,
  });
}

module.exports = { listOrders, getOrderById, createOrder, updateOrder };
