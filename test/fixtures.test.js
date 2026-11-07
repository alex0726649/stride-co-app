const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { User, Role } = require('../models/relationals');

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
