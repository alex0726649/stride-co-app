var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');

router.get('/health', controller.healthCheck);
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Stride & Co' });
});

module.exports = router;
