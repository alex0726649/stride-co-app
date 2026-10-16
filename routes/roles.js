const express = require('express');
const router = express.Router();
const controller = require('../controllers/roles');
const { authorize } = require('../middleware/authorize');

/* GET roles listing. */
router.get('/', authorize('roles', 'read', 'any'), controller.list);

/* GET role by id */
router.get('/:id', authorize('roles', 'read', 'any'), controller.find);

/* POST role create */
router.post('/', authorize('roles', 'create', 'any'), controller.create);

/* PUT role to update */
router.put('/:id', authorize('roles', 'update', 'any'), controller.update);

/* DELETE role by id */
router.delete('/:id', authorize('roles', 'delete', 'any'), controller.destroy);

module.exports = router;
