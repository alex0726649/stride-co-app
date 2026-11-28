# Sprint 3: tareas para tomar y entregar por PR

## Objetivo y alcance

Completar el **Entregable 3: Interfaz web con renderizado del lado del servidor (SSR)** de Stride & Co. La fuente de requisitos es el documento del profesor `proyecto_integrador_entregable3.pdf`, secciones 4 a 6. Igual que en los sprints anteriores, estas tarjetas solo cubren lo que pide el entregable. Cuando algo es una decisión del equipo y no un requisito del PDF, la tarjeta lo dice.

En el Sprint 2 cada recurso pasó de mock a base de datos. En este sprint el prototipo `stride_co_mockup.html` se convierte en pantallas reales. Cada pantalla es una ruta de Express que consulta la base con los **mismos servicios que la API** y responde HTML generado con Pug, con el mismo JWT y el mismo RBAC del Entregable 2.

Rama de entrega: **`staging`**, la misma del Sprint 2. Render despliega desde ella. Todas las ramas `feat/s3-*` salen de `staging` y regresan a `staging` por PR. Las ramas del remoto no se borran al hacer merge.

## Punto de partida observado (revisión de `staging`, 27/11/2026)

- **Estado:** `npm run lint` limpio y `npm test` con 16 suites y 365 pruebas en verde. `main` y `staging` apuntan al mismo commit (PR #114).
- **Lo que ya entró de las clases de SSR** (PR #113, `integracion/clases-entrega2`, 25/11):
  - las rutas de la API ya están en `routes/api/`; existe `routes/web/index.js` con `GET /`;
  - `GET /health` se monta desde `routes/api/index.js`.
  - `GET /` renderiza `views/index.pug`: una tabla con **todos** los productos, incluidos los inactivos. Usa `Product.findAll()` directo desde `controllers/index.js`, sin servicio.
  - `views/layout.pug` carga Bootstrap 5.3.8 (CSS), Bootstrap Icons y Bootstrap 5.3.3 (JS); conviene usar la misma versión en los dos.
  - `views/includes/header.pug` y `footer.pug` (encabezado de la tienda) tienen tres problemas:
    - los textos están escritos a mano en español;
    - los enlaces son `href='#'`, incluidos "Mis pedidos" y "Carrito", que no se implementan;
    - la sangría deja vacío el `.container`.
  - `public/stylesheets/style.css` trae colores del prototipo (`--ink`, `.brand`, `.store-header`) y `public/javascripts/script.js` solo tiene un `console.log` de la clase.
  - `app.js` escribe un log de acceso en `logs/access.log` (ignorado por `*.log`).
- **Estructura:** los controllers siguen en `controllers/<recurso>.js`, sin carpeta `api/` ni `web/`. **No existe `services/`**: cada controller consulta los modelos directamente.
- **Vistas:** además de lo anterior, solo hay `error.pug`. Faltan los layouts `store` y `admin`, partials, mixins y las páginas `errors/403`, `404` y `500`.
- **Pug:** está fijado en `2.0.0-beta11` (2017). Conviene subir a `pug@3` antes de escribir vistas nuevas.
- **Autenticación:** `middlewares/authenticate.js` solo lee el encabezado `Authorization`, no la cookie. `loadUser` responde el 401 en JSON por su cuenta.
- **Autorización:** `middlewares/authorize.js` responde 401 y 403 en JSON por su cuenta. Mientras no los mande con `next(err)` al manejador central, las rutas web no pueden renderizar `errors/403.pug`.
- **Manejador de errores (`app.js`):** ya separa `/api/*` (JSON) del resto, pero el resto renderiza una sola `error.pug` y nunca redirige a `/login`.
- **i18n:** detecta `?lang` → `Accept-Language` → `es`. No lee cookie de idioma ni hay selector. Ya expone `res.locals.locale`.
- **Ya instalados:** `cookie-parser`, `i18n`, `config`, `accesscontrol`. Falta `express-validator`.
- **Datos:** el seed crea un solo producto (`Stride Runner Demo`) con una variante. Con eso no se pueden demostrar la búsqueda, el filtro por categoría ni la paginación.
- **Modelo `Product`:** tiene `category_id` (texto), `name`, `description`, `brand`, `price` y `active`. No tiene un campo de "destacado" ni de imagen.
- **Modelo `Order` (Mongo):** sus `items` usan `productId`, no `variantId`, y no existen `statusHistory` ni dirección de envío. Por eso F5 (checkout) y F11 (pedidos) requerirían cambiar el esquema; esta propuesta no las incluye.
- **Render PostgreSQL:** creada el 11/11/2026, **vence el 11/12/2026**. Si la revisión cae después de esa fecha, hay que recrearla y volver a correr el seed (S3-10).
- **Prototipo:** `stride_co_mockup.html` **todavía no está en el repositorio**. Se sube en S3-00.

## Funcionalidades elegidas

Propuesta para cuatro integrantes. Son las cinco mínimas, todas sobre las tablas SQL que ya funcionan:

| ID | Funcionalidad | Tarjeta | Tienda / Panel | Escribe datos |
|---|---|---|---|---|
| F1 | Inicio y cierre de sesión (obligatoria) | S3-04 | Acceso | — |
| F2 | Inicio y catálogo con búsqueda, filtro y paginación | S3-05 | Tienda | — |
| F3 | Detalle de producto | S3-06 | Tienda | — |
| F8 | Administración de productos | S3-07 | Panel | ✔ |
| F10 | Inventario | S3-08 | Panel | ✔ |

Cumple las reglas de selección: incluye F1, dos de la tienda (F2, F3), dos del panel (F8, F10) y dos que escriben con formularios (F8, F10). Ninguna depende de una funcionalidad que falte.

**Responsables:** cada integrante debe ser responsable de al menos una de las cinco. Como son cinco para cuatro personas, una persona toma dos. El responsable es quien aparece en la tabla *Funcionalidades SSR* del README.

**Pantallas no implementadas** (bolsa, checkout, mis pedidos, dashboard, variantes, pedidos, clientes, usuarios, roles): se ocultan del menú o abren una página "Próximamente" con código 200. Nunca deben quedar como enlaces rotos. El botón "Agregar a la bolsa" del detalle se oculta porque F4 no se implementa.

## Decisiones que el equipo debe tomar antes de empezar

1. **Destacados del inicio (F2).** `Product` no tiene campo de destacado. Propuesta: mostrar los N productos activos más recientes, sin cambiar el esquema. La otra opción es agregar una columna `featured`.
2. **Qué muestra `/admin`.** F7 (dashboard) no está en la lista. Propuesta: que `/admin` redirija (302) a `/admin/products`.
3. **Listado del panel y el permiso `products:read:any`.** En `rbac-matrix.json` los tres roles tienen `products:read:any`, porque la API lo necesita. Si `GET /admin/products` se protege con ese permiso, como sugiere el PDF, `sales` y `user` pueden abrir el listado del panel en modo lectura, sin botones. Las opciones son:
   - **(a)** aceptarlo así;
   - **(b)** proteger el listado del panel con `products:update:any`.

   Las pruebas de 403 de F8 funcionan con cualquiera de las dos, porque `user` no tiene `create`, `update` ni `delete`.
4. **Funcionalidades extra.** El PDF solo evalúa las extra si cumplen los 12 elementos y no da puntos adicionales. Recomendación: no agregar más hasta que las cinco estén en **Hecho**.

## Cómo tomar una tarea

Igual que en el Sprint 2. La asignación y el estado viven en el GitHub Project.

1. Elegir una tarjeta cuyas dependencias ya estén en **Hecho**. Asignarse y moverla a **En progreso**.
2. Actualizar `staging` y crear la rama indicada en la tarjeta:
   ```bash
   git switch staging && git pull
   git switch -c feat/s3-XX-nombre
   ```
3. Implementar junto con sus pruebas. Commits con Conventional Commits: `tipo(área): descripción` (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`).
4. Antes del PR: `npm run lint` y `npm test` sin errores.
5. Abrir el PR **hacia `staging`** (no hacia `main`) con `Closes #N` en el cuerpo y mover la tarjeta a **En revisión**. Por acuerdo del equipo (README), revisa y mergea un integrante distinto del autor. El PDF no lo exige.
6. Mergear con **Create a merge commit**, sin borrar la rama remota, y mover a **Hecho**.

Estados: **Por hacer → En progreso → En revisión → Hecho**. Si una tarjeta espera a otra, se marca **Bloqueada** con el ID de la dependencia.

## Orden de trabajo

1. **Arranque:** S3-00 (prototipo en el repo, responsables en el Project).
2. **Base, en este orden:** S3-01 servicios → S3-02 base de vistas → S3-03 datos de la tienda. Las tres tocan archivos compartidos (`app.js`, `routes/`, `controllers/`, layouts y el seed). Mergearlas antes de abrir funcionalidades evita conflictos.
3. **Acceso:** S3-04 (F1). Las pantallas del panel dependen de ella.
4. **Funcionalidades, en paralelo:**
   - S3-05 (F2) y S3-06 (F3) pueden empezar en cuanto entran 01, 02 y 03;
   - S3-07 (F8) y S3-08 (F10) esperan además a S3-04.
5. **Pruebas y producción:** S3-09 E2E web y S3-10 despliegue y evidencia.
6. **Cierre:** S3-11 README y S3-12 entrega.

Recomendación del PDF: terminar primero **una** funcionalidad completa con los 12 elementos y usarla de modelo para las demás. Se sugiere F2 (S3-05), porque es pública y es el ejemplo que trae el PDF.

## Tablero de trabajo

| ID | Tarea | Rama | Depende de | Puntos |
|---|---|---|---|---|
| S3-00 | Prototipo en el repo y reparto de funcionalidades | `docs/s3-00-prototipo` | — | 1 |
| S3-01 | Servicios compartidos y separación API / web | `feat/s3-01-services` | 00 | 3 |
| S3-02 | Base de vistas SSR: layouts, mixins, errores, idioma | `feat/s3-02-ssr-base` | 01 | 5 |
| S3-03 | Datos de demostración para la tienda | `feat/s3-03-seed-tienda` | 01 | 2 |
| S3-04 | F1 · Inicio y cierre de sesión | `feat/s3-04-ssr-auth` | 01, 02 | 3 |
| S3-05 | F2 · Inicio y catálogo | `feat/s3-05-ssr-catalog` | 01, 02, 03 | 3 |
| S3-06 | F3 · Detalle de producto | `feat/s3-06-ssr-product-detail` | 01, 02, 03 | 2 |
| S3-07 | F8 · Administración de productos | `feat/s3-07-ssr-admin-products` | 01–04 | 5 |
| S3-08 | F10 · Inventario | `feat/s3-08-ssr-admin-inventory` | 01–04 | 3 |
| S3-09 | Prueba E2E del flujo web | `test/s3-09-e2e-web` | 04, 07 | 2 |
| S3-10 | Despliegue en Render y evidencia `docs/ssr/` | `feat/s3-10-deploy-evidencia` | 03, 04–08 | 3 |
| S3-11 | README: Funcionalidades SSR y API pública | `feat/s3-11-readme` | 04–10 | 2 |
| S3-12 | Validación final y entrega | `feat/s3-12-cierre` | todas | 2 |

## Definición de terminado de una funcionalidad

Aplica a S3-04 a S3-08. Son los 12 elementos obligatorios de la sección 4.6 del PDF.

- [ ] **1. Ruta web:** en `routes/web/` (`store.js`, `auth.js` o `admin.js`), separada de `/api`. `GET` para consultar y `POST` para modificar.
- [ ] **2. Controller web:** en `controllers/web/`. Responde con `res.render()` o `res.redirect()`; los errores van con `next(err)`. Sin consultas en la ruta.
- [ ] **3. Servicio compartido:** los datos salen de `services/` (Sequelize / Mongoose), el **mismo** servicio que usa el controller de la API. Nunca se llama por HTTP a la propia API.
- [ ] **4. Vista Pug:** extiende `layouts/store` o `layouts/admin`, usa los partials y mixins de S3-02, es fiel al prototipo y es responsiva (probada con el ancho de un teléfono).
- [ ] **5. SSR verificable:** los datos aparecen en *Ver código fuente* (Ctrl+U). La página funciona con JavaScript deshabilitado, tiene su propio `<title>` y `<meta name="description">` generados a partir de los datos, y responde con el código HTTP real (404 / 403 / 500, nunca 200 con un mensaje de error).
- [ ] **6. Autenticación y RBAC:** si la pantalla es protegida, lleva `authenticate` + `authorize('<recurso>', '<acción>', '<alcance>')` con una clave que existe en `database/rbac-matrix.json`. Los botones (Nuevo, Editar, Desactivar) se muestran con `can(...)`. Sin `if (role === ...)` en rutas, controllers ni vistas.
- [ ] **7. Formularios:** si la pantalla tiene formularios, la validación se hace en el servidor (`express-validator` o validaciones del modelo). Si es inválido, responde 400 con errores por campo y los valores capturados (excepto contraseñas). Si es válido, aplica PRG (302 → GET).
- [ ] **8. Estados de la pantalla:** lista vacía, recurso inexistente (404) y mensaje de confirmación de un solo uso después de cada acción.
- [ ] **9. i18n:** todos los textos de la vista y los mensajes salen de `__('pantalla.clave')`. Cada clave se agrega **a la vez** en `locales/es.json` y `locales/en.json`, sin textos escritos a mano en la plantilla. Precios y fechas se muestran con los formateadores de S3-02.
- [ ] **10. Salida segura:** solo `=` y `#{}` (escapados). Nada de `!=` ni `!{}` con datos de la BD o del usuario. Nunca aparecen `password_hash`, `salt_key` ni datos de otros usuarios.
- [ ] **11. Pruebas:** `test/web/<funcionalidad>.test.js` con Jest + Supertest y los servicios simulados con `jest.spyOn` (sin bases). Según aplique, cubre:
  - 200 con `text/html` y los datos esperados;
  - 302 a `/login` sin sesión y 403 sin permiso;
  - 404 si el recurso no existe;
  - 400 con errores y 302 (PRG) en los formularios;
  - la página en español y en inglés;
  - que el HTML no contenga `password_hash` ni `salt_key`.
- [ ] **12. Documentación:** capturas en `docs/ssr/` (prototipo e implementación lado a lado, más *Ver código fuente* con los datos). Fila en la tabla *Funcionalidades SSR* del README con la ruta, el permiso, el responsable y el enlace a la evidencia. S3-11 la integra, pero cada quien la deja escrita en su PR.

## Criterios de aceptación por tarjeta

### S3-00 — Prototipo en el repo y reparto de funcionalidades

Rama: docs/s3-00-prototipo
Etiquetas: sprint-3, base
Puntos: 1

- [ ] Subir el `stride_co_mockup.html` que entregó el profesor a `docs/prototipo/stride_co_mockup.html`. Es la referencia de estilo y de datos para todas las vistas.
- [ ] Decidir en reunión los cuatro puntos de *Decisiones que el equipo debe tomar* y anotarlos en el PR.
- [ ] Asignar en el Project un responsable para cada funcionalidad (S3-04 a S3-08). Todos los integrantes deben tener al menos una.
- [ ] Confirmar que `staging` sigue en verde (`npm run lint`, `npm test`) antes de abrir ramas.

Commit: `docs(prototipo): agregar prototipo HTML del entregable 3`.

### S3-01 — Servicios compartidos y separación API / web

Rama: feat/s3-01-services
Etiquetas: sprint-3, base, refactor
Puntos: 3

- [ ] Las rutas ya están en `routes/api/` (PR #113). Falta mover los controllers de la API a `controllers/api/` con `git mv` (así se conserva el historial) y actualizar los `require` de `routes/api/*.js`. `healthCheck` se queda en `controllers/api/index.js`.
- [ ] Crear `controllers/web/store.js` y pasar ahí el `home` que hoy vive en `controllers/index.js`, para que la API y la web no compartan controller.
- [ ] Crear `services/product.service.js`, `services/inventory.service.js` y `services/auth.service.js` con las consultas y reglas que hoy están en `controllers/products.js`, `controllers/inventory.js` y `controllers/auth.js`. Solo los recursos de las funcionalidades elegidas; los demás se quedan como están.
- [ ] Los servicios no conocen `req` ni `res`. Reciben parámetros simples y devuelven datos, o lanzan errores con código (`http-errors`) que el controller pasa con `next(err)`.
- [ ] Funciones mínimas que usarán las vistas:
  - `listActive({ q, category, page })` (devuelve productos, página y total de páginas);
  - `findActiveById(id)` (con variantes, inventario y `available = stock − reserved`);
  - `listCategories()`;
  - `listAll`, `create`, `update` y `deactivate` para el panel;
  - `inventory.list()` e `inventory.update(variantId, { stock, reserved })`.
- [ ] Los controllers de `/api/products`, `/api/inventory` y `/api/auth` usan esos servicios. **Las 365 pruebas existentes siguen pasando sin modificarlas**, porque los servicios llaman a los mismos métodos del modelo que las pruebas ya simulan.

Commit: `refactor(api): mover consultas a services y separar rutas api`.

### S3-02 — Base de vistas SSR: layouts, mixins, errores, idioma

Rama: feat/s3-02-ssr-base
Etiquetas: sprint-3, base, vistas, i18n
Puntos: 5

- [ ] Actualizar `pug` a 3.x (`npm install pug@3`). La `2.0.0-beta11` es de 2017 y tiene una vulnerabilidad conocida.
- [ ] Instalar `express-validator` y crear un helper que convierta `validationResult` en `{ campo: mensajeTraducido }` para las vistas.
- [ ] Extraer los estilos del prototipo (colores, tipografía, tarjetas, sidebar) a `public/css/stride.css`, partiendo de lo que ya trae `public/stylesheets/style.css` de la clase. Seguir usando Bootstrap 5 y Bootstrap Icons, con la misma versión en CSS y JS. Quitar el `console.log` de `public/javascripts/script.js`.
- [ ] `views/layouts/store.pug` (header, navegación y footer) y `views/layouts/admin.pug` (sidebar y encabezado del panel). El header y el footer de la tienda salen de `views/includes/` de la clase, con tres cambios: textos con `__()`, enlaces reales (o "Próximamente") en lugar de `#` y la sangría del `.container` corregida. Ambos layouts llevan:
  - `html(lang=locale)`;
  - bloques `title`, `description` y `content`;
  - `<meta name="description">`;
  - el selector de idioma **ES / EN**, que conserva la ruta y el query string actuales.
- [ ] Partials en `views/partials/`: `flash`, `pagination` (conserva `q` y `category` en los enlaces) y `formErrors`.
- [ ] Mixins en `views/mixins/`: `productCard`, `table`, `formField` (etiqueta, valor capturado y error del campo) y `statusBadge`.
- [ ] Mensaje de confirmación de un solo uso: se guarda en una cookie, se muestra en la página a la que se redirige y se borra al leerse. Si se pasa por query string, se repetiría al recargar.
- [ ] Formateadores en `res.locals`: `formatPrice` (`Intl.NumberFormat`, MXN, según el idioma) y `formatDate` (`Intl.DateTimeFormat`).
- [ ] i18n en las vistas, en este orden: `?lang` (guarda la cookie `lang`) → cookie `lang` (solo rutas web) → `Accept-Language` → `es`. En `/api` el comportamiento no cambia y `test/i18n.test.js` sigue pasando.
- [ ] Vistas `views/errors/403.pug`, `404.pug` y `500.pug`. Manejador central en `app.js`:
  - `/api/*` sigue respondiendo JSON igual que en el Entregable 2;
  - en las rutas web, un 401 redirige a `/login?next=<url pedida>` y 403, 404 y 500 renderizan su vista con su código;
  - en producción nunca se muestra el stack.
- [ ] Página `views/coming-soon.pug` (200) para las secciones del prototipo que no se implementan, o retirarlas del menú. Ningún enlace roto.
- [ ] Retirar `views/layout.pug`, `index.pug` y `error.pug` cuando ya no se usen.
- [ ] Pruebas:
  - ruta web inexistente → 404 en HTML y `/api/no-existe` → 404 en JSON;
  - `?lang=en` deja la cookie y la siguiente petición sale en inglés;
  - `<html lang>` correcto;
  - sin stack con `NODE_ENV=production`;
  - las claves de `es.json` y `en.json` siguen siendo iguales.

Commit: `feat(views): agregar layouts, mixins y manejo de errores SSR`.

### S3-03 — Datos de demostración para la tienda

Rama: feat/s3-03-seed-tienda
Etiquetas: sprint-3, base, sql
Puntos: 2

- [ ] Ampliar `seedCatalog` en `database/seed-postgres.js` con los productos del prototipo (nombres, descripciones, precios y categorías del JavaScript de `stride_co_mockup.html`).
- [ ] Al menos 13 productos activos (para que exista la página 2 con 12 por página) en al menos 3 categorías. `category_id` guarda el nombre de la categoría, por ejemplo `Running`.
- [ ] Cada producto tiene variantes (talla y color) con inventario. Deben existir:
  - una variante agotada (`reserved = stock`);
  - un producto **inactivo**, para probar el 404 de la tienda y verlo en el panel.
- [ ] Sigue siendo idempotente (buscar por `sku`). Se conserva `Stride Runner Demo` y su SKU, porque las suites E2E del Entregable 2 dependen de ellos.
- [ ] `npm run seed` dos veces seguidas sin duplicar y `npm run test:e2e` sigue en verde.

Commit: `feat(seed): agregar catálogo del prototipo para la tienda`.

### S3-04 — F1 · Inicio y cierre de sesión

Rama: feat/s3-04-ssr-auth
Etiquetas: sprint-3, funcionalidad, auth, f1
Puntos: 3

- [ ] Cumplir la definición de terminado de una funcionalidad.
- [ ] Rutas en `routes/web/auth.js`: `GET /login`, `POST /login` y `POST /logout`. La vista es `views/auth/login.pug`.
- [ ] `POST /login` valida las credenciales con `services/auth.service.js` (bcrypt), el mismo que usa `/api/auth/login`:
  - campos vacíos o email mal formado → 400 con errores y el email conservado;
  - credenciales incorrectas o usuario inactivo → el formulario de nuevo con un mensaje traducido.
- [ ] Con credenciales válidas, el JWT se guarda en la cookie `access_token` con `httpOnly: true` y se redirige (302) a `next`. `next` solo se acepta si es una ruta interna (empieza con `/` y no con `//`); si no, se redirige a `/`.
- [ ] `sameSite: 'lax'` y `secure` en producción. Es una propuesta del equipo; el PDF solo pide `httpOnly`.
- [ ] `POST /logout` borra la cookie y regresa a la tienda. En el header es un formulario `POST`, así que funciona sin JavaScript.
- [ ] `middlewares/authenticate.js` usa `getToken` para leer la cookie o el encabezado `Authorization`. `loadUser` manda el 401 con `next(createError(401))` en lugar de responder JSON; la API sigue respondiendo lo mismo a través del manejador central.
- [ ] `middlewares/authorize.js` manda 401 y 403 con `next(createError(...))`. En la web se ve `errors/403.pug` con código 403 y `test/authorize.test.js` sigue pasando.
- [ ] Middleware de sesión opcional para las rutas web:
  - si hay una cookie válida, deja en `res.locals` `currentUser` (solo nombre y email) y `can(recurso, acción, alcance)`, calculado con `loadRoleAccess`, el mismo de `authorize`;
  - si la cookie es inválida o expiró, se ignora y se borra.
- [ ] El recuadro "Acceso de demostración" del prototipo solo aparece fuera de producción (bandera en `config`). Las cuentas demo se documentan en el README.
- [ ] Pruebas:
  - `GET /login` responde 200 en HTML;
  - 400 con datos vacíos;
  - credenciales incorrectas y usuario inactivo regresan al formulario;
  - inicio correcto: 302 con `Set-Cookie` `HttpOnly`;
  - se respeta un `next` interno y se ignora uno externo;
  - `logout` borra la cookie;
  - una página protegida sin cookie → 302 a `/login?next=...`;
  - la página en es y en en, sin `password_hash` en el HTML.

Commit: `feat(auth): iniciar y cerrar sesión con JWT en cookie`.

### S3-05 — F2 · Inicio y catálogo

Rama: feat/s3-05-ssr-catalog
Etiquetas: sprint-3, funcionalidad, tienda, f2
Puntos: 3

- [ ] Cumplir la definición de terminado de una funcionalidad. Se sugiere como funcionalidad modelo.
- [ ] Rutas públicas en `routes/web/store.js`: `GET /` (inicio con destacados, según la decisión 1) y `GET /products?q=&category=&page=`. El `GET /` de la clase (`routes/web/index.js`, tabla con `Product.findAll()`) se reemplaza por esto. Hay que actualizar sus pruebas en `test/app.test.js` y `test/i18n.test.js`, que hoy esperan la tabla y muestran un producto inactivo.
- [ ] Solo productos `active`. `q` busca en nombre y marca, sin distinguir mayúsculas. `category` filtra y la lista de categorías sale de `listCategories()`. 12 productos por página.
- [ ] Un `page` inválido o fuera de rango se normaliza en lugar de dar 500. Los enlaces de paginación conservan `q` y `category`.
- [ ] El formulario de búsqueda es `method="get"`: la URL se puede recargar, compartir y abrir directamente.
- [ ] Las tarjetas usan el mixin `productCard`, con el precio en `formatPrice`, y enlazan a `/products/:id` (F3).
- [ ] `<title>` y `meta description` reflejan la búsqueda o la categoría (por ejemplo, "Running · Stride & Co.").
- [ ] Estado vacío traducido cuando no hay resultados.
- [ ] Pruebas:
  - 200 en HTML con el nombre del producto que devuelve el servicio simulado;
  - `q`, `category` y `page` llegan al servicio;
  - estado vacío;
  - enlaces de paginación con los filtros;
  - es y en.

Commit: `feat(store): renderizar inicio y catálogo con Pug`.

### S3-06 — F3 · Detalle de producto

Rama: feat/s3-06-ssr-product-detail
Etiquetas: sprint-3, funcionalidad, tienda, f3
Puntos: 2

- [ ] Cumplir la definición de terminado de una funcionalidad.
- [ ] Ruta pública `GET /products/:id` con `productService.findActiveById`: producto, variantes activas e inventario.
- [ ] `available = stock − reserved` se calcula en el **servicio**, no en la vista ni en el navegador. Una variante con `available = 0` se marca "Agotado" con el mixin `statusBadge`.
- [ ] 404 con `errors/404.pug` si el producto no existe, está inactivo o el id no es un entero (`/products/abc` no debe dar 500).
- [ ] `<title>` con el nombre del producto y `meta description` con su descripción, recortada a unos 155 caracteres.
- [ ] Sin botón de "Agregar a la bolsa", porque F4 no se implementa. Se oculta para que no quede como acción rota.
- [ ] Pruebas:
  - 200 con nombre, precio y disponible calculado;
  - 404 si no existe, si está inactivo y con id no numérico;
  - `<title>` y `meta` con los datos del producto;
  - es y en.

Commit: `feat(store): renderizar detalle de producto con disponibilidad`.

### S3-07 — F8 · Administración de productos

Rama: feat/s3-07-ssr-admin-products
Etiquetas: sprint-3, funcionalidad, panel, formularios, f8
Puntos: 5

- [ ] Cumplir la definición de terminado de una funcionalidad.
- [ ] Rutas en `routes/web/admin.js`:
  - `GET /admin/products`, `GET /admin/products/new` y `POST /admin/products`;
  - `GET /admin/products/:id/edit` y `POST /admin/products/:id`;
  - `POST /admin/products/:id/delete`.
- [ ] Cada ruta lleva `authenticate` + `authorize('products', '<acción>', 'any')`. El listado se protege según la decisión 3.
- [ ] `GET /admin` hace lo que se haya acordado en la decisión 2.
- [ ] El listado incluye los productos inactivos, con `statusBadge`. Los botones Nuevo, Editar y Desactivar se muestran con `can('products', ..., 'any')`.
- [ ] "Eliminar" **desactiva** el producto (`active = false`), porque tiene variantes e inventario relacionados. Se reactiva desde Editar.
- [ ] Validación en el servidor: `name` obligatorio (máx. 150), `description` obligatoria, `brand` obligatoria (máx. 100), `price` numérico ≥ 0 y `category_id` obligatoria. Si falla, responde 400 con el mismo formulario, los errores por campo traducidos y los valores capturados.
- [ ] PRG: si es válido, 302 a `/admin/products` con "Producto creado", "Producto actualizado" o "Producto desactivado", que se muestra una sola vez.
- [ ] 404 al editar o desactivar un id inexistente.
- [ ] En el sidebar del panel solo aparecen Productos e Inventario (según `can`). El resto, como diga S3-02.
- [ ] Pruebas:
  - sin sesión → 302 a `/login`;
  - `user` en `/admin/products/new` → 403 con la página de error;
  - admin → 200 con los productos del servicio simulado;
  - `POST` inválido → 400 con errores y valores;
  - `POST` válido → 302 y el mensaje aparece una vez;
  - 404 en un id inexistente;
  - es y en.

Commit: `feat(admin): administrar productos desde el panel SSR`.

### S3-08 — F10 · Inventario

Rama: feat/s3-08-ssr-admin-inventory
Etiquetas: sprint-3, funcionalidad, panel, formularios, f10
Puntos: 3

- [ ] Cumplir la definición de terminado de una funcionalidad.
- [ ] Rutas en `routes/web/admin.js`:
  - `GET /admin/inventory` con `authorize('inventory', 'read', 'any')`;
  - `POST /admin/inventory/:variantId` con `authorize('inventory', 'update', 'any')`.
- [ ] La tabla (mixin `table`) muestra SKU, producto, talla, color, existencias, reservadas y disponible (`stock − reserved`, calculado en el servicio), con `statusBadge` para agotado.
- [ ] El formulario de ajuste (en línea por fila o en una página aparte, según el prototipo) envía solo `stock` y `reserved`.
- [ ] Validación en el servidor: enteros ≥ 0 y `reserved ≤ stock`. Si falla, responde 400 con la misma pantalla, el error junto a la fila o el campo y los valores capturados.
- [ ] PRG: si es válido, 302 a `/admin/inventory` con "Inventario actualizado".
- [ ] 404 si la variante no existe o no tiene inventario.
- [ ] Usa `inventory.service.js`, el mismo que `PUT /api/inventory`.
- [ ] El botón de ajustar solo aparece con `can('inventory', 'update', 'any')`. `sales` ve la tabla sin botones; `user` recibe 403.
- [ ] Pruebas:
  - sin sesión → 302;
  - `user` → 403 en `GET`;
  - `sales` → 403 en `POST`;
  - admin → 200 con los datos;
  - `reserved > stock` y valores negativos o no enteros → 400;
  - válido → 302 con el mensaje;
  - variante inexistente → 404;
  - es y en.

Commit: `feat(admin): ajustar inventario desde el panel SSR`.

### S3-09 — Prueba E2E del flujo web

Rama: test/s3-09-e2e-web
Etiquetas: sprint-3, e2e
Puntos: 2

- [ ] `test/e2e/web.e2e.test.js` corre contra la aplicación en ejecución con las bases reales y usa `request.agent()` de Supertest para conservar las cookies.
- [ ] El flujo:
  1. `POST /login` con el admin demo;
  2. `GET /admin/products` → 200 con un producto del seed;
  3. `POST /logout`;
  4. `GET /admin/products` → 302 a `/login`.
- [ ] Reutilizar `test/e2e/helpers.js` (URL base y credenciales demo) y respetar `E2E_BASE_URL` para correrlo contra Render.
- [ ] `npm run test:e2e` completo en verde, local y contra Render.

Commit: `test(e2e): recorrer inicio de sesión y cierre en la web`.

### S3-10 — Despliegue en Render y evidencia `docs/ssr/`

Rama: feat/s3-10-deploy-evidencia
Etiquetas: sprint-3, deploy, docs
Puntos: 3

- [ ] La tienda (`/`), el panel (`/admin`) y la API funcionan en la URL pública de Render desplegada desde `staging` con `NODE_ENV=production`, sin stack en los errores y sin el recuadro de acceso demo.
- [ ] Render PostgreSQL vence el **11/12/2026**. Si la revisión es después, crear una base nueva, actualizar los secretos en Render y correr `npm run seed`. Revisar que MongoDB Atlas siga activo.
- [ ] Correr `npm run seed` en Render después de que entre S3-03.
- [ ] `docs/ssr/` tiene, por funcionalidad:
  - una captura del prototipo y otra de la implementación, lado a lado;
  - una captura de *Ver código fuente* donde se vean los datos.

  Nombres sugeridos: `f2-prototipo.png`, `f2-implementacion.png`, `f2-codigo-fuente.png`. Cada responsable sube las suyas; esta tarjeta revisa que estén completas.
- [ ] Probar cada pantalla en Render con JavaScript deshabilitado y con el ancho de un teléfono.
- [ ] Iniciar sesión con cada usuario demo (`admin`, `sales`, `user`) y abrir directamente las URL del panel: los 403 y los menús deben corresponder a la matriz.
- [ ] Ningún secreto en el repositorio. Siguen fuera `config/local*.json` y `.env`.

Commit: `docs(ssr): agregar evidencia de funcionalidades desplegadas`.

### S3-11 — README: Funcionalidades SSR y API pública

Rama: feat/s3-11-readme
Etiquetas: sprint-3, docs
Puntos: 2

- [ ] Sección **Funcionalidades SSR** con la tabla del PDF: ID, Funcionalidad, Rutas, Permiso, Responsable y Evidencia (enlace a `docs/ssr/`). Una fila por cada funcionalidad terminada.
- [ ] Actualizar la sección **API pública**: URL de la tienda (`/`) y del panel (`/admin`), y qué usuario demo usar para probar cada funcionalidad.
- [ ] Explicar **cómo se guarda la sesión**: JWT en la cookie `httpOnly`, cómo lo lee `authenticate` y la redirección a `/login`.
- [ ] Explicar **cómo agregar una pantalla nueva**: ruta en `routes/web/`, controller en `controllers/web/`, servicio en `services/`, vista Pug que extiende el layout y claves en `es.json` y `en.json`.
- [ ] Actualizar la estructura del proyecto (`routes/api` y `routes/web`, `services/`, `views/`) y la tabla de pruebas con `test/web/` y `web.e2e.test.js`.

Commit: `docs(readme): documentar funcionalidades SSR y sesión web`.

### S3-12 — Validación final y entrega

Rama: feat/s3-12-cierre
Etiquetas: sprint-3, docs
Puntos: 2

- [ ] Clonar `staging` limpio en otra carpeta: `npm install`, `npm run lint`, `npm test` y `npm run test:e2e` sin errores.
- [ ] `npm run test:e2e` contra Render pasa. Consultar `/health` antes para despertar el servicio.
- [ ] Revisar cada funcionalidad contra los 12 elementos de la definición de terminado.
- [ ] Buscar `!=` y `!{` en `views/`: no deben existir con datos de la BD.
- [ ] Buscar `role ===` en `routes/`, `controllers/` y `views/`: no debe aparecer.
- [ ] Buscar `localStorage`, `sessionStorage` e `innerHTML` en `views/` y `public/js/`: no deben guardar ni mostrar datos del negocio.
- [ ] Todas las ramas `feat/s3-*` siguen en el remoto, hay commits de los cuatro integrantes y el GitHub Project está al día.
- [ ] Las bases de Render PostgreSQL y Atlas estarán activas el día de la revisión, con el seed ejecutado.
- [ ] Entregar en Moodle la URL del repositorio (una entrega por equipo).

Commit: `docs(sprint3): registrar validación de entrega`.
