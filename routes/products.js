var express = require('express');
var router = express.Router();
var productController = require('../controllers/products');

router.get('/', productController.getProducts);

module.exports = router;