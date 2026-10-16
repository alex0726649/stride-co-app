// routes/inventory.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory');
const { authorize } = require('../middleware/authorize');

router.get('/', authorize('inventory', 'read', 'any'), inventoryController.listInventory);
router.get('/:id', authorize('inventory', 'read', 'any'), inventoryController.getInventoryById);
router.put('/:id', authorize('inventory', 'update', 'any'), inventoryController.updateInventory);

module.exports = router;
