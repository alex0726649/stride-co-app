// routes/orders.js
const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders');

router.get('/', ordersController.listOrders);
router.get('/:id', ordersController.getOrderById);
router.post('/', ordersController.createOrder);
router.put('/:id', ordersController.updateOrder);

module.exports = router;