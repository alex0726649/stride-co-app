const { api, login, cleanup } = require('../helpers');

function sqlFixtures() {
  let token;
  const created = [];

  function request(method, path) {
    return api()[method](path)
      .set('Accept-Language', 'es')
      .set('Authorization', `Bearer ${token}`);
  }

  async function post(path, body) {
    const res = await request('post', path).send(body);
    const id = res.body?.data?.id;
    if (res.status >= 200 && res.status < 300 && Number.isInteger(id) && id > 0) {
      created.unshift({ path, ids: [id] });
    }
    return res;
  }

  return {
    async authenticate() {
      token = await login('admin');
    },
    request,
    post,
    async cleanup() {
      await cleanup(token, created);
    },
  };
}

function productBody(name) {
  return { name, description: 'Producto temporal E2E', brand: 'Stride E2E', price: 120 };
}

function variantBody(productId, sku) {
  return { product_id: productId, sku, size: '27', color: 'Negro', active: true };
}

module.exports = { sqlFixtures, productBody, variantBody };
