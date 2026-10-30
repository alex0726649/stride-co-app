const { Customer, Order } = require('../models/documents');
const { loadRoleAccess } = require('../utils/rbac');

const ACTIONS = new Set(['create', 'read', 'update', 'delete']);
const POSSESSIONS = new Set(['own', 'any']);

function response(res, status, message) {
  return res.status(status).json({ message, data: null });
}

function getUserId(user) {
  if (!user || typeof user !== 'object') return null;

  const value = user.id ?? user.userId ?? user.user_id ?? user.sub;
  if (value === undefined || value === null || value === '') return null;

  return String(value);
}

function sameId(left, right) {
  return left !== undefined && left !== null && String(left) === String(right);
}

async function customerBelongsToUser(customerId, userId) {
  if (!customerId) return false;

  const customer = await Customer.findById(customerId);
  return Boolean(customer && sameId(customer.userId, userId));
}

async function ownsResource(resource, action, req, userId) {
  const resourceId = req.params?.id;

  if (resource === 'users') {
    return action !== 'create' && sameId(resourceId, userId);
  }

  if (resource === 'customers') {
    if (action === 'create') {
      return sameId(req.body?.userId, userId);
    }

    const customer = resourceId ? await Customer.findById(resourceId) : null;
    if (!customer || !sameId(customer.userId, userId)) return false;

    if (action === 'update' && req.body?.userId !== undefined) {
      return sameId(req.body.userId, userId);
    }

    return true;
  }

  if (resource === 'orders') {
    if (action === 'create') {
      return sameId(req.body?.salesPersonId, userId)
        || customerBelongsToUser(req.body?.customerId, userId);
    }

    const order = resourceId ? await Order.findById(resourceId) : null;
    if (!order) return false;

    const belongsToSalesPerson = sameId(order.salesPersonId, userId);
    const belongsToCustomer = await customerBelongsToUser(order.customerId, userId);
    if (!belongsToSalesPerson && !belongsToCustomer) return false;

    if (action === 'update') {
      if (req.body?.salesPersonId !== undefined
        && !sameId(req.body.salesPersonId, userId)) return false;
      if (req.body?.customerId !== undefined
        && !(await customerBelongsToUser(req.body.customerId, userId))) return false;
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
    const userId = getUserId(req.user);
    const roleId = req.user?.role_id ?? req.user?.roleId;

    if (!userId || roleId === undefined || roleId === null) {
      return response(res, 401, 'No autorizado');
    }

    try {
      const roleAccess = await loadRoleAccess(roleId);
      if (!roleAccess) return response(res, 403, 'Prohibido');

      const checker = roleAccess.accessControl.can(roleAccess.roleName);
      const anyPermission = checker[`${action}Any`](resource).granted;
      const ownPermission = checker[`${action}Own`](resource).granted;

      if (possession === 'any' && !anyPermission) {
        return response(res, 403, 'Prohibido');
      }

      if (possession === 'own' && !anyPermission
        && (!ownPermission || !(await ownsResource(resource, action, req, userId)))) {
        return response(res, 403, 'Prohibido');
      }

      req.rbac = { resource, action, possession };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { authorize, getUserId, ownsResource };
