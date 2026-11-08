# Contrato de API — Sprint 1

Este documento es el acuerdo del equipo sobre las rutas, datos y respuestas del backend de Stride & Co.

Se basa en las secciones 3.3, 3.4 y 3.6 del entregable 1 del profesor. La selección de operaciones y las convenciones siguientes son decisiones del equipo para implementar sus ocho recursos de forma consistente.

## 1. Alcance: datos mock fijos

En este sprint las respuestas usan datos de ejemplo escritos en el código (hardcoded). No hay conexión a SQL ni MongoDB.

Cada recurso tendrá un arreglo fijo de objetos para reutilizarlo al listar y buscar por ID. Ese arreglo no se modifica: no estamos construyendo una base de datos en memoria.

- GET devuelve datos del arreglo fijo.
- POST valida los datos recibidos y devuelve el objeto que se habría creado, con un ID de ejemplo.
- PUT valida el ID y los datos recibidos y devuelve el objeto que se habría actualizado.
- DELETE verifica el ID y devuelve una confirmación de eliminación simulada.
- POST, PUT y DELETE no modifican los arreglos. Un GET posterior seguirá devolviendo los datos originales.

Esto permite comprobar el flujo petición → ruta → controlador → respuesta, que es el objetivo de esta entrega.

## 2. Los ocho recursos

| Recurso | Ruta base | Modelo de referencia |
|---|---|---|
| Usuarios | `/api/users` | User, SQL |
| Roles | `/api/roles` | Role, SQL |
| Permisos | `/api/permissions` | Permission, SQL |
| Productos | `/api/products` | Product, SQL, para los mocks de este sprint |
| Variantes | `/api/variants` | ProductVariant, SQL |
| Inventario | `/api/inventory` | Inventory, SQL |
| Clientes | `/api/customers` | customers, MongoDB |
| Órdenes | `/api/orders` | orders, MongoDB |

Productos aparece en ambos modelos del PDF. Por decision del profesor, la coleccion `products` de MongoDB se elimina del modelo final del proyecto: los productos se conservan unicamente en el modelo relacional. Para el Entregable 1 el recurso `/api/products` se entrega como mock porque la rubrica lo solicita de forma explicita, usando la forma SQL. En consecuencia, `ProductVariant.product_id` y el inventario siguen refiriendo a identificadores enteros.

## 3. Operaciones acordadas

| Recursos | Operaciones |
|---|---|
| users, roles, permissions, products, variants, customers | Listar, consultar por ID, crear, actualizar y eliminar |
| inventory | Listar, consultar por ID y actualizar existencias |
| orders | Listar, consultar por ID, crear y actualizar |

Inventario se consulta y ajusta mediante sus existencias. Las órdenes se conservan: un cambio de estado se representa mediante una actualización. Son decisiones de alcance permitidas por la sección 3.4; no todos los recursos necesitan las mismas operaciones.

Ejemplo con productos, aplicable a los demás recursos según la tabla anterior:

| Método y ruta | Acción | Código de éxito |
|---|---|---|
| `GET /api/products` | Listar productos | 200 |
| `GET /api/products/:id` | Consultar un producto | 200 |
| `POST /api/products` | Simular creación | 201 |
| `PUT /api/products/:id` | Simular actualización | 200 |
| `DELETE /api/products/:id` | Simular eliminación | 200 |

`:id` es un valor que se sustituye en la dirección. Por ejemplo, `/api/products/1` busca el producto con ID 1. Inventario se consulta por el ID del registro de inventario.

## 4. Formato común de respuesta

Todas las respuestas de la API usan JSON y contienen:

- `message`: texto que explica el resultado.
- `data`: arreglo al listar, objeto al consultar/crear/actualizar, o `null` al eliminar o responder un error.

Los mensajes se escriben en español, salvo `GET products`, conservado del ejemplo del profesor. Los nombres de campos siguen el modelo del PDF: por ejemplo, `role_id` en usuarios y `userId` en clientes. Los ejemplos mínimos de clientes siguientes omiten sus fechas de ejemplo; la respuesta completa también contiene `createdAt` y `updatedAt` (sección 12).

### Listar clientes

Petición: `GET /api/customers`

Respuesta: HTTP 200.

```json
{
  "message": "Lista de clientes",
  "data": [
    {
      "_id": "cliente-1",
      "userId": 1,
      "phone": "6141234567",
      "email": "cliente@example.com",
      "addresses": []
    }
  ]
}
```

### Consultar un cliente

Petición: `GET /api/customers/cliente-1`

Respuesta: HTTP 200.

```json
{
  "message": "Cliente encontrado",
  "data": {
    "_id": "cliente-1",
    "userId": 1,
    "phone": "6141234567",
    "email": "cliente@example.com",
    "addresses": []
  }
}
```

### Crear un cliente de forma simulada

Petición: `POST /api/customers`, con `Content-Type: application/json`.

Cuerpo enviado:

```json
{
  "userId": 1,
  "phone": "6147654321",
  "email": "nuevo@example.com",
  "addresses": []
}
```

Respuesta: HTTP 201.

```json
{
  "message": "Creación de cliente simulada",
  "data": {
    "_id": "cliente-nuevo",
    "userId": 1,
    "phone": "6147654321",
    "email": "nuevo@example.com",
    "addresses": []
  }
}
```

El ID de creación es fijo para pruebas; no existe garantía de unicidad en este mock. Consultar después `/api/customers/cliente-nuevo` devuelve 404 porque no se guardó.

### Eliminar de forma simulada

Petición: `DELETE /api/customers/cliente-1`

Respuesta: HTTP 200.

```json
{
  "message": "Eliminación de cliente simulada",
  "data": null
}
```

El cliente original seguirá disponible en GET.

## 5. IDs y datos de prueba

- Los recursos de referencia SQL usan `id` numérico; por ejemplo, `1`.
- Clientes y órdenes usan `_id` de texto; por ejemplo, `cliente-1` y `orden-1`. Son identificadores simplificados para mocks, no ObjectId reales de MongoDB.
- Cada recurso tendrá al menos un registro conocido para probar consultas exitosas.
- Las referencias entre mocks deben coincidir: por ejemplo, una orden con `customerId: "cliente-1"` corresponde al cliente del ejemplo.
- Los ejemplos anteriores muestran una forma mínima. Al implementar cada recurso se documentarán sus campos y validaciones tomando como referencia la figura 1 del PDF.
- No incluir contraseñas, hashes, salts ni datos personales reales en las respuestas de ejemplo.

## 6. Validación básica de escrituras

Para mantener sencillo este sprint, POST y PUT exigirán al menos los campos de esta tabla. PUT recibirá los mismos campos obligatorios que POST; en inventario recibirá `stock` y `reserved`. Estas son convenciones iniciales del equipo, no una implementación completa de reglas de negocio.

| Recurso | Campos obligatorios |
|---|---|
| users | `first_name`, `last_name`, `email`, `role_id` |
| roles | `name` |
| permissions | `key`, `description` |
| products | `name`, `description`, `brand`, `price` |
| variants | `product_id`, `sku`, `size`, `color` |
| inventory | `stock`, `reserved` |
| customers | `userId`, `phone`, `email` |
| orders | `customerId`, `salesPersonId`, `paymentMethod`, `items` |

- Los textos obligatorios no pueden estar vacíos ni contener solo espacios.
- Los IDs de referencia SQL deben ser enteros positivos; los IDs de referencia MongoDB mock deben ser textos no vacíos.
- `price` debe ser un número mayor o igual a cero.
- `stock` y `reserved` deben ser enteros mayores o iguales a cero; `reserved` no puede superar `stock`.
- `items` debe ser un arreglo no vacío. Cada artículo debe incluir `productId` entero positivo, `quantity` entero positivo y `unitPrice` numérico mayor o igual a cero.
- Para el mock inicial, `paymentMethod` acepta `efectivo` o `transferencia`. Es una elección provisional del equipo, pues el diagrama indica un enum sin enumerar sus valores.
- En órdenes, `items` solo admite objetos; rechaza elementos nulos, arreglos y primitivas. Sus IDs y cantidades deben ser enteros positivos seguros, y los precios y el subtotal deben ser finitos. `shippingAddress` y `status` son opcionales, con las validaciones descritas en la sección 13.
- En clientes, `addresses` es opcional; si se envía debe ser un arreglo de direcciones completas (puede estar vacío), conforme a la sección 12.
- Los IDs del objeto devuelto los determina el controlador; el cliente no los crea ni cambia mediante el cuerpo de POST o PUT.
- En PUT y DELETE se verifica primero que exista el ID solicitado. No se exige todavía consultar otras bases de datos ni aplicar autenticación, reservas o cobros.
- Permisos: el modelo marca `key` como UNIQUE. En los mocks esa unicidad se verifica unicamente contra los datos fijos del recurso, no contra una base de datos. Una actualizacion puede conservar su propio `key` sin considerarse duplicado.
- Roles y permisos tienen una relacion N:M mediante `Role_Permission` en el modelo relacional. El Entregable 1 no solicita ese recurso ni permisos efectivos, por lo que ambos se entregan planos y la relacion se implementara cuando se incorpore la persistencia.

## 7. Errores

| Situación | Código HTTP |
|---|---|
| Consulta, actualización o eliminación simulada correcta | 200 |
| Creación simulada correcta | 201 |
| Cuerpo JSON malformado, campo obligatorio ausente o dato inválido | 400 |
| ID no encontrado en los mocks o ruta inexistente | 404 |
| Error inesperado del servidor | 500 |

Para simplificar las búsquedas mock, cualquier ID de ruta que no corresponda a un registro existente devuelve 404. Las validaciones de 400 se aplican al cuerpo de la petición.

Ejemplo: `GET /api/customers/no-existe`, HTTP 404.

```json
{
  "message": "Cliente no encontrado",
  "data": null
}
```

Ejemplo: POST sin `email`, HTTP 400.

```json
{
  "message": "El email es obligatorio",
  "data": null
}
```

Los errores inesperados responderán `Error interno del servidor`, sin exponer detalles internos.

## 8. Qué debe comprobar cada integrante

- Su ruta está montada bajo `/api` y delega el procesamiento a un controlador separado.
- GET de lista devuelve un arreglo y GET por ID devuelve el objeto correcto.
- Un ID desconocido devuelve 404.
- Las escrituras válidas devuelven el código y formato acordados.
- Un cuerpo inválido devuelve 400 cuando corresponde.
- Las escrituras no alteran los datos fijos que devuelve GET.
- Las pruebas automatizadas del recurso y ESLint pasan cuando estén configurados.

Este documento describe el comportamiento acordado. Su existencia no significa que los endpoints ya estén implementados.

## 9. Usuarios implementados (S1-03)

`/api/users` admite GET y POST; `/api/users/:id` admite GET, PUT y DELETE.
Los registros fijos tienen IDs 1 y 2, ambos con `role_id: 1` como referencia
para el mock de roles. POST devuelve el ID de ejemplo 3, sin guardarlo.

Los campos públicos son `id`, `first_name`, `last_name`, `email` y `role_id`.
POST y PUT requieren los cuatro últimos campos: los textos deben ser cadenas
no vacías (ni solo espacios) y `role_id` un número entero positivo seguro.
En este sprint no se valida el formato de email ni la existencia del rol.
Los campos adicionales se ignoran; nunca se reflejan contraseñas, hashes o salts.
El ID del cuerpo se ignora: POST asigna 3 y PUT conserva el ID de la ruta.
Los IDs de ruta se comparan con la representación decimal exacta del fixture.
Un ID desconocido en PUT devuelve 404 antes de validar sus campos.

Ejemplo de cuerpo válido para POST o PUT:

```json
{"first_name":"Eva","last_name":"Ejemplo","email":"eva@example.com","role_id":1}
```

Las pruebas en `test/users.test.js` verifican éxito, errores y que ninguna
escritura modifica los registros originales. Ejecutar `npm run lint` y
`npm test -- --runInBand` desde la raíz del repositorio.

## 10. Variantes implementadas (S1-07)

`/api/variants` admite GET (`list`) y POST (`create`);
`/api/variants/:id` admite GET (`find`), PUT (`update`) y DELETE (`destroy`).
Las funciones se exportan desde `controllers/variants.js`.

Los campos de ProductVariant en la figura 1 son `id`, `product_id`, `sku`,
`size`, `color` y `active`. Los fixtures tienen IDs 1 y 2 y referencian el
producto 1 (Tenis Deportivos Stride). POST asigna el ID fijo 3.

POST y PUT requieren `product_id` como número entero positivo seguro y
`sku`, `size` y `color` como textos no vacíos ni compuestos solo por espacios.
`active` es opcional y debe ser booleano: por defecto es `true` al crear;
al actualizar se conserva el valor del fixture si se omite.
El SKU es único contra los fixtures mediante comparación exacta, conforme
al modelo; PUT puede conservar su propio SKU. Un duplicado devuelve 400.
No se consulta la existencia del producto al escribir en este sprint.
Los campos adicionales se ignoran y el ID del cuerpo no reemplaza el asignado
por el controlador. Los IDs de ruta se comparan con su representación decimal
exacta; cualquier ID no encontrado devuelve 404, antes de validar campos en PUT.

Ejemplo de cuerpo para POST o PUT:

```json
{"product_id":1,"sku":"STRIDE-28-AZUL","size":"28","color":"Azul","active":true}
```

POST devuelve 201 con `message: "Creación de variante simulada"` y `data`
con esos campos e `id: 3`. PUT devuelve 200 con el ID de la ruta; DELETE
responde 200 con `message: "Eliminación de variante simulada"` y `data: null`.
Ninguna escritura persiste: GET mantiene los fixtures y GET `/api/variants/3`
sigue devolviendo 404. Las pruebas en `test/variants.test.js` cubren las cinco
operaciones, referencias, validaciones y ausencia de persistencia.

## 11. Productos implementados (S1-06)

Las funciones exportadas son `list`, `find`, `create`, `update` y `destroy`.
GET de lista y por ID, POST, PUT y DELETE están implementados. El fixture
es el producto 1; POST devuelve el ID 2 sin guardarlo. Las escrituras requieren
`name`, `description` y `brand` como textos no vacíos, además de `price` numérico
mayor o igual a cero. `category_id` y `active` son opcionales y no tienen validación
de tipo propia en esta versión: `category_id` usa 1 si recibe un valor falsy,
y `active` usa `true` si se omite. El ID del cuerpo se ignora.

```json
{"name":"Tenis de Prueba","description":"Calzado deportivo","brand":"Stride & Co.","price":500,"category_id":1,"active":true}
```

## 12. Clientes implementados (S1-09)

Las funciones son `list`, `find`, `create`, `update` y `destroy`.
GET consulta `cliente-1`; POST devuelve `cliente-nuevo`. PUT y DELETE
validan primero el ID de ruta; uno desconocido responde 404.

POST y PUT requieren `userId` entero positivo seguro, `phone` y `email`
como textos no vacíos. No se valida todavía el formato del correo ni se busca
el usuario referenciado al escribir. Un cuerpo ausente, arreglo o JSON malformado
responde 400.

`addresses` es opcional. Cada dirección debe tener `type` igual a `shipping`
o `billing` y los textos no vacíos `street`, `number`, `city`, `state`,
`postalCode` y `country`. Incluso `number` y `postalCode` se envían como cadenas.
Se rechazan direcciones nulas, incompletas o de otro tipo con 400.
Al crear, omitir `addresses` devuelve `[]`; al actualizar, conserva las del
fixture. Enviar `[]` simula quitarlas. Los campos adicionales, incluso dentro
de una dirección, se ignoran; el controlador determina `_id` y las fechas.

Las fechas son valores mock ISO: creación `2026-09-01T12:00:00.000Z` y
actualización simulada `2026-09-02T12:00:00.000Z`. Las escrituras no cambian
el fixture. Las pruebas cubren las cinco operaciones, errores, estructura,
parámetros, filtrado de campos y ausencia de persistencia.

## 13. Órdenes implementadas (S1-10)

Las funciones son `listOrders`, `getOrderById`, `createOrder` y `updateOrder`.
Los fixtures `orden-1` y `orden-2` referencian `cliente-1`, al usuario 1 y
al producto 1. El inventario tiene un registro por cada variante existente
(1 y 2). `test/fixtures.test.js` comprueba estas relaciones.

Las respuestas siguen la figura 1: `_id`, `customerId`, `salesPersonId`,
`paymentMethod`, `totals`, `shippingAddress`, `items`, `statusHistory`,
`createdAt` y `updatedAt`. El modelo de respuesta reemplaza los antiguos
campos planos `total` y `status`: ahora se consultan `totals.total` y
`statusHistory[statusHistory.length - 1].status`.

Ejemplo de cuerpo POST o PUT:

```json
{
  "customerId": "cliente-1",
  "salesPersonId": 1,
  "paymentMethod": "efectivo",
  "items": [{ "productId": 1, "quantity": 2, "unitPrice": 1299 }],
  "shippingAddress": {
    "street": "Calle Universidad", "number": "123", "city": "Chihuahua",
    "state": "Chihuahua", "postalCode": "31000", "country": "México"
  }
}
```

POST devuelve 201 con `message: "Creación de orden simulada"` y este `data`:

```json
{
  "_id": "orden-nueva",
  "customerId": "cliente-1",
  "salesPersonId": 1,
  "paymentMethod": "efectivo",
  "items": [{ "productId": 1, "quantity": 2, "unitPrice": 1299 }],
  "totals": { "subtotal": 2598, "shipping": 0, "discount": 0, "total": 2598 },
  "shippingAddress": {
    "street": "Calle Universidad", "number": "123", "city": "Chihuahua",
    "state": "Chihuahua", "postalCode": "31000", "country": "México"
  },
  "statusHistory": [{
    "status": "Pendiente de pago", "changedById": 1,
    "changedAt": "2026-09-01T12:00:00.000Z"
  }],
  "createdAt": "2026-09-01T12:00:00.000Z",
  "updatedAt": "2026-09-01T12:00:00.000Z"
}
```

Convenciones de simulación del equipo:

- El subtotal suma `quantity * unitPrice`. `shipping` y `discount` son cero;
  `total` es igual al subtotal. No hay cobros, cálculo real de envío ni reservas.
- Si se omite `shippingAddress` en POST se usa la dirección del ejemplo; en
  PUT se conserva la del fixture. Si se envía, debe contener los seis campos
  de texto no vacíos del ejemplo. No se consulta la dirección real de otro cliente.
- POST siempre inicia en `Pendiente de pago`. PUT admite el campo opcional
  `status`: `Pendiente de pago`, `Pagado` o `Cancelado`. Son valores provisionales
  del equipo; el PDF marca un enum sin enumerarlos. Un valor inválido responde
  400 en POST o PUT; uno válido en POST no cambia el estado inicial.
- PUT añade una entrada al historial de la respuesta únicamente si el estado
  cambia. Omitir `status` o repetir el actual conserva el historial original.
  `changedById` usa `salesPersonId` como referencia mock, sin autenticación.
- Las fechas son fijas: creación `2026-09-01T12:00:00.000Z` y actualización
  `2026-09-02T12:00:00.000Z`. No representan la hora real de la petición.
- El controlador determina `_id`, `totals`, `statusHistory` y fechas. Los
  valores enviados para esos campos se ignoran, al igual que campos extras
  de artículos y direcciones. PUT conserva el ID y fecha de creación originales.
- Cada petición se calcula sobre los fixtures: ninguna escritura modifica
  los datos. GET de `orden-nueva` sigue dando 404. No se consultan referencias
  externas al validar escrituras; la coherencia se garantiza para los fixtures.
