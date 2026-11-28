const express = require('express');
const controller = require('../../controllers/api/index');
const router = express.Router();

router.get('/', controller.healthCheck);

module.exports = router;
