# Sprint 1: tareas para tomar y entregar por PR

## Objetivo y alcance

Completar el **Entregable 1: Configuración inicial del backend** de Stride & Co. La fuente de requisitos es el documento del profesor `proyecto_integrador_entregable1.pdf`, secciones 3 a 6. El backlog elaborado por el equipo no define ni amplía el alcance de esta entrega. Las tareas cubren Express, rutas, controladores, respuestas mock, logging, ESLint, pruebas y colaboración en GitHub. La división en tarjetas, estimaciones, ramas y revisión de PR es una propuesta de organización para el equipo.

No se requiere todavía base de datos, ORM/ODM, login real, permisos efectivos, reservas de stock, pagos ni frontend. Los campos de los mocks deberán cotejarse con la figura 1 del PDF antes de implementarlos.

## Punto de partida observado

- `stride-co-app` contiene el repositorio Git, Express Generator, `controllers/`, Morgan y manejo de errores de Express con vistas HTML.
- Usuarios ya tiene cinco rutas y controladores iniciales; está montado en `/users`, devuelve datos vacíos y no usa el ID para seleccionar un recurso.
- Faltan los archivos de los otros siete recursos, la configuración de ESLint, la carpeta de pruebas y los scripts `lint` y `test`.
- `dev` usa `supervisor`, pero este no aparece declarado en las dependencias del paquete.
- El README contiene descripción e integrantes; faltan instrucciones operativas.
- Hay otra carpeta `stride-co` fuera del repositorio identificado. Esta propuesta concentra el trabajo en `stride-co-app`; no borrar ni sincronizar carpetas sin revisar su propósito.
- Revisión estática local: no se ha verificado aquí la ejecución ni el estado remoto de GitHub Project.

## Cómo tomar una tarea

Todas las tareas están **disponibles y sin asignar**. Las dependencias indican cuáles pueden empezar ya.

1. Elegir una tarjeta lista y anotar responsable en GitHub Project; moverla a **En progreso** antes de programar.
2. Crear una rama desde la rama base actualizada. Una tarea activa por persona ayuda a terminar antes de abrir más trabajo.
3. Implementar la tarea con sus pruebas; hacer commits descriptivos con el formato `tipo(área): descripción`.
4. Abrir un pull request (PR), enlazar la tarjeta y pasarla a **En revisión**. Otra persona revisa.
5. Resolver comentarios, ejecutar comprobaciones e integrar mediante merge. Mover a **Hecho** solo cuando esté integrado.

Estados sugeridos: **Por hacer → En progreso → En revisión → Hecho**. Marcar **Bloqueada** con el ID de la dependencia cuando corresponda.

## Tablero de trabajo

Estimaciones orientativas de trabajo activo, no compromisos de calendario. Cada fila corresponde a una tarjeta y un PR; todos incluyen revisión por otra persona.

| ID | Tarea / entregable | Depende de | Tiempo | Responsable | Estado |
|---|---|---|---|---|---|
| S1-01 | Acordar contrato de API y operaciones por recurso | — | 1–2 h | Libre | Por hacer |
| S1-02 | Completar scripts, ESLint y base de pruebas | — | 2–4 h | Libre | Por hacer |
| S1-03 | Completar `/api/users` y sus pruebas | 01, 02 | 2–3 h | Libre | Por hacer |
| S1-04 | Crear `/api/roles` y sus pruebas | 01, 02 | 1–3 h | Libre | Por hacer |
| S1-05 | Crear `/api/permissions` y sus pruebas | 01, 02 | 1–3 h | Libre | Por hacer |
| S1-06 | Crear `/api/products` y sus pruebas | 01, 02 | 2–3 h | Libre | Por hacer |
| S1-07 | Crear `/api/variants` y sus pruebas | 01, 02 | 2–3 h | Libre | Por hacer |
| S1-08 | Crear `/api/inventory` y sus pruebas | 01, 02 | 2–3 h | Libre | Por hacer |
| S1-09 | Crear `/api/customers` y sus pruebas | 01, 02 | 2–3 h | Libre | Por hacer |
| S1-10 | Crear `/api/orders` y sus pruebas | 01, 02 | 2–4 h | Libre | Por hacer |
| S1-11 | Unificar errores de API y verificar logging e ignore | 01, 02 | 2–3 h | Libre | Por hacer |
| S1-12 | Completar README y matriz de endpoints | 01; cierre tras 03–11 | 1–2 h | Libre | Por hacer |
| S1-13 | Validar instalación limpia y preparar entrega | 03–12 | 1–2 h | Libre | Por hacer |

## Criterios de aceptación por tarjeta

### S1-01 — Contrato de API

- [ ] Crear `docs/api.md` con rutas bajo `/api`, nombres de funciones y ejemplos JSON de éxito y error.
- [ ] Definir los campos mock conforme a la figura 1 del PDF y ejemplos relacionados con IDs consistentes.
- [ ] Documentar operaciones necesarias por recurso. Propuesta inicial: listar y consultar en todos; crear/actualizar/eliminar donde tenga sentido. Justificar las excepciones, especialmente inventario y órdenes; el PDF no exige cinco operaciones para todos.
- [ ] Acordar respuestas 200, 201, 400 y 404 según corresponda. Si se usa 204, no devolver cuerpo.
- [ ] Definir comportamiento de mocks: fixtures deterministas y simulación de escrituras sin persistencia, o memoria reiniciable; documentar cuál se eligió para que las pruebas sean reproducibles.
- [ ] Acordar IDs válidos/inexistentes y validaciones mínimas para probar errores.

Rama: `docs/s1-01-contrato-api`. Commit: `docs(api): definir contrato de recursos mock`.

### S1-02 — Herramientas y pruebas base

- [ ] Declarar las herramientas de desarrollo necesarias y completar `start`, `dev`, `lint` y `test`.
- [ ] Agregar `eslint.config.js`, compatible con la versión elegida y el código CommonJS actual.
- [ ] Crear `test/` con una prueba inicial real de la aplicación; configurar el ejecutor y una herramienta de peticiones HTTP como Supertest.
- [ ] Importar `app.js` en las pruebas sin dejar un servidor o puerto abierto al terminar.
- [ ] Comprobar que lint y test pasan en el estado inicial y que start y dev arrancan. Registrar versión de Node utilizada.
- [ ] Actualizar el lockfile junto con `package.json`; las herramientas deben funcionar sin instalaciones globales.

Rama: `chore/s1-02-herramientas`. Commit: `chore(tooling): configurar lint y pruebas del backend`.

### S1-03 a S1-10 — Un recurso por persona y PR

**Checklist común obligatorio para cada recurso:**

- [ ] Archivo propio `routes/<recurso>.js` y `controllers/<recurso>.js`; la ruta delega el procesamiento al controlador.
- [ ] Montaje en `app.js` bajo `/api/<recurso>` y operaciones conforme al contrato S1-01.
- [ ] Respuestas mock coherentes con el modelo; el ID de ruta afecta la respuesta.
- [ ] Pruebas en `test/<recurso>.test.js`: código HTTP, forma de respuesta, ID válido, inexistente y solicitudes incorrectas donde aplique.
- [ ] Pruebas del comportamiento del controlador, directamente o a través de los endpoints; no basta probar solo que existe la ruta.
- [ ] `npm run lint` y `npm test` pasan; actualizar la documentación del recurso si cambió el contrato.

| Tarjeta | Particularidad a completar | Rama | Ejemplo de commit |
|---|---|---|---|
| S1-03 | Reutilizar el CRUD inicial de usuarios, cambiar a `/api/users` y sustituir respuestas vacías por mocks; no devolver contraseñas | `feat/s1-03-users` | `feat(users): completar endpoints mock y pruebas` |
| S1-04 | Roles con IDs consistentes con los usuarios; sin autorización real | `feat/s1-04-roles` | `feat(roles): agregar rutas y controladores mock` |
| S1-05 | Permisos y relaciones de referencia según modelo, sin middleware de permisos reales | `feat/s1-05-permissions` | `feat(permissions): agregar endpoints mock y pruebas` |
| S1-06 | Productos con campos y ejemplos de catálogo acordados | `feat/s1-06-products` | `feat(products): agregar endpoints mock y pruebas` |
| S1-07 | Variantes vinculadas mediante IDs a productos del contrato | `feat/s1-07-variants` | `feat(variants): agregar endpoints mock y pruebas` |
| S1-08 | Inventario coherente con variantes; documentar operaciones elegidas, sin reservas ni concurrencia real | `feat/s1-08-inventory` | `feat(inventory): agregar consulta mock y pruebas` |
| S1-09 | Clientes mock conforme al modelo documental, con datos de ejemplo no sensibles | `feat/s1-09-customers` | `feat(customers): agregar endpoints mock y pruebas` |
| S1-10 | Órdenes con cliente, artículos y cantidades consistentes; simular respuesta sin compra ni pago real | `feat/s1-10-orders` | `feat(orders): agregar endpoints mock y pruebas` |

Los recursos pueden desarrollarse en paralelo después de S1-01 y S1-02, usando IDs acordados sin esperar la implementación de otros módulos.

### S1-11 — Errores, logging y archivos ignorados

- [ ] Mantener Morgan y verificar que registra método, ruta y estado HTTP.
- [ ] Devolver error JSON controlado en rutas API inexistentes; distinguirlo del recurso inexistente dentro de un endpoint válido.
- [ ] Manejar JSON malformado y errores inesperados con estados correctos; no exponer detalles internos en respuestas de producción.
- [ ] Agregar pruebas de ruta desconocida, JSON inválido y manejo controlado de errores.
- [ ] Revisar `.gitignore` para excluir `node_modules/`, `.env` y archivos locales innecesarios. Comprobar también que no estén ya versionados.
- [ ] Verificar que los cambios no contienen credenciales ni información sensible.

Rama: `fix/s1-11-errores-api`. Commit: `fix(api): unificar manejo de errores JSON`.

### S1-12 — Documentación del proyecto

- [ ] Conservar descripción e integrantes y agregar requisitos, instalación, start, dev, lint y test con comandos reales.
- [ ] Explicar estructura y flujo `Request → Route → Controller → Response Mock`.
- [ ] Enlazar `docs/api.md`, incluir peticiones de ejemplo y aclarar las limitaciones de los mocks.
- [ ] Documentar cómo tomar una tarea, crear rama, escribir commits y solicitar revisión de PR.
- [ ] Enlazar el GitHub Project real y reflejar el avance efectivo; no marcar tareas como completas por estar documentadas.

Rama: `docs/s1-12-readme`. Commit: `docs(readme): documentar instalación API y colaboración`.

### S1-13 — Cierre y evidencia

- [ ] Clonar en una carpeta nueva e instalar con `npm ci` usando el lockfile versionado.
- [ ] Ejecutar `npm run lint` y `npm test`; verificar por separado que `npm start` y `npm run dev` arrancan y atienden una petición.
- [ ] Comprobar los ocho recursos y los casos de error acordados.
- [ ] Registrar en `docs/validacion-sprint-1.md` los comandos, resultados, versión de Node y revisión/commit que se verificó.
- [ ] Confirmar README completo, PR revisados, commits descriptivos de los integrantes y GitHub Project actualizado.
- [ ] Corregir fallos antes del cierre; verificar que la versión integrada está publicada en GitHub.
- [ ] El integrante responsable entrega en Moodle únicamente la URL del repositorio, conforme al PDF.

Rama: `docs/s1-13-validacion`. Commit: `docs(sprint1): registrar validación de entrega`.

## Orden recomendado y reparto flexible

1. **Primera ronda:** dos personas pueden tomar S1-01 y S1-02. Las otras pueden comenzar el borrador de README y revisar el modelo de datos para preparar recursos.
2. **Segunda ronda:** repartir los ocho recursos entre los cuatro integrantes, tomando uno a la vez. Una combinación posible es users/roles, products/variants, customers/orders y permissions/inventory; no es una asignación obligatoria.
3. **Tercera ronda:** completar S1-11, cerrar documentación y hacer S1-13 con revisión cruzada.

Los roles de Product Owner y Scrum Master no sustituyen la participación individual que pide la rúbrica. Cada integrante debe aportar cambios reales y commits propios; no crear commits vacíos para aparentar participación.

### Evitar conflictos al integrar

- Integrar S1-01 y S1-02 primero para compartir configuración y convenciones.
- Cada PR de recurso cambia sus propios archivos y solo agrega su importación y montaje en `app.js`.
- Centralizar cambios de dependencias en S1-02; coordinar cualquier dependencia adicional antes de tocar el lockfile.
- Integrar los PR de uno en uno, actualizar la siguiente rama con la rama base y volver a comprobar lint y pruebas tras resolver conflictos.
- Coordinar S1-11 porque también modifica `app.js`; revisar que sus manejadores permanezcan después de los routers.

## Plantilla breve de pull request

```markdown
## Tarea
S1-XX — título (enlazar issue/tarjeta)

## Cambios
- Qué comportamiento queda implementado.

## Verificación
- [ ] Criterios de la tarjeta cumplidos
- [ ] npm run lint
- [ ] npm test
- Ejemplo de petición y respuesta, cuando aplique.

## Revisión
- Revisor: integrante distinto del autor.
- Dependencias o limitaciones pendientes: indicar cuáles, o ninguna.
```

## Definición de terminado

Una tarea está terminada cuando cumple sus criterios, tiene verificaciones registradas, fue revisada por otra persona, está integrada en la rama base y su tarjeta refleja ese estado. El sprint se cierra con los ocho recursos mock funcionando, los cuatro scripts operativos, instalación limpia comprobada y evidencia colaborativa en GitHub.

**Siguiente trabajo inmediato: tomar S1-01 y S1-02.** Son las tareas que desbloquean la implementación independiente del equipo.
