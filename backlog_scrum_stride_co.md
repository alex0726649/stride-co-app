# Stride and Co: Proyecto Integrador de Transformación Digital
## Transcripción de Requerimientos y Backlog de Scrum

---

### 1. INTRODUCCIÓN
Este documento consolida la información recopilada del **Proyecto Integrador de Stride and Co**, que detalla los desafíos operativos y comerciales de la empresa tras 4 años de crecimiento [1]. A partir de la transcripción de las necesidades de la gerencia, se ha estructurado un **Backlog de Scrum** completo, diseñado para guiar al equipo de desarrollo en la creación de una plataforma web que elimine las ventas manuales por chat y permita la automatización del inventario, la autogestión del cliente y el control administrativo del negocio [1, 2, 3, 4].

---

### 2. TRANSCRIPCIÓN INTEGRAL (Grounded en la Fuente)
A continuación, se detalla la transcripción literal del audio proporcionado, dividida en secciones lógicas para facilitar la trazabilidad con los ítems del backlog:

> **[Sección 1 - Origen y Caos Operativo en Ventas/Chat]**
> *"Buenas tardes a todos. Gracias por tomarse el tiempo. Quiero que entiendan de dónde viene esto. Stride and Co empezó hace 4 años en un local pequeño. Eso funcionó cuando éramos chicos. Ya no funciona. Yo lo vivo todos los días desde operaciones. No tengo manera de saber en tiempo real cuánto stock nos queda de una talla o un modelo sin llamar físicamente a la bodega. Y cuando un pedido se pierde entre 100 chats de WhatsApp, el que paga los platos rotos soy yo, porque el cliente llega furioso preguntando por qué nadie le contestó. Y del lado de ventas es todavía peor. No sabemos sin preguntarle directamente a cada vendedor cuáles pedidos ya están pagados y cuáles siguen esperando confirmación. A veces concretamos un pedido y no queda ningún registro formal más que una simple imagen enviada por chat. Lo que queremos es simple de decir: un sistema donde el cliente vea nuestro catálogo, compre y pueda seguir su pedido sin tener que escribirle a nadie. Y del otro lado, que mi equipo de ventas tenga un panel donde vea qué se vendió, cuánto stock queda y pueda actualizar el estado del pedido."* [1]

> **[Sección 2 - Control de Stock y Seguridad de Accesos]**
> *"Sobre el stock es no negociable que el sistema descuente el inventario automáticamente cuando se confirma un pedido. Hoy nos ha pasado vender lo mismo dos veces porque nadie actualizó a tiempo. Eso no puede volver a pasar. Y sobre las cuentas, necesitamos que haya roles claros. Un cliente no debería poder tocar nada del catálogo, obviamente, pero tampoco quiero que cualquiera de mis vendedores pueda ver o modificar pedidos de otro vendedor. Cada quien ve lo suyo... y alguien arriba, administración ve todo. Ah, y algo fundamental, la tranquilidad de todos. El sistema debe ser sumamente confiable y proteger la información de las compras de principio a fin."* [2]

> **[Sección 3 - Notificaciones en Tiempo Real e Integridad]**
> *"Otra cosa práctica... es que cuando entre un pedido nuevo a mí me llegue una notificación, una notificación al instante, no que tenga que estar refrescando la pantalla cada 5 minutos para enterarme. Y al revés también, que el cliente vea en tiempo real cuando cambia el estado de su pedido. Esa es literalmente la razón por la que hacemos esto. Que nadie tenga que volver a preguntarnos '¿Ya casi me llega?'. Lo que necesitamos sin excepción es que el flujo completo funcione: publicar, comprar, actualizar estado y que el cliente se entere sin preguntar."* [3]

> **[Sección 4 - Confiabilidad y Pruebas Reales]**
> *"...y que no se caiga, con datos de verdad, con pruebas, no solo que se vea bonito en la demo. Eso. Confiamos en ustedes. Gracias por escucharnos. Cualquier duda que les surja construyendo esto, recuerden, este es el problema que están resolviendo. Que en Stride and Co dejemos de vender por chat, empecemos a vender como una empresa de verdad."* [4]

---

### 3. MAPA DE ÉPICAS DEL PROYECTO
Para organizar el backlog, las necesidades expresadas se han agrupado en **5 Épicas principales**:

1. **ÉPICA 1: Catálogo Digital y Compra Auto-gestionada (E-Commerce Clientes):** Permitir al cliente ver productos, tallas y stock disponible para comprar de forma autónoma sin intermediarios por chat [1].
2. **ÉPICA 2: Panel de Gestión Comercial para Vendedores (Panel de Ventas):** Proveer visibilidad y control sobre los pedidos, estados de pago y registros formales de venta [1, 2].
3. **ÉPICA 3: Motor de Inventario y Descuento Automático de Stock (Control de Stock):** Garantizar la actualización del stock en tiempo real y automatizar el descuento de unidades [1, 2].
4. **ÉPICA 4: Seguridad, Roles y Permisos Jerárquicos (Roles y Accesos):** Restringir accesos para clientes, vendedores (vista aislada de pedidos) y administradores (vista global) [2].
5. **ÉPICA 5: Sistema de Notificaciones y Rastreo en Tiempo Real (Notificaciones):** Automatizar alertas inmediatas para el equipo ante pedidos nuevos y notificaciones de estado para el cliente [3].

---

### 4. PRODUCT BACKLOG COMPACTO (Tabla de Priorización Scrum)

| ID | Épica | Historia de Usuario | Prioridad (MoSCoW) | Estimación sugerida (Story Points) | Relación con la Fuente |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-01** | Épica 1 | Catálogo interactivo con tallas y stock visible | **Must Have** | 5 SP | Ver catálogo sin chat [1] |
| **US-02** | Épica 1 | Flujo de compra web auto-gestionado | **Must Have** | 8 SP | Comprar sin escribir a nadie [1] |
| **US-03** | Épica 1 | Módulo de rastreo del pedido para el cliente | **Must Have** | 5 SP | Seguir el pedido sin preguntar [1, 3] |
| **US-04** | Épica 2 | Panel central de pedidos para vendedores | **Must Have** | 8 SP | Panel ventas para ver qué se vendió [1] |
| **US-05** | Épica 2 | Actualización manual del estado del pedido | **Must Have** | 3 SP | Actualizar estado del pedido [1, 3] |
| **US-06** | Épica 3 | Consulta de stock en tiempo real para operaciones | **Must Have** | 5 SP | Saber stock real sin llamar a bodega [1] |
| **US-07** | Épica 3 | Descuento automático de inventario al confirmar | **Must Have** (No Negociable) | 8 SP | Descuento automático de stock [2] |
| **US-08** | Épica 4 | Control de roles y perfiles de acceso seguros | **Must Have** | 5 SP | Roles claros y proteger información [2] |
| **US-09** | Épica 4 | Aislamiento de datos de pedidos por vendedor | **Must Have** | 5 SP | Vendedores no ven pedidos de otros [2] |
| **US-10** | Épica 5 | Alerta instantánea de pedido nuevo para el equipo | **Should Have** | 5 SP | Notificación al instante sin refresh [3] |
| **US-11** | Épica 5 | Notificación en tiempo real de cambio de estado | **Should Have** | 5 SP | Cliente ve cambio de estado real [3] |

---

### 5. DETALLE DE HISTORIAS DE USUARIO Y CRITERIOS DE ACEPTACIÓN (Gherkin)

#### ÉPICA 1: Catálogo Digital y Compra Auto-gestionada

##### **US-01: Catálogo interactivo con tallas y stock visible**
* **Descripción:** 
  * **Como** cliente de Stride and Co,
  * **quiero** visualizar el catálogo de productos con sus tallas y modelos disponibles en tiempo real,
  * **para** poder elegir mis prendas sin tener que consultar disponibilidad por WhatsApp [1].
* **Criterios de Aceptación:**
  * **Escenario 1: Visualización básica del catálogo**
    * **Dado** que soy un cliente que ingresa a la plataforma web de Stride and Co,
    * **cuando** navego por la sección de productos,
    * **entonces** debo ver imágenes, descripción, precio, tallas disponibles y estado del stock de cada artículo de forma clara [1].
  * **Escenario 2: Producto agotado**
    * **Dado** que un modelo específico en una talla determinada tiene un stock de cero (0),
    * **cuando** visualizo dicho producto,
    * **entonces** el sistema debe mostrar la talla como "Agotada" y bloquear la opción de añadirla al carrito [1, 2].
* **Prioridad:** Must Have.
* **Estimación:** 5 Story Points.

##### **US-02: Flujo de compra web auto-gestionado**
* **Descripción:**
  * **Como** cliente de Stride and Co,
  * **quiero** seleccionar productos, añadirlos al carrito y finalizar la compra directamente en la web,
  * **para** formalizar mi pedido de forma autónoma sin interactuar con un vendedor por chat [1].
* **Criterios de Aceptación:**
  * **Escenario 1: Registro formal de un pedido comprado**
    * **Dado** que he agregado productos válidos al carrito y procedo al pago,
    * **cuando** confirmo mis datos de envío y finalizo la compra,
    * **entonces** el sistema debe generar un registro de pedido formal con un ID único de seguimiento y enviar un correo electrónico de confirmación [1].
* **Prioridad:** Must Have.
* **Estimación:** 8 Story Points.

##### **US-03: Módulo de rastreo del pedido para el cliente**
* **Descripción:**
  * **Como** cliente de Stride and Co,
  * **quiero** consultar el estado actual de mi pedido utilizando mi ID único en el portal web,
  * **para** conocer el estado de mi envío en tiempo real y no tener que enviar un chat preguntando "¿Ya casi me llega?" [3].
* **Criterios de Aceptación:**
  * **Escenario 1: Consulta del estado del pedido**
    * **Dado** que tengo un ID de pedido válido,
    * **cuando** ingreso el ID en el módulo de búsqueda pública de pedidos de la web,
    * **entonces** el sistema debe mostrar el estado actual de mi pedido (ej. "Pendiente de pago", "Pagado", "En preparación", "Enviado") sin requerir que inicie sesión o contacte a soporte [3].
* **Prioridad:** Must Have.
* **Estimación:** 5 Story Points.

---

#### ÉPICA 2: Panel de Gestión Comercial para Vendedores

##### **US-04: Panel central de pedidos para vendedores**
* **Descripción:**
  * **Como** vendedor de Stride and Co,
  * **quiero** un panel administrativo web donde pueda ver la lista de pedidos consolidados, sus estados de pago e imágenes de respaldo,
  * **para** gestionar las ventas de manera formal y evitar que los pedidos se pierdan entre chats de WhatsApp [1].
* **Criterios de Aceptación:**
  * **Escenario 1: Control de confirmación de pagos**
    * **Dado** que he iniciado sesión en mi panel de vendedor,
    * **cuando** reviso el listado de pedidos recibidos,
    * **entonces** debo poder identificar visualmente y mediante filtros cuáles pedidos ya están confirmados/pagados y cuáles siguen esperando validación de pago [1].
* **Prioridad:** Must Have.
* **Estimación:** 8 Story Points.

##### **US-05: Actualización manual del estado del pedido**
* **Descripción:**
  * **Como** vendedor de Stride and Co,
  * **quiero** actualizar manualmente el estado de cada pedido (ej. de "Pendiente" a "Confirmado" o "Enviado"),
  * **para** reflejar el avance del flujo logístico en el sistema y que todos los involucrados estén enterados [1, 3].
* **Criterios de Aceptación:**
  * **Escenario 1: Modificación de estado**
    * **Dado** que visualizo el detalle de un pedido en el panel administrativo,
    * **cuando** modifico su estado de "Esperando confirmación" a "Pagado" y guardo los cambios,
    * **entonces** el sistema debe registrar el cambio de estado, registrar el usuario que realizó la acción y actualizar la información de cara al cliente [1, 3].
* **Prioridad:** Must Have.
* **Estimación:** 3 Story Points.

---

#### ÉPICA 3: Motor de Inventario y Descuento Automático de Stock

##### **US-06: Consulta de stock en tiempo real para operaciones**
* **Descripción:**
  * **Como** encargado de operaciones de Stride and Co,
  * **quiero** consultar los niveles de stock de cada modelo y talla en tiempo real desde la plataforma,
  * **para** conocer la disponibilidad de inventario sin necesidad de llamar físicamente a la bodega [1].
* **Criterios de Aceptación:**
  * **Escenario 1: Consulta instantánea**
    * **Dado** que accedo a la sección de Inventarios en el panel,
    * **cuando** busco un modelo o talla en específico,
    * **entonces** el sistema debe mostrar la cantidad exacta disponible en bodega física al instante, reflejando las compras del día [1].
* **Prioridad:** Must Have.
* **Estimación:** 5 Story Points.

##### **US-07: Descuento automático de inventario al confirmar pedido**
* **Descripción:**
  * **Como** encargado de operaciones de Stride and Co,
  * **quiero** que el sistema descuente de forma automática y obligatoria las unidades correspondientes del stock cuando se confirme un pedido,
  * **para** evitar la doble venta del mismo producto por retrasos en las actualizaciones manuales [2].
* **Criterios de Aceptación:**
  * **Escenario 1: Descuento en tiempo real tras confirmación**
    * **Dado** que un pedido contiene 2 unidades de un modelo X talla M con un stock actual de 10 unidades,
    * **cuando** el vendedor o el sistema cambia el estado del pedido a "Confirmado",
    * **entonces** el sistema debe restar automáticamente las 2 unidades, actualizando el stock disponible a 8 unidades al instante [2].
  * **Escenario 2: Bloqueo de doble venta concurrente**
    * **Dado** que solo queda 1 unidad disponible de un modelo X talla S, y dos clientes intentan comprar el mismo producto de forma simultánea,
    * **cuando** la primera compra es procesada con éxito,
    * **entonces** el sistema debe rechazar automáticamente la segunda compra indicando que el producto ya no cuenta con stock disponible, impidiendo ventas duplicadas [2].
* **Prioridad:** Must Have (Requerimiento No Negociable).
* **Estimación:** 8 Story Points.

---

#### ÉPICA 4: Seguridad, Roles y Permisos Jerárquicos

##### **US-08: Control de roles y perfiles de acceso seguros**
* **Descripción:**
  * **Como** administrador de Stride and Co,
  * **quiero** que existan perfiles de usuario claramente diferenciados (Cliente, Vendedor, Administrador),
  * **para** asegurar que los datos del negocio estén protegidos y nadie realice acciones no permitidas en la plataforma [2].
* **Criterios de Aceptación:**
  * **Escenario 1: Restricción de acceso para clientes**
    * **Dado** que he iniciado sesión como Cliente,
    * **cuando** intento forzar la navegación hacia una URL administrativa (ej: `/admin/dashboard` o `/vendedor/pedidos`),
    * **entonces** el sistema debe denegar el acceso (error 403) y redirigirme a la página del catálogo principal [2].
* **Prioridad:** Must Have.
* **Estimación:** 5 Story Points.

##### **US-09: Aislamiento de datos de pedidos por vendedor**
* **Descripción:**
  * **Como** vendedor de Stride and Co,
  * **quiero** ver e interactuar únicamente con los pedidos que me corresponden,
  * **para** evitar interferir con las ventas de otros compañeros de ventas [2].
* **Criterios de Aceptación:**
  * **Escenario 1: Vista restringida de pedidos para vendedor**
    * **Dado** que he iniciado sesión como "Vendedor A",
    * **cuando** abro la sección de pedidos,
    * **entonces** solo debo ver en la lista aquellos pedidos asociados a mi usuario, y cualquier intento de ver o modificar el pedido del "Vendedor B" por URL directa debe ser bloqueado por el sistema [2].
  * **Escenario 2: Vista total para la Administración**
    * **Dado** que he iniciado sesión con el rol de "Administrador / Dirección de operaciones",
    * **cuando** navego a la sección de pedidos,
    * **entonces** debo visualizar la totalidad de los pedidos de todos los vendedores de la empresa de forma centralizada [2].
* **Prioridad:** Must Have.
* **Estimación:** 5 Story Points.

---

#### ÉPICA 5: Sistema de Notificaciones y Rastreo en Tiempo Real

##### **US-10: Alerta instantánea de pedido nuevo para el equipo de ventas**
* **Descripción:**
  * **Como** vendedor de Stride and Co,
  * **quiero** recibir una notificación emergente visual y sonora en tiempo real en mi panel cuando ingrese un nuevo pedido,
  * **para** procesarlo de inmediato sin tener que estar refrescando la pantalla manualmente cada 5 minutos [3].
* **Criterios de Aceptación:**
  * **Escenario 1: Notificación instantánea sin refresh**
    * **Dado** que estoy trabajando activamente en el panel de vendedor con la pestaña abierta,
    * **cuando** un cliente finaliza la compra de un producto que me está asignado,
    * **entonces** el sistema debe mostrar un banner emergente de notificación visual instantánea y reproducir un sonido de alerta, integrando el nuevo pedido al listado de inmediato sin recargar la página [3].
* **Prioridad:** Should Have.
* **Estimación:** 5 Story Points.

##### **US-11: Notificación en tiempo real de cambio de estado para el cliente**
* **Descripción:**
  * **Como** cliente de Stride and Co,
  * **quiero** recibir notificaciones automatizadas al instante en el portal web (o mediante correo electrónico/canal configurado) cuando un vendedor actualice el estado de mi pedido,
  * **para** estar informado del progreso de mi pedido en tiempo real sin tener que preguntar [3].
* **Criterios de Aceptación:**
  * **Escenario 1: Notificación de actualización logística**
    * **Dado** que mi pedido está en estado "Pagado",
    * **cuando** el vendedor cambia el estado a "Enviado" en la plataforma,
    * **entonces** el sistema debe enviar un correo electrónico instantáneo con el nuevo estado del pedido y el número de guía de envío, y reflejar el cambio en tiempo real en la página web de seguimiento del cliente [3].
* **Prioridad:** Should Have.
* **Estimación:** 5 Story Points.

---

### 6. REQUERIMIENTOS NO FUNCIONALES Y CRITERIOS DE CALIDAD (QA)
Para garantizar la estabilidad requerida por la dirección ("que no se caiga con datos de verdad, con pruebas" [4]):

1. **Seguridad e Integridad de la Información (Esencial para la tranquilidad [2]):**
   * Toda transmisión de datos de transacciones debe realizarse bajo protocolos seguros (HTTPS con cifrado SSL/TLS de última generación).
   * Contraseñas de usuarios (clientes, vendedores, admins) almacenadas utilizando algoritmos de hashing seguros (ej. bcrypt).
2. **Robustez y Pruebas con Datos Reales [4]:**
   * El sistema debe someterse a pruebas de estrés y concurrencia simulando al menos el doble de las transacciones pico actuales para garantizar que no se caiga bajo carga real.
   * Se deben utilizar bases de datos de prueba pobladas con datos reales anonimizados para validar la funcionalidad del motor de inventario ante compras concurrentes masivas.
3. **Confiabilidad:**
   * Garantizar una disponibilidad del sistema (Uptime) del 99.9%, asegurando que la pasarela y el catálogo estén disponibles las 24 horas del día.
