
const createError = require('http-errors');
const express = require('express');
const fs = require('fs');
const path = require('path');//es de node.js, permite juntas directorios con archivos y lo hace respetando las reglas de casa SO; hablamo de rutas de disco
const cookieParser = require('cookie-parser');//cookie , pequeños datos que guarda el navegador y los puede enviar despues a la aplicacion
//cooke-parser organiza las cookies que llegan para poder leerlas despues en nuestra aplicacion
const logger = require('morgan');//morgan es una dependencia que registra en la terminal las solicitudes http que recibe la aplicacion

const i18n = require('./config/i18n');
const viewLocals = require('./middlewares/viewLocals');
const errorHandler = require('./middlewares/errorHandler');

const indexRouter = require('./routes/api/index');
const usersRouter = require('./routes/api/users');
const rolesRouter = require('./routes/api/roles');
const permissionsRouter = require('./routes/api/permissions');
const productsRouter = require('./routes/api/products');
const variantsRouter = require('./routes/api/variants');
const inventoryRouter = require('./routes/api/inventory');
const customersRouter = require('./routes/api/customers');
const ordersRouter = require('./routes/api/orders');
const authRouter = require('./routes/api/auth');
const indexWebRouter = require('./routes/web/index');
const pagesWebRouter = require('./routes/web/pages');

const app = express();// crea y devuelve la aplicacion*** importante ***

// view engine setup
//vistas son archivos que se usan como plantillas para generar pag html
app.set('views', path.join(__dirname, 'views'));// aqui buscalas express
app.set('view engine', 'pug'); //express,  usa pug para interpretar las plantillas

app.use(logger('dev'));//middleware, activa a morgan que jalamos arriba 'dev' es un formtato de morgan
if (app.get('env') !== 'test') {
  const logDir = path.join(__dirname, 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
  accessLogStream.on('error', error => console.error('Error al escribir logs/access.log:', error.message));
  app.use(logger('combined', { stream: accessLogStream }));
}
app.use(cookieParser());// arriba lo requerimos aqui lo activamos; va antes de i18n para leer la cookie de idioma
app.use(i18n.init);
app.use(express.json());//middleware, lee el cuerpo de la solicitudes enviadas en json y lo concvierte en un valor de JS que podemos consultar e req.body
app.use(express.urlencoded({ extended: true }));//lo mismo que el de arriba pero enviadas en url
app.use(express.static(path.join(__dirname, 'public'))); // para servir doc estaticos publicos
app.use(viewLocals); // formateadores, selector de idioma y mensajes de un solo uso para las vistas


app.use('/health', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/products', productsRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/', indexWebRouter);
app.use('/', pagesWebRouter); // "Próximamente" para las secciones que no se implementan

// catch 404 and forward to error handler
app.use(function(req, res, next) {   //middleware
  next(createError(404));
});

// error handler: /api responde JSON; las rutas web renderizan errors/403, 404 y 500 (ver middlewares/errorHandler.js)
app.use(errorHandler);

module.exports = app;
