const express = require('express');
const router = express.Router();
const variants = require('../controllers/variants');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

router.get('/', authenticate, authorize('variants', 'read', 'any'), variants.list);
router.get('/:id', authenticate, authorize('variants', 'read', 'any'), variants.find);
router.post('/', authenticate, authorize('variants', 'create', 'any'), variants.create);
router.put('/:id', authenticate, authorize('variants', 'update', 'any'), variants.update);
router.delete('/:id', authenticate, authorize('variants', 'delete', 'any'), variants.destroy);

module.exports = router;
