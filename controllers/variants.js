const variants = Object.freeze([
  Object.freeze({ id: 1, product_id: 1, sku: 'STRIDE-26-NEGRO', size: '26', color: 'Negro', active: true }),
  Object.freeze({ id: 2, product_id: 1, sku: 'STRIDE-27-BLANCO', size: '27', color: 'Blanco', active: true }),
]);

function findVariant(id) {
  return variants.find(variant => String(variant.id) === id);
}

function validate(body, id) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'El cuerpo debe ser un objeto JSON';
  }
  if (!Number.isSafeInteger(body.product_id) || body.product_id <= 0) {
    return 'El product_id debe ser un entero positivo';
  }
  for (const field of ['sku', 'size', 'color']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `El ${field} es obligatorio y debe ser un texto no vacío`;
    }
  }
  if (body.active !== undefined && typeof body.active !== 'boolean') {
    return 'El active debe ser booleano';
  }
  if (variants.some(variant => variant.sku === body.sku && variant.id !== id)) {
    return 'El sku ya existe';
  }
  return null;
}

function publicVariant(id, body, active = true) {
  return { id, product_id: body.product_id, sku: body.sku, size: body.size,
    color: body.color, active: body.active === undefined ? active : body.active };
}

function notFound(res) {
  return res.status(404).json({ message: 'Variante no encontrada', data: null });
}

function list(req, res) {
  res.json({ message: 'Lista de variantes', data: variants });
}

function find(req, res) {
  const variant = findVariant(req.params.id);
  if (!variant) return notFound(res);
  res.json({ message: 'Variante encontrada', data: variant });
}

function create(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error, data: null });
  res.status(201).json({ message: 'Creación de variante simulada', data: publicVariant(3, req.body) });
}

function update(req, res) {
  const variant = findVariant(req.params.id);
  if (!variant) return notFound(res);
  const error = validate(req.body, variant.id);
  if (error) return res.status(400).json({ message: error, data: null });
  res.json({ message: 'Actualización de variante simulada', data: publicVariant(variant.id, req.body, variant.active) });
}

function destroy(req, res) {
  if (!findVariant(req.params.id)) return notFound(res);
  res.json({ message: 'Eliminación de variante simulada', data: null });
}

module.exports = { list, find, create, update, destroy };
