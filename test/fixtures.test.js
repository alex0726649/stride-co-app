const request = require('supertest');
const app = require('../app');

it('mantiene referencias coherentes en los recursos que todavía usan datos fijos', async () => {
  const responses = await Promise.all(['products', 'variants', 'inventory']
    .map(resource => request(app).get(`/api/${resource}`).expect(200)));
  const [products, variants, inventory] = responses.map(res => res.body.data);
  variants.forEach(variant => expect(products.map(product => product.id)).toContain(variant.product_id));
  inventory.forEach(record => expect(variants.map(variant => variant.id)).toContain(record.variant_id));
  variants.forEach(variant => expect(inventory.filter(record => record.variant_id === variant.id)).toHaveLength(1));
});
