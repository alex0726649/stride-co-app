# Esquema relacional de catálogo e inventario

## Aporte de Jenny durante el trabajo en equipo de la Actividad 4

Como parte de la colaboración acordada por el equipo, Jenny agregó los modelos
Sequelize y las relaciones de catálogo e inventario descritas abajo. Este es su
aporte de base de datos al proyecto; complementa el trabajo de la actividad y no
sustituye los requisitos de autenticación con bcrypt y JWT indicados en la guía.

Este aporte agrega los modelos Sequelize de `Product`, `ProductVariant` e `Inventory`.
Al iniciar la aplicación, `bin/www` autentica la conexión MySQL y ejecuta
`sequelize.sync()`, que crea las tablas declaradas por los modelos cuando todavía
no existen. Después se agregan las restricciones que MySQL debe aplicar.

## Relaciones

- Un producto puede tener muchas variantes (`products` → `product_variants`).
- Cada variante pertenece a un producto.
- Cada variante tiene un registro de inventario (`product_variants` → `inventory`).
- Al crear una variante, Sequelize crea su registro de inventario inicial con stock
  y reservado en cero.
- `products.category_id` se almacena como texto, de acuerdo con la indicación del
  profesor; no tiene tabla de categorías ni llave foránea.

## Restricciones

- El SKU de una variante es único.
- Solo puede existir un registro de inventario por variante.
- El precio no puede ser negativo.
- Las unidades reservadas no pueden superar las existencias.
- Las llaves foráneas conectan variantes con productos e inventario con variantes.

Las restricciones `CHECK` requieren MySQL 8.0.16 o posterior para que el servidor
las aplique. Los modelos también validan las reglas correspondientes en Sequelize.

## Comprobar las tablas en MySQL

Con el servidor MySQL disponible y la aplicación iniciada correctamente, se pueden
consultar las tablas desde un cliente MySQL conectado a la base `stride_co`:

```sql
SHOW TABLES;
DESCRIBE products;
DESCRIBE product_variants;
DESCRIBE inventory;
```

La creación automática ocurre al iniciar la aplicación; este archivo solo documenta
el esquema y no sustituye la configuración de conexión de MySQL.
