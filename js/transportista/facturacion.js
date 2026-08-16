/**

 * ==========================================================

 * RODAX Marketplace

 * Archivo : js/transportista/facturacion.js

 * Módulo  : Facturación

 * ==========================================================

 *

 * Muestra al transportista:

 * - Pagos pendientes

 * - Pagos realizados

 * - Facturas / liquidaciones

 *

 * Los pagos del cliente se gestionan mediante Stripe.

 * Aquí solo mostramos lo que RODAX debe liquidar al transportista.

 * ==========================================================

 */

 

(function (window) {

 

    "use strict";

 

 

    ////////////////////////////////////////////////////////////

    // OBTENER CLIENTE SUPABASE

    ////////////////////////////////////////////////////////////

 

    function obtenerSupabase() {

 

        if (window.supabaseClient) {

            return window.supabaseClient;

        }

 

        if (

            window.RODAX &&

            window.RODAX.supabase

        ) {

            return window.RODAX.supabase;

        }

 

        if (

            window.RODAX &&

            window.RODAX.supabaseClient

        ) {

            return window.RODAX.supabaseClient;

        }

 

        if (window.supabase) {

            return window.supabase;

        }

 

        return null;

    }

 

 

    ////////////////////////////////////////////////////////////

    // OBTENER ID DEL TRANSPORTISTA

    ////////////////////////////////////////////////////////////

 

    function obtenerTransportistaId() {

 

        if (

            window.transportista &&

            window.transportista.currentUserId

        ) {

 

            return window.transportista.currentUserId;

        }

 

 

        if (window.currentUserId) {

 

            return window.currentUserId;

        }

 

 

        if (

            window.RODAX &&

            window.RODAX.state &&

            typeof window.RODAX.state.get === "function"

        ) {

 

            return (

                window.RODAX.state.get("auth.user.id") ||

                window.RODAX.state.get("transportista.id") ||

                window.RODAX.state.get("user.id") ||

                null

            );

        }

 

 

        return null;

    }

 

 

    ////////////////////////////////////////////////////////////

    // ESCAPAR HTML

    ////////////////////////////////////////////////////////////

 

    function escaparHTML(valor) {

 

        return String(valor ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }

 

 

    ////////////////////////////////////////////////////////////

    // FORMATEAR EUROS

    ////////////////////////////////////////////////////////////

 

    function formatearEuros(valor) {

 

        const numero = Number(valor) || 0;

 

        return numero.toLocaleString(

            "es-ES",

            {

                style: "currency",

                currency: "EUR"

            }

        );

    }

 

 

    ////////////////////////////////////////////////////////////

    // FORMATEAR FECHA

    ////////////////////////////////////////////////////////////

 

    function formatearFecha(valor) {

 

        if (!valor) {

            return "—";

        }

 

        const fecha = new Date(valor);

 

        if (Number.isNaN(fecha.getTime())) {

            return escaparHTML(valor);

        }

 

        return fecha.toLocaleDateString(

            "es-ES"

        );

    }

 

 

    ////////////////////////////////////////////////////////////

    // CARGAR FACTURACIÓN

    ////////////////////////////////////////////////////////////

 

    async function cargarFacturacion() {

 

        const contenedor =

            document.getElementById(

                "facturacion-contenido"

            );

 

        if (!contenedor) {

            return;

        }

 

 

        contenedor.innerHTML = `

            <div class="p-6 text-sm text-slate-500">

                Cargando facturación...

            </div>

        `;

 

 

        try {

 

            const supabase =

                obtenerSupabase();

 

            if (!supabase) {

 

                throw new Error(

                    "No se encontró el cliente de Supabase."

                );

            }

 

 

            const transportistaId =

                obtenerTransportistaId();

 

 

            if (!transportistaId) {

 

                contenedor.innerHTML = `

                    <div class="p-6 text-sm text-slate-500">

                        No se ha podido identificar al transportista.

                    </div>

                `;

 

                return;

            }

 

 

            ////////////////////////////////////////////////////

            // CONSULTAR PAGOS DEL TRANSPORTISTA

            ////////////////////////////////////////////////////

 

            const {

                data,

                error

            } = await supabase

 

                .from("pagos_transportistas")

 

                .select("*")

 

                .eq(

                    "transportista_id",

                    transportistaId

                )

 

                .order(

                    "fecha_programada",

                    {

                        ascending: false

                    }

                );

 

 

            if (error) {

                throw error;

            }

 

 

            const pagos =

                Array.isArray(data)

                    ? data

                    : [];

 

 

            ////////////////////////////////////////////////////

            // CALCULAR TOTALES

            ////////////////////////////////////////////////////

 

            const pendientes =

                pagos

 

                    .filter(function (pago) {

 

                        const estado =

                            String(

                                pago.estado_pago || ""

                            )

                            .toLowerCase();

 

                        return (

                            estado === "pendiente" ||

                            estado === "pendiente de pago" ||

                            estado === "programado"

                        );

                    })

 

                    .reduce(

                        function (total, pago) {

 

                            return total +

                                Number(

                                    pago.importe_transportista

                                || 0

                                );

                        },

                        0

                    );

 

 

            const realizados =

                pagos

 

                    .filter(function (pago) {

 

                        const estado =

                            String(

                                pago.estado_pago || ""

                            )

                            .toLowerCase();

 

                        return (

                            estado === "pagado" ||

                            estado === "pagada" ||

                            estado === "completado" ||

                            estado === "completada"

                        );

                    })

 

                    .reduce(

                        function (total, pago) {

 

                            return total +

                                Number(

                                    pago.importe_transportista

                                || 0

                                );

                        },

                        0

                    );

 

 

            ////////////////////////////////////////////////////

            // GENERAR FILAS

            ////////////////////////////////////////////////////

 

            const filas = pagos

 

                .map(function (pago) {

 

                    const estado =

                        escaparHTML(

                            pago.estado_pago ||

                            "Pendiente"

                        );

 

 

                    const numeroReserva =

                        escaparHTML(

                            pago.numero_reserva ||

                            "—"

                        );

 

 

                    const importe =

                        formatearEuros(

                            pago.importe_transportista

                        );

 

 

                    const fecha =

                        formatearFecha(

                            pago.fecha_pagado ||

                            pago.fecha_programada

                        );

 

 

                    return `

                        <tr class="border-b border-slate-100">

 

                            <td class="px-4 py-4 font-medium text-slate-700">

                                ${numeroReserva}

                            </td>

 

                            <td class="px-4 py-4 text-slate-600">

                                ${estado}

                            </td>

 

                            <td class="px-4 py-4 font-semibold text-slate-700">

                                ${importe}

                            </td>

 

                            <td class="px-4 py-4 text-slate-500">

                                ${fecha}

                            </td>

 

                        </tr>

                    `;

                })

 

                .join("");

 

 

            ////////////////////////////////////////////////////

            // RENDER FINAL

            ////////////////////////////////////////////////////

 

            contenedor.innerHTML = `

 

                <div class="space-y-6">

 

                    <!-- RESUMEN -->

 

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

 

                        <div class="

                            rounded-2xl

                            border

                            border-amber-200

                            bg-amber-50

                            p-5

                        ">

 

                            <div class="

                                text-xs

                                uppercase

                                tracking-wide

                                font-bold

                                text-amber-600

                            ">

                                Pendiente de cobro

                            </div>

 

                            <div class="

                                mt-2

                                text-2xl

                                font-bold

                                text-slate-800

                            ">

                                ${formatearEuros(pendientes)}

                            </div>

 

                        </div>

 

 

                        <div class="

                            rounded-2xl

                            border

                            border-emerald-200

                            bg-emerald-50

                            p-5

                        ">

 

                            <div class="

                                text-xs

                                uppercase

                                tracking-wide

                                font-bold

                                text-emerald-600

                            ">

                                Pagado

                            </div>

 

                            <div class="

                                mt-2

                                text-2xl

                                font-bold

                                text-slate-800

                            ">

                                ${formatearEuros(realizados)}

                            </div>

 

                        </div>

 

                    </div>

 

 

                    <!-- FACTURAS -->

 

                    <div class="

                        overflow-hidden

                        rounded-2xl

                        border

                        border-slate-200

                        bg-white

                    ">

 

                        <div class="

                            border-b

                            border-slate-200

                            px-5

                            py-4

                        ">

 

                            <h2 class="

                                text-lg

                                font-bold

                                text-slate-800

                            ">

                                Facturas y liquidaciones

                            </h2>

 

                            <p class="

                                mt-1

                                text-sm

                                text-slate-500

                            ">

                                Historial económico de tus servicios.

                            </p>

 

                        </div>

 

 

                        ${

                            pagos.length

                                ? `

                                    <div class="overflow-x-auto">

 

                                        <table class="w-full text-sm">

 

                                            <thead class="

                                                bg-slate-50

                                                text-left

                                                text-xs

                                                uppercase

                                                tracking-wide

                                                text-slate-500

                                            ">

 

                                                <tr>

 

                                                    <th class="px-4 py-3">

                                                        Reserva

                                                    </th>

 

                                                    <th class="px-4 py-3">

                                                        Estado

                                                    </th>

 

                                                    <th class="px-4 py-3">

                                                        Importe

                                                    </th>

 

                                                    <th class="px-4 py-3">

                                                        Fecha

                                                    </th>

 

                                                </tr>

 

                                            </thead>

 

                                            <tbody>

                                                ${filas}

                                            </tbody>

 

                                        </table>

 

                                    </div>

                                `

                                : `

                                    <div class="

                                        px-5

                                        py-8

                                        text-sm

                                        text-slate-500

                                    ">

                                        Todavía no hay registros de pagos

                                        para este transportista.

                                    </div>

                                `

                        }

 

                    </div>

 

 

                    <!-- NOTA -->

 

                    <div class="

                        rounded-2xl

                        border

                        border-slate-200

                        bg-slate-50

                        p-5

                    ">

 

                        <div class="

                            text-sm

                            font-bold

                            text-slate-700

                        ">

                            Nota

                        </div>

 

                        <p class="

                            mt-2

                            text-sm

                            leading-6

                            text-slate-500

                        ">

                            Los pagos del cliente se verifican mediante Stripe.

                            Aquí solo se muestran las cantidades que RODAX

                            debe liquidar al transportista.

                        </p>

 

                    </div>

 

                </div>

            `;

 

 

        }

 

        catch (error) {

 

            console.error(

                "Error cargando Facturación:",

                error

            );

 

 

            contenedor.innerHTML = `

 

                <div class="

                    rounded-2xl

                    border

                    border-red-200

                    bg-red-50

                    p-5

                    text-sm

                    text-red-700

                ">

 

                    <div class="font-bold">

                        No se pudo cargar Facturación.

                    </div>

 

                    <div class="mt-2">

                        ${escaparHTML(

                            error.message ||

                            "Error desconocido"

                        )}

                    </div>

 

                </div>

 

            `;

        }

    }

 

 

    ////////////////////////////////////////////////////////////

    // EXPONER FUNCIÓN

    ////////////////////////////////////////////////////////////

 

    window.cargarFacturacion =

        cargarFacturacion;

 

 

    ////////////////////////////////////////////////////////////

    // EVENTO AUTOMÁTICO

    ////////////////////////////////////////////////////////////


})(window);