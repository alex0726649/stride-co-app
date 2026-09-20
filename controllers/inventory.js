// controllers/inventory.js
// Recurso: Inventario — operaciones acordadas: listar, consultar por ID y
// actualizar existencias. Sin creación ni eliminación (ver docs/api.md, sección 3).
// Datos mock fijos: las escrituras se simulan y no modifican el arreglo (docs/api.md, sección 1).

const inventoryRecords = [
{ id: 1, variant_id: 1, stock: 20, reserved: 0 },
{ id: 2, variant_id: 2, stock: 15, reserved: 3 },
{ id: 3, variant_id: 3, stock: 0, reserved: 0 },
];

function findInventoryById(id) {
return inventoryRecords.find((item) => item.id === id);
}

// GET /api/inventory
function listInventory(req, res) {
return res.status(200).json({
    message: 'Lista de inventario',
    data: inventoryRecords,
});
}

// GET /api/inventory/:id
function getInventoryById(req, res) {
const id = Number(req.params.id);
const record = findInventoryById(id);

if (!record) {
    return res.status(404).json({
    message: 'Registro de inventario no encontrado',
    data: null,
    });
}

return res.status(200).json({
    message: 'Registro de inventario encontrado',
    data: record,
});
}

// PUT /api/inventory/:id
// Simula la actualización de existencias sin modificar el arreglo fijo.
function updateInventory(req, res) {
const id = Number(req.params.id);
const record = findInventoryById(id);

if (!record) {
    return res.status(404).json({
    message: 'Registro de inventario no encontrado',
    data: null,
    });
}

const { stock, reserved } = req.body;

  // Validación básica de escrituras (docs/api.md, sección 6).
if (
    stock === undefined ||
    reserved === undefined ||
    !Number.isInteger(stock) ||
    !Number.isInteger(reserved) ||
    stock < 0 ||
    reserved < 0
) {
    return res.status(400).json({
    message: 'stock y reserved son obligatorios y deben ser enteros mayores o iguales a cero',
    data: null,
    });
}

if (reserved > stock) {
    return res.status(400).json({
    message: 'reserved no puede ser mayor que stock',
    data: null,
    });
}

  // No se modifica inventoryRecords: se devuelve el objeto que se habría actualizado.
const updatedRecord = { ...record, stock, reserved };
return res.status(200).json({
    message: 'Actualización de inventario simulada',
    data: updatedRecord,
});
}

module.exports = {
listInventory,
getInventoryById,
updateInventory,
};