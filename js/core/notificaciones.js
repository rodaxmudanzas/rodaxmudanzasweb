/* ============================================================
 * RODAX CORE — SISTEMA DE NOTIFICACIONES
 * Archivo: js/core/notificaciones.js
 * ============================================================ */

(function () {

    "use strict";

    const MAX_NOTIFICACIONES = 30;

    /* =========================================================
     * CLIENTE SUPABASE
     * ========================================================= */

    function obtenerDbClient() {

        const candidatos = [
            window.dbClient,
            window.supabaseClient,
            window.Transportista?.dbClient,
            window.Transportista?.supabaseClient
        ];

        for (const cliente of candidatos) {

            if (
                cliente &&
                typeof cliente.from === "function" &&
                cliente.auth
            ) {
                return cliente;
            }
        }

        /*
         * Compatibilidad con dbClient declarado
         * mediante const/let en otro script clásico.
         */
        try {

            if (
                typeof dbClient !== "undefined" &&
                dbClient &&
                typeof dbClient.from === "function"
            ) {
                return dbClient;
            }

        } catch (_) {}

        return null;
    }


    /* =========================================================
     * USUARIO ACTUAL
     * ========================================================= */

    async function obtenerTransportistaId() {

        /*
         * Primero utilizamos los identificadores que el panel
         * ya pueda tener disponibles.
         */

        if (
            window.currentUserId !== undefined &&
            window.currentUserId !== null
        ) {
            return window.currentUserId;
        }

        if (
            window.Transportista &&
            window.Transportista.currentUserId !== undefined &&
            window.Transportista.currentUserId !== null
        ) {
            return window.Transportista.currentUserId;
        }

        /*
         * Compatibilidad con variable global clásica.
         */

        try {

            if (
                typeof currentUserId !== "undefined" &&
                currentUserId
            ) {
                return currentUserId;
            }

        } catch (_) {}

        /*
         * Último recurso: Supabase Auth.
         */

        const db = obtenerDbClient();

        if (!db || !db.auth) {
            return null;
        }

        const {
            data,
            error
        } = await db.auth.getUser();

        if (error || !data?.user) {
            return null;
        }

        return data.user.id;
    }


    /* =========================================================
     * UTILIDADES DE INTERFAZ
     * ========================================================= */

    function actualizarContadorNotificaciones(cantidad) {

        const badge =
            document.getElementById(
                "badge-notificaciones-top"
            );

        if (badge) {

            badge.textContent = String(cantidad);

            if (cantidad > 0) {
                badge.classList.remove("hidden");
            } else {
                badge.classList.add("hidden");
            }
        }


        const resumen =
            document.getElementById(
                "notificaciones-resumen"
            );

        if (resumen) {

            resumen.textContent =
                cantidad > 0
                    ? `${cantidad} notificación${cantidad === 1 ? "" : "es"} nueva${cantidad === 1 ? "" : "s"}`
                    : "Sin notificaciones nuevas";
        }
    }


    function obtenerIconoNotificacion(tipo) {

        const iconos = {

            nuevo_trabajo: "briefcase-business",

            servicio_aceptado: "truck",

            cambio_servicio: "refresh-cw",

            cancelacion: "circle-x",

            cancelacion_solicitada: "clock-3",

            cancelacion_aprobada: "circle-check",

            cancelacion_rechazada: "circle-x",

            pago: "euro",

            liquidacion: "wallet-cards",

            sistema: "bell"

        };

        return iconos[tipo] || "bell";
    }


    function obtenerColorNotificacion(tipo) {

        const colores = {

            nuevo_trabajo:
                "border-blue-100 bg-blue-50 text-blue-700",

            servicio_aceptado:
                "border-emerald-100 bg-emerald-50 text-emerald-700",

            cambio_servicio:
                "border-violet-100 bg-violet-50 text-violet-700",

            cancelacion:
                "border-red-100 bg-red-50 text-red-700",

            cancelacion_solicitada:
                "border-amber-100 bg-amber-50 text-amber-700",

            cancelacion_aprobada:
                "border-emerald-100 bg-emerald-50 text-emerald-700",

            cancelacion_rechazada:
                "border-red-100 bg-red-50 text-red-700",

            pago:
                "border-emerald-100 bg-emerald-50 text-emerald-700",

            liquidacion:
                "border-emerald-100 bg-emerald-50 text-emerald-700",

            sistema:
                "border-slate-200 bg-slate-50 text-slate-700"

        };

        return colores[tipo] ||
            "border-slate-200 bg-slate-50 text-slate-700";
    }


    function escaparHtml(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatearFecha(fecha) {

        if (!fecha) {
            return "";
        }

        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString(
            "es-ES",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    /* =========================================================
     * RENDER DE NOTIFICACIONES
     * ========================================================= */

    function renderizarNotificaciones(notificaciones) {

        const lista =
            document.getElementById(
                "lista-notificaciones"
            );

        const vacias =
            document.getElementById(
                "notificaciones-vacias"
            );

        if (!lista) {
            return;
        }

        lista.innerHTML = "";


        if (
            !Array.isArray(notificaciones) ||
            notificaciones.length === 0
        ) {

            if (vacias) {
                vacias.classList.remove("hidden");
            }

            return;
        }


        if (vacias) {
            vacias.classList.add("hidden");
        }


        notificaciones.forEach(
            notificacion => {

                const tipo =
                    notificacion.tipo || "sistema";

                const icono =
                    obtenerIconoNotificacion(tipo);

                const color =
                    obtenerColorNotificacion(tipo);

                const claseNoLeida =
                    !notificacion.leida
                        ? "bg-blue-50/40"
                        : "bg-white";


                const numeroReserva =
                    notificacion.numero_reserva
                        ? `
                            <div class="mt-1 text-[11px] font-semibold text-slate-400">
                                ${escaparHtml(
                                    notificacion.numero_reserva
                                )}
                            </div>
                        `
                        : "";


                const elemento =
                    document.createElement("div");

                elemento.className = `
                    group relative cursor-pointer
                    border-b border-slate-100
                    px-4 py-3
                    transition-colors
                    hover:bg-slate-50
                    ${claseNoLeida}
                `.replace(/\s+/g, " ").trim();


                elemento.dataset.notificacionId =
                    notificacion.id;


                elemento.innerHTML = `

                    <div class="flex items-start gap-3">

                        <div
                            class="mt-0.5 flex h-9 w-9 shrink-0
                                   items-center justify-center
                                   rounded-full border
                                   ${color}"
                        >
                            <i
                                data-lucide="${icono}"
                                class="h-4 w-4"
                            ></i>
                        </div>


                        <div class="min-w-0 flex-1">

                            <div class="flex items-start justify-between gap-2">

                                <div
                                    class="text-sm font-bold
                                           ${notificacion.leida
                                               ? "text-slate-700"
                                               : "text-slate-900"}"
                                >
                                    ${escaparHtml(
                                        notificacion.titulo ||
                                        "Notificación"
                                    )}
                                </div>

                                ${
                                    !notificacion.leida
                                        ? `
                                            <span
                                                class="mt-1 h-2 w-2
                                                       shrink-0 rounded-full
                                                       bg-blue-500"
                                                title="No leída"
                                            ></span>
                                        `
                                        : ""
                                }

                            </div>


                            <div
                                class="mt-1 text-xs leading-5 text-slate-600"
                            >
                                ${escaparHtml(
                                    notificacion.mensaje || ""
                                )}
                            </div>


                            ${numeroReserva}


                            <div
                                class="mt-2 text-[10px]
                                       font-medium text-slate-400"
                            >
                                ${formatearFecha(
                                    notificacion.created_at
                                )}
                            </div>

                        </div>

                    </div>
                `;


                elemento.addEventListener(
                    "click",
                    async function (event) {

                        event.stopPropagation();

                        if (!notificacion.leida) {

                            await marcarNotificacionLeida(
                                notificacion.id
                            );

                        }

                    }
                );


                lista.appendChild(elemento);
            }
        );


        if (window.lucide) {
            window.lucide.createIcons();
        }
    }


    /* =========================================================
     * OBTENER NOTIFICACIONES
     * ========================================================= */

    async function obtenerNotificaciones() {

        const db =
            obtenerDbClient();

        if (!db) {

            console.warn(
                "🔔 NOTIFICACIONES: dbClient no disponible."
            );

            return [];
        }


        const transportistaId =
            await obtenerTransportistaId();


        if (!transportistaId) {

            console.warn(
                "🔔 NOTIFICACIONES: no se pudo obtener el transportista."
            );

            return [];
        }


        const {
            data,
            error
        } = await db
            .from("notificaciones")
            .select(`
                id,
                transportista_id,
                tipo,
                titulo,
                mensaje,
                mudanza_id,
                numero_reserva,
                metadata,
                leida,
                fecha_lectura,
                created_at
            `)
            .eq(
                "transportista_id",
                transportistaId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(
                MAX_NOTIFICACIONES
            );


        if (error) {

            console.error(
                "❌ ERROR CARGANDO NOTIFICACIONES:",
                error
            );

            return [];
        }


        const notificaciones =
            Array.isArray(data)
                ? data
                : [];


        const noLeidas =
            notificaciones.filter(
                n => !n.leida
            ).length;


        actualizarContadorNotificaciones(
            noLeidas
        );


        renderizarNotificaciones(
            notificaciones
        );


        return notificaciones;
    }


    /* =========================================================
     * MARCAR UNA NOTIFICACIÓN COMO LEÍDA
     * ========================================================= */

    async function marcarNotificacionLeida(
        notificacionId
    ) {

        if (!notificacionId) {
            return false;
        }


        const db =
            obtenerDbClient();

        if (!db) {
            return false;
        }


        const transportistaId =
            await obtenerTransportistaId();


        if (!transportistaId) {
            return false;
        }


        const {
            error
        } = await db
            .from("notificaciones")
            .update({
                leida: true,
                fecha_lectura:
                    new Date().toISOString()
            })
            .eq(
                "id",
                notificacionId
            )
            .eq(
                "transportista_id",
                transportistaId
            );


        if (error) {

            console.error(
                "❌ ERROR MARCANDO NOTIFICACIÓN:",
                error
            );

            return false;
        }


        await obtenerNotificaciones();

        return true;
    }


    /* =========================================================
     * MARCAR TODAS COMO LEÍDAS
     * ========================================================= */

    async function marcarTodasLeidas(event) {

        if (event) {
            event.stopPropagation();
        }


        const db =
            obtenerDbClient();

        if (!db) {
            return false;
        }


        const transportistaId =
            await obtenerTransportistaId();


        if (!transportistaId) {
            return false;
        }


        const {
            error
        } = await db
            .from("notificaciones")
            .update({
                leida: true,
                fecha_lectura:
                    new Date().toISOString()
            })
            .eq(
                "transportista_id",
                transportistaId
            )
            .eq(
                "leida",
                false
            );


        if (error) {

            console.error(
                "❌ ERROR MARCANDO TODAS LAS NOTIFICACIONES:",
                error
            );

            return false;
        }


        await obtenerNotificaciones();

        return true;
    }


    /* =========================================================
     * CREAR NOTIFICACIÓN
     * ========================================================= */

    async function crearNotificacion(datos) {

        const db =
            obtenerDbClient();

        if (!db) {

            console.error(
                "❌ NOTIFICACIONES: dbClient no disponible."
            );

            return {
                ok: false,
                error: "dbClient no disponible"
            };
        }


        if (!datos) {

            return {
                ok: false,
                error: "Datos de notificación inexistentes"
            };
        }


        const transportistaId =
            datos.transportista_id ||
            await obtenerTransportistaId();


        if (!transportistaId) {

            return {
                ok: false,
                error: "Transportista no identificado"
            };
        }


        /*
         * Permite que los eventos futuros puedan enviar
         * una clave única para evitar duplicados.
         *
         * Ejemplo:
         *
         * metadata: {
         *     evento_clave: "nuevo_trabajo:123"
         * }
         */

        const metadata =
            datos.metadata &&
            typeof datos.metadata === "object"
                ? datos.metadata
                : {};


        const payload = {

            id:
                datos.id ||
                (
                    window.crypto &&
                    typeof window.crypto.randomUUID === "function"
                        ? window.crypto.randomUUID()
                        : undefined
                ),

            transportista_id:
                transportistaId,

            tipo:
                datos.tipo || "sistema",

            titulo:
                datos.titulo || "Notificación",

            mensaje:
                datos.mensaje || "",

            mudanza_id:
                datos.mudanza_id ??
                null,

            numero_reserva:
                datos.numero_reserva ??
                null,

            metadata:
                metadata,

            leida:
                false

        };


        /*
         * Si el navegador no pudo generar UUID,
         * dejamos que Supabase utilice el default,
         * si existe.
         */

        if (!payload.id) {
            delete payload.id;
        }


        const {
            data,
            error
        } = await db
            .from("notificaciones")
            .insert(payload)
            .select()
            .single();


        if (error) {

            console.error(
                "❌ ERROR CREANDO NOTIFICACIÓN:",
                error
            );

            return {
                ok: false,
                error,
                data: null
            };
        }


        console.log(
            "🔔 NOTIFICACIÓN CREADA:",
            data
        );


        return {
            ok: true,
            error: null,
            data
        };
    }


    /* =========================================================
     * ABRIR / CERRAR PANEL
     * ========================================================= */

    async function toggleNotificaciones(event) {

        if (event) {
            event.stopPropagation();
        }


        const panel =
            document.getElementById(
                "panel-notificaciones"
            );

        if (!panel) {
            return;
        }


        const estabaOculto =
            panel.classList.contains("hidden");


        panel.classList.toggle(
            "hidden"
        );


        /*
         * Al abrir, siempre refrescamos.
         */

        if (estabaOculto) {
            await obtenerNotificaciones();
        }
    }


    /* =========================================================
     * INICIALIZACIÓN
     * ========================================================= */

    async function inicializarNotificaciones() {

        try {

            await obtenerNotificaciones();

            console.log(
                "✅ SISTEMA DE NOTIFICACIONES INICIALIZADO"
            );

        } catch (error) {

            console.error(
                "❌ ERROR INICIALIZANDO NOTIFICACIONES:",
                error
            );
        }
    }


    /* =========================================================
     * EXPONER API GLOBAL
     * ========================================================= */

    window.RodaxNotificaciones = {

        obtenerNotificaciones,

        crearNotificacion,

        marcarNotificacionLeida,

        marcarTodasLeidas,

        actualizarContadorNotificaciones,

        renderizarNotificaciones,

        inicializar:
            inicializarNotificaciones

    };


    /*
     * Sustituimos las funciones visuales antiguas del panel
     * por las funciones reales.
     */

    window.toggleNotificaciones =
        toggleNotificaciones;


    window.marcarTodasNotificacionesLeidas =
        marcarTodasLeidas;


    /* =========================================================
     * CARGA AUTOMÁTICA
     * ========================================================= */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarNotificaciones
        );

    } else {

        inicializarNotificaciones();
    }


})();