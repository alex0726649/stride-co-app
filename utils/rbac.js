/*Puente entre la base de datos y la librería accesscontrol.
 Aquí no hay ningún permiso escrito a mano: todo sale de la base de datos.*/
const { AccessControl } = require('accesscontrol');
const { Role, Permission } = require('../models/relationals');

const KEY_FORMAT = /^([a-z]+):(create|read|update|delete):(own|any)$/;

/*'orders:read:own' -> { resource: 'orders', action: 'read', possession: 'own' }
 Devuelve null si la key no respeta la convención.*/
function parsePermissionKey(key) {
  const match = KEY_FORMAT.exec(key);
  if (!match) return null;

  const [, resource, action, possession] = match;
  return { resource, action, possession };
}

/*Convierte el nombre del rol y sus keys en una instancia de AccessControl.
Las keys con formato inválido se ignoran (con aviso) en lugar de tumbar la API.*/
function buildAccessControl(roleName, keys) {
  const grants = [];

  for (const key of keys) {
    const parsed = parsePermissionKey(key);
    if (!parsed) {
      console.warn(`[rbac] Permission.key ignorada por formato inválido: "${key}"`);
      continue;
    }

    grants.push({
      role: roleName,
      resource: parsed.resource,
      action: `${parsed.action}:${parsed.possession}`, // formato de accesscontrol: 'read:own'
      attributes: '*',
    });
  }

  return new AccessControl(grants);
}

/* Consulta en la base de datos el rol y sus permisos, y arma su AccessControl.
Se llama en cada petición, así un cambio en role_permission aplica de inmediato.
Devuelve null si el rol no existe.*/
async function loadRoleAccess(roleId) {
  if (!roleId) return null;

  // Sequelize genera: roles JOIN role_permission JOIN permissions
  const role = await Role.findByPk(roleId, {
    attributes: ['id', 'name'],
    include: [{
      model: Permission,
      as: 'permissions',
      attributes: ['key'],
      through: { attributes: [] },
    }],
  });
  if (!role) return null;

  const keys = (role.permissions || []).map(permission => permission.key);
  return {
    roleName: role.name,
    keys,
    accessControl: buildAccessControl(role.name, keys),
  };
}

module.exports = { parsePermissionKey, buildAccessControl, loadRoleAccess };
