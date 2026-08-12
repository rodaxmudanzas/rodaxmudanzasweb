(function () {

    "use strict";

    window.Transportista = window.Transportista || {};

    window.Transportista.dbClient =
        window.Transportista.dbClient || null;

    window.Transportista.state =
        window.Transportista.state || null;

    window.Transportista.currentUserId =
        window.Transportista.currentUserId || null;

 //////////////////////////////////////////////////////
// INVENTARIO
//////////////////////////////////////////////////////

function parseInventario(inventario) {

    if (!inventario) return [];

    if (Array.isArray(inventario)) {
        return inventario;
    }

    if (typeof inventario === "string") {

        try {

            const parsed =
                JSON.parse(inventario);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.warn(
                "No se pudo interpretar el inventario:",
                error
            );

            return [];
        }
    }

    return [];
}


//////////////////////////////////////////////////////
// TOTAL ARTÍCULOS
//////////////////////////////////////////////////////

function getTotalArticulos(inventario) {

    const items =
        parseInventario(inventario);

    return items.reduce(
        (total, item) => {

            const cantidad =
                Number.parseInt(
                    item?.cantidad,
                    10
                );

            return total +
                (
                    Number.isFinite(cantidad)
                        ? Math.max(0, cantidad)
                        : 0
                );

        },
        0
    );
}


//////////////////////////////////////////////////////
// TOTAL M³
//////////////////////////////////////////////////////

function getTotalM3(inventario) {

    const items =
        parseInventario(inventario);

    return items.reduce(
        (total, item) => {

            const cantidad =
                Number.parseInt(
                    item?.cantidad,
                    10
                ) || 0;

            let m3Unitario =
                Number(
                    item?.metrosCubicos ??
                    item?.m3
                );

            if (
                !Number.isFinite(m3Unitario) ||
                m3Unitario <= 0
            ) {
                m3Unitario = 0.5;
            }

            return total +
                (
                    Math.max(0, cantidad) *
                    m3Unitario
                );

        },
        0
    );
}


//////////////////////////////////////////////////////
// FORMATO M³
//////////////////////////////////////////////////////

function formatM3(valor) {

    const numero =
        Number(valor) || 0;

    return new Intl.NumberFormat(
        "es-ES",
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ).format(numero) + " m³";
}
    //////////////////////////////////////////////////////
    // ID VISUAL RODAX
    //////////////////////////////////////////////////////

    function getNumeroReserva(mudanza) {

        return (
            mudanza?.numero_reserva ||
            "—"
        );
    }


    //////////////////////////////////////////////////////
    // NORMALIZAR ASCENSOR
    //////////////////////////////////////////////////////

    function normalizarAscensor(valor) {

        const texto =
            String(valor ?? "")
                .trim()
                .toLowerCase();

        if (
            texto === "si" ||
            texto === "sí" ||
            texto === "true" ||
            texto === "1" ||
            texto === "con"
        ) {
            return "si";
        }

        if (
            texto === "no" ||
            texto === "false" ||
            texto === "0" ||
            texto === "sin"
        ) {
            return "no";
        }

        if (texto.includes("con ascensor")) {
            return "si";
        }

        if (texto.includes("sin ascensor")) {
            return "no";
        }

        if (texto.includes("c/ascensor")) {
            return "si";
        }

        if (texto.includes("s/ascensor")) {
            return "no";
        }

        return null;
    }


    //////////////////////////////////////////////////////
    // EXTRAER PISO
    //////////////////////////////////////////////////////

    function extraerPiso(valor) {

        const texto =
            String(valor ?? "").trim();

        if (
            /un\s+bajo/i.test(texto) ||
            /\bbajo\b/i.test(texto)
        ) {
            return {
                valor: 0,
                conocido: true
            };
        }

        const match =
            texto.match(
                /(?:piso|planta)\s*:?\s*(\d+)/i
            );

        if (match) {

            return {
                valor: parseInt(match[1], 10),
                conocido: true
            };
        }

        return {
            valor: 0,
            conocido: false
        };
    }


    //////////////////////////////////////////////////////
    // FORMATO DEFINITIVO DEL ACCESO
    //////////////////////////////////////////////////////

    function formatAcceso(ascensor, piso, pisoConocido = true) {

        const asc =
            normalizarAscensor(ascensor);

        const numeroPiso =
            Math.max(0, parseInt(piso, 10) || 0);


        // REGLA UNIVERSAL:
        // PISO 0 = UN BAJO
        if (numeroPiso === 0 && pisoConocido) {

            if (asc === "si") {
                return "Un Bajo · Con ascensor";
            }

            if (asc === "no") {
                return "Un Bajo · Sin ascensor";
            }

            return "Un Bajo";
        }


        // PISO +1 O SUPERIOR

        if (numeroPiso >= 1) {

            if (asc === "si") {
                return `Con ascensor · Piso ${numeroPiso}`;
            }

            if (asc === "no") {
                return `Sin ascensor · Piso ${numeroPiso}`;
            }

            return `Piso ${numeroPiso}`;
        }


        // DATOS ANTIGUOS SIN PISO GUARDADO

        if (asc === "si") {
            return "Con ascensor";
        }

        if (asc === "no") {
            return "Sin ascensor";
        }

        return "Acceso por confirmar";
    }


    //////////////////////////////////////////////////////
    // EXTRAER UN PUNTO DE ACCESO
    //////////////////////////////////////////////////////

    function parseAccesoTexto(texto) {

        const original =
            String(texto ?? "").trim();

        const ascensor =
            normalizarAscensor(original);

        const pisoInfo =
            extraerPiso(original);

        return {
            ascensor,
            piso: pisoInfo.valor,
            pisoConocido: pisoInfo.conocido,
            texto: formatAcceso(
                ascensor,
                pisoInfo.valor,
                pisoInfo.conocido
            )
        };
    }


    //////////////////////////////////////////////////////
    // OBTENER RECOGIDA / ENTREGA
    //////////////////////////////////////////////////////

    function getAccesos(mudanza) {

        ////////////////////////////////////////////////////
        // FUTURO / DATOS ESTRUCTURADOS
        ////////////////////////////////////////////////////

        const ascOrigen =
            mudanza?.ascensor_origen ??
            mudanza?.origen_ascensor;

        const pisoOrigen =
            mudanza?.piso_origen ??
            mudanza?.origen_piso;

        const ascDestino =
            mudanza?.ascensor_destino ??
            mudanza?.destino_ascensor;

        const pisoDestino =
            mudanza?.piso_destino ??
            mudanza?.destino_piso;


        if (
            ascOrigen !== undefined ||
            pisoOrigen !== undefined ||
            ascDestino !== undefined ||
            pisoDestino !== undefined
        ) {

            const pisoO =
                Number(pisoOrigen ?? 0);

            const pisoD =
                Number(pisoDestino ?? 0);

            return {

                recogida: formatAcceso(
                    ascOrigen,
                    pisoO,
                    true
                ),

                entrega: formatAcceso(
                    ascDestino,
                    pisoD,
                    true
                )
            };
        }


        ////////////////////////////////////////////////////
        // FORMATO ACTUAL:
        //
        // Recogida: ...
        // |
        // Entrega: ...
        ////////////////////////////////////////////////////

        const raw =
            String(mudanza?.ascensor ?? "");

        const partes =
            raw.split("|");


        const recogidaRaw =
            (partes[0] || "")
                .replace(/^Recogida\s*:/i, "")
                .trim();

        const entregaRaw =
            (partes[1] || "")
                .replace(/^Entrega\s*:/i, "")
                .trim();


        return {

            recogida:
                parseAccesoTexto(recogidaRaw).texto,

            entrega:
                parseAccesoTexto(entregaRaw).texto
        };
    }


    //////////////////////////////////////////////////////
    // EXPONER API COMÚN
    //////////////////////////////////////////////////////

    window.Transportista.parseInventario =
        parseInventario;

    window.Transportista.getTotalArticulos =
        getTotalArticulos;

    window.Transportista.getTotalM3 =
        getTotalM3;

    window.Transportista.formatM3 =
        formatM3;

    window.Transportista.getNumeroReserva =
        getNumeroReserva;

    window.Transportista.normalizarAscensor =
        normalizarAscensor;

    window.Transportista.formatAcceso =
        formatAcceso;

    window.Transportista.getAccesos =
        getAccesos;


})();