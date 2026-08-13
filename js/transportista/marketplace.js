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

            htmlFinal +=
    window.Transportista.Tarjetas.crearTarjetaMarketplace(t);
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
