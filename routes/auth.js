const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth');
const { authenticate } = require('../middlewares/authenticate');

router.post('/login', controller.login);
router.get('/me', authenticate, controller.me);
module.exports = router;
