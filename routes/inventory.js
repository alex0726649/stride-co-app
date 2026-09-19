const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventory');

router.get('/', controller.getInventory);
router.get('/:id', controller.getInventoryById);
router.post('/', controller.createInventory);
router.put('/:id', controller.updateInventory);
router.delete('/:id', controller.deleteInventory);

module.exports = router;