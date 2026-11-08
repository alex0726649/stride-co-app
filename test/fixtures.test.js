const { Product, ProductVariant, Inventory } = require('../models/relationals');

it('relaciona la variante con su producto e inventario mediante sus llaves foráneas', () => {
  expect(ProductVariant.associations.product.target).toBe(Product);
  expect(ProductVariant.associations.product.foreignKey).toBe('product_id');
  expect(ProductVariant.associations.inventory.target).toBe(Inventory);
  expect(ProductVariant.associations.inventory.foreignKey).toBe('variant_id');
  expect(ProductVariant.rawAttributes.sku.unique).toBe(true);
});
