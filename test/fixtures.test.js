const request = require('supertest');
const app = require('../app');

it('mantiene referencias coherentes entre los mocks de los ocho recursos', async () => {
  const resources = ['users', 'roles', 'permissions', 'products', 'variants', 'inventory', 'customers', 'orders'];
  const responses = await Promise.all(resources.map(resource => request(app).get(`/api/${resource}`)));
  responses.forEach(res => {
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
  const [users, roles, , products, variants, inventory, customers, orders] = responses.map(res => res.body.data);
  users.forEach(user => expect(roles.map(role => role.id)).toContain(user.role_id));
  variants.forEach(variant => expect(products.map(product => product.id)).toContain(variant.product_id));
  inventory.forEach(record => expect(variants.map(variant => variant.id)).toContain(record.variant_id));
  variants.forEach(variant => expect(inventory.filter(record => record.variant_id === variant.id)).toHaveLength(1));
  customers.forEach(customer => expect(users.map(user => user.id)).toContain(customer.userId));
  orders.forEach(order => {
    expect(customers.map(customer => customer._id)).toContain(order.customerId);
    expect(users.map(user => user.id)).toContain(order.salesPersonId);
    order.items.forEach(item => expect(products.map(product => product.id)).toContain(item.productId));
    const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    expect(order.totals.subtotal).toBe(subtotal);
    expect(order.totals.total).toBe(subtotal + order.totals.shipping - order.totals.discount);
    expect(order.shippingAddress).toEqual(expect.objectContaining({ street: expect.any(String), country: expect.any(String) }));
    expect(order.statusHistory.length).toBeGreaterThan(0);
    order.statusHistory.forEach(entry => {
      expect(users.map(user => user.id)).toContain(entry.changedById);
      expect(Number.isNaN(Date.parse(entry.changedAt))).toBe(false);
    });
    expect(Number.isNaN(Date.parse(order.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(order.updatedAt))).toBe(false);
    expect(order).not.toHaveProperty('total');
    expect(order).not.toHaveProperty('status');
  });
});
