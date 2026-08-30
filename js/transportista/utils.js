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
    // INVENTARIO RODAX — REGLA CENTRAL MUDANZA TOTAL
    //////////////////////////////////////////////////////

    const RODAX_CATEGORIAS_INVENTARIO = {
        "Salón": [
                "Sofá 2 plazas",
                "Sofá 3 plazas",
                "Sofá chaise longue",
                "Sofá cama",
                "Butaca",
                "Puff",
                "Mesa de centro",
                "Mesa auxiliar",
                "Mueble TV",
                "Televisión pequeña - 40\"",
                "Televisión pequeña",
                "Televisión grande + 40\"",
                "Televisión grande",
                "Equipo de sonido",
                "Altavoces",
                "Estantería pequeña",
                "Estantería grande",
                "Estantería",
                "Librería",
                "Vitrina",
                "Aparador",
                "Consola recibidor",
                "Chimenea eléctrica",
                "Mesa escritorio",
                "Silla escritorio",
                "Ordenador sobremesa",
                "Monitor",
                "Impresora",
                "Lámpara de pie",
                "Lámpara de mesa",
                "Lámpara mesa",
                "Cuadros grandes",
                "Cuadros pequeños",
                "Alfombra pequeña",
                "Alfombra grande",
                "Cortinas",
                "Espejo grande",
                "Espejo pequeño",
                "Aire acondicionado portátil",
                "Planta decorativa grande",
                "Planta decorativa pequeña"
        ],
        "Cocina": [
                "Nevera",
                "Frigorífico americano",
                "Congelador",
                "Lavadora",
                "Secadora",
                "Lavavajillas",
                "Horno",
                "Microondas",
                "Vitrocerámica",
                "Cafetera",
                "Mesa cocina",
                "Sillas cocina",
                "Isla cocina",
                "Carro auxiliar cocina",
                "Estantería cocina",
                "Vajillero",
                "Campana extractora",
                "Taburete",
                "Mueble auxiliar",
                "Cubo reciclaje",
                "Robot cocina",
                "Batidora",
                "Tostadora",
                "Freidora de aire",
                "Envasadora vacío",
                "Botellero",
                "Nevera pequeña",
                "Arcón congelador",
                "Dispensador agua",
                "Caja utensilios",
                "Bandejas cocina"
        ],
        "Comedor": [
                "Mesa comedor pequeña",
                "Mesa comedor grande",
                "Mesa extensible",
                "Sillas comedor",
                "Silla comedor",
                "Banco comedor",
                "Vitrina",
                "Aparador",
                "Cómoda comedor",
                "Carrito bebidas",
                "Mueble bar",
                "Espejo comedor",
                "Lámpara techo",
                "Alfombra comedor",
                "Cuadro decorativo",
                "Estantería comedor",
                "Vajillero",
                "Consola comedor",
                "Mesa auxiliar",
                "Trona bebé"
        ],
        "Dormitorio": [
                "Cama Individual",
                "Cama Doble",
                "Cama king size",
                "Litera",
                "Canapé abatible",
                "Colchón",
                "Colchón individual",
                "Colchón doble",
                "Cabecero",
                "Mesita de noche",
                "Cómoda",
                "Sinfonier",
                "Armario",
                "Armario pequeño",
                "Armario grande",
                "Armario corredero",
                "Vestidor desmontable",
                "Escritorio",
                "Silla escritorio",
                "Tocador",
                "Espejo cuerpo entero",
                "Televisión dormitorio",
                "Estantería",
                "Librería",
                "Zapatero",
                "Cuna bebé",
                "Cambiador bebé",
                "Sillón dormitorio",
                "Perchero",
                "Banco dormitorio",
                "Caja organizadora",
                "Maleta pequeña",
                "Maleta grande",
                "Ventilador",
                "Lámpara techo",
                "Lámpara mesa",
                "Cortinas",
                "Alfombra"
        ],
        "Baño": [
                "Mueble Baño",
                "Lavabo auxiliar",
                "Espejo baño",
                "Estantería baño",
                "Armario baño",
                "Cesto ropa",
                "Lavadora pequeña",
                "Secadora pequeña",
                "Mueble almacenaje",
                "Zapatero baño",
                "Calefactor baño",
                "Toallero eléctrico",
                "Carrito baño",
                "Banco baño",
                "Organizador baño",
                "Mampara"
        ],
        "Otros": [
                "Caja Pequeña",
                "Caja Mediana",
                "Caja Grande",
                "Caja armario",
                "Caja libros",
                "Caja frágil",
                "Bicicleta",
                "Bici",
                "Patinete eléctrico",
                "Moto pequeña",
                "Maleta pequeña",
                "Maleta grande",
                "Esquíes",
                "Tabla surf",
                "Tabla paddle surf",
                "Instrumento musical pequeño",
                "Piano eléctrico",
                "Guitarra",
                "Batería musical",
                "Impresora grande",
                "Caja herramientas",
                "Aspiradora",
                "Escalera",
                "Perchero",
                "Ventilador",
                "Radiador portátil",
                "Cuadro grande",
                "Cuadro pequeño",
                "Planta grande",
                "Planta pequeña",
                "Planta",
                "Jaula mascota",
                "Acuario pequeño",
                "Acuario grande"
        ]
};

    const RODAX_EXTRAS_NOMBRES = {
        "caja pequena": "Cajas pequeñas",
        "caja mediana": "Cajas medianas",
        "caja grande": "Cajas grandes"
    };

    function normalizarNombreInventario(valor) {
        return String(valor ?? "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function esMudanzaTotalInventario(tipoServicio) {
        return normalizarNombreInventario(tipoServicio).includes("total");
    }

    function obtenerNombreItemInventario(item) {
        return String(
            item?.nombre ??
            item?.mueble ??
            item?.item ??
            item?.descripcion ??
            "Artículo"
        ).trim();
    }

    function obtenerCantidadItemInventario(item) {
        const n = Number.parseInt(item?.cantidad, 10);
        return Number.isFinite(n) ? Math.max(0, n) : 0;
    }

    function obtenerCategoriaInventario(nombre) {
        const clave = normalizarNombreInventario(nombre);
        for (const [categoria, items] of Object.entries(RODAX_CATEGORIAS_INVENTARIO)) {
            if (items.some(item => normalizarNombreInventario(item) === clave)) {
                return categoria;
            }
        }
        return "Otros";
    }

    function separarInventarioMudanza(inventario, tipoServicio) {
        const items = parseInventario(inventario);
        const total = esMudanzaTotalInventario(tipoServicio);
        const visible = [];
        const extras = {
            "Cajas pequeñas": 0,
            "Cajas medianas": 0,
            "Cajas grandes": 0
        };

        items.forEach(item => {
            const cantidad = obtenerCantidadItemInventario(item);
            if (cantidad <= 0) return;

            const nombre = obtenerNombreItemInventario(item);
            const clave = normalizarNombreInventario(nombre);

            if (total && RODAX_EXTRAS_NOMBRES[clave]) {
                extras[RODAX_EXTRAS_NOMBRES[clave]] += cantidad;
                return;
            }

            visible.push({
                ...item,
                nombre,
                cantidad,
                categoria: item?.categoria || item?.grupo || item?.seccion || obtenerCategoriaInventario(nombre)
            });
        });

        return { visible, extras };
    }

    function obtenerExtrasMudanzaTotal(mudanza) {
        const t = mudanza || {};
        const resultado = {
            "Cajas pequeñas": 0,
            "Cajas medianas": 0,
            "Cajas grandes": 0
        };

        if (!esMudanzaTotalInventario(t.tipo_servicio)) return resultado;

        // 1) Primero respetamos campos estructurados/directos si existen.
        const fuentes = [
            t.extras_mudanza_total,
            t.extrasMudanzaTotal,
            t.beneficios_mudanza_total,
            t.beneficiosMudanzaTotal,
            t.cajas_extras,
            t.cajasExtras
        ];

        const aliases = {
            "Cajas pequeñas": ["cajas_pequenas","cajasPequenas","cajas_pequena","cajasPequena","beneficio_cajas_pequenas","beneficioCajasPequenas"],
            "Cajas medianas": ["cajas_medianas","cajasMedianas","cajas_mediana","cajasMediana","beneficio_cajas_medianas","beneficioCajasMedianas"],
            "Cajas grandes": ["cajas_grandes","cajasGrandes","cajas_grande","cajasGrande","beneficio_cajas_grandes","beneficioCajasGrandes"]
        };

        for (const [etiqueta, nombres] of Object.entries(aliases)) {
            for (const fuente of [t, ...fuentes]) {
                if (!fuente || typeof fuente !== "object" || Array.isArray(fuente)) continue;
                for (const nombre of nombres) {
                    if (fuente[nombre] !== undefined && fuente[nombre] !== null && fuente[nombre] !== "") {
                        const n = Number(fuente[nombre]);
                        if (Number.isFinite(n) && n > 0) {
                            resultado[etiqueta] = n;
                            break;
                        }
                    }
                }
                if (resultado[etiqueta] > 0) break;
            }
        }

        // 2) Si no llegaron como campos, las cantidades de las tres
        // cajas de beneficios se recuperan del inventario por nombre EXACTO.
        const desdeInventario = separarInventarioMudanza(t.inventario, t.tipo_servicio).extras;
        for (const etiqueta of Object.keys(resultado)) {
            if (resultado[etiqueta] <= 0 && desdeInventario[etiqueta] > 0) {
                resultado[etiqueta] = desdeInventario[etiqueta];
            }
        }

        return resultado;
    }

    function obtenerResumenInventarioMudanza(mudanza) {
        const t = mudanza || {};
        const separado = separarInventarioMudanza(t.inventario, t.tipo_servicio);
        const extrasDirectos = obtenerExtrasMudanzaTotal(t);
        const extras = { ...separado.extras };

        for (const etiqueta of Object.keys(extras)) {
            if (extrasDirectos[etiqueta] > 0) extras[etiqueta] = extrasDirectos[etiqueta];
        }

        const totalArticulos = separado.visible.reduce((s, item) => s + obtenerCantidadItemInventario(item), 0);
        const totalM3 = separado.visible.reduce((s, item) => {
            let m3 = Number(item?.metrosCubicos ?? item?.m3);
            if (!Number.isFinite(m3) || m3 <= 0) m3 = 0.5;
            return s + obtenerCantidadItemInventario(item) * m3;
        }, 0);

        const categorias = {};
        Object.keys(RODAX_CATEGORIAS_INVENTARIO).forEach(c => categorias[c] = []);
        separado.visible.forEach(item => {
            const categoria = item.categoria || obtenerCategoriaInventario(item.nombre);
            (categorias[categoria] || (categorias[categoria] = [])).push({ nombre: item.nombre, cantidad: item.cantidad });
        });

        return {
            esMudanzaTotal: esMudanzaTotalInventario(t.tipo_servicio),
            visible: separado.visible,
            categorias,
            extras,
            totalArticulos,
            totalM3
        };
    }

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

function getTotalArticulos(inventario, tipoServicio) {
        const items = esMudanzaTotalInventario(tipoServicio)
            ? separarInventarioMudanza(inventario, tipoServicio).visible
            : parseInventario(inventario);

        return items.reduce((total, item) => total + obtenerCantidadItemInventario(item), 0);
    }


//////////////////////////////////////////////////////
// TOTAL M³
//////////////////////////////////////////////////////

function getTotalM3(inventario, tipoServicio) {
        const items = esMudanzaTotalInventario(tipoServicio)
            ? separarInventarioMudanza(inventario, tipoServicio).visible
            : parseInventario(inventario);

        return items.reduce((total, item) => {
            const cantidad = obtenerCantidadItemInventario(item);
            let m3Unitario = Number(item?.metrosCubicos ?? item?.m3);
            if (!Number.isFinite(m3Unitario) || m3Unitario <= 0) m3Unitario = 0.5;
            return total + cantidad * m3Unitario;
        }, 0);
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


    window.Transportista.normalizarNombreInventario =
        normalizarNombreInventario;

    window.Transportista.separarInventarioMudanza =
        separarInventarioMudanza;

    window.Transportista.obtenerExtrasMudanzaTotal =
        obtenerExtrasMudanzaTotal;

    window.Transportista.obtenerResumenInventarioMudanza =
        obtenerResumenInventarioMudanza;

    window.Transportista.obtenerCategoriaInventario =
        obtenerCategoriaInventario;

    window.Transportista.parseInventario =
        parseInventario;

    window.Transportista.getTotalArticulos =
        getTotalArticulos;

    window.Transportista.getTotalM3 =
        getTotalM3;

        //////////////////////////////////////////////////////
// COBRO DEL TRANSPORTISTA — 60% DEL PRECIO CLIENTE
//////////////////////////////////////////////////////

function getPrecioTransportista(mudanza) {

    const candidatos = [
        mudanza?.preciototal,
        mudanza?.precio_total,
        mudanza?.precioTotal
    ];

    let precioCliente = NaN;

    for (const candidato of candidatos) {

        if (
            candidato === null ||
            candidato === undefined ||
            candidato === ""
        ) {
            continue;
        }

        let texto = String(candidato)
            .trim()
            .replace(/€/g, "")
            .replace(/\s/g, "");

        if (
            texto.includes(".") &&
            texto.includes(",")
        ) {
            texto = texto
                .replace(/\./g, "")
                .replace(",", ".");
        }
        else if (texto.includes(",")) {
            texto = texto.replace(",", ".");
        }

        const numero = Number(texto);

        if (Number.isFinite(numero)) {
            precioCliente = numero;
            break;
        }
    }

    if (!Number.isFinite(precioCliente)) {
        return 0;
    }

    const precioTransportista =
        Math.round(
            precioCliente * 0.60 * 100
        ) / 100;

    return precioTransportista;
}

window.Transportista.getPrecioTransportista =
    getPrecioTransportista;

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
