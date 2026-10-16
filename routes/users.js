const express = require('express');
const router = express.Router();
const controller = require('../controllers/users');
const { authorize } = require('../middleware/authorize');

/*POST user create*/
router.post('/', authorize('users', 'create', 'any'), controller.create);

/* GET users listing. */
router.get('/', authorize('users', 'read', 'any'), controller.list );

/*GET user by id*/
router.get('/:id', authorize('users', 'read', 'own'), controller.find);

/*PUT  user to update*/
router.put('/:id', authorize('users', 'update', 'any'), controller.update);

/*DELETE user by id*/
router.delete('/:id', authorize('users', 'delete', 'any'), controller.destroy);

module.exports = router;
