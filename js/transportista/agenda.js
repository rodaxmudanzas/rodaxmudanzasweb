(function (window) {

    "use strict";

    window.Transportista =
        window.Transportista || {};

    window.Transportista.Agenda = {

        async cargar() {

            const contenedor =
                document.getElementById(
                    "contenedor-agenda"
                );

            if (!contenedor) {
                console.error(
                    "[Agenda] No existe #contenedor-agenda"
                );
                return;
            }

            const db =
                window.Transportista.dbClient;

            const transportistaId =
                window.Transportista.currentUserId;

            if (!db || !transportistaId) {

                contenedor.innerHTML = `
                    <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                        <p class="text-slate-500 font-semibold">
                            No se ha podido identificar al transportista.
                        </p>
                    </div>
                `;

                return;
            }

            contenedor.innerHTML = `
                <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <div class="animate-pulse text-slate-400 font-semibold">
                        Cargando agenda...
                    </div>
                </div>
            `;

            const {
                data,
                error
            } = await db
                .from("mudanzas")
                .select("*")
                .eq(
                    "transportista_id",
                    transportistaId
                )
                .order(
                    "fecha",
                    {
                        ascending: true
                    }
                );

            if (error) {

                console.error(
                    "[Agenda] Error cargando agenda:",
                    error
                );

                contenedor.innerHTML = `
                    <div class="bg-white rounded-2xl border border-red-200 p-8 text-center">
                        <p class="text-red-600 font-bold">
                            No se pudo cargar la agenda.
                        </p>
                    </div>
                `;

                return;
            }

            const trabajos =
                Array.isArray(data)
                    ? data
                    : [];

            if (!trabajos.length) {

                contenedor.innerHTML = `
                    <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">

                        <i
                            data-lucide="calendar-x"
                            class="w-12 h-12 text-slate-300 mx-auto mb-3">
                        </i>

                        <h3 class="text-lg font-bold text-slate-700">
                            No tienes servicios programados
                        </h3>

                        <p class="text-sm text-slate-400 mt-1">
                            Cuando aceptes una mudanza aparecerá aquí.
                        </p>

                    </div>
                `;

                if (window.lucide) {
                    window.lucide.createIcons();
                }

                return;
            }

            contenedor.innerHTML =
                trabajos
                    .map(
                        mudanza =>
                            this.renderizarEvento(
                                mudanza
                            )
                    )
                    .join("");

            if (window.lucide) {
                window.lucide.createIcons();
            }
        },

        renderizarEvento(mudanza) {

            const fecha =
                mudanza.fecha || "Sin fecha";

            const origen =
                mudanza.origen || "Origen pendiente";

            const destino =
                mudanza.destino || "Destino pendiente";

            const franja =
                mudanza.franja_horaria_recogida ||
                "Horario pendiente";

            const estado =
                mudanza.estado ||
                "Sin estado";

            return `
                <div
                    class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

                    <div class="flex items-start justify-between gap-4">

                        <div>

                            <div class="flex items-center gap-2">

                                <i
                                    data-lucide="calendar-days"
                                    class="w-5 h-5 text-blue-600">
                                </i>

                                <span
                                    class="text-lg font-black text-slate-800">
                                    ${fecha}
                                </span>

                            </div>

                            <div
                                class="text-sm text-slate-500 mt-1">

                                ${franja}

                            </div>

                        </div>

                        <span
                            class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">

                            ${estado}

                        </span>

                    </div>

                    <div
                        class="grid md:grid-cols-2 gap-4 mt-5">

                        <div
                            class="bg-slate-50 rounded-xl p-4">

                            <span
                                class="block text-[10px] uppercase tracking-wider font-bold text-slate-400">

                                Origen

                            </span>

                            <p
                                class="mt-1 text-sm font-bold text-slate-800">

                                ${origen}

                            </p>

                        </div>

                        <div
                            class="bg-slate-50 rounded-xl p-4">

                            <span
                                class="block text-[10px] uppercase tracking-wider font-bold text-slate-400">

                                Destino

                            </span>

                            <p
                                class="mt-1 text-sm font-bold text-slate-800">

                                ${destino}

                            </p>

                        </div>

                    </div>

                </div>
            `;
        }

    };

})(window);