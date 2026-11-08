const express = require('express');
const router = express.Router();
const variants = require('../controllers/variants');

router.get('/', variants.list);
router.get('/:id', variants.find);
router.post('/', variants.create);
router.put('/:id', variants.update);
router.delete('/:id', variants.destroy);

module.exports = router;
