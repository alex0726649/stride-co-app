const request = require('supertest');
const config = require('config');

const baseUrl = process.env.E2E_BASE_URL || config.get('e2e.baseUrl');

const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@stride-demo.example',
    password: 'StrideDemo-Admin-2026!',
  },
  sales: {
    email: 'sales@stride-demo.example',
    password: 'StrideDemo-Sales-2026!',
  },
  user: {
    email: 'user@stride-demo.example',
    password: 'StrideDemo-User-2026!',
  },
};

function api() {
  return request(baseUrl);
}

async function login(rol) {
  const credentials = DEMO_CREDENTIALS[rol];
  if (!credentials) {
    throw new Error(`Rol desconocido para login demo: "${rol}". Se esperaba admin, sales o user.`);
  }

  const res = await api()
    .post('/api/auth/login')
    .set('Accept-Language', 'es')
    .send(credentials);

  if (res.status !== 200) {
    const errorDetail = res.body?.message || res.text || 'Sin detalle';
    throw new Error(`Error en login demo para rol "${rol}" (HTTP ${res.status}): ${errorDetail}`);
  }

  const token = res.body?.data?.token;
  if (!token) {
    throw new Error(`Respuesta de login para "${rol}" no contiene el token en data.token`);
  }

  return token;
}

module.exports = {
  baseUrl,
  api,
  login,
  DEMO_CREDENTIALS,
};
