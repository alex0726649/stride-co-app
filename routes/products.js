const express = require('express');
const router = express.Router();
const controller = require('../controllers/products');

/* GET all products */
router.get('/', controller.list);

/* GET product by id */
router.get('/:id', controller.find);

/* POST create product */
router.post('/', controller.create);

/* PUT update product */
router.put('/:id', controller.update);

/* DELETE product by id */
router.delete('/:id', controller.destroy);

module.exports = router;
