const { Product } = require('../models/relationals');

function healthCheck(req, res){
    res.status(200).json({
        status: 'UP'
    });
}

async function home(req, res, next) {
  try {
    const products = await Product.findAll();
    res.render('index', { title: 'Stride & Co', products });
  } catch (error) {
    next(error);
  }
}

module.exports = { healthCheck, home };
