const { sequelize, User, Product, ProductVariant, Inventory } = require('../models/relationals');
const { hashPassword } = require('../utils/password');
const loadRbacMatrix = require('./load-rbac-matrix');

const DEMO_USERS = [
  { roleName: 'admin', firstName: 'Admin', password: 'StrideDemo-Admin-2026!' },
  { roleName: 'sales', firstName: 'Ventas', password: 'StrideDemo-Sales-2026!' },
  { roleName: 'user', firstName: 'Cliente', password: 'StrideDemo-User-2026!' },
];

const DEMO_SKU = 'STRIDE-DEMO-RUNNER-27';
const DEMO_STOCK = 20;

async function seedUsers(roles, transaction) {
  const users = new Map();

  for (const { roleName, firstName, password } of DEMO_USERS) {
    const email = `${roleName}@stride-demo.example`;
    const role = roles.get(roleName).role;
    let user = await User.findOne({ where: { email }, transaction });

    if (!user) {
      const passwordVariable = `SEED_${roleName.toUpperCase()}_PASSWORD`;
      const demoPassword = process.env[passwordVariable]
        || (process.env.NODE_ENV === 'production' ? '' : password);
      if (!demoPassword.trim()) {
        throw new Error(`Define ${passwordVariable} para crear la cuenta demo ${email}.`);
      }

      const { securePassword, saltKey } = await hashPassword(demoPassword);
      user = await User.create({
        first_name: firstName,
        last_name: 'Demo',
        email,
        active: true,
        role_id: role.id,
        password_hash: securePassword,
        salt_key: saltKey,
      }, { transaction });
    }

    users.set(roleName, user);
  }

  return users;
}

async function seedCatalog(transaction) {
  const existingVariant = await ProductVariant.findOne({ where: { sku: DEMO_SKU }, transaction });

  if (existingVariant) {
    await Inventory.findOrCreate({
      where: { variant_id: existingVariant.id },
      defaults: { stock: DEMO_STOCK },
      transaction,
    });
    return;
  }

  const [product] = await Product.findOrCreate({
    where: { name: 'Stride Runner Demo', brand: 'Stride Co' },
    defaults: { description: 'Calzado de muestra para el catálogo demo.', price: 1299 },
    transaction,
  });
  const variant = await ProductVariant.create({
    product_id: product.id,
    sku: DEMO_SKU,
    size: '27',
    color: 'Negro',
  }, { transaction });

  // El hook de la variante ya creó su inventario con stock cero.
  await Inventory.update({ stock: DEMO_STOCK }, { where: { variant_id: variant.id }, transaction });
}

async function seedPostgres() {
  return sequelize.transaction(async (transaction) => {
    // Serializa las cargas demo incluso en una base recién creada.
    await sequelize.query('SELECT pg_advisory_xact_lock(41902, 204)', { transaction });
    await sequelize.sync({ transaction });

    const roles = await loadRbacMatrix(transaction);
    const users = await seedUsers(roles, transaction);
    await seedCatalog(transaction);
    return users;
  });
}

module.exports = seedPostgres;
