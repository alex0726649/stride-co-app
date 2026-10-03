const { Permission } = require('../models/relationals');

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo debe ser un objeto JSON';
  }

  for (const field of ['key', 'description']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `El ${field} es obligatorio y debe ser un texto no vacio`;
    }
  }

  return null;
}

function notFound(res) {
  return res.status(404).json({
    message: 'Permiso no encontrado',
    data: null
  });
}

async function list(req, res) {
  const permissions = await Permission.findAll();

  res.json({
    message: 'Lista de permisos',
    data: permissions
  });
}

async function find(req, res) {
  const permission = await Permission.findByPk(req.params.id);

  if (!permission) return notFound(res);

  res.json({
    message: 'Permiso encontrado',
    data: permission
  });
}

async function create(req, res) {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error, data: null });
  }

  const permission = await Permission.create({
    key: req.body.key.trim(),
    description: req.body.description.trim()
  });

  res.status(201).json({
    message: 'Permiso creado',
    data: permission
  });
}

async function update(req, res) {
  const permission = await Permission.findByPk(req.params.id);

  if (!permission) return notFound(res);

  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error, data: null });
  }

  await permission.update({
    key: req.body.key.trim(),
    description: req.body.description.trim()
  });

  res.json({
    message: 'Permiso actualizado',
    data: permission
  });
}

async function destroy(req, res) {
  const permission = await Permission.findByPk(req.params.id);

  if (!permission) return notFound(res);

  await permission.destroy();

  res.json({
    message: 'Permiso eliminado',
    data: null
  });
}

module.exports = { list, find, create, update, destroy };