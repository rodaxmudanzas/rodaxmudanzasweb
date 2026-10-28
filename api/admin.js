// API única del Área Administración.
// POST /api/admin  { accion: "...", ...datos }
//
// - Autentica con el token de Supabase Auth y exige fila activa en "administradores".
// - Comprueba el permiso de CADA acción según el rol (ocultar botones no protege).
// - Las escrituras sobre mudanzas son condicionales al estado actual, de modo
//   que un reintento o un doble clic no duplican efectos.
// - Cada cambio queda en admin_historial.
// - No toca Stripe, importes ni cancelaciones: eso sigue en sus flujos actuales.

const { createClient } = require("@supabase/supabase-js");
const { ErrorAdmin, autenticarAdmin } = require("./_admin/auth");
const {
    ESTADOS,
    permisosDe,
    tienePermiso,
    transicionSolicitudValida,
    TRANSICIONES_SOLICITUD
} = require("./_admin/permisos");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

//////////////////////////////////////////////////////
// UTILIDADES
//////////////////////////////////////////////////////

const ESTADOS_NO_ACTIVOS = [
    ESTADOS.PENDIENTE_PAGO,
    ESTADOS.COMPLETADA,
    ESTADOS.CANCELADA_CLIENTE
];

function hoyMadrid() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Madrid"
    }).format(new Date());
}

function sumarDias(fechaISO, dias) {
    const f = new Date(`${fechaISO}T12:00:00Z`);
    f.setUTCDate(f.getUTCDate() + dias);
    return f.toISOString().slice(0, 10);
}

function idPositivo(valor, nombre) {
    const n = Number(valor);
    if (!Number.isInteger(n) || n <= 0) {
        throw new ErrorAdmin(400, `${nombre} no es válido.`);
    }
    return n;
}

function textoObligatorio(valor, nombre, min = 3, max = 500) {
    const t = String(valor ?? "").trim();
    if (t.length < min) {
        throw new ErrorAdmin(400, `${nombre} es obligatorio (mínimo ${min} caracteres).`);
    }
    return t.slice(0, max);
}

function importe(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

function redondear(n) {
    return Math.round(n * 100) / 100;
}

// Evita que el texto de búsqueda altere la sintaxis de .or() de PostgREST.
function patronBusqueda(texto) {
    return String(texto ?? "")
        .replace(/[%_,()*\\]/g, " ")
        .trim()
        .slice(0, 60);
}

// PostgREST devuelve como máximo 1000 filas por petición.
async function traerTodo(construir) {
    const TAM = 1000;
    const filas = [];

    for (let desde = 0; ; desde += TAM) {
        const { data, error } = await construir().range(desde, desde + TAM - 1);
        if (error) throw error;
        filas.push(...data);
        if (data.length < TAM) break;
    }

    return filas;
}

async function obtenerMudanza(id) {
    const { data, error } = await supabase
        .from("mudanzas")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new ErrorAdmin(404, "No se ha encontrado el expediente.");

    return data;
}

// Registra la acción en el historial. Si el registro falla después de haber
// cambiado la mudanza, no se revierte: se avisa en la respuesta y se loguea.
async function registrar(admin, datos) {
    const { error } = await supabase.from("admin_historial").insert({
        admin_id: admin.id,
        admin_email: admin.email,
        accion: datos.accion,
        entidad: datos.entidad || "mudanza",
        entidad_id: datos.entidad_id != null ? String(datos.entidad_id) : null,
        mudanza_id: datos.mudanza_id ?? null,
        numero_reserva: datos.numero_reserva ?? null,
        antes: datos.antes ?? null,
        despues: datos.despues ?? null,
        nota: datos.nota ?? null
    });

    if (error) {
        console.error("Admin: no se pudo registrar el historial:", error.message, datos.accion);
        return false;
    }

    return true;
}

async function notificarTransportista(mudanza, transportistaId, tipo, titulo, mensaje, claveEvento) {
    try {
        const { data: existente } = await supabase
            .from("notificaciones")
            .select("id")
            .eq("transportista_id", transportistaId)
            .eq("metadata->>evento_clave", claveEvento)
            .limit(1);

        if (existente && existente.length > 0) return true;

        const { error } = await supabase.from("notificaciones").insert({
            transportista_id: transportistaId,
            tipo,
            titulo,
            mensaje,
            mudanza_id: mudanza.id,
            numero_reserva: mudanza.numero_reserva,
            metadata: {
                evento_clave: claveEvento,
                fecha_servicio: mudanza.fecha,
                origen_ciudad: mudanza.origen_ciudad,
                destino_ciudad: mudanza.destino_ciudad
            },
            leida: false
        });

        if (error) throw error;
        return true;

    } catch (error) {
        console.error("Admin: no se pudo notificar al transportista:", error.message);
        return false;
    }
}

//////////////////////////////////////////////////////
// LECTURA
//////////////////////////////////////////////////////

async function accionSesion(admin) {
    return {
        admin: { email: admin.email, nombre: admin.nombre, rol: admin.rol },
        permisos: permisosDe(admin.rol)
    };
}

async function accionResumen(admin) {

    const filas = await traerTodo(() => supabase
        .from("mudanzas")
        .select("id, numero_reserva, estado, fecha, origen_ciudad, destino_ciudad, transportista_id, importe_reserva, importe_restante")
        .order("id"));

    const hoy = hoyMadrid();
    const limiteUrgente = sumarDias(hoy, 3);

    const porEstado = {};
    const urgentes = [];
    const vencidas = [];
    let cobrado30 = 0;
    let pendiente70 = 0;

    for (const m of filas) {

        porEstado[m.estado] = (porEstado[m.estado] || 0) + 1;

        if (m.estado === ESTADOS.PENDIENTE_ASIGNACION) {
            if (m.fecha < hoy) vencidas.push(m);
            else if (m.fecha <= limiteUrgente) urgentes.push(m);
        }

        if (!ESTADOS_NO_ACTIVOS.includes(m.estado)) {
            cobrado30 += importe(m.importe_reserva);
            pendiente70 += importe(m.importe_restante);
        }
    }

    const compacta = m => ({
        id: m.id,
        numero_reserva: m.numero_reserva,
        fecha: m.fecha,
        origen_ciudad: m.origen_ciudad,
        destino_ciudad: m.destino_ciudad
    });

    const [modificaciones, cancelaciones] = await Promise.all([
        supabase
            .from("solicitudes_modificacion")
            .select("id", { count: "exact", head: true })
            .in("estado", ["pendiente", "en_revision"]),
        supabase
            .from("solicitudes_cancelacion_cliente")
            .select("id", { count: "exact", head: true })
            .in("estado", ["error", "procesando"])
    ]);

    if (modificaciones.error) throw modificaciones.error;
    if (cancelaciones.error) throw cancelaciones.error;

    return {
        total: filas.length,
        por_estado: porEstado,
        urgentes: urgentes.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 20).map(compacta),
        vencidas: vencidas.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 20).map(compacta),
        solicitudes_abiertas: modificaciones.count || 0,
        cancelaciones_con_incidencia: cancelaciones.count || 0,
        finanzas: tienePermiso(admin.rol, "leer_finanzas")
            ? {
                reservas_cobradas_activas: redondear(cobrado30),
                pendiente_70_activas: redondear(pendiente70)
            }
            : null
    };
}

async function accionExpedientes(admin, datos) {

    let consulta = supabase
        .from("mudanzas")
        .select("id, numero_reserva, nombre, email, telefono, origen_ciudad, destino_ciudad, fecha, franja_horaria_recogida, estado, estado_pago, tipo_servicio, transportista_id, preciototal, importe_total")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false })
        .limit(200);

    if (datos.estado) consulta = consulta.eq("estado", String(datos.estado));
    if (datos.sin_transportista === true) consulta = consulta.is("transportista_id", null);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datos.desde || "")) consulta = consulta.gte("fecha", datos.desde);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datos.hasta || "")) consulta = consulta.lte("fecha", datos.hasta);

    const q = patronBusqueda(datos.q);
    if (q) {
        consulta = consulta.or(
            `numero_reserva.ilike.%${q}%,nombre.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`
        );
    }

    const { data, error } = await consulta;
    if (error) throw error;

    const ids = [...new Set(data.map(m => m.transportista_id).filter(Boolean))];
    const nombres = new Map();

    if (ids.length) {
        const { data: trans, error: errorTrans } = await supabase
            .from("transportistas")
            .select("id, nombre, nombre_comercial")
            .in("id", ids);

        if (errorTrans) throw errorTrans;
        trans.forEach(t => nombres.set(t.id, t.nombre_comercial || t.nombre));
    }

    return {
        expedientes: data.map(m => ({
            ...m,
            transportista_nombre: m.transportista_id ? nombres.get(m.transportista_id) || null : null
        })),
        limitado: data.length === 200
    };
}

async function accionExpediente(admin, datos) {

    const id = idPositivo(datos.mudanza_id, "El expediente");
    const mudanza = await obtenerMudanza(id);

    // Los identificadores de Stripe solo los ve quien puede consultar finanzas.
    if (!tienePermiso(admin.rol, "leer_finanzas")) {
        delete mudanza.stripe_session_id;
        delete mudanza.stripe_payment_intent;
    }

    const [transportista, vehiculo, modificaciones, cancelaciones, historial] = await Promise.all([

        mudanza.transportista_id
            ? supabase.from("transportistas")
                .select("id, nombre, nombre_comercial, telefono, email, ciudad")
                .eq("id", mudanza.transportista_id).maybeSingle()
            : { data: null },

        mudanza.vehiculo_id
            ? supabase.from("vehiculos")
                .select("id, matricula, marca, modelo, tipo_vehiculo")
                .eq("id", mudanza.vehiculo_id).maybeSingle()
            : { data: null },

        supabase.from("solicitudes_modificacion")
            .select("*").eq("mudanza_id", id).order("created_at", { ascending: false }),

        supabase.from("solicitudes_cancelacion_cliente")
            .select("*").eq("mudanza_id", id).order("updated_at", { ascending: false }),

        supabase.from("admin_historial")
            .select("*").eq("mudanza_id", id).order("created_at", { ascending: false }).limit(100)
    ]);

    for (const r of [transportista, vehiculo, modificaciones, cancelaciones, historial]) {
        if (r.error) throw r.error;
    }

    const verFinanzas = tienePermiso(admin.rol, "leer_finanzas");

    return {
        mudanza,
        transportista: transportista.data,
        vehiculo: vehiculo.data,
        solicitudes_modificacion: modificaciones.data,
        cancelaciones: verFinanzas ? cancelaciones.data : cancelaciones.data.map(c => ({
            id: c.id,
            estado: c.estado,
            updated_at: c.updated_at
        })),
        historial: historial.data
    };
}

async function accionTransportistas() {

    const [trans, asignadas] = await Promise.all([
        supabase
            .from("transportistas")
            .select("id, nombre, nombre_comercial, email, telefono, ciudad, estado, created_at")
            .order("nombre"),
        supabase
            .from("mudanzas")
            .select("transportista_id")
            .eq("estado", ESTADOS.ASIGNADO)
            .not("transportista_id", "is", null)
    ]);

    if (trans.error) throw trans.error;
    if (asignadas.error) throw asignadas.error;

    const conteo = {};
    asignadas.data.forEach(m => {
        conteo[m.transportista_id] = (conteo[m.transportista_id] || 0) + 1;
    });

    return {
        transportistas: trans.data.map(t => ({
            ...t,
            servicios_asignados: conteo[t.id] || 0
        }))
    };
}

async function accionVehiculosTransportista(admin, datos) {

    const transportistaId = String(datos.transportista_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(transportistaId)) {
        throw new ErrorAdmin(400, "El transportista no es válido.");
    }

    const { data, error } = await supabase
        .from("vehiculos")
        .select("id, matricula, marca, modelo, tipo_vehiculo, estado")
        .eq("transportista_id", transportistaId)
        .order("marca");

    if (error) throw error;

    return { vehiculos: data };
}

async function accionSolicitudes() {

    const [modificaciones, cancelaciones] = await Promise.all([
        supabase.from("solicitudes_modificacion")
            .select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("solicitudes_cancelacion_cliente")
            .select("*").order("updated_at", { ascending: false }).limit(200)
    ]);

    if (modificaciones.error) throw modificaciones.error;
    if (cancelaciones.error) throw cancelaciones.error;

    return {
        modificaciones: modificaciones.data,
        cancelaciones: cancelaciones.data,
        transiciones: TRANSICIONES_SOLICITUD
    };
}

async function accionFinanzas() {

    const filas = await traerTodo(() => supabase
        .from("mudanzas")
        .select("id, numero_reserva, nombre, fecha, estado, estado_pago, importe_total, importe_reserva, importe_restante, fecha_pago_30, fecha_cobro_70")
        .not("fecha_pago_30", "is", null)
        .order("id"));

    const cancelaciones = await supabase
        .from("solicitudes_cancelacion_cliente")
        .select("id, mudanza_id, numero_reserva, importe_reserva, porcentaje_penalizacion, importe_penalizacion, importe_reembolso, estado, motivo_error, updated_at")
        .order("updated_at", { ascending: false })
        .limit(200);

    if (cancelaciones.error) throw cancelaciones.error;

    const activas = filas.filter(m => !ESTADOS_NO_ACTIVOS.includes(m.estado));
    const completadas = filas.filter(m => m.estado === ESTADOS.COMPLETADA);

    const totalCancelaciones = cancelaciones.data
        .filter(c => c.estado === "completada")
        .reduce((acc, c) => ({
            penalizacion: acc.penalizacion + importe(c.importe_penalizacion),
            reembolsado: acc.reembolsado + importe(c.importe_reembolso)
        }), { penalizacion: 0, reembolsado: 0 });

    return {
        totales: {
            reservas_cobradas_activas: redondear(activas.reduce((s, m) => s + importe(m.importe_reserva), 0)),
            pendiente_70_activas: redondear(activas.reduce((s, m) => s + importe(m.importe_restante), 0)),
            facturado_completadas: redondear(completadas.reduce((s, m) => s + importe(m.importe_total), 0)),
            penalizaciones_cobradas: redondear(totalCancelaciones.penalizacion),
            reembolsos_realizados: redondear(totalCancelaciones.reembolsado)
        },
        mudanzas: filas.filter(m => m.estado !== ESTADOS.CANCELADA_CLIENTE).slice(-300).reverse(),
        cancelaciones: cancelaciones.data
    };
}

async function accionAuditoria(admin, datos) {

    let consulta = supabase
        .from("admin_historial")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

    if (datos.mudanza_id) consulta = consulta.eq("mudanza_id", idPositivo(datos.mudanza_id, "El expediente"));

    const { data, error } = await consulta;
    if (error) throw error;

    return { historial: data };
}

//////////////////////////////////////////////////////
// ESCRITURA
//////////////////////////////////////////////////////

async function accionAsignar(admin, datos) {

    const id = idPositivo(datos.mudanza_id, "El expediente");
    const transportistaId = String(datos.transportista_id || "");
    const vehiculoId = String(datos.vehiculo_id || "");

    if (!/^[0-9a-f-]{36}$/i.test(transportistaId) || !/^[0-9a-f-]{36}$/i.test(vehiculoId)) {
        throw new ErrorAdmin(400, "Debes elegir transportista y vehículo.");
    }

    const nota = String(datos.nota ?? "").trim().slice(0, 500) || null;
    const mudanza = await obtenerMudanza(id);

    if (mudanza.estado !== ESTADOS.PENDIENTE_ASIGNACION || mudanza.transportista_id) {
        throw new ErrorAdmin(409, `El expediente está en «${mudanza.estado}» y no admite una nueva asignación.`);
    }

    const [{ data: transportista, error: errorT }, { data: vehiculo, error: errorV }] = await Promise.all([
        supabase.from("transportistas").select("id, estado").eq("id", transportistaId).maybeSingle(),
        supabase.from("vehiculos").select("id, transportista_id").eq("id", vehiculoId).maybeSingle()
    ]);

    if (errorT) throw errorT;
    if (errorV) throw errorV;

    if (!transportista || transportista.estado !== "Activo") {
        throw new ErrorAdmin(409, "El transportista no existe o no está activo.");
    }

    if (!vehiculo || vehiculo.transportista_id !== transportistaId) {
        throw new ErrorAdmin(409, "El vehículo no pertenece a ese transportista.");
    }

    const fechaAsignacion = new Date().toISOString();

    // Mismas condiciones que el marketplace: si otro actor se adelantó, no actualiza nada.
    const { data: actualizadas, error } = await supabase
        .from("mudanzas")
        .update({
            estado: ESTADOS.ASIGNADO,
            transportista_id: transportistaId,
            vehiculo_id: vehiculoId,
            bloqueada: true,
            fecha_asignacion: fechaAsignacion
        })
        .eq("id", id)
        .eq("estado", ESTADOS.PENDIENTE_ASIGNACION)
        .is("transportista_id", null)
        .select();

    if (error) throw error;

    if (!actualizadas || actualizadas.length === 0) {
        throw new ErrorAdmin(409, "El expediente ha cambiado mientras lo asignabas. Recárgalo.");
    }

    const notificado = await notificarTransportista(
        mudanza,
        transportistaId,
        "asignacion_administracion",
        "Servicio asignado por Administración",
        `Se te ha asignado la reserva ${mudanza.numero_reserva}. Revísala en tu agenda.`,
        `asignacion_admin:${id}:${transportistaId}:${fechaAsignacion}`
    );

    const auditado = await registrar(admin, {
        accion: "asignar_transportista",
        mudanza_id: id,
        numero_reserva: mudanza.numero_reserva,
        antes: { estado: mudanza.estado, transportista_id: null, vehiculo_id: null },
        despues: { estado: ESTADOS.ASIGNADO, transportista_id: transportistaId, vehiculo_id: vehiculoId, notificado },
        nota
    });

    return { ok: true, notificado, auditado };
}

async function accionDesasignar(admin, datos) {

    const id = idPositivo(datos.mudanza_id, "El expediente");
    const motivo = textoObligatorio(datos.motivo, "El motivo");
    const mudanza = await obtenerMudanza(id);

    if (mudanza.estado !== ESTADOS.ASIGNADO || !mudanza.transportista_id) {
        throw new ErrorAdmin(409, `El expediente está en «${mudanza.estado}» y no tiene una asignación que retirar.`);
    }

    const { data: actualizadas, error } = await supabase
        .from("mudanzas")
        .update({
            estado: ESTADOS.PENDIENTE_ASIGNACION,
            transportista_id: null,
            vehiculo_id: null,
            bloqueada: false,
            fecha_asignacion: null
        })
        .eq("id", id)
        .eq("estado", ESTADOS.ASIGNADO)
        .eq("transportista_id", mudanza.transportista_id)
        .select();

    if (error) throw error;

    if (!actualizadas || actualizadas.length === 0) {
        throw new ErrorAdmin(409, "El expediente ha cambiado mientras lo modificabas. Recárgalo.");
    }

    const notificado = await notificarTransportista(
        mudanza,
        mudanza.transportista_id,
        "asignacion_retirada",
        "Asignación retirada",
        `Administración ha retirado tu asignación de la reserva ${mudanza.numero_reserva}.`,
        `asignacion_retirada:${id}:${mudanza.transportista_id}:${mudanza.fecha_asignacion || "s"}`
    );

    const auditado = await registrar(admin, {
        accion: "desasignar_transportista",
        mudanza_id: id,
        numero_reserva: mudanza.numero_reserva,
        antes: { estado: mudanza.estado, transportista_id: mudanza.transportista_id, vehiculo_id: mudanza.vehiculo_id },
        despues: { estado: ESTADOS.PENDIENTE_ASIGNACION, transportista_id: null, vehiculo_id: null, notificado },
        nota: motivo
    });

    return { ok: true, notificado, auditado };
}

async function accionCompletar(admin, datos) {

    const id = idPositivo(datos.mudanza_id, "El expediente");
    const nota = String(datos.nota ?? "").trim().slice(0, 500) || null;
    const mudanza = await obtenerMudanza(id);

    if (mudanza.estado !== ESTADOS.ASIGNADO) {
        throw new ErrorAdmin(409, "Solo se puede completar un servicio con transportista asignado.");
    }

    if (String(mudanza.fecha) > hoyMadrid()) {
        throw new ErrorAdmin(409, "El servicio todavía no ha llegado a su fecha.");
    }

    const { data: actualizadas, error } = await supabase
        .from("mudanzas")
        .update({ estado: ESTADOS.COMPLETADA })
        .eq("id", id)
        .eq("estado", ESTADOS.ASIGNADO)
        .select("id");

    if (error) throw error;

    if (!actualizadas || actualizadas.length === 0) {
        throw new ErrorAdmin(409, "El expediente ha cambiado mientras lo modificabas. Recárgalo.");
    }

    const auditado = await registrar(admin, {
        accion: "completar_servicio",
        mudanza_id: id,
        numero_reserva: mudanza.numero_reserva,
        antes: { estado: mudanza.estado },
        despues: { estado: ESTADOS.COMPLETADA },
        nota
    });

    return { ok: true, auditado };
}

// Campos que Administración puede corregir. Importes, ruta, km, volumen y
// datos de Stripe quedan fuera: se rigen por el presupuesto y el pago.
const CAMPOS_EDITABLES = {
    nombre: v => textoObligatorio(v, "El nombre", 2, 120),
    telefono: v => {
        const t = String(v ?? "").trim();
        if (!/^[0-9+()\s-]{6,20}$/.test(t)) throw new ErrorAdmin(400, "El teléfono no es válido.");
        return t;
    },
    observaciones: v => String(v ?? "").trim().slice(0, 2000),
    franja_horaria_recogida: v => textoObligatorio(v, "La franja horaria", 1, 100),
    fecha: v => {
        const t = String(v ?? "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(t))) {
            throw new ErrorAdmin(400, "La fecha no es válida.");
        }
        if (t < hoyMadrid()) throw new ErrorAdmin(400, "La nueva fecha no puede ser anterior a hoy.");
        return t;
    }
};

async function accionEditar(admin, datos) {

    const id = idPositivo(datos.mudanza_id, "El expediente");
    const motivo = textoObligatorio(datos.motivo, "El motivo");
    const cambios = datos.cambios && typeof datos.cambios === "object" ? datos.cambios : {};
    const mudanza = await obtenerMudanza(id);

    if ([ESTADOS.COMPLETADA, ESTADOS.CANCELADA_CLIENTE].includes(mudanza.estado)) {
        throw new ErrorAdmin(409, `Un expediente «${mudanza.estado}» no se puede editar.`);
    }

    const payload = {};
    const antes = {};

    for (const [campo, validar] of Object.entries(CAMPOS_EDITABLES)) {

        if (!(campo in cambios)) continue;

        const nuevo = validar(cambios[campo]);
        const actual = mudanza[campo] == null ? "" : String(mudanza[campo]);

        if (nuevo !== actual) {
            payload[campo] = nuevo;
            antes[campo] = mudanza[campo] ?? null;
        }
    }

    if (Object.keys(payload).length === 0) {
        throw new ErrorAdmin(400, "No hay cambios que guardar.");
    }

    if ("fecha" in payload) {

        if (mudanza.transportista_id) {
            throw new ErrorAdmin(409, "Para cambiar la fecha primero hay que retirar la asignación del transportista.");
        }

        // Mismo cálculo que el webhook: cobro del 70 % a las 07:00 del día del servicio.
        if (mudanza.fecha_cobro_70) {
            const cobro = new Date(payload.fecha);
            cobro.setHours(7, 0, 0, 0);
            payload.fecha_cobro_70 = cobro;
            antes.fecha_cobro_70 = mudanza.fecha_cobro_70;
        }
    }

    const { data: actualizadas, error } = await supabase
        .from("mudanzas")
        .update(payload)
        .eq("id", id)
        .eq("estado", mudanza.estado)
        .select("id");

    if (error) throw error;

    if (!actualizadas || actualizadas.length === 0) {
        throw new ErrorAdmin(409, "El expediente ha cambiado mientras lo editabas. Recárgalo.");
    }

    const auditado = await registrar(admin, {
        accion: "editar_expediente",
        mudanza_id: id,
        numero_reserva: mudanza.numero_reserva,
        antes,
        despues: payload,
        nota: motivo
    });

    return { ok: true, auditado };
}

async function accionNota(admin, datos) {

    const id = idPositivo(datos.mudanza_id, "El expediente");
    const texto = textoObligatorio(datos.texto, "La nota", 2, 1000);
    const mudanza = await obtenerMudanza(id);

    const auditado = await registrar(admin, {
        accion: "nota",
        mudanza_id: id,
        numero_reserva: mudanza.numero_reserva,
        nota: texto
    });

    if (!auditado) throw new ErrorAdmin(500, "No se pudo guardar la nota.");

    return { ok: true };
}

async function accionResolverSolicitud(admin, datos) {

    const id = idPositivo(datos.solicitud_id, "La solicitud");
    const nuevoEstado = String(datos.estado || "");
    const nota = String(datos.nota ?? "").trim().slice(0, 500) || null;

    const { data: solicitud, error: errorLectura } = await supabase
        .from("solicitudes_modificacion")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (errorLectura) throw errorLectura;
    if (!solicitud) throw new ErrorAdmin(404, "No se ha encontrado la solicitud.");

    if (!transicionSolicitudValida(solicitud.estado, nuevoEstado)) {
        throw new ErrorAdmin(409, `No se puede pasar de «${solicitud.estado}» a «${nuevoEstado}».`);
    }

    if (nuevoEstado === "rechazada" && !nota) {
        throw new ErrorAdmin(400, "Indica el motivo del rechazo.");
    }

    const ahora = new Date().toISOString();

    const { data: actualizadas, error } = await supabase
        .from("solicitudes_modificacion")
        .update({
            estado: nuevoEstado,
            nota_admin: nota,
            resuelta_por: admin.id,
            resuelta_at: ahora,
            updated_at: ahora
        })
        .eq("id", id)
        .eq("estado", solicitud.estado)
        .select("id");

    if (error) throw error;

    if (!actualizadas || actualizadas.length === 0) {
        throw new ErrorAdmin(409, "La solicitud ya ha cambiado de estado. Recárgala.");
    }

    const auditado = await registrar(admin, {
        accion: "resolver_solicitud_modificacion",
        entidad: "solicitud_modificacion",
        entidad_id: id,
        mudanza_id: solicitud.mudanza_id,
        numero_reserva: solicitud.numero_reserva,
        antes: { estado: solicitud.estado },
        despues: { estado: nuevoEstado },
        nota
    });

    return { ok: true, auditado };
}

//////////////////////////////////////////////////////
// DESPACHO
//////////////////////////////////////////////////////

const ACCIONES = {
    sesion: { permiso: null, ejecutar: accionSesion },
    resumen: { permiso: "leer_expedientes", ejecutar: accionResumen },
    expedientes: { permiso: "leer_expedientes", ejecutar: accionExpedientes },
    expediente: { permiso: "leer_expedientes", ejecutar: accionExpediente },
    transportistas: { permiso: "leer_transportistas", ejecutar: accionTransportistas },
    vehiculos_transportista: { permiso: "asignar", ejecutar: accionVehiculosTransportista },
    solicitudes: { permiso: "leer_solicitudes", ejecutar: accionSolicitudes },
    finanzas: { permiso: "leer_finanzas", ejecutar: accionFinanzas },
    auditoria: { permiso: "leer_auditoria", ejecutar: accionAuditoria },
    asignar: { permiso: "asignar", ejecutar: accionAsignar },
    desasignar: { permiso: "asignar", ejecutar: accionDesasignar },
    completar: { permiso: "completar", ejecutar: accionCompletar },
    editar: { permiso: "editar_expediente", ejecutar: accionEditar },
    nota: { permiso: "nota", ejecutar: accionNota },
    resolver_solicitud: { permiso: "resolver_solicitud", ejecutar: accionResolverSolicitud }
};

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido." });
    }

    res.setHeader("Cache-Control", "no-store");

    try {

        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Admin: faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
            return res.status(500).json({ error: "Configuración incompleta del servidor." });
        }

        const admin = await autenticarAdmin(req, supabase);

        const datos = req.body && typeof req.body === "object" ? req.body : {};
        const definicion = Object.prototype.hasOwnProperty.call(ACCIONES, datos.accion)
            ? ACCIONES[datos.accion]
            : null;

        if (!definicion) {
            return res.status(400).json({ error: "Acción desconocida." });
        }

        if (definicion.permiso && !tienePermiso(admin.rol, definicion.permiso)) {
            return res.status(403).json({ error: "Tu rol no permite esta acción." });
        }

        const resultado = await definicion.ejecutar(admin, datos);

        return res.status(200).json(resultado);

    } catch (error) {

        if (error instanceof ErrorAdmin) {
            return res.status(error.status).json({ error: error.message });
        }

        console.error("Admin: error inesperado:", error);

        return res.status(500).json({ error: "Error interno de Administración." });
    }
};
