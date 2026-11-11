const es = require('../../locales/es.json');
const { api, login, DEMO_CREDENTIALS } = require('./helpers');

function findForbiddenKeys(obj, forbiddenKeys = ['password_hash', 'salt_key']) {
  const found = [];

  function scan(current, currentPath = '') {
    if (!current || typeof current !== 'object') return;

    if (Array.isArray(current)) {
      current.forEach((item, index) => scan(item, `${currentPath}[${index}]`));
      return;
    }

    for (const [key, value] of Object.entries(current)) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      if (forbiddenKeys.includes(key)) {
        found.push(fullPath);
      }
      scan(value, fullPath);
    }
  }

  scan(obj);
  return found;
}

describe('E2E - Autenticación y JWT', () => {
  describe('(1) Login válido con cada rol demo', () => {
    const roles = Object.keys(DEMO_CREDENTIALS);

    for (const role of roles) {
      it(`rol "${role}" regresa 200, mensaje traducido y JWT de tres partes`, async () => {
        const res = await api()
          .post('/api/auth/login')
          .set('Accept-Language', 'es')
          .send(DEMO_CREDENTIALS[role]);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.body.message).toBe(es.auth.loginSuccess);

        const token = res.body?.data?.token;
        expect(typeof token).toBe('string');
        const parts = token.split('.');
        expect(parts).toHaveLength(3);
        expect(parts[0].length).toBeGreaterThan(0);
        expect(parts[1].length).toBeGreaterThan(0);
        expect(parts[2].length).toBeGreaterThan(0);
      });
    }
  });

  describe('(2) Contraseña incorrecta y usuario inexistente', () => {
    it('contraseña incorrecta regresa 401 con mensaje auth.invalidCredentials', async () => {
      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send({
          email: DEMO_CREDENTIALS.admin.email,
          password: 'PasswordCompletamenteIncorrecto-1234!',
        });

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.auth.invalidCredentials,
        data: null,
      });
    });

    it('email inexistente regresa 401 con exactamente el mismo cuerpo que contraseña incorrecta', async () => {
      const wrongPasswordRes = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send({
          email: DEMO_CREDENTIALS.admin.email,
          password: 'PasswordCompletamenteIncorrecto-1234!',
        });

      const nonExistentEmailRes = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send({
          email: 'no-existe-en-la-base@stride-demo.example',
          password: 'CualquierPassword-1234!',
        });

      expect(nonExistentEmailRes.status).toBe(401);
      expect(nonExistentEmailRes.headers['content-type']).toMatch(/json/);
      expect(nonExistentEmailRes.body).toEqual({
        message: es.auth.invalidCredentials,
        data: null,
      });
      expect(nonExistentEmailRes.body).toEqual(wrongPasswordRes.body);
    });
  });

  describe('(3) Cuerpo de login inválido', () => {
    it('regresa 400 cuando falta la contraseña', async () => {
      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send({ email: DEMO_CREDENTIALS.admin.email });

      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.auth.requiredCredentials,
        data: null,
      });
    });

    it('regresa 400 cuando falta el email', async () => {
      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send({ password: DEMO_CREDENTIALS.admin.password });

      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.auth.requiredCredentials,
        data: null,
      });
    });

    it('regresa 400 con cuerpo vacío o campos en blanco', async () => {
      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send({ email: '   ', password: '   ' });

      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.auth.requiredCredentials,
        data: null,
      });
    });
  });

  describe('(4) Rutas protegidas sin token y con token alterado', () => {
    it('GET /api/products sin encabezado Authorization regresa 401', async () => {
      const res = await api()
        .get('/api/products')
        .set('Accept-Language', 'es');

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.errors.unauthorized,
        data: null,
      });
    });

    it('GET /api/products con token alterado regresa 401', async () => {
      const validToken = await login('admin');
      const alteredToken = `${validToken.slice(0, -6)}xyz123`;

      const res = await api()
        .get('/api/products')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${alteredToken}`);

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.errors.unauthorized,
        data: null,
      });
    });

    it('GET /api/auth/me sin token regresa 401', async () => {
      const res = await api()
        .get('/api/auth/me')
        .set('Accept-Language', 'es');

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.errors.unauthorized,
        data: null,
      });
    });
  });

  describe('(5) Exclusión de password_hash y salt_key', () => {
    it('la respuesta de login no contiene password_hash ni salt_key en ningún nivel', async () => {
      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send(DEMO_CREDENTIALS.admin);

      expect(res.status).toBe(200);
      const forbidden = findForbiddenKeys(res.body);
      expect(forbidden).toEqual([]);
    });

    it('GET /api/auth/me no contiene password_hash ni salt_key en ningún nivel', async () => {
      const token = await login('admin');
      const res = await api()
        .get('/api/auth/me')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const forbidden = findForbiddenKeys(res.body);
      expect(forbidden).toEqual([]);
    });

    it('GET /api/users no contiene password_hash ni salt_key en ningún nivel', async () => {
      const adminToken = await login('admin');
      const res = await api()
        .get('/api/users')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const forbidden = findForbiddenKeys(res.body);
      expect(forbidden).toEqual([]);
    });
  });
});
