const { User, Role } = require('../models/relationals');
const { hashPassword }= require('../utils/password');


function notFound(res) {
  return res.status(404).json({ message: 'Usuario no encontrado', data: null });
}

async function list(req, res) {
  const users = await User.findAll({
    attributes: [
      'first_name',
      'last_name',
      'email'
    ],
    include: {
      model: Role,
      as: 'role'
    }
  });
  res.json({ message: 'Lista de usuarios', data: users });
}
//find
async function find(req, res) {
  const id = req.params.id;
  const user = await User.findByPk(id, {
    include: {
      model: Role,
      as: 'role'
    }
  });

  if (!user) return notFound(res);

  res.json({
    message: 'Usuario encontrado',
    data: user
  });
}
//create
 async function create(req, res) { //a la funcion le tengo que agregar async
  const name= req.body.first_name;
  const lastName=req.body.last_name;
  const roleId = req.body.role_id;
  const email=req.body.email;
  const password = req.body.password;
  const passwordData = await hashPassword(password);
  const user = await User.create({
    first_name: name,
    last_name: lastName,
    email: email,
    role_id: roleId,
    password_hash: passwordData.securePassword,
    salt_key: passwordData.saltKey
  });
  return res.status(201).json({
    message: 'Usuario creado',
    data: user});
}
async function update(req, res) {
  const id = req.params.id;
  const name= req.body.first_name;
  const lastName=req.body.last_name;
  const email=req.body.email;
  const user = await User.findByPk(id);
  const roleId = req.body.role_id;

  if (!user)return res.status(404).json({message:'User not found'});
  const changes = {};
  changes.first_name= name ? name: user.first_name;
  changes.last_name=lastName ? lastName:user.last_name;
  changes.email=email ? email :user.email;
  changes.role_id = roleId ? roleId : user.role_id;
 //actividad 4 si se cambia de pw se regenera salt key
  if (req.body.password !== undefined) {
    if (
        typeof req.body.password !== 'string' ||
        !req.body.password.trim()
    ) {
        return res.status(400).json({
            message: 'La contraseña no puede estar vacía'
        });
    }

    const passwordData = await hashPassword(req.body.password);

    changes.password_hash = passwordData.securePassword;
    changes.salt_key = passwordData.saltKey;
}

  await user.update(changes);

  res.json({ message: 'user updated', data: user });
}

async function destroy(req, res) {
  const id = req.params.id;
  const user = await User.findByPk(id);
  if (!user)return res.status(404).json({message:'User not found'});
  await user.destroy();
  res.json({ message: 'user deleted', data: user });
}

module.exports = { list, find, create, update, destroy };

