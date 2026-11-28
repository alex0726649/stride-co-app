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

// Catálogo basado en el prototipo. Se identifica cada variante por SKU para que
// ejecutar el seed varias veces actualice los datos sin crear duplicados.
const STORE_PRODUCTS = [
  {
    name: 'Stride Runner X', category: 'Running', price: 1899,
    description: 'Ligereza y amortiguación para tus kilómetros diarios.',
    sku: 'RUN-X-BLK-26', size: '26', color: 'Negro', stock: 20, reserved: 2,
  },
  {
    name: 'Street Motion', category: 'Urbanos', price: 1499,
    description: 'Silueta urbana para uso diario.',
    sku: 'STM-WHT-26', size: '26', color: 'Blanco', stock: 24, reserved: 1,
  },
  {
    name: 'Velocity Pro', category: 'Training', price: 2199,
    description: 'Estabilidad y agarre en cada entrenamiento.',
    sku: 'VEL-BLU-27', size: '27', color: 'Azul', stock: 8, reserved: 0,
  },
  {
    name: 'Everyday Lite', category: 'Urbanos', price: 1299,
    description: 'Comodidad sencilla para todos los días.',
    sku: 'EDL-GRY-26', size: '26', color: 'Gris', stock: 31, reserved: 0,
  },
  {
    name: 'Trail Explorer', category: 'Outdoor', price: 2399,
    description: 'Tracción y protección para rutas al aire libre.',
    sku: 'TRE-BRN-27', size: '27', color: 'Café', stock: 12, reserved: 0,
  },
  {
    name: 'Sprint Flex', category: 'Running', price: 1799,
    description: 'Respuesta ligera para entrenamientos de velocidad.',
    sku: 'SPF-RED-26', size: '26', color: 'Rojo', stock: 16, reserved: 0,
  },
  {
    name: 'Court Classic', category: 'Urbanos', price: 1599,
    description: 'Diseño clásico con soporte para todo el día.',
    sku: 'COC-WHT-27', size: '27', color: 'Blanco', stock: 18, reserved: 0,
  },
  {
    name: 'Power Lift', category: 'Training', price: 1999,
    description: 'Base firme para tus sesiones de fuerza.',
    sku: 'POL-BLK-28', size: '28', color: 'Negro', stock: 10, reserved: 0,
  },
  {
    name: 'Trail Summit', category: 'Outdoor', price: 2599,
    description: 'Agarre confiable para terrenos exigentes.',
    sku: 'TRS-GRN-27', size: '27', color: 'Verde', stock: 9, reserved: 0,
  },
  {
    name: 'Marathon Pace', category: 'Running', price: 2299,
    description: 'Amortiguación cómoda para distancias largas.',
    sku: 'MAP-BLU-28', size: '28', color: 'Azul', stock: 14, reserved: 0,
  },
  {
    name: 'Studio Move', category: 'Training', price: 1399,
    description: 'Flexibilidad y estabilidad para clases y gimnasio.',
    sku: 'STM-PNK-25', size: '25', color: 'Rosa', stock: 15, reserved: 0,
  },
  {
    name: 'City Walk', category: 'Urbanos', price: 1199,
    description: 'Un calzado cómodo para recorrer la ciudad.',
    sku: 'CIW-GRY-25', size: '25', color: 'Gris', stock: 0, reserved: 0,
  },
];

const INACTIVE_PRODUCT = {
  name: 'Trail Sample Inactive', category: 'Outdoor', price: 1899,
  description: 'Producto inactivo de demostración para el panel administrativo.',
  sku: 'TRS-SAMPLE-INACTIVE-27', size: '27', color: 'Negro', stock: 6, reserved: 0,
};

async function seedUsers(roles, transaction) {
  const users = new Map();

  for (const { roleName, firstName, password } of DEMO_USERS) {
    const email = `${roleName}@stride-demo.example`;
    const role = roles.get(roleName).role;
    let user = await User.findOne({ where: { email }, transaction });

    if (!user) {
      // Contraseñas ficticias, exclusivas de estas cuentas y documentadas en el README.
      // Son las mismas en todos los entornos para que las pruebas E2E también corran contra Render.
      const { securePassword, saltKey } = await hashPassword(password);
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
  const [demoProduct] = await Product.findOrCreate({
    where: { name: 'Stride Runner Demo', brand: 'Stride Co' },
    defaults: {
      category_id: 'Running',
      description: 'Calzado de muestra para el catálogo demo.',
      price: 1299,
      active: true,
    },
    transaction,
  });

  const catalog = [
    {
      name: demoProduct.name,
      category: 'Running',
      description: demoProduct.description,
      price: demoProduct.price,
      active: true,
      sku: DEMO_SKU,
      size: '27',
      color: 'Negro',
      stock: DEMO_STOCK,
      reserved: 0,
    },
    ...STORE_PRODUCTS.map(product => ({ ...product, active: true })),
    { ...INACTIVE_PRODUCT, active: false },
  ];

  for (const item of catalog) {
    const [product] = await Product.findOrCreate({
      where: { name: item.name, brand: 'Stride Co' },
      defaults: {
        category_id: item.category,
        description: item.description,
        price: item.price,
        active: item.active,
      },
      transaction,
    });

    // Actualiza también productos ya creados por un seed anterior, sin
    // cambiar sus IDs ni romper las relaciones con variantes y pedidos.
    await product.update({
      category_id: item.category,
      description: item.description,
      price: item.price,
      active: item.active,
    }, { transaction });

    const [variant] = await ProductVariant.findOrCreate({
      where: { sku: item.sku },
      defaults: {
        product_id: product.id,
        size: item.size,
        color: item.color,
        active: true,
      },
      transaction,
    });

    const [inventory] = await Inventory.findOrCreate({
      where: { variant_id: variant.id },
      defaults: { stock: item.stock, reserved: item.reserved },
      transaction,
    });
    await inventory.update({ stock: item.stock, reserved: item.reserved }, { transaction });
  }

  return demoProduct.id;
}

async function seedPostgres() {
  return sequelize.transaction(async (transaction) => {
    // Serializa las cargas demo incluso en una base recién creada.
    await sequelize.query('SELECT pg_advisory_xact_lock(41902, 204)', { transaction });
    await sequelize.sync({ transaction });

    const roles = await loadRbacMatrix(transaction);
    const users = await seedUsers(roles, transaction);
    const demoProductId = await seedCatalog(transaction);
    return { users, demoProductId };
  });
}

module.exports = seedPostgres;
