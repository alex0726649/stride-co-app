const express = require('express');
const router = express.Router();
const controller = require('../controllers/customers');
const { authorize } = require('../middleware/authorize');

router.get('/', authorize('customers', 'read', 'any'), controller.list);
router.get('/:id', authorize('customers', 'read', 'own'), controller.find);
router.post('/', authorize('customers', 'create', 'own'), controller.create);
router.put('/:id', authorize('customers', 'update', 'own'), controller.update);
router.delete('/:id', authorize('customers', 'delete', 'own'), controller.destroy);

module.exports = router;
