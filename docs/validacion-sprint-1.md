# Validación de entrega — Sprint 1

**Fecha de verificación:** 20 de septiembre de 2026  
**Base revisada:** `860d947` (rama `main`)  
**Entorno:** Node.js `v24.19.0` y npm `11.17.0`

## Instalación limpia

En una copia actualizada del repositorio se ejecutó:

```powershell
npm ci
```

Resultado: la instalación terminó correctamente usando `package-lock.json`, sin depender de instalaciones globales.

## Calidad y pruebas

```powershell
npm run lint
npm test
```

Resultados:

- ESLint terminó sin errores.
- Jest terminó con **10 suites aprobadas** y **311 pruebas aprobadas**.
- El script `test` ejecuta Jest con `--runInBand`, de modo que las pruebas se procesan en serie y no exceden el tiempo disponible en equipos con recursos limitados.

## Arranque de la aplicación

Se verificaron los dos scripts en puertos temporales mediante PowerShell:

```powershell
$env:PORT='3001'; npm start
$env:PORT='3002'; npm run dev
```

Ambos iniciaron correctamente y `GET /api/products` respondió HTTP 200. El modo de desarrollo se ejecutó con Supervisor.

## Comprobaciones funcionales

Se verificaron los ocho recursos mock y las respuestas de éxito y error:

- `/api/users`
- `/api/roles`
- `/api/permissions`
- `/api/products`
- `/api/variants`
- `/api/inventory`
- `/api/customers`
- `/api/orders`

Las pruebas cubren operaciones aplicables, consultas por identificador, validaciones, recursos inexistentes y la respuesta 404 de una ruta de API no registrada.

## Preparación de entrega

- `README.md` contiene instalación, scripts, arquitectura y matriz de endpoints.
- `docs/api.md` documenta el contrato de la API.
- `.gitignore` excluye `node_modules` y archivos de entorno (`.env`).
- No se incluyen secretos ni dependencias instaladas en el repositorio.
- La versión integrada se encuentra publicada en GitHub y el equipo mantiene su GitHub Project.

La entrega se realiza proporcionando únicamente la URL del repositorio solicitada en el PDF.
