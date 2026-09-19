// test/app.test.js
// Prueba inicial real de la aplicación: importa app.js directamente
// (sin levantar servidor/puerto) y usa Supertest para hacer la petición HTTP.

const request = require('supertest');
const app = require('../app');

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
});
