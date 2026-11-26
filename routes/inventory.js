const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

router.get('/', authenticate, authorize('inventory', 'read', 'any'), inventoryController.listInventory);
router.get('/:id', authenticate, authorize('inventory', 'read', 'any'), inventoryController.getInventoryById);
router.put('/:id', authenticate, authorize('inventory', 'update', 'any'), inventoryController.updateInventory);

module.exports = router;
