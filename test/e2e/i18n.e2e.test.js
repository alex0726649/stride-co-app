const es = require('../../locales/es.json');
const en = require('../../locales/en.json');
const { api } = require('./helpers');

describe('E2E - Internacionalización (i18n)', () => {
  describe('Error de autenticación por falta de token (401)', () => {
    it('responde en el idioma por defecto (es) sin Accept-Language ni ?lang según config/i18n.js', async () => {
      expect(es.errors.unauthorized).not.toBe(en.errors.unauthorized);

      const res = await api().get('/api/products');

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('es');
      expect(res.body).toEqual({
        message: es.errors.unauthorized,
        data: null,
      });
    });

    it('responde en español con header Accept-Language: es', async () => {
      expect(es.errors.unauthorized).not.toBe(en.errors.unauthorized);

      const res = await api()
        .get('/api/products')
        .set('Accept-Language', 'es');

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('es');
      expect(res.body).toEqual({
        message: es.errors.unauthorized,
        data: null,
      });
    });

    it('responde en inglés con header Accept-Language: en', async () => {
      expect(es.errors.unauthorized).not.toBe(en.errors.unauthorized);

      const res = await api()
        .get('/api/products')
        .set('Accept-Language', 'en');

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('en');
      expect(res.body).toEqual({
        message: en.errors.unauthorized,
        data: null,
      });
    });

    it('responde en español con query param ?lang=es', async () => {
      expect(es.errors.unauthorized).not.toBe(en.errors.unauthorized);

      const res = await api().get('/api/products?lang=es');

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('es');
      expect(res.body).toEqual({
        message: es.errors.unauthorized,
        data: null,
      });
    });

    it('responde en inglés con query param ?lang=en', async () => {
      expect(es.errors.unauthorized).not.toBe(en.errors.unauthorized);

      const res = await api().get('/api/products?lang=en');

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('en');
      expect(res.body).toEqual({
        message: en.errors.unauthorized,
        data: null,
      });
    });

    it('el query param ?lang tiene prioridad sobre el header Accept-Language', async () => {
      expect(es.errors.unauthorized).not.toBe(en.errors.unauthorized);

      const res = await api()
        .get('/api/products?lang=en')
        .set('Accept-Language', 'es');

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('en');
      expect(res.body).toEqual({
        message: en.errors.unauthorized,
        data: null,
      });
    });
  });

  describe('Error de login con credenciales inválidas (401)', () => {
    const invalidCredentials = {
      email: 'no-existe@stride-demo.example',
      password: 'PasswordIncorrecto123!',
    };

    it('responde con auth.invalidCredentials en español mediante Accept-Language', async () => {
      expect(es.auth.invalidCredentials).not.toBe(en.auth.invalidCredentials);

      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send(invalidCredentials);

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('es');
      expect(res.body).toEqual({
        message: es.auth.invalidCredentials,
        data: null,
      });
    });

    it('responde con auth.invalidCredentials en inglés mediante Accept-Language', async () => {
      expect(es.auth.invalidCredentials).not.toBe(en.auth.invalidCredentials);

      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'en')
        .send(invalidCredentials);

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('en');
      expect(res.body).toEqual({
        message: en.auth.invalidCredentials,
        data: null,
      });
    });

    it('responde con auth.invalidCredentials en español mediante ?lang=es', async () => {
      expect(es.auth.invalidCredentials).not.toBe(en.auth.invalidCredentials);

      const res = await api()
        .post('/api/auth/login?lang=es')
        .send(invalidCredentials);

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('es');
      expect(res.body).toEqual({
        message: es.auth.invalidCredentials,
        data: null,
      });
    });

    it('responde con auth.invalidCredentials en inglés mediante ?lang=en', async () => {
      expect(es.auth.invalidCredentials).not.toBe(en.auth.invalidCredentials);

      const res = await api()
        .post('/api/auth/login?lang=en')
        .send(invalidCredentials);

      expect(res.status).toBe(401);
      expect(res.headers['content-language']).toBe('en');
      expect(res.body).toEqual({
        message: en.auth.invalidCredentials,
        data: null,
      });
    });
  });

  describe('Error de login con campos faltantes (400)', () => {
    it('responde con auth.requiredCredentials en español con Accept-Language: es', async () => {
      expect(es.auth.requiredCredentials).not.toBe(en.auth.requiredCredentials);

      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'es')
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers['content-language']).toBe('es');
      expect(res.body).toEqual({
        message: es.auth.requiredCredentials,
        data: null,
      });
    });

    it('responde con auth.requiredCredentials en inglés con Accept-Language: en', async () => {
      expect(es.auth.requiredCredentials).not.toBe(en.auth.requiredCredentials);

      const res = await api()
        .post('/api/auth/login')
        .set('Accept-Language', 'en')
        .send({});

      expect(res.status).toBe(400);
      expect(res.headers['content-language']).toBe('en');
      expect(res.body).toEqual({
        message: en.auth.requiredCredentials,
        data: null,
      });
    });
  });
});
