const roles = Object.freeze([
  Object.freeze({ id: 1, name: 'Vendedor', description: 'Consulta y administra sus pedidos asignados' }),
  Object.freeze({ id: 2, name: 'Operaciones', description: 'Controla inventario y prepara pedidos' }),
  Object.freeze({ id: 3, name: 'Administrador', description: 'Acceso total al catalogo y a la operacion' }),
  Object.freeze({ id: 4, name: 'Cliente', description: 'Consulta el catalogo y da seguimiento a sus pedidos' }),
]);

function findRole(id) {
  return roles.find(role => String(role.id) === id);
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo debe ser un objeto JSON';
  }
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return 'El name es obligatorio y debe ser un texto no vacio';
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return 'El description debe ser un texto';
  }
  return null;
}

function publicRole(id, body) {
  return {
    id,
    name: body.name,
    description: typeof body.description === 'string' ? body.description : '',
  };
}

function notFound(res) {
  return res.status(404).json({ message: 'Rol no encontrado', data: null });
}

function list(req, res) {
  res.json({ message: 'Lista de roles', data: roles });
}

function find(req, res) {
  const role = findRole(req.params.id);
  if (!role) return notFound(res);
  res.json({ message: 'Rol encontrado', data: role });
}

function create(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
  res.status(201).json({ message: 'Creacion de rol simulada', data: publicRole(5, req.body) });
}

function update(req, res) {
  const role = findRole(req.params.id);
  if (!role) return notFound(res);
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
  res.json({ message: 'Actualizacion de rol simulada', data: publicRole(role.id, req.body) });
}

function destroy(req, res) {
  if (!findRole(req.params.id)) return notFound(res);
  res.json({ message: 'Eliminacion de rol simulada', data: null });
}

module.exports = { list, find, create, update, destroy };