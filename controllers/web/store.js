const productService = require('../../services/product.service');

async function home(req, res, next) {
  try {
    const products = await productService.listAll({ includeVariants: false });
    res.render('index', { title: 'Stride & Co', products });
  } catch (error) {
    next(error);
  }
}

module.exports = { home };
