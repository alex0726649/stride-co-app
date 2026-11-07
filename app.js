
const createError = require('http-errors');
const express = require('express');
const path = require('path');//es de node.js, permite juntas directorios con archivos y lo hace respetando las reglas de casa SO; hablamo de rutas de disco
const cookieParser = require('cookie-parser');//cookie , pequeños datos que guarda el navegador y los puede enviar despues a la aplicacion
//cooke-parser organiza las cookies que llegan para poder leerlas despues en nuestra aplicacion
const logger = require('morgan');//morgan es una dependencia que registra en la terminal las solicitudes http que recibe la aplicacion

const i18n = require('./config/i18n');

const apiRouter = require('./routes/api');
const webRouter = require('./routes/web');
const { healthCheck } = require('./controllers/index');

const app = express();// crea y devuelve la aplicacion*** importante ***

// view engine setup
//vistas son archivos que se usan como plantillas para generar pag html
app.set('views', path.join(__dirname, 'views'));// aqui buscalas express
app.set('view engine', 'pug'); //express,  usa pug para interpretar las plantillas

app.use(logger('dev'));//middleware, activa a morgan que jalamos arriba 'dev' es un formtato de morgan
app.use(i18n.init);
app.use(express.json());//middleware, lee el cuerpo de la solicitudes enviadas en json y lo concvierte en un valor de JS que podemos consultar e req.body
app.use(express.urlencoded({ extended: true }));//lo mismo que el de arriba pero enviadas en url
app.use(cookieParser());// arriba lo requerimos aqui lo activamos
app.use(express.static(path.join(__dirname, 'public'))); // para servir doc estaticos publicos


app.get('/health', healthCheck);
app.use('/api', apiRouter);
app.use('/', webRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {   //middleware
  next(createError(404));
});

// error handler
app.use(function(err, req, res, _next) {// hacemos esto por que los errores de /api se contestan en json  para las otras rutas generamos un error html
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    const status = err.status || 500;

    const keys = {
      400: err.type === 'entity.parse.failed' ? 'errors.invalidJson' : 'errors.badRequest',
      401: 'errors.unauthorized',
      403: 'errors.forbidden',
      404: 'errors.notFound',
    };
    const message = req.__(keys[status] || 'errors.internal');

    return res.status(status).json({ message, data: null });
  }
//aqui llegamos si el error no corresponde a la ruta /api, para eso errores ya mandamos el msj
  res.locals.title = req.__('views.errorTitle');
  res.locals.status = err.status || 500;
  const errorKeys = { 400: 'errors.badRequest', 401: 'errors.unauthorized', 403: 'errors.forbidden', 404: 'errors.notFound' };
  res.locals.message = req.__(errorKeys[err.status] || 'errors.internal'); //res.locals guarada datos para la pagina html que se regresa por eso aqui guargamos err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}; //dependiendo de la etapa en la que estemos recibimos el err o un objeto vacio
  res.status(err.status || 500);
  res.render('error');//recordemos que estamos usando pug y views para plantillas
});

module.exports = app;
