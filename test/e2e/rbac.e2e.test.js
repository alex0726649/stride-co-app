const es = require('../../locales/es.json');
const { api, login } = require('./helpers');

describe('E2E - Control de Acceso Basado en Roles (RBAC)', () => {
  let adminToken;
  let salesToken;
  let userToken;

  const createdProductIds = [];
  const createdCustomerIds = [];
  const createdOrderIds = [];

  beforeAll(async () => {
    adminToken = await login('admin');
    salesToken = await login('sales');
    userToken = await login('user');
  });

  afterAll(async () => {
    if (!adminToken) return;

    // 1. Borrar órdenes
    for (const id of createdOrderIds.reverse()) {
      try {
        const res = await api()
          .delete(`/api/orders/${id}`)
          .set('Accept-Language', 'es')
          .set('Authorization', `Bearer ${adminToken}`);
        if (res.status !== 200 && res.status !== 404) {
          console.warn(`[afterAll Cleanup] Recurso: orders, ID: ${id}, Status: ${res.status}, Mensaje: ${res.body?.message || res.text}`);
        }
      } catch (error) {
        console.warn(`[afterAll Cleanup] Recurso: orders, ID: ${id}, Error: ${error.message}`);
      }
    }

    // 2. Borrar clientes
    for (const id of createdCustomerIds.reverse()) {
      try {
        const res = await api()
          .delete(`/api/customers/${id}`)
          .set('Accept-Language', 'es')
          .set('Authorization', `Bearer ${adminToken}`);
        if (res.status !== 200 && res.status !== 404) {
          console.warn(`[afterAll Cleanup] Recurso: customers, ID: ${id}, Status: ${res.status}, Mensaje: ${res.body?.message || res.text}`);
        }
      } catch (error) {
        console.warn(`[afterAll Cleanup] Recurso: customers, ID: ${id}, Error: ${error.message}`);
      }
    }

    // 3. Borrar productos
    for (const id of createdProductIds.reverse()) {
      try {
        const res = await api()
          .delete(`/api/products/${id}`)
          .set('Accept-Language', 'es')
          .set('Authorization', `Bearer ${adminToken}`);
        if (res.status !== 200 && res.status !== 404) {
          console.warn(`[afterAll Cleanup] Recurso: products, ID: ${id}, Status: ${res.status}, Mensaje: ${res.body?.message || res.text}`);
        }
      } catch (error) {
        console.warn(`[afterAll Cleanup] Recurso: products, ID: ${id}, Error: ${error.message}`);
      }
    }
  });

  describe('(1) ADMIN products:delete:any', () => {
    it('el admin crea un producto y lo elimina exitosamente con código 200', async () => {
      const createRes = await api()
        .post('/api/products')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Producto Admin E2E',
          description: 'Producto temporal para probar eliminación por admin',
          brand: 'Stride Admin Brand',
          price: 199.99,
        });

      expect(createRes.status).toBe(201);
      const productId = createRes.body?.data?.id ?? createRes.body?.id;
      createdProductIds.push(productId);

      const deleteRes = await api()
        .delete(`/api/products/${productId}`)
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toEqual({
        message: es.products.deleted,
        data: null,
      });
    });

    it('el admin envía un cuerpo inválido (sin name) y recibe 400 con data: null', async () => {
      const res = await api()
        .post('/api/products')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Producto sin campo name',
          brand: 'Stride Brand',
          price: 120.00,
        });

      const productId = res.body?.data?.id ?? res.body?.id;
      if (productId) {
        createdProductIds.push(productId);
      }

      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.products.invalidBody,
        data: null,
      });
    });
  });

  describe('(2) SALES products:delete:any', () => {
    it('sales intenta eliminar un producto creado por admin y recibe 403', async () => {
      const createRes = await api()
        .post('/api/products')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Producto Protegido de Ventas',
          description: 'Producto para validar rechazo 403 ante rol sales',
          brand: 'Stride Brand',
          price: 250.00,
        });

      expect(createRes.status).toBe(201);
      const productId = createRes.body?.data?.id ?? createRes.body?.id;
      createdProductIds.push(productId);

      const deleteRes = await api()
        .delete(`/api/products/${productId}`)
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${salesToken}`);

      expect(deleteRes.status).toBe(403);
      expect(deleteRes.headers['content-type']).toMatch(/json/);
      expect(deleteRes.body).toEqual({
        message: es.errors.forbidden,
        data: null,
      });
    });
  });

  describe('(3) USER orders:read:own', () => {
    it('el usuario user crea/usa su customer y su orden propia y la lee con éxito', async () => {
      // 1. Obtener id del usuario 'user'
      const meRes = await api()
        .get('/api/auth/me')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${userToken}`);
      expect(meRes.status).toBe(200);
      const userId = meRes.body.id;
      expect(userId).toBeDefined();

      // 2. Reutilizar customer si ya existe para este usuario o crear uno nuevo
      const customersRes = await api()
        .get('/api/customers')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(customersRes.status).toBe(200);

      const existingCustomer = Array.isArray(customersRes.body?.data)
        ? customersRes.body.data.find(c => String(c.userId) === String(userId))
        : null;

      let customerId;
      if (existingCustomer) {
        customerId = existingCustomer._id || existingCustomer.id;
      } else {
        const customerRes = await api()
          .post('/api/customers')
          .set('Accept-Language', 'es')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            userId,
            phone: '5551234567',
            email: `cliente-user-${Date.now()}@stride-demo.example`,
          });
        expect(customerRes.status).toBe(201);
        customerId = customerRes.body?.data?._id || customerRes.body?.data?.id;
        createdCustomerIds.push(customerId);
      }
      expect(customerId).toBeDefined();

      // 3. Crear producto en catálogo para los ítems de la orden
      const prodRes = await api()
        .post('/api/products')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Producto Item Orden Propia',
          description: 'Producto para ítems de orden propia',
          brand: 'Stride E2E',
          price: 50.00,
        });
      expect(prodRes.status).toBe(201);
      const productId = prodRes.body?.data?.id ?? prodRes.body?.id;
      createdProductIds.push(productId);

      // 4. Crear orden propia (paymentMethod: 'efectivo', items con productId y quantity)
      const createOrderRes = await api()
        .post('/api/orders')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          customerId,
          paymentMethod: 'efectivo',
          items: [{ productId, quantity: 2 }],
        });
      expect(createOrderRes.status).toBe(201);
      const orderId = createOrderRes.body?.data?._id || createOrderRes.body?.data?.id;
      expect(orderId).toBeDefined();
      createdOrderIds.push(orderId);

      // 5. Leer la orden propia con user
      const readOrderRes = await api()
        .get(`/api/orders/${orderId}`)
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${userToken}`);

      expect(readOrderRes.status).toBe(200);
      expect(readOrderRes.body.message).toBe(es.orders.found);
      const returnedOrderId = readOrderRes.body?.data?._id || readOrderRes.body?.data?.id;
      expect(String(returnedOrderId)).toBe(String(orderId));
    });
  });

  describe('(4) USER orders:read:own sobre la orden de otro', () => {
    it('user intenta leer la orden de otro customer y recibe 403', async () => {
      // 1. Obtener id del usuario 'admin'
      const adminMeRes = await api()
        .get('/api/auth/me')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminMeRes.status).toBe(200);
      const adminUserId = adminMeRes.body.id;

      // 2. Obtener o crear customer para admin
      const customersRes = await api()
        .get('/api/customers')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(customersRes.status).toBe(200);

      const existingAdminCustomer = Array.isArray(customersRes.body?.data)
        ? customersRes.body.data.find(c => String(c.userId) === String(adminUserId))
        : null;

      let otherCustomerId;
      if (existingAdminCustomer) {
        otherCustomerId = existingAdminCustomer._id || existingAdminCustomer.id;
      } else {
        const otherCustomerRes = await api()
          .post('/api/customers')
          .set('Accept-Language', 'es')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: adminUserId,
            phone: '5559876543',
            email: `cliente-admin-${Date.now()}@stride-demo.example`,
          });
        expect(otherCustomerRes.status).toBe(201);
        otherCustomerId = otherCustomerRes.body?.data?._id || otherCustomerRes.body?.data?.id;
        createdCustomerIds.push(otherCustomerId);
      }

      // 3. Crear producto para la orden
      const prodRes = await api()
        .post('/api/products')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Producto Item Orden Ajena',
          description: 'Producto para orden ajena',
          brand: 'Stride E2E',
          price: 75.00,
        });
      expect(prodRes.status).toBe(201);
      const productId = prodRes.body?.data?.id ?? prodRes.body?.id;
      createdProductIds.push(productId);

      // 4. Crear orden a nombre de admin
      const otherOrderRes = await api()
        .post('/api/orders')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: otherCustomerId,
          paymentMethod: 'transferencia',
          items: [{ productId, quantity: 1 }],
        });
      expect(otherOrderRes.status).toBe(201);
      const otherOrderId = otherOrderRes.body?.data?._id || otherOrderRes.body?.data?.id;
      createdOrderIds.push(otherOrderId);

      // 5. El usuario 'user' intenta leer la orden de admin y recibe 403
      const readRes = await api()
        .get(`/api/orders/${otherOrderId}`)
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${userToken}`);

      expect(readRes.status).toBe(403);
      expect(readRes.headers['content-type']).toMatch(/json/);
      expect(readRes.body).toEqual({
        message: es.errors.forbidden,
        data: null,
      });
    });
  });

  describe('(5) USER orders:read:any', () => {
    it('user intenta consultar la lista general de órdenes y recibe 403', async () => {
      const res = await api()
        .get('/api/orders')
        .set('Accept-Language', 'es')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: es.errors.forbidden,
        data: null,
      });
    });
  });
});
