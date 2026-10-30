const express = require('express');
const router = express.Router();
const controller = require('../controllers/products');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

/* GET all products */
router.get('/', authenticate, authorize('products', 'read', 'any'), controller.list);

/* GET product by id */
router.get('/:id', authenticate, authorize('products', 'read', 'any'), controller.find);

/* POST create product */
router.post('/', authenticate, authorize('products', 'create', 'any'), controller.create);

/* PUT update product */
router.put('/:id', authenticate, authorize('products', 'update', 'any'), controller.update);

/* DELETE product by id */
router.delete('/:id', authenticate, authorize('products', 'delete', 'any'), controller.destroy);

module.exports = router;
