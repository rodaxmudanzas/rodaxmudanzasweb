/**
 * ==========================================================
 * RODAX Marketplace
 * Archivo : js/transportista/agenda.js
 * Módulo  : Mi Agenda
 * ----------------------------------------------------------
 * Funciones:
 *  - Próximos servicios
 *  - Historial de servicios
 *  - Franja horaria de recogida
 *  - Accesos origen / destino
 *  - Estado real de la mudanza
 *  - Apertura del Drawer existente
 * ==========================================================
 */

(function (window) {

    "use strict";


    /* ======================================================
       CONFIGURACIÓN
       ====================================================== */

    const SELECTOR_CONTENEDOR =
        "#agenda-contenido";


    /* ======================================================
       UTILIDADES
       ====================================================== */

    function escaparHTML(valor) {

        if (
            valor === null ||
            valor === undefined
        ) {
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

        const partes =
            String(fecha).split("-");

        if (partes.length === 3) {

            const año = partes[0];
            const mes = partes[1];
            const dia = partes[2];

            return `${dia}-${mes}-${año}`;
        }

        return escaparHTML(fecha);
    }


    function obtenerFranja(mudanza) {

        return (
            mudanza?.franja_horaria_recogida ||
            "Horario pendiente"
        );
    }


    function obtenerTipoServicio(mudanza) {

        const tipo =
            String(
                mudanza?.tipo_servicio ||
                ""
            ).toLowerCase();

        if (
            tipo.includes("total")
        ) {
            return "Mudanza Total";
        }

        return "Mudanza Estándar";
    }


    /* ======================================================
       ACCESOS
       ====================================================== */

    function normalizarAscensor(valor) {

        if (!valor) {
            return "";
        }

        const texto =
            String(valor)
                .trim()
                .toLowerCase();

        if (
            texto.includes("sin")
        ) {
            return "Sin ascensor";
        }

        if (
            texto.includes("con")
        ) {
            return "Con ascensor";
        }

        return String(valor).trim();
    }


    function formatearAcceso(
        ascensor,
        piso
    ) {

        const ascensorTexto =
            normalizarAscensor(ascensor);

        const pisoNumero =
            Number(piso);


        /*
         * REGLA IMPORTANTE:
         * Si el piso es 0:
         * solamente debe aparecer
         * "Un Bajo".
         *
         * Nunca:
         * "Un Bajo - Con ascensor"
         * "Un Bajo - Sin ascensor"
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

            return (
                `${ascensorTexto} · Piso ${pisoNumero}`
            );
        }


        if (ascensorTexto) {
            return ascensorTexto;
        }


        if (
            Number.isFinite(pisoNumero)
        ) {

            return (
                pisoNumero === 0
                    ? "Un Bajo"
                    : `Piso ${pisoNumero}`
            );
        }


        return "Acceso por confirmar";
    }


    function obtenerAccesoOrigen(mudanza) {

        /*
         * Primero intentamos utilizar los campos
         * nuevos de Supabase.
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
         * Compatibilidad con reservas antiguas
         * que solamente tenían la columna:
         *
         * ascensor
         */

        const texto =
            String(
                mudanza?.ascensor ||
                ""
            );

        const coincidencia =
            texto.match(
                /recogida:\s*(.*?)(?:\s*\||$)/i
            );

        if (coincidencia) {

            return coincidencia[1]
                .trim();
        }

        return "Acceso por confirmar";
    }


    function obtenerAccesoDestino(mudanza) {

        if (
            mudanza?.ascensor_destino !== undefined ||
            mudanza?.piso_destino !== undefined
        ) {

            return formatearAcceso(
                mudanza.ascensor_destino,
                mudanza.piso_destino
            );
        }


        const texto =
            String(
                mudanza?.ascensor ||
                ""
            );

        const coincidencia =
            texto.match(
                /entrega:\s*(.*?)(?:\s*\||$)/i
            );

        if (coincidencia) {

            return coincidencia[1]
                .trim();
        }

        return "Acceso por confirmar";
    }


    /* ======================================================
       ESTADOS
       ====================================================== */

    function obtenerEstado(mudanza) {

        const estado =
            String(
                mudanza?.estado ||
                ""
            ).trim();


        const normalizado =
            estado.toLowerCase();


        if (
            normalizado ===
            "completada"
            ||
            normalizado ===
            "finalizada"
            ||
            normalizado ===
            "mudanza finalizada"
        ) {

            return {
                codigo: "finalizada",
                titulo: "Completada",
                clase:
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
            };
        }


        if (
            normalizado.includes(
                "en ruta"
            )
        ) {

            return {
                codigo: "en_ruta",
                titulo: "En ruta",
                clase:
                    "bg-sky-50 text-sky-700 border-sky-200"
            };
        }


        if (
            normalizado.includes(
                "transportista asignado"
            )
            ||
            normalizado ===
            "asignada"
        ) {

            return {
                codigo:
                    "transportista_asignado",
                titulo: "Transportista asignado",
                clase:
                    "bg-violet-50 text-violet-700 border-violet-200"
            };
        }


        if (
            normalizado.includes(
                "pendiente de asignación"
            )
        ) {

            return {
                codigo:
                    "pendiente_asignacion",
                titulo:
                    "Pendiente de asignación",
                clase:
                    "bg-blue-50 text-blue-700 border-blue-200"
            };
        }


        if (
            normalizado.includes(
                "pago confirmado"
            )
        ) {

            return {
                codigo:
                    "pago_confirmado",
                titulo:
                    "Pago confirmado",
                clase:
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
            };
        }


        if (
            normalizado.includes(
                "pendiente de pago"
            )
        ) {

            return {
                codigo:
                    "pendiente_pago",
                titulo:
                    "Pendiente de pago",
                clase:
                    "bg-amber-50 text-amber-700 border-amber-200"
            };
        }


        return {
            codigo: "desconocido",
            titulo:
                estado ||
                "Estado pendiente",
            clase:
                "bg-slate-50 text-slate-600 border-slate-200"
        };
    }


    /* ======================================================
       DETERMINAR SI ES HISTORIAL
       ====================================================== */

    function esFinalizada(mudanza) {

        const estado =
            String(
                mudanza?.estado ||
                ""
            ).trim()
            .toLowerCase();

        return (
            estado === "completada" ||
            estado === "finalizada" ||
            estado === "mudanza finalizada"
        );
    }


    /* ======================================================
       DETERMINAR FECHA
       ====================================================== */

    function convertirFechaComparacion(
        fecha
    ) {

        if (!fecha) {
            return Number.MAX_SAFE_INTEGER;
        }

        const tiempo =
            new Date(
                `${fecha}T00:00:00`
            ).getTime();

        return Number.isNaN(tiempo)
            ? Number.MAX_SAFE_INTEGER
            : tiempo;
    }


    /* ======================================================
       OBTENER USUARIO DEL TRANSPORTISTA
       ====================================================== */

    async function obtenerTransportistaId() {

        /*
         * Primero intentamos utilizar las variables
         * que ya existen en el panel.
         */

        if (
            window.Transportista &&
            window.Transportista.currentUserId
        ) {

            return (
                window.Transportista
                    .currentUserId
            );
        }


        if (
            window.currentUserId
        ) {

            return window.currentUserId;
        }


        /*
         * Como respaldo consultamos directamente
         * la sesión de Supabase.
         */

        if (
            typeof window.dbClient !==
            "undefined" &&
            window.dbClient?.auth
        ) {

            const {
                data,
                error
            } =
                await window.dbClient
                    .auth
                    .getUser();


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

        if (
            typeof window.dbClient ===
            "undefined"
        ) {

            throw new Error(
                "dbClient no está disponible."
            );
        }


        const transportistaId =
            await obtenerTransportistaId();


        if (!transportistaId) {

            throw new Error(
                "No se pudo identificar al transportista."
            );
        }


        const {
            data,
            error
        } =
            await window.dbClient
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
            throw error;
        }


        return Array.isArray(data)
            ? data
            : [];
    }


    /* ======================================================
       CARD DE AGENDA
       ====================================================== */

    function crearTarjeta(
        mudanza,
        historial
    ) {

        const estado =
            obtenerEstado(mudanza);

        const fecha =
            obtenerFecha(mudanza);

        const franja =
            obtenerFranja(mudanza);

        const tipo =
            obtenerTipoServicio(mudanza);

        const accesoOrigen =
            obtenerAccesoOrigen(
                mudanza
            );

        const accesoDestino =
            obtenerAccesoDestino(
                mudanza
            );


        const precio =
            mudanza?.preciototal ||
            mudanza?.importe_total ||
            "—";


        const volumen =
            mudanza?.volumen ||
            "—";


        const kilometros =
            mudanza?.km !== undefined &&
            mudanza?.km !== null
                ? `${mudanza.km} km`
                : "—";


        const articulos =
            obtenerTotalArticulos(
                mudanza
            );


        const claseHistorial =
            historial
                ? "opacity-95"
                : "";


        return `

        <article
            class="
                ${claseHistorial}
                bg-white
                border
                border-slate-200
                rounded-2xl
                shadow-sm
                hover:shadow-md
                hover:border-blue-200
                transition-all
                duration-200
                overflow-hidden
            "
        >

            <div class="p-5">

                <!-- CABECERA -->

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
                                w-12
                                h-12
                                rounded-xl
                                bg-blue-50
                                flex
                                items-center
                                justify-center
                                text-blue-700
                                font-black
                            "
                        >

                            <span
                                class="text-lg"
                            >
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
                                inline-flex
                                items-center
                                px-3
                                py-1.5
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
                                inline-flex
                                items-center
                                px-3
                                py-1.5
                                rounded-full
                                text-[11px]
                                font-black
                                border
                                border-blue-200
                                bg-blue-50
                                text-blue-700
                            "
                        >
                            ${escaparHTML(
                                tipo
                            )}
                        </span>

                    </div>

                </div>


                <!-- FRANJA -->

                <div
                    class="
                        mb-4
                        rounded-xl
                        border
                        border-amber-200
                        bg-amber-50
                        px-4
                        py-3
                        flex
                        items-center
                        gap-3
                    "
                >

                    <div
                        class="
                            w-9
                            h-9
                            rounded-lg
                            bg-white
                            flex
                            items-center
                            justify-center
                            text-amber-600
                            border
                            border-amber-200
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
                            ${escaparHTML(
                                franja
                            )}
                        </div>

                    </div>

                </div>


                <!-- RUTA -->

                <div
                    class="
                        grid
                        grid-cols-1
                        lg:grid-cols-[1fr_auto_1fr]
                        gap-4
                        items-stretch
                    "
                >

                    <!-- ORIGEN -->

                    <div
                        class="
                            rounded-xl
                            border
                            border-blue-100
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


                    <!-- CENTRO -->

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
                                w-10
                                h-10
                                rounded-full
                                bg-white
                                border
                                border-slate-200
                                shadow-sm
                                flex
                                items-center
                                justify-center
                                text-blue-600
                            "
                        >

                            <i
                                data-lucide="truck"
                                class="w-4 h-4"
                            ></i>

                        </div>

                    </div>


                    <!-- DESTINO -->

                    <div
                        class="
                            rounded-xl
                            border
                            border-orange-100
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


                <!-- DATOS DEL SERVICIO -->

                <div
                    class="
                        mt-4
                        pt-4
                        border-t
                        border-slate-100
                        flex
                        flex-wrap
                        gap-x-5
                        gap-y-2
                        text-xs
                        font-semibold
                        text-slate-500
                    "
                >

                    <span
                        class="inline-flex items-center gap-1.5"
                    >
                        <i
                            data-lucide="route"
                            class="w-3.5 h-3.5 text-slate-400"
                        ></i>

                        ${escaparHTML(
                            kilometros
                        )}
                    </span>


                    <span
                        class="inline-flex items-center gap-1.5"
                    >
                        <i
                            data-lucide="box"
                            class="w-3.5 h-3.5 text-slate-400"
                        ></i>

                        ${escaparHTML(
                            articulos
                        )} art.
                    </span>


                    <span
                        class="inline-flex items-center gap-1.5"
                    >
                        <i
                            data-lucide="ruler"
                            class="w-3.5 h-3.5 text-slate-400"
                        ></i>

                        ${escaparHTML(
                            volumen
                        )}
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
                                        class="
                                            w-3.5
                                            h-3.5
                                            text-slate-400
                                        "
                                    ></i>

                                    ${escaparHTML(
                                        mudanza.numero_reserva
                                    )}
                                </span>
                              `
                            : ""
                    }

                </div>


                <!-- PIE -->

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
                            Cobro transportista
                        </div>

                        <div
                            class="
                                text-xl
                                font-black
                                text-blue-600
                            "
                        >
                            ${escaparHTML(
                                precio
                            )}
                        </div>

                    </div>


                    <button
                        type="button"
                        class="
                            inline-flex
                            items-center
                            gap-2
                            px-5
                            py-3
                            rounded-xl
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            text-sm
                            font-black
                            shadow-sm
                            transition-colors
                        "
                        data-agenda-id="${escaparHTML(
                            mudanza.id
                        )}"
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
       TOTAL ARTÍCULOS
       ====================================================== */

    function obtenerTotalArticulos(
        mudanza
    ) {

        let inventario =
            mudanza?.inventario;


        if (!inventario) {
            return 0;
        }


        try {

            if (
                typeof inventario ===
                "string"
            ) {

                inventario =
                    JSON.parse(
                        inventario
                    );
            }

        }
        catch (error) {

            return 0;
        }


        if (
            !Array.isArray(inventario)
        ) {

            return 0;
        }


        return inventario.reduce(
            function (
                total,
                item
            ) {

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
       DÍA Y MES
       ====================================================== */

    function obtenerDia(fecha) {

        if (!fecha) {
            return "—";
        }

        const partes =
            String(fecha)
                .split("-");

        return partes.length === 3
            ? partes[2]
            : "—";
    }


    function obtenerMes(fecha) {

        if (!fecha) {
            return "---";
        }

        const partes =
            String(fecha)
                .split("-");

        if (
            partes.length !== 3
        ) {

            return "---";
        }


        const meses = [
            "ENE",
            "FEB",
            "MAR",
            "ABR",
            "MAY",
            "JUN",
            "JUL",
            "AGO",
            "SEP",
            "OCT",
            "NOV",
            "DIC"
        ];


        const indice =
            Number(
                partes[1]
            ) - 1;


        return (
            meses[indice] ||
            "---"
        );
    }


    /* ======================================================
       RENDER PRINCIPAL
       ====================================================== */

    function renderAgenda(
        mudanzas
    ) {

        const contenedor =
            document.querySelector(
                SELECTOR_CONTENEDOR
            );


        if (!contenedor) {
            return;
        }


        const proximas =
            mudanzas
                .filter(
                    m =>
                        !esFinalizada(m)
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
            mudanzas
                .filter(
                    m =>
                        esFinalizada(m)
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
           PRÓXIMOS SERVICIOS
           ================================================== */

        html += `

            <div class="mb-8">

                <div
                    class="
                        flex
                        flex-wrap
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
                        servicio${
                            proximas.length === 1
                                ? ""
                                : "s"
                        }
                    </div>

                </div>

        `;


        if (
            proximas.length === 0
        ) {

            html += `

                <div
                    class="
                        rounded-2xl
                        border
                        border-dashed
                        border-slate-300
                        bg-slate-50
                        p-8
                        text-center
                    "
                >

                    <i
                        data-lucide="calendar-check-2"
                        class="
                            w-10
                            h-10
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

        }
        else {

            html += `

                <div class="space-y-4">

            `;

            proximas.forEach(
                function (mudanza) {

                    html +=
                        crearTarjeta(
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
                        flex
                        flex-wrap
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
                        servicio${
                            historial.length === 1
                                ? ""
                                : "s"
                        }
                    </div>

                </div>

        `;


        if (
            historial.length === 0
        ) {

            html += `

                <div
                    class="
                        rounded-2xl
                        border
                        border-dashed
                        border-slate-300
                        bg-slate-50
                        p-8
                        text-center
                    "
                >

                    <i
                        data-lucide="archive"
                        class="
                            w-9
                            h-9
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

        }
        else {

            html += `

                <div class="space-y-4">

            `;

            historial.forEach(
                function (mudanza) {

                    html +=
                        crearTarjeta(
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


        contenedor.innerHTML =
            html;


        /* ==================================================
           EVENTOS DE LAS TARJETAS
           ================================================== */

        contenedor
            .querySelectorAll(
                "[data-agenda-id]"
            )
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


                            /*
                             * Utilizamos el Drawer
                             * existente del panel.
                             */

                            if (
                                typeof window.verDetalleMudanza ===
                                "function"
                            ) {

                                window.verDetalleMudanza(
                                    id
                                );

                                return;
                            }


                            /*
                             * Segundo intento:
                             * abrirDrawer si existe.
                             */

                            if (
                                typeof window.abrirDrawer ===
                                "function"
                            ) {

                                window.abrirDrawer();
                            }

                        }
                    );
                }
            );


        /*
         * Reactivar iconos Lucide
         * después de insertar HTML.
         */

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

    let cargando =
        false;


    async function cargarAgenda() {

        if (cargando) {
            return;
        }


        const contenedor =
            document.querySelector(
                SELECTOR_CONTENEDOR
            );


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
                        w-12
                        h-12
                        rounded-xl
                        bg-blue-50
                        text-blue-600
                        mb-3
                    "
                >

                    <i
                        data-lucide="loader-circle"
                        class="
                            w-6
                            h-6
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


            renderAgenda(
                mudanzas
            );

        }
        catch (error) {

            console.error(
                "[RODAX Agenda] Error:",
                error
            );


            contenedor.innerHTML = `

                <div
                    class="
                        rounded-2xl
                        border
                        border-red-200
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
                                w-5
                                h-5
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

        }
        finally {

            cargando =
                false;
        }
    }


    /* ======================================================
       DETECTAR CUÁNDO SE ABRE MI AGENDA
       ====================================================== */

    function iniciarObservador() {

        const tab =
            document.getElementById(
                "tab-mi-agenda"
            );


        if (!tab) {
            return;
        }


        /*
         * Comprobación inicial.
         */

        if (
            !tab.classList.contains(
                "hidden"
            )
        ) {

            cargarAgenda();
        }


        /*
         * El panel utiliza class="hidden"
         * para cambiar de sección.
         *
         * Observamos ese cambio para cargar Agenda
         * automáticamente cuando el usuario entra.
         */

        const observer =
            new MutationObserver(
                function () {

                    if (
                        !tab.classList.contains(
                            "hidden"
                        )
                    ) {

                        cargarAgenda();
                    }

                }
            );


        observer.observe(
            tab,
            {
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            }
        );
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
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarObservador
        );

    }
    else {

        iniciarObservador();
    }


    console.log(
        "✅ RODAX Agenda cargada correctamente"
    );


})(window);