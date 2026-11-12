# Rupturas a propósito de las pruebas E2E

Generado: 2026-11-12T06:17:36.421Z · Rupturas: 34 · Fallaron como se esperaba: 34

Cada ruptura modifica una sola prueba, corre solo esa prueba con `-t` y restaura el archivo. El criterio es que Jest termine con código distinto de 0 y `Tests: 1 failed`; en C1, que la suite falle por la limpieza del id inválido.

| ID | Suite | Prueba | Cambio | Exit | Resultado | Log |
|---|---|---|---|---|---|---|
| T01 | health | GET /health responde 200 con estado UP sin requerir token | `{ status: 'UP' }` → `{ status: 'DOWN' }` | 1 | ✅ Falló | [T01.txt](T01.txt) |
| T02 | auth | rol "admin" regresa 200, mensaje traducido y JWT de tres partes | `expect(parts).toHaveLength(3);` → `expect(parts).toHaveLength(2);` | 1 | ✅ Falló | [T02.txt](T02.txt) |
| T03 | auth | rol "sales" regresa 200, mensaje traducido y JWT de tres partes | `expect(parts).toHaveLength(3);` → `expect(parts).toHaveLength(2);` | 1 | ✅ Falló | [T03.txt](T03.txt) |
| T04 | auth | rol "user" regresa 200, mensaje traducido y JWT de tres partes | `expect(parts).toHaveLength(3);` → `expect(parts).toHaveLength(2);` | 1 | ✅ Falló | [T04.txt](T04.txt) |
| T05 | auth | contraseña incorrecta regresa 401 con mensaje auth.invalidCredentials | `expect(res.status).toBe(401);` → `expect(res.status).toBe(200);` | 1 | ✅ Falló | [T05.txt](T05.txt) |
| T06 | auth | email inexistente regresa 401 con exactamente el mismo cuerpo que contraseña incorrecta | `expect(nonExistentEmailRes.status).toBe(401);` → `expect(nonExistentEmailRes.status).toBe(200);` | 1 | ✅ Falló | [T06.txt](T06.txt) |
| T07 | auth | regresa 400 cuando falta la contraseña | `.send({ email: DEMO_CREDENTIALS.admin.email })` → `.send(DEMO_CREDENTIALS.admin)` | 1 | ✅ Falló | [T07.txt](T07.txt) |
| T08 | auth | regresa 400 cuando falta el email | `.send({ password: DEMO_CREDENTIALS.admin.password })` → `.send(DEMO_CREDENTIALS.admin)` | 1 | ✅ Falló | [T08.txt](T08.txt) |
| T09 | auth | regresa 400 con cuerpo vacío o campos en blanco | `.send({ email: '   ', password: '   ' })` → `.send(DEMO_CREDENTIALS.admin)` | 1 | ✅ Falló | [T09.txt](T09.txt) |
| T10 | auth | GET /api/products sin encabezado Authorization regresa 401 | `expect(res.status).toBe(401);` → `expect(res.status).toBe(200);` | 1 | ✅ Falló | [T10.txt](T10.txt) |
| T11 | auth | GET /api/products con token alterado regresa 401 | ``Bearer ${alteredToken}`` → ``Bearer ${validToken}`` | 1 | ✅ Falló | [T11.txt](T11.txt) |
| T12 | auth | GET /api/auth/me sin token regresa 401 | `expect(res.status).toBe(401);` → `expect(res.status).toBe(200);` | 1 | ✅ Falló | [T12.txt](T12.txt) |
| T13 | auth | la respuesta de login no contiene password_hash ni salt_key en ningún nivel | `findForbiddenKeys(res.body)` → `findForbiddenKeys(res.body, ['password_hash', 'salt_key', 'token'])` | 1 | ✅ Falló | [T13.txt](T13.txt) |
| T14 | auth | GET /api/auth/me no contiene password_hash ni salt_key en ningún nivel | `findForbiddenKeys(res.body)` → `findForbiddenKeys(res.body, ['password_hash', 'salt_key', 'email'])` | 1 | ✅ Falló | [T14.txt](T14.txt) |
| T15 | auth | GET /api/users no contiene password_hash ni salt_key en ningún nivel | `findForbiddenKeys(res.body)` → `findForbiddenKeys(res.body, ['password_hash', 'salt_key', 'email'])` | 1 | ✅ Falló | [T15.txt](T15.txt) |
| T16 | rbac | el admin crea un producto y lo elimina exitosamente con código 200 | `expect(deleteRes.status).toBe(200);` → `expect(deleteRes.status).toBe(403);` | 1 | ✅ Falló | [T16.txt](T16.txt) |
| T17 | rbac | el admin envía un cuerpo inválido (sin name) y recibe 400 con data: null | `description: 'Producto sin campo name',` → `name: 'Con nombre', description: 'Producto sin campo name',` | 1 | ✅ Falló | [T17.txt](T17.txt) |
| T18 | rbac | sales intenta eliminar un producto creado por admin y recibe 403 | ``Bearer ${salesToken}`` → ``Bearer ${adminToken}`` | 1 | ✅ Falló | [T18.txt](T18.txt) |
| T19 | rbac | el usuario user crea/usa su customer y su orden propia y la lee con éxito | `expect(readOrderRes.status).toBe(200);` → `expect(readOrderRes.status).toBe(403);` | 1 | ✅ Falló | [T19.txt](T19.txt) |
| T20 | rbac | user intenta leer la orden de otro customer y recibe 403 | ``Bearer ${userToken}`` → ``Bearer ${adminToken}`` | 1 | ✅ Falló | [T20.txt](T20.txt) |
| T21 | rbac | user intenta consultar la lista general de órdenes y recibe 403 | ``Bearer ${userToken}`` → ``Bearer ${adminToken}`` | 1 | ✅ Falló | [T21.txt](T21.txt) |
| T22 | i18n | responde en el idioma por defecto (es) sin Accept-Language ni ?lang según config/i18n.js | `expect(res.headers['content-language']).toBe('es');` → `expect(res.headers['content-language']).toBe('en');` | 1 | ✅ Falló | [T22.txt](T22.txt) |
| T23 | i18n | responde en español con header Accept-Language: es | `.set('Accept-Language', 'es')` → `.set('Accept-Language', 'en')` | 1 | ✅ Falló | [T23.txt](T23.txt) |
| T24 | i18n | responde en inglés con header Accept-Language: en | `.set('Accept-Language', 'en')` → `.set('Accept-Language', 'es')` | 1 | ✅ Falló | [T24.txt](T24.txt) |
| T25 | i18n | responde en español con query param ?lang=es | `'/api/products?lang=es'` → `'/api/products?lang=en'` | 1 | ✅ Falló | [T25.txt](T25.txt) |
| T26 | i18n | responde en inglés con query param ?lang=en | `'/api/products?lang=en'` → `'/api/products?lang=es'` | 1 | ✅ Falló | [T26.txt](T26.txt) |
| T27 | i18n | el query param ?lang tiene prioridad sobre el header Accept-Language | `'/api/products?lang=en'` → `'/api/products'` | 1 | ✅ Falló | [T27.txt](T27.txt) |
| T28 | i18n | responde con auth.invalidCredentials en español mediante Accept-Language | `.set('Accept-Language', 'es')` → `.set('Accept-Language', 'en')` | 1 | ✅ Falló | [T28.txt](T28.txt) |
| T29 | i18n | responde con auth.invalidCredentials en inglés mediante Accept-Language | `.set('Accept-Language', 'en')` → `.set('Accept-Language', 'es')` | 1 | ✅ Falló | [T29.txt](T29.txt) |
| T30 | i18n | responde con auth.invalidCredentials en español mediante ?lang=es | `'/api/auth/login?lang=es'` → `'/api/auth/login?lang=en'` | 1 | ✅ Falló | [T30.txt](T30.txt) |
| T31 | i18n | responde con auth.invalidCredentials en inglés mediante ?lang=en | `'/api/auth/login?lang=en'` → `'/api/auth/login?lang=es'` | 1 | ✅ Falló | [T31.txt](T31.txt) |
| T32 | i18n | responde con auth.requiredCredentials en español con Accept-Language: es | `.set('Accept-Language', 'es')` → `.set('Accept-Language', 'en')` | 1 | ✅ Falló | [T32.txt](T32.txt) |
| T33 | i18n | responde con auth.requiredCredentials en inglés con Accept-Language: en | `.set('Accept-Language', 'en')` → `.set('Accept-Language', 'es')` | 1 | ✅ Falló | [T33.txt](T33.txt) |
| C1 | rbac | Limpieza en afterAll | `ids: [...createdOrderIds].reverse()` → `ids: ['no-es-un-id', ...createdOrderIds].reverse()` | 1 | ✅ Falló | [C1.txt](C1.txt) |
