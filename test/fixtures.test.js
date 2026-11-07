const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { User, Role, Product } = require('../models/relationals');

const accessToken = jwt.sign({ sub: '7' }, config.get('jwt.secret'), {
  algorithm: 'HS256',
  expiresIn: '15m',
  issuer: config.get('jwt.issuer'),
  audience: config.get('jwt.audience'),
});

beforeEach(() => {
  User.findByPk.mockResolvedValue({ id: 7, active: true, role_id: 1 });
  Role.findByPk.mockResolvedValue({
    id: 1,
    name: 'admin',
    permissions: [{ key: 'products:read:any' }],
  });
  // products ya persiste con Sequelize; se expone el producto id 1 que
  // referencian las variantes, para validar la coherencia de referencias.
  Product.findAll.mockResolvedValue([
    { id: 1, name: 'Tenis Stride', description: 'Producto de prueba', brand: 'Stride & Co.', price: 1299, active: true, variants: [] },
  ]);
});

it('mantiene referencias coherentes en los recursos que todavía usan datos fijos', async () => {
  const responses = await Promise.all(['products', 'variants']
    .map(resource => {
      const current = request(app).get(`/api/${resource}`).expect(200);
      if (resource === 'products') current.auth(accessToken, { type: 'bearer' });
      return current;
    }));
  const [products, variants] = responses.map(res => res.body.data);
  variants.forEach(variant => expect(products.map(product => product.id)).toContain(variant.product_id));
});