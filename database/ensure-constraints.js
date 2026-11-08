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

async function ensureCategoryIdIsString() {
  const [references] = await sequelize.query(
    `SELECT DISTINCT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'category_id' AND REFERENCED_TABLE_NAME IS NOT NULL`,
  );

  for (const { CONSTRAINT_NAME: name } of references) {
    const escapedName = name.replace(/`/g, '``');
    await sequelize.query('ALTER TABLE `products` DROP FOREIGN KEY `' + escapedName + '`');
  }

  const [columns] = await sequelize.query(
    `SELECT DATA_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'category_id'`,
  );

  if (columns[0]?.DATA_TYPE !== 'varchar') {
    await sequelize.query(
      "ALTER TABLE `products` MODIFY `category_id` VARCHAR(100) NOT NULL DEFAULT '1'",
    );
  }
}

async function ensureConstraints() {
  // The instructor specified category_id as text, without a category table or foreign key.
  await ensureCategoryIdIsString();
  await addConstraintIfMissing('chk_products_price_nonnegative', 'products', 'CHECK (price >= 0)');
  await addConstraintIfMissing('chk_inventory_reserved_lte_stock', 'inventory', 'CHECK (reserved <= stock)');
}

module.exports = ensureConstraints;
