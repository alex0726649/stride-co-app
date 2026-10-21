# Product Backlog — Stride & Co.

Proyecto Integrador · Desarrollo de Aplicaciones Web · UACH
Equipo CodeMen · Versión inicial (Sprint 0)

---

## 1. Épicas

| ID | Épica | Objetivo |
|---|---|---|
| E1 | Catálogo y compra autogestionada | Que el cliente compre y dé seguimiento sin escribirle a nadie |
| E2 | Panel de gestión de ventas | Centralizar la trazabilidad de pedidos con visibilidad por rol |
| E3 | Control automatizado de stock | Garantizar la integridad del inventario y eliminar la venta doble |
| E4 | Gestión de roles y seguridad | Jerarquía estricta de permisos y aislamiento de datos |
| E5 | Notificaciones en tiempo real | Eliminar la espera pasiva del staff y del cliente |
| E6 | Gestión de catálogo | Permitir que la operación publique y mantenga los productos |

---

## 2. Historias de Usuario

### E1 — Catálogo y compra autogestionada

#### HU-19. Registro e inicio de sesión de cliente
`Must` · `3 SP` · `E1`

> Como **cliente**, quiero crear una cuenta e iniciar sesión, para dar seguimiento a mis pedidos y recibir avisos.

**Criterios de aceptación**

- **Dado** que soy un visitante nuevo, **cuando** me registro con correo y contraseña, **entonces** el sistema crea mi cuenta con rol Cliente y la contraseña queda almacenada cifrada.

---

#### HU-01. Visualización del catálogo
`Must` · `5 SP` · `E1`

> Como **cliente**, quiero navegar el catálogo con modelos y tallas, para conocer lo disponible sin preguntar por chat.

**Criterios de aceptación**

- **Dado** que accedo a la plataforma, **cuando** abro el catálogo, **entonces** veo los productos publicados con sus tallas y la disponibilidad real tomada de la base de datos.
- **Dado** que una talla tiene stock cero, **cuando** la visualizo, **entonces** aparece marcada como agotada y no puedo seleccionarla.

---

#### HU-02. Carrito de compra
`Must` · `5 SP` · `E1`

> Como **cliente**, quiero agregar productos a un carrito, para comprar varios artículos en una sola operación.

**Criterios de aceptación**

- **Dado** que selecciono un producto y talla, **cuando** lo agrego al carrito, **entonces** se registra con la cantidad elegida y puedo modificarla o eliminarlo.
- **Dado** que solicito más unidades de las disponibles, **cuando** intento agregarlas, **entonces** el sistema me lo impide indicando el máximo.

---

#### HU-03. Confirmación de pedido
`Must` · `5 SP` · `E1`

> Como **cliente**, quiero confirmar mi compra, para que quede un pedido formal y deje de depender de una imagen en el chat.

**Criterios de aceptación**

- **Dado** que tengo productos en el carrito, **cuando** confirmo, **entonces** el sistema genera un pedido con identificador único, fecha, mis datos, el detalle de artículos y el importe total, en estado *Pendiente de pago*.
- **Dado** que el pedido se creó, **cuando** consulto la base de datos, **entonces** existe un registro persistente e íntegro de la venta.

---

#### HU-04. Seguimiento del pedido
`Must` · `5 SP` · `E1`

> Como **cliente**, quiero consultar el estado de mi pedido, para no tener que preguntar si ya casi me llega.

**Criterios de aceptación**

- **Dado** que inicié sesión, **cuando** entro a mis pedidos, **entonces** veo cada uno con su identificador, estado actual y fecha de la última actualización.

---

### E6 — Gestión de catálogo

#### HU-14. Publicación de producto
`Must` · `5 SP` · `E6`

> Como **administrador**, quiero publicar un producto nuevo con sus tallas, precio y stock inicial, para que aparezca en el catálogo.

**Criterios de aceptación**

- **Dado** que tengo rol Administrador, **cuando** registro un producto con al menos una talla y su stock, **entonces** queda publicado y visible para los clientes.
- **Dado** que dejo campos obligatorios vacíos, **cuando** intento guardar, **entonces** el sistema rechaza el alta y señala qué falta.

---

#### HU-15. Edición y despublicación
`Must` · `3 SP` · `E6`

> Como **administrador**, quiero editar o despublicar un producto, para mantener el catálogo actualizado sin perder el histórico de ventas.

**Criterios de aceptación**

- **Dado** que un producto tiene pedidos asociados, **cuando** lo despublico, **entonces** deja de aparecer en el catálogo pero sus pedidos previos conservan la información del artículo.

---

### E3 — Control automatizado de stock

#### HU-08. Consulta de stock en tiempo real
`Must` · `5 SP` · `E3`

> Como **responsable de operaciones**, quiero consultar el stock por modelo y talla, para dejar de llamar físicamente a la bodega.

**Criterios de aceptación**

- **Dado** que inicié sesión con rol de operaciones, **cuando** abro el inventario, **entonces** veo las existencias actuales por modelo y talla, diferenciando unidades disponibles de reservadas.

---

#### HU-09. Reserva y descuento automático de stock
`Must (no negociable)` · `8 SP` · `E3`

> Como **responsable de operaciones**, quiero que el stock se aparte al crear el pedido y se descuente al confirmarse el pago, para que nunca se venda dos veces el mismo artículo.

**Criterios de aceptación**

- **Dado** que un cliente confirma un pedido, **cuando** el sistema lo registra, **entonces** las unidades quedan reservadas y dejan de ofrecerse a otros clientes.
- **Dado** que dos clientes intentan comprar la última unidad simultáneamente, **cuando** ambos confirman, **entonces** solo uno obtiene la reserva y el otro recibe aviso de falta de disponibilidad.
- **Dado** que un vendedor marca el pedido como pagado, **cuando** se guarda el cambio, **entonces** la reserva se convierte en descuento definitivo del inventario.
- **Dado** que una reserva supera el plazo definido sin pago, **cuando** expira, **entonces** las unidades regresan al stock disponible.

---

#### HU-16. Registro de entrada de mercancía
`Must` · `3 SP` · `E3`

> Como **responsable de operaciones**, quiero registrar entradas y ajustes de inventario, para que el stock del sistema refleje lo que hay en bodega.

**Criterios de aceptación**

- **Dado** que llega mercancía nueva, **cuando** registro las unidades por talla, **entonces** el stock disponible aumenta y queda constancia de quién hizo el ajuste y cuándo.

---

#### HU-18. Cancelación con devolución de stock
`Should` · `3 SP` · `E3`

> Como **vendedor**, quiero cancelar un pedido y que las unidades vuelvan al inventario, para que el stock no se degrade con pedidos que no se concretaron.

**Criterios de aceptación**

- **Dado** que un pedido está reservado o pagado, **cuando** lo cancelo, **entonces** las unidades regresan al stock disponible y el pedido queda en estado *Cancelado*.

---

### E4 — Gestión de roles y seguridad

#### HU-10. Autenticación con roles diferenciados
`Must` · `5 SP` · `E4`

> Como **administrador**, quiero que cada usuario acceda según su rol, para proteger la operación del negocio.

**Criterios de aceptación**

- **Dado** que un usuario inicia sesión, **cuando** se valida su identidad, **entonces** accede únicamente a los módulos correspondientes a su rol: Cliente, Vendedor o Administrador.
- **Dado** que soy Cliente, **cuando** intento acceder a la gestión del catálogo, **entonces** el sistema deniega la petición.

---

#### HU-11. Aislamiento de pedidos por vendedor
`Must` · `5 SP` · `E4`

> Como **vendedor**, quiero que solo yo vea y modifique mis pedidos, para que nadie más altere mi trabajo.

**Criterios de aceptación**

- **Dado** que estoy autenticado como Vendedor A, **cuando** consulto mi panel, **entonces** veo exclusivamente los pedidos asignados a mi cuenta.
- **Dado** que soy Vendedor A, **cuando** accedo por URL directa a un pedido del Vendedor B, **entonces** el sistema responde con acceso denegado (403).
- **Dado** que soy Administrador, **cuando** consulto pedidos, **entonces** veo los de todos los vendedores.

---

### E2 — Panel de gestión de ventas

#### HU-17. Asignación automática rotativa de pedidos
`Must` · `3 SP` · `E2`

> Como **administrador**, quiero que los pedidos web se repartan automáticamente entre los vendedores activos, para que cada pedido tenga un responsable claro.

**Criterios de aceptación**

- **Dado** que entra un pedido desde la web, **cuando** el sistema lo registra, **entonces** lo asigna por turno rotativo a un vendedor activo y ese vendedor queda como responsable.

---

#### HU-05. Panel de pedidos del vendedor
`Must` · `8 SP` · `E2`

> Como **vendedor**, quiero un panel con mis pedidos clasificados por estado, para gestionar mi trabajo de forma ordenada.

**Criterios de aceptación**

- **Dado** que inicié sesión como Vendedor, **cuando** abro mi panel, **entonces** veo mis pedidos con identificador, cliente, importe y estado, y puedo filtrarlos entre pagados y pendientes.

---

#### HU-06. Actualización del estado de un pedido
`Must` · `3 SP` · `E2`

> Como **vendedor**, quiero cambiar el estado de mis pedidos, para mantener informados al equipo y al cliente.

**Criterios de aceptación**

- **Dado** que gestiono un pedido, **cuando** cambio su estado, **entonces** el sistema guarda el nuevo estado junto con el usuario responsable y la fecha del cambio, y dispara las notificaciones correspondientes.

---

#### HU-07. Dashboard global de administración
`Should` · `5 SP` · `E2`

> Como **dueña del negocio**, quiero una vista global de ventas y stock, para tomar decisiones sin preguntarle a cada vendedor.

**Criterios de aceptación**

- **Dado** que inicié sesión como Administrador, **cuando** abro el dashboard, **entonces** veo el total de pedidos por estado, las ventas agregadas de todos los vendedores y los productos con inventario crítico.

---

### E5 — Notificaciones en tiempo real

#### HU-12. Alerta de pedido nuevo
`Should` · `5 SP` · `E5`

> Como **responsable de operaciones**, quiero recibir un aviso instantáneo al entrar un pedido, para no estar refrescando la pantalla cada cinco minutos.

**Criterios de aceptación**

- **Dado** que tengo la plataforma abierta, **cuando** un cliente confirma un pedido, **entonces** aparece una alerta visible en menos de cinco segundos sin que yo recargue la página.

---

#### HU-13. Notificación de cambio de estado al cliente
`Should` · `5 SP` · `E5`

> Como **cliente**, quiero enterarme cuando mi pedido cambia de estado, para no tener que preguntar.

**Criterios de aceptación**

- **Dado** que tengo un pedido activo, **cuando** el vendedor cambia su estado, **entonces** recibo la actualización en mi cuenta sin recargar la página.

---

## 3. Priorización inicial

El criterio de orden es habilitar primero lo que sostiene al resto del sistema (autenticación y catálogo), continuar con el flujo de venta y la regla no negociable del control de stock, y dejar al final las funcionalidades que enriquecen la experiencia. Esta secuencia coincide con la organización del semestre, que ubica la lógica de servidor y la persistencia de datos en los Sprints 2 a 4, y la comunicación en tiempo real en los Sprints 5 y 6.

| Orden | ID | Historia | MoSCoW | SP | Sprint |
|---|---|---|---|---|---|
| 1 | HU-10 | Autenticación con roles | Must | 5 | 1 |
| 2 | HU-19 | Registro de cliente | Must | 3 | 1 |
| 3 | HU-14 | Publicar producto | Must | 5 | 1 |
| 4 | HU-01 | Ver catálogo | Must | 5 | 1 |
| 5 | HU-15 | Editar o despublicar producto | Must | 3 | 2 |
| 6 | HU-08 | Consultar stock | Must | 5 | 2 |
| 7 | HU-02 | Carrito de compra | Must | 5 | 2 |
| 8 | HU-03 | Confirmar pedido | Must | 5 | 2 |
| 9 | HU-09 | Reserva y descuento de stock | Must | 8 | 3 |
| 10 | HU-17 | Asignación rotativa | Must | 3 | 3 |
| 11 | HU-05 | Panel del vendedor | Must | 8 | 3 |
| 12 | HU-06 | Actualizar estado de pedido | Must | 3 | 3 |
| 13 | HU-11 | Aislamiento por vendedor | Must | 5 | 4 |
| 14 | HU-04 | Seguimiento del pedido | Must | 5 | 4 |
| 15 | HU-16 | Entrada de mercancía | Must | 3 | 4 |
| 16 | HU-18 | Cancelar y devolver stock | Should | 3 | 4 |
| 17 | HU-12 | Alerta de pedido nuevo | Should | 5 | 5 |
| 18 | HU-13 | Notificación al cliente | Should | 5 | 5 |
| 19 | HU-07 | Dashboard global | Should | 5 | 6 |

**Total: 89 story points** — 13 historias *Must have* y 6 historias *Should have*.

### Fuera de alcance (Won't have)

Consideradas y descartadas conscientemente en esta versión:

- Pasarela de pagos en línea
- Notificaciones por correo electrónico o WhatsApp
- Número de guía de envío
- Gestión de devoluciones

---

## 4. Requerimientos no funcionales

| ID | Atributo | Especificación |
|---|---|---|
| RNF-01 | Integridad de datos | El descuento de inventario debe ejecutarse de forma atómica: dos pedidos simultáneos sobre la última unidad nunca pueden concretarse ambos. |
| RNF-02 | Seguridad | Control de acceso basado en roles con jerarquía Cliente < Vendedor < Administrador, aplicado a nivel de API y no solo de interfaz. |
| RNF-03 | Seguridad | Contraseñas almacenadas mediante hash y comunicación cifrada con HTTPS de extremo a extremo. |
| RNF-04 | Rendimiento | La actualización de stock debe reflejarse en menos de 2 segundos para evitar condiciones de carrera. |
| RNF-05 | Rendimiento | Las notificaciones llegan en menos de 5 segundos sin recarga manual; se implementan con WebSockets y no con sondeo periódico. |
| RNF-06 | Confiabilidad | Las pruebas se realizan con datos representativos del catálogo e historial real, no con datos ficticios de demostración. |
| RNF-07 | Estabilidad | El flujo completo (publicar → comprar → actualizar estado → notificar) debe ejecutarse sin fallos bajo carga concurrente equivalente a la operación actual. |
| RNF-08 | Trazabilidad | Todo cambio de estado de un pedido registra usuario responsable, fecha y estado anterior. |
| RNF-09 | Usabilidad | La plataforma debe ser utilizable desde dispositivo móvil, dado que el canal actual del cliente es el teléfono. |
| RNF-10 | Mantenibilidad | Código versionado en Git con historial de commits descriptivo y separación clara entre capas. |

Los requerimientos RNF-01, RNF-04, RNF-05, RNF-06 y RNF-07 se derivan directamente de la entrevista con el cliente; los restantes corresponden a estándares asumidos por el equipo.

---

## 5. Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R-01 | Condición de carrera en el descuento de stock que permite la venta doble | Alta | Crítico | Reserva atómica al confirmar el pedido y pruebas explícitas de concurrencia sobre HU-09 |
| R-02 | La curva de aprendizaje del stack MEVN retrasa los primeros sprints | Alta | Alto | Sprint 1 dedicado a fundamentos y programación en pareja entre developers |
| R-03 | MongoDB no ofrece transacciones multi-documento de forma natural | Media | Alto | Modelar el stock dentro del documento de producto y usar operaciones atómicas condicionales |
| R-04 | Los WebSockets se subestiman y las notificaciones no llegan a tiempo | Media | Medio | Programarlos en el Sprint 5 con margen y mantener el sondeo periódico como plan alterno |
| R-05 | Crecimiento no controlado del alcance durante el semestre | Media | Alto | Backlog congelado por sprint; los cambios ingresan al backlog y no al sprint en curso |
| R-06 | La carga académica del equipo reduce la capacidad real por sprint | Alta | Medio | Estimación conservadora y monitoreo de la velocidad real por el Scrum Master desde el Sprint 1 |
| R-07 | Ambigüedad en requisitos que el cliente no especificó | Media | Medio | Documentar cada supuesto y validarlo durante la Sprint Review |
| R-08 | No se cuenta con datos reales del catálogo pese a que el cliente los exige | Media | Medio | Construir un conjunto de datos representativo y solicitar el histórico con anticipación |
| R-09 | Dependencia de un solo integrante en un área del sistema | Media | Alto | Rotación de responsabilidades y revisión cruzada de código |

---

## 6. Deuda técnica inicial

El equipo asume de forma deliberada la siguiente deuda técnica al inicio del proyecto, con el compromiso de resolverla en los sprints indicados.

| ID | Deuda técnica | Plan de resolución |
|---|---|---|
| DT-01 | El equipo no domina aún Vue ni Mongoose, por lo que el código inicial será mejorable | Refactorización tras el Sprint 2, una vez estabilizado el aprendizaje |
| DT-02 | El esquema de datos no está definido y se modelará sobre la marcha | Formalizar el modelo al cerrar el Sprint 1 |
| DT-03 | Sin pipeline de integración continua ni despliegue automatizado | Incorporarlo a partir del Sprint 3 |
| DT-04 | Cobertura de pruebas automatizadas nula al inicio | Priorizar pruebas sobre HU-09 y HU-11, por ser las críticas |
| DT-05 | Sin ambiente productivo definido; únicamente desarrollo local | Definir el hosting antes del Sprint 5 |
| DT-06 | Imágenes de producto manejadas por URL externa, sin gestión de archivos | Evaluar almacenamiento propio si el cliente lo requiere |
| DT-07 | Sin sistema de registro de eventos ni monitoreo | Integrar logging al trabajar la trazabilidad (RNF-08) |
| DT-08 | Interfaz sin sistema de diseño; se emplearán componentes base | Unificar estilos en el Sprint 5, junto con la experiencia de cliente |
