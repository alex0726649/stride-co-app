# Despliegue en Render

Tarjeta **S2-13 · Deploy en Render** · Equipo **1**

La API de Stride & Co. corre en **Render** como servicio web Docker, con **Render PostgreSQL** para los datos relacionales y **MongoDB Atlas** para los documentos (customers y órdenes). Ningún secreto está en el repositorio ni en la imagen.

---

## 1. Datos del despliegue

| Dato | Valor |
|---|---|
| URL pública | https://stride-co-app-staging.onrender.com |
| Health check | `GET /health` → `{"status":"UP"}` |
| Servicio web | `stride-co-app-staging` · Docker · plan Free · región Oregon |
| Rama desplegada | `staging` (auto-deploy en cada push) |
| PostgreSQL | Render PostgreSQL · plan Free · región Oregon |
| Base PostgreSQL creada | 11 de noviembre de 2026 |
| Base PostgreSQL vence | 11 de diciembre de 2026 (30 días, plan Free) |
| MongoDB | MongoDB Atlas M0 · AWS Oregon · base `stride_co` |
| Variables de entorno | Solo `NODE_ENV=production` (`PORT` lo define Render) |
| Secretos | Secret file `local-production.json` |

> El plan gratuito duerme el servicio tras 15 minutos sin tráfico. La primera petición después tarda alrededor de 50 segundos; conviene abrir `/health` antes de una revisión o de correr las pruebas.

---

## 2. Arquitectura

```
Cliente ──HTTPS──► Render Web Service (Docker, Node 22)
                     │
                     ├── Render PostgreSQL (host interno, sin SSL)
                     │     usuarios, roles, permisos, productos, variantes, inventario
                     │
                     └── MongoDB Atlas M0 (mongodb+srv, TLS)
                           customers, órdenes
```

---

## 3. Cómo se configuran los secretos

La aplicación lee toda su configuración con el paquete `config`; el código no lee `process.env` directamente.

1. Render monta el secret file en `/etc/secrets/local-production.json`.
2. Al arrancar, el `CMD` del `Dockerfile` crea un enlace simbólico a `config/local-production.json`:
   ```sh
   if [ -f /etc/secrets/local-production.json ]; then
     ln -sf /etc/secrets/local-production.json config/local-production.json
   fi
   exec node ./bin/www
   ```
3. Con `NODE_ENV=production`, `config` carga en orden `default.json` → `production.json` → `local-production.json`.
4. `bin/www` valida que exista `jwt.secret` antes de cargar la aplicación.

El `.dockerignore` excluye `**/local*.json` (salvo las plantillas `*.example.json`), así que ningún archivo de secretos entra en la imagen. La forma del secret file está en `config/local-production.example.json`:

| Clave | Valor en Render |
|---|---|
| `jwt.secret` | Secreto propio de producción (distinto al de desarrollo) |
| `db.postgres.host` | Host **interno** de Render PostgreSQL |
| `db.postgres.port` / `database` / `user` / `password` | Datos de la base de Render |
| `db.postgres.ssl.enabled` | `false` (la red interna de Render no usa SSL) |
| `db.mongo.uri` | URI `mongodb+srv` de Atlas a la base `stride_co` |

---

## 4. Pasos para recrear el despliegue

### 4.1 MongoDB Atlas
1. Cluster M0 en AWS Oregon.
2. **Database Access**: usuario con rol *Read and write to any database*.
3. **Network Access**: `0.0.0.0/0` (Render Free no tiene IP fija).

### 4.2 Render PostgreSQL
1. **New → Postgres**, plan Free, región Oregon.
2. Guardar la *Internal Database URL* (para el servicio) y la *External Database URL* (para sembrar).

### 4.3 Servicio web
1. **New → Web Service**, rama `staging`, runtime **Docker**, plan Free, región Oregon.
2. Environment: `NODE_ENV=production`.
3. Secret Files: `local-production.json` con host interno y `ssl.enabled: false`.
4. Health Check Path: `/health`.

### 4.4 Carga inicial
El seed se ejecuta desde una computadora del equipo contra el host **externo**:

1. Crear temporalmente `config/local-production.json` con el host externo y `"ssl": { "enabled": true, "rejectUnauthorized": false }`. Git lo ignora.
2. Ejecutar el seed en modo producción. Crea las cuentas demo con las contraseñas documentadas en el README, las mismas en todos los entornos:
   ```bash
   NODE_ENV=production npm run seed
   ```
3. Borrar `config/local-production.json`.

El seed es idempotente: no duplica usuarios ni el producto demo si se vuelve a correr.

---

## 5. Verificación

| Prueba | Comando | Resultado |
|---|---|---|
| Health | `curl https://stride-co-app-staging.onrender.com/health` | ✅ `{"status":"UP"}` |
| Login admin | `POST /api/auth/login` con el usuario demo admin | ✅ 200, `Inicio de sesión correcto` y JWT |
| Ruta protegida en español | `GET /api/products` con `Accept-Language: es`, sin token | ✅ 401 `No autorizado` |
| Ruta protegida en inglés | `GET /api/products` con `Accept-Language: en`, sin token | ✅ 401 `Unauthorized` |

> Las pruebas E2E contra Render se validan en la S2-18, una vez integradas las suites de la S2-14 en `staging`.
---

## 6. Consideraciones

- **Vencimiento de la base**: la PostgreSQL gratuita vence el 11 de diciembre de 2026; después Render da 14 días de gracia para pasarla a un plan de pago antes de borrarla. Para recrearla: nueva base, actualizar el secret file y volver a sembrar.
- **Cuentas demo**: se sembraron con las mismas contraseñas demo del repositorio para que las pruebas E2E funcionen contra Render. Son cuentas de demostración sin datos reales.
- **Rotación de secretos**: para cambiar `jwt.secret` o una contraseña de base, se edita el secret file en Render y se redepliega. Al cambiar `jwt.secret`, los tokens emitidos dejan de ser válidos.