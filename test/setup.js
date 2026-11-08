const { jest: mock, beforeEach } = require('@jest/globals');

// Mantener modelos/serialización reales, sustituyendo solo el acceso a SQL.
mock.mock('../models/relationals', () => {
  const actual = mock.requireActual('../models/relationals');
  for (const name of ['User', 'Role', 'Permission', 'Product']) {
    for (const method of ['findAll', 'findByPk', 'findOne', 'create', 'count']) {
      mock.spyOn(actual[name], method).mockReturnValue(undefined);
    }
  }
  return actual;
});

// Barrera adicional: ninguna consulta SQL puede llegar a la base local.
const { Sequelize } = require('sequelize');
mock.spyOn(Sequelize.prototype, 'query').mockImplementation(() => {
  throw new Error('Consulta SQL real bloqueada en pruebas');
});
mock.spyOn(Sequelize.prototype, 'authenticate').mockImplementation(() => {
  throw new Error('Conexión SQL real bloqueada en pruebas');
});

mock.mock('../models/documents', () => {
  const model = () => Object.fromEntries(
    ['find', 'findById', 'create', 'findByIdAndUpdate', 'findByIdAndDelete']
      .map(name => [name, mock.fn()])
  );
  return { Customer: model(), Order: model() };
});

beforeEach(() => {
  const { User, Role, Permission, Product } = require('../models/relationals');
  for (const model of [User, Role, Permission, Product]) {
    for (const method of ['findAll', 'findByPk', 'findOne', 'create', 'count']) model[method].mockReset();
    model.findAll.mockResolvedValue([]);
    model.findByPk.mockResolvedValue(null);
    model.findOne.mockResolvedValue(null);
    model.count.mockResolvedValue(0);
  }
  const { Customer, Order } = require('../models/documents');
  for (const model of [Customer, Order]) {
    for (const method of Object.values(model)) method.mockReset();
  }
});