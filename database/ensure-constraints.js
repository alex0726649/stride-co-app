const sequelize = require('../config/sequelize');

async function addConstraintIfMissing(name, table, definition) {
  const [constraints] = await sequelize.query(
    `SELECT conname FROM pg_constraint
     WHERE conrelid = to_regclass(:table) AND conname = :name`,
    { replacements: { table, name } },
  );

  if (constraints.length === 0) {
    await sequelize.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${name}" ${definition}`);
  }
}

async function ensureConstraints() {
  // Mismo nombre que genera PostgreSQL para unique: true; cubre bases creadas antes de S2-06.
  await addConstraintIfMissing('roles_name_key', 'roles', 'UNIQUE (name)');
  await addConstraintIfMissing('chk_products_price_nonnegative', 'products', 'CHECK (price >= 0)');
  await addConstraintIfMissing('chk_inventory_stock_nonnegative', 'inventory', 'CHECK (stock >= 0)');
  await addConstraintIfMissing('chk_inventory_reserved_nonnegative', 'inventory', 'CHECK (reserved >= 0)');
  await addConstraintIfMissing('chk_inventory_reserved_lte_stock', 'inventory', 'CHECK (reserved <= stock)');
}

module.exports = ensureConstraints;
