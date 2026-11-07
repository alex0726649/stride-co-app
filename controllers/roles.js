const { Op } = require('sequelize');
const { Role, Permission, User } = require('../models/relationals');
const response = require('../utils/response');

// Los permisos se devuelven sin las columnas de la tabla intermedia role_permission.
const withPermissions = {
  include: { model: Permission, as: 'permissions', through: { attributes: [] } },
};
const writableFields = ['name', 'description', 'permission_ids'];
const MAX_POSTGRES_INTEGER = 2_147_483_647;

function isPositiveId(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_POSTGRES_INTEGER;
}

function isValidRouteId(id) {
  return /^[1-9]\d*$/.test(id) && isPositiveId(Number(id));
}

function isValidText(value, maxLength) {
  return typeof value === 'string' && value.trim() !== '' && value.length <= maxLength;
}

// Devuelve la clave de traducción del error, o null si el cuerpo es válido.
// Al crear, name es obligatorio; al actualizar solo se valida lo que llega.
function validateBody(body, creating) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || !writableFields.some(field => Object.hasOwn(body, field))) return 'roles.invalidBody';

  if ((creating || Object.hasOwn(body, 'name')) && !isValidText(body.name, 50)) {
    return 'roles.invalidName';
  }
  if (Object.hasOwn(body, 'description') && body.description !== null
    && (typeof body.description !== 'string' || body.description.length > 255)) {
    return 'roles.invalidBody';
  }
  if (Object.hasOwn(body, 'permission_ids')) {
    const ids = body.permission_ids;
    if (!Array.isArray(ids) || !ids.every(isPositiveId) || new Set(ids).size !== ids.length) {
      return 'roles.invalidPermissions';
    }
  }
  return null;
}

function roleValues(body) {
  const values = {};
  if (Object.hasOwn(body, 'name')) values.name = body.name.trim();
  if (Object.hasOwn(body, 'description')) values.description = body.description;
  return values;
}

// Todos los permission_ids deben existir; si no, setPermissions fallaría con un 500.
async function permissionsExist(ids) {
  if (ids.length === 0) return true;
  const found = await Permission.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id'] });
  return found.length === ids.length;
}

function writeError(error, req, res, next) {
  if (error.name === 'SequelizeUniqueConstraintError') return response.badRequest(res, req.__('roles.nameTaken'));
  if (error.name === 'SequelizeForeignKeyConstraintError') return response.badRequest(res, req.__('roles.invalidPermissions'));
  if (error.name === 'SequelizeValidationError') return response.badRequest(res, req.__('roles.invalidBody'));
  return next(error);
}

async function list(req, res, next) {
  try {
    const roles = await Role.findAll(withPermissions);
    return response.success(res, req.__('roles.list'), roles);
  } catch (error) {
    return next(error);
  }
}

async function find(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('roles.invalidId'));

  try {
    const role = await Role.findByPk(id, withPermissions);
    if (!role) return response.notFound(res, req.__('roles.notFound'));
    return response.success(res, req.__('roles.found'), role);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  const errorKey = validateBody(req.body, true);
  if (errorKey) return response.badRequest(res, req.__(errorKey));

  try {
    const ids = req.body.permission_ids;
    if (ids && !(await permissionsExist(ids))) {
      return response.badRequest(res, req.__('roles.invalidPermissions'));
    }

    const role = await Role.create(roleValues(req.body));
    if (ids) await role.setPermissions(ids);

    const saved = await Role.findByPk(role.id, withPermissions);
    return response.created(res, req.__('roles.created'), saved);
  } catch (error) {
    return writeError(error, req, res, next);
  }
}

async function update(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('roles.invalidId'));

  try {
    const role = await Role.findByPk(id);
    if (!role) return response.notFound(res, req.__('roles.notFound'));

    const errorKey = validateBody(req.body, false);
    if (errorKey) return response.badRequest(res, req.__(errorKey));

    const ids = req.body.permission_ids;
    if (ids && !(await permissionsExist(ids))) {
      return response.badRequest(res, req.__('roles.invalidPermissions'));
    }

    await role.update(roleValues(req.body));
    // Si llega el arreglo, reemplaza las asignaciones; [] las quita todas.
    if (ids) await role.setPermissions(ids);

    const saved = await Role.findByPk(role.id, withPermissions);
    return response.success(res, req.__('roles.updated'), saved);
  } catch (error) {
    return writeError(error, req, res, next);
  }
}

async function destroy(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('roles.invalidId'));

  try {
    const role = await Role.findByPk(id, withPermissions);
    if (!role) return response.notFound(res, req.__('roles.notFound'));

    // Borrar un rol con usuarios los dejaría sin rol (role_id NULL) y sin acceso.
    const assignedUsers = await User.count({ where: { role_id: role.id } });
    if (assignedUsers > 0) return response.badRequest(res, req.__('roles.inUse'));

    await role.destroy();
    return response.success(res, req.__('roles.deleted'), role);
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, find, create, update, destroy };
