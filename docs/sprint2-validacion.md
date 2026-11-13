# Validación de entrega · Sprint 2

Tarjeta **S2-18 · Cierre** · Rama `feat/s2-18-cierre` · Equipo **1**

| Dato | Valor |
|---|---|
| Fecha de validación | 12 de noviembre de 2026 |
| Rama validada | `staging` |
| Commit validado | `e2939b4` (Merge pull request #111) |
| Repositorio | https://github.com/alex0726649/stride-co-app |
| API desplegada | https://stride-co-app-staging.onrender.com |
| Reporte completo | [s2-18-reporte.txt](evidencias/s2-18-reporte.txt) |

La validación se hizo sobre una **clonación limpia** de `staging` en una carpeta aparte (`stride-check`), con el script de revisión que genera el reporte completo.

---

## 1. Resumen de criterios

| Criterio de aceptación | Resultado | Evidencia |
|---|---|---|
| Clonación limpia: `npm install` | ✅ exit code 0 | Reporte §2 |
| Clonación limpia: `npm run lint` | ✅ 0 errores | Reporte §3 |
| Clonación limpia: `npm test` | ✅ 16 suites, 363 pruebas | Reporte §4 |
| Clonación limpia: `npm run test:e2e` contra la API local | ✅ 12 suites, 50 pruebas | [e2e-local](img/s2-18/e2e-local.png) |
| `npm run test:e2e` contra Render (tras despertar `/health`) | ✅ 12 suites, 50 pruebas | Reporte §5–6 |
| Sin secretos en el código ni en `config/` | ✅ | Reporte §7–7b, sección 3 |
| Sin secretos en el historial de git | ✅ | Reporte §8, sección 3 |
| Sin archivos `local-*.json` ni `.env` versionados | ✅ | Reporte §9 |
| Todas las ramas `feat/s2-*` en el remoto | ✅ 18 ramas | Reporte §10, sección 4 |
| GitHub Project al día | ✅ 34 tarjetas en *Done*, 0 pendientes | [project](img/s2-18/project.png) |
| Commits de todos los integrantes | ✅ 4 integrantes | Reporte §11, sección 5 |
| Render PostgreSQL activa en la fecha de revisión | ✅ *Available*, vence el 11/12/2026 | [render-db](img/s2-18/render-db.png) |
| URL del repositorio entregada en Moodle | ⏳ Después del merge de este PR | — |

---

## 2. Pruebas

### Unitarias e integración (`npm test`)
16 suites y 363 pruebas en verde, sin bases de datos (los modelos están simulados en `test/setup.js`).

### E2E (`npm run test:e2e`)
Las 12 suites E2E de las tarjetas S2-14, S2-15 y S2-16 pasan contra la API local y contra Render:

| Suite | Tarjeta | Pruebas |
|---|---|---|
| `health`, `auth`, `rbac`, `i18n` | S2-14 · E2E base | 33 |
| `sql/users`, `sql/roles`, `sql/permissions`, `sql/products`, `sql/variants`, `sql/inventory` | S2-15 · E2E SQL | 11 |
| `customers`, `orders` | S2-16 · E2E Mongo | 6 |
| **Total** | | **50** |

| Entorno | Comando | Resultado |
|---|---|---|
| Local (clon limpio) | `npm run test:e2e` | ✅ 12 suites, 50 pruebas, exit code 0 |
| Render | `E2E_BASE_URL=https://stride-co-app-staging.onrender.com npm run test:e2e` | ✅ 12 suites, 50 pruebas, exit code 0 (92 s) |

Antes de la corrida contra Render se consultó `/health` para despertar el servicio: respondió `{"status":"UP"}` al primer intento.

---

## 3. Revisión de secretos

| Revisión | Comando | Resultado |
|---|---|---|
| Código y `config/` | `git grep -n -i -E "jwt\|mongodb\+srv\|postgres(ql)?://"` | Solo nombres de claves (`jwt.secret`, `jwt.issuer`…), uso de librerías y documentación. Ningún valor real. |
| Valores en `config/*.json` | `grep` de `secret`, `password` y `uri` | Solo marcadores (`REEMPLAZA…`, `USUARIO:CONTRASEÑA@CLUSTER`), `localhost` y el secreto de prueba de `config/test.json` |
| Historial completo | `git log --all -p` buscando URIs con usuario y contraseña | Solo aparece la plantilla `mongodb+srv://USUARIO:CONTRASEÑA@CLUSTER…` de `config/local-production.example.json` |
| Archivos locales | `git ls-files` | Ningún `local-*.json` (salvo plantillas `.example.json`) ni `.env` versionado |

Notas:
- `config/test.json` contiene `jwt.secret: "test-secret-not-for-production"` y una contraseña `test`: son valores ficticios a propósito para que `npm test` corra sin archivos locales (criterio de la S2-01).
- Los secretos reales viven fuera del repositorio: en `config/local-development.json` (ignorado por git) y en el secret file `local-production.json` de Render.
- Desde la limpieza del PR #106, el código no lee más variables de entorno que `NODE_ENV` y `PORT`, y ya no existe `.env.example`.

---

## 4. Ramas `feat/s2-*` en el remoto

Las 18 ramas de las tarjetas siguen en `origin`:

| | | |
|---|---|---|
| `feat/s2-01-config` | `feat/s2-07-permissions` | `feat/s2-13-render-deploy` |
| `feat/s2-02-postgres` | `feat/s2-08-products` | `feat/s2-14-e2e-base` |
| `feat/s2-03-i18n` | `feat/s2-09-variants` | `feat/s2-15-e2e-sql` |
| `feat/s2-04-seed` | `feat/s2-10-inventory` | `feat/s2-16-e2e-mongo` |
| `feat/s2-05-users` | `feat/s2-11-customers` | `feat/s2-17-readme` |
| `feat/s2-06-roles` | `feat/s2-12-orders` | `feat/s2-18-cierre` |

La S2-00 consistió en crear la rama `staging`, por lo que no tiene rama `feat/`.

---

## 5. Commits por integrante en `staging`

| Integrante | Commits | Identidades de git |
|---|---|---|
| José Alejandro Pérez Millán | 59 | `alex0726649` |
| Osvaldo Hernández | 46 | `Osvaldo Hernandez`, `OsvaExe` |
| Armando Velázquez Barroso | 42 | `Armando Velazquez Barroso`, `armando-velazquez` |
| Jenny Quintana | 30 | `Jenny Quintana`, `sopita13`, `a374366-commits` |

Varios integrantes aparecen con más de una identidad porque hicieron commits desde equipos o cuentas distintas; el conteo agrupa cada persona.

---

## 6. Despliegue en Render

| Dato | Valor |
|---|---|
| Servicio web | `stride-co-app-staging` · Docker · Free · Oregon · rama `staging` |
| Health | `GET /health` → `{"status":"UP"}` |
| PostgreSQL | `stride-co-db` · PostgreSQL 18 · Free · estado *Available* |
| Vencimiento de la base | **11 de diciembre de 2026** |
| MongoDB | Atlas M0 · base `stride_co` |

![Render PostgreSQL disponible](img/s2-18/render-db.png)

> El plan gratuito duerme el servicio tras 15 minutos sin tráfico; la primera petición después tarda alrededor de 50 segundos. Antes de la revisión conviene abrir `/health`.

---

## 7. GitHub Project

Tablero **BackLog Desarrollo**: 34 tarjetas en *Done* y ninguna en *Ready*, *In progress* ni *In review*.

![GitHub Project al día](img/s2-18/project.png)

---

## 8. Evidencias

| Archivo | Contenido |
|---|---|
| [evidencias/s2-18-reporte.txt](evidencias/s2-18-reporte.txt) | Salida completa del script de validación (S1–S12) |
| [img/s2-18/e2e-local.png](img/s2-18/e2e-local.png) | E2E contra la API local desde el clon limpio |
| [img/s2-18/project.png](img/s2-18/project.png) | GitHub Project con todas las tarjetas en *Done* |
| [img/s2-18/render-db.png](img/s2-18/render-db.png) | Render PostgreSQL disponible y fecha de vencimiento |