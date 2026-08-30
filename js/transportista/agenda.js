/**
 * ==========================================================
 * RODAX Marketplace
 * Archivo : js/transportista/agenda.js
 * Módulo  : Mi Agenda
 * ==========================================================
 *
 * Funciones:
 * - Próximos servicios
 * - Historial de servicios
 * - Franja horaria de recogida
 * - Accesos origen / destino
 * - Estado real de la mudanza
 * - Apertura del Drawer existente
 *
 * IMPORTANTE:
 * Este archivo no contiene etiquetas <script>.
 * La carga se hace desde panel-transportista.html.
 * ==========================================================
 */
 
(function (window) {
 
    "use strict";
 
    /* ======================================================
       CONFIGURACIÓN
       ====================================================== */
 
    const TAB_ID = "tab-mi-agenda";
    const CONTENEDOR_ID = "agenda-contenido";
 
    let cargando = false;
    let observadorIniciado = false;
 
    /* ======================================================
       UTILIDADES
       ====================================================== */
 
    function escaparHTML(valor) {
 
        if (valor === null || valor === undefined) {
            return "";
        }
 
        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
 
    function obtenerFecha(mudanza) {
 
        return (
            mudanza?.fecha ||
            mudanza?.fecha_servicio ||
            null
        );
    }
 
    function formatearFecha(fecha) {
 
        if (!fecha) {
            return "Fecha pendiente";
        }
 
        const partes = String(fecha).split("-");
 
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
 
        return escaparHTML(fecha);
    }
 
    function obtenerDia(fecha) {
 
        if (!fecha) {
            return "—";
        }
 
        const partes = String(fecha).split("-");
 
        return partes.length === 3
            ? partes[2]
            : "—";
    }
 
    function obtenerMes(fecha) {
 
        if (!fecha) {
            return "---";
        }
 
        const partes = String(fecha).split("-");
 
        if (partes.length !== 3) {
            return "---";
        }
 
        const meses = [
            "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
            "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
        ];
 
        return meses[Number(partes[1]) - 1] || "---";
    }
 
    function obtenerFranja(mudanza) {
 
        return (
            mudanza?.franja_horaria_recogida ||
            "Horario pendiente"
        );
    }
 
    function obtenerTipoServicio(mudanza) {
 
        const tipo = String(
            mudanza?.tipo_servicio || ""
        ).toLowerCase();
 
        return tipo.includes("total")
            ? "Mudanza Total"
            : "Mudanza Estándar";
    }
 
    function convertirFechaComparacion(fecha) {
 
        if (!fecha) {
            return Number.MAX_SAFE_INTEGER;
        }
 
        const tiempo = new Date(
            `${fecha}T00:00:00`
        ).getTime();
 
        return Number.isNaN(tiempo)
            ? Number.MAX_SAFE_INTEGER
            : tiempo;
    }
 
    /* ======================================================
       ACCESOS
       ====================================================== */
 
    function normalizarAscensor(valor) {
 
        if (!valor) {
            return "";
        }
 
        const texto = String(valor)
            .trim()
            .toLowerCase();
 
        if (texto.includes("sin")) {
            return "Sin ascensor";
        }
 
        if (texto.includes("con")) {
            return "Con ascensor";
        }
 
        return String(valor).trim();
    }
 
    function formatearAcceso(ascensor, piso) {
 
        const ascensorTexto =
            normalizarAscensor(ascensor);
 
        const tienePiso =
            piso !== null &&
            piso !== undefined &&
            String(piso).trim() !== "";
 
        const pisoNumero =
            tienePiso ? Number(piso) : NaN;
 
        /*
         * REGLA:
         * Piso 0 = solamente "Un Bajo".
         */
        if (
            Number.isFinite(pisoNumero) &&
            pisoNumero === 0
        ) {
            return "Un Bajo";
        }
 
        if (
            ascensorTexto &&
            Number.isFinite(pisoNumero)
        ) {
            return `${ascensorTexto} · Piso ${pisoNumero}`;
        }
 
        if (ascensorTexto) {
            return ascensorTexto;
        }
 
        if (Number.isFinite(pisoNumero)) {
            return pisoNumero === 0
                ? "Un Bajo"
                : `Piso ${pisoNumero}`;
        }
 
        return "Acceso por confirmar";
    }
 
    function obtenerAccesoOrigen(mudanza) {
 
        /*
         * Columnas nuevas de Supabase.
         */
        if (
            mudanza?.ascensor_origen !== undefined ||
            mudanza?.piso_origen !== undefined
        ) {
            return formatearAcceso(
                mudanza.ascensor_origen,
                mudanza.piso_origen
            );
        }
 
        /*
         * Compatibilidad con reservas antiguas.
         */
        const texto = String(
            mudanza?.ascensor || ""
        );
 
        const coincidencia = texto.match(
            /recogida:\s*(.*?)(?:\s*\||$)/i
        );
 
        if (coincidencia) {
            return coincidencia[1].trim();
        }
 
        return "Acceso por confirmar";
    }
 
    function obtenerAccesoDestino(mudanza) {
 
        /*
         * Columnas nuevas de Supabase.
         */
        if (
            mudanza?.ascensor_destino !== undefined ||
            mudanza?.piso_destino !== undefined
        ) {
            return formatearAcceso(
                mudanza.ascensor_destino,
                mudanza.piso_destino
            );
        }
 
        /*
         * Compatibilidad con reservas antiguas.
         */
        const texto = String(
            mudanza?.ascensor || ""
        );
 
        const coincidencia = texto.match(
            /entrega:\s*(.*?)(?:\s*\||$)/i
        );
 
        if (coincidencia) {
            return coincidencia[1].trim();
        }
 
        return "Acceso por confirmar";
    }
 
    /* ======================================================
       ESTADOS
       ====================================================== */
 
    function obtenerEstado(mudanza) {
 
        const estado = String(
            mudanza?.estado || ""
        ).trim();
 
        const normalizado = estado.toLowerCase();
 
        if (
            normalizado === "completada" ||
            normalizado === "finalizada" ||
            normalizado === "mudanza finalizada"
        ) {
            return {
                codigo: "finalizada",
                titulo: "Completada",
                clase:
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
            };
        }
 
        if (normalizado.includes("en ruta")) {
            return {
                codigo: "en_ruta",
                titulo: "En ruta",
                clase:
                    "bg-sky-50 text-sky-700 border-sky-200"
            };
        }
 
        if (
            normalizado.includes("transportista asignado") ||
            normalizado === "asignada"
        ) {
            return {
                codigo: "transportista_asignado",
                titulo: "Transportista asignado",
                clase:
                    "bg-violet-50 text-violet-700 border-violet-200"
            };
        }
 
        if (
            normalizado.includes("pendiente de asignación") ||
            normalizado.includes("pendiente de asignacion")
        ) {
            return {
                codigo: "pendiente_asignacion",
                titulo: "Pendiente de asignación",
                clase:
                    "bg-blue-50 text-blue-700 border-blue-200"
            };
        }
 
        if (normalizado.includes("pago confirmado")) {
            return {
                codigo: "pago_confirmado",
                titulo: "Pago confirmado",
                clase:
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
            };
        }
 
        if (normalizado.includes("pendiente de pago")) {
            return {
                codigo: "pendiente_pago",
                titulo: "Pendiente de pago",
                clase:
                    "bg-amber-50 text-amber-700 border-amber-200"
            };
        }
 
        return {
            codigo: "desconocido",
            titulo: estado || "Estado pendiente",
            clase:
                "bg-slate-50 text-slate-600 border-slate-200"
        };
    }
 
    function esFinalizada(mudanza) {
 
        const estado = String(
            mudanza?.estado || ""
        )
            .trim()
            .toLowerCase();
 
        return (
            estado === "completada" ||
            estado === "finalizada" ||
            estado === "mudanza finalizada"
        );
    }
 
    /* ======================================================
       CONTENEDOR
       ====================================================== */
 
    function obtenerContenedorAgenda() {
 
        /*
         * 1. Preferido: #agenda-contenido
         */
        let contenedor =
            document.getElementById(CONTENEDOR_ID);
 
        if (contenedor) {
            return contenedor;
        }
 
        /*
         * 2. Respaldo: dentro de #tab-mi-agenda.
         *
         * Esto evita que la Agenda quede en blanco si
         * el HTML no tiene todavía #agenda-contenido.
         */
        const tab =
            document.getElementById(TAB_ID);
 
        if (!tab) {
            return null;
        }
 
        /*
         * Intentar reutilizar un contenedor existente.
         */
        contenedor = tab.querySelector(
            "[data-rodax-agenda]"
        );
 
        if (contenedor) {
            return contenedor;
        }
 
        /*
         * Crear automáticamente el contenedor.
         */
        contenedor = document.createElement("div");
 
        contenedor.id = CONTENEDOR_ID;
        contenedor.setAttribute(
            "data-rodax-agenda",
            "true"
        );
 
        contenedor.className =
            "w-full mt-6 pb-10";
 
        tab.appendChild(contenedor);
 
        return contenedor;
    }
 
    /* ======================================================
       SUPABASE / USUARIO
       ====================================================== */
 
    function obtenerClienteSupabase() {
 
        if (
            window.dbClient &&
            typeof window.dbClient.from === "function"
        ) {
            return window.dbClient;
        }
 
        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {
            return window.supabaseClient;
        }
 
        if (
            window.supabase &&
            typeof window.supabase.from === "function"
        ) {
            return window.supabase;
        }
 
        return null;
    }
 
    async function obtenerTransportistaId() {
 
        if (
            window.Transportista &&
            window.Transportista.currentUserId
        ) {
            return window.Transportista.currentUserId;
        }
 
        if (window.currentUserId) {
            return window.currentUserId;
        }
 
        const cliente = obtenerClienteSupabase();
 
        if (
            cliente &&
            cliente.auth &&
            typeof cliente.auth.getUser === "function"
        ) {
            const {
                data,
                error
            } = await cliente.auth.getUser();
 
            if (
                !error &&
                data?.user?.id
            ) {
                return data.user.id;
            }
        }
 
        return null;
    }
 
    /* ======================================================
       CONSULTAR MUDANZAS
       ====================================================== */
 
    async function obtenerMudanzas() {
 
        const cliente =
            obtenerClienteSupabase();
 
        if (!cliente) {
            throw new Error(
                "No se encontró el cliente de Supabase (dbClient)."
            );
        }
 
        const transportistaId =
            await obtenerTransportistaId();
 
        if (!transportistaId) {
            throw new Error(
                "No se pudo identificar al transportista."
            );
        }
 
        const respuesta =
            await cliente
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
 
        const {
            data,
            error
        } = respuesta;
 
        if (error) {
            throw error;
        }
 
        return Array.isArray(data)
            ? data
            : [];
    }
 
    /* ======================================================
       TOTAL ARTÍCULOS
       ====================================================== */
 
    function obtenerTotalArticulos(mudanza) {
 
        let inventario =
            mudanza?.inventario;
 
        if (!inventario) {
            return 0;
        }
 
        try {
 
            if (typeof inventario === "string") {
                inventario = JSON.parse(inventario);
            }
 
        } catch (error) {
            return 0;
        }
 
        if (!Array.isArray(inventario)) {
            return 0;
        }
 
        return inventario.reduce(
            function (total, item) {
 
                return (
                    total +
                    (
                        parseInt(
                            item?.cantidad,
                            10
                        ) || 0
                    )
                );
 
            },
            0
        );
    }
 
    /* ======================================================
       TARJETA
       ====================================================== */
 
    function crearTarjeta(mudanza, historial) {
 
        const estado =
            obtenerEstado(mudanza);
 
        const fecha =
            obtenerFecha(mudanza);
 
        const franja =
            obtenerFranja(mudanza);
 
        const tipo =
            obtenerTipoServicio(mudanza);
 
        const accesoOrigen =
            obtenerAccesoOrigen(mudanza);
 
        const accesoDestino =
            obtenerAccesoDestino(mudanza);
 
        const precio =
    window.Transportista.getPrecioTransportista(
        mudanza
    ) || "—";
 
        const volumen =
            mudanza?.volumen || "—";
 
        const kilometros =
            mudanza?.km !== undefined &&
            mudanza?.km !== null
                ? `${mudanza.km} km`
                : "—";
 
        const articulos =
            obtenerTotalArticulos(mudanza);
 
        const claseHistorial =
            historial ? "opacity-95" : "";
 
        const id =
            escaparHTML(mudanza?.id);
 
        return `
            <article
                class="
                    ${claseHistorial}
                    bg-white
                    border border-slate-200
                    rounded-2xl
                    shadow-sm
                    hover:shadow-md
                    hover:border-blue-200
                    transition-all duration-200
                    overflow-hidden
                "
            >
 
                <div class="p-5">
 
                    <div
                        class="
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-3
                            mb-5
                        "
                    >
 
                        <div class="flex items-center gap-3">
 
                            <div
                                class="
                                    w-12 h-12
                                    rounded-xl
                                    bg-blue-50
                                    flex items-center justify-center
                                    text-blue-700
                                    font-black
                                "
                            >
                                <span class="text-lg">
                                    ${obtenerDia(fecha)}
                                </span>
                            </div>
 
                            <div>
 
                                <div
                                    class="
                                        text-xs
                                        uppercase
                                        tracking-wider
                                        font-bold
                                        text-slate-400
                                    "
                                >
                                    ${obtenerMes(fecha)}
                                </div>
 
                                <div
                                    class="
                                        text-sm
                                        font-bold
                                        text-slate-800
                                    "
                                >
                                    ${formatearFecha(fecha)}
                                </div>
 
                            </div>
 
                        </div>
 
                        <div
                            class="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                            "
                        >
 
                            <span
                                class="
                                    inline-flex items-center
                                    px-3 py-1.5
                                    rounded-full
                                    text-[11px]
                                    font-black
                                    border
                                    ${estado.clase}
                                "
                            >
                                ${escaparHTML(
                                    estado.titulo
                                )}
                            </span>
 
                            <span
                                class="
                                    inline-flex items-center
                                    px-3 py-1.5
                                    rounded-full
                                    text-[11px]
                                    font-black
                                    border
                                    border-blue-200
                                    bg-blue-50
                                    text-blue-700
                                "
                            >
                                ${escaparHTML(tipo)}
                            </span>
 
                        </div>
 
                    </div>
 
                    <div
                        class="
                            mb-4
                            rounded-xl
                            border border-amber-200
                            bg-amber-50
                            px-4 py-3
                            flex items-center
                            gap-3
                        "
                    >
 
                        <div
                            class="
                                w-9 h-9
                                rounded-lg
                                bg-white
                                flex items-center justify-center
                                text-amber-600
                                border border-amber-200
                            "
                        >
                            <i
                                data-lucide="clock-3"
                                class="w-4 h-4"
                            ></i>
                        </div>
 
                        <div>
 
                            <div
                                class="
                                    text-[10px]
                                    uppercase
                                    tracking-wider
                                    font-black
                                    text-amber-700
                                "
                            >
                                Horario de recogida
                            </div>
 
                            <div
                                class="
                                    text-sm
                                    font-black
                                    text-slate-800
                                "
                            >
                                ${escaparHTML(franja)}
                            </div>
 
                        </div>
 
                    </div>
 
                    <div
                        class="
                            grid
                            grid-cols-1
                            lg:grid-cols-[1fr_auto_1fr]
                            gap-4
                            items-stretch
                        "
                    >
 
                        <div
                            class="
                                rounded-xl
                                border border-blue-100
                                bg-blue-50/50
                                p-4
                            "
                        >
 
                            <div
                                class="
                                    text-[10px]
                                    uppercase
                                    tracking-wider
                                    font-black
                                    text-blue-500
                                    mb-1.5
                                "
                            >
                                Origen
                            </div>
 
                            <div
                                class="
                                    text-sm
                                    font-black
                                    text-slate-800
                                    leading-snug
                                "
                            >
                                ${escaparHTML(
                                    mudanza?.origen ||
                                    "Origen pendiente"
                                )}
                            </div>
 
                            <div
                                class="
                                    mt-2
                                    text-xs
                                    font-bold
                                    text-slate-500
                                "
                            >
                                ${escaparHTML(
                                    accesoOrigen
                                )}
                            </div>
 
                        </div>
 
                        <div
                            class="
                                hidden
                                lg:flex
                                items-center
                                justify-center
                            "
                        >
 
                            <div
                                class="
                                    w-10 h-10
                                    rounded-full
                                    bg-white
                                    border border-slate-200
                                    shadow-sm
                                    flex items-center justify-center
                                    text-blue-600
                                "
                            >
                                <i
                                    data-lucide="truck"
                                    class="w-4 h-4"
                                ></i>
                            </div>
 
                        </div>
 
                        <div
                            class="
                                rounded-xl
                                border border-orange-100
                                bg-orange-50/50
                                p-4
                            "
                        >
 
                            <div
                                class="
                                    text-[10px]
                                    uppercase
                                    tracking-wider
                                    font-black
                                    text-orange-500
                                    mb-1.5
                                "
                            >
                                Destino
                            </div>
 
                            <div
                                class="
                                    text-sm
                                    font-black
                                    text-slate-800
                                    leading-snug
                                "
                            >
                                ${escaparHTML(
                                    mudanza?.destino ||
                                    "Destino pendiente"
                                )}
                            </div>
 
                            <div
                                class="
                                    mt-2
                                    text-xs
                                    font-bold
                                    text-slate-500
                                "
                            >
                                ${escaparHTML(
                                    accesoDestino
                                )}
                            </div>
 
                        </div>
 
                    </div>
 
                    <div
                        class="
                            mt-4 pt-4
                            border-t border-slate-100
                            flex flex-wrap
                            gap-x-5 gap-y-2
                            text-xs
                            font-semibold
                            text-slate-500
                        "
                    >
 
                        <span
                            class="
                                inline-flex
                                items-center
                                gap-1.5
                            "
                        >
                            <i
                                data-lucide="route"
                                class="w-3.5 h-3.5 text-slate-400"
                            ></i>
                            ${escaparHTML(kilometros)}
                        </span>
 
                        <span
                            class="
                                inline-flex
                                items-center
                                gap-1.5
                            "
                        >
                            <i
                                data-lucide="box"
                                class="w-3.5 h-3.5 text-slate-400"
                            ></i>
                            ${escaparHTML(articulos)} art.
                        </span>
 
                        <span
                            class="
                                inline-flex
                                items-center
                                gap-1.5
                            "
                        >
                            <i
                                data-lucide="ruler"
                                class="w-3.5 h-3.5 text-slate-400"
                            ></i>
                            ${escaparHTML(volumen)}
                        </span>
 
                        ${
                            mudanza?.numero_reserva
                                ? `
                                    <span
                                        class="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                        "
                                    >
                                        <i
                                            data-lucide="hash"
                                            class="w-3.5 h-3.5 text-slate-400"
                                        ></i>
 
                                        ${escaparHTML(
                                            mudanza.numero_reserva
                                        )}
                                    </span>
                                `
                                : ""
                        }
 
                    </div>
 
                    <div
                        class="
                            mt-5
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-3
                        "
                    >
 
                        <div>
 
                            <div
                                class="
                                    text-[10px]
                                    uppercase
                                    tracking-wider
                                    font-bold
                                    text-slate-400
                                "
                            >
                                COBRO DEL TRANSPORTISTA
                            </div>
 
                            <div
                                class="
                                    text-xl
                                    font-black
                                    text-blue-600
                                "
                            >
                                ${escaparHTML(precio)}
                            </div>
 
                        </div>
 
                        <button
                            type="button"
                            class="
                                inline-flex
                                items-center
                                gap-2
                                px-5 py-3
                                rounded-xl
                                bg-blue-600
                                hover:bg-blue-700
                                text-white
                                text-sm
                                font-black
                                shadow-sm
                                transition-colors
                            "
                            data-agenda-id="${id}"
                        >
                            Ver detalles
 
                            <i
                                data-lucide="arrow-right"
                                class="w-4 h-4"
                            ></i>
                        </button>
 
                    </div>
 
                </div>
 
            </article>
        `;
    }
 
    /* ======================================================
       RENDER
       ====================================================== */
 
    function renderAgenda(mudanzas) {
 
        const contenedor =
            obtenerContenedorAgenda();
 
        if (!contenedor) {
            console.error(
                "[RODAX Agenda] No existe #tab-mi-agenda."
            );
            return;
        }
 
        const lista =
            Array.isArray(mudanzas)
                ? mudanzas
                : [];
 
        const proximas =
            lista
                .filter(
                    m => !esFinalizada(m)
                )
                .sort(
                    (a, b) =>
                        convertirFechaComparacion(
                            obtenerFecha(a)
                        ) -
                        convertirFechaComparacion(
                            obtenerFecha(b)
                        )
                );
 
        const historial =
            lista
                .filter(
                    m => esFinalizada(m)
                )
                .sort(
                    (a, b) =>
                        convertirFechaComparacion(
                            obtenerFecha(b)
                        ) -
                        convertirFechaComparacion(
                            obtenerFecha(a)
                        )
                );
 
        let html = "";
 
        /* ==================================================
           PRÓXIMOS
           ================================================== */
 
        html += `
            <div class="mb-10">
 
                <div
                    class="
                        flex flex-wrap
                        items-end
                        justify-between
                        gap-3
                        mb-4
                    "
                >
 
                    <div>
 
                        <div
                            class="
                                text-xs
                                uppercase
                                tracking-wider
                                font-black
                                text-blue-600
                            "
                        >
                            Próximos servicios
                        </div>
 
                        <h3
                            class="
                                text-xl
                                font-black
                                text-slate-800
                                mt-1
                            "
                        >
                            Tu agenda operativa
                        </h3>
 
                    </div>
 
                    <div
                        class="
                            text-xs
                            font-bold
                            text-slate-400
                        "
                    >
                        ${proximas.length}
                        servicio${proximas.length === 1 ? "" : "s"}
                    </div>
 
                </div>
        `;
 
        if (proximas.length === 0) {
 
            html += `
                <div
                    class="
                        rounded-2xl
                        border border-dashed
                        border-slate-300
                        bg-slate-50
                        p-8
                        text-center
                    "
                >
 
                    <i
                        data-lucide="calendar-check-2"
                        class="
                            w-10 h-10
                            mx-auto
                            mb-3
                            text-slate-400
                        "
                    ></i>
 
                    <div
                        class="
                            font-black
                            text-slate-700
                        "
                    >
                        No tienes servicios próximos
                    </div>
 
                    <div
                        class="
                            text-sm
                            text-slate-500
                            mt-1
                        "
                    >
                        Cuando aceptes una mudanza,
                        aparecerá aquí.
                    </div>
 
                </div>
            `;
 
        } else {
 
            html += `
                <div class="space-y-4">
            `;
 
            proximas.forEach(
                mudanza => {
                    html += crearTarjeta(
                        mudanza,
                        false
                    );
                }
            );
 
            html += `
                </div>
            `;
        }
 
        html += `
            </div>
        `;
 
        /* ==================================================
           HISTORIAL
           ================================================== */
 
        html += `
            <div>
 
                <div
                    class="
                        flex flex-wrap
                        items-end
                        justify-between
                        gap-3
                        mb-4
                    "
                >
 
                    <div>
 
                        <div
                            class="
                                text-xs
                                uppercase
                                tracking-wider
                                font-black
                                text-slate-500
                            "
                        >
                            Historial de servicios
                        </div>
 
                        <h3
                            class="
                                text-xl
                                font-black
                                text-slate-800
                                mt-1
                            "
                        >
                            Servicios completados
                        </h3>
 
                    </div>
 
                    <div
                        class="
                            text-xs
                            font-bold
                            text-slate-400
                        "
                    >
                        ${historial.length}
                        servicio${historial.length === 1 ? "" : "s"}
                    </div>
 
                </div>
        `;
 
        if (historial.length === 0) {
 
            html += `
                <div
                    class="
                        rounded-2xl
                        border border-dashed
                        border-slate-300
                        bg-slate-50
                        p-8
                        text-center
                    "
                >
 
                    <i
                        data-lucide="archive"
                        class="
                            w-9 h-9
                            mx-auto
                            mb-3
                            text-slate-400
                        "
                    ></i>
 
                    <div
                        class="
                            font-black
                            text-slate-700
                        "
                    >
                        Todavía no hay servicios completados
                    </div>
 
                </div>
            `;
 
        } else {
 
            html += `
                <div class="space-y-4">
            `;
 
            historial.forEach(
                mudanza => {
                    html += crearTarjeta(
                        mudanza,
                        true
                    );
                }
            );
 
            html += `
                </div>
            `;
        }
 
        html += `
            </div>
        `;
 
        contenedor.innerHTML = html;
 
        /* ==================================================
           BOTONES
           ================================================== */
 
        contenedor
            .querySelectorAll("[data-agenda-id]")
            .forEach(
                function (boton) {
 
                    boton.addEventListener(
                        "click",
                        function () {
 
                            const id =
                                boton.getAttribute(
                                    "data-agenda-id"
                                );
 
                            if (!id) {
                                return;
                            }
 
                            if (
                                typeof window.verDetalleMudanza ===
                                "function"
                            ) {
 
                                window.verDetalleMudanza(id);
                                return;
                            }
 
                            if (
                                typeof window.abrirDrawer ===
                                "function"
                            ) {
 
                                /*
                                 * Algunos proyectos usan
                                 * abrirDrawer(id).
                                 */
                                try {
                                    window.abrirDrawer(id);
                                } catch (error) {
                                    console.error(
                                        "[RODAX Agenda] Error abriendo drawer:",
                                        error
                                    );
                                }
 
                                return;
                            }
 
                            console.warn(
                                "[RODAX Agenda] No existe función global para abrir el Drawer.",
                                id
                            );
                        }
                    );
                }
            );
 
        if (
            window.lucide &&
            typeof window.lucide.createIcons ===
            "function"
        ) {
            window.lucide.createIcons();
        }
    }
 
    /* ======================================================
       CARGAR AGENDA
       ====================================================== */
 
    async function cargarAgenda() {
 
        if (cargando) {
            return;
        }
 
        const contenedor =
            obtenerContenedorAgenda();
 
        if (!contenedor) {
            return;
        }
 
        cargando = true;
 
        contenedor.innerHTML = `
            <div
                class="
                    py-12
                    text-center
                "
            >
 
                <div
                    class="
                        inline-flex
                        items-center
                        justify-center
                        w-12 h-12
                        rounded-xl
                        bg-blue-50
                        text-blue-600
                        mb-3
                    "
                >
                    <i
                        data-lucide="loader-circle"
                        class="
                            w-6 h-6
                            animate-spin
                        "
                    ></i>
                </div>
 
                <div
                    class="
                        text-sm
                        font-bold
                        text-slate-600
                    "
                >
                    Cargando agenda...
                </div>
 
            </div>
        `;
 
        if (
            window.lucide &&
            typeof window.lucide.createIcons ===
            "function"
        ) {
            window.lucide.createIcons();
        }
 
        try {
 
            const mudanzas =
                await obtenerMudanzas();
 
            console.log(
                "[RODAX Agenda] Mudanzas recibidas:",
                mudanzas.length,
                mudanzas
            );
 
            renderAgenda(mudanzas);
 
        } catch (error) {
 
            console.error(
                "[RODAX Agenda] Error:",
                error
            );
 
            contenedor.innerHTML = `
                <div
                    class="
                        rounded-2xl
                        border border-red-200
                        bg-red-50
                        p-6
                    "
                >
 
                    <div
                        class="
                            flex
                            items-start
                            gap-3
                        "
                    >
 
                        <i
                            data-lucide="triangle-alert"
                            class="
                                w-5 h-5
                                text-red-600
                                flex-shrink-0
                            "
                        ></i>
 
                        <div>
 
                            <div
                                class="
                                    font-black
                                    text-red-800
                                "
                            >
                                No se pudo cargar la agenda
                            </div>
 
                            <div
                                class="
                                    text-sm
                                    text-red-700
                                    mt-1
                                "
                            >
                                ${escaparHTML(
                                    error?.message ||
                                    "Error desconocido."
                                )}
                            </div>
 
                        </div>
 
                    </div>
 
                </div>
            `;
 
            if (
                window.lucide &&
                typeof window.lucide.createIcons ===
                "function"
            ) {
                window.lucide.createIcons();
            }
 
        } finally {
 
            cargando = false;
        }
    }
 
    /* ======================================================
       OBSERVAR CAMBIO DE PESTAÑA
       ====================================================== */
 
    function iniciarObservador() {
 
        if (observadorIniciado) {
            return;
        }
 
        observadorIniciado = true;
 
        const tab =
            document.getElementById(TAB_ID);
 
        if (!tab) {
 
            console.warn(
                "[RODAX Agenda] No se encontró #tab-mi-agenda al iniciar."
            );
 
            /*
             * El panel puede crear/mostrar el contenido
             * después. Hacemos una segunda comprobación.
             */
            setTimeout(
                function () {
 
                    observarTab();
 
                },
                500
            );
 
            return;
        }
 
        observarTab();
    }
 
    function observarTab() {
 
        const tab =
            document.getElementById(TAB_ID);
 
        if (!tab) {
            return;
        }
 
        /*
         * Crear el contenedor aunque aún esté oculto.
         */
        obtenerContenedorAgenda();
 
        /*
         * Si ya está visible, cargar.
         */
        if (
            !tab.classList.contains("hidden")
        ) {
            cargarAgenda();
        }
 
        /*
         * Detectar cuando el panel quita "hidden".
         */
        const observer =
            new MutationObserver(
                function () {
 
                    if (
                        !tab.classList.contains("hidden")
                    ) {
 
                        cargarAgenda();
                    }
 
                }
            );
 
        observer.observe(
            tab,
            {
                attributes: true,
                attributeFilter: ["class"]
            }
        );
 
        /*
         * También escuchar el evento interno
         * si el panel lo emite.
         */
        if (
            window.RODAX &&
            window.RODAX.events &&
            typeof window.RODAX.events.on ===
            "function"
        ) {
 
            window.RODAX.events.on(
                "router:changed",
                function (payload) {
 
                    const destino =
                        payload?.to ||
                        "";
 
                    if (
                        String(destino)
                            .toLowerCase()
                            .includes("agenda")
                    ) {
 
                        setTimeout(
                            cargarAgenda,
                            0
                        );
                    }
                }
            );
        }
    }
 
    /* ======================================================
       API GLOBAL
       ====================================================== */
 
    window.cargarAgenda =
        cargarAgenda;
 
    window.renderAgenda =
        renderAgenda;
 
    /* ======================================================
       INICIO
       ====================================================== */
 
    if (
        document.readyState === "loading"
    ) {
 
        document.addEventListener(
            "DOMContentLoaded",
            iniciarObservador,
            { once: true }
        );
 
    } else {
 
        iniciarObservador();
    }
 
    console.log(
        "✅ RODAX Agenda cargada correctamente"
    );
 
})(window);
