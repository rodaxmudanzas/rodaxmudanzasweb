// Vista: Solicitudes (modificaciones pedidas por clientes y cancelaciones con reembolso).

const VistaSolicitudes = {

    async montar(contenedor) {

        contenedor.innerHTML = cargando();

        try {
            const r = await api("solicitudes");
            contenedor.innerHTML = this.plantilla(r);
            iconos();
        } catch (error) {
            contenedor.innerHTML = mensajeError(error);
        }
    },

    plantilla(r) {

        const abiertas = r.modificaciones.filter(s => ["pendiente", "en_revision", "aprobada"].includes(s.estado));
        const cerradas = r.modificaciones.filter(s => !["pendiente", "en_revision", "aprobada"].includes(s.estado));
        const verFinanzas = puede("leer_finanzas");

        const tarjeta = s => `
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div class="flex items-center justify-between gap-2">
                    <button onclick="abrirExpediente(${Number(s.mudanza_id)})" class="font-black text-blue-700 hover:underline">${esc(s.numero_reserva)}</button>
                    ${insignia(s.estado)}
                </div>
                <p class="text-xs text-slate-400 mt-0.5">${esc(s.email_cliente)} · ${fechaCorta(s.created_at)}</p>
                <pre class="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap break-words">${esc(JSON.stringify(s.cambios, null, 2))}</pre>
                ${s.nota_admin ? `<p class="text-xs text-slate-500 mt-2"><strong>Nota:</strong> ${esc(s.nota_admin)}</p>` : ""}
                ${puede("resolver_solicitud") ? botonesSolicitud(s) : ""}
            </div>`;

        const cancelaciones = r.cancelaciones.length === 0
            ? '<p class="p-6 text-center text-slate-400">Sin cancelaciones registradas.</p>'
            : `<table class="w-full text-left"><thead><tr class="text-slate-400 text-xs uppercase bg-slate-50">
                    <th class="p-3">Reserva</th><th class="p-3">Estado</th>
                    ${verFinanzas ? '<th class="p-3 text-right">Penalización</th><th class="p-3 text-right">Reembolso</th>' : ""}
                    <th class="p-3">Actualizada</th></tr></thead><tbody>
                ${r.cancelaciones.map(c => `
                    <tr class="border-t border-slate-100 ${["error", "procesando"].includes(c.estado) ? "bg-red-50" : ""}">
                        <td class="p-3"><button onclick="abrirExpediente(${Number(c.mudanza_id)})" class="font-bold text-blue-700 hover:underline">${esc(c.numero_reserva)}</button></td>
                        <td class="p-3">${insignia(c.estado)}${c.motivo_error && verFinanzas ? `<p class="text-xs text-red-600 mt-1">${esc(c.motivo_error)}</p>` : ""}</td>
                        ${verFinanzas ? `<td class="p-3 text-right text-sm">${esc(c.porcentaje_penalizacion ?? 0)} % · ${euro(c.importe_penalizacion)}</td><td class="p-3 text-right text-sm font-bold">${euro(c.importe_reembolso)}</td>` : ""}
                        <td class="p-3 text-sm text-slate-500">${fechaCorta(c.updated_at)}</td>
                    </tr>`).join("")}
                </tbody></table>`;

        return `
            <div class="p-6 space-y-6">
                <h2 class="text-2xl font-black text-slate-800">Solicitudes</h2>

                <section>
                    <h3 class="text-sm font-black text-slate-500 uppercase mb-3">Modificaciones por resolver (${abiertas.length})</h3>
                    <p class="text-xs text-slate-500 mb-3">Aprobar una solicitud no cambia el expediente ni el precio. Una vez aprobada, aplica los cambios desde la ficha («Corregir datos») y márcala como aplicada.</p>
                    <div class="grid gap-4 grid-cols-1 xl:grid-cols-2">
                        ${abiertas.map(tarjeta).join("") || '<p class="text-slate-400 text-sm">No hay solicitudes abiertas.</p>'}
                    </div>
                </section>

                <section>
                    <h3 class="text-sm font-black text-slate-500 uppercase mb-3">Cancelaciones de clientes</h3>
                    <p class="text-xs text-slate-500 mb-3">Solo lectura. Los reembolsos y penalizaciones los calcula el servidor al cancelar el cliente; las filas en error o procesando requieren revisión en Stripe.</p>
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">${cancelaciones}</div>
                </section>

                ${cerradas.length ? `<section>
                    <h3 class="text-sm font-black text-slate-500 uppercase mb-3">Modificaciones resueltas (${cerradas.length})</h3>
                    <div class="grid gap-4 grid-cols-1 xl:grid-cols-2">${cerradas.slice(0, 20).map(tarjeta).join("")}</div>
                </section>` : ""}
            </div>`;
    }
};
