const express = require('express');
const { healthCheck } = require('../../controllers/index');
const router = express.Router();

router.get('/health', healthCheck);
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/products', require('./products'));
router.use('/roles', require('./roles'));
router.use('/permissions', require('./permissions'));
router.use('/inventory', require('./inventory'));
router.use('/variants', require('./variants'));
router.use('/orders', require('./orders'));
router.use('/customers', require('./customers'));

module.exports = router;
