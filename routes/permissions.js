const express = require('express');
const router = express.Router();
const controller = require('../controllers/permissions');

/* GET permissions listing. */
router.get('/', controller.list);

/* GET permission by id */
router.get('/:id', controller.find);

/* POST permission create */
router.post('/', controller.create);

/* PUT permission to update */
router.put('/:id', controller.update);

/* DELETE permission by id */
router.delete('/:id', controller.destroy);

module.exports = router;