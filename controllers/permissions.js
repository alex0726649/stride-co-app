const permissions = Object.freeze([
  Object.freeze({ id: 1, key: 'products.manage', description: 'Publicar, editar y despublicar productos del catalogo' }),
  Object.freeze({ id: 2, key: 'inventory.manage', description: 'Registrar entradas de mercancia y ajustar existencias' }),
  Object.freeze({ id: 3, key: 'orders.read.own', description: 'Consultar unicamente los pedidos asignados al vendedor' }),
  Object.freeze({ id: 4, key: 'orders.read.all', description: 'Consultar todos los pedidos de la tienda' }),
  Object.freeze({ id: 5, key: 'orders.status.update', description: 'Actualizar el estado de un pedido' }),
]);

function findPermission(id) {
  return permissions.find(permission => String(permission.id) === id);
}

function validate(body, currentId) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo debe ser un objeto JSON';
  }
  for (const field of ['key', 'description']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `El ${field} es obligatorio y debe ser un texto no vacio`;
    }
  }
  const duplicated = permissions.find(permission => permission.key === body.key.trim());
  if (duplicated && duplicated.id !== currentId) {
    return 'El key ya esta registrado y debe ser unico';
  }
  return null;
}

function publicPermission(id, body) {
  return { id, key: body.key.trim(), description: body.description.trim() };
}

function notFound(res) {
  return res.status(404).json({ message: 'Permiso no encontrado', data: null });
}

function list(req, res) {
  res.json({ message: 'Lista de permisos', data: permissions });
}

function find(req, res) {
  const permission = findPermission(req.params.id);
  if (!permission) return notFound(res);
  res.json({ message: 'Permiso encontrado', data: permission });
}

function create(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
  res.status(201).json({ message: 'Creacion de permiso simulada', data: publicPermission(6, req.body) });
}

function update(req, res) {
  const permission = findPermission(req.params.id);
  if (!permission) return notFound(res);
  const error = validate(req.body, permission.id);
  if (error) return res.status(400).json({ message: error, data: null });
  res.json({ message: 'Actualizacion de permiso simulada', data: publicPermission(permission.id, req.body) });
}

function destroy(req, res) {
  if (!findPermission(req.params.id)) return notFound(res);
  res.json({ message: 'Eliminacion de permiso simulada', data: null });
}

module.exports = { list, find, create, update, destroy };