/**
 * Controlador para la gestión de Clientes (customers)
 */

const mockCustomers = [
  {
    id: 1,
    phone: "6141234567",
    email: "cliente1@gmail.com",
    addresses: [
      {
        type: "shipping",
        street: "Av. Universidad 100",
        city: "Chihuahua",
        state: "Chihuahua",
        postalCode: "31000",
        country: "México"
      }
    ]
  },
  {
    id: 2,
    phone: "6149876543",
    email: "cliente2@gmail.com",
    addresses: [
      {
        type: "shipping",
        street: "Calle 16 de Septiembre 45",
        city: "Cuauhtémoc",
        state: "Chihuahua",
        postalCode: "31500",
        country: "México"
      }
    ]
  }
];

const getCustomers = (req, res) => {
  return res.status(200).json({
    message: "GET customers",
    data: mockCustomers
  });
};

const getCustomerById = (req, res) => {
  const { id } = req.params;
  const customer = mockCustomers.find(c => c.id === parseInt(id));

  if (!customer) {
    return res.status(404).json({
      message: "Cliente no encontrado"
    });
  }

  return res.status(200).json({
    message: `GET customer ${id}`,
    data: customer
  });
};

module.exports = {
  getCustomers,
  getCustomerById
};
