const express = require('express');
const router = express.Router();
const controller = require('../controllers/users');

/*POST user create*/
router.post('/',controller.create);

/* GET users listing. */
router.get('/',controller.list );

/*GET user by id*/
router.get('/:id',controller.find);

/*PUT  user to update*/
router.put('/:id',controller.update);

/*DELETE user by id*/
router.delete('/:id',controller.destroy);

module.exports = router;
