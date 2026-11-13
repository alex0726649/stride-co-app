// test/app.test.js
// Prueba inicial real de la aplicación: importa app.js directamente
// (sin ejecutar npm start) y usa Supertest con un puerto HTTP local temporal.

const request = require('supertest');
const app = require('../app');
const { Product } = require('../models/relationals');
const { jest: jestMock } = require('@jest/globals');
const { stripVTControlCharacters } = require('node:util');

describe('App base', () => {
  it('renderiza los productos en HTML público y escapa sus datos', async () => {
    Product.findAll.mockResolvedValue([
      Product.build({ name: 'Stride Runner', description: '<b>Edición demo</b>', brand: 'Stride & Co', price: '1299.00', active: false }),
    ]);

    const res = await request(app).get('/?lang=es').expect(200);
    expect(Product.findAll).toHaveBeenCalledWith();
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('<th scope="col">Precio</th>');
    expect(res.text).toContain('<td>Stride Runner</td>');
    expect(res.text).toContain('<td>&lt;b&gt;Edición demo&lt;/b&gt;</td>');
    expect(res.text).toContain('<td>Stride &amp; Co</td>');
    expect(res.text).toContain('<td>1299.00</td>');
  });

  it('usa la página de error cuando falla la consulta del catálogo', async () => {
    Product.findAll.mockRejectedValue(new Error('Falló la consulta'));
    const res = await request(app).get('/?lang=en').expect(500);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Internal server error');
  });

  it('expone el estado de salud en /health', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'UP' });
    expect(Product.findAll).not.toHaveBeenCalled();
    await request(app).get('/api/health').expect(404);
  });

  it('responde con 404 ante una ruta de API inexistente', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ message: 'Ruta no encontrada', data: null });
  });

  it('devuelve JSON también para el prefijo /api sin recurso', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ message: 'Ruta no encontrada', data: null });
  });

  it('distingue una ruta desconocida de un recurso inexistente', async () => {
    const res = await request(app).get('/api/roles/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Rol no encontrado', data: null });
  });

  it('rechaza JSON malformado sin exponer el contenido ni detalles del parser', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('{"privateMarker":');
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ message: 'Cuerpo JSON inválido', data: null });
  });

  it('oculta los detalles de un error inesperado en producción', async () => {
    let failingApp;
    // Inyectar el fallo solo en esta instancia de prueba, sin rutas de depuración reales.
    jestMock.doMock('../routes/api/users', () => function(_req, _res, next) {
      next(new Error('Detalle privado del servidor'));
    });
    try {
      jestMock.isolateModules(() => {
        failingApp = require('../app');
      });
      failingApp.set('env', 'production');
      const res = await request(failingApp).get('/api/users');
      expect(res.status).toBe(500);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({ message: 'Error interno del servidor', data: null });
    } finally {
      jestMock.dontMock('../routes/api/users');
    }
  });

  it('Morgan registra método, ruta y estado HTTP en peticiones reales', async () => {
    const output = [];
    const write = jestMock.spyOn(process.stdout, 'write').mockImplementation(chunk => {
      output.push(String(chunk));
      return true;
    });
    try {
      await request(app).get('/api/roles').expect(200);
      await request(app).get('/api/ruta-que-no-existe').expect(404);
    } finally {
      write.mockRestore();
    }
    // Quitar las secuencias ANSI del formato dev de Morgan.
    const log = stripVTControlCharacters(output.join(''));
    expect(log).toMatch(/GET \/api\/roles 200/);
    expect(log).toMatch(/GET \/api\/ruta-que-no-existe 404/);
  });
});
