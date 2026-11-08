// Carga la matriz RBAC de database/rbac-matrix.json en las tablas
// roles, permissions y role_permission.
//
// Se ejecuta a mano con: npm run seed:rbac
// La aplicación NUNCA importa este archivo ni el JSON: en tiempo de ejecución
// los permisos se leen de la base de datos, que es la fuente de verdad.
const { sequelize, Role, Permission } = require('../models/relationals');
const matrix = require('./rbac-matrix.json');

// recurso:acción:alcance, por ejemplo orders:read:own
const KEY_FORMAT = /^[a-z]+:(create|read|update|delete):(own|any)$/;

async function seedRbac() {
  await sequelize.authenticate();
  await sequelize.sync(); // crea las tablas si todavía no existen

  await sequelize.transaction(async (transaction) => {
    //Roles
    const roles = new Map();
    for (const { name, description } of matrix.roles) {
      const [role] = await Role.findOrCreate({ where: { name }, defaults: { description }, transaction });
      roles.set(name, { role, permissions: [] });
    }

    // Permisos, anotando a qué roles se asigna cada uno
    for (const { key, description, roles: roleNames } of matrix.permissions) {
      if (!KEY_FORMAT.test(key)) {
        throw new Error(`Key con formato inválido: "${key}" (se espera recurso:acción:alcance)`);
      }
      const [permission] = await Permission.findOrCreate({ where: { key }, defaults: { description }, transaction });

      for (const name of roleNames) {
        if (!roles.has(name)) {
          throw new Error(`El permiso "${key}" menciona el rol "${name}", que no está en la lista de roles`);
        }
        roles.get(name).permissions.push(permission);
      }
    }
    // role_permission: setPermissions deja a cada rol con EXACTAMENTE
    // los permisos de la matriz (agrega los que faltan y quita los sobrantes).
    for (const { role, permissions } of roles.values()) {
      await role.setPermissions(permissions, { transaction });
      console.log(`  ${role.name}: ${permissions.length} permisos`);
    }
  });
}

seedRbac()
  .then(() => console.log('Matriz RBAC cargada en roles, permissions y role_permission.'))
  .catch((error) => {
    console.error('No se pudo cargar la matriz RBAC:', error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
