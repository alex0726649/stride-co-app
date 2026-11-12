#!/usr/bin/env node
/*
 * Script auxiliar de evidencia para la S2-14 (no es código de prueba).
 *
 * Para cada prueba E2E aplica una ruptura a propósito, corre solo esa prueba,
 * guarda la salida de Jest y restaura el archivo original. Al final escribe
 * un resumen en docs/evidencias/e2e-rupturas/RESUMEN.md.
 *
 * Requisitos: API corriendo (npm start) y test/e2e/ sin cambios sin commitear.
 * Uso:        node scripts/e2e-rupturas.js
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'evidencias', 'e2e-rupturas');
const JEST = path.join(ROOT, 'node_modules', 'jest', 'bin', 'jest.js');

const AUTH = 'test/e2e/auth.e2e.test.js';
const RBAC = 'test/e2e/rbac.e2e.test.js';
const I18N = 'test/e2e/i18n.e2e.test.js';
const HEALTH = 'test/e2e/health.e2e.test.js';

// anchor: texto que ubica la prueba (normalmente su it(...)).
// find:   texto a cambiar; se busca la primera aparición después del anchor
//         y antes de la siguiente prueba.
// test:   nombre de la prueba para el filtro -t de Jest (null = toda la suite).
const RUPTURAS = [
  // ── HEALTH ────────────────────────────────────────────────────────────────
  { id: 'T01', file: HEALTH, test: 'GET /health responde 200 con estado UP sin requerir token',
    anchor: "it('GET /health", find: "{ status: 'UP' }", replace: "{ status: 'DOWN' }" },

  // ── AUTH ──────────────────────────────────────────────────────────────────
  { id: 'T02', file: AUTH, test: 'rol "admin" regresa 200, mensaje traducido y JWT de tres partes',
    anchor: 'it(`rol', find: 'expect(parts).toHaveLength(3);', replace: 'expect(parts).toHaveLength(2);' },
  { id: 'T03', file: AUTH, test: 'rol "sales" regresa 200, mensaje traducido y JWT de tres partes',
    anchor: 'it(`rol', find: 'expect(parts).toHaveLength(3);', replace: 'expect(parts).toHaveLength(2);' },
  { id: 'T04', file: AUTH, test: 'rol "user" regresa 200, mensaje traducido y JWT de tres partes',
    anchor: 'it(`rol', find: 'expect(parts).toHaveLength(3);', replace: 'expect(parts).toHaveLength(2);' },
  { id: 'T05', file: AUTH, test: 'contraseña incorrecta regresa 401 con mensaje auth.invalidCredentials',
    anchor: "it('contraseña incorrecta", find: 'expect(res.status).toBe(401);', replace: 'expect(res.status).toBe(200);' },
  { id: 'T06', file: AUTH, test: 'email inexistente regresa 401 con exactamente el mismo cuerpo que contraseña incorrecta',
    anchor: "it('email inexistente", find: 'expect(nonExistentEmailRes.status).toBe(401);', replace: 'expect(nonExistentEmailRes.status).toBe(200);' },
  { id: 'T07', file: AUTH, test: 'regresa 400 cuando falta la contraseña',
    anchor: "it('regresa 400 cuando falta la contraseña", find: '.send({ email: DEMO_CREDENTIALS.admin.email })', replace: '.send(DEMO_CREDENTIALS.admin)' },
  { id: 'T08', file: AUTH, test: 'regresa 400 cuando falta el email',
    anchor: "it('regresa 400 cuando falta el email", find: '.send({ password: DEMO_CREDENTIALS.admin.password })', replace: '.send(DEMO_CREDENTIALS.admin)' },
  { id: 'T09', file: AUTH, test: 'regresa 400 con cuerpo vacío o campos en blanco',
    anchor: "it('regresa 400 con cuerpo vacío", find: ".send({ email: '   ', password: '   ' })", replace: '.send(DEMO_CREDENTIALS.admin)' },
  { id: 'T10', file: AUTH, test: 'GET /api/products sin encabezado Authorization regresa 401',
    anchor: "it('GET /api/products sin encabezado", find: 'expect(res.status).toBe(401);', replace: 'expect(res.status).toBe(200);' },
  { id: 'T11', file: AUTH, test: 'GET /api/products con token alterado regresa 401',
    anchor: "it('GET /api/products con token alterado", find: '`Bearer ${alteredToken}`', replace: '`Bearer ${validToken}`' },
  { id: 'T12', file: AUTH, test: 'GET /api/auth/me sin token regresa 401',
    anchor: "it('GET /api/auth/me sin token", find: 'expect(res.status).toBe(401);', replace: 'expect(res.status).toBe(200);' },
  { id: 'T13', file: AUTH, test: 'la respuesta de login no contiene password_hash ni salt_key en ningún nivel',
    anchor: "it('la respuesta de login no contiene", find: 'findForbiddenKeys(res.body)', replace: "findForbiddenKeys(res.body, ['password_hash', 'salt_key', 'token'])" },
  { id: 'T14', file: AUTH, test: 'GET /api/auth/me no contiene password_hash ni salt_key en ningún nivel',
    anchor: "it('GET /api/auth/me no contiene", find: 'findForbiddenKeys(res.body)', replace: "findForbiddenKeys(res.body, ['password_hash', 'salt_key', 'email'])" },
  { id: 'T15', file: AUTH, test: 'GET /api/users no contiene password_hash ni salt_key en ningún nivel',
    anchor: "it('GET /api/users no contiene", find: 'findForbiddenKeys(res.body)', replace: "findForbiddenKeys(res.body, ['password_hash', 'salt_key', 'email'])" },

  // ── RBAC ──────────────────────────────────────────────────────────────────
  { id: 'T16', file: RBAC, test: 'el admin crea un producto y lo elimina exitosamente con código 200',
    anchor: "it('el admin crea un producto", find: 'expect(deleteRes.status).toBe(200);', replace: 'expect(deleteRes.status).toBe(403);' },
  { id: 'T17', file: RBAC, test: 'el admin envía un cuerpo inválido (sin name) y recibe 400 con data: null',
    anchor: "it('el admin envía un cuerpo inválido", find: "description: 'Producto sin campo name',", replace: "name: 'Con nombre', description: 'Producto sin campo name'," },
  { id: 'T18', file: RBAC, test: 'sales intenta eliminar un producto creado por admin y recibe 403',
    anchor: "it('sales intenta eliminar", find: '`Bearer ${salesToken}`', replace: '`Bearer ${adminToken}`' },
  { id: 'T19', file: RBAC, test: 'el usuario user crea/usa su customer y su orden propia y la lee con éxito',
    anchor: "it('el usuario user crea/usa", find: 'expect(readOrderRes.status).toBe(200);', replace: 'expect(readOrderRes.status).toBe(403);' },
  { id: 'T20', file: RBAC, test: 'user intenta leer la orden de otro customer y recibe 403',
    anchor: "it('user intenta leer la orden de otro", find: '`Bearer ${userToken}`', replace: '`Bearer ${adminToken}`' },
  { id: 'T21', file: RBAC, test: 'user intenta consultar la lista general de órdenes y recibe 403',
    anchor: "it('user intenta consultar la lista general", find: '`Bearer ${userToken}`', replace: '`Bearer ${adminToken}`' },

  // ── I18N ──────────────────────────────────────────────────────────────────
  { id: 'T22', file: I18N, test: 'responde en el idioma por defecto (es) sin Accept-Language ni ?lang según config/i18n.js',
    anchor: "it('responde en el idioma por defecto", find: "expect(res.headers['content-language']).toBe('es');", replace: "expect(res.headers['content-language']).toBe('en');" },
  { id: 'T23', file: I18N, test: 'responde en español con header Accept-Language: es',
    anchor: "it('responde en español con header", find: ".set('Accept-Language', 'es')", replace: ".set('Accept-Language', 'en')" },
  { id: 'T24', file: I18N, test: 'responde en inglés con header Accept-Language: en',
    anchor: "it('responde en inglés con header", find: ".set('Accept-Language', 'en')", replace: ".set('Accept-Language', 'es')" },
  { id: 'T25', file: I18N, test: 'responde en español con query param ?lang=es',
    anchor: "it('responde en español con query param", find: "'/api/products?lang=es'", replace: "'/api/products?lang=en'" },
  { id: 'T26', file: I18N, test: 'responde en inglés con query param ?lang=en',
    anchor: "it('responde en inglés con query param", find: "'/api/products?lang=en'", replace: "'/api/products?lang=es'" },
  { id: 'T27', file: I18N, test: 'el query param ?lang tiene prioridad sobre el header Accept-Language',
    anchor: "it('el query param ?lang tiene prioridad", find: "'/api/products?lang=en'", replace: "'/api/products'" },
  { id: 'T28', file: I18N, test: 'responde con auth.invalidCredentials en español mediante Accept-Language',
    anchor: "it('responde con auth.invalidCredentials en español mediante Accept-Language", find: ".set('Accept-Language', 'es')", replace: ".set('Accept-Language', 'en')" },
  { id: 'T29', file: I18N, test: 'responde con auth.invalidCredentials en inglés mediante Accept-Language',
    anchor: "it('responde con auth.invalidCredentials en inglés mediante Accept-Language", find: ".set('Accept-Language', 'en')", replace: ".set('Accept-Language', 'es')" },
  { id: 'T30', file: I18N, test: 'responde con auth.invalidCredentials en español mediante ?lang=es',
    anchor: "it('responde con auth.invalidCredentials en español mediante ?lang=es", find: "'/api/auth/login?lang=es'", replace: "'/api/auth/login?lang=en'" },
  { id: 'T31', file: I18N, test: 'responde con auth.invalidCredentials en inglés mediante ?lang=en',
    anchor: "it('responde con auth.invalidCredentials en inglés mediante ?lang=en", find: "'/api/auth/login?lang=en'", replace: "'/api/auth/login?lang=es'" },
  { id: 'T32', file: I18N, test: 'responde con auth.requiredCredentials en español con Accept-Language: es',
    anchor: "it('responde con auth.requiredCredentials en español", find: ".set('Accept-Language', 'es')", replace: ".set('Accept-Language', 'en')" },
  { id: 'T33', file: I18N, test: 'responde con auth.requiredCredentials en inglés con Accept-Language: en',
    anchor: "it('responde con auth.requiredCredentials en inglés", find: ".set('Accept-Language', 'en')", replace: ".set('Accept-Language', 'es')" },

  // ── LIMPIEZA (observación del PR #101) ────────────────────────────────────
  { id: 'C1', file: RBAC, test: null, cleanup: true,
    anchor: 'afterAll(async', find: 'ids: [...createdOrderIds].reverse()', replace: "ids: ['no-es-un-id', ...createdOrderIds].reverse()" },
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function applyRuptura(src, r) {
  const start = src.indexOf(r.anchor);
  if (start === -1) throw new Error(`No se encontró el anchor: ${r.anchor}`);

  const nextIt = /\n\s*it\(/g;
  nextIt.lastIndex = start + r.anchor.length;
  const next = nextIt.exec(src);
  const end = next ? next.index : src.length;

  const pos = src.indexOf(r.find, start);
  if (pos === -1 || pos > end) throw new Error(`No se encontró "${r.find}" dentro de la prueba`);

  return src.slice(0, pos) + r.replace + src.slice(pos + r.find.length);
}

function runJest(r) {
  const args = ['--experimental-vm-modules', JEST, '--runInBand', '--config', 'jest.e2e.config.js', r.file];
  if (r.test) args.push('-t', escapeRegex(r.test));
  const res = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  return { code: res.status, output: `${res.stdout || ''}${res.stderr || ''}` };
}

function evaluate(r, { code, output }) {
  if (r.cleanup) return code !== 0 && output.includes('no-es-un-id');
  return code !== 0 && /Tests:\s+1 failed/.test(output);
}

function main() {
  const dirty = spawnSync('git', ['diff', '--quiet', '--', 'test/e2e'], { cwd: ROOT });
  if (dirty.status !== 0) {
    console.error('test/e2e/ tiene cambios sin commitear. Haz commit o git restore antes de correr el script.');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const originals = new Map();
  const restoreAll = () => originals.forEach((src, file) => fs.writeFileSync(path.join(ROOT, file), src));
  process.on('SIGINT', () => { restoreAll(); process.exit(130); });

  const results = [];
  for (const r of RUPTURAS) {
    const filePath = path.join(ROOT, r.file);
    const original = fs.readFileSync(filePath, 'utf8');
    originals.set(r.file, original);
    process.stdout.write(`${r.id.padEnd(4)} ${r.test || 'limpieza en afterAll'} ... `);

    let run;
    try {
      fs.writeFileSync(filePath, applyRuptura(original, r));
      run = runJest(r);
    } catch (err) {
      run = { code: null, output: `ERROR DEL SCRIPT: ${err.message}` };
    } finally {
      fs.writeFileSync(filePath, original);
    }

    const ok = evaluate(r, run);
    console.log(ok ? 'FALLÓ como se esperaba' : 'NO FALLÓ (revisar)');

    const command = `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand --config jest.e2e.config.js ${r.file}${r.test ? ` -t "${escapeRegex(r.test)}"` : ''}`;
    const log = [
      `Ruptura:   ${r.id}`,
      `Fecha:     ${new Date().toISOString()}`,
      `Archivo:   ${r.file}`,
      `Prueba:    ${r.test || '(suite completa: limpieza en afterAll)'}`,
      `Cambio:    ${r.find}`,
      `       →   ${r.replace}`,
      `Comando:   ${command}`,
      `Exit code: ${run.code}`,
      `Resultado: ${ok ? 'FALLÓ como se esperaba' : 'NO FALLÓ'}`,
      '',
      '──────── Salida de Jest ────────',
      run.output,
    ].join('\n');
    fs.writeFileSync(path.join(OUT_DIR, `${r.id}.txt`), log);
    results.push({ ...r, ok, code: run.code });
  }

  const rows = results.map((r) => {
    const suite = path.basename(r.file).replace('.e2e.test.js', '');
    const change = `\`${r.find.replace(/\|/g, '\\|')}\` → \`${r.replace.replace(/\|/g, '\\|')}\``;
    return `| ${r.id} | ${suite} | ${r.test || 'Limpieza en afterAll'} | ${change} | ${r.code} | ${r.ok ? '✅ Falló' : '❌ No falló'} | [${r.id}.txt](${r.id}.txt) |`;
  });
  const failed = results.filter((r) => !r.ok).length;
  const summary = [
    '# Rupturas a propósito de las pruebas E2E',
    '',
    `Generado: ${new Date().toISOString()} · Rupturas: ${results.length} · Fallaron como se esperaba: ${results.length - failed}`,
    '',
    'Cada ruptura modifica una sola prueba, corre solo esa prueba con `-t` y restaura el archivo. El criterio es que Jest termine con código distinto de 0 y `Tests: 1 failed`; en C1, que la suite falle por la limpieza del id inválido.',
    '',
    '| ID | Suite | Prueba | Cambio | Exit | Resultado | Log |',
    '|---|---|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'RESUMEN.md'), summary);

  console.log(`\n${results.length - failed}/${results.length} rupturas fallaron como se esperaba.`);
  console.log(`Logs y resumen en ${path.relative(ROOT, OUT_DIR)}/`);
  process.exit(failed ? 1 : 0);
}

main();