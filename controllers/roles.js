const { Role, Permission } = require('../models/relationals');



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
  if (body.permission_ids !== undefined) {
    if (!Array.isArray(body.permission_ids) ||
        !body.permission_ids.every(id => Number.isSafeInteger(id) && id > 0)) {
      return 'El permission_ids debe ser un arreglo de enteros positivos';
    }
  }
  return null;
}



function notFound(res) {
  return res.status(404).json({ message: 'Rol no encontrado', data: null });
}
async function list(req, res, next) {
  try {
    const roles = await Role.findAll({
      include: { model: Permission, as: 'permissions' }
    });

    res.json({ message: 'Lista de roles', data: roles });
  } catch (error) {
    next(error);
  }
}

async function find(req, res, next) {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: { model: Permission, as: 'permissions' }
    });

    if (!role) return notFound(res);

    res.json({ message: 'Rol encontrado', data: role });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const error = validate(req.body);
    if (error) {
      return res.status(400).json({ message: error, data: null });
    }

    const role = await Role.create({
      name: req.body.name,
      description: req.body.description
    });

    // Si se envia el arreglo, reemplaza las asignaciones; [] las elimina.
    if (req.body.permission_ids !== undefined) {
      await role.setPermissions(req.body.permission_ids);
    }

    res.status(201).json({ message: 'Rol creado', data: role });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) return notFound(res);

    const error = validate(req.body);
    if (error) {
      return res.status(400).json({ message: error, data: null });
    }

    await role.update({
      name: req.body.name,
      description: req.body.description
    });

    // Si se envia el arreglo, reemplaza las asignaciones; [] las elimina.
    if (req.body.permission_ids !== undefined) {
      await role.setPermissions(req.body.permission_ids);
    }

    res.json({ message: 'Rol actualizado', data: role });
  } catch (error) {
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) return notFound(res);

    await role.destroy();

    res.json({ message: 'Rol eliminado', data: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, find, create, update, destroy };
