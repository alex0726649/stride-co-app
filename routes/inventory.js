// routes/inventory.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory');

router.get('/', inventoryController.listInventory);
router.get('/:id', inventoryController.getInventoryById);
router.put('/:id', inventoryController.updateInventory);

module.exports = router;