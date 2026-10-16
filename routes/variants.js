const express = require('express');
const router = express.Router();
const variants = require('../controllers/variants');
const { authorize } = require('../middleware/authorize');

router.get('/', authorize('variants', 'read', 'any'), variants.list);
router.get('/:id', authorize('variants', 'read', 'any'), variants.find);
router.post('/', authorize('variants', 'create', 'any'), variants.create);
router.put('/:id', authorize('variants', 'update', 'any'), variants.update);
router.delete('/:id', authorize('variants', 'delete', 'any'), variants.destroy);

module.exports = router;
