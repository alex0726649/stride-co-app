const { Role, Permission } = require('../models/relationals');
const matrix = require('./rbac-matrix.json');

// recurso:acción:alcance, por ejemplo orders:read:own
const KEY_FORMAT = /^[a-z]+:(create|read|update|delete):(own|any)$/;

async function loadRbacMatrix(transaction) {
  const roles = new Map();
  for (const { name, description } of matrix.roles) {
    const [role] = await Role.findOrCreate({ where: { name }, defaults: { description }, transaction });
    roles.set(name, { role, permissions: [] });
  }

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

  for (const { role, permissions } of roles.values()) {
    await role.setPermissions(permissions, { transaction });
  }

  return roles;
}

module.exports = loadRbacMatrix;
