// controllers/orders.js
// Recurso: Órdenes — operaciones acordadas: listar, consultar por ID, crear y
// actualizar. Sin eliminación; un cambio de estado se representa mediante
// actualización (docs/api.md, sección 3). IDs de texto tipo MongoDB mock.

const VALID_PAYMENT_METHODS = ['efectivo', 'transferencia'];

const orders = [
  {
    _id: 'orden-1',
    customerId: 'cliente-1',
    salesPersonId: 1,
    paymentMethod: 'efectivo',
    items: [
      { productId: 1, quantity: 2, unitPrice: 899.0 },
      { productId: 3, quantity: 1, unitPrice: 1299.0 },
    ],
    status: 'Pendiente de pago',
    total: 3097.0,
  },
  {
    _id: 'orden-2',
    customerId: 'cliente-1',
    salesPersonId: 1,
    paymentMethod: 'transferencia',
    items: [{ productId: 2, quantity: 1, unitPrice: 1599.0 }],
    status: 'Pagado',
    total: 1599.0,
  },
];

function findOrderById(id) {
  return orders.find((order) => order._id === id);
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

// Valida el cuerpo de una orden (usado tanto en creación como en actualización;
// PUT recibe los mismos campos obligatorios que POST, docs/api.md sección 6).
function validateOrderBody(body) {
  const { customerId, salesPersonId, paymentMethod, items } = body;

  if (typeof customerId !== 'string' || customerId.trim() === '') {
    return 'customerId es obligatorio y debe ser un texto no vacío';
  }

  if (!Number.isInteger(salesPersonId) || salesPersonId <= 0) {
    return 'salesPersonId es obligatorio y debe ser un entero positivo';
  }

  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return `paymentMethod debe ser uno de: ${VALID_PAYMENT_METHODS.join(', ')}`;
  }

  if (!Array.isArray(items) || items.length === 0) {
    return 'items es obligatorio y debe ser un arreglo no vacío';
  }

  for (const item of items) {
    const { productId, quantity, unitPrice } = item;

    if (!Number.isInteger(productId) || productId <= 0) {
      return 'Cada item debe tener productId entero positivo';
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return 'Cada item debe tener quantity entero positivo';
    }

    if (typeof unitPrice !== 'number' || unitPrice < 0) {
      return 'Cada item debe tener unitPrice numérico mayor o igual a cero';
    }
  }

  return null;
}

// GET /api/orders
function listOrders(req, res) {
  return res.status(200).json({
    message: 'Lista de órdenes',
    data: orders,
  });
}

// GET /api/orders/:id
function getOrderById(req, res) {
  const order = findOrderById(req.params.id);

  if (!order) {
    return res.status(404).json({
      message: 'Orden no encontrada',
      data: null,
    });
  }

  return res.status(200).json({
    message: 'Orden encontrada',
    data: order,
  });
}

// POST /api/orders
// Simula la creación: no modifica el arreglo fijo (docs/api.md, sección 1).
function createOrder(req, res) {
  const error = validateOrderBody(req.body);

  if (error) {
    return res.status(400).json({ message: error, data: null });
  }

  const { customerId, salesPersonId, paymentMethod, items } = req.body;

  // El ID lo determina el controlador, no el cliente (docs/api.md, sección 6).
  const newOrder = {
    _id: 'orden-nueva',
    customerId,
    salesPersonId,
    paymentMethod,
    items,
    status: 'Pendiente de pago',
    total: calculateTotal(items),
  };

  return res.status(201).json({
    message: 'Creación de orden simulada',
    data: newOrder,
  });
}

// PUT /api/orders/:id
// Simula la actualización: no modifica el arreglo fijo.
function updateOrder(req, res) {
  const order = findOrderById(req.params.id);

  if (!order) {
    return res.status(404).json({
      message: 'Orden no encontrada',
      data: null,
    });
  }

  const error = validateOrderBody(req.body);

  if (error) {
    return res.status(400).json({ message: error, data: null });
  }

  const { customerId, salesPersonId, paymentMethod, items, status } = req.body;

  const updatedOrder = {
    ...order,
    customerId,
    salesPersonId,
    paymentMethod,
    items,
    status: status || order.status,
    total: calculateTotal(items),
  };

  return res.status(200).json({
    message: 'Actualización de orden simulada',
    data: updatedOrder,
  });
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
};