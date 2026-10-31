# Sprint 2: tareas para tomar y entregar por PR

## Objetivo y alcance

Completar el **Entregable 2: Backend completo, internacionalizado y desplegado sin costo** de Stride & Co. La fuente de requisitos es el documento del profesor `proyecto_integrador_entregable2.pdf`, secciones 4 a 6. Igual que en el Sprint 1, el backlog del equipo no amplía el alcance: estas tarjetas solo cubren lo que pide el entregable.

En el Sprint 1 cada recurso se construyó con datos mock. En este sprint cada recurso deja el mock y pasa a su base de datos real, protegido con JWT + RBAC y con mensajes en español e inglés. Alrededor de los recursos hay cuatro tarjetas de base (configuración, PostgreSQL, i18n y seed) y cuatro de cierre (despliegue, E2E, README y entrega).

Rama de entrega: **`staging`** (sale de `main`; Render despliega desde ella). Todas las ramas de trabajo salen de `staging` y regresan a `staging` por PR. No se borran las ramas del remoto al hacer merge: el profesor revisa que existan.

## Punto de partida observado (revisión de `main`, 30/10/2026)

- **Ya en base de datos:** `users`, `roles`, `permissions` (Sequelize) y `customers`, `orders` (Mongoose). Faltan validaciones completas, RBAC y traducciones.
- **Todavía mock:** `products`, `variants` e `inventory` (arreglos fijos en el controller).
- **Asociaciones Sequelize ya definidas** en `models/relationals/index.js`: User→Role, Role↔Permission, Product→Variant, Variant→Inventory.
- **Base relacional:** sigue en MySQL (`mysql2`, `dialect: 'mysql'`). Hay que migrar a PostgreSQL.
- **Configuración:** existe `config/` pero `config/default.json` contiene una contraseña de base de datos y está en git. `controllers/auth.js` y `middlewares/authenticate.js` todavía leen `process.env.JWT_*`. `dotenv` y `.env.example` siguen en el proyecto. Se instaló `config@5`; el PDF recomienda `config@4` con Jest.
- **i18n:** la librería está configurada (`config/i18n.js`) pero `locales/*.json` solo tiene una clave (`auth.invalidCredentials`).
- **RBAC (Tarea 6):** integrado en `main` desde `feat/rbac-authorization`. Incluye `middlewares/authorize.js`, `utils/rbac.js`, `database/rbac-matrix.json` (matriz completa de los ocho recursos con roles `admin`, `sales`, `user`) y `database/seed-rbac.js`. Hoy solo protege `products` y `orders`.
- **Ya existen y se conservan:** `GET /health`, `Dockerfile`, despliegue de la Actividad 3, login con JWT, `GET /api/auth/me`.
- **No existe todavía:** `npm run seed` completo, `npm run test:e2e`, carpeta `test/e2e/`, `docs/e2e-antigravity.md`, sección API pública del README.

## Cómo tomar una tarea

Igual que en el Sprint 1. La asignación y el estado viven en el GitHub Project.

1. Elegir una tarjeta cuyas dependencias ya estén en **Hecho**; asignarse y moverla a **En progreso**.
2. Actualizar `staging` y crear la rama indicada en la tarjeta:
   ```bash
   git switch staging && git pull
   git switch -c feat/s2-XX-nombre
   ```
3. Implementar con sus pruebas. Commits con Conventional Commits: `tipo(área): descripción` (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`).
4. Antes del PR: `npm run lint` y `npm test` sin errores.
5. Abrir el PR **hacia `staging`** (no hacia `main`), con `Closes #N` en el cuerpo para enlazar el issue. Mover a **En revisión**. Revisa otra persona; nadie mergea su propio PR.
6. Mergear sin borrar la rama remota. Mover a **Hecho**.

Estados: **Por hacer → En progreso → En revisión → Hecho**. Si una tarjeta espera a otra, marcarla **Bloqueada** con el ID de la dependencia.

## Orden de trabajo

1. **Arranque:** S2-00 (staging).
2. **Base, en paralelo:** S2-01 config, S2-03 i18n; en cuanto entra 01, S2-02 postgres; en cuanto entra 02, S2-04 seed.
3. **Recursos, en paralelo:** S2-05 a S2-12, uno por integrante (S2-12 espera a S2-11).
4. **Producción y pruebas:** S2-13 render y S2-14 e2e base en cuanto exista el seed; S2-15 y S2-16 cuando sus recursos estén en `staging`.
5. **Cierre:** S2-17 readme y S2-18 entrega.

Las cuatro tarjetas de base tocan archivos compartidos (`app.js`, `utils/response.js`, manejador de errores, `package.json`). Conviene mergearlas en el orden **01 → 03 → 02 → 04** y no abrir recursos hasta que 01, 02 y 03 estén en `staging`; así los ocho recursos parten del mismo molde y no chocan.

Recomendación del PDF: hacer primero **un** recurso completo con los 11 elementos (sugerido: `products`, que ya tiene RBAC) y usarlo de modelo para los demás.

## Tablero de trabajo

| ID | Tarea | Rama | Depende de | Puntos |
|---|---|---|---|---|
| S2-00 | Crear la rama `staging` | `staging` | — | 1 |
| S2-01 | Configuración por entornos y secretos | `feat/s2-01-config` | 00 | 3 |
| S2-02 | Migrar Sequelize de MySQL a PostgreSQL | `feat/s2-02-postgres` | 01 | 3 |
| S2-03 | Internacionalización base | `feat/s2-03-i18n` | 00 | 3 |
| S2-04 | Script `npm run seed` | `feat/s2-04-seed` | 02 | 3 |
| S2-05 | `/api/users` con Sequelize, RBAC e i18n | `feat/s2-05-users` | 01, 02, 03 | 3 |
| S2-06 | `/api/roles` con Sequelize, RBAC e i18n | `feat/s2-06-roles` | 01, 02, 03 | 2 |
| S2-07 | `/api/permissions` con Sequelize, RBAC e i18n | `feat/s2-07-permissions` | 01, 02, 03 | 2 |
| S2-08 | `/api/products` de mock a Sequelize | `feat/s2-08-products` | 01, 02, 03 | 3 |
| S2-09 | `/api/variants` de mock a Sequelize | `feat/s2-09-variants` | 01, 02, 03 | 3 |
| S2-10 | `/api/inventory` de mock a Sequelize | `feat/s2-10-inventory` | 01, 02, 03 | 2 |
| S2-11 | `/api/customers` con Mongoose, RBAC e i18n | `feat/s2-11-customers` | 01, 03 | 3 |
| S2-12 | `/api/orders` con Mongoose, RBAC own/any e i18n | `feat/s2-12-orders` | 01, 03, 11 | 5 |
| S2-13 | Despliegue en Render + PostgreSQL + Atlas | `feat/s2-13-render-deploy` | 01, 02, 04 | 5 |
| S2-14 | Base de pruebas E2E con Antigravity | `feat/s2-14-e2e-base` | 01, 04 | 3 |
| S2-15 | E2E de recursos SQL | `feat/s2-15-e2e-sql` | 05–10, 14 | 5 |
| S2-16 | E2E de recursos Mongo y relaciones | `feat/s2-16-e2e-mongo` | 11, 12, 14 | 3 |
| S2-17 | README completo y sección API pública | `feat/s2-17-readme` | 05–13 | 3 |
| S2-18 | Validación final y entrega | `feat/s2-18-cierre` | todas | 2 |

## Definición de terminado de un recurso

Aplica a S2-05 a S2-12. Son los 11 elementos obligatorios de la sección 4.3 del PDF.

- [ ] **Ruta:** `routes/<recurso>.js` con el verbo REST correcto.
- [ ] **Autenticación:** `authenticate` en cada ruta.
- [ ] **Autorización:** `authorize('<recurso>', '<acción>', '<alcance>')` después de `authenticate`, con la clave que ya existe en `database/rbac-matrix.json`. Sin `if (role === ...)` ni lógica de permisos en el controller.
- [ ] **Validación de entrada:** id mal formado, body inválido o campo único repetido → 400.
- [ ] **Controller:** toda la lógica en `controllers/<recurso>.js`; sin consultas en la ruta.
- [ ] **Persistencia:** usa el modelo Sequelize o Mongoose; el modelo tiene validaciones (obligatorios, únicos, formatos, rangos).
- [ ] **Respuesta uniforme:** `{ message, data }` con `message` traducido por `req.__('<recurso>.<clave>')`; cada clave nueva se agrega **a la vez** en `locales/es.json` y `locales/en.json`.
- [ ] **Errores:** `next(err)` al manejador central; 400, 401, 403, 404 y 500 correctos.
- [ ] **Datos sensibles:** nunca se devuelven `password`, `password_hash` ni `salt_key`.
- [ ] **Pruebas con mocks:** `test/<recurso>.test.js` actualizado con `jest.spyOn(Modelo, ...)`; cubre éxito, 400, 401, 403 y 404; corre sin bases de datos.
- [ ] **Documentación:** fila en la tabla de endpoints del README con el permiso que requiere (la integra S2-17, pero cada quien deja anotado el suyo en el PR).

## Criterios de aceptación por tarjeta

### S2-00 — Crear la rama staging

Rama: staging
Etiquetas: sprint-2, base
Puntos: 1

- [ ] Crear `staging` desde `main` (que ya incluye la Tarea 6) y subirla: `git switch main && git pull && git switch -c staging && git push -u origin staging`.
- [ ] En GitHub, proteger `staging` (Settings → Branches) para exigir PR con al menos una aprobación.
- [ ] Avisar al equipo que todas las ramas `feat/s2-*` salen de `staging`.

Commit: no aplica (solo creación de rama).

### S2-01 — Configuración por entornos y secretos

Rama: feat/s2-01-config
Etiquetas: sprint-2, base, seguridad
Puntos: 3

- [ ] Fijar `config@4` (`npm install config@4`) y comprobar si `--experimental-vm-modules` en el script `test` sigue siendo necesario; si no, quitarlo.
- [ ] Crear `config/default.json` **sin secretos**, `development.json`, `test.json`, `production.json` y `custom-environment-variables.json` (`PORT` → `server.port`).
- [ ] Crear `config/local-development.example.json` (plantilla en git) y documentar que cada quien copia a `config/local-development.json`.
- [ ] Quitar la contraseña que hoy está en `config/default.json`. Quien la use en su máquina debe cambiarla, porque quedó en el historial.
- [ ] Reemplazar todos los `process.env.*` (`controllers/auth.js`, `middlewares/authenticate.js`, `app.js`, pruebas) por `config.get(...)`. Solo `NODE_ENV` y `PORT` vienen del entorno.
- [ ] Si falta `jwt.secret`, el servidor no arranca y muestra un mensaje claro.
- [ ] `config/test.json` con un `jwt.secret` de prueba y costo de bcrypt bajo: `npm test` funciona sin archivos locales.
- [ ] `.gitignore` y `.dockerignore` excluyen `config/local*.json` pero no `*.example.json`.
- [ ] Eliminar `dotenv`, `.env.example` y referencias a `.env`.
- [ ] Ajustar el script `start` para no forzar `NODE_ENV=production` (el PDF espera `npm start` en development, puerto 3000); producción se elige con la variable de entorno.
- [ ] Pruebas: arranque sin `jwt.secret` falla; `PORT` se respeta.

Commit: `feat(config): leer configuración y secretos por entorno con config`.

### S2-02 — Migrar Sequelize de MySQL a PostgreSQL

Rama: feat/s2-02-postgres
Etiquetas: sprint-2, base, sql
Puntos: 3

- [ ] `npm uninstall mysql2 && npm install pg pg-hstore`.
- [ ] `config/sequelize.js` usa `dialect: 'postgres'`, puerto 5432 y lee host, base, usuario y contraseña con `config.get('db.postgres')` (los secretos en `local-*.json`).
- [ ] Opción `dialectOptions.ssl` activable desde config (necesaria para la External URL de Render).
- [ ] Revisar tipos y consultas propias de MySQL en modelos y en `database/schema.sql` / `ensure-constraints.js`; actualizar o retirar lo que ya no aplique.
- [ ] Verificar que las asociaciones de `models/relationals/index.js` funcionan en PostgreSQL (sync o migración local sin errores).
- [ ] Quitar los `console.log` de `config/sequelize.js` (usar el logger del proyecto).
- [ ] README de desarrollo: cómo instalar PostgreSQL local y crear la base.

Commit: `feat(db): migrar Sequelize de MySQL a PostgreSQL`.

### S2-03 — Internacionalización base

Rama: feat/s2-03-i18n
Etiquetas: sprint-2, base, i18n
Puntos: 3

- [ ] Middleware de i18n montado antes de las rutas.
- [ ] Orden de detección: `?lang` → `Accept-Language` → idioma por defecto.
- [ ] `fr` (no soportado) responde en el idioma por defecto; `es-MX` resuelve a `es`.
- [ ] `locales/es.json` y `locales/en.json` organizados por recurso, con claves comunes (`errors.unauthorized`, `errors.forbidden`, `errors.notFound`, `errors.badRequest`, `errors.internal`) y `auth.*`.
- [ ] El manejador central de errores y `authorize` responden 401/403/404/500 traducidos.
- [ ] Las vistas Pug (`index`, `error`) usan las traducciones.
- [ ] Prueba que compara recursivamente que ambos archivos tienen exactamente las mismas claves.
- [ ] Pruebas de detección: `?lang=en`, `Accept-Language: en`, `es-MX`, `fr`.

Commit: `feat(i18n): detectar idioma y traducir errores comunes`.

### S2-04 — Script de datos iniciales

Rama: feat/s2-04-seed
Etiquetas: sprint-2, base, sql, mongo
Puntos: 3

- [ ] Script `npm run seed` (puede absorber el `seed:rbac` de la Tarea 6).
- [ ] Crea roles, permisos y `Role_Permission` leyendo `database/rbac-matrix.json` (la matriz es la única fuente).
- [ ] Crea un usuario activo por rol (`admin`, `sales`, `user`) con contraseñas ficticias exclusivas de demo, hasheadas con bcrypt.
- [ ] Datos de ejemplo para products, variants, inventory, customers y orders, con relaciones coherentes: al menos una orden del customer ligado al usuario `user` y otra de un cliente distinto (para probar own vs. any).
- [ ] Idempotente: se puede ejecutar dos veces seguidas sin duplicar ni fallar.
- [ ] Funciona contra el entorno elegido por `NODE_ENV` (local y producción).
- [ ] Sin secretos reales en el código.

Commit: `feat(seed): crear datos iniciales desde la matriz RBAC`.

### S2-05 — /api/users con Sequelize, RBAC e i18n

Rama: feat/s2-05-users
Etiquetas: sprint-2, recurso, sql
Puntos: 3

- [ ] Cumplir la definición de terminado de un recurso.
- [ ] Las consultas incluyen el rol (`include: Role`).
- [ ] `password_hash` y `salt_key` excluidos en todas las respuestas (incluido el create y el update).
- [ ] Email repetido → 400 traducido.
- [ ] Permisos: `users:create|read|update|delete:any`.

Commit: `feat(users): proteger y traducir el recurso users`.

### S2-06 — /api/roles con Sequelize, RBAC e i18n

Rama: feat/s2-06-roles
Etiquetas: sprint-2, recurso, sql
Puntos: 2

- [ ] Cumplir la definición de terminado de un recurso.
- [ ] Consultar un rol puede incluir sus permisos (`include: Permission`).
- [ ] Nombre de rol repetido → 400.
- [ ] Permisos: `roles:create|read|update|delete:any`.

Commit: `feat(roles): proteger y traducir el recurso roles`.

### S2-07 — /api/permissions con Sequelize, RBAC e i18n

Rama: feat/s2-07-permissions
Etiquetas: sprint-2, recurso, sql
Puntos: 2

- [ ] Cumplir la definición de terminado de un recurso.
- [ ] Validación de `key` con el formato `recurso:acción:alcance` (alcance `own` o `any`) y única.
- [ ] Permisos: `permissions:create|read|update|delete:any`.

Commit: `feat(permissions): proteger y traducir el recurso permissions`.

### S2-08 — /api/products de mock a Sequelize

Rama: feat/s2-08-products
Etiquetas: sprint-2, recurso, sql
Puntos: 3

- [ ] Cumplir la definición de terminado de un recurso. Sugerido como recurso modelo para los demás.
- [ ] Eliminar el arreglo mock del controller.
- [ ] Consultar un producto devuelve sus variantes (`include: 'variants'`).
- [ ] `price` ≥ 0, `name` obligatorio.
- [ ] Permisos: `products:read:any` y `products:create|update|delete:any` (ya cableados por la Tarea 6; revisar que sigan funcionando).

Commit: `feat(products): persistir productos con Sequelize`.

### S2-09 — /api/variants de mock a Sequelize

Rama: feat/s2-09-variants
Etiquetas: sprint-2, recurso, sql
Puntos: 3

- [ ] Cumplir la definición de terminado de un recurso.
- [ ] Eliminar los mocks del controller.
- [ ] `sku` único; `product_id` debe existir (400 si no).
- [ ] Consultar una variante incluye su inventario y su producto.
- [ ] Permisos: `variants:read:any` y `variants:create|update|delete:any`.

Commit: `feat(variants): persistir variantes con Sequelize`.

### S2-10 — /api/inventory de mock a Sequelize

Rama: feat/s2-10-inventory
Etiquetas: sprint-2, recurso, sql
Puntos: 2

- [ ] Cumplir la definición de terminado de un recurso.
- [ ] Eliminar el arreglo mock del controller.
- [ ] Conservar las operaciones del contrato (listar, consultar por id, actualizar existencias).
- [ ] `stock` y `reserved` enteros ≥ 0 y `reserved` ≤ `stock`.
- [ ] Permisos: `inventory:read:any`, `inventory:update:any`.

Commit: `feat(inventory): persistir inventario con Sequelize`.

### S2-11 — /api/customers con Mongoose, RBAC e i18n

Rama: feat/s2-11-customers
Etiquetas: sprint-2, recurso, mongo
Puntos: 3

- [ ] Cumplir la definición de terminado de un recurso.
- [ ] `ObjectId` mal formado → 400 (no 500).
- [ ] Validaciones del esquema: email con formato, `addresses.type` en el enum, `userId` numérico.
- [ ] Alcances `own` (el customer cuyo `userId` es el del token) y `any`, según la matriz.

Commit: `feat(customers): proteger y traducir el recurso customers`.

### S2-12 — /api/orders con Mongoose, RBAC own/any e i18n

Rama: feat/s2-12-orders
Etiquetas: sprint-2, recurso, mongo
Puntos: 5

- [ ] Cumplir la definición de terminado de un recurso.
- [ ] Consultar una orden devuelve los datos de su cliente (`populate('customerId')`).
- [ ] `orders:read:own` valida la pertenencia real con los datos del proyecto (customer del usuario o `salesPersonId` del vendedor); orden ajena → 403.
- [ ] Están cubiertos `orders:read:own` y `orders:read:any` con roles distintos.
- [ ] Validaciones: `items` no vacío, `quantity` ≥ 1, `paymentMethod` y `status` dentro de su enum.

Commit: `feat(orders): proteger órdenes con alcances own y any`.

### S2-13 — Despliegue en Render + PostgreSQL + Atlas

Rama: feat/s2-13-render-deploy
Etiquetas: sprint-2, despliegue
Puntos: 5

- [ ] Render Web Service despliega desde `staging` con el `Dockerfile`, `NODE_ENV=production` y el `PORT` de Render.
- [ ] Health Check Path configurado en `/health`.
- [ ] Render PostgreSQL (plan gratuito) creado **cerca de la entrega** por su caducidad de 30 días; anotar fecha de creación y región.
- [ ] MongoDB Atlas free cluster con usuario exclusivo del proyecto y contraseña robusta; Network Access configurado para Render.
- [ ] `config/local-production.json` entregado a Render como *secret file*; no está en git ni dentro de la imagen.
- [ ] Ningún plan de pago ni tarjeta registrada.
- [ ] `npm run seed` ejecutado contra las bases de producción (External URL con SSL).
- [ ] Flujo manual verificado en la URL pública: `/health` → login demo → recurso permitido y uno denegado (403), en `es` y en `en`.
- [ ] Documentar para S2-17: URL, región, fecha de creación y cómo se entregan los secretos (sin valores).

Commit: `chore(deploy): desplegar en Render con PostgreSQL y Atlas`.

### S2-14 — Base de pruebas E2E con Antigravity

Rama: feat/s2-14-e2e-base
Etiquetas: sprint-2, e2e
Puntos: 3

- [ ] Script `npm run test:e2e`; `npm test` ignora `test/e2e/`.
- [ ] La URL se lee de `config.get('e2e.baseUrl')` (por defecto `http://localhost:3000`) o de `E2E_BASE_URL` solo en el runner.
- [ ] `test/e2e/helpers.js` con `login(rol)` usando Supertest.
- [ ] Suites generadas con Antigravity desde la terminal y la cuenta UACH: `health`, `auth`, `rbac` (los cinco escenarios de la Tarea 6) e `i18n`.
- [ ] Cada suite limpia lo que crea en `afterAll`.
- [ ] Crear `docs/e2e-antigravity.md` con prompts en orden, qué corrigió el equipo y por qué, y la captura de la sesión con la cuenta UACH.
- [ ] Romper cada prueba a propósito antes de aceptarla y comprobar que falla.
- [ ] Commits del estilo `test(e2e): ... (generated with Antigravity, reviewed)`.

Commit: `test(e2e): add base suites (generated with Antigravity, reviewed)`.

### S2-15 — E2E de recursos SQL

Rama: feat/s2-15-e2e-sql
Etiquetas: sprint-2, e2e, sql
Puntos: 5

- [ ] Suites para `users`, `roles`, `permissions`, `products`, `variants`, `inventory`, generadas con Antigravity a partir del código real.
- [ ] Ciclo completo por recurso: crear → consultar por id → listar → actualizar → eliminar → consultar de nuevo (404). En inventory, las operaciones que existan.
- [ ] Datos inválidos → 400; respuestas sin `password_hash` ni `salt_key`.
- [ ] Relaciones: un producto devuelve sus variantes.
- [ ] Limpieza en `afterAll`; la suite corre dos veces seguidas.
- [ ] Agregar los prompts y correcciones a `docs/e2e-antigravity.md`.

Commit: `test(e2e): add SQL resources suites (generated with Antigravity, reviewed)`.

### S2-16 — E2E de recursos Mongo y relaciones

Rama: feat/s2-16-e2e-mongo
Etiquetas: sprint-2, e2e, mongo
Puntos: 3

- [ ] Suites para `customers` y `orders`, generadas con Antigravity a partir del código real.
- [ ] Ciclo completo por recurso hasta el 404 final.
- [ ] Una orden devuelve los datos de su cliente.
- [ ] Datos inválidos e id mal formado → 400.
- [ ] Limpieza en `afterAll` (Atlas tiene 512 MB).
- [ ] Agregar los prompts y correcciones a `docs/e2e-antigravity.md`.

Commit: `test(e2e): add Mongo resources suites (generated with Antigravity, reviewed)`.

### S2-17 — README completo y sección API pública

Rama: feat/s2-17-readme
Etiquetas: sprint-2, docs
Puntos: 3

- [ ] Instalación desde cero, incluido crear `config/local-development.json` desde la plantilla.
- [ ] Bases de datos en desarrollo y cómo correr `npm run seed`.
- [ ] Tabla de **todos** los endpoints: método, ruta, permiso RBAC y descripción.
- [ ] Sección Control de acceso basado en roles actualizada a todas las rutas; la matriz coincide con `rbac-matrix.json` y con la API.
- [ ] Secciones Internacionalización y Configuración y secretos.
- [ ] Cómo correr pruebas con mocks y E2E (local y contra Render), captura de `npm run test:e2e` contra Render y enlace a `docs/e2e-antigravity.md`.
- [ ] Sección API pública: URL, health check, usuarios demo (email, contraseña, rol), ejemplo de uso, datos de Render PostgreSQL y Atlas, entrega de secretos (sin valores).

Commit: `docs(readme): documentar backend completo y API pública`.

### S2-18 — Validación final y entrega

Rama: feat/s2-18-cierre
Etiquetas: sprint-2, docs
Puntos: 2

- [ ] Clonación limpia de `staging` en otra carpeta: `npm install`, `npm run lint`, `npm test` y `npm run test:e2e` sin errores.
- [ ] `npm run test:e2e` contra Render pasa (consultar `/health` antes para despertar el servicio).
- [ ] No hay secretos en el repositorio: buscar `jwt`, `mongodb+srv`, `postgres://` en el código y en `config/`.
- [ ] Todas las ramas `feat/s2-*` siguen en el remoto.
- [ ] GitHub Project al día y commits de todos los integrantes.
- [ ] La base de Render PostgreSQL estará activa en la fecha de revisión.
- [ ] Entregar en Moodle la URL del repositorio.

Commit: `docs(sprint2): registrar validación de entrega`.
