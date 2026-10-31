const { jest: mock } = require('@jest/globals');

mock.mock('../utils/rbac', () => ({
  loadRoleAccess: mock.fn(),
}));

const { Customer, Order } = require('../models/documents');
const { authorize } = require('../middlewares/authorize');
const { loadRoleAccess } = require('../utils/rbac');

function requestContext(overrides = {}) {
  return {
    user: { id: 7, role_id: 2 },
    params: {},
    body: {},
    ...overrides,
  };
}

function responseContext() {
  const res = {
    status: mock.fn(),
    json: mock.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

function accessFor(roleName, permissions) {
  const grants = permissions.map(permission => {
    const [resource, action, possession] = permission.split(':');
    return { role: roleName, resource, action: `${action}:${possession}`, attributes: '*' };
  });

  const { AccessControl } = require('accesscontrol');
  return { roleName, accessControl: new AccessControl(grants) };
}

describe('authorize middleware', () => {
  beforeEach(() => {
    loadRoleAccess.mockReset();
    Customer.findById.mockReset();
    Order.findById.mockReset();
  });

  it('permite una operación any concedida por el rol', async () => {
    loadRoleAccess.mockResolvedValue(accessFor('admin', ['products:read:any']));
    const req = requestContext();
    const res = responseContext();
    const next = mock.fn();

    await authorize('products', 'read', 'any')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.rbac).toEqual({ resource: 'products', action: 'read', possession: 'any' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el rol no tiene el permiso any', async () => {
    loadRoleAccess.mockResolvedValue(accessFor('sales', ['products:read:any']));
    const res = responseContext();

    await authorize('products', 'delete', 'any')(requestContext(), res, mock.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Prohibido', data: null });
  });

  it('valida que un recurso own pertenezca al usuario', async () => {
    loadRoleAccess.mockResolvedValue(accessFor('sales', ['orders:read:own']));
    Order.findById.mockResolvedValue({ salesPersonId: 7, customerId: 'customer-1' });
    const next = mock.fn();

    await authorize('orders', 'read', 'own')(
      requestContext({ params: { id: 'order-1' } }),
      responseContext(),
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('responde 403 para un recurso own de otro usuario', async () => {
    loadRoleAccess.mockResolvedValue(accessFor('sales', ['orders:read:own']));
    Order.findById.mockResolvedValue({ salesPersonId: 99, customerId: 'customer-1' });
    Customer.findById.mockResolvedValue({ userId: 99 });
    const res = responseContext();

    await authorize('orders', 'read', 'own')(
      requestContext({ params: { id: 'order-1' } }),
      res,
      mock.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('responde 401 si no existe usuario autenticado', async () => {
    const res = responseContext();

    await authorize('products', 'read', 'any')({}, res, mock.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(loadRoleAccess).not.toHaveBeenCalled();
  });

  it('rechaza una definición de permiso inválida', () => {
    expect(() => authorize('products', 'list', 'any')).toThrow(TypeError);
  });
});
