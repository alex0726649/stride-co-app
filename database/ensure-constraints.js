const sequelize = require('../config/sequelize');

async function addConstraintIfMissing(name, table, definition) {
  const [constraints] = await sequelize.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = :table AND CONSTRAINT_NAME = :name`,
    { replacements: { table, name } },
  );

  if (constraints.length === 0) {
    await sequelize.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\` ${definition}`);
  }
}

async function addCategoryForeignKeyIfMissing() {
  const [references] = await sequelize.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'category_id' AND REFERENCED_TABLE_NAME = 'categories'`,
  );

  if (references.length === 0) {
    await sequelize.query(
      'ALTER TABLE `products` ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT',
    );
  }
}

async function ensureConstraints() {
  // Product.category_id defaults to 1; provide a valid default category in a fresh database.
  await sequelize.query(
    "INSERT INTO categories (id, name, created_at, updated_at) VALUES (1, 'General', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE id = VALUES(id)",
  );

  await addCategoryForeignKeyIfMissing();
  await addConstraintIfMissing('chk_products_price_nonnegative', 'products', 'CHECK (price >= 0)');
  await addConstraintIfMissing('chk_inventory_reserved_lte_stock', 'inventory', 'CHECK (reserved <= stock)');
}

module.exports = ensureConstraints;
