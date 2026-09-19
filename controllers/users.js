const users = Object.freeze([
  Object.freeze({ id: 1, first_name: 'Ana', last_name: 'Ejemplo', email: 'ana@example.com', role_id: 1 }),
  Object.freeze({ id: 2, first_name: 'Luis', last_name: 'Ejemplo', email: 'luis@example.com', role_id: 1 }),
]);

function findUser(id) {
  return users.find(user => String(user.id) === id);
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo debe ser un objeto JSON';
  }
  for (const field of ['first_name', 'last_name', 'email']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `El ${field} es obligatorio y debe ser un texto no vacío`;
    }
  }
  if (!Number.isSafeInteger(body.role_id) || body.role_id <= 0) {
    return 'El role_id debe ser un entero positivo';
  }
  return null;
}

function publicUser(id, body) {
  return { id, first_name: body.first_name, last_name: body.last_name, email: body.email, role_id: body.role_id };
}

function notFound(res) {
  return res.status(404).json({ message: 'Usuario no encontrado', data: null });
}

function list(req, res) {
  res.json({ message: 'Lista de usuarios', data: users });
}

function find(req, res) {
  const user = findUser(req.params.id);
  if (!user) return notFound(res);
  res.json({ message: 'Usuario encontrado', data: user });
}

function create(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
  res.status(201).json({ message: 'Creación de usuario simulada', data: publicUser(3, req.body) });
}

function update(req, res) {
  const user = findUser(req.params.id);
  if (!user) return notFound(res);
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
  res.json({ message: 'Actualización de usuario simulada', data: publicUser(user.id, req.body) });
}

function destroy(req, res) {
  if (!findUser(req.params.id)) return notFound(res);
  res.json({ message: 'Eliminación de usuario simulada', data: null });
}

module.exports = { list, find, create, update, destroy };
