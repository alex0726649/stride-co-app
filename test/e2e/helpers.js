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

async function cleanup(token, resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return;
  }

  const authHeader = token && token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const errors = [];

  for (const resource of resources) {
    const resourcePath = resource.path;
    const ids = Array.isArray(resource.ids) ? resource.ids : [];

    for (const id of ids) {
      if (id === undefined || id === null) {
        continue;
      }

      const endpoint = `${resourcePath.replace(/\/+$/, '')}/${id}`;

      try {
        const res = await api()
          .delete(endpoint)
          .set('Accept-Language', 'es')
          .set('Authorization', authHeader);

        if (res.status !== 200 && res.status !== 404) {
          errors.push({
            recurso: resourcePath,
            id,
            status: res.status,
            message: res.body?.message || res.text || `HTTP ${res.status}`,
          });
        }
      } catch (error) {
        errors.push({
          recurso: resourcePath,
          id,
          status: null,
          message: error.code || error.message || 'Error de red',
        });
      }
    }
  }

  if (errors.length > 0) {
    const details = errors
      .map(
        (e) => `  - ${e.recurso} id=${e.id} status=${e.status} ${e.message}`
      )
      .join('\n');

    throw new Error(`Cleanup falló con ${errors.length} error(es):\n${details}`);
  }
}

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

module.exports = {
  baseUrl,
  api,
  login,
  cleanup,
  DEMO_CREDENTIALS,
  findForbiddenKeys,
};
