const express = require('express');
const router = express.Router();
const controller = require('../controllers/orders');
const { authorize } = require('../middleware/authorize');

router.get('/', authorize('orders', 'read', 'any'), controller.list);
router.get('/:id', authorize('orders', 'read', 'own'), controller.find);
router.post('/', authorize('orders', 'create', 'own'), controller.create);
router.put('/:id', authorize('orders', 'update', 'own'), controller.update);
router.delete('/:id', authorize('orders', 'delete', 'any'), controller.destroy);

module.exports = router;
