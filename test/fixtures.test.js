const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, Role } = require('../models/relationals');

const accessToken = jwt.sign({ sub: '7' }, process.env.JWT_SECRET, {
  algorithm: 'HS256',
  expiresIn: '15m',
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
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
  const responses = await Promise.all(['products', 'variants', 'inventory']
    .map(resource => {
      const current = request(app).get(`/api/${resource}`).expect(200);
      if (resource === 'products') current.auth(accessToken, { type: 'bearer' });
      return current;
    }));
  const [products, variants, inventory] = responses.map(res => res.body.data);
  variants.forEach(variant => expect(products.map(product => product.id)).toContain(variant.product_id));
  inventory.forEach(record => expect(variants.map(variant => variant.id)).toContain(record.variant_id));
  variants.forEach(variant => expect(inventory.filter(record => record.variant_id === variant.id)).toHaveLength(1));
});
