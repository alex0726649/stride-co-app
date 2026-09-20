const request = require('supertest');
const app = require('../app');

const base = '/api/variants';
const valid = { product_id: 1, sku: 'STRIDE-28-AZUL', size: '28', color: 'Azul' };
const fixtures = [
  { id: 1, product_id: 1, sku: 'STRIDE-26-NEGRO', size: '26', color: 'Negro', active: true },
  { id: 2, product_id: 1, sku: 'STRIDE-27-BLANCO', size: '27', color: 'Blanco', active: true },
];

describe('/api/variants', () => {
  it('lista las variantes con referencias a productos existentes', async () => {
    const response = await request(app).get(base).expect(200).expect('Content-Type', /json/);
    expect(response.body).toEqual({ message: 'Lista de variantes', data: fixtures });
    const products = await request(app).get('/api/products').expect(200);
    for (const variant of response.body.data) {
      expect(products.body.data.map(product => product.id)).toContain(variant.product_id);
    }
  });

  it.each(fixtures)('selecciona la variante $id', async variant => {
    const response = await request(app).get(`${base}/${variant.id}`).expect(200);
    expect(response.body).toEqual({ message: 'Variante encontrada', data: variant });
  });

  describe.each(['get', 'put', 'delete'])('%s por ID desconocido', method => {
    it.each(['999', 'no-existe', '0', '-1', '1.5', '01', '1abc'])('%s devuelve 404', async id => {
      const response = await request(app)[method](`${base}/${id}`).send({}).expect(404);
      expect(response.body).toEqual({ message: 'Variante no encontrada', data: null });
    });
  });

  it('crea con ID fijo, ignora campos adicionales y no persiste', async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request(app).post(base).send({ ...valid, id: 88, extra: 'ignorar' }).expect(201);
      expect(response.body).toEqual({ message: 'Creación de variante simulada', data: { id: 3, ...valid, active: true } });
    }
    await request(app).get(`${base}/3`).expect(404);
    expect((await request(app).get(base)).body.data).toEqual(fixtures);
  });

  it.each([1, 2])('actualiza %s conservando el ID de ruta sin persistir', async id => {
    const response = await request(app).put(`${base}/${id}`).send({ ...valid, id: 88, active: false, extra: true }).expect(200);
    expect(response.body).toEqual({ message: 'Actualización de variante simulada', data: { id, ...valid, active: false } });
    expect((await request(app).get(`${base}/${id}`)).body.data).toEqual(fixtures[id - 1]);
  });

  it('conserva su propio SKU y active si se omite en PUT', async () => {
    const response = await request(app).put(`${base}/1`).send({ ...valid, sku: fixtures[0].sku }).expect(200);
    expect(response.body.data.active).toBe(true);
    expect(response.body.data.sku).toBe(fixtures[0].sku);
  });

  it('permite active false en POST', async () => {
    const response = await request(app).post(base).send({ ...valid, active: false }).expect(201);
    expect(response.body.data.active).toBe(false);
  });

  it.each([1, 2])('simula eliminar %s sin alterar los datos', async id => {
    const response = await request(app).delete(`${base}/${id}`).expect(200);
    expect(response.body).toEqual({ message: 'Eliminación de variante simulada', data: null });
    expect((await request(app).get(`${base}/${id}`)).body.data).toEqual(fixtures[id - 1]);
    expect((await request(app).get(base)).body.data).toEqual(fixtures);
  });

  describe.each(['post', 'put'])('validaciones de %s', method => {
    const invalidBodies = [
      {}, [],
      ...['product_id', 'sku', 'size', 'color'].map(field => {
        const body = { ...valid };
        delete body[field];
        return body;
      }),
      ...[0, -1, 1.5, '1', null, true, Number.MAX_SAFE_INTEGER + 1].map(product_id => ({ ...valid, product_id })),
      ...['sku', 'size', 'color'].flatMap(field => ['', '   ', 26, null, false, [], {}].map(value => ({ ...valid, [field]: value }))),
      ...['true', 1, null].map(active => ({ ...valid, active })),
      { ...valid, sku: fixtures[1].sku },
    ];

    it.each(invalidBodies)('rechaza el cuerpo inválido %#', async body => {
      const url = method === 'post' ? base : `${base}/1`;
      const response = await request(app)[method](url).send(body).expect(400);
      expect(response.body).toEqual({ message: expect.any(String), data: null });
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    it('rechaza solicitudes sin cuerpo y JSON malformado', async () => {
      const url = method === 'post' ? base : `${base}/1`;
      await request(app)[method](url).expect(400);
      const response = await request(app)[method](url).set('Content-Type', 'application/json').send('{').expect(400);
      expect(response.body).toEqual({ message: 'Cuerpo JSON inválido', data: null });
    });
  });
});
