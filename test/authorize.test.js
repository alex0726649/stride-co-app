const { jest: jestMock } = require('@jest/globals');
const { authorize, parsePermissionKey, getAuthenticatedUserId } = require('../middleware/authorize');
const { User } = require('../models/relationals');
const { Order } = require('../models/documents');

function authenticatedUser({ id = 7, active = true, roleName = 'user', keys = [] } = {}) {
  return {
    id,
    active,
    role: {
      id: 2,
      name: roleName,
      permissions: keys.map((key, index) => ({ id: index + 1, key }))
    }
  };
}

function requestContext({ id = 7, params = {}, body = {} } = {}) {
  return { user: { id }, params, body };
}

function responseContext() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function loadUser(user) {
  User.findByPk.mockResolvedValue(user);
}

describe('RBAC permission keys and authenticated identity', () => {
  it('accepts only resource:action:possession keys', () => {
    expect(parsePermissionKey('orders:read:own')).toEqual({
      resource: 'orders', action: 'read', possession: 'own'
    });
    expect(parsePermissionKey('orders.read.own')).toBeNull();
    expect(parsePermissionKey('orders:execute:any')).toBeNull();
    expect(parsePermissionKey('orders:read:any:extra')).toBeNull();
  });

  it('extracts a numeric ID from supported authenticated-user claims', () => {
    expect(getAuthenticatedUserId({ id: 7 })).toBe(7);
    expect(getAuthenticatedUserId({ sub: '8' })).toBe(8);
    expect(getAuthenticatedUserId({ id: 'invalid' })).toBeNull();
    expect(getAuthenticatedUserId(null)).toBeNull();
  });
});

describe('authorize middleware', () => {
  beforeEach(() => {
    User.findByPk = jestMock.fn();
    Order.findById = jestMock.fn();
  });

  it('returns 401 if the authentication middleware did not attach a user', async () => {
    const req = { params: {}, body: {} };
    const res = responseContext();
    const next = jestMock.fn();

    await authorize('products', 'read', 'any')(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('allows an operation when the role has its any permission in SQL', async () => {
    loadUser(authenticatedUser({ keys: ['products:read:any'] }));
    const req = requestContext();
    const res = responseContext();
    const next = jestMock.fn();

    await authorize('products', 'read', 'any')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.rbac).toEqual({ resource: 'products', action: 'read', possession: 'any' });
    expect(User.findByPk).toHaveBeenCalledWith(7, expect.objectContaining({
      include: expect.any(Array)
    }));
  });

  it('returns 403 if the role does not have the requested permission', async () => {
    loadUser(authenticatedUser({ keys: ['products:read:any'] }));
    const res = responseContext();
    const next = jestMock.fn();

    await authorize('products', 'delete', 'any')(requestContext(), res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an any delete permission assigned to the role in SQL', async () => {
    loadUser(authenticatedUser({ roleName: 'admin', keys: ['products:delete:any'] }));
    const req = requestContext({ params: { id: '12' } });
    const res = responseContext();
    const next = jestMock.fn();

    await authorize('products', 'delete', 'any')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.rbac.possession).toBe('any');
  });

  it('allows an own order after checking its persisted customer owner', async () => {
    loadUser(authenticatedUser({ keys: ['orders:read:own'] }));
    const order = {
      customerId: { userId: 7 },
      populate: jestMock.fn().mockResolvedValue(undefined)
    };
    Order.findById.mockReturnValue({
      populate: jestMock.fn().mockResolvedValue(order)
    });
    const req = requestContext({ params: { id: 'order-1' } });
    const res = responseContext();
    const next = jestMock.fn();

    await authorize('orders', 'read', 'own')(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith('order-1');
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.rbac.possession).toBe('own');
  });

  it('denies an order owned by a different user even if own read is granted', async () => {
    loadUser(authenticatedUser({ keys: ['orders:read:own'] }));
    const order = { customerId: { userId: 99 } };
    Order.findById.mockReturnValue({ populate: jestMock.fn().mockResolvedValue(order) });
    const res = responseContext();
    const next = jestMock.fn();

    await authorize('orders', 'read', 'own')(
      requestContext({ params: { id: 'other-order' } }), res, next
    );

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('denies own access when the DB role is missing or inactive', async () => {
    loadUser(authenticatedUser({ active: false, keys: ['products:read:any'] }));
    const res = responseContext();
    const next = jestMock.fn();

    await authorize('products', 'read', 'any')(requestContext(), res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
