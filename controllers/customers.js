const customers = [
  {
    _id: 'cliente-1',
    userId: 1,
    phone: '6141234567',
    email: 'cliente@example.com',
    addresses: [
      {
        type: 'shipping',
        street: 'Calle Universidad',
        number: '123',
        city: 'Chihuahua',
        state: 'Chihuahua',
        postalCode: '31000',
        country: 'México'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

function findCustomerById(id) {
  return customers.find((c) => c._id === id);
}

function validateCustomer(body) {
  const { userId, phone, email } = body;

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return 'userId es obligatorio y debe ser un entero positivo';
  }
  if (typeof phone !== 'string' || phone.trim() === '') {
    return 'phone es obligatorio y debe ser un texto no vacío';
  }
  if (typeof email !== 'string' || email.trim() === '') {
    return 'email es obligatorio y debe ser un texto no vacío';
  }
  return null;
}

function list(req, res) {
  return res.status(200).json({
    message: 'Lista de clientes',
    data: customers,
  });
}

function find(req, res) {
  const customer = findCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({
      message: 'Cliente no encontrado',
      data: null,
    });
  }
  return res.status(200).json({
    message: 'Cliente encontrado',
    data: customer,
  });
}

function create(req, res) {
  const error = validateCustomer(req.body);
  if (error) return res.status(400).json({ message: error, data: null });

  const { userId, phone, email, addresses } = req.body;
  const newCustomer = {
    _id: 'cliente-nuevo',
    userId,
    phone,
    email,
    addresses: Array.isArray(addresses) ? addresses : [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return res.status(201).json({
    message: 'Creación de cliente simulada',
    data: newCustomer,
  });
}

function update(req, res) {
  const customer = findCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({
      message: 'Cliente no encontrado',
      data: null,
    });
  }

  const error = validateCustomer(req.body);
  if (error) return res.status(400).json({ message: error, data: null });

  const { userId, phone, email, addresses } = req.body;
  const updatedCustomer = {
    ...customer,
    userId,
    phone,
    email,
    addresses: Array.isArray(addresses) ? addresses : customer.addresses,
    updatedAt: new Date()
  };

  return res.status(200).json({
    message: 'Actualización de cliente simulada',
    data: updatedCustomer,
  });
}

function destroy(req, res) {
  const customer = findCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({
      message: 'Cliente no encontrado',
      data: null,
    });
  }
  return res.status(200).json({
    message: 'Eliminación de cliente simulada',
    data: null,
  });
}

module.exports = { list, find, create, update, destroy };
