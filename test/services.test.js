const { jest: mock } = require('@jest/globals');
const { Op } = require('sequelize');
const { Product, Inventory, User } = require('../models/relationals');
const products = require('../services/product.service');
const inventory = require('../services/inventory.service');
const auth = require('../services/auth.service');

afterEach(() => {
  for (const method of ['findAll', 'update']) {
    if (mock.isMockFunction(Inventory[method])) Inventory[method].mockRestore();
  }
});

describe('catálogo compartido', () => {
  it('filtra activos, nombre/marca y categoría, y limita la página al total', async () => {
    Product.count.mockResolvedValue(13);
    Product.findAll.mockResolvedValue([{ id: 13 }]);
    const result = await products.listActive({ q: 'Runner', category: 'Running', page: '999' });
    expect(result).toEqual({ products: [{ id: 13 }], page: 2, totalPages: 2, total: 13 });
    const options = Product.findAll.mock.calls[0][0];
    expect(options).toMatchObject({ where: { active: true, category_id: 'Running' }, limit: 12, offset: 12 });
    expect(options.where[Op.or]).toEqual([
      { name: { [Op.iLike]: '%Runner%' } }, { brand: { [Op.iLike]: '%Runner%' } },
    ]);
    expect(Product.count).toHaveBeenCalledWith({ where: options.where });
  });

  it.each(['abc', '-1', '0', '1.5', Infinity, {}, []])('normaliza una página inválida: %p', async page => {
    expect(await products.listActive({ page })).toMatchObject({ page: 1, totalPages: 1, total: 0 });
    expect(Product.findAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
  });

  it('escapa comodines de búsqueda y devuelve categorías de productos activos', async () => {
    await products.listActive({ q: '50%_off' });
    expect(Product.count.mock.calls[0][0].where[Op.or][0].name[Op.iLike]).toBe('%50\\%\\_off%');
    Product.findAll.mockResolvedValue([{ category_id: 'Running' }, { category_id: 'Urbanos' }]);
    expect(await products.listCategories()).toEqual(['Running', 'Urbanos']);
    expect(Product.findAll).toHaveBeenLastCalledWith(expect.objectContaining({ where: { active: true }, group: ['category_id'] }));
  });

  it('calcula disponibilidad sin mutar los datos y conserva variantes agotadas', async () => {
    const row = { id: 1, active: true, variants: [
      { id: 10, active: true, inventory: { stock: 5, reserved: 2 } },
      { id: 11, active: true, inventory: { stock: 2, reserved: 2 } },
      { id: 12, active: false, inventory: { stock: 9, reserved: 0 } },
      { id: 13, active: true, inventory: null },
    ] };
    Product.findByPk.mockResolvedValue(Product.build(row, { include: [{ association: 'variants', include: ['inventory'] }] }));
    const result = await products.findActiveById('1');
    expect(result.variants.map(v => [v.id, v.available])).toEqual([[10, 3], [11, 0], [13, 0]]);
    expect(row.variants[0]).not.toHaveProperty('available');
    expect(Product.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({ include: [expect.objectContaining({ required: false, where: { active: true }, include: ['inventory'] })] }));
  });

  it.each(['abc', '0', '2147483648'])('detalle inválido devuelve 404 sin consultar: %s', async id => {
    await expect(products.findActiveById(id)).rejects.toMatchObject({ status: 404 });
    expect(Product.findByPk).not.toHaveBeenCalled();
  });

  it.each([null, { id: 1, active: false }])('oculta productos inexistentes o inactivos: %p', async row => {
    Product.findByPk.mockResolvedValue(row);
    await expect(products.findActiveById(1)).rejects.toMatchObject({ status: 404, messageKey: 'products.notFound' });
  });

  it('desactiva sin destruir el producto y permite reactivarlo al editar', async () => {
    const row = { update: mock.fn(), destroy: mock.fn() };
    Product.findByPk.mockResolvedValue(row);
    await products.deactivate(1);
    expect(row.update).toHaveBeenCalledWith({ active: false });
    expect(row.destroy).not.toHaveBeenCalled();
    await products.update(1, { name: 'Runner', description: 'Demo', brand: 'Stride', price: 100, active: true, id: 99 });
    expect(row.update).toHaveBeenLastCalledWith({ name: 'Runner', description: 'Demo', brand: 'Stride', price: 100, active: true });
  });
});

describe('inventario para las vistas', () => {
  it('incluye variante/producto y calcula disponible en el servicio', async () => {
    mock.spyOn(Inventory, 'findAll').mockResolvedValue([Inventory.build({ id: 1, variant_id: 42, stock: 7, reserved: 3 })]);
    expect(await inventory.list()).toEqual([expect.objectContaining({ variant_id: 42, available: 4 })]);
    expect(Inventory.findAll).toHaveBeenCalledWith(expect.objectContaining({ include: [{ association: 'variant', include: ['product'] }] }));
  });

  it('actualiza por variant_id y descarta campos ajenos al ajuste', async () => {
    mock.spyOn(Inventory, 'update').mockResolvedValue([1, [{ id: 7, variant_id: 42, stock: 5, reserved: 1 }]]);
    expect(await inventory.update('42', { stock: 5, reserved: 1, id: 99 })).toMatchObject({ id: 7, variant_id: 42 });
    expect(Inventory.update).toHaveBeenCalledWith({ stock: 5, reserved: 1 }, expect.objectContaining({ where: { variant_id: '42' } }));
  });

  it('rechaza cantidades inválidas antes de escribir y devuelve 404 si falta inventario', async () => {
    const write = mock.spyOn(Inventory, 'update').mockResolvedValue([0, []]);
    await expect(inventory.update(42, { stock: 1, reserved: 2 })).rejects.toMatchObject({ status: 400, messageKey: 'inventory.excessReserved' });
    expect(write).not.toHaveBeenCalled();
    await expect(inventory.update(42, { stock: 0, reserved: 0 })).rejects.toMatchObject({ status: 404 });
  });
});

it('el servicio de auth devuelve errores HTTP sin depender del idioma ni del transporte', async () => {
  await expect(auth.login({})).rejects.toMatchObject({ status: 400, messageKey: 'auth.requiredCredentials' });
  expect(User.findOne).not.toHaveBeenCalled();
  await expect(auth.login({ email: 'demo@example.com', password: 'incorrecta' })).rejects.toMatchObject({ status: 401, messageKey: 'auth.invalidCredentials' });
});
