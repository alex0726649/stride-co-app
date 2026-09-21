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
| **Actividad** | Proyecto Integrador — Entregable 1. Configuración inicial del backend |

## Equipo

| Integrante | Rol |
|---|---|
| Osvaldo Hernández Juárez | Product Owner |
| José Alejandro Pérez Millán | Scrum Master |
| Jenny Guadalupe Quintana Sánchez | Developer |
| Armando Velázquez Barroso | Developer |

Tablero de trabajo: [GitHub Project — Sprint 1](https://github.com/users/alex0726649/projects/1/views/10)

## Estado actual

Este repositorio corresponde al **Entregable 1**, cuyo alcance es la arquitectura inicial del backend:

```
HTTP Request → Express → Route → Controller → Response Mock
```

Los ocho recursos de la API están montados y cuentan con pruebas automatizadas. Todas las respuestas provienen de datos fijos definidos en los controladores: **todavía no existe persistencia, autenticación ni autorización**, elementos que se incorporarán en los siguientes entregables.

## Objetivo

Configurar la base técnica del backend con Node.js y Express, estableciendo una separación clara entre rutas y controladores, junto con control de versiones, logging, análisis estático y pruebas automatizadas.

## Tecnologías utilizadas

**Ejecución**

- Node.js
- Express — servidor web y enrutamiento
- Morgan — registro de solicitudes HTTP
- Pug — vistas del proyecto base
- cookie-parser, debug, http-errors

**Desarrollo**

- Jest — pruebas unitarias y de integración
- Supertest — pruebas sobre los endpoints HTTP
- ESLint — análisis estático de código
- Supervisor — reinicio automático durante el desarrollo

## Requisitos previos

- **Node.js** `^20.19.0 || ^22.13.0 || >=24` (definido en `engines` de `package.json`)
- **npm** (incluido con Node.js)
- **Git**

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

## Ejecución

```bash
npm start
```

La aplicación queda disponible en `http://localhost:3000` y la API bajo el prefijo `/api`.

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
| `npm test` | Ejecuta la suite completa de pruebas con Jest. |

## Arquitectura

La aplicación mantiene una separación estricta de responsabilidades:

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| Ruta | `routes/` | Define los endpoints y delega al controlador. No contiene lógica. |
| Controlador | `controllers/` | Valida la solicitud, resuelve la operación y construye la respuesta. |
| Montaje | `app.js` | Registra middlewares y asocia cada router a su ruta base. |

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

El campo `data` contiene un objeto, un arreglo o `null` según la operación. En las respuestas de error `data` siempre es `null`.

### Códigos de estado

| Código | Situación |
|---|---|
| `200` | Consulta, actualización o eliminación correcta. |
| `201` | Creación simulada correcta. |
| `400` | Cuerpo ausente, campos faltantes, tipos incorrectos o violación de unicidad. |
| `404` | Recurso inexistente o ruta de API no registrada. |
| `500` | Error inesperado controlado. |

### Matriz de endpoints

| Recurso | Base | GET lista | GET `:id` | POST | PUT | DELETE | Estado |
|---|---|---|---|---|---|---|---|
| Usuarios | `/api/users` | Sí | Sí | Sí | Sí | Sí | Completo |
| Roles | `/api/roles` | Sí | Sí | Sí | Sí | Sí | Completo |
| Permisos | `/api/permissions` | Sí | Sí | Sí | Sí | Sí | Completo |
| Variantes | `/api/variants` | Sí | Sí | Sí | Sí | Sí | Completo |
| Inventario | `/api/inventory` | Sí | Sí | No | Sí | No | Completo |
| Clientes | `/api/customers` | Sí | Sí | Sí | Sí | Sí | Completo |
| Órdenes | `/api/orders` | Sí | Sí | Sí | Sí | No | Completo |
| Productos | `/api/products` | Sí | Sí | Sí | Sí | Sí | Completo |

Las operaciones marcadas como `No` corresponden a decisiones de diseño documentadas en el contrato, no a omisiones: el inventario no se crea ni se elimina de forma independiente porque cada registro existe junto con su variante, y las órdenes no se eliminan porque su cancelación se representa mediante un cambio de estado dentro del historial del pedido.

La matriz describe las operaciones implementadas. El cierre de entrega todavía requiere la validación desde una instalación limpia de S1-13 y la revisión del GitHub Project.

Las órdenes siguen la estructura documental de la figura 1: `totals`, `shippingAddress`, `items`, `statusHistory`, `createdAt` y `updatedAt`, además de sus identificadores y método de pago. El total se consulta en `data.totals.total` y el estado actual en la última entrada de `data.statusHistory`. Ya no se devuelven `data.total` ni `data.status` planos. PUT admite `status` en el cuerpo para simular una nueva entrada del historial; los detalles y ejemplos están en el contrato.

El contrato completo de la API —campos, validaciones, identificadores de prueba y relaciones entre recursos— se encuentra en [`docs/api.md`](docs/api.md).

### Peticiones de ejemplo

Consultar la lista de roles:

```bash
curl http://localhost:3000/api/roles
```

```json
{
  "message": "Lista de roles",
  "data": [
    { "id": 1, "name": "Vendedor", "description": "Consulta y administra sus pedidos asignados" }
  ]
}
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

Crear un permiso:

```bash
curl -X POST http://localhost:3000/api/permissions \
  -H "Content-Type: application/json" \
  -d '{"key":"reports.read","description":"Consultar reportes de venta"}'
```

En Windows PowerShell, `curl` es un alias de `Invoke-WebRequest` y no acepta estas opciones. Usa `curl.exe` de forma explícita.

### Limitaciones de los mocks

- Los datos son fijos y viven en memoria. Las operaciones de creación, actualización y eliminación devuelven la respuesta que correspondería, pero **no modifican los datos**: una consulta posterior devuelve siempre el estado original.
- Los identificadores devueltos al crear un recurso son valores de ejemplo y no quedan registrados.
- Las restricciones de unicidad se verifican únicamente contra los datos fijos de cada recurso.
- No se valida la existencia de los recursos referenciados entre sí.
- No existe autenticación ni autorización: los permisos se exponen como catálogo, sin efecto sobre el acceso.
- Clientes y órdenes usan fechas de ejemplo fijas para que las respuestas sean reproducibles. En órdenes, envío y descuento son cero; la dirección por defecto y el responsable del historial son valores mock, no datos derivados de una sesión autenticada.

## Pruebas

```bash
npm test
```

Las pruebas usan Jest y Supertest, ejecutando peticiones reales contra la aplicación Express sin necesidad de levantar el servidor por separado. Cada recurso cuenta con su archivo en `test/`. En conjunto, la suite comprueba:

- Código HTTP esperado en cada operación.
- Estructura de la respuesta y tipo de contenido JSON.
- Funcionamiento de los parámetros de ruta.
- Manejo de recursos inexistentes.
- Solicitudes incorrectas: campos faltantes, tipos inválidos, cuerpo ausente y JSON malformado.
- Ausencia de persistencia: los datos fijos no cambian después de una escritura simulada.
- Coherencia de referencias entre los mocks de usuarios, roles, productos, variantes, inventario, clientes y órdenes (`test/fixtures.test.js`).
- Estructura documental de órdenes y rechazo con 400 de artículos nulos, tipos incorrectos y totales no finitos.

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
|   `-- www                  Punto de entrada del servidor
|-- controllers/             Lógica de cada recurso
|-- routes/                  Definición de endpoints
|-- test/                    Pruebas con Jest y Supertest
|-- docs/
|   `-- api.md               Contrato de la API
|-- public/                  Archivos estáticos
|-- views/                   Plantillas Pug
|-- app.js                   Middlewares y montaje de routers
|-- eslint.config.js
|-- package.json
|-- package-lock.json
|-- .gitignore
`-- README.md
```

## Flujo de trabajo del equipo

El trabajo se organiza en tarjetas dentro del GitHub Project. Para tomar una tarea:

1. Asignarse la tarjeta y moverla a *En progreso*.
2. Crear la rama a partir de `main` actualizado:

   ```bash
   git switch main
   git pull
   git switch -c feat/s1-00-recurso
   ```

3. Trabajar únicamente el alcance de la tarjeta. Agregar los archivos por nombre en lugar de usar `git add .`.
4. Ejecutar `npm run lint` y `npm test` antes de subir.
5. Publicar la rama y abrir el Pull Request:

   ```bash
   git push -u origin feat/s1-00-recurso
   gh pr create
   ```

6. Solicitar revisión a un integrante distinto del autor. El merge lo realiza quien revisa.

### Convención de commits

Se utiliza [Conventional Commits](https://www.conventionalcommits.org/) con el formato `tipo(ámbito): descripción`:

```
feat(roles): agregar rutas y controladores mock
fix(api): unificar manejo de errores JSON
docs(readme): documentar instalación API y colaboración
chore(tooling): declarar supervisor como dependencia
test(inventory): agregar pruebas de actualización
```

La descripción se escribe en minúscula, en imperativo y sin punto final.
