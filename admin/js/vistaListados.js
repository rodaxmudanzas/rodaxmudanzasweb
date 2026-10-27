// Vistas de consulta: Transportistas, Finanzas y Auditoría.

function tablaSimple(cabeceras, filas, vacio) {

    if (filas.length === 0) {
        return `<p class="p-10 text-center text-slate-400 font-medium">${esc(vacio)}</p>`;
    }

    return `<table class="w-full text-left">
        <thead><tr class="text-slate-400 text-xs uppercase bg-slate-50">${cabeceras.map(c => `<th class="p-3 ${c.derecha ? "text-right" : ""}">${esc(c.texto)}</th>`).join("")}</tr></thead>
        <tbody>${filas.join("")}</tbody></table>`;
}

const VistaTransportistas = {

    async montar(contenedor) {

        contenedor.innerHTML = cargando();

        try {
            const { transportistas } = await api("transportistas");

            const filas = transportistas.map(t => `
                <tr class="border-t border-slate-100">
                    <td class="p-3"><p class="font-bold text-slate-800">${esc(t.nombre_comercial || t.nombre)}</p>
                        ${t.nombre_comercial ? `<p class="text-xs text-slate-400">${esc(t.nombre)}</p>` : ""}</td>
                    <td class="p-3 text-sm text-slate-600">${esc(t.ciudad || "—")}</td>
                    <td class="p-3 text-sm text-slate-600">${esc(t.telefono || "—")}<br><span class="text-xs text-slate-400">${esc(t.email)}</span></td>
                    <td class="p-3 text-sm font-bold text-center">${Number(t.servicios_asignados)}</td>
                    <td class="p-3">${t.estado === "Activo"
                        ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">Activo</span>'
                        : `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">${esc(t.estado || "—")}</span>`}</td>
                    <td class="p-3 text-sm text-slate-500">${fechaCorta(t.created_at)}</td>
                </tr>`);

            contenedor.innerHTML = `<div class="p-6 space-y-4">
                <h2 class="text-2xl font-black text-slate-800">Transportistas</h2>
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                    ${tablaSimple(
                        [{ texto: "Transportista" }, { texto: "Ciudad" }, { texto: "Contacto" }, { texto: "Servicios activos" }, { texto: "Estado" }, { texto: "Alta" }],
                        filas, "No hay transportistas registrados.")}
                </div></div>`;

        } catch (error) {
            contenedor.innerHTML = mensajeError(error);
        }
    }
};

const VistaFinanzas = {

    async montar(contenedor) {

        contenedor.innerHTML = cargando();

        try {
            const r = await api("finanzas");
            const t = r.totales;

            const tarjeta = (titulo, valor, ayuda) => `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <p class="text-xs font-bold text-slate-400 uppercase">${esc(titulo)}</p>
                    <p class="text-2xl font-black text-slate-800 mt-2">${euro(valor)}</p>
                    <p class="text-xs text-slate-500 mt-1">${esc(ayuda)}</p>
                </div>`;

            const filas = r.mudanzas.map(m => `
                <tr class="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onclick="abrirExpediente(${Number(m.id)})">
                    <td class="p-3 font-bold text-slate-800 whitespace-nowrap">${esc(m.numero_reserva)}</td>
                    <td class="p-3">${insignia(m.estado)}</td>
                    <td class="p-3 text-sm text-slate-600">${esc(m.estado_pago || "—")}</td>
                    <td class="p-3 text-right text-sm font-bold">${euro(m.importe_total)}</td>
                    <td class="p-3 text-right text-sm">${euro(m.importe_reserva)}</td>
                    <td class="p-3 text-right text-sm">${euro(m.importe_restante)}</td>
                    <td class="p-3 text-sm text-slate-500 whitespace-nowrap">${fechaCorta(m.fecha_cobro_70)}</td>
                </tr>`);

            contenedor.innerHTML = `<div class="p-6 space-y-6">
                <h2 class="text-2xl font-black text-slate-800">Finanzas</h2>
                <p class="text-xs text-slate-500">Solo lectura. Los importes proceden de la confirmación de pago de Stripe registrada por el servidor; este panel no cobra, reembolsa ni modifica importes.</p>
                <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
                    ${tarjeta("Reservas cobradas", t.reservas_cobradas_activas, "30 % de expedientes activos")}
                    ${tarjeta("Pendiente de cobro", t.pendiente_70_activas, "70 % de expedientes activos")}
                    ${tarjeta("Servicios completados", t.facturado_completadas, "Importe total")}
                    ${tarjeta("Penalizaciones", t.penalizaciones_cobradas, "Cancelaciones completadas")}
                    ${tarjeta("Reembolsos", t.reembolsos_realizados, "Cancelaciones completadas")}
                </div>
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                    ${tablaSimple(
                        [{ texto: "Reserva" }, { texto: "Estado" }, { texto: "Pago" }, { texto: "Total", derecha: true }, { texto: "Reserva", derecha: true }, { texto: "Pendiente", derecha: true }, { texto: "Cobro 70 %" }],
                        filas, "Todavía no hay expedientes con pago confirmado.")}
                </div></div>`;

        } catch (error) {
            contenedor.innerHTML = mensajeError(error);
        }
    }
};

const VistaAuditoria = {

    async montar(contenedor) {

        contenedor.innerHTML = cargando();

        try {
            const { historial } = await api("auditoria");

            const resumen = h => {
                if (h.nota) return esc(h.nota);
                if (h.despues) return esc(JSON.stringify(h.despues));
                return "—";
            };

            const filas = historial.map(h => `
                <tr class="border-t border-slate-100 align-top">
                    <td class="p-3 text-sm text-slate-500 whitespace-nowrap">${fechaCorta(h.created_at)}</td>
                    <td class="p-3 text-sm text-slate-700">${esc(h.admin_email)}</td>
                    <td class="p-3 text-sm font-bold text-slate-800">${esc(String(h.accion).replace(/_/g, " "))}</td>
                    <td class="p-3 text-sm">${h.mudanza_id
                        ? `<button onclick="abrirExpediente(${Number(h.mudanza_id)})" class="font-bold text-blue-700 hover:underline">${esc(h.numero_reserva || h.mudanza_id)}</button>` : "—"}</td>
                    <td class="p-3 text-xs text-slate-600 break-words max-w-md">${resumen(h)}</td>
                </tr>`);

            contenedor.innerHTML = `<div class="p-6 space-y-4">
                <h2 class="text-2xl font-black text-slate-800">Auditoría</h2>
                <p class="text-xs text-slate-500">Últimas 200 acciones administrativas. El historial no se puede editar ni borrar desde el panel.</p>
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                    ${tablaSimple(
                        [{ texto: "Fecha" }, { texto: "Administrador" }, { texto: "Acción" }, { texto: "Reserva" }, { texto: "Detalle" }],
                        filas, "Aún no hay actividad registrada.")}
                </div></div>`;

        } catch (error) {
            contenedor.innerHTML = mensajeError(error);
        }
    }
};
