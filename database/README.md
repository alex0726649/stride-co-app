# Esquema relacional de catálogo e inventario

La aplicación usa PostgreSQL mediante Sequelize para usuarios, roles, permisos,
productos, variantes e inventario. `bin/www` autentica la conexión, sincroniza
los modelos y asegura las restricciones de catálogo e inventario al iniciar.

## Relaciones y restricciones

- Un producto puede tener muchas variantes (`products` → `product_variants`).
- Cada variante pertenece a un producto y tiene un registro de inventario.
- Al crear una variante, Sequelize crea su inventario inicial con stock y reservado
  en cero.
- `products.category_id` se almacena como texto y no tiene llave foránea.
- El SKU es único; cada variante tiene un único registro de inventario.
- El precio no puede ser negativo y las unidades reservadas no pueden superar el
  stock disponible.
- Las llaves foráneas conectan variantes con productos e inventario con variantes.

## PostgreSQL local

Instala PostgreSQL y crea la base `stride_co`. Configura las credenciales en
`config/local-development.json`, copiando `config/local-development.example.json`
y reemplazando el marcador de contraseña. Ese archivo local no se sube a Git.

También puedes iniciar un servidor local con Docker:

```bash
docker run -d --name stride-postgres \
  -e POSTGRES_PASSWORD=abcd1234 \
  -e POSTGRES_DB=stride_co \
  -p 5432:5432 \
  postgres:16
```

La configuración por defecto usa host `localhost`, puerto `5432` y usuario
`postgres`. Para una conexión remota con SSL, establece `db.postgres.ssl.enabled`
en `true` en tu archivo local de configuración. En Render también se puede usar
la variable `DB_POSTGRES_SSL=true`.

## Comprobar las tablas

Con PostgreSQL disponible y la aplicación iniciada, consulta las tablas desde
`psql` conectado a `stride_co`:

```sql
\dt
\d products
\d product_variants
\d inventory
```

El archivo [`schema.sql`](schema.sql) contiene el esquema SQL equivalente para
catálogo e inventario. La creación automática de las tablas se realiza con
`sequelize.sync()` al iniciar la aplicación.
