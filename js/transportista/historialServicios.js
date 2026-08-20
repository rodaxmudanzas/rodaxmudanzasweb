/**

 * ==========================================================

 * RODAX Marketplace

 * Archivo : js/transportista/historialServicios.js

 * Módulo  : Historial de servicios

 * ----------------------------------------------------------

 * Responsabilidad:

 * - Mostrar únicamente servicios finalizados del transportista.

 * - Renderizar tarjetas del historial.

 * - Mostrar franja horaria y accesos.

 * - Mantener un único botón por tarjeta: Ficha PDF.

 * ==========================================================

 */

 

(function (window) {

 

    "use strict";

 

    const TAB_ID = "tab-historial-servicios";

    const CONTENEDOR_ID = "historial-servicios-contenido";

 

    let cargando = false;

 

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

 function formatearUbicacionHistorial(
    mudanza,
    tipo
) {

    const prefijo =
        tipo === "destino"
            ? "destino"
            : "origen";

    const ciudad =
        mudanza?.[`${prefijo}_ciudad`] ||
        "";

    const cp =
        mudanza?.[`${prefijo}_cp`] ||
        "";

    const comunidad =
        mudanza?.[`${prefijo}_comunidad`] ||
        "";

    const provincia =
        mudanza?.[`${prefijo}_provincia`] ||
        "";

    /*
     * IMPORTANTE:
     * Nunca usamos mudanza.origen ni mudanza.destino
     * como respaldo aquí, porque podrían contener
     * la dirección exacta del cliente.
     */

    const partes = [];

    if (ciudad) {
        partes.push(
            String(ciudad).trim()
        );
    }

    if (cp) {
        partes.push(
            String(cp).trim()
        );
    }

    if (comunidad) {
        partes.push(
            String(comunidad).trim()
        );
    } else if (provincia) {
        /*
         * Respaldo temporal si todavía no existe
         * el campo de Comunidad Autónoma.
         */
        partes.push(
            String(provincia).trim()
        );
    }

    return partes.length
        ? partes.join(", ")
        : "Ubicación no disponible";
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

 

            return (

                `${partes[2]}-${partes[1]}-${partes[0]}`

            );

        }

 

        return escaparHTML(fecha);

    }

 

    function obtenerDia(fecha) {

 

        if (!fecha) {

            return "—";

        }

 

        const partes =

            String(fecha).split("-");

 

        return partes.length === 3

            ? partes[2]

            : "—";

    }

 

    function obtenerMes(fecha) {

 

        if (!fecha) {

            return "---";

        }

 

        const partes =

            String(fecha).split("-");

 

        if (partes.length !== 3) {

            return "---";

        }

 

        const meses = [

            "ENE", "FEB", "MAR", "ABR",

            "MAY", "JUN", "JUL", "AGO",

            "SEP", "OCT", "NOV", "DIC"

        ];

 

        return (

            meses[Number(partes[1]) - 1] ||

            "---"

        );

    }

 

    function esFinalizada(mudanza) {

 

        const estado =

            String(mudanza?.estado || "")

                .trim()

                .toLowerCase();

 

        return (

            estado === "completada" ||

            estado === "finalizada" ||

            estado === "mudanza finalizada"

        );

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

                mudanza?.tipo_servicio || ""

            ).toLowerCase();

 

        return tipo.includes("total")

            ? "Mudanza Total"

            : "Mudanza Estándar";

    }

 

    function normalizarAscensor(valor) {

 

        if (!valor) {

            return "";

        }

 

        const texto =

            String(valor)

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

            tienePiso

                ? Number(piso)

                : NaN;

 

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

 

        if (Number.isFinite(pisoNumero)) {

            return pisoNumero === 0

                ? "Un Bajo"

                : `Piso ${pisoNumero}`;

        }

 

        return "Acceso por confirmar";

    }

 function obtenerUbicacionHistorial(mudanza, tipo){

    const m = mudanza || {};

    const origen = tipo === "origen";

    const ciudad = origen
        ? (m.origen_ciudad ?? m.ciudad_origen ?? m.ciudadOrigen)
        : (m.destino_ciudad ?? m.ciudad_destino ?? m.ciudadDestino);

    const cp = origen
        ? (m.origen_cp ?? m.codigo_postal_origen ?? m.cp_origen)
        : (m.destino_cp ?? m.codigo_postal_destino ?? m.cp_destino);

    const comunidad = origen
        ? (m.origen_comunidad ?? m.comunidad_origen)
        : (m.destino_comunidad ?? m.comunidad_destino);

    const partes = [ciudad, cp, comunidad].filter(Boolean);

    return partes.length
        ? partes.join(" · ")
        : "Ubicación no disponible";
}

    const m = mudanza || {};
    const origen = tipo === "origen";

    const ciudad = origen
        ? (
            m.origen_ciudad ??
            m.ciudad_origen ??
            m.ciudadOrigen ??
            m.origen_localidad ??
            m.localidad_origen ??
            m.localidadOrigen ??
            m.origen_municipio ??
            m.municipio_origen ??
            m.municipioOrigen ??
            m.origen_poblacion ??
            m.poblacion_origen ??
            m.poblacionOrigen ??
            ""
        )
        : (
            m.destino_ciudad ??
            m.ciudad_destino ??
            m.ciudadDestino ??
            m.destino_localidad ??
            m.localidad_destino ??
            m.localidadDestino ??
            m.destino_municipio ??
            m.municipio_destino ??
            m.municipioDestino ??
            m.destino_poblacion ??
            m.poblacion_destino ??
            m.poblacionDestino ??
            ""
        );

    const codigoPostal = origen
        ? (
            m.origen_cp ??
            m.cp_origen ??
            m.codigo_postal_origen ??
            m.codigoPostalOrigen ??
            m.postal_origen ??
            m.origen_codigo_postal ??
            ""
        )
        : (
            m.destino_cp ??
            m.cp_destino ??
            m.codigo_postal_destino ??
            m.codigoPostalDestino ??
            m.postal_destino ??
            m.destino_codigo_postal ??
            ""
        );

    const comunidad = origen
        ? (
            m.origen_comunidad_autonoma ??
            m.comunidad_autonoma_origen ??
            m.comunidadOrigen ??
            m.origen_comunidad ??
            m.comunidad_origen ??
            m.autonomia_origen ??
            ""
        )
        : (
            m.destino_comunidad_autonoma ??
            m.comunidad_autonoma_destino ??
            m.comunidadDestino ??
            m.destino_comunidad ??
            m.comunidad_destino ??
            m.autonomia_destino ??
            ""
        );

    const partes = [
        ciudad,
        codigoPostal,
        comunidad
    ]
        .map(valor => String(valor || "").trim())
        .filter(Boolean);

    return partes.length
        ? partes.join(", ")
        : "Ubicación no disponible";
}

    function obtenerAccesoOrigen(mudanza) {

    const m = mudanza || {};

    const ascensor =
        m.ascensor_origen ??
        m.origen_ascensor ??
        m.ascensorOrigen ??
        m.ascensor_recogida ??
        m.recogida_ascensor ??
        null;

    const piso =
        m.piso_origen ??
        m.origen_piso ??
        m.pisoOrigen ??
        m.piso_recogida ??
        m.recogida_piso ??
        null;

    if (
        ascensor !== null ||
        piso !== null
    ) {
        return formatearAcceso(
            ascensor,
            piso
        );
    }

    const texto =
        String(
            m.ascensor || ""
        ).trim();

    if (texto) {

        const coincidencia =
            texto.match(
                /recogida\s*:\s*(.*?)(?:\s*\||$)/i
            );

        if (coincidencia) {
            return formatearAcceso(
                coincidencia[1].trim(),
                null
            );
        }

        if (
            /ascensor/i.test(texto)
        ) {
            return normalizarAscensor(texto);
        }
    }

    return "Acceso por confirmar";
}


function obtenerAccesoDestino(mudanza) {

    const m = mudanza || {};

    const ascensor =
        m.ascensor_destino ??
        m.destino_ascensor ??
        m.ascensorDestino ??
        m.ascensor_entrega ??
        m.entrega_ascensor ??
        null;

    const piso =
        m.piso_destino ??
        m.destino_piso ??
        m.pisoDestino ??
        m.piso_entrega ??
        m.entrega_piso ??
        null;

    if (
        ascensor !== null ||
        piso !== null
    ) {
        return formatearAcceso(
            ascensor,
            piso
        );
    }

    const texto =
        String(
            m.ascensor || ""
        ).trim();

    if (texto) {

        const coincidencia =
            texto.match(
                /entrega\s*:\s*(.*?)(?:\s*\||$)/i
            );

        if (coincidencia) {
            return formatearAcceso(
                coincidencia[1].trim(),
                null
            );
        }

        if (
            /ascensor/i.test(texto)
        ) {
            return normalizarAscensor(texto);
        }
    }

    return "Acceso por confirmar";
}

 

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

 

        return null;

    }

 

    async function obtenerTransportistaId() {

 

        if (window.currentUserId) {

            return window.currentUserId;

        }

 

        if (

            window.Transportista &&

            window.Transportista.currentUserId

        ) {

            return window.Transportista.currentUserId;

        }

 

        const cliente =

            obtenerClienteSupabase();

 

        if (

            cliente?.auth &&

            typeof cliente.auth.getUser === "function"

        ) {

 

            const {

                data,

                error

            } =

                await cliente.auth.getUser();

 

            if (

                !error &&

                data?.user?.id

            ) {

                return data.user.id;

            }

        }

 

        return null;

    }

 

    async function obtenerMudanzasHistorial() {

 

        const cliente =

            obtenerClienteSupabase();

 

        if (!cliente) {

 

            throw new Error(

                "No se encontró el cliente de Supabase."

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

                        ascending: false

                    }

                );

 

        if (error) {

            throw error;

        }

 

        return Array.isArray(data)

            ? data.filter(esFinalizada)

            : [];

    }

 

    function obtenerTotalArticulos(mudanza) {

 

        let inventario =

            mudanza?.inventario;

 

        if (!inventario) {

            return 0;

        }

 

        try {

 

            if (

                typeof inventario === "string"

            ) {

                inventario =

                    JSON.parse(

                        inventario

                    );

            }

 

        } catch {

 

            return 0;

        }

 

        if (!Array.isArray(inventario)) {

            return 0;

        }

 

        return inventario.reduce(

            (total, item) => {

 

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

 

    function crearTarjetaHistorial(mudanza) {

 

        const id =

            escaparHTML(mudanza?.id);

 

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

            mudanza?.preciototal ??

            mudanza?.importe_total ??

            "—";

 

        const kilometros =

            mudanza?.km !== undefined &&

            mudanza?.km !== null

                ? `${mudanza.km} km`

                : "—";

 

        const volumen =

            mudanza?.volumen || "—";

 

        const articulos =

            obtenerTotalArticulos(mudanza);

 

        const numeroReserva =

            mudanza?.numero_reserva || "—";

 

        return `

            <article

                class="

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

                            flex flex-wrap

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

                                flex flex-wrap

                                items-center gap-2

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

                                    border-emerald-200

                                    bg-emerald-50

                                    text-emerald-700

                                "

                            >

                                Completada

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

                            flex items-center gap-3

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
    obtenerUbicacionHistorial(
        mudanza,
        "origen"
    )
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

                                hidden lg:flex

                                items-center justify-center

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
    obtenerUbicacionHistorial(
        mudanza,
        "destino"
    )
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

                            text-xs font-semibold

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

                            ${escaparHTML(kilometros)}

                        </span>

 

                        <span

                            class="inline-flex items-center gap-1.5"

                        >

                            <i

                                data-lucide="box"

                                class="w-3.5 h-3.5 text-slate-400"

                            ></i>

                            ${escaparHTML(articulos)} art.

                        </span>

 

                        <span

                            class="inline-flex items-center gap-1.5"

                        >

                            <i

                                data-lucide="ruler"

                                class="w-3.5 h-3.5 text-slate-400"

                            ></i>

                            ${escaparHTML(volumen)}

                        </span>

 

                        <span

                            class="inline-flex items-center gap-1.5"

                        >

                            <i

                                data-lucide="hash"

                                class="w-3.5 h-3.5 text-slate-400"

                            ></i>

                            ${escaparHTML(numeroReserva)}

                        </span>

 

                    </div>

 

                    <div

                        class="

                            mt-5

                            flex flex-wrap

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

                            data-historial-ficha-id="${id}"

                        >

                            Ficha PDF

 

                            <i

                                data-lucide="file-text"

                                class="w-4 h-4"

                            ></i>

                        </button>

 

                    </div>

 

                </div>

 

            </article>

        `;

    }

 

    function obtenerContenedor() {

 

        return document.getElementById(

            CONTENEDOR_ID

        );

    }

 

    function render(lista) {

 

        const contenedor =

            obtenerContenedor();

 

        if (!contenedor) {

            console.error(

                "[RODAX Historial] No existe #" +

                CONTENEDOR_ID

            );

            return;

        }

 

        const historial =

            Array.isArray(lista)

                ? [...lista].sort(

                    (a, b) =>

                        String(

                            obtenerFecha(b) || ""

                        ).localeCompare(

                            String(

                                obtenerFecha(a) || ""

                            )

                        )

                )

                : [];

 

        window.historialServiciosCache =

            historial;

 window.RODAX_HISTORIAL_SERVICIOS =
    Array.isArray(historial)
        ? historial.slice()
        : [];

        if (!historial.length) {

 

            contenedor.innerHTML = `

                <div

                    class="

                        rounded-2xl

                        border border-dashed

                        border-slate-300

                        bg-slate-50

                        p-10

                        text-center

                    "

                >

 

                    <i

                        data-lucide="archive"

                        class="

                            w-10 h-10

                            mx-auto mb-3

                            text-slate-400

                        "

                    ></i>

 

                    <div

                        class="

                            font-black

                            text-slate-700

                        "

                    >

                        Todavía no hay servicios en tu historial

                    </div>

 

                    <div

                        class="

                            text-sm

                            text-slate-500

                            mt-1

                        "

                    >

                        Las mudanzas finalizadas aparecerán aquí.

                    </div>

 

                </div>

            `;

 

        } else {

 

            contenedor.innerHTML = `
    <div class="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-5
        bg-[#eef4ff]
        border border-blue-100
        rounded-3xl
        p-4
    ">
        ${historial
            .map(crearTarjetaHistorial)
            .join("")}
    </div>
`;

        }

 

        contenedor

            .querySelectorAll(

                "[data-historial-ficha-id]"

            )

            .forEach(

                boton => {

 

                    boton.addEventListener(

                        "click",

                        () => {

 

                            const id =

                                boton.getAttribute(

                                    "data-historial-ficha-id"

                                );

 

                            if (

                                typeof window.imprimirFicha ===

                                "function"

                            ) {

 

                                window.imprimirFicha(id, true);

 

                                return;

                            }

 

                            console.error(

                                "[RODAX Historial] " +

                                "imprimirFicha() no está disponible."

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

 

    async function cargar() {

 

        if (cargando) {

            return;

        }

 

        const contenedor =

            obtenerContenedor();

 

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

 

                <i

                    data-lucide="loader-circle"

                    class="

                        w-8 h-8

                        mx-auto mb-3

                        text-blue-600

                        animate-spin

                    "

                ></i>

 

                <div

                    class="

                        text-sm

                        font-bold

                        text-slate-600

                    "

                >

                    Cargando historial de servicios...

                </div>

 

            </div>

        `;

 

        if (window.lucide) {

            window.lucide.createIcons();

        }

 

        try {

 

            const datos =

                await obtenerMudanzasHistorial();

 

            console.log(

                "[RODAX Historial] Servicios:",

                datos.length

            );

 

            render(datos);

 

        } catch (error) {

 

            console.error(

                "[RODAX Historial] Error:",

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

                                No se pudo cargar el historial de servicios

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

 

            if (window.lucide) {

                window.lucide.createIcons();

            }

 

        } finally {

 

            cargando = false;

        }

    }

 

    const API = {

 

        cargar,

        render

 

    };

 

    window.Transportista =

        window.Transportista || {};

 

    window.Transportista

        .HistorialServicios =

        API;

 

    window.cargarHistorialServicios =

        cargar;

 

    function iniciar() {

 

        const tab =

            document.getElementById(

                TAB_ID

            );

 

        if (!tab) {

 

            setTimeout(

                iniciar,

                500

            );

 

            return;

        }

 

        if (

            !tab.classList.contains(

                "hidden"

            )

        ) {

            cargar();

        }

 

        const observer =

            new MutationObserver(

                () => {

 

                    if (

                        !tab.classList.contains(

                            "hidden"

                        )

                    ) {

                        cargar();

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

    }

 

    if (

        document.readyState === "loading"

    ) {

 

        document.addEventListener(

            "DOMContentLoaded",

            iniciar,

            { once: true }

        );

 

    } else {

 

        iniciar();

    }

 

    console.log(

        "✅ RODAX Historial de servicios cargado correctamente"

    );

 

})(window);