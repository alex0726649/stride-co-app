const express = require('express');
const router = express.Router();
const controller = require('../controllers/permissions');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

router.post('/', authenticate, authorize('permissions', 'create', 'any'), controller.create);
router.get('/', authenticate, authorize('permissions', 'read', 'any'), controller.list);
router.get('/:id', authenticate, authorize('permissions', 'read', 'any'), controller.find);
router.put('/:id', authenticate, authorize('permissions', 'update', 'any'), controller.update);
router.delete('/:id', authenticate, authorize('permissions', 'delete', 'any'), controller.destroy);

module.exports = router;
