const express = require('express');
const router = express.Router();
const controller = require('../controllers/customers');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const validateObjectId = require('../middlewares/validateObjectId');

const validId = validateObjectId('customers.invalidId');

// Orden: autenticar → validar id y cuerpo (400) → autorizar (403) → controller.
// 'own' deja pasar a quien tiene el permiso any y, si solo tiene own,
// verifica que el customer pertenezca al usuario del token.
router.get('/', authenticate, authorize('customers', 'read', 'any'), controller.list);
router.get('/:id', authenticate, validId, authorize('customers', 'read', 'own'), controller.find);
router.post('/', authenticate, controller.validateCreate, authorize('customers', 'create', 'own'), controller.create);
router.put('/:id', authenticate, validId, controller.validateUpdate, authorize('customers', 'update', 'own'), controller.update);
router.delete('/:id', authenticate, validId, authorize('customers', 'delete', 'any'), controller.destroy);

module.exports = router;