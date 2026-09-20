const products = Object.freeze([
  Object.freeze({
    id: 1,
    category_id: 101,
    name: 'Tenis Deportivos Stride',
    description: 'Calzado ergonómico de alta resistencia para corredores urbanos.',
    brand: 'Stride & Co.',
    price: 1299.00,
    active: true
  }),
]);

function findProduct(id) {
  return products.find(p => String(p.id) === id);
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo debe ser un objeto JSON';
  }
  for (const field of ['name', 'description', 'brand']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `El ${field} es obligatorio y debe ser un texto no vacío`;
    }
  }
  if (typeof body.price !== 'number' || body.price < 0) {
    return 'El price debe ser un número mayor o igual a cero';
  }
  return null;
}

function publicProduct(id, body) {
  return {
    id,
    category_id: body.category_id || 1,
    name: body.name,
    description: body.description,
    brand: body.brand,
    price: body.price,
    active: body.active !== undefined ? body.active : true
  };
}

function notFound(res) {
  return res.status(404).json({ message: 'Producto no encontrado', data: null });
}

function list(req, res) {
  res.json({ message: 'Lista de productos', data: products });
}

function find(req, res) {
  const product = findProduct(req.params.id);
  if (!product) return notFound(res);
  res.json({ message: 'Producto encontrado', data: product });
}

function create(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
  res.status(201).json({ message: 'Creación de producto simulada', data: publicProduct(2, req.body) });
}

function update(req, res) {
  const product = findProduct(req.params.id);
  if (!product) return notFound(res);
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
  res.json({ message: 'Actualización de producto simulada', data: publicProduct(product.id, req.body) });
}

function destroy(req, res) {
  if (!findProduct(req.params.id)) return notFound(res);
  res.json({ message: 'Eliminación de producto simulada', data: null });
}

module.exports = { list, find, create, update, destroy };
