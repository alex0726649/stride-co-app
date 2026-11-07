const { Product } = require('../models/relationals');

async function home(req, res, next) {
  try {
    const products = await Product.findAll({
      where: { active: true },
      attributes: ['name', 'description', 'brand', 'price'],
      order: [['id', 'ASC']],
    });
    res.render('index', { title: 'Stride & Co', products });
  } catch (error) {
    next(error);
  }
}

module.exports = { home };
