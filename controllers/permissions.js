const { Permission, Role } = require('../models/relationals');
const { parsePermissionKey } = require('../utils/rbac');
const response = require('../utils/response');

// Cada permiso se devuelve con los roles que lo tienen, sin la tabla intermedia.
const withRoles = {
  include: { model: Role, as: 'roles', attributes: ['id', 'name'], through: { attributes: [] } },
};
const writableFields = ['key', 'description'];
const MAX_POSTGRES_INTEGER = 2_147_483_647;

function isValidRouteId(id) {
  return /^[1-9]\d*$/.test(id) && Number(id) <= MAX_POSTGRES_INTEGER;
}

// La key debe tener el formato recurso:acción:alcance que entiende el RBAC
// (utils/rbac.js); una key con otro formato se ignoraría sin dar acceso.
function isValidKey(key) {
  return typeof key === 'string' && key.length <= 100 && parsePermissionKey(key.trim()) !== null;
}

function isValidDescription(value) {
  return typeof value === 'string' && value.trim() !== '' && value.length <= 255;
}

// Devuelve la clave de traducción del error, o null si el cuerpo es válido.
// Al crear, key y description son obligatorios; al actualizar solo se valida lo que llega.
function validateBody(body, creating) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || !writableFields.some(field => Object.hasOwn(body, field))) return 'permissions.invalidBody';

  if ((creating || Object.hasOwn(body, 'key')) && !isValidKey(body.key)) return 'permissions.invalidKey';
  if ((creating || Object.hasOwn(body, 'description')) && !isValidDescription(body.description)) {
    return 'permissions.invalidBody';
  }
  return null;
}

function permissionValues(body) {
  const values = {};
  for (const field of writableFields) {
    if (Object.hasOwn(body, field)) values[field] = body[field].trim();
  }
  return values;
}

function writeError(error, req, res, next) {
  if (error.name === 'SequelizeUniqueConstraintError') return response.badRequest(res, req.__('permissions.keyTaken'));
  if (error.name === 'SequelizeValidationError') return response.badRequest(res, req.__('permissions.invalidBody'));
  return next(error);
}

async function list(req, res, next) {
  try {
    const permissions = await Permission.findAll(withRoles);
    return response.success(res, req.__('permissions.list'), permissions);
  } catch (error) {
    return next(error);
  }
}

async function find(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('permissions.invalidId'));

  try {
    const permission = await Permission.findByPk(id, withRoles);
    if (!permission) return response.notFound(res, req.__('permissions.notFound'));
    return response.success(res, req.__('permissions.found'), permission);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  const errorKey = validateBody(req.body, true);
  if (errorKey) return response.badRequest(res, req.__(errorKey));

  try {
    const permission = await Permission.create(permissionValues(req.body));
    return response.created(res, req.__('permissions.created'), permission);
  } catch (error) {
    return writeError(error, req, res, next);
  }
}

async function update(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('permissions.invalidId'));

  try {
    const permission = await Permission.findByPk(id, withRoles);
    if (!permission) return response.notFound(res, req.__('permissions.notFound'));

    const errorKey = validateBody(req.body, false);
    if (errorKey) return response.badRequest(res, req.__(errorKey));

    await permission.update(permissionValues(req.body));
    return response.success(res, req.__('permissions.updated'), permission);
  } catch (error) {
    return writeError(error, req, res, next);
  }
}

async function destroy(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('permissions.invalidId'));

  try {
    const permission = await Permission.findByPk(id, withRoles);
    if (!permission) return response.notFound(res, req.__('permissions.notFound'));

    // Borrarlo quitaría el acceso en silencio a los roles que lo tienen:
    // primero hay que retirarlo de esos roles con PUT /api/roles/:id.
    if (await permission.countRoles() > 0) {
      return response.badRequest(res, req.__('permissions.inUse'));
    }

    await permission.destroy();
    return response.success(res, req.__('permissions.deleted'), permission);
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, find, create, update, destroy };
