(function () {

    "use strict";

    function renderRutaDrawer(mudanza) {

        if (!mudanza) return;

        const origen =
    (window.Transportista.obtenerUbicacionPublica || window.Transportista.obtenerUbicacionCorta)(
        mudanza,
        "origen"
    );

const destino =
    (window.Transportista.obtenerUbicacionPublica || window.Transportista.obtenerUbicacionCorta)(
        mudanza,
        "destino"
    );

        const km =
            mudanza.km !== undefined &&
            mudanza.km !== null &&
            mudanza.km !== ""
                ? `${mudanza.km} km`
                : "—";

        const fecha =
            mudanza.fecha || "—";

        const mostrarDireccionCompleta =
            Boolean(mudanza.__mostrarDireccionCompleta);

        const mostrarContactoCompleto =
            Boolean(mudanza.__mostrarContactoCompleto);

        const api = window.Transportista;

        const accesos =
            api && typeof api.getAccesos === "function"
                ? api.getAccesos(mudanza)
                : { recogida: "—", entrega: "—" };

        const recogida =
            accesos?.recogida || "—";

        const entrega =
            accesos?.entrega || "—";


        ///////////////////////////////////////////////////////
        // RESUMEN SUPERIOR
        ///////////////////////////////////////////////////////

        const elOrigen =
            document.getElementById("drawerOrigenResumen");

        const elDestino =
            document.getElementById("drawerDestinoResumen");

        const elOrigenAcceso =
            document.getElementById("drawerOrigenAcceso");

        const elDestinoAcceso =
            document.getElementById("drawerDestinoAcceso");

        const elKm =
            document.getElementById("drawerKm");

        const elFecha =
            document.getElementById("drawerFecha");

        if (elOrigen) elOrigen.textContent = origen;
        if (elDestino) elDestino.textContent = destino;
        if (elOrigenAcceso) elOrigenAcceso.textContent = recogida;
        if (elDestinoAcceso) elDestinoAcceso.textContent = entrega;
        if (elKm) elKm.textContent = km;
        if (elFecha) elFecha.textContent = fecha;


        ///////////////////////////////////////////////////////
        // RUTA DETALLADA
        ///////////////////////////////////////////////////////

        const contenedor =
            document.getElementById(
                "drawerRutaDetalleContenedor"
            );

        if (!contenedor) return;

        contenedor.innerHTML = `
            <div class="space-y-4">

                <div class="bg-gradient-to-r from-blue-50 to-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                        <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            PUNTO DE RECOGIDA
                        </span>
                    </div>

                    <p class="text-sm font-bold text-slate-800 leading-snug">
                        ${origen}
                    </p>

                    <p class="text-xs text-slate-400 mt-1">
                        ${mostrarDireccionCompleta
                            ? "📍 Dirección exacta liberada"
                            : "🔒 Calle oculta (Disponible 24h antes)"}
                    </p>
                </div>


                <div class="flex items-center gap-3 px-4">
                    <div class="flex-1 border-t-2 border-dashed border-slate-200"></div>
                    <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                        🚚 ${km}
                    </span>
                    <div class="flex-1 border-t-2 border-dashed border-slate-200"></div>
                </div>


                <div class="bg-gradient-to-r from-orange-50 to-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100"></span>
                        <span class="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                            PUNTO DE ENTREGA
                        </span>
                    </div>

                    <p class="text-sm font-bold text-slate-800 leading-snug">
                        ${destino}
                    </p>

                    <p class="text-xs text-slate-400 mt-1">
                        ${mostrarDireccionCompleta
                            ? "📍 Dirección exacta liberada"
                            : "🔒 Calle oculta (Disponible 24h antes)"}
                    </p>
                </div>


                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mt-2 space-y-2 text-xs">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Contacto de la mudanza
                    </span>

                    ${mostrarContactoCompleto ? `
                        <p class="text-slate-700 font-medium">
                            <strong>Nombre:</strong>
                            ${mudanza.nombre || "—"}
                        </p>

                        <p class="text-slate-700 font-medium">
                            <strong>Teléfono:</strong>
                            ${mudanza.telefono
                                ? `<a href="tel:${mudanza.telefono}" class="text-blue-600 font-bold hover:underline">${mudanza.telefono}</a>`
                                : "—"}
                        </p>

                        <p class="text-slate-700 font-medium">
                            <strong>Email:</strong>
                            ${mudanza.email || "—"}
                        </p>
                    ` : `
                        <p class="text-slate-500 font-medium bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-amber-700 flex items-center gap-1.5">
                            🔒 Los teléfonos y correos se revelarán el mismo día de la mudanza a partir de las 06:00 AM.
                        </p>
                    `}
                </div>

            </div>
        `;
    }

    window.renderRutaDrawer =
        renderRutaDrawer;

    console.log(
        "✅ Drawer Ruta cargado correctamente"
    );

})();
