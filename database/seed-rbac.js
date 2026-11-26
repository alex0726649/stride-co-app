// Carga la matriz RBAC de database/rbac-matrix.json en las tablas
// roles, permissions y role_permission.
//
// Se ejecuta a mano con: npm run seed:rbac
const { sequelize } = require('../models/relationals');
const loadRbacMatrix = require('./load-rbac-matrix');

async function seedRbac() {
  await sequelize.authenticate();
  await sequelize.sync(); // crea las tablas si todavía no existen

  const roles = await sequelize.transaction(loadRbacMatrix);
  for (const { role, permissions } of roles.values()) {
    console.log(`  ${role.name}: ${permissions.length} permisos`);
  }
}

seedRbac()
  .then(() => console.log('Matriz RBAC cargada en roles, permissions y role_permission.'))
  .finally(() => sequelize.close())
  .catch((error) => {
    console.error('No se pudo cargar la matriz RBAC:', error.message);
    process.exitCode = 1;
  });
