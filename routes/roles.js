const express = require('express');
const router = express.Router();
const controller = require('../controllers/roles');

/* GET roles listing. */
router.get('/', controller.list);

/* GET role by id */
router.get('/:id', controller.find);

/* POST role create */
router.post('/', controller.create);

/* PUT role to update */
router.put('/:id', controller.update);

/* DELETE role by id */
router.delete('/:id', controller.destroy);

module.exports = router;