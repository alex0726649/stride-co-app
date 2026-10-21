# Stride & Co.

Stride & Co. es una tienda deportiva que actualmente gestiona sus ventas mediante WhatsApp, hojas de cálculo y procesos manuales. Este proyecto digitaliza progresivamente esos procesos mediante una plataforma web que permita a los clientes consultar el catálogo, comprar y dar seguimiento a sus pedidos, y a los equipos de ventas y operaciones administrar pedidos, inventario y notificaciones desde un panel centralizado.

El proyecto se desarrolla como parte del curso Desarrollo de Aplicaciones Web, aplicando la metodología Scrum de forma iterativa e incremental a lo largo del semestre.

## Datos académicos

| Campo | Detalle |
|---|---|
| **Universidad** | Universidad Autónoma de Chihuahua |
| **Facultad** | Facultad de Ingeniería |
| **Carrera** | Ingeniería en Computación |
| **Materia** | Desarrollo de Aplicaciones Web |
| **Docente** | Mtro. Luis Antonio Ramírez Martínez |
| **Actividad** | Proyecto Integrador — Actividad 4. Autenticación con JWT y almacenamiento seguro de contraseñas |

## Equipo

| Integrante | Rol |
|---|---|
| Osvaldo Hernández Juárez | Product Owner |
| José Alejandro Pérez Millán | Scrum Master |
| Jenny Guadalupe Quintana Sánchez | Developer |
| Armando Velázquez Barroso | Developer |

Tablero de trabajo: [GitHub Project](https://github.com/users/alex0726649/projects/1)

## Estado actual

El backend sigue esta arquitectura:

```
HTTP Request → Express → Middleware → Route → Controller → Modelo (Sequelize / Mongoose) → MySQL / MongoDB
```

- **Persistencia relacional (MySQL + Sequelize):** usuarios, roles y permisos, incluida la relación N:M entre roles y permisos.
- **Persistencia documental (MongoDB + Mongoose):** clientes y órdenes.
- **Autenticación:** contraseñas protegidas con bcrypt, login que emite un JWT y middleware `authenticate` con `express-jwt` para las rutas protegidas. Los detalles están en [Autenticación](#autenticación).
- **Pendiente:** productos, variantes e inventario ya tienen modelos de Sequelize y tablas en `database/schema.sql`, pero sus controladores todavía responden con datos fijos. La autorización por roles y permisos (RBAC) se incorporará en una actividad posterior.

Las entregas anteriores se conservan en el historial de Git. El estado del Entregable 1 puede consultarse en la etiqueta `entregable-1`.

## Tecnologías utilizadas

**Ejecución**

- Node.js y Express — servidor web y enrutamiento
- MySQL con Sequelize — modelo relacional
- MongoDB con Mongoose — modelo documental
- bcrypt — hash y salt de contraseñas
- jsonwebtoken y express-jwt — emisión y verificación de JWT
- dotenv — carga de variables de entorno
- Morgan — registro de solicitudes HTTP
- Pug — vistas del proyecto base
- cookie-parser, debug, http-errors

**Desarrollo**

- Jest — pruebas unitarias y de integración
- Supertest — pruebas sobre los endpoints HTTP
- ESLint — análisis estático de código
- Supervisor — reinicio automático durante el desarrollo
- Docker — bases de datos locales y despliegue

## Requisitos previos

- **Node.js** `^20.19.0 || ^22.13.0 || >=24` (definido en `engines` de `package.json`)
- **npm** (incluido con Node.js)
- **Git**
- **Docker**, para levantar MySQL y MongoDB en local

Verifica tu versión antes de instalar:

```bash
node -v
```

## Instalación

```bash
git clone https://github.com/alex0726649/stride-co-app.git
cd stride-co-app
npm ci
```

Se usa `npm ci` en lugar de `npm install` porque instala exactamente las versiones registradas en `package-lock.json` sin modificar el archivo, lo que garantiza que todos los integrantes trabajen con las mismas dependencias.

Después se crea el archivo `.env` a partir de la plantilla y se completa `JWT_SECRET`, como se explica en [Variables de entorno](#variables-de-entorno):

```bash
cp .env.example .env
```

## Bases de datos

La conexión está definida en `config/sequelize.js` (MySQL: base `stride_co`, usuario `root`, puerto `3306`) y en `config/mongoose.js` (MongoDB: `mongodb://localhost:27017/stride_co`).

La primera vez se crean los contenedores:

```bash
docker run -d --name stride-mysql \
  -e MYSQL_ROOT_PASSWORD=abcd1234 \
  -e MYSQL_DATABASE=stride_co \
  -p 3306:3306 \
  mysql:8

docker run -d --name stride-mongo -p 27017:27017 mongo:7
```

En las siguientes sesiones basta con iniciarlos:

```bash
docker start stride-mysql stride-mongo
```

Al arrancar, el servidor ejecuta `sequelize.sync()` para crear las tablas que no existen y `database/ensure-constraints.js` para aplicar las restricciones de catálogo e inventario. `sync()` no modifica tablas existentes: si la base se creó antes de agregar una columna, por ejemplo `password_hash` y `salt_key` en `users`, se debe recrear la base de desarrollo o agregar la columna manualmente. El esquema relacional está documentado en [`database/README.md`](database/README.md).

## Ejecución

Con ambas bases de datos en ejecución:

```bash
npm start
```

La aplicación queda disponible en `http://localhost:3000` y la API bajo el prefijo `/api`. Si alguna de las bases no está disponible, el servidor no inicia.

Para cambiar el puerto se utiliza la variable de entorno `PORT`:

```bash
PORT=4000 npm start
```

En PowerShell:

```powershell
$env:PORT=4000; npm start
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor con `node ./bin/www`. |
| `npm run dev` | Inicia el servidor con Supervisor y lo reinicia al detectar cambios en el código. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. Debe finalizar sin errores. |
| `npm test` | Ejecuta la suite completa de pruebas con Jest. No requiere bases de datos. |

## Arquitectura

La aplicación mantiene una separación estricta de responsabilidades:

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| Montaje | `app.js` | Carga `.env`, registra middlewares y asocia cada router a su ruta base. |
| Middleware | `middlewares/` | Lógica transversal reutilizable, como `authenticate`. |
| Ruta | `routes/` | Define los endpoints y delega al controlador. No contiene lógica. |
| Controlador | `controllers/` | Valida la solicitud, resuelve la operación y construye la respuesta. |
| Modelo | `models/relationals/`, `models/documents/` | Define las entidades de Sequelize (MySQL) y Mongoose (MongoDB). |
| Utilidades | `utils/` | Funciones compartidas, como el hash de contraseñas. |

Cada recurso tiene un archivo en `routes/` y otro en `controllers/` con el mismo nombre.

## API

Todos los endpoints se publican bajo el prefijo `/api`.

### Formato de respuesta

Las respuestas siguen una estructura uniforme:

```json
{
  "message": "Descripción de la operación",
  "data": {}
}
```

El campo `data` contiene un objeto, un arreglo o `null` según la operación. En las respuestas de error `data` es `null`.

### Códigos de estado

| Código | Situación |
|---|---|
| `200` | Consulta, actualización o eliminación correcta. |
| `201` | Creación correcta. |
| `400` | Cuerpo ausente, campos faltantes, tipos incorrectos o violación de unicidad. |
| `401` | Credenciales inválidas, token ausente o inválido, o usuario inactivo. |
| `404` | Recurso inexistente o ruta de API no registrada. |
| `409` | Email de usuario ya registrado. |
| `500` | Error inesperado controlado. |

### Matriz de endpoints

| Recurso | Base | GET lista | GET `:id` | POST | PUT | DELETE | Datos |
|---|---|---|---|---|---|---|---|
| Autenticación | `/api/auth` | — | — | `/login` | — | — | MySQL |
| Usuarios | `/api/users` | Sí | Sí | Sí | Sí | Sí | MySQL |
| Roles | `/api/roles` | Sí | Sí | Sí | Sí | Sí | MySQL |
| Permisos | `/api/permissions` | Sí | Sí | Sí | Sí | Sí | MySQL |
| Clientes | `/api/customers` | Sí | Sí | Sí | Sí | Sí | MongoDB |
| Órdenes | `/api/orders` | Sí | Sí | Sí | Sí | Sí | MongoDB |
| Productos | `/api/products` | Sí | Sí | Sí | Sí | Sí | Datos fijos |
| Variantes | `/api/variants` | Sí | Sí | Sí | Sí | Sí | Datos fijos |
| Inventario | `/api/inventory` | Sí | Sí | No | Sí | No | Datos fijos |

Además, `GET /api/auth/me` devuelve el usuario autenticado y requiere un token Bearer.

El inventario no se crea ni se elimina de forma independiente porque cada registro existe junto con su variante.

El modelo actual de órdenes (`models/documents/order.js`) guarda `customerId`, que referencia al cliente, y `totals` (`subtotal`, `shipping`, `discount`, `total`), además de `createdAt` y `updatedAt`. Los artículos, la dirección de envío y el historial de estados del diagrama todavía no forman parte del esquema.

El contrato de la API se encuentra en [`docs/api.md`](docs/api.md).

### Recursos con datos fijos

Productos, variantes e inventario todavía no usan sus modelos de Sequelize. Mientras se completa esa integración:

- Los datos viven en memoria y las operaciones de escritura devuelven la respuesta esperada, pero **no modifican los datos**.
- Los identificadores devueltos al crear son valores de ejemplo y no quedan registrados.
- La unicidad se verifica solo contra los datos fijos de cada recurso.

### Peticiones de ejemplo

Crear un rol:

```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -d '{"name":"Vendedor","description":"Equipo de ventas"}'
```

Consultar un recurso inexistente:

```bash
curl http://localhost:3000/api/roles/99
```

```json
{
  "message": "Rol no encontrado",
  "data": null
}
```

Los ejemplos de login y de `/api/auth/me` se encuentran en [Autenticación](#autenticación).

En Windows PowerShell, `curl` es un alias de `Invoke-WebRequest` y no acepta estas opciones. Usa `curl.exe` de forma explícita.

## Pruebas

```bash
npm test
```

Las pruebas usan Jest y Supertest, ejecutando peticiones HTTP locales contra la aplicación Express sin levantar el servidor por separado. `jest.config.js` carga `test/setup.js`, que sustituye las consultas de Sequelize y Mongoose por dobles de prueba. No se necesita Docker ni se escriben datos en MySQL o MongoDB; las consultas SQL reales se bloquean como protección adicional. La suite no lee el `.env` local: usa configuración exclusiva de pruebas y un costo bcrypt de 4 para reducir el tiempo de ejecución.

En conjunto, la suite comprueba:

- Código HTTP esperado en cada operación.
- Estructura de la respuesta y tipo de contenido JSON.
- Funcionamiento de los parámetros de ruta.
- Manejo de recursos inexistentes.
- Solicitudes incorrectas: campos faltantes, tipos inválidos, cuerpo ausente y JSON malformado.
- Consultas y escrituras mediante los modelos de usuarios, roles, permisos, clientes y órdenes, con persistencia aislada.
- Errores de base de datos respondidos como `500` en JSON, sin dejar la petición sin respuesta.
- Generación y comparación reales con bcrypt, regeneración del hash y salt al cambiar contraseña y conservación del hash al editar otros campos.
- Rechazo de contraseñas ausentes o vacías al crear usuarios, y de emails duplicados.
- Exclusión de `password`, `password_hash` y `salt_key` usando la serialización real de User.
- Login JSON y formulario, validación de credenciales y firma real de JWT.
- Rechazo de tokens ausentes, malformados, expirados o con firma, algoritmo, issuer o audience incorrectos.
- Consulta de `/api/auth/me` y rechazo del mismo token cuando el usuario se desactiva o deja de existir.
- Comportamiento de productos, variantes e inventario. `test/fixtures.test.js` comprueba las relaciones entre esos tres recursos.

Estas pruebas no verifican el esquema SQL, las restricciones de la base ni la conexión real. Esas comprobaciones se realizan por separado, por ejemplo con Postman sobre una base de desarrollo.

Para ejecutar un archivo específico:

```bash
npm test -- test/roles.test.js
```

## Análisis de calidad de código

```bash
npm run lint
```

La configuración se encuentra en `eslint.config.js`. El comando debe finalizar sin errores antes de abrir cualquier Pull Request.

## Estructura del proyecto

```text
stride-co-app/
|-- bin/
|   `-- www                    Punto de entrada: conecta MySQL y MongoDB e inicia el servidor
|-- config/
|   |-- sequelize.js           Conexión a MySQL
|   `-- mongoose.js            Conexión a MongoDB
|-- controllers/               Lógica de cada recurso
|-- database/
|   |-- schema.sql             Tablas de catálogo e inventario
|   |-- ensure-constraints.js  Restricciones aplicadas al iniciar
|   `-- README.md              Documentación del esquema relacional
|-- docs/
|   |-- api.md                 Contrato de la API
|   |-- product-backlog.md     Product Backlog
|   `-- transcripcion-cliente.md  Entrevista con el cliente (fuente de requisitos)
|-- middlewares/
|   `-- authenticate.js        Verificación de JWT y carga del usuario
|-- models/
|   |-- relationals/           Modelos de Sequelize
|   `-- documents/             Modelos de Mongoose
|-- routes/                    Definición de endpoints
|-- test/                      Pruebas con Jest y Supertest
|-- utils/
|   |-- password.js            Hash y verificación con bcrypt
|   `-- response.js            Respuestas de los recursos con datos fijos
|-- public/                    Archivos estáticos
|-- views/                     Plantillas Pug
|-- app.js                     Middlewares y montaje de routers
|-- .env.example               Plantilla de variables de entorno
|-- Dockerfile                 Imagen para despliegue
|-- eslint.config.js
|-- jest.config.js
|-- package.json
|-- package-lock.json
`-- README.md
```

## Flujo de trabajo del equipo

El trabajo se organiza en tarjetas dentro del GitHub Project. Para tomar una tarea:

1. Asignarse la tarjeta y moverla a *En progreso*.
2. Crear la rama a partir de `main` actualizado:

   ```bash
   git switch main
   git pull
   git switch -c feat/nombre-de-la-tarea
   ```

3. Trabajar únicamente el alcance de la tarjeta. Agregar los archivos por nombre en lugar de usar `git add .`.
4. Ejecutar `npm run lint` y `npm test` antes de subir.
5. Publicar la rama y abrir el Pull Request:

   ```bash
   git push -u origin feat/nombre-de-la-tarea
   gh pr create
   ```

6. Solicitar revisión a un integrante distinto del autor. El merge lo realiza quien revisa, con la opción **Create a merge commit** para conservar los commits y su autoría.

### Convención de commits

Se utiliza [Conventional Commits](https://www.conventionalcommits.org/) con el formato `tipo(ámbito): descripción`:

```
feat(auth): emitir JWT en el login
fix(users): validar contraseña al crear usuario
docs(readme): documentar bases de datos locales
chore(tooling): declarar supervisor como dependencia
test(inventory): agregar pruebas de actualización
```

La descripción se escribe en minúscula, en imperativo y sin punto final.

## Autenticación

La Actividad 4 incorpora autenticación con JWT y almacenamiento seguro de contraseñas. La autorización por roles y permisos (RBAC) queda fuera de esta actividad.

### Contraseñas

Las funciones reutilizables de `utils/password.js` utilizan `bcrypt.genSalt`, `bcrypt.hash` y `bcrypt.compare`. Al crear un usuario o actualizar su contraseña mediante `PUT /api/users/:id`, se generan un nuevo salt y un nuevo hash, que se almacenan en las columnas `salt_key` y `password_hash` de la tabla `users`. El factor de costo se obtiene de `BCRYPT_SALT_ROUNDS`; la plantilla propone `10`.

La base de datos local debe tener ambas columnas. Los usuarios anteriores sin hash necesitan una contraseña configurada antes de probar el login. La contraseña en texto plano no se almacena; `User.toJSON()` excluye `password`, `password_hash` y `salt_key` de las respuestas JSON.

### Variables de entorno

Copiar `.env.example` a `.env` en la raíz del proyecto y completar la configuración. En PowerShell, si todavía no existe `.env`:

```powershell
Copy-Item .env.example .env
```

| Variable | Uso | Valor de la plantilla |
|---|---|---|
| `JWT_SECRET` | Clave compartida para firmar y verificar tokens; configurar un valor privado. | Vacío, debe completarse |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token. | `15m` (15 minutos) |
| `JWT_ISSUER` | Emisor esperado. | `stride-co` |
| `JWT_AUDIENCE` | Destinatario esperado. | `stride-co-api` |
| `BCRYPT_SALT_ROUNDS` | Factor de costo de bcrypt. | `10` |

`dotenv` carga estas variables al iniciar la aplicación. Reiniciar el servidor después de modificar `.env`. El archivo `.env` está excluido de Git; únicamente se comparte `.env.example`, sin secretos reales.

### Inicio de sesión

Enviar `POST /api/auth/login` sin token, con `email` y `password`. Se acepta JSON o `application/x-www-form-urlencoded`. Ejemplo con datos ficticios de un usuario que debe existir y tener contraseña configurada:

```json
{
  "email": "ana@example.com",
  "password": "Ejemplo123!"
}
```

Si el usuario existe, está activo y la contraseña coincide, el servidor responde `200`:

```json
{
  "message": "Login successful",
  "data": {
    "token": "<token generado>",
    "token_type": "Bearer",
    "expiresIn": "15m"
  }
}
```

`jsonwebtoken` firma el token con `HS256`. El identificador del usuario se incluye en `sub`, junto con los claims de emisión, expiración, emisor y destinatario; no se incluyen contraseñas, hashes ni salts. La duración de la respuesta procede de `JWT_EXPIRES_IN`.

### Usuario autenticado

Enviar `GET /api/auth/me` con el encabezado:

```http
Authorization: Bearer <token>
```

En Postman, seleccionar **Authorization → Bearer Token** y pegar únicamente el token obtenido en el login.

La ruta utiliza `authenticate`, definido en `middlewares/authenticate.js`. Primero, `express-jwt` verifica la firma, el algoritmo `HS256`, la expiración, el emisor y el destinatario. Después, el middleware busca al usuario mediante `req.auth.sub`, comprueba que exista y esté activo, y lo asigna a `req.user`.

La respuesta `200` contiene directamente los datos seguros del usuario, sin `password`, `password_hash` ni `salt_key`. Los errores de autenticación se responden con `401` en formato JSON. Un usuario eliminado o desactivado no puede utilizar un token previamente emitido, aunque todavía no haya expirado.

### Estados HTTP

| Prueba | Resultado esperado |
|---|---|
| Login con credenciales correctas y usuario activo | `200`, con token |
| Login con email o contraseña incompletos | `400` |
| Login con credenciales incorrectas | `401`, mensaje genérico |
| Login con usuario inactivo | `401` |
| `/api/auth/me` sin token | `401` |
| `/api/auth/me` con token inválido o expirado | `401` |
| `/api/auth/me` con token válido y usuario activo | `200` |
| `/api/auth/me` con token de un usuario inexistente o inactivo | `401` |