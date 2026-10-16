const { User, Role, Permission } = require('../models/relationals');
const { Order, Customer } = require('../models/documents');

const ACTIONS = new Set(['create', 'read', 'update', 'delete']);
const POSSESSIONS = new Set(['own', 'any']);

function unauthorized(res) {
  return res.status(401).json({ message: 'No autorizado', data: null });
}

function forbidden(res) {
  return res.status(403).json({ message: 'Prohibido', data: null });
}

function getAuthenticatedUserId(user) {
  if (!user || typeof user !== 'object') return null;

  const value = user.id ?? user.userId ?? user.user_id ?? user.sub;
  if (value === undefined || value === null || value === '') return null;

  const numericId = Number(value);
  return Number.isSafeInteger(numericId) && numericId > 0 ? numericId : null;
}

function parsePermissionKey(key) {
  if (typeof key !== 'string') return null;

  const [resource, action, possession, ...extra] = key.split(':');
  if (!resource || !ACTIONS.has(action) || !POSSESSIONS.has(possession) || extra.length) {
    return null;
  }

  return { resource, action, possession };
}

async function buildAccessControl(permissions) {
  const { AccessControl } = await import('accesscontrol');
  const accessControl = new AccessControl();

  for (const permission of permissions) {
    const parsed = parsePermissionKey(permission.key);
    if (!parsed) continue;

    const grant = accessControl.grant(permission.roleName);
    const grantMethod = `${parsed.action}${parsed.possession === 'any' ? 'Any' : 'Own'}`;
    grant[grantMethod](parsed.resource);
  }

  return accessControl;
}

async function findAuthenticatedUser(userId) {
  return User.findByPk(userId, {
    attributes: ['id', 'active'],
    include: [{
      model: Role,
      as: 'role',
      attributes: ['id', 'name'],
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'key'],
        through: { attributes: [] }
      }]
    }]
  });
}

async function ownsResource(resource, action, req, userId) {
  const resourceId = req.params.id;

  if (resource === 'users') {
    return resourceId !== undefined && String(resourceId) === String(userId);
  }

  if (resource === 'customers') {
    if (action === 'create') {
      return String(req.body?.userId) === String(userId);
    }

    if (!resourceId) return false;
    const customer = await Customer.findById(resourceId).select('userId');
    if (!customer || String(customer.userId) !== String(userId)) return false;
    if (action === 'update' && req.body?.userId !== undefined) {
      return String(req.body.userId) === String(userId);
    }
    return true;
  }

  if (resource === 'orders') {
    if (action === 'create') {
      if (!req.body?.customerId) return false;
      const customer = await Customer.findById(req.body.customerId).select('userId');
      return Boolean(customer && String(customer.userId) === String(userId));
    }

    if (!resourceId) return false;
    const order = await Order.findById(resourceId).populate('customerId', 'userId');
    const ownerId = order?.customerId?.userId;
    if (ownerId === undefined || String(ownerId) !== String(userId)) return false;
    if (action === 'update' && req.body?.customerId !== undefined) {
      const targetCustomer = await Customer.findById(req.body.customerId).select('userId');
      return Boolean(targetCustomer && String(targetCustomer.userId) === String(userId));
    }
    return true;
  }

  return false;
}

function authorize(resource, action, possession) {
  if (!resource || !ACTIONS.has(action) || !POSSESSIONS.has(possession)) {
    throw new TypeError('Permiso RBAC inválido: se esperaba resource:action:possession');
  }

  return async function rbacAuthorization(req, res, next) {
    const userId = getAuthenticatedUserId(req.user);
    if (!userId) return unauthorized(res);

    try {
      const user = await findAuthenticatedUser(userId);
      if (!user || !user.active) return unauthorized(res);
      if (!user.role) return forbidden(res);

      const permissions = (user.role.permissions || []).map(permission => ({
        key: permission.key,
        roleName: user.role.name
      }));
      const accessControl = await buildAccessControl(permissions);
      const roleName = user.role.name;
      const checker = accessControl.can(roleName);
      const anyMethod = `${action}Any`;
      const ownMethod = `${action}Own`;
      const hasAny = checker[anyMethod](resource).granted;
      const hasOwn = checker[ownMethod](resource).granted;

      if (possession === 'any') {
        if (!hasAny) return forbidden(res);
      } else if (!hasAny) {
        if (!hasOwn || !(await ownsResource(resource, action, req, userId))) {
          return forbidden(res);
        }
      }

      req.rbac = { resource, action, possession: hasAny ? 'any' : 'own' };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { authorize, parsePermissionKey, getAuthenticatedUserId };
