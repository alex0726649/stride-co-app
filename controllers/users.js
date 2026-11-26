const { Validator } = require('sequelize');
const { User, Role } = require('../models/relationals');
const { hashPassword } = require('../utils/password');
const response = require('../utils/response');

const withRole = { include: { model: Role, as: 'role' } };
const publicFields = ['id', 'first_name', 'last_name', 'email', 'role_id'];
const accountFields = ['first_name', 'last_name', 'email', 'role_id'];
const writableFields = [...accountFields, 'password'];
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

function validateBody(body, creating) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || !writableFields.some(field => Object.hasOwn(body, field))) return 'users.invalidBody';

  for (const field of ['first_name', 'last_name']) {
    if ((creating || Object.hasOwn(body, field)) && !isValidText(body[field], 100)) {
      return 'users.invalidBody';
    }
  }
  if ((creating || Object.hasOwn(body, 'email'))
    && (!isValidText(body.email, 150) || !Validator.isEmail(body.email))) return 'users.invalidBody';
  if ((creating || Object.hasOwn(body, 'role_id')) && !isPositiveId(body.role_id)) return 'users.invalidRole';
  if ((creating || Object.hasOwn(body, 'password'))
    && (typeof body.password !== 'string' || !body.password.trim())) return 'users.invalidPassword';

  return null;
}

async function userValues(body) {
  const values = {};
  for (const field of accountFields) {
    if (Object.hasOwn(body, field)) values[field] = body[field];
  }
  if (Object.hasOwn(body, 'password')) {
    const { securePassword, saltKey } = await hashPassword(body.password);
    values.password_hash = securePassword;
    values.salt_key = saltKey;
  }
  return values;
}

function writeError(error, req, res, next) {
  if (error.name === 'SequelizeUniqueConstraintError') return response.badRequest(res, req.__('users.emailTaken'));
  if (error.name === 'SequelizeForeignKeyConstraintError') return response.badRequest(res, req.__('users.invalidRole'));
  if (error.name === 'SequelizeValidationError') return response.badRequest(res, req.__('users.invalidBody'));
  return next(error);
}

async function list(req, res, next) {
  try {
    const users = await User.findAll({ ...withRole, attributes: publicFields });
    return response.success(res, req.__('users.list'), users);
  } catch (error) {
    return next(error);
  }
}

async function find(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('users.invalidId'));

  try {
    const user = await User.findByPk(id, withRole);
    if (!user) return response.notFound(res, req.__('users.notFound'));
    return response.success(res, req.__('users.found'), user);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  const errorKey = validateBody(req.body, true);
  if (errorKey) return response.badRequest(res, req.__(errorKey));

  try {
    const role = await Role.findByPk(req.body.role_id);
    if (!role) return response.badRequest(res, req.__('users.invalidRole'));

    const user = await User.create(await userValues(req.body));
    user.setDataValue('role', role);
    return response.created(res, req.__('users.created'), user);
  } catch (error) {
    return writeError(error, req, res, next);
  }
}

async function update(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('users.invalidId'));

  try {
    const user = await User.findByPk(id, withRole);
    if (!user) return response.notFound(res, req.__('users.notFound'));

    const errorKey = validateBody(req.body, false);
    if (errorKey) return response.badRequest(res, req.__(errorKey));

    let role;
    if (Object.hasOwn(req.body, 'role_id')) {
      role = await Role.findByPk(req.body.role_id);
      if (!role) return response.badRequest(res, req.__('users.invalidRole'));
    }

    await user.update(await userValues(req.body));
    if (role) user.setDataValue('role', role);
    return response.success(res, req.__('users.updated'), user);
  } catch (error) {
    return writeError(error, req, res, next);
  }
}

async function destroy(req, res, next) {
  const { id } = req.params;
  if (!isValidRouteId(id)) return response.badRequest(res, req.__('users.invalidId'));

  try {
    const user = await User.findByPk(id, withRole);
    if (!user) return response.notFound(res, req.__('users.notFound'));
    await user.destroy();
    return response.success(res, req.__('users.deleted'), user);
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, find, create, update, destroy };
