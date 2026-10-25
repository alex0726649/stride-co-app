const { jest: mock } = require('@jest/globals');
const { Role } = require('../models/relationals');
const { parsePermissionKey, buildAccessControl, loadRoleAccess } = require('../utils/rbac');

describe('parsePermissionKey', () => {
  it('separa la key en resource, action y possession', () => {
    expect(parsePermissionKey('orders:read:own'))
      .toEqual({ resource: 'orders', action: 'read', possession: 'own' });
  });

  it.each(['orders.read', 'orders:borrar:any', 'orders:read:all', 'orders:read:own:extra', '', null])(
    'rechaza keys que no siguen la convención: %p',
    key => expect(parsePermissionKey(key)).toBeNull()
  );
});

describe('buildAccessControl', () => {
  const ac = buildAccessControl('sales', ['orders:read:own', 'products:read:any']);

  it('concede exactamente los permisos recibidos', () => {
    expect(ac.can('sales').readOwn('orders').granted).toBe(true);
    expect(ac.can('sales').readAny('products').granted).toBe(true);
  });

  it('no concede lo que no está en la lista', () => {
    expect(ac.can('sales').readAny('orders').granted).toBe(false);
    expect(ac.can('sales').deleteAny('products').granted).toBe(false);
  });

  it('un permiso any también cubre own', () => {
    expect(ac.can('sales').readOwn('products').granted).toBe(true);
  });

  it('ignora keys inválidas sin romper las demás', () => {
    const warn = mock.spyOn(console, 'warn').mockImplementation(() => {});
    const partial = buildAccessControl('admin', ['products:borrar:any', 'products:delete:any']);
    expect(partial.can('admin').deleteAny('products').granted).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('loadRoleAccess', () => {
  it('lee el rol y sus permisos desde la base de datos', async () => {
    Role.findByPk.mockResolvedValue({
      id: 2,
      name: 'sales',
      permissions: [{ key: 'orders:read:own' }, { key: 'products:read:any' }],
    });

    const access = await loadRoleAccess(2);

    expect(Role.findByPk).toHaveBeenCalledWith(2, expect.objectContaining({ include: expect.any(Array) }));
    expect(access.roleName).toBe('sales');
    expect(access.keys).toEqual(['orders:read:own', 'products:read:any']);
    expect(access.accessControl.can('sales').readOwn('orders').granted).toBe(true);
    expect(access.accessControl.can('sales').readAny('orders').granted).toBe(false);
  });

  it('devuelve null si el rol no existe o el usuario no tiene rol', async () => {
    Role.findByPk.mockResolvedValue(null);
    expect(await loadRoleAccess(99)).toBeNull();
    expect(await loadRoleAccess(null)).toBeNull();
  });
});
