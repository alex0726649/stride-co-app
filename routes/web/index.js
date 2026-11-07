const express = require('express');
const { home } = require('../../controllers/catalog');
const router = express.Router();

router.get('/', home);

module.exports = router;
