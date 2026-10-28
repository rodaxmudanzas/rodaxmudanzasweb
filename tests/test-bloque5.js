// Pruebas del Bloque 5 con Stripe y Supabase SIMULADOS (sin red, sin credenciales).
const Module = require('module');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const REPO = process.env.REPO || path.resolve(__dirname, '..');
let pasadas = 0, falladas = 0;
const ok = (n) => { pasadas++; console.log('  OK   ' + n); };
const ko = (n, e) => { falladas++; console.log('  FAIL ' + n + '\n       ' + e.message.split('\n')[0]); };
async function caso(n, fn) { try { await fn(); ok(n); } catch (e) { ko(n, e); } }

const hoyMadrid = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function fechaMas(dias) {
  const [a, m, d] = hoyMadrid().split('-').map(Number);
  const x = new Date(Date.UTC(a, m - 1, d + dias));
  return x.toISOString().slice(0, 10);
}

// ---------- mocks ----------
function likeARegex(patron) {
  let r = '^';
  for (let i = 0; i < patron.length; i++) {
    const c = patron[i];
    if (c === '\\') { i++; r += (patron[i] || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    else if (c === '%') r += '.*';
    else if (c === '_') r += '.';
    else r += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(r + '$', 'i');
}

function crearEntorno({ unique = true } = {}) {
  const db = { mudanzas: [], solicitudes_cancelacion_cliente: [] };
  let seq = 100;
  const stripeState = { refunds: [], creates: 0, claves: new Map(), pi: {}, listPageSize: 100 };

  function tabla(nombre) {
    const filas = db[nombre];
    const filtros = []; let accion = 'select'; let valores = null; let single = false, maybe = false; let pedirSelect = false;
    const q = {
      select() { pedirSelect = true; return q; },
      insert(v) { accion = 'insert'; valores = v; return q; },
      update(v) { accion = 'update'; valores = v; return q; },
      eq(c, v) { filtros.push((f) => String(f[c]) === String(v)); return q; },
      ilike(c, p) { const re = likeARegex(p); filtros.push((f) => re.test(String(f[c] ?? ''))); return q; },
      single() { single = true; return q; },
      maybeSingle() { maybe = true; return q; },
      then(resolve, reject) { return Promise.resolve(ejecutar()).then(resolve, reject); }
    };
    function ejecutar() {
      if (accion === 'insert') {
        if (unique && nombre === 'solicitudes_cancelacion_cliente' && filas.some((f) => f.mudanza_id === valores.mudanza_id)) {
          return { data: null, error: { message: 'duplicate key value violates unique constraint' } };
        }
        const fila = { id: ++seq, ...valores }; filas.push(fila);
        return { data: single ? { id: fila.id } : [fila], error: null };
      }
      const sel = filas.filter((f) => filtros.every((fn) => fn(f)));
      if (accion === 'update') { sel.forEach((f) => Object.assign(f, valores)); return { data: sel, error: null }; }
      if (single || maybe) {
        if (sel.length > 1) return { data: null, error: { message: 'multiple rows' } };
        return { data: sel[0] || null, error: null };
      }
      return { data: sel, error: null };
    }
    return q;
  }
  const supabase = {
    auth: { async getUser(token) { return token.startsWith('tok:') ? { data: { user: { email: token.slice(4) } }, error: null } : { data: null, error: { message: 'bad' } }; } },
    from: tabla
  };
  const stripe = {
    paymentIntents: { async retrieve(id) { return stripeState.pi[id]; } },
    refunds: {
      async create(p, o) {
        const clave = o && o.idempotencyKey;
        if (clave && stripeState.claves.has(clave)) return stripeState.claves.get(clave);
        stripeState.creates++;
        const r = { id: 're_' + stripeState.creates, payment_intent: p.payment_intent, amount: p.amount, metadata: p.metadata, status: stripeState.estadoNuevo || 'succeeded' };
        stripeState.refunds.push(r); if (clave) stripeState.claves.set(clave, r);
        return r;
      },
      async retrieve(id) { const r = stripeState.refunds.find((x) => x.id === id); if (!r) throw new Error('no such refund'); return r; },
      async list({ payment_intent, limit, starting_after }) {
        let todos = stripeState.refunds.filter((r) => r.payment_intent === payment_intent);
        let ini = 0;
        if (starting_after) ini = todos.findIndex((r) => r.id === starting_after) + 1;
        const size = Math.min(limit, stripeState.listPageSize);
        const data = todos.slice(ini, ini + size);
        return { data, has_more: ini + size < todos.length };
      }
    }
  };
  return { db, supabase, stripe, stripeState };
}

function cargarHandler(env) {
  process.env.SUPABASE_URL = 'http://mock'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'x'; process.env.STRIPE_SECRET_KEY = 'x';
  const orig = Module._load;
  Module._load = function (req, ...rest) {
    if (req === '@supabase/supabase-js') return { createClient: () => env.supabase };
    if (req === 'stripe') return function Stripe() { return env.stripe; };
    return orig.call(this, req, ...rest);
  };
  const f = path.join(REPO, 'api', 'cliente-cancelacion.js');
  delete require.cache[require.resolve(f)];
  const h = require(f);
  Module._load = orig;
  return h;
}

async function llamar(h, email, mudanzaId) {
  let status, body;
  const res = { status(c) { status = c; return res; }, json(b) { body = b; return res; }, setHeader() {} };
  await h({ method: 'POST', headers: { authorization: 'Bearer tok:' + email }, body: { mudanza_id: mudanzaId } }, res);
  return { status, body };
}

function sembrar(env, { fecha, email = 'ana@ejemplo.com', reserva = 291.18, estado = 'Pendiente de asignación' }) {
  env.db.mudanzas.push({ id: 7, numero_reserva: 'RDX-26-000001', email, fecha, estado, estado_pago: 'Pagado 30 %', importe_reserva: reserva, stripe_payment_intent: 'pi_1' });
  env.stripeState.pi['pi_1'] = { status: 'succeeded', amount_received: Math.round(reserva * 100), currency: 'eur' };
}

(async () => {
  console.log('\n== SERVIDOR: api/cliente-cancelacion.js ==');

  await caso('>14 días: 0 % penalización, reembolso íntegro, 1 solo reembolso', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) });
    const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.porcentaje_penalizacion, 0);
    assert.strictEqual(r.body.importe_reembolso, 291.18);
    assert.strictEqual(env.stripeState.creates, 1); assert.strictEqual(env.stripeState.refunds[0].amount, 29118);
    assert.strictEqual(env.db.mudanzas[0].estado, 'Cancelada por cliente');
    assert.strictEqual(env.db.solicitudes_cancelacion_cliente[0].estado, 'completada');
  });

  for (const [dias, pct] of [[15, 0], [14, 10], [8, 10], [7, 25], [4, 25], [3, 50], [2, 50], [1, 100], [0, 100]]) {
    await caso(`${dias} días → ${pct} % (penalización solo sobre la reserva 291,18 €)`, async () => {
      const env = crearEntorno(); sembrar(env, { fecha: fechaMas(dias) });
      const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
      assert.strictEqual(r.status, 200); assert.strictEqual(r.body.porcentaje_penalizacion, pct);
      const pen = Math.round(291.18 * pct) / 100;
      assert.strictEqual(r.body.importe_penalizacion, pen);
      assert.strictEqual(r.body.importe_reembolso, Math.round((291.18 - pen) * 100) / 100);
      assert.strictEqual(env.stripeState.creates, pct === 100 ? 0 : 1);
    });
  }

  await caso('fecha pasada: 409 con mensaje claro, sin solicitud ni reembolso', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(-2) });
    const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 409); assert.ok(/ya ha pasado/.test(r.body.error));
    assert.strictEqual(env.stripeState.creates, 0); assert.strictEqual(env.db.solicitudes_cancelacion_cliente.length, 0);
  });

  await caso('segunda petición tras completar: reconcilia sin crear otro reembolso', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) }); const h = cargarHandler(env);
    await llamar(h, 'ana@ejemplo.com', 7);
    const r2 = await llamar(h, 'ana@ejemplo.com', 7);
    assert.strictEqual(r2.status, 200); assert.strictEqual(env.stripeState.creates, 1);
  });

  await caso('peticiones concurrentes (con UNIQUE en BD): un único reembolso', async () => {
    const env = crearEntorno({ unique: true }); sembrar(env, { fecha: fechaMas(20) }); const h = cargarHandler(env);
    const [a, b] = await Promise.all([llamar(h, 'ana@ejemplo.com', 7), llamar(h, 'ana@ejemplo.com', 7)]);
    assert.strictEqual(env.stripeState.creates, 1);
    assert.ok([a.status, b.status].includes(200));
  });

  await caso('peticiones concurrentes (SIN UNIQUE en BD): la clave de idempotencia evita el 2º reembolso', async () => {
    const env = crearEntorno({ unique: false }); sembrar(env, { fecha: fechaMas(20) }); const h = cargarHandler(env);
    await Promise.all([llamar(h, 'ana@ejemplo.com', 7), llamar(h, 'ana@ejemplo.com', 7)]);
    assert.strictEqual(env.stripeState.creates, 1);
  });

  await caso('reembolso pending: no se marca completada y responde 409', async () => {
    const env = crearEntorno(); env.stripeState.estadoNuevo = 'pending'; sembrar(env, { fecha: fechaMas(20) });
    const h = cargarHandler(env);
    const r = await llamar(h, 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 409);
    assert.notStrictEqual(env.db.solicitudes_cancelacion_cliente[0].estado, 'completada');
    assert.notStrictEqual(env.db.mudanzas[0].estado, 'Cancelada por cliente');
    const r2 = await llamar(h, 'ana@ejemplo.com', 7); // reintento: sigue pending, sin 2º reembolso
    assert.strictEqual(r2.status, 409); assert.strictEqual(env.stripeState.creates, 1);
  });

  await caso('Stripe hizo el reembolso pero Supabase falló (procesando, sin id): reconcilia SIN crear otro', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) });
    env.db.solicitudes_cancelacion_cliente.push({ id: 1, mudanza_id: 7, estado: 'procesando', stripe_refund_id: null, importe_reembolso: 291.18, porcentaje_penalizacion: 0 });
    env.stripeState.refunds.push({ id: 're_x', payment_intent: 'pi_1', amount: 29118, status: 'succeeded', metadata: { rodax_mudanza_id: '7' } });
    const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 200); assert.strictEqual(env.stripeState.creates, 0);
    assert.strictEqual(env.db.solicitudes_cancelacion_cliente[0].stripe_refund_id, 're_x');
    assert.strictEqual(env.db.mudanzas[0].estado, 'Cancelada por cliente');
  });

  await caso('reembolso previo en la 2ª página del listado de Stripe (>100): se encuentra', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) });
    env.db.solicitudes_cancelacion_cliente.push({ id: 1, mudanza_id: 7, estado: 'error', stripe_refund_id: null, importe_reembolso: 291.18, porcentaje_penalizacion: 0 });
    env.stripeState.listPageSize = 2;
    for (let i = 0; i < 3; i++) env.stripeState.refunds.push({ id: 're_otro' + i, payment_intent: 'pi_1', amount: 100, status: 'succeeded', metadata: {} });
    env.stripeState.refunds.push({ id: 're_buscado', payment_intent: 'pi_1', amount: 29118, status: 'succeeded', metadata: { rodax_mudanza_id: '7' } });
    const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 200); assert.strictEqual(env.stripeState.creates, 0);
    assert.strictEqual(env.db.solicitudes_cancelacion_cliente[0].stripe_refund_id, 're_buscado');
  });

  await caso('solicitud previa sin reembolso verificable: 409 y NO se crea otro', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) });
    env.db.solicitudes_cancelacion_cliente.push({ id: 1, mudanza_id: 7, estado: 'error', stripe_refund_id: null, importe_reembolso: 291.18, porcentaje_penalizacion: 0 });
    const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 409); assert.strictEqual(env.stripeState.creates, 0);
  });

  await caso('reconciliación con la fecha ya pasada entre intentos: se cierra con los importes guardados', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(-1) });
    env.db.solicitudes_cancelacion_cliente.push({ id: 1, mudanza_id: 7, estado: 'procesando', stripe_refund_id: 're_x', importe_reembolso: 291.18, porcentaje_penalizacion: 0 });
    env.stripeState.refunds.push({ id: 're_x', payment_intent: 'pi_1', amount: 29118, status: 'succeeded', metadata: { rodax_mudanza_id: '7' } });
    const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 200); assert.strictEqual(env.stripeState.creates, 0);
  });

  await caso('reembolso recuperado con importe distinto: 409 (requiere revisión)', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) });
    env.db.solicitudes_cancelacion_cliente.push({ id: 1, mudanza_id: 7, estado: 'procesando', stripe_refund_id: 're_x', importe_reembolso: 291.18, porcentaje_penalizacion: 0 });
    env.stripeState.refunds.push({ id: 're_x', payment_intent: 'pi_1', amount: 1000, status: 'succeeded', metadata: { rodax_mudanza_id: '7' } });
    const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 409);
  });

  await caso('otro cliente no puede cancelar (email distinto) → 404', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) });
    const r = await llamar(cargarHandler(env), 'otra@ejemplo.com', 7);
    assert.strictEqual(r.status, 404); assert.strictEqual(env.stripeState.creates, 0);
  });

  await caso('comodín "_" en el email no permite cancelar la reserva de otro (a_b@ vs aXb@)', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20), email: 'aXb@ejemplo.com' });
    const r = await llamar(cargarHandler(env), 'a_b@ejemplo.com', 7);
    assert.strictEqual(r.status, 404); assert.strictEqual(env.stripeState.creates, 0);
  });

  await caso('el propio titular con "_" en su email SÍ puede cancelar (y sin distinguir mayúsculas)', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20), email: 'Ana_Lopez@Ejemplo.com' });
    const r = await llamar(cargarHandler(env), 'ana_lopez@ejemplo.com', 7);
    assert.strictEqual(r.status, 200);
  });

  await caso('sin token → 401; método GET → 405; id inválido → 400', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) }); const h = cargarHandler(env);
    let s, res = { status(c) { s = c; return res; }, json() { return res; }, setHeader() {} };
    await h({ method: 'POST', headers: {}, body: { mudanza_id: 7 } }, res); assert.strictEqual(s, 401);
    await h({ method: 'GET', headers: {}, body: {} }, res); assert.strictEqual(s, 405);
    const r = await llamar(h, 'ana@ejemplo.com', '7; drop'); assert.strictEqual(r.status, 400);
  });

  await caso('pago de Stripe insuficiente o en otra moneda → 409 sin reembolso', async () => {
    const env = crearEntorno(); sembrar(env, { fecha: fechaMas(20) }); env.stripeState.pi['pi_1'].amount_received = 1000;
    const r = await llamar(cargarHandler(env), 'ana@ejemplo.com', 7);
    assert.strictEqual(r.status, 409); assert.strictEqual(env.stripeState.creates, 0);
  });

  // ---------- CLIENTE ----------
  console.log('\n== CLIENTE: cliente/js/areaCliente.js (días y porcentaje) ==');
  const src = fs.readFileSync(path.join(REPO, 'cliente/js/areaCliente.js'), 'utf8').replace(/\r\n/g, '\n');
  const m = src.match(/function diasHastaServicioMadrid[\s\S]*?\n    }\n/);
  assert.ok(m, 'no se encontró diasHastaServicioMadrid');
  function conAhora(iso, fn) {
    const Real = Date; const t = new Real(iso).getTime();
    global.Date = class extends Real { constructor(...a) { if (a.length === 0) super(t); else super(...a); } static now() { return t; } };
    try { return fn(); } finally { global.Date = Real; }
  }
  const dias = (iso, f) => conAhora(iso, () => new Function(m[0] + '; return diasHastaServicioMadrid(' + JSON.stringify(f) + ');')());
  const pct = (d) => d === null ? null : d <= 1 ? 100 : d <= 3 ? 50 : d <= 7 ? 25 : d <= 14 ? 10 : 0;
  const viejo = (iso, f) => conAhora(iso, () => { const s = new Date(`${f}T00:00:00`); const h = new Date(); h.setHours(0, 0, 0, 0); return Math.ceil((s - h) / 86400000); });

  await caso('mismo día de servicio = 0 días (100 %)', () => assert.strictEqual(dias('2026-10-12T10:00:00Z', '2026-10-12'), 0));
  await caso('14 días exactos = 14 → 10 %', () => assert.strictEqual(pct(dias('2026-10-12T10:00:00Z', '2026-10-26')), 10));
  await caso('fecha inválida / formato erróneo → null', () => { assert.strictEqual(dias('2026-10-12T10:00:00Z', '2026-02-31'), null); assert.strictEqual(dias('2026-10-12T10:00:00Z', '12/10/2026'), null); });
  await caso('cambio de hora (25-oct-2026): 14 días exactos siguen siendo 14 (10 %), como el servidor', () => {
    const d = dias('2026-10-18T10:00:00Z', '2026-11-01'); assert.strictEqual(d, 14); assert.strictEqual(pct(d), 10);
  });
  await caso('al cruzar el cambio de hora, el cálculo ANTERIOR del navegador daba 15 días → 0 % (defecto demostrado)', () => {
    const v = viejo('2026-10-18T10:00:00Z', '2026-11-01');
    console.log('       (zona horaria del proceso: ' + (process.env.TZ || 'sistema') + ', cálculo antiguo = ' + v + ' días)');
    if ((process.env.TZ || '') === 'Europe/Madrid') assert.strictEqual(v, 15);
  });
  await caso('independiente de la zona horaria del navegador', () => {
    const a = dias('2026-10-12T22:30:00Z', '2026-10-13'); // en Madrid ya es 13-oct 00:30 → 0 días
    assert.strictEqual(a, 0);
  });

  console.log(`\nResultado: ${pasadas} OK, ${falladas} fallidas`);
  process.exit(falladas ? 1 : 0);
})();
