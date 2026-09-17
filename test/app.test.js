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

  it('responde con 404 y JSON controlado ante una ruta de API inexistente', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    // Este comportamiento lo termina de definir S1-11 (manejo de errores JSON).
    // Por ahora solo verificamos que el servidor responde algo, sin caerse.
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
