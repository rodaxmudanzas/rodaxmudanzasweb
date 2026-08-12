(function () {

    "use strict";

    function renderServiciosDrawer(mudanza) {

        if (!mudanza) return;

        const tipo =
            String(mudanza.tipo_servicio || "").trim();

        const esMudanzaTotal =
            tipo.toLowerCase().includes("total");

        const badge =
            document.getElementById("drawerServicioBadge");

        if (badge) {
            badge.textContent =
                esMudanzaTotal
                    ? "MUDANZA TOTAL"
                    : "MUDANZA ESTÁNDAR";

            badge.className = esMudanzaTotal
                ? "text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-sans"
                : "text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-sans";
        }

        const contenedor =
            document.getElementById(
                "drawerServiciosLista"
            );

        if (!contenedor) return;

        if (esMudanzaTotal) {

            const servicios = [
                "Desmontaje ilimitado",
                "Montaje ilimitado",
                "Embalaje ilimitado",
                "Empaquetado y cajas ilimitado",
                "Seguro premium hasta 50.000€",
                "Prioridad operativa"
            ];

            contenedor.innerHTML = `
                <div class="space-y-1.5 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-semibold leading-relaxed font-sans shadow-sm w-full text-left">
                    ${servicios.map(servicio => `
                        <p class="flex items-center gap-2 text-emerald-700">
                            ✔ ${servicio}
                        </p>
                    `).join("")}
                </div>
            `;

            return;
        }

        const extras =
            mudanza.extras ||
            "Solo transporte básico";

        contenedor.innerHTML = `
            <div class="space-y-1.5 bg-blue-50/40 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 font-semibold shadow-sm w-full text-left">
                <p class="flex items-center gap-2 text-blue-700">
                    ✔ Transporte Estándar Básico
                </p>

                <p class="text-[10px] text-slate-400 font-normal mt-1">
                    Servicios extras seleccionados por el cliente:
                </p>

                <p class="font-bold text-slate-700 mt-0.5">
                    ${extras}
                </p>
            </div>
        `;
    }

    window.renderServiciosDrawer =
        renderServiciosDrawer;

    console.log(
        "✅ Drawer Servicios cargado correctamente"
    );

})();
