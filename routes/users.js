const express = require('express');
const router = express.Router();
const controller = require('../controllers/users');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

router.post('/', authenticate, authorize('users', 'create', 'any'), controller.create);
router.get('/', authenticate, authorize('users', 'read', 'any'), controller.list);
router.get('/:id', authenticate, authorize('users', 'read', 'any'), controller.find);
router.put('/:id', authenticate, authorize('users', 'update', 'any'), controller.update);
router.delete('/:id', authenticate, authorize('users', 'delete', 'any'), controller.destroy);

module.exports = router;
