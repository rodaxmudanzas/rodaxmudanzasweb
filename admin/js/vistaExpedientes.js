// Vista: Expedientes (listado, filtros y ficha de detalle con acciones).

const ESTADOS_FILTRO = [
    "Pendiente de pago",
    "Pendiente de asignación",
    "Transportista asignado",
    "Completada",
    "Cancelada por cliente"
];

const VistaExpedientes = {

    temporizador: null,
    filtros: { q: "", estado: "", sin_transportista: false, desde: "", hasta: "" },

    async montar(contenedor) {

        contenedor.innerHTML = `
            <div class="p-6 space-y-4">
                <h2 class="text-2xl font-black text-slate-800">Expedientes</h2>
                <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid gap-3 grid-cols-1 md:grid-cols-6 items-end">
                    <label class="md:col-span-2 block"><span class="text-xs font-bold text-slate-500 uppercase">Buscar</span>
                        <input id="f-q" type="search" placeholder="Reserva, nombre, email o teléfono" value="${esc(this.filtros.q)}"
                            class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"></label>
                    <label class="block"><span class="text-xs font-bold text-slate-500 uppercase">Estado</span>
                        <select id="f-estado" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500">
                            <option value="">Todos</option>
                            ${ESTADOS_FILTRO.map(e => `<option value="${esc(e)}" ${this.filtros.estado === e ? "selected" : ""}>${esc(e)}</option>`).join("")}
                        </select></label>
                    <label class="block"><span class="text-xs font-bold text-slate-500 uppercase">Desde</span>
                        <input id="f-desde" type="date" value="${esc(this.filtros.desde)}" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></label>
                    <label class="block"><span class="text-xs font-bold text-slate-500 uppercase">Hasta</span>
                        <input id="f-hasta" type="date" value="${esc(this.filtros.hasta)}" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></label>
                    <label class="flex items-center gap-2 text-sm font-semibold text-slate-600 pb-2">
                        <input id="f-sin" type="checkbox" ${this.filtros.sin_transportista ? "checked" : ""} class="w-4 h-4"> Sin transportista</label>
                </div>
                <div id="expedientes-tabla" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto"></div>
            </div>`;

        const leer = () => {
            this.filtros = {
                q: document.getElementById("f-q").value,
                estado: document.getElementById("f-estado").value,
                sin_transportista: document.getElementById("f-sin").checked,
                desde: document.getElementById("f-desde").value,
                hasta: document.getElementById("f-hasta").value
            };
            this.cargar();
        };

        document.getElementById("f-q").addEventListener("input", () => {
            clearTimeout(this.temporizador);
            this.temporizador = setTimeout(leer, 350);
        });

        ["f-estado", "f-desde", "f-hasta", "f-sin"].forEach(id =>
            document.getElementById(id).addEventListener("change", leer));

        await this.cargar();
    },

    async cargar() {

        const tabla = document.getElementById("expedientes-tabla");
        if (!tabla) return;

        tabla.innerHTML = cargando();

        try {
            const r = await api("expedientes", this.filtros);
            tabla.innerHTML = this.tabla(r);
            iconos();
        } catch (error) {
            tabla.innerHTML = mensajeError(error);
        }
    },

    tabla(r) {

        if (r.expedientes.length === 0) {
            return `<p class="p-10 text-center text-slate-400 font-medium">No hay expedientes con estos filtros.</p>`;
        }

        const filas = r.expedientes.map(m => `
            <tr onclick="abrirExpediente(${Number(m.id)})" class="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td class="p-3 font-bold text-slate-800 whitespace-nowrap">${esc(m.numero_reserva)}</td>
                <td class="p-3"><p class="font-semibold text-slate-700">${esc(m.nombre)}</p><p class="text-xs text-slate-400">${esc(m.email || "")}</p></td>
                <td class="p-3 text-sm text-slate-600">${esc(m.origen_ciudad || "?")} → ${esc(m.destino_ciudad || "?")}</td>
                <td class="p-3 text-sm font-semibold text-slate-700 whitespace-nowrap">${fechaCorta(m.fecha)}</td>
                <td class="p-3">${insignia(m.estado)}</td>
                <td class="p-3 text-sm text-slate-600">${m.transportista_nombre ? esc(m.transportista_nombre) : '<span class="text-slate-300">—</span>'}</td>
                <td class="p-3 text-sm font-bold text-slate-700 text-right whitespace-nowrap">${esc(m.preciototal || euro(m.importe_total))}</td>
            </tr>`).join("");

        return `
            <table class="w-full text-left">
                <thead><tr class="text-slate-400 text-xs uppercase bg-slate-50">
                    <th class="p-3">Reserva</th><th class="p-3">Cliente</th><th class="p-3">Ruta</th>
                    <th class="p-3">Fecha</th><th class="p-3">Estado</th><th class="p-3">Transportista</th><th class="p-3 text-right">Total</th>
                </tr></thead>
                <tbody>${filas}</tbody>
            </table>
            ${r.limitado ? '<p class="p-3 text-xs text-amber-600 font-semibold border-t border-slate-100">Se muestran los 200 más recientes. Afina los filtros para ver otros.</p>' : ""}`;
    }
};

//////////////////////////////////////////////////////
// FICHA DE EXPEDIENTE
//////////////////////////////////////////////////////

let expedienteAbierto = null;

async function abrirExpediente(id) {

    const panel = document.getElementById("ficha");
    const cuerpo = document.getElementById("ficha-cuerpo");

    panel.classList.remove("hidden");
    cuerpo.innerHTML = cargando();

    try {
        expedienteAbierto = await api("expediente", { mudanza_id: id });
        cuerpo.innerHTML = plantillaFicha(expedienteAbierto);
        iconos();
    } catch (error) {
        cuerpo.innerHTML = mensajeError(error);
    }
}

function cerrarFicha() {
    document.getElementById("ficha").classList.add("hidden");
    expedienteAbierto = null;
}

async function refrescarFicha() {
    if (!expedienteAbierto) return;
    const id = expedienteAbierto.mudanza.id;
    await abrirExpediente(id);
    if (typeof refrescarVistaActual === "function") refrescarVistaActual();
}

function bloque(titulo, contenido) {
    return `
        <section class="py-4 border-t border-slate-100">
            <h4 class="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">${esc(titulo)}</h4>
            ${contenido}
        </section>`;
}

function dato(etiqueta, valor) {
    if (valor && typeof valor === "object") {
        valor = Array.isArray(valor) ? valor.join(", ") : JSON.stringify(valor);
    }
    return `<div><dt class="text-[11px] font-bold text-slate-400 uppercase">${esc(etiqueta)}</dt><dd class="text-sm font-semibold text-slate-800 break-words">${valor === "" || valor == null ? "—" : esc(valor)}</dd></div>`;
}

// Cajas de «Mudanza total»: se separan del inventario para que quede claro qué debe aportar el transportista.
function resumenInventario(m) {

    if (!Array.isArray(m.inventario) || m.inventario.length === 0) return "";

    const esTotal = String(m.tipo_servicio || "").toLowerCase().includes("total");
    const normalizar = v => String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const marcado = i => i?.es_extra_mudanza_total === true || i?.extra_mudanza_total === true || String(i?.tipo_item || "").trim() === "extra_mudanza_total";
    const hayMarcadores = m.inventario.some(marcado);
    const extras = { "Cajas pequeñas": 0, "Cajas medianas": 0, "Cajas grandes": 0 };
    const visibles = [];

    m.inventario.forEach(item => {
        const cantidad = Number(item?.cantidad) || 0;
        if (cantidad <= 0) return;
        const clave = normalizar(item?.nombre);
        const esCaja = ["caja pequena", "caja mediana", "caja grande"].includes(clave);
        if (esTotal && (marcado(item) || (!hayMarcadores && esCaja))) {
            if (clave === "caja pequena") extras["Cajas pequeñas"] += cantidad;
            if (clave === "caja mediana") extras["Cajas medianas"] += cantidad;
            if (clave === "caja grande") extras["Cajas grandes"] += cantidad;
            return;
        }
        visibles.push(item);
    });

    let html = "";

    if (visibles.length) {
        html += `<ul class="text-sm text-slate-700 space-y-0.5">${visibles.map(i => `<li><strong>${Number(i.cantidad) || 0} ×</strong> ${esc(i.nombre)}</li>`).join("")}</ul>`;
    }

    if (esTotal && Object.values(extras).some(v => v > 0)) {
        html += `<div class="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-slate-700">
            <p class="font-black text-emerald-700 uppercase mb-1">Extras: el transportista debe aportar</p>
            ${Object.entries(extras).map(([n, v]) => `<span class="mr-4"><strong>${esc(n)}:</strong> ×${v}</span>`).join("")}</div>`;
    }

    return html ? bloque("Inventario", html) : "";
}

function plantillaFicha({ mudanza: m, transportista, vehiculo, solicitudes_modificacion, cancelaciones, historial }) {

    const fotos = String(m.urls_fotos || "").split(",").map(urlSegura).filter(Boolean);
    const verFinanzas = puede("leer_finanzas");
    const finalizado = ["Completada", "Cancelada por cliente"].includes(m.estado);

    const botones = [];

    if (puede("asignar") && m.estado === "Pendiente de asignación") {
        botones.push(`<button onclick="mostrarAsignacion()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Asignar transportista</button>`);
    }
    if (puede("asignar") && m.estado === "Transportista asignado") {
        botones.push(`<button onclick="retirarAsignacion()" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold">Retirar asignación</button>`);
    }
    if (puede("completar") && m.estado === "Transportista asignado") {
        botones.push(`<button onclick="completarServicio()" class="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold">Marcar completada</button>`);
    }
    if (puede("editar_expediente") && !finalizado) {
        botones.push(`<button onclick="mostrarEdicion()" class="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold">Corregir datos</button>`);
    }

    const economia = verFinanzas ? bloque("Economía", `
        <dl class="grid grid-cols-2 gap-3">
            ${dato("Total", euro(m.importe_total ?? m.preciototal))}
            ${dato("Reserva (30 %)", euro(m.importe_reserva))}
            ${dato("Pendiente (70 %)", euro(m.importe_restante))}
            ${dato("Estado de pago", m.estado_pago)}
            ${dato("Pago de la reserva", fechaCorta(m.fecha_pago_30))}
            ${dato("Cobro del 70 %", fechaCorta(m.fecha_cobro_70))}
            ${dato("Payment Intent", m.stripe_payment_intent)}
        </dl>`) : "";

    const asignado = bloque("Transportista", transportista ? `
        <dl class="grid grid-cols-2 gap-3">
            ${dato("Nombre", transportista.nombre_comercial || transportista.nombre)}
            ${dato("Teléfono", transportista.telefono)}
            ${dato("Email", transportista.email)}
            ${dato("Vehículo", vehiculo ? `${vehiculo.marca || ""} ${vehiculo.modelo || ""} · ${vehiculo.matricula || ""}`.trim() : "")}
            ${dato("Asignado el", fechaCorta(m.fecha_asignacion))}
        </dl>` : `<p class="text-sm text-slate-400">Sin transportista asignado.</p>`);

    const modificaciones = solicitudes_modificacion.length ? bloque("Solicitudes de modificación", solicitudes_modificacion.map(s => `
        <div class="p-3 mb-2 rounded-xl border border-slate-200 bg-slate-50">
            <div class="flex justify-between items-center mb-1">${insignia(s.estado)}<span class="text-xs text-slate-400">${fechaCorta(s.created_at)}</span></div>
            <pre class="text-xs text-slate-600 whitespace-pre-wrap break-words">${esc(JSON.stringify(s.cambios, null, 2))}</pre>
            ${s.nota_admin ? `<p class="text-xs text-slate-500 mt-1"><strong>Nota:</strong> ${esc(s.nota_admin)}</p>` : ""}
            ${puede("resolver_solicitud") ? botonesSolicitud(s) : ""}
        </div>`).join("")) : "";

    const bajas = cancelaciones.length ? bloque("Cancelación del cliente", cancelaciones.map(c => `
        <div class="p-3 mb-2 rounded-xl border ${["error", "procesando"].includes(c.estado) ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}">
            <div class="flex justify-between items-center">${insignia(c.estado)}<span class="text-xs text-slate-400">${fechaCorta(c.updated_at)}</span></div>
            ${verFinanzas ? `<dl class="grid grid-cols-3 gap-2 mt-2">
                ${dato("Penalización", `${c.porcentaje_penalizacion ?? 0} %`)}
                ${dato("Importe penaliz.", euro(c.importe_penalizacion))}
                ${dato("Reembolso", euro(c.importe_reembolso))}
            </dl>` : ""}
            ${c.motivo_error ? `<p class="text-xs text-red-600 mt-2">${esc(c.motivo_error)}</p>` : ""}
            ${["error", "procesando"].includes(c.estado) ? '<p class="text-xs font-bold text-red-600 mt-2">Requiere revisión humana. No repitas el reembolso sin comprobar Stripe.</p>' : ""}
        </div>`).join("")) : "";

    const notas = puede("nota") ? `
        <div class="mt-3 flex gap-2">
            <input id="nota-texto" maxlength="1000" placeholder="Añadir nota interna…" class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500">
            <button onclick="guardarNota(this)" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold">Guardar</button>
        </div>` : "";

    const historialHtml = bloque("Historial y notas", `
        ${historial.length === 0 ? '<p class="text-sm text-slate-400">Sin actividad administrativa todavía.</p>' : `<ul class="space-y-2">${historial.map(h => `
            <li class="text-sm"><span class="font-bold text-slate-700">${esc(String(h.accion).replace(/_/g, " "))}</span>
                <span class="text-xs text-slate-400"> · ${esc(h.admin_email)} · ${fechaCorta(h.created_at)}</span>
                ${h.nota ? `<p class="text-slate-600">${esc(h.nota)}</p>` : ""}</li>`).join("")}</ul>`}
        ${notas}`);

    return `
        <div class="p-6">
            <div class="flex items-start justify-between gap-3 pr-10">
                <div><p class="text-xs font-bold text-slate-400 uppercase">Expediente</p>
                    <h3 class="text-2xl font-black text-slate-800">${esc(m.numero_reserva)}</h3></div>
                ${insignia(m.estado)}
            </div>
            <div class="flex flex-wrap gap-2 mt-4" id="ficha-acciones">${botones.join("")}</div>
            <div id="ficha-formulario" class="hidden mt-4"></div>

            ${bloque("Cliente", `<dl class="grid grid-cols-2 gap-3">
                ${dato("Nombre", m.nombre)}${dato("Teléfono", m.telefono)}${dato("Email", m.email)}</dl>`)}

            ${bloque("Servicio", `<dl class="grid grid-cols-2 gap-3">
                ${dato("Origen", m.origen)}${dato("Destino", m.destino)}
                ${dato("Fecha", fechaCorta(m.fecha))}${dato("Franja de recogida", m.franja_horaria_recogida)}
                ${dato("Tipo de servicio", m.tipo_servicio)}${dato("Volumen", m.volumen)}
                ${dato("Kilómetros", m.km)}${dato("Extras", m.extras)}
                ${dato("Observaciones", m.observaciones)}</dl>`)}

            ${resumenInventario(m)}

            ${fotos.length ? bloque("Fotos", `<div class="flex gap-2 flex-wrap">${fotos.map(u => `
                <a href="${esc(u)}" target="_blank" rel="noopener noreferrer" class="block w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500">
                    <img src="${esc(u)}" alt="Foto de la carga" loading="lazy" class="w-full h-full object-cover"></a>`).join("")}</div>`) : ""}

            ${economia}
            ${asignado}
            ${modificaciones}
            ${bajas}
            ${historialHtml}
        </div>`;
}

function botonesSolicitud(s) {

    const siguientes = {
        pendiente: [["en_revision", "Revisar"], ["aprobada", "Aprobar"], ["rechazada", "Rechazar"]],
        en_revision: [["aprobada", "Aprobar"], ["rechazada", "Rechazar"]],
        aprobada: [["aplicada", "Marcar aplicada"]]
    }[s.estado] || [];

    if (!siguientes.length) return "";

    return `<div class="flex flex-wrap gap-2 mt-2">${siguientes.map(([estado, texto]) =>
        `<button onclick="resolverSolicitud(${Number(s.id)}, '${estado}', this)" class="px-3 py-1.5 rounded-lg text-xs font-bold ${estado === "rechazada" ? "bg-red-50 text-red-700 border border-red-200" : "bg-white text-blue-700 border border-blue-200"} hover:opacity-80">${texto}</button>`).join("")}</div>`;
}

//////////////////////////////////////////////////////
// ACCIONES
//////////////////////////////////////////////////////

async function ejecutarAccion(accion, datos, boton, mensajeOk) {

    try {
        const r = await conBoton(boton, () => api(accion, datos));
        aviso(mensajeOk);
        if (r.auditado === false) aviso("El cambio se guardó, pero no se pudo registrar en el historial. Avisa a soporte técnico.", "atencion");
        if (r.notificado === false) aviso("El cambio se guardó, pero no se pudo avisar al transportista.", "atencion");
        await refrescarFicha();
        return true;
    } catch (error) {
        aviso(error.message, "error");
        if (error.status === 409) await refrescarFicha();
        return false;
    }
}

async function mostrarAsignacion() {

    const caja = document.getElementById("ficha-formulario");
    caja.classList.remove("hidden");
    caja.innerHTML = cargando("Cargando transportistas…");

    try {
        const { transportistas } = await api("transportistas");
        const activos = transportistas.filter(t => t.estado === "Activo");

        caja.innerHTML = `
            <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                <label class="block"><span class="text-xs font-bold text-slate-500 uppercase">Transportista</span>
                    <select id="asig-transportista" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                        <option value="">Selecciona…</option>
                        ${activos.map(t => `<option value="${esc(t.id)}">${esc(t.nombre_comercial || t.nombre)} · ${esc(t.ciudad || "—")} (${t.servicios_asignados} activos)</option>`).join("")}
                    </select></label>
                <label class="block"><span class="text-xs font-bold text-slate-500 uppercase">Vehículo</span>
                    <select id="asig-vehiculo" disabled class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"><option value="">Elige primero un transportista</option></select></label>
                <label class="block"><span class="text-xs font-bold text-slate-500 uppercase">Nota (opcional)</span>
                    <input id="asig-nota" maxlength="500" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></label>
                <div class="flex gap-2 justify-end">
                    <button onclick="document.getElementById('ficha-formulario').classList.add('hidden')" class="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
                    <button id="asig-confirmar" onclick="confirmarAsignacion(this)" class="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white">Asignar</button>
                </div>
            </div>`;

        document.getElementById("asig-transportista").addEventListener("change", async e => {
            const select = document.getElementById("asig-vehiculo");
            select.disabled = true;
            select.innerHTML = '<option value="">Cargando…</option>';
            if (!e.target.value) return;

            try {
                const { vehiculos } = await api("vehiculos_transportista", { transportista_id: e.target.value });
                select.innerHTML = vehiculos.length
                    ? vehiculos.map(v => `<option value="${esc(v.id)}">${esc(v.marca || "")} ${esc(v.modelo || "")} · ${esc(v.matricula || "")}</option>`).join("")
                    : '<option value="">Este transportista no tiene vehículos</option>';
                select.disabled = vehiculos.length === 0;
            } catch (error) {
                select.innerHTML = '<option value="">No se pudieron cargar</option>';
                aviso(error.message, "error");
            }
        });

    } catch (error) {
        caja.innerHTML = mensajeError(error);
    }
}

async function confirmarAsignacion(boton) {

    const transportista = document.getElementById("asig-transportista").value;
    const vehiculo = document.getElementById("asig-vehiculo").value;

    if (!transportista || !vehiculo) {
        aviso("Elige transportista y vehículo.", "atencion");
        return;
    }

    await ejecutarAccion("asignar", {
        mudanza_id: expedienteAbierto.mudanza.id,
        transportista_id: transportista,
        vehiculo_id: vehiculo,
        nota: document.getElementById("asig-nota").value
    }, boton, "Transportista asignado.");
}

async function retirarAsignacion() {

    const motivo = await pedirConfirmacion({
        titulo: "Retirar la asignación",
        mensaje: "La mudanza volverá a «Pendiente de asignación» y se avisará al transportista.",
        etiqueta: "Motivo",
        obligatorio: true,
        textoBoton: "Retirar asignación",
        peligro: true
    });

    if (motivo === null) return;

    await ejecutarAccion("desasignar", { mudanza_id: expedienteAbierto.mudanza.id, motivo }, null, "Asignación retirada.");
}

async function completarServicio() {

    const nota = await pedirConfirmacion({
        titulo: "Marcar como completada",
        mensaje: "Confirma que el servicio se ha realizado. Esta acción no se puede deshacer desde el panel.",
        etiqueta: "Nota (opcional)",
        textoBoton: "Marcar completada"
    });

    if (nota === null) return;

    await ejecutarAccion("completar", { mudanza_id: expedienteAbierto.mudanza.id, nota }, null, "Servicio completado.");
}

function mostrarEdicion() {

    const m = expedienteAbierto.mudanza;
    const caja = document.getElementById("ficha-formulario");
    const asignado = Boolean(m.transportista_id);
    const campo = (id, etiqueta, valor, extra = "") => `
        <label class="block"><span class="text-xs font-bold text-slate-500 uppercase">${etiqueta}</span>
            <input id="${id}" value="${esc(valor)}" ${extra} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100"></label>`;

    caja.classList.remove("hidden");
    caja.innerHTML = `
        <div class="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
            <p class="text-xs text-slate-500">Solo datos de contacto y fecha/franja. Importes, ruta y estado no se editan aquí.${asignado ? " Para cambiar la fecha, retira antes la asignación." : ""}</p>
            ${campo("ed-nombre", "Nombre", m.nombre, 'maxlength="120"')}
            ${campo("ed-telefono", "Teléfono", m.telefono, 'maxlength="20"')}
            ${campo("ed-fecha", "Fecha", m.fecha, `type="date" ${asignado ? "disabled" : ""}`)}
            ${campo("ed-franja", "Franja horaria de recogida", m.franja_horaria_recogida, 'maxlength="100"')}
            <label class="block"><span class="text-xs font-bold text-slate-500 uppercase">Observaciones</span>
                <textarea id="ed-observaciones" rows="3" maxlength="2000" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">${esc(m.observaciones)}</textarea></label>
            ${campo("ed-motivo", "Motivo del cambio (obligatorio)", "", 'maxlength="500"')}
            <div class="flex gap-2 justify-end">
                <button onclick="document.getElementById('ficha-formulario').classList.add('hidden')" class="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button onclick="guardarEdicion(this)" class="px-4 py-2 rounded-lg text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white">Guardar cambios</button>
            </div>
        </div>`;
}

async function guardarEdicion(boton) {

    const valor = id => document.getElementById(id).value;
    const cambios = {
        nombre: valor("ed-nombre"),
        telefono: valor("ed-telefono"),
        franja_horaria_recogida: valor("ed-franja"),
        observaciones: valor("ed-observaciones")
    };

    if (!document.getElementById("ed-fecha").disabled) cambios.fecha = valor("ed-fecha");

    await ejecutarAccion("editar", {
        mudanza_id: expedienteAbierto.mudanza.id,
        cambios,
        motivo: valor("ed-motivo")
    }, boton, "Datos actualizados.");
}

async function guardarNota(boton) {

    const campo = document.getElementById("nota-texto");
    const texto = campo.value.trim();

    if (!texto) return;

    await ejecutarAccion("nota", { mudanza_id: expedienteAbierto.mudanza.id, texto }, boton, "Nota guardada.");
}

async function resolverSolicitud(id, estado, boton) {

    const rechazo = estado === "rechazada";

    const nota = await pedirConfirmacion({
        titulo: { en_revision: "Pasar a revisión", aprobada: "Aprobar solicitud", rechazada: "Rechazar solicitud", aplicada: "Marcar como aplicada" }[estado],
        mensaje: estado === "aplicada"
            ? "Confirma que los cambios ya se han aplicado al expediente. Esta acción no modifica el precio por sí sola."
            : "Aprobar no modifica el expediente ni el precio: los cambios se aplican después, de forma manual.",
        etiqueta: rechazo ? "Motivo del rechazo" : "Nota (opcional)",
        obligatorio: rechazo,
        textoBoton: "Confirmar",
        peligro: rechazo
    });

    if (nota === null) return;

    await ejecutarAccion("resolver_solicitud", { solicitud_id: id, estado, nota }, boton, "Solicitud actualizada.");
}
