exports.getInventory = (req, res) => {
  res.json({ message: "Obtener todos los elementos de inventario" });
};

exports.getInventoryById = (req, res) => {
  res.json({ message: `Obtener inventario con id ${req.params.id}` });
};

exports.createInventory = (req, res) => {
  res.json({ message: "Elemento de inventario creado" });
};

exports.updateInventory = (req, res) => {
  res.json({ message: `Inventario con id ${req.params.id} actualizado` });
};

exports.deleteInventory = (req, res) => {
  res.json({ message: `Inventario con id ${req.params.id} eliminado` });
};