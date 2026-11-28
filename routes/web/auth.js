const express = require('express');
const { body } = require('express-validator');
const controller = require('../../controllers/web/auth');
const router = express.Router();

router.get('/login', controller.showLogin);
router.post('/login',
  body('email').isString().withMessage('webAuth.emailRequired').bail()
    .trim().notEmpty().withMessage('webAuth.emailRequired').bail()
    .isEmail().withMessage('webAuth.emailInvalid'),
  body('password').isString().withMessage('webAuth.passwordRequired').bail()
    .custom(value => Boolean(value.trim())).withMessage('webAuth.passwordRequired'),
  controller.login);
router.post('/logout', controller.logout);

module.exports = router;
