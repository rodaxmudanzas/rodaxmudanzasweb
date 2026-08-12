window.Transportista = window.Transportista || {};

let marketplaceCargando = false;


///////////////////////////////////////////////////////////
// UTILIDADES
///////////////////////////////////////////////////////////

function escapeHtmlMarketplace(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function contarFotosMarketplace(urlsFotos) {

    if (!urlsFotos) return 0;

    if (Array.isArray(urlsFotos)) {
        return urlsFotos
            .map(url => String(url).trim())
            .filter(Boolean)
            .length;
    }

    return String(urlsFotos)
        .split(/,|\s*\|\s*/)
        .map(url => url.trim())
        .filter(Boolean)
        .length;
}

function apiTransportistaDisponible() {

    const api = window.Transportista;

    return api &&
        typeof api.getTotalArticulos === "function" &&
        typeof api.getTotalM3 === "function" &&
        typeof api.formatM3 === "function" &&
        typeof api.getAccesos === "function";
}


///////////////////////////////////////////////////////////
// CARGAR TRABAJOS DISPONIBLES
///////////////////////////////////////////////////////////

async function cargarTrabajosDisponibles() {

    if (marketplaceCargando) {
        console.log("Marketplace: consulta ya en curso; se evita duplicado.");
        return;
    }

    if (!window.dbClient && typeof dbClient === "undefined") {
        console.error("Marketplace: dbClient no está disponible.");
        return;
    }

    marketplaceCargando = true;

    try {

        const cliente =
            window.dbClient || dbClient;

        const { data, error } = await cliente
            .from("mudanzas")
            .select("*")
            .eq("estado", "Pendiente de asignación")
            .eq("publicada_marketplace", true)
            .eq("bloqueada", false)
            .is("transportista_id", null)
            .order("fecha", { ascending: true });

        if (error) {
            console.error(
                "❌ ERROR CARGANDO MARKETPLACE:",
                error.message,
                error.details,
                error.hint
            );

            state.disponibles = [];
            renderizarDisponibles();
            return;
        }

        state.disponibles = Array.isArray(data)
            ? data
            : [];

        renderizarDisponibles();

    } catch (error) {

        console.error(
            "❌ EXCEPCIÓN CARGANDO MARKETPLACE:",
            error
        );

        state.disponibles = [];
        renderizarDisponibles();

    } finally {
        marketplaceCargando = false;
    }
}


///////////////////////////////////////////////////////////
// FECHAS
///////////////////////////////////////////////////////////

function crearEncabezadoFechaMarketplace(fecha) {

    if (!fecha) return "Fecha no disponible";

    const fechaT = new Date(fecha);

    if (Number.isNaN(fechaT.getTime())) {
        return String(fecha);
    }

    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const mismoDia = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const fechaFormateada =
        fechaT.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long"
        });

    if (mismoDia(fechaT, hoy)) {
        return `Hoy • ${fechaFormateada}`;
    }

    if (mismoDia(fechaT, manana)) {
        return `Mañana • ${fechaFormateada}`;
    }

    const diasSemana = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
    ];

    return `${diasSemana[fechaT.getDay()]} • ${fechaFormateada}`;
}

function obtenerHoraMarketplace(fecha) {

    if (!fecha) return "09:00";

    const fechaT = new Date(fecha);

    if (Number.isNaN(fechaT.getTime())) {
        return "09:00";
    }

    return fechaT.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

function obtenerDiaMesMarketplace(fecha) {

    if (!fecha) {
        return {
            dia: "—",
            mes: "—"
        };
    }

    const fechaT = new Date(fecha);

    if (Number.isNaN(fechaT.getTime())) {
        return {
            dia: "—",
            mes: "—"
        };
    }

    const meses = [
        "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
        "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
    ];

    return {
        dia: String(fechaT.getDate()),
        mes: meses[fechaT.getMonth()]
    };
}


///////////////////////////////////////////////////////////
// RENDER MARKETPLACE
///////////////////////////////////////////////////////////

function renderizarDisponibles() {

    const contenedor =
        document.getElementById("contenedor-disponibles");

    const badge =
        document.getElementById("badge-disponibles");

    const banner =
        document.getElementById("banner-contador-trabajos");

    const trabajos =
        Array.isArray(state.disponibles)
            ? state.disponibles
            : [];

    if (badge) {
        badge.textContent = trabajos.length;
    }

    if (banner) {
        banner.textContent = trabajos.length;
    }

    if (!contenedor) return;

    if (trabajos.length === 0) {

        contenedor.innerHTML = `
            <div class="col-span-1 lg:col-span-2 text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                <i data-lucide="satellite" class="w-14 h-14 text-gray-300 mx-auto mb-4"></i>
                <h4 class="text-xl font-bold text-gray-700 mb-2">
                    Buscando nuevas rutas
                </h4>
                <p class="text-gray-400 font-medium text-sm">
                    En cuanto un cliente reserve aparecerá aquí automáticamente.
                </p>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }

        return;
    }


    ///////////////////////////////////////////////////////
    // AGRUPAR POR FECHA
    ///////////////////////////////////////////////////////

    const gruposPorFecha = {};

    trabajos.forEach(trabajo => {

        const titulo =
            crearEncabezadoFechaMarketplace(trabajo.fecha);

        if (!gruposPorFecha[titulo]) {
            gruposPorFecha[titulo] = [];
        }

        gruposPorFecha[titulo].push(trabajo);
    });


    ///////////////////////////////////////////////////////
    // COMPROBAR API UTILIDADES
    ///////////////////////////////////////////////////////

    if (!apiTransportistaDisponible()) {

        console.error(
            "❌ Marketplace: utils.js no ha expuesto todavía la API Transportista.",
            window.Transportista
        );

        contenedor.innerHTML = `
            <div class="col-span-1 lg:col-span-2 text-center py-12 bg-white rounded-3xl border border-red-100">
                <h4 class="text-lg font-bold text-red-600 mb-2">
                    Error cargando los datos de las mudanzas
                </h4>
                <p class="text-sm text-slate-500">
                    No se ha cargado correctamente el módulo de utilidades.
                </p>
            </div>
        `;

        return;
    }


    ///////////////////////////////////////////////////////
    // GENERAR HTML
    ///////////////////////////////////////////////////////

    let htmlFinal = "";

    for (const [fechaTitulo, trabajosFecha] of Object.entries(gruposPorFecha)) {

        htmlFinal += `
            <div class="col-span-1 lg:col-span-2 flex items-center gap-2.5 mt-6 mb-3 no-print">
                <span class="text-xs font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100/70 font-sans flex items-center gap-1.5">
                    <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                    ${escapeHtmlMarketplace(fechaTitulo)}
                </span>
                <span class="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    ${trabajosFecha.length} trabajos disponibles
                </span>
                <div class="flex-1 border-t border-slate-200/60"></div>
            </div>
        `;


        trabajosFecha.forEach(t => {

            const esMudanzaTotal =
                String(t.tipo_servicio || "")
                    .toLowerCase()
                    .includes("total");

            const fechaVisual =
                obtenerDiaMesMarketplace(t.fecha);

            const horaServicio =
                obtenerHoraMarketplace(t.fecha);

            //////////////////////////////////////////////////
            // INVENTARIO
            //////////////////////////////////////////////////

            const numArticulos =
                window.Transportista.getTotalArticulos(
                    t.inventario
                );

            const totalM3 =
                window.Transportista.getTotalM3(
                    t.inventario
                );

            const m3Texto =
                window.Transportista.formatM3(
                    totalM3
                );


            //////////////////////////////////////////////////
            // ACCESOS
            //////////////////////////////////////////////////

            const accesos =
                window.Transportista.getAccesos(t) || {};

            const txtOrigAcceso =
                accesos.recogida || "—";

            const txtDestAcceso =
                accesos.entrega || "—";


            //////////////////////////////////////////////////
            // FOTOS
            //////////////////////////////////////////////////

            const numFotos =
                contarFotosMarketplace(t.urls_fotos);

            const serviciosContratadosCount =
                esMudanzaTotal ? 6 : 1;


            //////////////////////////////////////////////////
            // DATOS SEGUROS PARA HTML
            //////////////////////////////////////////////////

            const id =
                Number(t.id);

            const origen =
                escapeHtmlMarketplace(t.origen || "—");

            const destino =
                escapeHtmlMarketplace(t.destino || "—");

            const tituloOrigen =
                escapeHtmlMarketplace(t.origen || "—");

            const tituloDestino =
                escapeHtmlMarketplace(t.destino || "—");

            const km =
                escapeHtmlMarketplace(t.km ?? "?");

            const precio =
                escapeHtmlMarketplace(t.preciototal || "—");


            //////////////////////////////////////////////////
            // TARJETA
            //////////////////////////////////////////////////

            htmlFinal += `
                <div
                    onclick="verDetalleMudanza(${id})"
                    class="tarjeta-mudanza-premium col-span-1 lg:col-span-2 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 relative group cursor-pointer"
                >

                    <!-- COLUMNA 1: FECHA -->
                    <div class="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 min-w-[75px] flex-shrink-0 select-none">

                        <span class="text-3xl font-black text-slate-800 leading-none tracking-tight">
                            ${fechaVisual.dia}
                        </span>

                        <span class="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
                            ${fechaVisual.mes}
                        </span>

                        <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mt-3.5 font-mono">
                            ${horaServicio}
                        </span>
                    </div>


                    <!-- COLUMNA 2: RUTA -->
                    <div class="flex-1 space-y-3.5 w-full">

                        <div>
                            <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border tracking-wide font-sans ${
                                esMudanzaTotal
                                    ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                                    : "text-blue-600 bg-blue-50 border-blue-100"
                            }">
                                ${esMudanzaTotal ? "MUDANZA TOTAL" : "MUDANZA ESTÁNDAR"}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-3 relative w-full">

                            <!-- ORIGEN -->
                            <div class="space-y-0.5 text-left">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Origen
                                </span>

                                <p
                                    class="text-sm font-bold text-slate-800 leading-tight truncate max-w-[180px]"
                                    title="${tituloOrigen}"
                                >
                                    ${origen}
                                </p>

                                <p class="text-xs text-slate-400 font-medium">
                                    ${escapeHtmlMarketplace(txtOrigAcceso)}
                                </p>
                            </div>


                            <!-- CENTRO -->
                            <div class="hidden md:flex flex-col items-center justify-center text-center px-1">

                                <span class="text-xs font-bold text-slate-600 font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded mb-0.5">
                                    ${km} km
                                </span>

                                <div class="w-full flex items-center justify-center relative">
                                    <div class="w-full border-t border-dashed border-slate-300"></div>
                                    <div class="absolute bg-white px-1.5 text-slate-400">
                                        <i data-lucide="truck" class="w-3.5 h-3.5 text-blue-500"></i>
                                    </div>
                                </div>
                            </div>


                            <!-- DESTINO -->
                            <div class="space-y-0.5 text-left md:text-right">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Destino
                                </span>

                                <p
                                    class="text-sm font-bold text-slate-800 leading-tight truncate max-w-[180px] md:ml-auto"
                                    title="${tituloDestino}"
                                >
                                    ${destino}
                                </p>

                                <p class="text-xs text-red-500 font-bold">
                                    ${escapeHtmlMarketplace(txtDestAcceso)}
                                </p>
                            </div>
                        </div>


                        <!-- CONTADORES -->
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-50 text-xs text-slate-500 font-medium">

                            <span class="flex items-center gap-1.5">
                                <i data-lucide="box" class="w-3.5 h-3.5 text-slate-400"></i>
                                <strong>${numArticulos}</strong> artículos
                                <span class="text-slate-300">·</span>
                                <strong>${m3Texto}</strong>
                            </span>

                            <span class="flex items-center gap-1.5">
                                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-400"></i>
                                <strong>${serviciosContratadosCount}</strong> servicios
                            </span>

                            <span class="flex items-center gap-1.5">
                                <i data-lucide="image" class="w-3.5 h-3.5 text-slate-400"></i>
                                <strong>${numFotos}</strong> fotos
                            </span>

                            <span class="flex items-center gap-1.5">
                                <i data-lucide="message-square" class="w-3.5 h-3.5 text-slate-400"></i>
                                Observaciones
                            </span>
                        </div>
                    </div>


                    <!-- COLUMNA 3: OPERARIOS Y CARGA -->
                    <div class="flex flex-row md:flex-col justify-between md:justify-center items-start md:items-end gap-1.5 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 min-w-[120px] flex-shrink-0 w-full md:w-auto">

                        <div class="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i>
                            <span>2 operarios</span>
                        </div>

                        <div class="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <i data-lucide="package-open" class="w-3.5 h-3.5 text-slate-400"></i>
                            <span>${m3Texto}</span>
                        </div>

                        <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium font-mono">
                            <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-300"></i>
                            <span>6h estimadas</span>
                        </div>
                    </div>


                    <!-- COLUMNA 4: COBRO -->
                    <div class="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 min-w-[110px] flex-shrink-0 text-right w-full md:w-auto">

                        <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 hidden md:block">
                            TU COBRO
                        </span>

                        <div class="flex items-baseline gap-0.5">
                            <span class="text-xl font-black text-blue-600 tracking-tight leading-none">
                                ${precio}
                            </span>
                            <span class="text-[9px] font-bold text-slate-400">
                                IVA incl.
                            </span>
                        </div>

                        <span class="inline-block text-[10px] font-bold text-blue-600 bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded mt-2 font-sans select-none">
                            Pago en 48h
                        </span>
                    </div>


                    <!-- FLECHA -->
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-500 transition-colors hidden lg:block">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </div>

                </div>
            `;
        });
    }

    contenedor.innerHTML = htmlFinal;

    if (window.lucide) {
        lucide.createIcons();
    }
}


///////////////////////////////////////////////////////////
// ACEPTAR MUDANZA
///////////////////////////////////////////////////////////

async function procesarAceptacion(id) {

    const modalContentMarketplace =
        document.getElementById("modal-content");

    const actionModalMarketplace =
        document.getElementById("action-modal");

    if (!modalContentMarketplace) {
        console.error("❌ No existe #modal-content");
        return;
    }

    modalContentMarketplace.innerHTML = `
        <i data-lucide="loader-2" class="w-10 h-10 animate-spin mx-auto text-blue-600 mb-3"></i>
        <p class="text-gray-600 font-medium text-sm">
            Asignando mudanza...
        </p>
    `;

    if (window.lucide) {
        lucide.createIcons();
    }

    try {

        const cliente =
            window.dbClient || dbClient;

        const { data, error } = await cliente
            .from("mudanzas")
            .update({
                estado: "Transportista asignado",
                transportista_id: currentUserId,
                bloqueada: true,
                fecha_asignacion: new Date().toISOString()
            })
            .eq("id", id)
            .eq("estado", "Pendiente de asignación")
            .eq("publicada_marketplace", true)
            .eq("bloqueada", false)
            .is("transportista_id", null)
            .select();

        if (error) {
            console.error("❌ Error al aceptar mudanza:", error);

            alert(
                "No se pudo asignar la mudanza.\n\n" +
                "Puede que otro transportista la haya aceptado antes."
            );

            if (actionModalMarketplace) {
                actionModalMarketplace.classList.add("hidden");
            }

            await cargarTrabajosDisponibles();
            return;
        }

        if (!data || data.length === 0) {

            alert(
                "Esta mudanza ya no está disponible.\n\n" +
                "Es posible que otro transportista la haya aceptado."
            );

            if (actionModalMarketplace) {
                actionModalMarketplace.classList.add("hidden");
            }

            await cargarTrabajosDisponibles();
            return;
        }

        console.log(
            "✅ Mudanza asignada correctamente:",
            data[0]
        );

        if (actionModalMarketplace) {
            actionModalMarketplace.classList.add("hidden");
        }

        if (typeof cerrarDrawer === "function") {
            cerrarDrawer();
        }

        if (typeof cargarMisMudanzas === "function") {
            await cargarMisMudanzas();
        }

        await cargarTrabajosDisponibles();

        if (typeof cambiarTab === "function") {
            cambiarTab("mis-mudanzas");
        }

    } catch (error) {

        console.error("❌ Excepción aceptando mudanza:", error);

        alert(
            "Se produjo un error al aceptar la mudanza.\n\n" +
            (error?.message || "Error desconocido")
        );

        if (actionModalMarketplace) {
            actionModalMarketplace.classList.add("hidden");
        }
    }
}


///////////////////////////////////////////////////////////
// API GLOBAL
///////////////////////////////////////////////////////////

window.cargarTrabajosDisponibles =
    cargarTrabajosDisponibles;

window.renderizarDisponibles =
    renderizarDisponibles;

window.procesarAceptacion =
    procesarAceptacion;

console.log("✅ Marketplace cargado correctamente");
