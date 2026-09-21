// test/app.test.js
// Prueba inicial real de la aplicación: importa app.js directamente
// (sin levantar servidor/puerto) y usa Supertest para hacer la petición HTTP.

const request = require('supertest');
const app = require('../app');
const { jest: jestMock } = require('@jest/globals');
const { stripVTControlCharacters } = require('node:util');

describe('App base', () => {
  it('responde en la ruta raíz "/" con estado 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
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
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Usuario no encontrado', data: null });
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
    jestMock.doMock('../routes/index', () => function(_req, _res, next) {
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
      jestMock.dontMock('../routes/index');
    }
  });

  it('Morgan registra método, ruta y estado HTTP en peticiones reales', async () => {
    const output = [];
    const write = jestMock.spyOn(process.stdout, 'write').mockImplementation(chunk => {
      output.push(String(chunk));
      return true;
    });
    try {
      await request(app).get('/api/users').expect(200);
      await request(app).get('/api/ruta-que-no-existe').expect(404);
    } finally {
      write.mockRestore();
    }
    // Quitar las secuencias ANSI del formato dev de Morgan.
    const log = stripVTControlCharacters(output.join(''));
    expect(log).toMatch(/GET \/api\/users 200/);
    expect(log).toMatch(/GET \/api\/ruta-que-no-existe 404/);
  });
});
