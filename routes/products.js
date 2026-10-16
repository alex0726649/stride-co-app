const express = require('express');
const router = express.Router();
const controller = require('../controllers/products');
const { authorize } = require('../middleware/authorize');

/* GET all products */
router.get('/', authorize('products', 'read', 'any'), controller.list);

/* GET product by id */
router.get('/:id', authorize('products', 'read', 'any'), controller.find);

/* POST create product */
router.post('/', authorize('products', 'create', 'any'), controller.create);

/* PUT update product */
router.put('/:id', authorize('products', 'update', 'any'), controller.update);

/* DELETE product by id */
router.delete('/:id', authorize('products', 'delete', 'any'), controller.destroy);

module.exports = router;
