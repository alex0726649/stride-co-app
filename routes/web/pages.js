const express = require('express');
const controller = require('../../controllers/web/pages');
const router = express.Router();

// Enlaces del menú que todavía no tienen pantalla.
// Se monta después de los routers web: cuando una tarjeta implementa la ruta real,
// la suya responde primero y solo hay que quitarla de esta lista.
//   /products  -> la implementa S3-05 (F2)
//   /admin     -> la implementa S3-07 (redirige a /admin/products)
//   /cart y /my/orders -> F4 y F6 no se implementan en este entregable
const COMING_SOON = ['/products', '/admin', '/cart', '/my/orders'];

router.get(COMING_SOON, controller.comingSoon);

module.exports = router;
