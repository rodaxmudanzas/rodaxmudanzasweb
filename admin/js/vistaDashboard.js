// Vista: Panel general.

const VistaDashboard = {

    async montar(contenedor) {

        contenedor.innerHTML = cargando();

        try {
            const r = await api("resumen");
            contenedor.innerHTML = this.plantilla(r);
            iconos();
        } catch (error) {
            contenedor.innerHTML = mensajeError(error);
        }
    },

    plantilla(r) {

        const tarjeta = (titulo, valor, ayuda, alerta, icono, vista) => `
            <button type="button" ${vista ? `onclick="irAVista('${vista}')"` : "disabled"}
                class="text-left bg-white rounded-2xl border ${alerta ? "border-red-300 bg-red-50/40" : "border-slate-200"} p-5 shadow-sm ${vista ? "hover:border-blue-400 transition-colors" : ""}">
                <div class="flex items-center justify-between text-slate-400">
                    <span class="text-xs font-bold uppercase tracking-wide">${esc(titulo)}</span>
                    <i data-lucide="${icono}" class="w-4 h-4"></i>
                </div>
                <p class="text-3xl font-black mt-2 ${alerta ? "text-red-600" : "text-slate-800"}">${esc(valor)}</p>
                <p class="text-xs text-slate-500 mt-1">${esc(ayuda)}</p>
            </button>`;

        const pendientes = r.por_estado["Pendiente de asignación"] || 0;

        const tarjetas = [
            tarjeta("Pendientes de asignar", pendientes, "Pagadas, a la espera de transportista", false, "truck", "expedientes"),
            tarjeta("Urgentes (≤ 3 días)", r.urgentes.length, "Sin transportista y con fecha próxima", r.urgentes.length > 0, "alarm-clock", null),
            tarjeta("Fecha vencida sin asignar", r.vencidas.length, "Requieren decisión humana (posible reembolso)", r.vencidas.length > 0, "triangle-alert", null),
            tarjeta("Solicitudes abiertas", r.solicitudes_abiertas, "Modificaciones por revisar", false, "file-pen-line", "solicitudes"),
            tarjeta("Cancelaciones con incidencia", r.cancelaciones_con_incidencia, "En error o procesando: revisar reembolso", r.cancelaciones_con_incidencia > 0, "circle-alert", "solicitudes")
        ];

        if (r.finanzas) {
            tarjetas.push(
                tarjeta("Reservas cobradas (30 %)", euro(r.finanzas.reservas_cobradas_activas), "De expedientes activos", false, "wallet", "finanzas"),
                tarjeta("Pendiente de cobro (70 %)", euro(r.finanzas.pendiente_70_activas), "De expedientes activos", false, "hourglass", "finanzas")
            );
        }

        const maximo = Math.max(1, ...Object.values(r.por_estado));
        const barras = Object.entries(r.por_estado)
            .sort((a, b) => b[1] - a[1])
            .map(([estado, n]) => `
                <div class="flex items-center gap-3 text-sm">
                    <span class="w-48 shrink-0 text-slate-600 font-medium truncate">${esc(estado)}</span>
                    <div class="flex-1 bg-slate-100 rounded-full h-2.5"><div class="bg-blue-500 h-2.5 rounded-full" style="width:${Math.round((n / maximo) * 100)}%"></div></div>
                    <span class="w-10 text-right font-bold text-slate-700">${n}</span>
                </div>`).join("");

        const lista = (titulo, filas, color) => filas.length === 0 ? "" : `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 class="text-sm font-black ${color} mb-3">${esc(titulo)}</h3>
                <ul class="divide-y divide-slate-100">
                    ${filas.map(m => `
                        <li>
                            <button type="button" onclick="abrirExpediente(${Number(m.id)})" class="w-full flex items-center justify-between gap-3 py-2.5 text-left hover:bg-slate-50 px-2 rounded-lg">
                                <span class="text-sm font-bold text-slate-800">${esc(m.numero_reserva)}</span>
                                <span class="text-xs text-slate-500 truncate">${esc(m.origen_ciudad || "?")} → ${esc(m.destino_ciudad || "?")}</span>
                                <span class="text-xs font-bold text-slate-700 shrink-0">${fechaCorta(m.fecha)}</span>
                            </button>
                        </li>`).join("")}
                </ul>
            </div>`;

        return `
            <div class="p-6 space-y-6">
                <h2 class="text-2xl font-black text-slate-800">Panel general</h2>
                <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">${tarjetas.join("")}</div>
                <div class="grid gap-6 grid-cols-1 xl:grid-cols-2">
                    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h3 class="text-sm font-black text-slate-700 mb-4">Expedientes por estado (${r.total})</h3>
                        <div class="space-y-3">${barras || '<p class="text-sm text-slate-400">Sin expedientes.</p>'}</div>
                    </div>
                    <div class="space-y-6">
                        ${lista("Fecha vencida y sin transportista", r.vencidas, "text-red-600")}
                        ${lista("Urgentes: servicio en 3 días o menos", r.urgentes, "text-amber-600")}
                    </div>
                </div>
            </div>`;
    }
};
