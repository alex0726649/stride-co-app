const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, Role } = require('../models/relationals');

function createToken(userId, options = {}, secret = process.env.JWT_SECRET) {
  return jwt.sign({ sub: String(userId) }, secret, {
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    ...options,
  });
}

describe('Control de Acceso Basado en Roles (RBAC)', () => {
  const adminToken = createToken(1);
  const salesToken = createToken(2);
  const noPermissionsToken = createToken(3);

  const mockUsers = {
    '1': { id: 1, active: true, role_id: 1, email: 'admin@stride.com' },
    '2': { id: 2, active: true, role_id: 2, email: 'sales@stride.com' },
    '3': { id: 3, active: true, role_id: 99, email: 'noperms@stride.com' },
  };

  const mockRoles = {
    1: {
      id: 1,
      name: 'admin',
      permissions: [
        { key: 'products:read:any' },
        { key: 'products:create:any' },
        { key: 'products:update:any' },
        { key: 'products:delete:any' },
      ],
    },
    2: {
      id: 2,
      name: 'sales',
      permissions: [
        { key: 'products:read:any' },
      ],
    },
  };

  beforeEach(() => {
    User.findByPk.mockImplementation(async (id) => mockUsers[String(id)] || null);
    Role.findByPk.mockImplementation(async (id) => mockRoles[id] || null);
  });

  describe('1. Caso de ACCESO PERMITIDO', () => {
    test('usuario con rol admin puede eliminar un producto (DELETE /api/products/:id -> 200)', async () => {
      const res = await request(app)
        .delete('/api/products/1')
        .auth(adminToken, { type: 'bearer' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'Eliminación de producto simulada',
        data: null,
      });
    });

    test('usuario con rol admin puede crear un producto (POST /api/products -> 201)', async () => {
      const newProduct = {
        name: 'Tenis Runner Pro',
        description: 'Tenis de alto rendimiento',
        brand: 'Stride & Co.',
        price: 1599,
      };

      const res = await request(app)
        .post('/api/products')
        .auth(adminToken, { type: 'bearer' })
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.data).toMatchObject({
        name: newProduct.name,
        brand: newProduct.brand,
      });
    });

    test('usuario con rol sales puede consultar productos (GET /api/products -> 200)', async () => {
      const res = await request(app)
        .get('/api/products')
        .auth(salesToken, { type: 'bearer' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.message).toBe('GET products');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Caso de ACCESO DENEGADO', () => {
    test('usuario autenticado con rol sales NO tiene permiso para eliminar productos (403 Forbidden)', async () => {
      const res = await request(app)
        .delete('/api/products/1')
        .auth(salesToken, { type: 'bearer' });

      expect(res.status).toBe(403);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'Prohibido',
        data: null,
      });
    });

    test('usuario autenticado con rol sales NO tiene permiso para crear productos (403 Forbidden)', async () => {
      const newProduct = {
        name: 'Tenis No Permitidos',
        description: 'Intento de creación sin permisos',
        brand: 'Stride & Co.',
        price: 999,
      };

      const res = await request(app)
        .post('/api/products')
        .auth(salesToken, { type: 'bearer' })
        .send(newProduct);

      expect(res.status).toBe(403);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'Prohibido',
        data: null,
      });
    });

    test('usuario autenticado con rol inexistente o sin permisos recibe 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/products')
        .auth(noPermissionsToken, { type: 'bearer' });

      expect(res.status).toBe(403);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'Prohibido',
        data: null,
      });
    });
  });

  describe('3. Caso de SIN AUTENTICACIÓN (authenticate y authorize no se pisan)', () => {
    test('petición sin token devuelve 401 Unauthorized en JSON', async () => {
      const res = await request(app)
        .delete('/api/products/1');

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'No autorizado',
        data: null,
      });
      // Verifica que no se llegó a consultar permisos de roles
      expect(Role.findByPk).not.toHaveBeenCalled();
    });

    test('petición con token malformado devuelve 401 Unauthorized', async () => {
      const res = await request(app)
        .delete('/api/products/1')
        .set('Authorization', 'Bearer token-invalido-o-malformado');

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'No autorizado',
        data: null,
      });
      expect(Role.findByPk).not.toHaveBeenCalled();
    });

    test('petición con token firmado con secreto incorrecto devuelve 401 Unauthorized', async () => {
      const badToken = createToken(1, {}, 'secreto-invalido-stride');
      const res = await request(app)
        .delete('/api/products/1')
        .auth(badToken, { type: 'bearer' });

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'No autorizado',
        data: null,
      });
      expect(Role.findByPk).not.toHaveBeenCalled();
    });

    test('petición con token expirado devuelve 401 Unauthorized', async () => {
      const expiredToken = createToken(1, { expiresIn: -1 });
      const res = await request(app)
        .delete('/api/products/1')
        .auth(expiredToken, { type: 'bearer' });

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'No autorizado',
        data: null,
      });
      expect(Role.findByPk).not.toHaveBeenCalled();
    });
  });

  describe('4. Comparativa de dos roles distintos contra el mismo endpoint', () => {
    test('mismo endpoint DELETE /api/products/1: permitido para admin (200), denegado para sales (403)', async () => {
      // 1. Rol con permiso (admin) -> 200 OK
      const allowedRes = await request(app)
        .delete('/api/products/1')
        .auth(adminToken, { type: 'bearer' });

      expect(allowedRes.status).toBe(200);
      expect(allowedRes.body.message).toBe('Eliminación de producto simulada');

      // 2. Rol sin permiso (sales) -> 403 Forbidden
      const deniedRes = await request(app)
        .delete('/api/products/1')
        .auth(salesToken, { type: 'bearer' });

      expect(deniedRes.status).toBe(403);
      expect(deniedRes.body).toEqual({
        message: 'Prohibido',
        data: null,
      });
    });

    test('mismo endpoint POST /api/products: permitido para admin (201), denegado para sales (403)', async () => {
      const payload = {
        name: 'Tenis Diferenciados',
        description: 'Prueba de permisos POST',
        brand: 'Stride & Co.',
        price: 1200,
      };

      // 1. Rol con permiso (admin) -> 201 Created
      const allowedRes = await request(app)
        .post('/api/products')
        .auth(adminToken, { type: 'bearer' })
        .send(payload);

      expect(allowedRes.status).toBe(201);
      expect(allowedRes.body.data.name).toBe(payload.name);

      // 2. Rol sin permiso (sales) -> 403 Forbidden
      const deniedRes = await request(app)
        .post('/api/products')
        .auth(salesToken, { type: 'bearer' })
        .send(payload);

      expect(deniedRes.status).toBe(403);
      expect(deniedRes.body).toEqual({
        message: 'Prohibido',
        data: null,
      });
    });
  });
});
