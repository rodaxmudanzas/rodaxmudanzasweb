// Pruebas de api/admin.js con Supabase SIMULADO (sin red, sin credenciales).
// Ejecutar: node tests/test-admin.js
const Module = require('module');
const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
let pasadas = 0, falladas = 0;
const ok = (n) => { pasadas++; console.log('  OK   ' + n); };
const ko = (n, e) => { falladas++; console.log('  FAIL ' + n + '\n       ' + e.message.split('\n')[0]); };
async function caso(n, fn) { try { await fn(); ok(n); } catch (e) { ko(n, e); } }

const hoyMadrid = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
function fechaMas(dias) {
  const [a, m, d] = hoyMadrid().split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';
const V1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const V2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function crearEntorno() {
  const db = {
    administradores: [
      { id: 'u-super', email: 'super@rodax.com', nombre: 'Super', rol: 'superadmin', activo: true },
      { id: 'u-ops', email: 'ops@rodax.com', nombre: 'Ops', rol: 'operaciones', activo: true },
      { id: 'u-fin', email: 'fin@rodax.com', nombre: 'Fin', rol: 'finanzas', activo: true },
      { id: 'u-sop', email: 'sop@rodax.com', nombre: 'Sop', rol: 'soporte', activo: true },
      { id: 'u-baja', email: 'baja@rodax.com', nombre: 'Baja', rol: 'superadmin', activo: false }
    ],
    mudanzas: [], transportistas: [
      { id: T1, nombre: 'Trans Uno', estado: 'Activo' },
      { id: T2, nombre: 'Trans Dos', estado: 'Inactivo' }
    ],
    vehiculos: [{ id: V1, transportista_id: T1 }, { id: V2, transportista_id: T2 }],
    notificaciones: [], admin_historial: [], solicitudes_modificacion: [], solicitudes_cancelacion_cliente: []
  };
  let seq = 100;

  function valor(f, col) {
    if (col.includes('->>')) { const [c, k] = col.split('->>'); return f[c] ? f[c][k] : undefined; }
    return f[col];
  }

  function tabla(nombre) {
    const filas = db[nombre];
    const filtros = []; let accion = 'select'; let valores = null; let maybe = false, single = false, head = false, conteo = false;
    const q = {
      select(_c, opts) { if (opts && opts.count) conteo = true; if (opts && opts.head) head = true; return q; },
      insert(v) { accion = 'insert'; valores = v; return q; },
      update(v) { accion = 'update'; valores = v; return q; },
      eq(c, v) { filtros.push((f) => String(valor(f, c)) === String(v)); return q; },
      is(c, v) { filtros.push((f) => (v === null ? valor(f, c) == null : valor(f, c) === v)); return q; },
      not(c, op, v) { if (op === 'is' && v === null) filtros.push((f) => valor(f, c) != null); return q; },
      in(c, lista) { filtros.push((f) => lista.includes(valor(f, c))); return q; },
      gte(c, v) { filtros.push((f) => String(valor(f, c)) >= v); return q; },
      lte(c, v) { filtros.push((f) => String(valor(f, c)) <= v); return q; },
      or() { return q; }, order() { return q; }, limit() { return q; }, range(a, b) { q._r = [a, b]; return q; },
      maybeSingle() { maybe = true; return q; },
      single() { single = true; return q; },
      then(resolve, reject) { return Promise.resolve(ejecutar()).then(resolve, reject); }
    };
    function ejecutar() {
      if (accion === 'insert') {
        const fila = { id: ++seq, ...valores }; filas.push(fila);
        return { data: [fila], error: null };
      }
      let sel = filas.filter((f) => filtros.every((fn) => fn(f)));
      if (accion === 'update') { sel.forEach((f) => Object.assign(f, valores)); return { data: sel.map((f) => ({ ...f })), error: null }; }
      // Supabase devuelve copias, no las filas vivas: el simulador también.
      const copiar = (x) => (x == null ? x : { ...x });
      if (conteo) return { data: head ? null : sel.map(copiar), count: sel.length, error: null };
      if (q._r) sel = sel.slice(q._r[0], q._r[1] + 1);
      if (maybe || single) return { data: copiar(sel[0]) || null, error: null };
      return { data: sel.map(copiar), error: null };
    }
    return q;
  }

  const supabase = {
    auth: {
      async getUser(token) {
        const admin = db.administradores.find((a) => 'tok:' + a.id === token);
        if (admin) return { data: { user: { id: admin.id, email: admin.email } }, error: null };
        if (token === 'tok:otro') return { data: { user: { id: 'u-otro', email: 'otro@x.com' } }, error: null };
        return { data: null, error: { message: 'bad' } };
      }
    },
    from: tabla
  };
  return { db, supabase };
}

function cargarHandler(env) {
  process.env.SUPABASE_URL = 'http://mock'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'x';
  const orig = Module._load;
  Module._load = function (req, ...rest) {
    if (req === '@supabase/supabase-js') return { createClient: () => env.supabase };
    return orig.call(this, req, ...rest);
  };
  const f = path.join(REPO, 'api', 'admin.js');
  delete require.cache[require.resolve(f)];
  const h = require(f);
  Module._load = orig;
  return h;
}

async function llamar(h, usuario, body, metodo = 'POST') {
  let status, bodyRes;
  const res = { status(c) { status = c; return res; }, json(b) { bodyRes = b; return res; }, setHeader() {} };
  const headers = usuario ? { authorization: 'Bearer tok:' + usuario } : {};
  await h({ method: metodo, headers, body }, res);
  return { status, body: bodyRes };
}

function sembrar(env, extra = {}) {
  env.db.mudanzas.push({
    id: 7, numero_reserva: 'RDX-26-000001', nombre: 'Ana', email: 'ana@x.com', telefono: '600000000',
    fecha: fechaMas(10), estado: 'Pendiente de asignación', estado_pago: 'Pagado 30 % - Pendiente 70 %',
    transportista_id: null, vehiculo_id: null, bloqueada: false,
    importe_total: 1000, importe_reserva: 300, importe_restante: 700, fecha_pago_30: '2026-01-01',
    stripe_session_id: 'cs_1', stripe_payment_intent: 'pi_1', origen_ciudad: 'Madrid', destino_ciudad: 'Sevilla',
    ...extra
  });
}

(async () => {
  console.log('\n== api/admin.js: acceso ==');

  await caso('GET → 405', async () => {
    const r = await llamar(cargarHandler(crearEntorno()), 'u-super', {}, 'GET');
    assert.strictEqual(r.status, 405);
  });
  await caso('sin token → 401', async () => {
    const r = await llamar(cargarHandler(crearEntorno()), null, { accion: 'sesion' });
    assert.strictEqual(r.status, 401);
  });
  await caso('token inválido → 401', async () => {
    const r = await llamar(cargarHandler(crearEntorno()), 'basura', { accion: 'sesion' });
    assert.strictEqual(r.status, 401);
  });
  await caso('usuario autenticado que NO es admin (p. ej. cliente/transportista) → 403', async () => {
    const r = await llamar(cargarHandler(crearEntorno()), 'otro', { accion: 'resumen' });
    assert.strictEqual(r.status, 403);
  });
  await caso('administrador dado de baja → 403', async () => {
    const r = await llamar(cargarHandler(crearEntorno()), 'u-baja', { accion: 'sesion' });
    assert.strictEqual(r.status, 403);
  });
  await caso('acción inexistente (incluido "__proto__") → 400', async () => {
    const h = cargarHandler(crearEntorno());
    assert.strictEqual((await llamar(h, 'u-super', { accion: 'borrar_todo' })).status, 400);
    assert.strictEqual((await llamar(h, 'u-super', { accion: '__proto__' })).status, 400);
    assert.strictEqual((await llamar(h, 'u-super', { accion: 'constructor' })).status, 400);
  });
  await caso('sesión devuelve rol y permisos', async () => {
    const r = await llamar(cargarHandler(crearEntorno()), 'u-fin', { accion: 'sesion' });
    assert.strictEqual(r.body.admin.rol, 'finanzas');
    assert.ok(r.body.permisos.includes('leer_finanzas') && !r.body.permisos.includes('asignar'));
  });

  console.log('\n== api/admin.js: permisos por rol (en servidor) ==');

  await caso('finanzas no puede asignar ni editar ni completar (403, sin cambios)', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    for (const accion of ['asignar', 'desasignar', 'completar', 'editar']) {
      const r = await llamar(h, 'u-fin', { accion, mudanza_id: 7, transportista_id: T1, vehiculo_id: V1, motivo: 'prueba', cambios: { nombre: 'X' } });
      assert.strictEqual(r.status, 403, accion);
    }
    assert.strictEqual(env.db.mudanzas[0].estado, 'Pendiente de asignación');
    assert.strictEqual(env.db.admin_historial.length, 0);
  });
  await caso('soporte no ve finanzas ni puede asignar; sí puede resolver solicitudes', async () => {
    const env = crearEntorno(); const h = cargarHandler(env);
    assert.strictEqual((await llamar(h, 'u-sop', { accion: 'finanzas' })).status, 403);
    assert.strictEqual((await llamar(h, 'u-sop', { accion: 'asignar', mudanza_id: 7 })).status, 403);
    assert.strictEqual((await llamar(h, 'u-sop', { accion: 'transportistas' })).status, 403);
  });
  await caso('operaciones no ve finanzas', async () => {
    const r = await llamar(cargarHandler(crearEntorno()), 'u-ops', { accion: 'finanzas' });
    assert.strictEqual(r.status, 403);
  });
  await caso('finanzas ve ids de Stripe en el expediente; operaciones no', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    const f = await llamar(h, 'u-fin', { accion: 'expediente', mudanza_id: 7 });
    const o = await llamar(h, 'u-ops', { accion: 'expediente', mudanza_id: 7 });
    assert.strictEqual(f.body.mudanza.stripe_payment_intent, 'pi_1');
    assert.strictEqual(o.body.mudanza.stripe_payment_intent, undefined);
    assert.strictEqual(o.body.mudanza.stripe_session_id, undefined);
    assert.strictEqual(env.db.mudanzas[0].stripe_payment_intent, 'pi_1');
  });

  console.log('\n== api/admin.js: resumen ==');

  await caso('resumen: conteos, urgentes, vencidas y finanzas solo con permiso', async () => {
    const env = crearEntorno(); sembrar(env, { id: 1, fecha: fechaMas(2) });
    sembrar(env, { id: 2, fecha: fechaMas(-1), numero_reserva: 'B' });
    sembrar(env, { id: 3, fecha: fechaMas(30), numero_reserva: 'C' });
    sembrar(env, { id: 4, estado: 'Cancelada por cliente', numero_reserva: 'D' });
    env.db.solicitudes_modificacion.push({ id: 1, estado: 'pendiente' }, { id: 2, estado: 'aplicada' });
    env.db.solicitudes_cancelacion_cliente.push({ id: 1, estado: 'error' }, { id: 2, estado: 'completada' });
    const h = cargarHandler(env);
    const ops = (await llamar(h, 'u-ops', { accion: 'resumen' })).body;
    assert.strictEqual(ops.total, 4);
    assert.strictEqual(ops.urgentes.length, 1); assert.strictEqual(ops.urgentes[0].id, 1);
    assert.strictEqual(ops.vencidas.length, 1); assert.strictEqual(ops.vencidas[0].id, 2);
    assert.strictEqual(ops.solicitudes_abiertas, 1);
    assert.strictEqual(ops.cancelaciones_con_incidencia, 1);
    assert.strictEqual(ops.finanzas, null);
    const fin = (await llamar(h, 'u-fin', { accion: 'resumen' })).body;
    assert.strictEqual(fin.finanzas.reservas_cobradas_activas, 900);
    assert.strictEqual(fin.finanzas.pendiente_70_activas, 2100);
  });

  console.log('\n== api/admin.js: asignar / desasignar ==');

  await caso('asignar: pasa a «Transportista asignado», bloquea, notifica y audita', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    const r = await llamar(h, 'u-ops', { accion: 'asignar', mudanza_id: 7, transportista_id: T1, vehiculo_id: V1, nota: 'Llamada previa' });
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.notificado, true); assert.strictEqual(r.body.auditado, true);
    const m = env.db.mudanzas[0];
    assert.strictEqual(m.estado, 'Transportista asignado'); assert.strictEqual(m.transportista_id, T1);
    assert.strictEqual(m.vehiculo_id, V1); assert.strictEqual(m.bloqueada, true); assert.ok(m.fecha_asignacion);
    assert.strictEqual(env.db.notificaciones.length, 1); assert.strictEqual(env.db.notificaciones[0].transportista_id, T1);
    const hist = env.db.admin_historial[0];
    assert.strictEqual(hist.accion, 'asignar_transportista'); assert.strictEqual(hist.admin_email, 'ops@rodax.com');
    assert.strictEqual(hist.mudanza_id, 7);
  });
  await caso('asignar dos veces: la segunda da 409 y no duplica notificación ni historial', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    const datos = { accion: 'asignar', mudanza_id: 7, transportista_id: T1, vehiculo_id: V1 };
    await llamar(h, 'u-ops', datos);
    const r2 = await llamar(h, 'u-ops', datos);
    assert.strictEqual(r2.status, 409);
    assert.strictEqual(env.db.notificaciones.length, 1); assert.strictEqual(env.db.admin_historial.length, 1);
  });
  await caso('asignar: transportista inactivo → 409; vehículo de otro transportista → 409; sin cambios', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'asignar', mudanza_id: 7, transportista_id: T2, vehiculo_id: V2 })).status, 409);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'asignar', mudanza_id: 7, transportista_id: T1, vehiculo_id: V2 })).status, 409);
    assert.strictEqual(env.db.mudanzas[0].estado, 'Pendiente de asignación');
    assert.strictEqual(env.db.admin_historial.length, 0);
  });
  await caso('asignar: no admite expedientes sin pago / cancelados / ids o UUID inválidos', async () => {
    const env = crearEntorno(); sembrar(env, { estado: 'Pendiente de pago' }); const h = cargarHandler(env);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'asignar', mudanza_id: 7, transportista_id: T1, vehiculo_id: V1 })).status, 409);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'asignar', mudanza_id: 'x', transportista_id: T1, vehiculo_id: V1 })).status, 400);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'asignar', mudanza_id: 7, transportista_id: "1' or '1'='1", vehiculo_id: V1 })).status, 400);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'asignar', mudanza_id: 999, transportista_id: T1, vehiculo_id: V1 })).status, 404);
  });
  await caso('desasignar: exige motivo, vuelve al marketplace y deja rastro', async () => {
    const env = crearEntorno(); sembrar(env, { estado: 'Transportista asignado', transportista_id: T1, vehiculo_id: V1, bloqueada: true }); const h = cargarHandler(env);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'desasignar', mudanza_id: 7 })).status, 400);
    const r = await llamar(h, 'u-ops', { accion: 'desasignar', mudanza_id: 7, motivo: 'El transportista no puede' });
    assert.strictEqual(r.status, 200);
    const m = env.db.mudanzas[0];
    assert.strictEqual(m.estado, 'Pendiente de asignación'); assert.strictEqual(m.transportista_id, null);
    assert.strictEqual(m.vehiculo_id, null); assert.strictEqual(m.bloqueada, false);
    assert.strictEqual(env.db.admin_historial[0].nota, 'El transportista no puede');
    assert.strictEqual(env.db.admin_historial[0].antes.transportista_id, T1);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'desasignar', mudanza_id: 7, motivo: 'otra vez' })).status, 409);
  });

  console.log('\n== api/admin.js: completar ==');

  await caso('completar: solo con transportista asignado y fecha alcanzada', async () => {
    const env = crearEntorno(); const h = cargarHandler(env);
    sembrar(env, { id: 7, estado: 'Transportista asignado', transportista_id: T1, fecha: fechaMas(3) });
    sembrar(env, { id: 8, estado: 'Transportista asignado', transportista_id: T1, fecha: fechaMas(-1), numero_reserva: 'B' });
    sembrar(env, { id: 9, estado: 'Pendiente de asignación', fecha: fechaMas(-1), numero_reserva: 'C' });
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'completar', mudanza_id: 7 })).status, 409);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'completar', mudanza_id: 9 })).status, 409);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'completar', mudanza_id: 8 })).status, 200);
    assert.strictEqual(env.db.mudanzas.find((m) => m.id === 8).estado, 'Completada');
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'completar', mudanza_id: 8 })).status, 409);
    assert.strictEqual(env.db.admin_historial.length, 1);
  });

  console.log('\n== api/admin.js: editar ==');

  await caso('editar: solo campos permitidos; importes y estado se ignoran; exige motivo', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'editar', mudanza_id: 7, cambios: { nombre: 'Ana B' } })).status, 400);
    const r = await llamar(h, 'u-ops', {
      accion: 'editar', mudanza_id: 7, motivo: 'Corrección de nombre',
      cambios: { nombre: 'Ana B', importe_total: 1, estado: 'Completada', email: 'otro@x.com', transportista_id: T1 }
    });
    assert.strictEqual(r.status, 200);
    const m = env.db.mudanzas[0];
    assert.strictEqual(m.nombre, 'Ana B');
    assert.strictEqual(m.importe_total, 1000); assert.strictEqual(m.estado, 'Pendiente de asignación');
    assert.strictEqual(m.email, 'ana@x.com'); assert.strictEqual(m.transportista_id, null);
    assert.deepStrictEqual(env.db.admin_historial[0].antes, { nombre: 'Ana' });
    assert.deepStrictEqual(env.db.admin_historial[0].despues, { nombre: 'Ana B' });
  });
  await caso('editar: sin cambios reales → 400; teléfono inválido → 400; fecha pasada → 400', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    const base = { accion: 'editar', mudanza_id: 7, motivo: 'prueba' };
    assert.strictEqual((await llamar(h, 'u-ops', { ...base, cambios: { nombre: 'Ana' } })).status, 400);
    assert.strictEqual((await llamar(h, 'u-ops', { ...base, cambios: { telefono: '<script>' } })).status, 400);
    assert.strictEqual((await llamar(h, 'u-ops', { ...base, cambios: { fecha: fechaMas(-3) } })).status, 400);
    assert.strictEqual(env.db.admin_historial.length, 0);
  });
  await caso('editar fecha: recalcula fecha_cobro_70; con transportista asignado se rechaza', async () => {
    const env = crearEntorno(); const h = cargarHandler(env);
    sembrar(env, { fecha_cobro_70: '2026-01-01T07:00:00Z' });
    const nueva = fechaMas(20);
    const r = await llamar(h, 'u-ops', { accion: 'editar', mudanza_id: 7, motivo: 'Solicitud aprobada', cambios: { fecha: nueva } });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(env.db.mudanzas[0].fecha, nueva);
    assert.strictEqual(env.db.mudanzas[0].fecha_cobro_70.getHours(), 7);
    env.db.mudanzas[0].estado = 'Transportista asignado'; env.db.mudanzas[0].transportista_id = T1;
    const r2 = await llamar(h, 'u-ops', { accion: 'editar', mudanza_id: 7, motivo: 'otra', cambios: { fecha: fechaMas(25) } });
    assert.strictEqual(r2.status, 409);
  });
  await caso('editar: expediente completado o cancelado → 409', async () => {
    const env = crearEntorno(); const h = cargarHandler(env);
    sembrar(env, { estado: 'Completada' });
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'editar', mudanza_id: 7, motivo: 'x1x', cambios: { nombre: 'Z' } })).status, 409);
    env.db.mudanzas[0].estado = 'Cancelada por cliente';
    assert.strictEqual((await llamar(h, 'u-ops', { accion: 'editar', mudanza_id: 7, motivo: 'x1x', cambios: { nombre: 'Z' } })).status, 409);
  });

  console.log('\n== api/admin.js: solicitudes de modificación y notas ==');

  await caso('solicitud: pendiente → en_revision → aprobada → aplicada; estados finales no se reabren', async () => {
    const env = crearEntorno(); sembrar(env);
    env.db.solicitudes_modificacion.push({ id: 5, mudanza_id: 7, numero_reserva: 'RDX-26-000001', estado: 'pendiente', cambios: {} });
    const h = cargarHandler(env);
    const paso = (estado, nota) => llamar(h, 'u-sop', { accion: 'resolver_solicitud', solicitud_id: 5, estado, nota });
    assert.strictEqual((await paso('aplicada')).status, 409);
    assert.strictEqual((await paso('en_revision')).status, 200);
    assert.strictEqual((await paso('aprobada', 'ok')).status, 200);
    assert.strictEqual((await paso('aplicada')).status, 200);
    assert.strictEqual((await paso('rechazada', 'tarde')).status, 409);
    const s = env.db.solicitudes_modificacion[0];
    assert.strictEqual(s.estado, 'aplicada'); assert.strictEqual(s.resuelta_por, 'u-sop');
    assert.strictEqual(env.db.admin_historial.length, 3);
    assert.strictEqual(env.db.mudanzas[0].importe_total, 1000);
  });
  await caso('solicitud: rechazar exige motivo; estado inventado → 409', async () => {
    const env = crearEntorno(); sembrar(env);
    env.db.solicitudes_modificacion.push({ id: 6, mudanza_id: 7, numero_reserva: 'R', estado: 'pendiente', cambios: {} });
    const h = cargarHandler(env);
    assert.strictEqual((await llamar(h, 'u-sop', { accion: 'resolver_solicitud', solicitud_id: 6, estado: 'rechazada' })).status, 400);
    assert.strictEqual((await llamar(h, 'u-sop', { accion: 'resolver_solicitud', solicitud_id: 6, estado: 'borrada' })).status, 409);
    assert.strictEqual(env.db.solicitudes_modificacion[0].estado, 'pendiente');
  });
  await caso('nota: queda en el historial del expediente; texto vacío → 400', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    assert.strictEqual((await llamar(h, 'u-fin', { accion: 'nota', mudanza_id: 7, texto: ' ' })).status, 400);
    assert.strictEqual((await llamar(h, 'u-fin', { accion: 'nota', mudanza_id: 7, texto: 'Cliente pide factura' })).status, 200);
    assert.strictEqual(env.db.admin_historial[0].accion, 'nota');
    const det = await llamar(h, 'u-fin', { accion: 'expediente', mudanza_id: 7 });
    assert.strictEqual(det.body.historial.length, 1);
  });
  await caso('ninguna acción borra expedientes', async () => {
    const env = crearEntorno(); sembrar(env); const h = cargarHandler(env);
    for (const accion of ['borrar', 'eliminar', 'delete', 'confirmar_pago']) {
      assert.strictEqual((await llamar(h, 'u-super', { accion, mudanza_id: 7 })).status, 400, accion);
    }
    assert.strictEqual(env.db.mudanzas.length, 1);
  });

  console.log(`\n${pasadas} correctas, ${falladas} fallidas`);
  process.exit(falladas ? 1 : 0);
})();
