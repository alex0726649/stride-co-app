const { jest: mock, beforeEach } = require('@jest/globals');

// Configuración exclusiva de pruebas: no leer secretos del .env local.
Object.assign(process.env, {
  JWT_SECRET: 'test-only-secret-never-use-in-production',
  JWT_EXPIRES_IN: '15m',
  JWT_ISSUER: 'stride-co-test',
  JWT_AUDIENCE: 'stride-co-test-api',
  BCRYPT_SALT_ROUNDS: '4',
});
mock.mock('dotenv', () => ({ config: () => ({ parsed: {} }) }));

// Mantener modelos/serialización reales, sustituyendo solo el acceso a SQL.
mock.mock('../models/relationals', () => {
  const actual = mock.requireActual('../models/relationals');
  for (const name of ['User', 'Role', 'Permission']) {
    for (const method of ['findAll', 'findByPk', 'findOne', 'create']) {
      actual[name][method] = mock.fn();
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
  const { User, Role, Permission } = require('../models/relationals');
  for (const model of [User, Role, Permission]) {
    for (const method of ['findAll', 'findByPk', 'findOne', 'create']) model[method].mockReset();
    model.findAll.mockResolvedValue([]);
    model.findByPk.mockResolvedValue(null);
    model.findOne.mockResolvedValue(null);
  }
  const { Customer, Order } = require('../models/documents');
  for (const model of [Customer, Order]) {
    for (const method of Object.values(model)) method.mockReset();
  }
});
