exports.getProducts = (req, res) => {
  res.json({
    message: "GET products",
    data: [
      {
        id: 1,
        name: "Tenis Deportivos Stride",
        price: 1299.00,
        active: true
      }
    ]
  });
};