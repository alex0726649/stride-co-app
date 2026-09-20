// test/inventory.test.js
const request = require('supertest');
const app = require('../app');

describe('GET /api/inventory', () => {
it('devuelve la lista de inventario con estado 200', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
});
});

describe('GET /api/inventory/:id', () => {
it('devuelve un registro existente con estado 200', async () => {
    const res = await request(app).get('/api/inventory/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 1 });
});

it('devuelve 404 para un ID que no existe', async () => {
    const res = await request(app).get('/api/inventory/999');
    expect(res.status).toBe(404);
    expect(res.body.data).toBeNull();
});
});

describe('PUT /api/inventory/:id', () => {
it('simula la actualización de existencias con datos válidos', async () => {
    const res = await request(app)
    .put('/api/inventory/1')
    .send({ stock: 25, reserved: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 1, stock: 25, reserved: 5 });
});

it('devuelve 404 al actualizar un ID inexistente', async () => {
    const res = await request(app)
    .put('/api/inventory/999')
    .send({ stock: 10, reserved: 0 });

    expect(res.status).toBe(404);
});

it('devuelve 400 si faltan campos obligatorios', async () => {
    const res = await request(app).put('/api/inventory/1').send({ stock: 10 });
    expect(res.status).toBe(400);
});

it('devuelve 400 si reserved es mayor que stock', async () => {
    const res = await request(app)
    .put('/api/inventory/1')
    .send({ stock: 5, reserved: 10 });

    expect(res.status).toBe(400);
});

it('no modifica los datos fijos: un GET posterior sigue devolviendo los originales', async () => {
    await request(app).put('/api/inventory/2').send({ stock: 999, reserved: 0 });

    const res = await request(app).get('/api/inventory/2');
    expect(res.body.data).toMatchObject({ id: 2, stock: 15, reserved: 3 });
});
});