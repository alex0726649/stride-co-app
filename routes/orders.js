const express = require('express');
const router = express.Router();
const controller = require('../controllers/orders');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

router.get('/', authenticate, authorize('orders', 'read', 'any'), controller.list);
router.get('/:id', authenticate, authorize('orders', 'read', 'own'), controller.find);
router.post('/', authenticate, authorize('orders', 'create', 'own'), controller.create);
router.put('/:id', authenticate, authorize('orders', 'update', 'own'), controller.update);
router.delete('/:id', authenticate, authorize('orders', 'delete', 'any'), controller.destroy);

module.exports = router;
