const { sequelize, Role, Permission } = require('../models/relationals');

const resources = ['products', 'orders', 'users', 'customers', 'roles', 'permissions', 'variants', 'inventory'];
const actions = ['create', 'read', 'update', 'delete'];

const permissionsByRole = {
  admin: resources.flatMap(resource => actions.map(action => `${resource}:${action}:any`)),
  sales: [
    'products:read:any',
    'users:read:own',
    'orders:create:any',
    'orders:read:own',
    'orders:update:own',
    'customers:read:own',
    'variants:read:any',
    'inventory:read:any'
  ],
  user: [
    'products:read:any',
    'users:read:own',
    'orders:create:own',
    'orders:read:own',
    'orders:update:own',
    'customers:create:own',
    'customers:read:own',
    'customers:update:own'
  ]
};

async function seedRbac() {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const [name, keys] of Object.entries(permissionsByRole)) {
    const [role] = await Role.findOrCreate({
      where: { name },
      defaults: { description: `Rol ${name} del sistema` }
    });

    const permissionRecords = await Promise.all(keys.map(async key => {
      const [permission] = await Permission.findOrCreate({
        where: { key },
        defaults: { description: `Permite ${key.replaceAll(':', ' ')}` }
      });
      return permission;
    }));

    // Agrega las relaciones definidas por la matriz sin borrar asignaciones existentes.
    await role.addPermissions(permissionRecords);
  }
}

seedRbac()
  .then(async () => {
    console.log('Roles, permisos y relaciones RBAC cargados.');
    await sequelize.close();
  })
  .catch(async error => {
    console.error('No se pudo cargar la matriz RBAC.', error);
    await sequelize.close();
    process.exitCode = 1;
  });
