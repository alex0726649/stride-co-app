require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');//es de node.js, permite juntas directorios con archivos y lo hace respetando las reglas de casa SO; hablamo de rutas de disco
const cookieParser = require('cookie-parser');//cookie , pequeños datos que guarda el navegador y los puede enviar despues a la aplicacion
//cooke-parser organiza las cookies que llegan para poder leerlas despues en nuestra aplicacion
const logger = require('morgan');//morgan es una dependencia que registra en la terminal las solicitudes http que recibe la aplicacion
//const {expressjwt}=require('express-jwt');

const i18n = require('./config/i18n');

const indexRouter = require('./routes/index');// en estos estamos guardando un router, el cual es un objeto que exporta ./routes/index
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const rolesRouter = require('./routes/roles');
const permissionsRouter = require('./routes/permissions');
const inventoryRouter = require('./routes/inventory');
const variantsRouter = require('./routes/variants');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const authRouter =require('./routes/auth');



const app = express();// crea y devuelve la aplicacion*** importante ***

// Código de clase: la verificación JWT ahora está en
// middlewares/authenticate.js y se aplica a /api/auth/me
// desde routes/auth.js. Se comenta para evitar verificar dos veces.

//const secret = process.env.JWT_SECRET;
//app.use(expressjwt({secret,algorithms:["HS256"]}).unless({path:['/api/auth/login']}));

// view engine setup
//vistas son archivos que se usan como plantillas para generar pag html
app.set('views', path.join(__dirname, 'views'));// aqui buscalas express
app.set('view engine', 'pug'); //express,  usa pug para interpretar las plantillas

app.use(logger('dev'));//middleware, activa a morgan que jalamos arriba 'dev' es un formtato de morgan
app.use(express.json());//middleware, lee el cuerpo de la solicitudes enviadas en json y lo concvierte en un valor de JS que podemos consultar e req.body
app.use(express.urlencoded({ extended: true }));//lo mismo que el de arriba pero enviadas en url
app.use(cookieParser());// arriba lo requerimos aqui lo activamos
app.use(express.static(path.join(__dirname, 'public'))); // para servir doc estaticos publicos
app.use(i18n.init);


app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {   //middleware
  next(createError(404));
});

// error handler
app.use(function(err, req, res, _next) {// hacemos esto por que los errores de /api se contestan en json  para las otras rutas generamos un error html
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    const status = err.status || 500;

    // Mensajes públicos del contrato: no exponer el error ni su stack.
    let message = 'Error interno del servidor';
    if (status === 400) message = 'Cuerpo JSON inválido';
    if (status === 401) message = 'No autorizado';
    if (status === 403) message = 'Prohibido';
    if (status === 404) message = 'Ruta no encontrada';

    return res.status(status).json({ message, data: null });
  }
//aqui llegamos si el error no corresponde a la ruta /api, para eso errores ya mandamos el msj
  res.locals.message = err.message; //res.locals guarada datos para la pagina html que se regresa por eso aqui guargamos err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}; //dependiendo de la etapa en la que estemos recibimos el err o un objeto vacio
  res.status(err.status || 500);
  res.render('error');//recordemos que estamos usando pug y views para plantillas
});

module.exports = app;
