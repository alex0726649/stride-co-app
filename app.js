var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var rolesRouter = require('./routes/roles');
var permissionsRouter = require('./routes/permissions');
var inventoryRouter = require('./routes/inventory');
var variantsRouter = require('./routes/variants');
var ordersRouter = require('./routes/orders')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json()); // si el cliente manda un json este comando lo agrega en req.body
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // req.cookies
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/orders', ordersRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, _next) {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    const status = err.status === 400 || err.status === 404 ? err.status : 500;
    const message = status === 400 ? 'Cuerpo JSON inválido' :
      status === 404 ? 'Ruta no encontrada' : 'Error interno del servidor';
    return res.status(status).json({ message: message, data: null });
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
