const User= require('../models/relationals/User')//User es nuesto model de bd
const users = Object.freeze([
  Object.freeze({ id: 1, first_name: 'Ana', last_name: 'Ejemplo', email: 'ana@example.com', role_id: 1 }),
  Object.freeze({ id: 2, first_name: 'Luis', last_name: 'Ejemplo', email: 'luis@example.com', role_id: 1 }),
]);

function findUser(id) {
  return users.find(user => String(user.id) === id);
}

function validate(body) {//valida que el body del req sea un bojeto correcto, no un arreglo o un undefined o null
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo debe ser un objeto JSON';
  }
  for (const field of ['first_name', 'last_name', 'email']) {//este for confirma que los campos sean texto y recorta los espacion antes y despues del texto
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `El ${field} es obligatorio y debe ser un texto no vacío`;
    }
  }
 // if (!Number.isSafeInteger(body.role_id) || body.role_id <= 0) {//confirma que sea entero valido positivo
   // return 'El role_id debe ser un entero positivo';
  //}
  return null;// se devuelve null cuando se ha validado el body
}

function publicUser(id, body) {
  return { id, first_name: body.first_name, last_name: body.last_name, email: body.email, role_id: body.role_id };
}

function notFound(res) {
  return res.status(404).json({ message: 'Usuario no encontrado', data: null });
}

async function list(req, res) {
  const users =await User.findAll();
  res.json({ message: 'Lista de usuarios', data: users });
}
//find
async function find(req, res) {
  const id = req.params.id;
  const user = await User.findByPk(id);

  if (!user) return notFound(res);

  res.json({
    message: 'Usuario encontrado',
    data: user
  });
}
//create
 async function create(req, res) { //a la funcion le tengo que agregar async
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
   const name= req.body.first_name;
  const lastName=req.body.last_name;
  const email=req.body.email;
  const user=await User.create({first_name:name,last_name:lastName,email:email});
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

  if (!user)return res.status(404).json({message:'User not found'});
  let changes = {};
  changes.first_name= name ? name: user.first_name;
  changes.last_name=lastName ? lastName:user.last_name;
  changes.email=email ? email :user.email;
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
