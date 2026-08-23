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
function obtenerUbicacionCorta(d) {

    if (!d) return "Ubicación no disponible";

    const texto = String(d).trim();

    const cp = (texto.match(/\b\d{5}\b/) || [])[0] || "";

    const partes = texto
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const comunidades = [
        "Andalucía","Aragón","Asturias","Illes Balears",
        "Canarias","Cantabria","Castilla-La Mancha",
        "Castilla y León","Cataluña","Catalunya",
        "Comunidad Valenciana","Extremadura","Galicia",
        "Comunidad de Madrid","Madrid","Murcia",
        "Navarra","País Vasco","La Rioja","Ceuta","Melilla"
    ];

    const comunidad =
        partes.find(p =>
            comunidades.some(c => p.includes(c))
        ) || "";

    let ciudad = "";

    const indiceCP =
        partes.findIndex(p => /\b\d{5}\b/.test(p));

    if (indiceCP > 0) {

        ciudad = partes[indiceCP - 1];

    } else {

        for (const p of partes) {

            if (p === comunidad) continue;
            if (/España|Spain|Spania|Spanien/i.test(p)) continue;
            if (/\d{5}/.test(p)) continue;

            ciudad = p;
            break;
        }
    }

    if (ciudad && cp && comunidad)
        return `${ciudad} - CP ${cp} - ${comunidad}`;

    if (ciudad && cp)
        return `${ciudad} - CP ${cp}`;

    return ciudad || texto;
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
// UBICACIÓN PÚBLICA — CIUDAD + CP + COMUNIDAD AUTÓNOMA
//////////////////////////////////////////////////////////////

function obtenerUbicacionPublica(
    mudanza,
    tipo
) {

    const origen =
        tipo === "origen";

    const ciudad =
        origen
            ? (
                mudanza?.origen_ciudad ??
                mudanza?.ciudad_origen ??
                mudanza?.ciudadOrigen ??
                mudanza?.localidad_origen ??
                mudanza?.municipio_origen ??
                mudanza?.poblacion_origen ??
                ""
            )
            : (
                mudanza?.destino_ciudad ??
                mudanza?.ciudad_destino ??
                mudanza?.ciudadDestino ??
                mudanza?.localidad_destino ??
                mudanza?.municipio_destino ??
                mudanza?.poblacion_destino ??
                ""
            );

    const codigoPostal =
        origen
            ? (
                mudanza?.origen_cp ??
                mudanza?.cp_origen ??
                mudanza?.codigo_postal_origen ??
                mudanza?.postal_origen ??
                ""
            )
            : (
                mudanza?.destino_cp ??
                mudanza?.cp_destino ??
                mudanza?.codigo_postal_destino ??
                mudanza?.postal_destino ??
                ""
            );

    const comunidad =
        origen
            ? (
                mudanza?.origen_comunidad_autonoma ??
                mudanza?.comunidad_autonoma_origen ??
                mudanza?.comunidad_origen ??
                mudanza?.autonomia_origen ??
                mudanza?.comunidadOrigen ??
                ""
            )
            : (
                mudanza?.destino_comunidad_autonoma ??
                mudanza?.comunidad_autonoma_destino ??
                mudanza?.comunidad_destino ??
                mudanza?.autonomia_destino ??
                mudanza?.comunidadDestino ??
                ""
            );

    const partes = [
    ciudad,
    codigoPostal,
    comunidad
]
    .map(valor => String(valor || "").trim())
    .filter(Boolean);

if (partes.length === 3) {
    return `${ciudad} - CP ${codigoPostal} - ${comunidad}`;
}

if (partes.length === 2 && ciudad && codigoPostal) {
    return `${ciudad} - CP ${codigoPostal}`;
}

// Fallback: usar la dirección completa y extraer Ciudad + CP + Comunidad.
const direccionOriginal =
    origen ? mudanza?.origen : mudanza?.destino;

return obtenerUbicacionCorta(direccionOriginal);
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

    t.franja_horaria_recogida,

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
        const t = mudanza || {};
        const total = esMudanzaTotal(t);
        if (!total) return [];

        const api = window.Transportista;
        let datos = null;
        if (api && typeof api.obtenerExtrasMudanzaTotal === "function") {
            datos = api.obtenerExtrasMudanzaTotal(t);
        }

        if (!datos) {
            datos = {
                "Cajas pequeñas": 0,
                "Cajas medianas": 0,
                "Cajas grandes": 0
            };
            let arr = t.inventario;
            if (typeof arr === "string") { try { arr = JSON.parse(arr); } catch { arr = []; } }
            if (!Array.isArray(arr)) arr = [];
            arr.forEach(item => {
                const nombre = normalizarTexto(item?.nombre ?? item?.mueble ?? item?.item ?? "");
                const cantidad = Number.parseInt(item?.cantidad, 10) || 0;
                if (nombre === "caja pequena") datos["Cajas pequeñas"] += cantidad;
                if (nombre === "caja mediana") datos["Cajas medianas"] += cantidad;
                if (nombre === "caja grande") datos["Cajas grandes"] += cantidad;
            });
        }

        return Object.entries(datos).map(([nombre, cantidad]) => ({
            nombre,
            cantidad: Number(cantidad) || 0
        }));
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
        const t = mudanza || {};
        const api = window.Transportista;

        if (api && typeof api.separarInventarioMudanza === "function") {
            return api.separarInventarioMudanza(t.inventario, t.tipo_servicio).visible
                .map(item => ({
                    nombre: String(item.nombre || "Artículo").trim(),
                    cantidad: Math.max(0, Number.parseInt(item.cantidad, 10) || 0),
                    categoria: item.categoria || (typeof api.obtenerCategoriaInventario === "function" ? api.obtenerCategoriaInventario(item.nombre) : "Otros")
                }))
                .filter(item => item.cantidad > 0);
        }

        const inventario = obtenerInventario(t);
        const total = esMudanzaTotal(t);
        const extras = new Set(["caja pequena", "caja mediana", "caja grande"]);
        return inventario.map(item => {
            const nombre = String(item?.nombre ?? item?.mueble ?? item?.descripcion ?? "Artículo").trim();
            return {
                nombre,
                cantidad: Math.max(0, Number.parseInt(item?.cantidad, 10) || 0),
                categoria: item?.categoria ?? item?.grupo ?? item?.seccion ?? "Otros"
            };
        }).filter(item => item.cantidad > 0 && !(total && extras.has(normalizarTexto(item.nombre))));
    }


    //////////////////////////////////////////////////////////////
    // AGRUPAR INVENTARIO POR CATEGORÍA
    //////////////////////////////////////////////////////////////

    function agruparInventario(inventario) {
        const grupos = {};
        const orden = ["Salón", "Cocina", "Comedor", "Dormitorio", "Baño", "Otros"];
        orden.forEach(categoria => grupos[categoria] = []);
        inventario.forEach(item => {
            const categoria = String(item.categoria || "Otros").trim();
            if (!grupos[categoria]) grupos[categoria] = [];
            grupos[categoria].push(item);
        });
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

                    ${
    obtenerInventarioVisible(mudanza).length

        ? obtenerInventarioVisible(mudanza)

            .map(item=>`

                <div class="flex justify-between py-1 border-b border-slate-100">

                    <span>${escapeHtml(item.nombre)}</span>

                    <span>${item.cantidad}</span>

                </div>

            `)

            .join("")

        : `

            <span
                class="
                    text-xs
                    text-slate-400
                    font-medium
                ">
                No se especificó inventario detallado.
            </span>

        `
}

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
                    t.inventario,
                    t.tipo_servicio
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
                    t.inventario,
                    t.tipo_servicio
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
        obtenerUbicacionPublica(t,"origen")
    ),


            destino:
    escapeHtml(
        obtenerUbicacionPublica(t,"destino")
    ),


            tituloOrigen:
    escapeHtml(
        obtenerUbicacionPublica(t,"origen")
    ),


            tituloDestino:
    escapeHtml(
        obtenerUbicacionPublica(t,"destino")
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

        /*
         * El inventario no se muestra dentro de la tarjeta.
         * Sigue disponible en el drawer y en la Ficha PDF.
         */

        return `
            <article
                class="tarjeta-mudanza-premium w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 md:px-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >

                <!-- CABECERA -->
                <div class="flex items-center justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-3">

                        <div class="min-w-[56px] border-r border-slate-100 pr-3 text-center">
                            <div class="text-2xl font-black leading-none text-slate-800">
                                ${d.fechaVisual.dia}
                            </div>
                            <div class="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                ${d.fechaVisual.mes}
                            </div>
                        </div>

                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
                                    d.esMudanzaTotal
                                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                                        : "border-blue-100 bg-blue-50 text-blue-600"
                                }">
                                    ${
                                        d.esMudanzaTotal
                                            ? "MUDANZA TOTAL"
                                            : "MUDANZA ESTÁNDAR"
                                    }
                                </span>

                                <span class="text-[11px] font-semibold text-slate-500">
                                    ${d.horario}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="hidden text-right sm:block">
                        <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            ID
                        </div>
                        <div class="mt-0.5 text-[11px] font-bold text-slate-700">
                            ${d.numeroReserva}
                        </div>
                    </div>
                </div>

                <!-- RUTA -->
                <div class="mt-3 grid grid-cols-1 items-center gap-3 border-t border-slate-100 pt-3 md:grid-cols-[1fr_auto_1fr]">
                    <div class="min-w-0">
                        <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Origen</div>
                        <div class="mt-1 truncate text-sm font-bold leading-tight text-slate-800" title="${d.tituloOrigen}">
                            ${d.origen}
                        </div>
                        <div class="mt-1 text-[10px] font-semibold text-slate-500">
                            ${d.accesos.recogida}
                        </div>
                    </div>

                    <div class="hidden w-[170px] flex-col items-center justify-center md:flex">
                        <span class="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                            ${d.km} km
                        </span>
                        <div class="relative mt-2 flex w-full items-center justify-center">
                            <div class="w-full border-t border-dashed border-slate-300"></div>
                            <div class="absolute bg-white px-2 text-slate-400">
                                <i data-lucide="truck" class="h-4 w-4 text-blue-500"></i>
                            </div>
                        </div>
                    </div>

                    <div class="min-w-0 text-left md:text-right">
                        <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Destino</div>
                        <div class="mt-1 truncate text-sm font-bold leading-tight text-slate-800" title="${d.tituloDestino}">
                            ${d.destino}
                        </div>
                        <div class="mt-1 text-[10px] font-bold text-red-500">
                            ${d.accesos.entrega}
                        </div>
                    </div>
                </div>

                <!-- RESUMEN -->
                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-50 pt-3 text-[10px] font-semibold text-slate-500">
                    <span class="inline-flex items-center gap-1.5">
                        <i data-lucide="package" class="h-3.5 w-3.5 text-slate-400"></i>
                        <strong class="text-slate-700">${d.numArticulos} ART.</strong>
                        <span class="text-slate-300">·</span>
                        <strong class="text-slate-700">${d.m3Texto}</strong>
                    </span>

                    <span class="inline-flex items-center gap-1.5">
                        <i data-lucide="shield-check" class="h-3.5 w-3.5 text-slate-400"></i>
                        <strong class="text-slate-700">${d.serviciosContratados}</strong> servicios
                    </span>

                    <span class="inline-flex items-center gap-1.5">
                        <i data-lucide="camera" class="h-3.5 w-3.5 text-slate-400"></i>
                        <strong class="text-slate-700">${d.numFotos}</strong> fotos
                    </span>
                </div>

                <!-- PRECIO + ACCIÓN -->
                <div class="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Tu cobro
                        </div>
                        <div class="mt-0.5 flex items-baseline gap-1">
                            <span class="text-2xl font-black tracking-tight text-blue-600">
                                ${d.precio}
                            </span>
                            <span class="text-[9px] font-bold text-slate-400">IVA incl.</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onclick="event.stopPropagation(); verDetalleMudanza(${d.id})"
                        class="no-print inline-flex w-full min-w-[155px] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-[#1D4ED8] hover:shadow-md active:scale-[0.98] sm:w-auto"
                    >
                        Ver detalles
                        <i data-lucide="arrow-right" class="h-4 w-4"></i>
                    </button>
                </div>

            </article>
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
// UBICACIÓN PÚBLICA
//////////////////////////////////////////////////////////

const ubicacionOrigenPublica =
    obtenerUbicacionPublica(
        t,
        "origen"
    );

const ubicacionDestinoPublica =
    obtenerUbicacionPublica(
        t,
        "destino"
    );


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


        //////////////////////////////////////////////////////////
// REGLAS DE PRIVACIDAD — MIS MUDANZAS ACTIVAS
//////////////////////////////////////////////////////////

const fechaValida =
    !Number.isNaN(
        moveDate.getTime()
    );

const mostrarDireccionExacta =
    fechaValida &&
    diffHoras <= 24;

const esMismoDia =
    fechaValida &&
    moveDate.getFullYear() === now.getFullYear() &&
    moveDate.getMonth() === now.getMonth() &&
    moveDate.getDate() === now.getDate();

const mostrarTelefonoCliente =
    esMismoDia &&
    now.getHours() >= 6;

const mostrarTelefonoRodax =
    mostrarDireccionExacta &&
    !mostrarTelefonoCliente;


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
    mostrarTelefonoCliente
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

        // El inventario no se muestra dentro de la tarjeta.
        // Se mantiene disponible para el drawer y la Ficha PDF.


        //////////////////////////////////////////////////////////
        // TARJETA
        //////////////////////////////////////////////////////////

        return `
            <article
                class="tarjeta-mudanza-premium w-full rounded-2xl border border-l-4 border-l-blue-500 border-slate-200 bg-white px-4 py-4 md:px-5 shadow-sm transition-all duration-200 hover:shadow-md"
            >

                <!-- CABECERA -->
                <div class="flex items-center justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-3">
                        <div class="min-w-[56px] border-r border-slate-100 pr-3 text-center">
                            <div class="text-2xl font-black leading-none text-slate-800">
                                ${d.fechaVisual.dia}
                            </div>
                            <div class="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                ${d.fechaVisual.mes}
                            </div>
                        </div>

                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
                                    d.esMudanzaTotal
                                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                                        : "border-blue-100 bg-blue-50 text-blue-600"
                                }">
                                    ${
                                        d.esMudanzaTotal
                                            ? "MUDANZA TOTAL"
                                            : "MUDANZA ESTÁNDAR"
                                    }
                                </span>

                                <span class="text-[11px] font-semibold text-slate-500">
                                    ${d.horario}
                                </span>
                            </div>

                            <div class="mt-1 text-[10px] font-semibold text-slate-400">
                                ID: ${d.numeroReserva}
                            </div>
                        </div>
                    </div>

                    <div class="text-right">
                        <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tu cobro</div>
                        <div class="mt-0.5 flex items-baseline gap-1 justify-end">
                            <span class="text-2xl font-black tracking-tight text-green-600">${d.precio}</span>
                            <span class="text-[9px] font-bold text-slate-400">IVA incl.</span>
                        </div>
                    </div>
                </div>

                <!-- ESTADO -->
                <div class="mt-3">
                    ${tiempoRestanteHTML}
                </div>

                <!-- RUTA -->
                <div class="mt-3 grid grid-cols-1 items-center gap-3 border-t border-slate-100 pt-3 md:grid-cols-[1fr_auto_1fr]">
                    <div class="min-w-0">
                        <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Origen</div>
                        <div
    class="mt-1 truncate text-sm font-bold leading-tight text-slate-800"
    title="${
        mostrarDireccionExacta
            ? d.tituloOrigen
            : ubicacionOrigenPublica
    }"
>
    ${
        mostrarDireccionExacta
            ? d.origen
            : ubicacionOrigenPublica
    }
</div>
                        <div class="mt-1 text-[10px] font-semibold text-slate-500">
                            ${d.accesos.recogida}
                        </div>
                    </div>

                    <div class="hidden w-[170px] flex-col items-center justify-center md:flex">
                        <span class="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                            ${d.km} km
                        </span>
                        <div class="relative mt-2 flex w-full items-center justify-center">
                            <div class="w-full border-t border-dashed border-slate-300"></div>
                            <div class="absolute bg-white px-2 text-slate-400">
                                <i data-lucide="truck" class="h-4 w-4 text-blue-500"></i>
                            </div>
                        </div>
                    </div>

                    <div class="min-w-0 text-left md:text-right">
                        <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Destino</div>
                        <div
    class="mt-1 truncate text-sm font-bold leading-tight text-slate-800"
    title="${
        mostrarDireccionExacta
            ? d.tituloDestino
            : ubicacionDestinoPublica
    }"
>
    ${
        mostrarDireccionExacta
            ? d.destino
            : ubicacionDestinoPublica
    }
</div>
                        <div class="mt-1 text-[10px] font-bold text-red-500">
                            ${d.accesos.entrega}
                        </div>
                    </div>
                </div>

                <!-- CONTACTO — CONTROLADO POR HORARIO -->
${mostrarTelefonoCliente && d.telefono ? `
    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-50 pt-3 text-[10px] font-semibold text-slate-500">

        <a
            href="tel:${d.telefono}"
            onclick="event.stopPropagation()"
            class="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
        >
            <i data-lucide="phone" class="h-3.5 w-3.5"></i>
            ${d.telefono}
        </a>

    </div>
` : mostrarTelefonoRodax ? `
    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-50 pt-3 text-[10px] font-semibold text-slate-500">

        <a
            href="tel:NUMERO_EMPRESA_RODAX"
            onclick="event.stopPropagation()"
            class="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
        >
            <i data-lucide="phone-call" class="h-3.5 w-3.5"></i>
            NUMERO_EMPRESA_RODAX
        </a>

    </div>
` : `
    <div class="mt-3 inline-flex items-center gap-1.5 border-t border-slate-50 pt-3 text-[10px] font-semibold text-slate-400">

        <i data-lucide="lock" class="h-3.5 w-3.5"></i>

        Teléfono de contacto disponible 24 h antes del servicio

    </div>
`}

                <!-- RESUMEN -->
                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-50 pt-3 text-[10px] font-semibold text-slate-500">
                    <span class="inline-flex items-center gap-1.5">
                        <i data-lucide="package" class="h-3.5 w-3.5 text-slate-400"></i>
                        <strong class="text-slate-700">${d.numArticulos} ART.</strong>
                        <span class="text-slate-300">·</span>
                        <strong class="text-slate-700">${d.m3Texto}</strong>
                    </span>

                    <span class="inline-flex items-center gap-1.5">
                        <i data-lucide="shield-check" class="h-3.5 w-3.5 text-slate-400"></i>
                        <strong class="text-slate-700">${d.serviciosContratados}</strong> servicios
                    </span>

                    <span class="inline-flex items-center gap-1.5">
                        <i data-lucide="camera" class="h-3.5 w-3.5 text-slate-400"></i>
                        <strong class="text-slate-700">${d.numFotos}</strong> fotos
                    </span>
                </div>

                <!-- ACCIONES: centradas al final de la tarjeta -->
                <div class="mt-3 flex flex-col items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                        type="button"
                        onclick="event.stopPropagation(); imprimirFicha(${d.id})"
                        class="no-print inline-flex w-full max-w-[240px] min-w-[210px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100 active:scale-[0.99]"
                    >
                        <i data-lucide="file-text" class="h-4 w-4"></i>
                        Ficha PDF
                    </button>

                    <button
                        type="button"
                        onclick="event.stopPropagation(); marcarCompletada(${d.id})"
                        class="no-print inline-flex w-full max-w-[240px] min-w-[210px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 active:scale-[0.99]"
                    >
                        <i data-lucide="check-circle-2" class="h-4 w-4"></i>
                        Marcar como Finalizada
                    </button>
                </div>

            </article>
        `;
    }


    //////////////////////////////////////////////////////////////
    // RENDER MARKETPLACE
    //////////////////////////////////////////////////////////////

    function renderizarGruposDeTarjetas(
        trabajos,
        crearTarjeta
    ) {
        // Cada fecha es un bloque visual independiente.
        // Dentro de cada bloque: 1 columna en móvil y 2 columnas en escritorio.
        // La misma distribución se utiliza en Trabajos disponibles y Mis mudanzas activas.


        if (
            !Array.isArray(trabajos) ||
            typeof crearTarjeta !== "function"
        ) {
            return "";
        }

        const ordenados =
            [...trabajos].sort(
                (a, b) =>
                    String(a?.fecha || "9999-12-31")
                        .localeCompare(
                            String(b?.fecha || "9999-12-31")
                        )
            );

        const grupos = new Map();

        ordenados.forEach(
            trabajo => {
                const clave =
                    String(
                        trabajo?.fecha ||
                        "sin-fecha"
                    );

                if (!grupos.has(clave)) {
                    grupos.set(clave, []);
                }

                grupos
                    .get(clave)
                    .push(trabajo);
            }
        );

        /*
         * El contenedor completo de los grupos debe ocupar todo el ancho
         * disponible. Esto evita que el contenedor padre del panel coloque
         * cada fecha como una columna independiente.
         *
         * Dentro de cada grupo de fecha:
         * - 2 columnas en escritorio.
         * - 1 columna en móvil.
         */
        let html = `
            <div
                class="rodax-grupos-fecha w-full"
                style="grid-column: 1 / -1;"
            >
        `;

        for (
            const [
                clave,
                trabajosFecha
            ] of grupos.entries()
        ) {

            const titulo =
                clave === "sin-fecha"
                    ? "Fecha no disponible"
                    : obtenerFechaCompleta(clave);

            html += `
                <section
    class="w-full rounded-3xl border border-[#D8E5F5] bg-[#EEF4FF] p-4 md:p-5 shadow-sm mb-4 md:mb-5"
>
                    <div class="mb-3 flex flex-wrap items-center gap-2 px-1">
                        <span class="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            <i data-lucide="calendar-days" class="h-3.5 w-3.5"></i>
                            ${escapeHtml(titulo)}
                        </span>

                        <span class="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                            ${trabajosFecha.length}
                            ${
                                trabajosFecha.length === 1
                                    ? "trabajo"
                                    : "trabajos"
                            }
                        </span>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                        ${
                            trabajosFecha
                                .map(crearTarjeta)
                                .join("")
                        }
                    </div>
                </section>
            `;
        }

        html += `
            </div>
        `;

        return html;
    }


    //////////////////////////////////////////////////////////////
    // RENDER MARKETPLACE
    //////////////////////////////////////////////////////////////

    function renderizarTarjetasMarketplace(
        trabajos
    ) {

        return renderizarGruposDeTarjetas(
            trabajos,
            crearTarjetaMarketplace
        );
    }


    //////////////////////////////////////////////////////////////
    // RENDER ACTIVAS
    //////////////////////////////////////////////////////////////

    function renderizarTarjetasActivas(
        trabajos
    ) {

        return renderizarGruposDeTarjetas(
            trabajos,
            crearTarjetaActiva
        );
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


        renderizarTarjetasActivas,


        renderizarGruposDeTarjetas

    };


    //////////////////////////////////////////////////////////////
    // CONFIRMACIÓN
    //////////////////////////////////////////////////////////////

    console.log(
        "✅ tarjetas.js cargado correctamente — versión modular RODAX"
    );


})();
