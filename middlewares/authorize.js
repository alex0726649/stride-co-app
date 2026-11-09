const { Customer, Order } = require('../models/documents');
const { loadRoleAccess, canManageAssignedOrders } = require('../utils/rbac');

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

async function ownsResource(resource, action, req, userId, roleAccess) {
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
      // Solo cuenta el customer real en la BD; nunca un salesPersonId enviado en el body.
      return customerBelongsToUser(req.body?.customerId, userId);
    }

    const order = resourceId ? await Order.findById(resourceId) : null;
    if (!order) return false;

    const managesAssignedOrders = canManageAssignedOrders(roleAccess);
    const belongsToSalesPerson = managesAssignedOrders && sameId(order.salesPersonId, userId);
    if (action === 'update') {
      if (!belongsToSalesPerson) return false;
      if (req.body?.salesPersonId !== undefined
        && !sameId(req.body.salesPersonId, userId)) return false;
      if (req.body?.customerId !== undefined
        && !(await customerBelongsToUser(req.body.customerId, userId))) return false;
      return true;
    }

    if (managesAssignedOrders) return belongsToSalesPerson;
    return customerBelongsToUser(order.customerId, userId);
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
      return response(res, 401, req.__('errors.unauthorized'));
    }

    try {
      const roleAccess = await loadRoleAccess(roleId);
      // Rol inexistente, o rol sin ningún permiso (accesscontrol no lo registra): 403.
      if (!roleAccess || !roleAccess.accessControl.hasRole(roleAccess.roleName)) {
        return response(res, 403, req.__('errors.forbidden'));
      }

      const checker = roleAccess.accessControl.can(roleAccess.roleName);
      const anyPermission = checker[`${action}Any`](resource).granted;
      const ownPermission = checker[`${action}Own`](resource).granted;

      if (possession === 'any' && !anyPermission) {
        return response(res, 403, req.__('errors.forbidden'));
      }

      if (possession === 'own' && !anyPermission
        && (!ownPermission || !(await ownsResource(resource, action, req, userId, roleAccess)))) {
        return response(res, 403, req.__('errors.forbidden'));
      }

      req.rbac = { resource, action, possession };
      if (resource === 'orders') req.rbac.scope = anyPermission ? 'any' : 'own';
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { authorize, getUserId, ownsResource };