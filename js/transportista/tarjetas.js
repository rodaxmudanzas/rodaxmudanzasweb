/* ============================================================
   RODAX TRANSPORTISTA
   tarjetas.js
   ------------------------------------------------------------
   RESPONSABILIDAD:
   - Generar tarjetas visuales del Marketplace.
   - Generar tarjetas de Mis Mudanzas Activas.
   - Preparar los datos necesarios para la presentación.
   - NO consulta Supabase.
   - NO modifica Supabase.
   - NO calcula precios económicos.
   - NO inventa horarios.
   - Utiliza las funciones comunes expuestas por utils.js.
   ============================================================ */

(function () {

    "use strict";


    //////////////////////////////////////////////////////////////
    // API GLOBAL
    //////////////////////////////////////////////////////////////

    window.Transportista =
        window.Transportista || {};


    //////////////////////////////////////////////////////////////
    // CONFIGURACIÓN VISUAL
    //////////////////////////////////////////////////////////////

    const TARJETAS_CONFIG = {

        marketplace: {

            serviciosMudanzaTotal: 6,

            operariosTexto:
                "2 operarios",

            observacionesTexto:
                "Observaciones"

        },

        activas: {

            horasDesbloqueo:
                24

        }

    };


    //////////////////////////////////////////////////////////////
    // ESCAPAR HTML
    //////////////////////////////////////////////////////////////

    function escapeHtml(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    //////////////////////////////////////////////////////////////
    // OBTENER CONFIGURACIÓN
    //////////////////////////////////////////////////////////////

    function obtenerConfigTarjetas() {

        return TARJETAS_CONFIG;

    }


    //////////////////////////////////////////////////////////////
    // NORMALIZAR TEXTO
    //////////////////////////////////////////////////////////////

    function normalizarTexto(valor) {

        return String(valor ?? "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    }


    //////////////////////////////////////////////////////////////
    // DETECTAR MUDANZA TOTAL
    //////////////////////////////////////////////////////////////

    function esMudanzaTotal(mudanza) {

        const tipo =
            normalizarTexto(
                mudanza?.tipo_servicio
            );

        return tipo.includes("total");

    }


    //////////////////////////////////////////////////////////////
    // FECHA — DÍA Y MES
    //////////////////////////////////////////////////////////////

    function obtenerDiaMes(fecha) {

        if (!fecha) {

            return {

                dia: "—",

                mes: "—"

            };

        }


        const fechaTexto =
            String(fecha)
                .trim();


        /*
         * Si viene como YYYY-MM-DD,
         * utilizamos los componentes directamente
         * para evitar desplazamientos de zona horaria.
         */

        const match =
            fechaTexto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (match) {

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


            const mesNumero =
                parseInt(
                    match[2],
                    10
                );


            const dia =
                parseInt(
                    match[3],
                    10
                );


            if (
                mesNumero >= 1 &&
                mesNumero <= 12
            ) {

                return {

                    dia:
                        String(dia),

                    mes:
                        meses[mesNumero - 1]

                };

            }

        }


        const fechaT =
            new Date(fecha);


        if (
            Number.isNaN(
                fechaT.getTime()
            )
        ) {

            return {

                dia: "—",

                mes: "—"

            };

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


        return {

            dia:
                String(
                    fechaT.getDate()
                ),

            mes:
                meses[
                    fechaT.getMonth()
                ]

        };

    }


    //////////////////////////////////////////////////////////////
    // FORMATO DE FECHA COMPLETA
    //////////////////////////////////////////////////////////////

    function obtenerFechaCompleta(fecha) {

        if (!fecha) {

            return "Fecha no disponible";

        }


        const fechaTexto =
            String(fecha)
                .trim();


        const match =
            fechaTexto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (match) {

            const fechaLocal =
                new Date(
                    Number(match[1]),
                    Number(match[2]) - 1,
                    Number(match[3])
                );


            if (
                !Number.isNaN(
                    fechaLocal.getTime()
                )
            ) {

                return fechaLocal.toLocaleDateString(
                    "es-ES",
                    {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                );

            }

        }


        const fechaT =
            new Date(fecha);


        if (
            Number.isNaN(
                fechaT.getTime()
            )
        ) {

            return fechaTexto;

        }


        return fechaT.toLocaleDateString(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    }


    //////////////////////////////////////////////////////////////
    // HORARIO
    //
    // IMPORTANTE:
    // No se inventa ninguna hora.
    //
    // Se buscan diferentes nombres posibles porque
    // Supabase puede devolver la franja bajo distintos
    // nombres según la versión del formulario.
    //////////////////////////////////////////////////////////////

    function obtenerHorario(mudanza) {

        const t =
            mudanza || {};


        const candidatosTexto = [

            t.franja_horaria,

            t.franjaHoraria,

            t.horario,

            t.horario_mudanza,

            t.horarioMudanza,

            t.hora_llegada,

            t.horaLlegada,

            t.hora_inicio_fin,

            t.horaInicioFin

        ];


        for (
            const valor
            of candidatosTexto
        ) {

            if (
                valor !== null &&
                valor !== undefined &&
                String(valor).trim() !== ""
            ) {

                const texto =
                    String(valor)
                        .trim();


                /*
                 * Si ya contiene una franja,
                 * la mostramos tal cual.
                 */

                if (
                    texto.includes("-") ||
                    texto.includes("–") ||
                    texto.includes("a")
                ) {

                    return texto;

                }

            }

        }


        /*
         * También soportamos campos separados.
         */

        const horaInicio =
            t.hora_inicio ??
            t.horaInicio ??
            t.hora_desde ??
            t.horaDesde ??
            null;


        const horaFin =
            t.hora_fin ??
            t.horaFin ??
            t.hora_hasta ??
            t.horaHasta ??
            null;


        if (
            horaInicio &&
            horaFin
        ) {

            return `${String(horaInicio).trim()} – ${String(horaFin).trim()}`;

        }


        if (horaInicio) {

            return String(
                horaInicio
            ).trim();

        }


        /*
         * Si la base de datos no tiene todavía
         * una franja, NO ponemos 09:00 ni otra
         * hora inventada.
         */

        return "Horario pendiente de elección";

    }


    //////////////////////////////////////////////////////////////
    // FOTOS
    //////////////////////////////////////////////////////////////

    function contarFotos(urlsFotos) {

        if (!urlsFotos) {

            return 0;

        }


        if (
            Array.isArray(urlsFotos)
        ) {

            return urlsFotos

                .map(
                    url =>
                        String(url).trim()
                )

                .filter(Boolean)

                .length;

        }


        /*
         * También soportamos JSON almacenado
         * como texto.
         */

        if (
            typeof urlsFotos === "string"
        ) {

            const texto =
                urlsFotos.trim();


            if (
                texto.startsWith("[") &&
                texto.endsWith("]")
            ) {

                try {

                    const parsed =
                        JSON.parse(texto);


                    if (
                        Array.isArray(parsed)
                    ) {

                        return parsed

                            .map(
                                url =>
                                    String(url).trim()
                            )

                            .filter(Boolean)

                            .length;

                    }

                } catch (error) {

                    /*
                     * Si no es JSON válido,
                     * continuamos con el formato
                     * separado por comas o |.
                     */

                }

            }


            return texto

                .split(/,|\s*\|\s*/)

                .map(
                    url =>
                        url.trim()
                )

                .filter(Boolean)

                .length;

        }


        return 0;

    }


    //////////////////////////////////////////////////////////////
    // OBTENER EXTRAS DE MUDANZA TOTAL
    //
    // IMPORTANTE:
    //
    // Las cajas normales del inventario NO se consideran
    // automáticamente cajas extras.
    //
    // Las cajas de "Beneficios Mudanza Total" deben venir
    // en un campo específico de extras.
    //
    // Se soportan varios formatos para que el módulo sea
    // compatible con los datos existentes.
    //////////////////////////////////////////////////////////////

    function obtenerExtrasMudanzaTotal(mudanza) {

        const t =
            mudanza || {};


        if (
            !esMudanzaTotal(t)
        ) {

            return [];

        }


        const resultado = [];


        //////////////////////////////////////////////////////////
        // 1. Campo estructurado de extras
        //////////////////////////////////////////////////////////

        const posiblesExtras = [

            t.extras_mudanza_total,

            t.extrasMudanzaTotal,

            t.beneficios_mudanza_total,

            t.beneficiosMudanzaTotal,

            t.cajas_extras,

            t.cajasExtras

        ];


        for (
            const fuente
            of posiblesExtras
        ) {

            if (
                fuente === null ||
                fuente === undefined ||
                fuente === ""
            ) {

                continue;

            }


            let datos =
                fuente;


            if (
                typeof datos === "string"
            ) {

                try {

                    datos =
                        JSON.parse(datos);

                } catch (error) {

                    /*
                     * Si es texto simple no lo utilizamos
                     * como inventario porque podría contener
                     * observaciones.
                     */

                    continue;

                }

            }


            if (
                Array.isArray(datos)
            ) {

                datos.forEach(
                    item => {

                        const nombre =
                            item?.nombre ??
                            item?.mueble ??
                            item?.tipo ??
                            item?.descripcion ??
                            "";


                        const cantidad =
                            Number.parseInt(
                                item?.cantidad ??
                                item?.qty ??
                                item?.unidades,
                                10
                            ) || 0;


                        if (
                            String(nombre).trim() &&
                            cantidad > 0
                        ) {

                            resultado.push({

                                nombre:
                                    String(nombre).trim(),

                                cantidad

                            });

                        }

                    }
                );

            } else if (
                typeof datos === "object"
            ) {

                Object.entries(datos)
                    .forEach(
                        ([clave, valor]) => {

                            const cantidad =
                                Number.parseInt(
                                    valor,
                                    10
                                ) || 0;


                            if (
                                cantidad > 0
                            ) {

                                resultado.push({

                                    nombre:
                                        clave,

                                    cantidad

                                });

                            }

                        }
                    );

            }

        }


        //////////////////////////////////////////////////////////
        // 2. Campos directos de cajas de beneficios
        //////////////////////////////////////////////////////////

        const camposDirectos = [

            {
                nombres: [
                    "cajas_pequenas",
                    "cajasPequenas",
                    "beneficio_cajas_pequenas",
                    "beneficioCajasPequenas"
                ],

                etiqueta:
                    "Cajas pequeñas"
            },

            {
                nombres: [
                    "cajas_medianas",
                    "cajasMedianas",
                    "beneficio_cajas_medianas",
                    "beneficioCajasMedianas"
                ],

                etiqueta:
                    "Cajas medianas"
            },

            {
                nombres: [
                    "cajas_grandes",
                    "cajasGrandes",
                    "beneficio_cajas_grandes",
                    "beneficioCajasGrandes"
                ],

                etiqueta:
                    "Cajas grandes"
            }

        ];


        camposDirectos.forEach(
            campo => {

                let encontrado =
                    null;


                for (
                    const nombreCampo
                    of campo.nombres
                ) {

                    if (
                        t[nombreCampo] !==
                        undefined &&
                        t[nombreCampo] !==
                        null &&
                        t[nombreCampo] !== ""
                    ) {

                        encontrado =
                            t[nombreCampo];

                        break;

                    }

                }


                const cantidad =
                    Number.parseInt(
                        encontrado,
                        10
                    ) || 0;


                if (
                    cantidad > 0
                ) {

                    /*
                     * Evitamos duplicar una misma caja
                     * si ya llegó dentro del objeto extras.
                     */

                    const yaExiste =
                        resultado.some(
                            item =>
                                normalizarTexto(
                                    item.nombre
                                ) ===
                                normalizarTexto(
                                    campo.etiqueta
                                )
                        );


                    if (!yaExiste) {

                        resultado.push({

                            nombre:
                                campo.etiqueta,

                            cantidad

                        });

                    }

                }

            }
        );


        /*
         * Eliminar duplicados finales sumando cantidades.
         */

        const agrupado =
            new Map();


        resultado.forEach(
            item => {

                const clave =
                    normalizarTexto(
                        item.nombre
                    );


                if (!clave) {
                    return;
                }


                const anterior =
                    agrupado.get(clave);


                if (anterior) {

                    anterior.cantidad +=
                        item.cantidad;

                } else {

                    agrupado.set(
                        clave,
                        {
                            nombre:
                                item.nombre,

                            cantidad:
                                item.cantidad
                        }
                    );

                }

            }
        );


        return Array.from(
            agrupado.values()
        );

    }


    //////////////////////////////////////////////////////////////
    // INVENTARIO
    //////////////////////////////////////////////////////////////

    function obtenerInventario(mudanza) {

        const inventario =
            mudanza?.inventario;


        if (
            window.Transportista &&
            typeof window.Transportista.parseInventario ===
                "function"
        ) {

            return window.Transportista.parseInventario(
                inventario
            );

        }


        if (
            Array.isArray(inventario)
        ) {

            return inventario;

        }


        if (
            typeof inventario === "string"
        ) {

            try {

                const parsed =
                    JSON.parse(inventario);


                return Array.isArray(parsed)
                    ? parsed
                    : [];

            } catch (error) {

                return [];

            }

        }


        return [];

    }


    //////////////////////////////////////////////////////////////
    // INVENTARIO VISIBLE
    //
    // Las cajas normales permanecen dentro del inventario.
    //
    // NO se eliminan por ser "caja".
    //////////////////////////////////////////////////////////////

    function prepararInventarioVisible(mudanza) {

        const inventario =
            obtenerInventario(
                mudanza
            );


        return inventario

            .map(
                item => {

                    const nombre =
                        item?.nombre ??
                        item?.mueble ??
                        item?.descripcion ??
                        "Artículo";


                    const cantidad =
                        Number.parseInt(
                            item?.cantidad,
                            10
                        ) || 0;


                    return {

                        nombre:
                            String(nombre).trim(),

                        cantidad:

                            Math.max(
                                0,
                                cantidad
                            ),

                        categoria:
                            item?.categoria ??
                            item?.grupo ??
                            item?.seccion ??
                            "Otros"

                    };

                }
            )

            .filter(
                item =>
                    item.cantidad > 0
            );

    }


    //////////////////////////////////////////////////////////////
    // AGRUPAR INVENTARIO POR CATEGORÍA
    //////////////////////////////////////////////////////////////

    function agruparInventario(inventario) {

        const grupos = {};


        inventario.forEach(
            item => {

                const categoria =
                    String(
                        item.categoria ||
                        "Otros"
                    ).trim();


                if (
                    !grupos[categoria]
                ) {

                    grupos[categoria] = [];

                }


                grupos[categoria].push(
                    item
                );

            }
        );


        return grupos;

    }


    //////////////////////////////////////////////////////////////
    // HTML DEL INVENTARIO
    //////////////////////////////////////////////////////////////

    function crearHTMLInventario(
        inventario,
        extras
    ) {

        if (
            !inventario.length &&
            !extras.length
        ) {

            return `

                <div class="
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-xl
                    p-4
                    text-center
                ">

                    <span class="
                        text-xs
                        text-slate-400
                        font-medium
                    ">

                        No se especificó inventario detallado.

                    </span>

                </div>

            `;

        }


        let html = "";


        //////////////////////////////////////////////////////////
        // INVENTARIO NORMAL
        //////////////////////////////////////////////////////////

        if (
            inventario.length
        ) {

            const grupos =
                agruparInventario(
                    inventario
                );


            html += `

                <div class="
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-xl
                    p-4
                ">

                    <div class="
                        flex
                        items-center
                        justify-between
                        mb-3
                    ">

                        <div class="
                            flex
                            items-center
                            gap-2
                        ">

                            <i
                                data-lucide="package"
                                class="w-4 h-4 text-cyan-600"
                            ></i>

                            <span class="
                                text-[10px]
                                font-black
                                uppercase
                                tracking-wider
                                text-slate-600
                            ">
                                Inventario
                            </span>

                        </div>

                        <span class="
                            text-[10px]
                            font-bold
                            text-slate-400
                        ">

                            ${inventario.reduce(
                                (total, item) =>
                                    total + item.cantidad,
                                0
                            )} artículos

                        </span>

                    </div>

                    <div class="
                        grid
                        grid-cols-1
                        md:grid-cols-2
                        gap-2
                    ">
            `;


            Object.entries(grupos)
                .forEach(
                    ([categoria, items]) => {

                        html += `

                            <div class="
                                bg-white
                                border
                                border-slate-100
                                rounded-lg
                                p-3
                            ">

                                <div class="
                                    text-[9px]
                                    font-black
                                    uppercase
                                    tracking-wider
                                    text-slate-400
                                    mb-2
                                ">

                                    ${escapeHtml(
                                        categoria
                                    )}

                                </div>

                                <div class="
                                    space-y-1.5
                                ">
                        `;


                        items.forEach(
                            item => {

                                html += `

                                    <div class="
                                        flex
                                        items-center
                                        justify-between
                                        gap-2
                                        text-xs
                                    ">

                                        <span class="
                                            text-slate-700
                                            font-semibold
                                        ">
                                            ${escapeHtml(
                                                item.nombre
                                            )}
                                        </span>

                                        <span class="
                                            flex-shrink-0
                                            bg-slate-100
                                            text-slate-700
                                            px-2
                                            py-0.5
                                            rounded-md
                                            text-[10px]
                                            font-black
                                        ">
                                            x${item.cantidad}
                                        </span>

                                    </div>

                                `;

                            }
                        );


                        html += `

                                </div>

                            </div>

                        `;

                    }
                );


            html += `

                    </div>

                </div>

            `;

        }


        //////////////////////////////////////////////////////////
        // EXTRAS MUDANZA TOTAL
        //////////////////////////////////////////////////////////

        if (
            extras.length
        ) {

            html += `

                <div class="
                    bg-emerald-50
                    border
                    border-emerald-200
                    rounded-xl
                    p-4
                    mt-3
                ">

                    <div class="
                        flex
                        items-center
                        gap-2
                        mb-3
                    ">

                        <i
                            data-lucide="gift"
                            class="w-4 h-4 text-emerald-600"
                        ></i>

                        <span class="
                            text-[10px]
                            font-black
                            uppercase
                            tracking-wider
                            text-emerald-700
                        ">
                            Extras — Beneficios Mudanza Total
                        </span>

                    </div>

                    <div class="
                        grid
                        grid-cols-1
                        md:grid-cols-3
                        gap-2
                    ">

            `;


            extras.forEach(
                item => {

                    html += `

                        <div class="
                            flex
                            items-center
                            justify-between
                            gap-2
                            bg-white
                            border
                            border-emerald-100
                            rounded-lg
                            px-3
                            py-2
                        ">

                            <span class="
                                text-xs
                                font-semibold
                                text-slate-700
                            ">
                                ${escapeHtml(
                                    item.nombre
                                )}
                            </span>

                            <span class="
                                bg-emerald-600
                                text-white
                                px-2
                                py-0.5
                                rounded-md
                                text-[10px]
                                font-black
                            ">
                                x${item.cantidad}
                            </span>

                        </div>

                    `;

                }
            );


            html += `

                    </div>

                </div>

            `;

        }


        return html;

    }


    //////////////////////////////////////////////////////////////
    // DATOS COMUNES DE UNA MUDANZA
    //////////////////////////////////////////////////////////////

    function obtenerDatosMudanza(
        mudanza
    ) {

        const t =
            mudanza || {};


        const esTotal =
            esMudanzaTotal(t);


        //////////////////////////////////////////////////////////
        // ARTÍCULOS
        //////////////////////////////////////////////////////////

        let numArticulos = 0;


        if (
            window.Transportista &&
            typeof window.Transportista.getTotalArticulos ===
                "function"
        ) {

            numArticulos =
                window.Transportista.getTotalArticulos(
                    t.inventario
                );

        }


        //////////////////////////////////////////////////////////
        // M³
        //////////////////////////////////////////////////////////

        let totalM3 = 0;

        let m3Texto =
            "0,0 m³";


        if (
            window.Transportista &&
            typeof window.Transportista.getTotalM3 ===
                "function"
        ) {

            totalM3 =
                window.Transportista.getTotalM3(
                    t.inventario
                );

        }


        if (
            window.Transportista &&
            typeof window.Transportista.formatM3 ===
                "function"
        ) {

            m3Texto =
                window.Transportista.formatM3(
                    totalM3
                );

        }


        //////////////////////////////////////////////////////////
        // ACCESOS
        //////////////////////////////////////////////////////////

        let accesos = {

            recogida:
                "Acceso por confirmar",

            entrega:
                "Acceso por confirmar"

        };


        if (
            window.Transportista &&
            typeof window.Transportista.getAccesos ===
                "function"
        ) {

            accesos =
                window.Transportista.getAccesos(
                    t
                ) || accesos;

        }


        //////////////////////////////////////////////////////////
        // FOTOS
        //////////////////////////////////////////////////////////

        const numFotos =
            contarFotos(
                t.urls_fotos
            );


        //////////////////////////////////////////////////////////
        // INVENTARIO
        //////////////////////////////////////////////////////////

        const inventario =
            prepararInventarioVisible(
                t
            );


        //////////////////////////////////////////////////////////
        // EXTRAS
        //////////////////////////////////////////////////////////

        const extras =
            obtenerExtrasMudanzaTotal(
                t
            );


        //////////////////////////////////////////////////////////
        // SERVICIOS
        //////////////////////////////////////////////////////////

        const serviciosContratados =
            esTotal

                ? TARJETAS_CONFIG
                    .marketplace
                    .serviciosMudanzaTotal

                : 1;


        //////////////////////////////////////////////////////////
        // RESERVA
        //////////////////////////////////////////////////////////

        let numeroReserva =
            "—";


        if (
            window.Transportista &&
            typeof window.Transportista.getNumeroReserva ===
                "function"
        ) {

            numeroReserva =
                window.Transportista.getNumeroReserva(
                    t
                );

        }


        //////////////////////////////////////////////////////////
        // RESULTADO
        //////////////////////////////////////////////////////////

        return {

            id:
                Number(t.id),


            numeroReserva:
                escapeHtml(
                    numeroReserva
                ),


            origen:
                escapeHtml(
                    t.origen ||
                    "—"
                ),


            destino:
                escapeHtml(
                    t.destino ||
                    "—"
                ),


            tituloOrigen:
                escapeHtml(
                    t.origen ||
                    "—"
                ),


            tituloDestino:
                escapeHtml(
                    t.destino ||
                    "—"
                ),


            fecha:
                t.fecha ||
                "",


            fechaCompleta:
                obtenerFechaCompleta(
                    t.fecha
                ),


            fechaVisual:
                obtenerDiaMes(
                    t.fecha
                ),


            horario:
                escapeHtml(
                    obtenerHorario(
                        t
                    )
                ),


            km:
                escapeHtml(
                    t.km ??
                    "?"
                ),


            precio:
                escapeHtml(
                    t.preciototal ??
                    "—"
                ),


            numArticulos:
                numArticulos,


            totalM3:
                totalM3,


            m3Texto:
                escapeHtml(
                    m3Texto
                ),


            accesos: {

                recogida:
                    escapeHtml(
                        accesos.recogida ||
                        "Acceso por confirmar"
                    ),


                entrega:
                    escapeHtml(
                        accesos.entrega ||
                        "Acceso por confirmar"
                    )

            },


            numFotos:
                numFotos,


            serviciosContratados:
                serviciosContratados,


            esMudanzaTotal:
                esTotal,


            nombre:
                escapeHtml(
                    t.nombre ||
                    "—"
                ),


            telefono:
                escapeHtml(
                    t.telefono ||
                    "—"
                ),


            email:
                escapeHtml(
                    t.email ||
                    ""
                ),


            extrasTexto:
                escapeHtml(
                    t.extras ||
                    ""
                ),


            volumen:
                escapeHtml(
                    t.volumen ||
                    ""
                ),


            ascensor:
                escapeHtml(
                    t.ascensor ||
                    ""
                ),


            inventario:
                inventario,


            extras:
                extras,


            mudanzaOriginal:
                t

        };

    }


    //////////////////////////////////////////////////////////////
    // TARJETA MARKETPLACE
    //////////////////////////////////////////////////////////////

    function crearTarjetaMarketplace(
        mudanza
    ) {

        const d =
            obtenerDatosMudanza(
                mudanza
            );


        const inventarioHTML =
            crearHTMLInventario(
                d.inventario,
                d.extras
            );


        return `

        <div
            onclick="verDetalleMudanza(${d.id})"
            class="
                tarjeta-mudanza-premium
                col-span-1
                lg:col-span-2
                rounded-2xl
                p-5
                flex
                flex-col
                gap-5
                relative
                group
                cursor-pointer
            "
        >

            <!-- ==========================================
                 CABECERA
                 ========================================== -->

            <div class="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-4
            ">

                <div class="
                    flex
                    items-center
                    gap-4
                ">

                    <div class="
                        flex
                        flex-col
                        items-center
                        justify-center
                        min-w-[70px]
                        border-r
                        border-slate-100
                        pr-4
                    ">

                        <span class="
                            text-3xl
                            font-black
                            text-slate-800
                            leading-none
                        ">
                            ${d.fechaVisual.dia}
                        </span>

                        <span class="
                            text-[10px]
                            font-bold
                            text-slate-400
                            uppercase
                            tracking-wider
                            mt-1
                        ">
                            ${d.fechaVisual.mes}
                        </span>

                    </div>


                    <div>

                        <span class="
                            inline-block
                            text-[9px]
                            uppercase
                            font-black
                            px-2
                            py-1
                            rounded
                            border
                            tracking-wide
                            ${
                                d.esMudanzaTotal
                                    ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                                    : "text-blue-600 bg-blue-50 border-blue-100"
                            }
                        ">

                            ${
                                d.esMudanzaTotal
                                    ? "MUDANZA TOTAL"
                                    : "MUDANZA ESTÁNDAR"
                            }

                        </span>

                        <div class="
                            text-xs
                            font-bold
                            text-slate-500
                            mt-2
                        ">

                            ${d.horario}

                        </div>

                    </div>

                </div>


                <div class="
                    text-right
                    md:min-w-[140px]
                ">

                    <span class="
                        block
                        text-[9px]
                        font-bold
                        text-slate-400
                        uppercase
                        tracking-wider
                    ">
                        TU COBRO
                    </span>

                    <div class="
                        flex
                        items-baseline
                        justify-end
                        gap-1
                    ">

                        <span class="
                            text-2xl
                            font-black
                            text-blue-600
                            tracking-tight
                        ">
                            ${d.precio}
                        </span>

                        <span class="
                            text-[9px]
                            font-bold
                            text-slate-400
                        ">
                            IVA incl.
                        </span>

                    </div>

                </div>

            </div>


            <!-- ==========================================
                 RUTA
                 ========================================== -->

            <div class="
                grid
                grid-cols-1
                md:grid-cols-3
                items-center
                gap-4
                border-t
                border-slate-100
                pt-4
            ">

                <!-- ORIGEN -->

                <div class="
                    space-y-1
                    text-left
                ">

                    <span class="
                        text-[10px]
                        font-bold
                        text-slate-400
                        uppercase
                        tracking-wider
                        block
                    ">
                        Origen
                    </span>

                    <p
                        class="
                            text-sm
                            font-bold
                            text-slate-800
                            leading-tight
                            truncate
                        "
                        title="${d.tituloOrigen}"
                    >
                        ${d.origen}
                    </p>

                    <p class="
                        text-xs
                        text-slate-400
                        font-medium
                    ">
                        ${d.accesos.recogida}
                    </p>

                </div>


                <!-- CENTRO -->

                <div class="
                    hidden
                    md:flex
                    flex-col
                    items-center
                    justify-center
                    text-center
                ">

                    <span class="
                        text-xs
                        font-bold
                        text-slate-600
                        font-mono
                        bg-slate-50
                        border
                        border-slate-100
                        px-2
                        py-1
                        rounded
                    ">
                        ${d.km} km
                    </span>

                    <div class="
                        w-full
                        flex
                        items-center
                        justify-center
                        relative
                        mt-2
                    ">

                        <div class="
                            w-full
                            border-t
                            border-dashed
                            border-slate-300
                        "></div>

                        <div class="
                            absolute
                            bg-white
                            px-2
                            text-slate-400
                        ">

                            <i
                                data-lucide="truck"
                                class="w-4 h-4 text-blue-500"
                            ></i>

                        </div>

                    </div>

                </div>


                <!-- DESTINO -->

                <div class="
                    space-y-1
                    text-left
                    md:text-right
                ">

                    <span class="
                        text-[10px]
                        font-bold
                        text-slate-400
                        uppercase
                        tracking-wider
                        block
                    ">
                        Destino
                    </span>

                    <p
                        class="
                            text-sm
                            font-bold
                            text-slate-800
                            leading-tight
                            truncate
                            md:ml-auto
                        "
                        title="${d.tituloDestino}"
                    >
                        ${d.destino}
                    </p>

                    <p class="
                        text-xs
                        text-red-500
                        font-bold
                    ">
                        ${d.accesos.entrega}
                    </p>

                </div>

            </div>


            <!-- ==========================================
                 CONTADORES
                 ========================================== -->

            <div class="
                flex
                flex-wrap
                items-center
                gap-x-5
                gap-y-2
                pt-3
                border-t
                border-slate-50
                text-xs
                text-slate-500
                font-medium
            ">

                <span class="
                    flex
                    items-center
                    gap-1.5
                ">

                    <i
                        data-lucide="box"
                        class="w-3.5 h-3.5 text-slate-400"
                    ></i>

                    <strong>
                        ${d.numArticulos}
                    </strong>

                    ART.

                    <span class="text-slate-300">
                        ·
                    </span>

                    <strong>
                        ${d.m3Texto}
                    </strong>

                </span>


                <span class="
                    flex
                    items-center
                    gap-1.5
                ">

                    <i
                        data-lucide="shield-check"
                        class="w-3.5 h-3.5 text-slate-400"
                    ></i>

                    <strong>
                        ${d.serviciosContratados}
                    </strong>

                    servicios

                </span>


                <span class="
                    flex
                    items-center
                    gap-1.5
                ">

                    <i
                        data-lucide="image"
                        class="w-3.5 h-3.5 text-slate-400"
                    ></i>

                    <strong>
                        ${d.numFotos}
                    </strong>

                    fotos

                </span>


                <span class="
                    flex
                    items-center
                    gap-1.5
                ">

                    <i
                        data-lucide="message-square"
                        class="w-3.5 h-3.5 text-slate-400"
                    ></i>

                    ${TARJETAS_CONFIG
                        .marketplace
                        .observacionesTexto}

                </span>

            </div>


            <!-- ==========================================
                 INVENTARIO / EXTRAS
                 ========================================== -->

            <details
                onclick="event.stopPropagation()"
                class="
                    group/inventario
                    border-t
                    border-slate-100
                    pt-3
                "
            >

                <summary class="
                    list-none
                    cursor-pointer
                    flex
                    items-center
                    justify-between
                    text-xs
                    font-bold
                    text-slate-600
                ">

                    <span class="
                        flex
                        items-center
                        gap-2
                    ">

                        <i
                            data-lucide="package-open"
                            class="w-4 h-4 text-cyan-600"
                        ></i>

                        Ver inventario y extras

                    </span>

                    <i
                        data-lucide="chevron-down"
                        class="
                            w-4
                            h-4
                            text-slate-400
                            transition-transform
                            group-open/inventario:rotate-180
                        "
                    ></i>

                </summary>


                <div class="mt-3">

                    ${inventarioHTML}

                </div>

            </details>


            <!-- ==========================================
                 POLÍTICA DE PAGO
                 ========================================== -->

            <div class="
                flex
                justify-end
                border-t
                border-slate-100
                pt-3
            ">

                <span class="
                    inline-block
                    text-[10px]
                    font-bold
                    text-blue-600
                    bg-blue-50/70
                    border
                    border-blue-100
                    px-2.5
                    py-1
                    rounded
                    select-none
                ">
                    Pago según política RODAX
                </span>

            </div>


            <!-- FLECHA -->

            <div class="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-slate-300
                group-hover:text-blue-500
                transition-colors
                hidden
                lg:block
            ">

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >

                    <path
                        d="m9 18 6-6-6-6"
                    />

                </svg>

            </div>

        </div>

        `;

    }


    //////////////////////////////////////////////////////////////
    // CREAR TARJETA ACTIVA
    //////////////////////////////////////////////////////////////

    function crearTarjetaActiva(
        mudanza
    ) {

        const d =
            obtenerDatosMudanza(
                mudanza
            );


        const t =
            mudanza || {};


        //////////////////////////////////////////////////////////
        // FECHA DE LA MUDANZA
        //////////////////////////////////////////////////////////

        const fechaTexto =
            String(
                t.fecha || ""
            );


        const fechaParts =
            fechaTexto.split("-");


        let moveDate =
            new Date(NaN);


        if (
            fechaParts.length === 3
        ) {

            moveDate =
                new Date(

                    parseInt(
                        fechaParts[0],
                        10
                    ),

                    parseInt(
                        fechaParts[1],
                        10
                    ) - 1,

                    parseInt(
                        fechaParts[2],
                        10
                    ),

                    0,
                    0,
                    0

                );

        }


        const now =
            new Date();


        const diffMs =
            moveDate.getTime() -
            now.getTime();


        const diffHoras =
            diffMs /
            (1000 * 60 * 60);


        /*
         * Los datos completos se muestran cuando quedan
         * 24 horas o menos para el servicio.
         */

        const mostrarDatos =
            !Number.isNaN(diffHoras) &&
            diffHoras <=
                TARJETAS_CONFIG
                    .activas
                    .horasDesbloqueo;


        //////////////////////////////////////////////////////////
        // MENSAJE DE TIEMPO
        //////////////////////////////////////////////////////////

        let tiempoRestanteHTML =
            "";


        if (
            !Number.isNaN(
                diffHoras
            )
        ) {

            if (
                diffHoras >
                TARJETAS_CONFIG
                    .activas
                    .horasDesbloqueo
            ) {

                const horas =
                    Math.floor(
                        diffHoras
                    );


                const dias =
                    Math.floor(
                        horas / 24
                    );


                tiempoRestanteHTML = `

                    <div class="
                        flex
                        items-center
                        gap-1.5
                        text-xs
                        text-amber-600
                        font-bold
                        bg-amber-50
                        border
                        border-amber-200
                        px-3
                        py-1.5
                        rounded-lg
                    ">

                        <i
                            data-lucide="clock"
                            class="w-3.5 h-3.5"
                        ></i>

                        Datos del cliente visibles en

                        ${
                            dias > 0
                                ? dias + "d "
                                : ""
                        }

                        ${horas % 24}h

                    </div>

                `;

            } else if (
                diffHoras > 0
            ) {

                tiempoRestanteHTML = `

                    <div class="
                        flex
                        items-center
                        gap-1.5
                        text-xs
                        text-green-700
                        font-bold
                        bg-green-50
                        border
                        border-green-200
                        px-3
                        py-1.5
                        rounded-lg
                    ">

                        <i
                            data-lucide="check-circle"
                            class="w-3.5 h-3.5"
                        ></i>

                        Datos completos del cliente disponibles

                    </div>

                `;

            } else {

                tiempoRestanteHTML = `

                    <div class="
                        flex
                        items-center
                        gap-1.5
                        text-xs
                        text-purple-700
                        font-bold
                        bg-purple-50
                        border
                        border-purple-200
                        px-3
                        py-1.5
                        rounded-lg
                    ">

                        <i
                            data-lucide="calendar-check"
                            class="w-3.5 h-3.5"
                        ></i>

                        Servicio ya pasado — marcar como finalizado

                    </div>

                `;

            }

        }


        //////////////////////////////////////////////////////////
        // DATOS DEL CLIENTE
        //////////////////////////////////////////////////////////

        let datosClienteHTML =
            "";


        let rutaCompletaHTML =
            "";


        if (
            mostrarDatos
        ) {

            datosClienteHTML = `

                <div class="
                    bg-blue-50
                    border
                    border-blue-100
                    p-3
                    rounded-xl
                    space-y-1
                ">

                    <p class="
                        text-sm
                        text-gray-600
                        font-medium
                    ">

                        Cliente:

                        <strong class="
                            text-gray-900
                        ">
                            ${d.nombre}
                        </strong>

                    </p>


                    <p class="
                        text-sm
                        text-gray-600
                        font-medium
                    ">

                        Teléfono:

                        <a
                            href="tel:${d.telefono}"
                            onclick="event.stopPropagation()"
                            class="
                                text-blue-600
                                font-black
                                hover:underline
                            "
                        >
                            ${d.telefono}
                        </a>

                    </p>


                    ${
                        d.email

                            ? `

                                <p class="
                                    text-xs
                                    text-gray-500
                                ">

                                    Email:

                                    <a
                                        href="mailto:${d.email}"
                                        onclick="event.stopPropagation()"
                                        class="
                                            text-blue-500
                                            hover:underline
                                        "
                                    >
                                        ${d.email}
                                    </a>

                                </p>

                              `

                            : ""
                    }

                </div>

            `;


            rutaCompletaHTML = `

                <div class="
                    space-y-1
                    mb-3
                ">

                    <p class="
                        text-sm
                        font-bold
                        text-gray-900
                        flex
                        items-start
                        gap-2
                    ">

                        <span class="
                            w-2
                            h-2
                            rounded-full
                            bg-blue-500
                            flex-shrink-0
                            mt-1.5
                        "></span>

                        ${d.origen}

                    </p>


                    <p class="
                        text-xs
                        text-gray-400
                        ml-4
                    ">

                        ↓ ${d.km} km

                    </p>


                    <p class="
                        text-sm
                        font-bold
                        text-gray-900
                        flex
                        items-start
                        gap-2
                    ">

                        <span class="
                            w-2
                            h-2
                            rounded-full
                            bg-orange-500
                            flex-shrink-0
                            mt-1.5
                        "></span>

                        ${d.destino}

                    </p>

                </div>

            `;

        } else {

            datosClienteHTML = `

                <div class="
                    bg-gray-50
                    border
                    border-gray-200
                    p-3
                    rounded-xl
                ">

                    <p class="
                        dato-censurado
                        mb-1.5
                    ">

                        <i
                            data-lucide="lock"
                            class="w-3 h-3"
                        ></i>

                        Nombre y teléfono ocultos
                        por seguridad

                    </p>

                    <p class="
                        text-xs
                        text-gray-400
                        font-medium
                    ">

                        Los datos de contacto del cliente
                        se mostrarán automáticamente
                        24h antes del servicio.

                    </p>

                </div>

            `;


            rutaCompletaHTML = `

                <div class="
                    space-y-1
                    mb-3
                ">

                    <p class="
                        text-sm
                        font-bold
                        text-gray-900
                        flex
                        items-start
                        gap-2
                    ">

                        <span class="
                            w-2
                            h-2
                            rounded-full
                            bg-blue-500
                            flex-shrink-0
                            mt-1.5
                        "></span>

                        <span class="dato-censurado">

                            <i
                                data-lucide="lock"
                                class="w-3 h-3"
                            ></i>

                            Dirección de recogida oculta

                        </span>

                    </p>


                    <p class="
                        text-xs
                        text-gray-400
                        ml-4
                    ">

                        ↓ ${d.km} km

                    </p>


                    <p class="
                        text-sm
                        font-bold
                        text-gray-900
                        flex
                        items-start
                        gap-2
                    ">

                        <span class="
                            w-2
                            h-2
                            rounded-full
                            bg-orange-500
                            flex-shrink-0
                            mt-1.5
                        "></span>

                        <span class="dato-censurado">

                            <i
                                data-lucide="lock"
                                class="w-3 h-3"
                            ></i>

                            Dirección de entrega oculta

                        </span>

                    </p>

                </div>

            `;

        }


        //////////////////////////////////////////////////////////
        // INVENTARIO
        //////////////////////////////////////////////////////////

        const inventarioHTML =
            crearHTMLInventario(
                d.inventario,
                d.extras
            );


        //////////////////////////////////////////////////////////
        // TARJETA
        //////////////////////////////////////////////////////////

        return `

            <div
                class="
                    bg-white
                    rounded-2xl
                    p-5
                    shadow-card
                    border
                    border-l-4
                    border-l-blue-500
                "
            >

                <!-- CABECERA -->

                <div class="
                    flex
                    flex-col
                    md:flex-row
                    md:justify-between
                    md:items-center
                    gap-3
                    mb-4
                    pb-3
                    border-b
                    border-gray-100
                ">

                    <div>

                        <div class="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                        ">

                            <span class="
                                text-xs
                                font-black
                                text-blue-600
                                bg-blue-50
                                px-3
                                py-1
                                rounded-lg
                                border
                                border-blue-100
                            ">

                                ID:
                                ${d.numeroReserva}

                            </span>


                            <span class="
                                text-xs
                                text-gray-400
                                font-semibold
                            ">

                                ${escapeHtml(
                                    d.fechaCompleta
                                )}

                            </span>

                        </div>


                        <div class="
                            mt-2
                            flex
                            flex-wrap
                            gap-2
                        ">

                            <span class="
                                text-[10px]
                                font-bold
                                text-blue-600
                                bg-blue-50
                                border
                                border-blue-100
                                px-2
                                py-1
                                rounded-md
                            ">

                                ${d.horario}

                            </span>


                            ${
                                d.esMudanzaTotal

                                    ? `

                                        <span class="
                                            text-[10px]
                                            font-bold
                                            text-emerald-600
                                            bg-emerald-50
                                            border
                                            border-emerald-100
                                            px-2
                                            py-1
                                            rounded-md
                                        ">
                                            MUDANZA TOTAL
                                        </span>

                                      `

                                    : `

                                        <span class="
                                            text-[10px]
                                            font-bold
                                            text-blue-600
                                            bg-blue-50
                                            border
                                            border-blue-100
                                            px-2
                                            py-1
                                            rounded-md
                                        ">
                                            MUDANZA ESTÁNDAR
                                        </span>

                                      `
                            }

                        </div>

                    </div>


                    <button
                        onclick="event.stopPropagation(); imprimirFicha(${d.id})"
                        class="
                            flex
                            items-center
                            gap-1.5
                            text-xs
                            font-bold
                            text-blue-600
                            hover:text-blue-800
                            bg-blue-50
                            hover:bg-blue-100
                            px-3
                            py-2
                            rounded-lg
                            transition-colors
                            no-print
                            border
                            border-blue-100
                        "
                    >

                        <i
                            data-lucide="printer"
                            class="w-3.5 h-3.5"
                        ></i>

                        Ficha PDF

                    </button>

                </div>


                <!-- ESTADO -->

                <div class="mb-3">

                    ${tiempoRestanteHTML}

                </div>


                <!-- RUTA / CLIENTE / PRECIO -->

                <div class="
                    flex
                    flex-col
                    md:flex-row
                    gap-4
                    mb-4
                ">

                    <div class="flex-1">

                        ${rutaCompletaHTML}

                        ${datosClienteHTML}

                    </div>


                    <div class="
                        bg-green-50
                        border
                        border-green-100
                        p-4
                        rounded-xl
                        flex
                        flex-col
                        items-end
                        justify-center
                        md:min-w-[150px]
                    ">

                        <span class="
                            text-xs
                            font-bold
                            text-gray-500
                            uppercase
                            mb-1
                            block
                        ">
                            TU COBRO
                        </span>


                        <span class="
                            text-2xl
                            font-black
                            text-green-600
                            block
                        ">
                            ${d.precio}
                        </span>


                        <span class="
                            text-xs
                            text-gray-500
                            font-bold
                            mt-1
                        ">
                            IVA incl.
                        </span>


                        <span class="
                            text-[10px]
                            text-green-700
                            font-semibold
                            mt-2
                        ">
                            Según política RODAX
                        </span>

                    </div>

                </div>


                <!-- DATOS OPERATIVOS -->

                <div class="
                    bg-gray-50
                    border
                    border-gray-100
                    p-3
                    rounded-xl
                    mb-4
                    text-xs
                    space-y-1.5
                ">

                    <p class="text-gray-600">

                        <strong>
                            Recogida:
                        </strong>

                        ${d.accesos.recogida}

                    </p>


                    <p class="text-gray-600">

                        <strong>
                            Entrega:
                        </strong>

                        ${d.accesos.entrega}

                    </p>


                    ${
                        d.extrasTexto

                            ? `

                                <p class="text-gray-600">

                                    <strong>
                                        Observaciones:
                                    </strong>

                                    ${d.extrasTexto}

                                </p>

                              `

                            : ""
                    }


                    <p class="text-gray-600">

                        <strong>
                            Carga:
                        </strong>

                        ${d.numArticulos}
                        ART. ·
                        ${d.m3Texto}

                    </p>


                    <p class="text-gray-600">

                        <strong>
                            Fotografías:
                        </strong>

                        ${d.numFotos}

                    </p>

                </div>


                <!-- INVENTARIO -->

                <details class="
                    border
                    border-slate-200
                    rounded-xl
                    mb-4
                    overflow-hidden
                ">

                    <summary class="
                        cursor-pointer
                        list-none
                        bg-slate-50
                        px-4
                        py-3
                        flex
                        items-center
                        justify-between
                        text-xs
                        font-bold
                        text-slate-700
                    ">

                        <span class="
                            flex
                            items-center
                            gap-2
                        ">

                            <i
                                data-lucide="package-open"
                                class="w-4 h-4 text-cyan-600"
                            ></i>

                            Ver inventario completo

                        </span>


                        <i
                            data-lucide="chevron-down"
                            class="w-4 h-4 text-slate-400"
                        ></i>

                    </summary>


                    <div class="p-3">

                        ${inventarioHTML}

                    </div>

                </details>


                <!-- FINALIZAR -->

                <button
                    onclick="event.stopPropagation(); marcarCompletada(${d.id})"
                    class="
                        no-print
                        w-full
                        bg-white
                        hover:bg-green-50
                        text-green-700
                        font-bold
                        py-3
                        rounded-xl
                        border-2
                        border-green-100
                        hover:border-green-300
                        transition-colors
                        flex
                        items-center
                        justify-center
                        gap-2
                    "
                >

                    <i
                        data-lucide="check-circle"
                        class="w-5 h-5"
                    ></i>

                    Marcar como Finalizada

                </button>

            </div>

        `;

    }


    //////////////////////////////////////////////////////////////
    // RENDER MARKETPLACE
    //////////////////////////////////////////////////////////////

    function renderizarTarjetasMarketplace(
        trabajos
    ) {

        if (
            !Array.isArray(trabajos)
        ) {

            return "";

        }


        return trabajos

            .map(
                trabajo =>
                    crearTarjetaMarketplace(
                        trabajo
                    )
            )

            .join("");

    }


    //////////////////////////////////////////////////////////////
    // RENDER ACTIVAS
    //////////////////////////////////////////////////////////////

    function renderizarTarjetasActivas(
        trabajos
    ) {

        if (
            !Array.isArray(trabajos)
        ) {

            return "";

        }


        return trabajos

            .map(
                trabajo =>
                    crearTarjetaActiva(
                        trabajo
                    )
            )

            .join("");

    }


    //////////////////////////////////////////////////////////////
    // API PÚBLICA
    //////////////////////////////////////////////////////////////

    window.Transportista.Tarjetas = {

        config:
            TARJETAS_CONFIG,


        escapeHtml,


        obtenerConfigTarjetas,


        obtenerHorario,


        obtenerExtrasMudanzaTotal,


        obtenerInventario,


        prepararInventarioVisible,


        obtenerDatosMudanza,


        crearHTMLInventario,


        crearTarjetaMarketplace,


        crearTarjetaActiva,


        renderizarTarjetasMarketplace,


        renderizarTarjetasActivas

    };


    //////////////////////////////////////////////////////////////
    // CONFIRMACIÓN
    //////////////////////////////////////////////////////////////

    console.log(
        "✅ tarjetas.js cargado correctamente — versión modular RODAX"
    );


})();