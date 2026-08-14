window.Transportista = window.Transportista || {};

let marketplaceCargando = false;

///////////////////////////////////////////////////////////
// REFERENCIAS SEGURAS DEL PANEL
///////////////////////////////////////////////////////////

function obtenerDbClientMarketplace() {

    const candidatos = [
        window.dbClient,
        window.supabaseClient,
        window.Transportista?.dbClient,
        window.Transportista?.supabaseClient
    ];

    for (const cliente of candidatos) {

        if (
            cliente &&
            typeof cliente.from === "function"
        ) {
            return cliente;
        }
    }

    /*
     * Compatibilidad con un dbClient declarado con
     * const/let en otro script clásico de la misma página.
     */
    try {

        if (
            typeof dbClient !== "undefined" &&
            dbClient &&
            typeof dbClient.from === "function"
        ) {
            return dbClient;
        }

    } catch (_) {
        // El identificador no existe en este contexto.
    }

    return null;
}


function obtenerStateMarketplace() {

    if (
        window.state &&
        typeof window.state === "object"
    ) {
        return window.state;
    }

    /*
     * Compatibilidad con un state declarado con
     * const/let en otro script clásico.
     */
    try {

        if (
            typeof state !== "undefined" &&
            state &&
            typeof state === "object"
        ) {
            return state;
        }

    } catch (_) {
        // El identificador no existe en este contexto.
    }

    if (
        !window.marketplaceStateFallback ||
        typeof window.marketplaceStateFallback !== "object"
    ) {
        window.marketplaceStateFallback = {
            disponibles: []
        };
    }

    return window.marketplaceStateFallback;
}


function obtenerCurrentUserIdMarketplace() {

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
     * Compatibilidad con currentUserId declarado con
     * const/let en otro script clásico.
     */
    try {

        if (
            typeof currentUserId !== "undefined" &&
            currentUserId
        ) {
            return currentUserId;
        }

    } catch (_) {
        // El identificador no existe en este contexto.
    }

    return null;
}



///////////////////////////////////////////////////////////
// SISTEMA INTEGRAL DE FILTROS MARKETPLACE
///////////////////////////////////////////////////////////

let filtroMarketplaceBusqueda = "";

const filtrosMarketplace = {
    fecha: "todas",
    fechaPersonalizada: "",
    zona: "todas",
    distancia: "todas",
    vehiculo: "todas",
    tipoServicio: "todos",
    precio: "todos",
    volumen: "todos",
    articulos: "todos",
    ascensor: "todos",
    fotos: "todos",
    servicios: "todos"
};

let marketplaceFiltroPopover = null;

function normalizarTextoMarketplace(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function obtenerValorCampoMarketplace(objeto, campos) {
    if (!objeto || typeof objeto !== "object") return null;

    for (const campo of campos) {
        const valor = objeto[campo];

        if (
            valor !== undefined &&
            valor !== null &&
            valor !== ""
        ) {
            return valor;
        }
    }

    return null;
}

function convertirNumeroMarketplace(valor) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    if (typeof valor === "number") {
        return Number.isFinite(valor)
            ? valor
            : null;
    }

    const texto = String(valor)
        .replace(/\s/g, "")
        .replace(/€/g, "")
        .replace(/m³|m3|km/gi, "")
        .replace(/\.(?=\d{3}(?:\D|$))/g, "")
        .replace(",", ".");

    const numero = parseFloat(texto);

    return Number.isFinite(numero)
        ? numero
        : null;
}

function obtenerKmMarketplace(trabajo) {

    return convertirNumeroMarketplace(
        obtenerValorCampoMarketplace(
            trabajo,
            [
                "km",
                "distancia_km",
                "distanciaKm",
                "distancia",
                "kilometros",
                "kilómetros"
            ]
        )
    );
}

function obtenerPrecioMarketplace(trabajo) {

    return convertirNumeroMarketplace(
        obtenerValorCampoMarketplace(
            trabajo,
            [
                "preciototal",
                "precio_total",
                "precioTotal",
                "precio",
                "total",
                "importe"
            ]
        )
    );
}

function obtenerVolumenMarketplace(trabajo) {

    const volumenDirecto =
        convertirNumeroMarketplace(
            obtenerValorCampoMarketplace(
                trabajo,
                [
                    "volumen",
                    "m3",
                    "metros_cubicos",
                    "metrosCubicos"
                ]
            )
        );

    if (volumenDirecto !== null) {
        return volumenDirecto;
    }

    try {

        if (
            window.Transportista &&
            typeof window.Transportista.getTotalM3 ===
                "function"
        ) {

            const calculado =
                window.Transportista.getTotalM3(
                    trabajo?.inventario,
                    trabajo?.tipo_servicio
                );

            const numero =
                convertirNumeroMarketplace(
                    calculado
                );

            if (numero !== null) {
                return numero;
            }
        }

    } catch (error) {

        console.warn(
            "Marketplace: no se pudo calcular el volumen.",
            error
        );
    }

    return null;
}

function obtenerArticulosMarketplace(trabajo) {

    try {

        if (
            window.Transportista &&
            typeof window.Transportista.getTotalArticulos ===
                "function"
        ) {

            const calculado =
                window.Transportista.getTotalArticulos(
                    trabajo?.inventario,
                    trabajo?.tipo_servicio
                );

            const numero =
                convertirNumeroMarketplace(
                    calculado
                );

            if (numero !== null) {
                return numero;
            }
        }

    } catch (error) {

        console.warn(
            "Marketplace: no se pudo calcular el número de artículos.",
            error
        );
    }

    return convertirNumeroMarketplace(
        obtenerValorCampoMarketplace(
            trabajo,
            [
                "articulos",
                "total_articulos",
                "num_articulos",
                "cantidad_articulos"
            ]
        )
    );
}

function contarFotosMarketplace(valor) {

    if (!valor) {
        return 0;
    }

    if (Array.isArray(valor)) {
        return valor.length;
    }

    if (typeof valor === "object") {
        return Object.keys(valor).length;
    }

    const texto =
        String(valor).trim();

    if (!texto) {
        return 0;
    }

    try {

        const json =
            JSON.parse(texto);

        if (Array.isArray(json)) {
            return json.length;
        }

        if (
            json &&
            typeof json === "object"
        ) {
            return Object.keys(json).length;
        }

    } catch (_) {
        // No es JSON.
    }

    return texto
        .split(/[,;\n|]+/)
        .map(item => item.trim())
        .filter(Boolean)
        .length;
}

function obtenerFotosMarketplace(trabajo) {

    const valor =
        obtenerValorCampoMarketplace(
            trabajo,
            [
                "urls_fotos",
                "fotos",
                "imagenes",
                "photos",
                "imagenes_fotos"
            ]
        );

    return contarFotosMarketplace(valor);
}

function obtenerTipoServicioMarketplace(trabajo) {

    const valor =
        obtenerValorCampoMarketplace(
            trabajo,
            [
                "tipo_servicio",
                "tipoServicio",
                "tipo_mudanza",
                "tipoMudanza",
                "tipo"
            ]
        );

    return valor
        ? String(valor)
        : "No especificado";
}

function obtenerVehiculoMarketplace(trabajo) {

    let valor =
        obtenerValorCampoMarketplace(
            trabajo,
            [
                "vehiculo",
                "vehículo",
                "tipo_vehiculo",
                "tipoVehiculo",
                "vehiculo_tipo",
                "vehiculoTipo",
                "vehiculo_requerido",
                "vehiculoRequerido"
            ]
        );

    if (
        valor &&
        typeof valor === "object"
    ) {

        valor =
            valor.nombre ||
            valor.tipo ||
            valor.modelo ||
            valor.descripcion ||
            "";
    }

    return valor
        ? String(valor)
        : "No especificado";
}

function obtenerAscensorMarketplace(trabajo) {

    const valor =
        obtenerValorCampoMarketplace(
            trabajo,
            [
                "ascensor",
                "ascensores",
                "ascensor_origen",
                "ascensor_destino",
                "ascensorOrigen",
                "ascensorDestino",
                "acceso_origen",
                "acceso_destino"
            ]
        );

    return valor
        ? String(valor)
        : "";
}

function obtenerServiciosMarketplace(trabajo) {

    const directo =
        convertirNumeroMarketplace(
            obtenerValorCampoMarketplace(
                trabajo,
                [
                    "servicios",
                    "num_servicios",
                    "numero_servicios",
                    "servicios_contratados",
                    "serviciosContratados"
                ]
            )
        );

    if (directo !== null) {
        return directo;
    }

    const tipo =
        normalizarTextoMarketplace(
            trabajo?.tipo_servicio
        );

    if (tipo.includes("total")) {
        return 6;
    }

    return tipo ? 1 : 0;
}

function obtenerZonaMarketplace(trabajo) {

    const textos = [
        trabajo?.origen,
        trabajo?.destino
    ]
        .filter(Boolean)
        .map(valor =>
            String(valor).trim()
        );

    const zonas =
        textos
            .map(texto => {

                const partes =
                    texto
                        .split(",")
                        .map(parte =>
                            parte.trim()
                        )
                        .filter(Boolean);

                if (partes.length >= 2) {
                    return partes[
                        partes.length - 2
                    ];
                }

                return partes[0] || texto;
            })
            .filter(Boolean);

    return zonas;
}

function fechaLocalMarketplace(fecha) {

    if (!fecha) {
        return null;
    }

    const texto =
        String(fecha).trim();

    const match =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (match) {

        const fechaLocal =
            new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3])
            );

        return Number.isNaN(
            fechaLocal.getTime()
        )
            ? null
            : fechaLocal;
    }

    const fechaConvertida =
        new Date(fecha);

    return Number.isNaN(
        fechaConvertida.getTime()
    )
        ? null
        : fechaConvertida;
}

function normalizarDiaMarketplace(fecha) {

    const fechaLocal =
        fechaLocalMarketplace(fecha);

    if (!fechaLocal) {
        return null;
    }

    return new Date(
        fechaLocal.getFullYear(),
        fechaLocal.getMonth(),
        fechaLocal.getDate()
    );
}

function mismoDiaMarketplace(a, b) {

    return Boolean(a && b) &&
        a.getFullYear() ===
            b.getFullYear() &&
        a.getMonth() ===
            b.getMonth() &&
        a.getDate() ===
            b.getDate();
}

function distanciaDentroDeFiltroMarketplace(
    km,
    filtro
) {

    if (filtro === "todas") {
        return true;
    }

    if (km === null) {
        return false;
    }

    switch (filtro) {

        case "0-100":
            return km <= 100;

        case "100-300":
            return km > 100 && km <= 300;

        case "300-600":
            return km > 300 && km <= 600;

        case "600-1000":
            return km > 600 && km <= 1000;

        case "1000+":
            return km > 1000;

        default:
            return true;
    }
}

function precioDentroDeFiltroMarketplace(
    precio,
    filtro
) {

    if (filtro === "todos") {
        return true;
    }

    if (precio === null) {
        return false;
    }

    switch (filtro) {

        case "0-500":
            return precio <= 500;

        case "500-1000":
            return precio > 500 &&
                precio <= 1000;

        case "1000-2000":
            return precio > 1000 &&
                precio <= 2000;

        case "2000-3000":
            return precio > 2000 &&
                precio <= 3000;

        case "3000+":
            return precio > 3000;

        default:
            return true;
    }
}

function volumenDentroDeFiltroMarketplace(
    volumen,
    filtro
) {

    if (filtro === "todos") {
        return true;
    }

    if (volumen === null) {
        return false;
    }

    switch (filtro) {

    case "0-3":
        return volumen <= 3;

    case "3-5":
        return volumen > 3 &&
            volumen <= 5;

    case "5-7":
        return volumen > 5 &&
            volumen <= 7;

    case "7-10":
        return volumen > 7 &&
            volumen <= 10;

    case "10-20":
        return volumen > 10 &&
            volumen <= 20;

    case "20-40":
        return volumen > 20 &&
            volumen <= 40;

    case "40-60":
        return volumen > 40 &&
            volumen <= 60;

    case "60-80":
        return volumen > 60 &&
            volumen <= 80;

    case "80+":
        return volumen > 80;

    default:
        return true;
}
}

function articulosDentroDeFiltroMarketplace(
    articulos,
    filtro
) {

    if (filtro === "todos") {
        return true;
    }

    if (articulos === null) {
        return false;
    }

    switch (filtro) {

    case "0-5":
        return articulos <= 5;

    case "5-10":
        return articulos > 5 &&
            articulos <= 10;

    case "10-20":
        return articulos > 10 &&
            articulos <= 20;

    case "20-40":
        return articulos > 20 &&
            articulos <= 40;

    case "40-60":
        return articulos > 40 &&
            articulos <= 60;

    case "60+":
        return articulos > 60;

    default:
        return true;
}
}

function obtenerTrabajosFiltradosMarketplace() {

    const trabajos =
        Array.isArray(obtenerStateMarketplace().disponibles)
            ? obtenerStateMarketplace().disponibles
            : [];

    const busqueda =
        normalizarTextoMarketplace(
            filtroMarketplaceBusqueda
        );

    return trabajos.filter(
        trabajo => {

            // 1. BUSCADOR ORIGEN / DESTINO
            if (busqueda) {

                const origen =
                    normalizarTextoMarketplace(
                        trabajo?.origen
                    );

                const destino =
                    normalizarTextoMarketplace(
                        trabajo?.destino
                    );

                if (
                    !origen.includes(busqueda) &&
                    !destino.includes(busqueda)
                ) {
                    return false;
                }
            }

            // 2. FECHA
            const fechaTrabajo =
                normalizarDiaMarketplace(
                    trabajo?.fecha
                );

            const hoy =
                normalizarDiaMarketplace(
                    new Date()
                );

            if (
                filtrosMarketplace.fecha ===
                "hoy"
            ) {

                if (
                    !mismoDiaMarketplace(
                        fechaTrabajo,
                        hoy
                    )
                ) {
                    return false;
                }
            }

            if (
                filtrosMarketplace.fecha ===
                "manana"
            ) {

                const manana =
                    new Date(hoy);

                manana.setDate(
                    manana.getDate() + 1
                );

                if (
                    !mismoDiaMarketplace(
                        fechaTrabajo,
                        manana
                    )
                ) {
                    return false;
                }
            }

            if (
                filtrosMarketplace.fecha ===
                    "7dias" ||
                filtrosMarketplace.fecha ===
                    "30dias"
            ) {

                if (!fechaTrabajo) {
                    return false;
                }

                const limite =
                    new Date(hoy);

                limite.setDate(
                    limite.getDate() +
                    (
                        filtrosMarketplace.fecha ===
                        "7dias"
                            ? 7
                            : 30
                    )
                );

                if (
                    fechaTrabajo < hoy ||
                    fechaTrabajo > limite
                ) {
                    return false;
                }
            }

            if (
                filtrosMarketplace.fecha ===
                "personalizada"
            ) {

                if (
                    !fechaTrabajo ||
                    !filtrosMarketplace.fechaPersonalizada
                ) {
                    return false;
                }

                const fechaElegida =
                    normalizarDiaMarketplace(
                        filtrosMarketplace.fechaPersonalizada
                    );

                if (
                    !mismoDiaMarketplace(
                        fechaTrabajo,
                        fechaElegida
                    )
                ) {
                    return false;
                }
            }

            // 3. ZONA
            if (
                filtrosMarketplace.zona !==
                "todas"
            ) {

                const zonaBuscada =
                    normalizarTextoMarketplace(
                        filtrosMarketplace.zona
                    );

                const zonasTrabajo =
                    obtenerZonaMarketplace(
                        trabajo
                    ).map(
                        normalizarTextoMarketplace
                    );

                if (
                    !zonasTrabajo.includes(
                        zonaBuscada
                    )
                ) {
                    return false;
                }
            }

            // 4. DISTANCIA
            if (
                !distanciaDentroDeFiltroMarketplace(
                    obtenerKmMarketplace(
                        trabajo
                    ),
                    filtrosMarketplace.distancia
                )
            ) {
                return false;
            }

            // 5. VEHÍCULO
            if (
                filtrosMarketplace.vehiculo !==
                "todas"
            ) {

                const vehiculo =
                    normalizarTextoMarketplace(
                        obtenerVehiculoMarketplace(
                            trabajo
                        )
                    );

                if (
                    vehiculo !==
                    normalizarTextoMarketplace(
                        filtrosMarketplace.vehiculo
                    )
                ) {
                    return false;
                }
            }

            // 6. TIPO DE SERVICIO
            if (
                filtrosMarketplace.tipoServicio !==
                "todos"
            ) {

                const tipo =
                    normalizarTextoMarketplace(
                        obtenerTipoServicioMarketplace(
                            trabajo
                        )
                    );

                if (
                    tipo !==
                    normalizarTextoMarketplace(
                        filtrosMarketplace.tipoServicio
                    )
                ) {
                    return false;
                }
            }

            // 7. PRECIO
            if (
                !precioDentroDeFiltroMarketplace(
                    obtenerPrecioMarketplace(
                        trabajo
                    ),
                    filtrosMarketplace.precio
                )
            ) {
                return false;
            }

            // 8. VOLUMEN
            if (
                !volumenDentroDeFiltroMarketplace(
                    obtenerVolumenMarketplace(
                        trabajo
                    ),
                    filtrosMarketplace.volumen
                )
            ) {
                return false;
            }

            // 9. ARTÍCULOS
            if (
                !articulosDentroDeFiltroMarketplace(
                    obtenerArticulosMarketplace(
                        trabajo
                    ),
                    filtrosMarketplace.articulos
                )
            ) {
                return false;
            }

            // 10. ASCENSOR
            if (
                filtrosMarketplace.ascensor !==
                "todos"
            ) {

                const ascensor =
                    normalizarTextoMarketplace(
                        obtenerAscensorMarketplace(
                            trabajo
                        )
                    );

                if (
                    filtrosMarketplace.ascensor ===
                    "con"
                ) {

                    if (
                        !ascensor.includes(
                            "con ascensor"
                        )
                    ) {
                        return false;
                    }
                }

                if (
                    filtrosMarketplace.ascensor ===
                    "sin"
                ) {

                    if (
                        !ascensor.includes(
                            "sin ascensor"
                        )
                    ) {
                        return false;
                    }
                }
            }

            // 11. FOTOS
            const numeroFotos =
                obtenerFotosMarketplace(
                    trabajo
                );

            if (
                filtrosMarketplace.fotos ===
                    "con" &&
                numeroFotos <= 0
            ) {
                return false;
            }

            if (
                filtrosMarketplace.fotos ===
                    "sin" &&
                numeroFotos > 0
            ) {
                return false;
            }

            // 12. SERVICIOS
            if (
                filtrosMarketplace.servicios !==
                "todos"
            ) {

                const servicios =
                    obtenerServiciosMarketplace(
                        trabajo
                    );

                if (
                    filtrosMarketplace.servicios ===
                        "1" &&
                    servicios !== 1
                ) {
                    return false;
                }

                if (
                    filtrosMarketplace.servicios ===
                        "6" &&
                    servicios !== 6
                ) {
                    return false;
                }
            }

            return true;
        }
    );
}

function aplicarFiltroBusquedaMarketplace() {

    const input =
        document.getElementById(
            "filtro-buscar-marketplace"
        ) ||
        document.querySelector(
            'input[placeholder="Buscar origen o destino..."]'
        );

    if (!input) {
        return;
    }

    filtroMarketplaceBusqueda =
        input.value;

    renderizarDisponibles();

    actualizarEstadoVisualFiltrosMarketplace();
}

function crearOpcionesDinamicasMarketplace() {

    const trabajos =
        Array.isArray(obtenerStateMarketplace().disponibles)
            ? obtenerStateMarketplace().disponibles
            : [];

    const zonas = new Map();
    const vehiculos = new Map();
    const tipos = new Map();

    trabajos.forEach(
        trabajo => {

            obtenerZonaMarketplace(
                trabajo
            ).forEach(
                zona => {

                    const clave =
                        normalizarTextoMarketplace(
                            zona
                        );

                    if (
                        clave &&
                        !zonas.has(clave)
                    ) {
                        zonas.set(
                            clave,
                            zona
                        );
                    }
                }
            );

            const vehiculo =
                obtenerVehiculoMarketplace(
                    trabajo
                );

            const claveVehiculo =
                normalizarTextoMarketplace(
                    vehiculo
                );

            if (
                claveVehiculo &&
                !vehiculos.has(
                    claveVehiculo
                )
            ) {

                vehiculos.set(
                    claveVehiculo,
                    vehiculo
                );
            }

            const tipo =
                obtenerTipoServicioMarketplace(
                    trabajo
                );

            const claveTipo =
                normalizarTextoMarketplace(
                    tipo
                );

            if (
                claveTipo &&
                !tipos.has(
                    claveTipo
                )
            ) {

                tipos.set(
                    claveTipo,
                    tipo
                );
            }
        }
    );

    return {

        zonas:
            [...zonas.values()]
                .sort(
                    (a, b) =>
                        String(a).localeCompare(
                            String(b),
                            "es"
                        )
                ),

        vehiculos:
            [...vehiculos.values()]
                .sort(
                    (a, b) =>
                        String(a).localeCompare(
                            String(b),
                            "es"
                        )
                ),

        tipos:
            [...tipos.values()]
                .sort(
                    (a, b) =>
                        String(a).localeCompare(
                            String(b),
                            "es"
                        )
                )
    };
}

function cerrarPopoverFiltroMarketplace() {

    if (marketplaceFiltroPopover) {

        marketplaceFiltroPopover.remove();

        marketplaceFiltroPopover =
            null;
    }
}

function crearPopoverFiltroMarketplace(
    config
) {

    cerrarPopoverFiltroMarketplace();

    const boton =
        document.getElementById(
            config.botonId
        );

    if (!boton) {
        return;
    }

    const popover =
        document.createElement("div");

    popover.id =
        "marketplace-filtro-popover";

    popover.className =
        "fixed z-[200] bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 w-[260px] max-w-[calc(100vw-24px)]";

    const titulo =
        document.createElement("div");

    titulo.className =
        "px-3 py-2 text-[11px] uppercase tracking-wider font-black text-slate-400";

    titulo.textContent =
        config.titulo;

    popover.appendChild(titulo);

    config.opciones.forEach(
        opcion => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 hover:bg-[#0b1e5b]/5 hover:text-[#0b1e5b] transition-colors";

            if (
                opcion.valor ===
                config.valorActual
            ) {

                button.classList.add(
                    "bg-[#0b1e5b]/10",
                    "text-[#0b1e5b]"
                );
            }

            button.innerHTML = `
                <span>
                    ${escapeHtmlMarketplace(
                        opcion.texto
                    )}
                </span>

                ${
                    opcion.valor ===
                    config.valorActual

                        ? '<i data-lucide="check" class="w-4 h-4 text-[#0b1e5b]"></i>'

                        : ""
                }
            `;

            button.addEventListener(
                "click",
                () => {

                    config.alSeleccionar(
                        opcion.valor
                    );

                    cerrarPopoverFiltroMarketplace();
                }
            );

            popover.appendChild(
                button
            );
        }
    );

    if (config.incluirFecha) {

        const separador =
            document.createElement("div");

        separador.className =
            "border-t border-slate-100 my-2";

        popover.appendChild(
            separador
        );

        const label =
            document.createElement("label");

        label.className =
            "block px-3 pt-1 pb-1 text-[11px] font-black text-slate-400 uppercase tracking-wider";

        label.textContent =
            "Elegir fecha exacta";

        popover.appendChild(
            label
        );

        const dateInput =
            document.createElement("input");

        dateInput.type =
            "date";

        dateInput.value =
            filtrosMarketplace.fechaPersonalizada ||
            "";

        dateInput.className =
            "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b]";

        dateInput.addEventListener(
            "change",
            () => {

                if (!dateInput.value) {
                    return;
                }

                filtrosMarketplace.fecha =
                    "personalizada";

                filtrosMarketplace.fechaPersonalizada =
                    dateInput.value;

                renderizarDisponibles();

                actualizarEstadoVisualFiltrosMarketplace();

                cerrarPopoverFiltroMarketplace();
            }
        );

        popover.appendChild(
            dateInput
        );
    }

    document.body.appendChild(
        popover
    );

    marketplaceFiltroPopover =
        popover;

    const rect =
        boton.getBoundingClientRect();

    const ancho =
        Math.min(
            260,
            window.innerWidth - 24
        );

    let left =
        rect.left;

    let top =
        rect.bottom + 8;

    if (
        left + ancho >
        window.innerWidth - 12
    ) {

        left =
            window.innerWidth -
            ancho -
            12;
    }

    if (
        top + popover.offsetHeight >
        window.innerHeight - 12
    ) {

        top =
            Math.max(
                12,
                rect.top -
                popover.offsetHeight -
                8
            );
    }

    popover.style.left =
        `${Math.max(12, left)}px`;

    popover.style.top =
        `${top}px`;

    if (window.lucide) {
        lucide.createIcons();
    }
}

function crearPopoverMasFiltrosMarketplace() {

    cerrarPopoverFiltroMarketplace();

    const boton =
        document.getElementById(
            "filtro-mas-marketplace"
        );

    if (!boton) {
        return;
    }

    const dinamicos =
        crearOpcionesDinamicasMarketplace();

    const popover =
        document.createElement("div");

    popover.id =
        "marketplace-filtro-popover";

    popover.className =
        "fixed z-[200] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-[340px] max-w-[calc(100vw-24px)] max-h-[75vh] overflow-y-auto";

    popover.innerHTML = `
        <div class="flex items-center justify-between gap-3 mb-3">

            <div>

                <div class="text-sm font-black text-slate-800">
                    Más filtros
                </div>

                <div class="text-[11px] font-semibold text-slate-400 mt-0.5">
                    Combina varios criterios a la vez
                </div>

            </div>

            <button
                type="button"
                id="cerrar-mas-filtros-marketplace"
                class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
                <i
                    data-lucide="x"
                    class="w-4 h-4"
                ></i>
            </button>

        </div>

        <div class="space-y-3">

            ${crearSelectAvanzadoMarketplace(
    "Tipo de mudanza",
    "filtro-avanzado-tipo",
    [
        {
            valor: "Mudanza Estándar",
            texto: "Mudanza Estándar"
        },
        {
            valor: "Mudanza Total",
            texto: "Mudanza Total"
        }
    ],
    filtrosMarketplace.tipoServicio,
    "todos",
    "Todos los tipos"
)}

            ${crearSelectAvanzadoMarketplace(
                "Precio",
                "filtro-avanzado-precio",
                [
                    {
                        valor: "todos",
                        texto: "Cualquier precio"
                    },
                    {
                        valor: "0-500",
                        texto: "Hasta 500 €"
                    },
                    {
                        valor: "500-1000",
                        texto: "500 € – 1.000 €"
                    },
                    {
                        valor: "1000-2000",
                        texto: "1.000 € – 2.000 €"
                    },
                    {
                        valor: "2000-3000",
                        texto: "2.000 € – 3.000 €"
                    },
                    {
                        valor: "3000+",
                        texto: "Más de 3.000 €"
                    }
                ],
                filtrosMarketplace.precio,
                "todos",
                "Cualquier precio"
            )}

            ${crearSelectAvanzadoMarketplace(
                "Volumen",
                "filtro-avanzado-volumen",
                [
    {
        valor: "todos",
        texto: "Cualquier volumen"
    },
    {
        valor: "0-3",
        texto: "Hasta 3 m³"
    },
    {
        valor: "3-5",
        texto: "3 – 5 m³"
    },
    {
        valor: "5-7",
        texto: "5 – 7 m³"
    },
    {
        valor: "7-10",
        texto: "7 – 10 m³"
    },
    {
        valor: "10-20",
        texto: "10 – 20 m³"
    },
    {
        valor: "20-40",
        texto: "20 – 40 m³"
    },
    {
        valor: "40-60",
        texto: "40 – 60 m³"
    },
    {
        valor: "60-80",
        texto: "60 – 80 m³"
    },
    {
        valor: "80+",
        texto: "Más de 80 m³"
    }
],
                filtrosMarketplace.volumen,
                "todos",
                "Cualquier volumen"
            )}

            ${crearSelectAvanzadoMarketplace(
                "Artículos",
                "filtro-avanzado-articulos",
                [
                    {
                        valor: "todos",
                        texto: "Cualquier cantidad"
                    },
                    [
    {
        valor: "todos",
        texto: "Cualquier cantidad"
    },
    {
        valor: "0-5",
        texto: "Hasta 5 artículos"
    },
    {
        valor: "5-10",
        texto: "5 – 10 artículos"
    },
    {
        valor: "10-20",
        texto: "10 – 20 artículos"
    },
    {
        valor: "20-40",
        texto: "20 – 40 artículos"
    },
    {
        valor: "40-60",
        texto: "40 – 60 artículos"
    },
    {
        valor: "60+",
        texto: "Más de 60 artículos"
    }
]
                ],
                filtrosMarketplace.articulos,
                "todos",
                "Cualquier cantidad"
            )}

            ${crearSelectAvanzadoMarketplace(
                "Ascensor",
                "filtro-avanzado-ascensor",
                [
                    {
                        valor: "todos",
                        texto: "Cualquier acceso"
                    },
                    {
                        valor: "con",
                        texto: "Con ascensor"
                    },
                    {
                        valor: "sin",
                        texto: "Sin ascensor"
                    }
                ],
                filtrosMarketplace.ascensor,
                "todos",
                "Cualquier acceso"
            )}

            ${crearSelectAvanzadoMarketplace(
                "Fotos",
                "filtro-avanzado-fotos",
                [
                    {
                        valor: "todos",
                        texto: "Cualquier cantidad"
                    },
                    {
                        valor: "con",
                        texto: "Con fotos"
                    },
                    {
                        valor: "sin",
                        texto: "Sin fotos"
                    }
                ],
                filtrosMarketplace.fotos,
                "todos",
                "Cualquier cantidad"
            )}

            ${crearSelectAvanzadoMarketplace(
                "Servicios",
                "filtro-avanzado-servicios",
                [
    {
        valor: "todos",
        texto: "Cualquier servicio"
    },
    {
        valor: "desmontaje",
        texto: "Desmontaje"
    },
    {
        valor: "montaje",
        texto: "Montaje"
    },
    {
        valor: "embalaje",
        texto: "Embalaje"
    },
    {
        valor: "empaquetado",
        texto: "Empaquetado"
    }
],
                filtrosMarketplace.servicios,
                "todos",
                "Cualquier servicio"
            )}

        </div>

        <div class="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between gap-2">

            <button
                type="button"
                id="limpiar-filtros-marketplace"
                class="text-xs font-black text-slate-500 hover:text-[#0b1e5b] px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
                Limpiar filtros
            </button>

            <button
                type="button"
                id="aplicar-mas-filtros-marketplace"
                class="bg-[#0b1e5b] hover:bg-[#163562] text-white text-xs font-black px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
                Aplicar filtros
            </button>

        </div>
    `;

    document.body.appendChild(
        popover
    );

    marketplaceFiltroPopover =
        popover;

    const rect =
        boton.getBoundingClientRect();

    const ancho =
        Math.min(
            340,
            window.innerWidth - 24
        );

    let left =
        rect.right - ancho;

    let top =
        rect.bottom + 8;

    if (left < 12) {
        left = 12;
    }

    if (
        top + popover.offsetHeight >
        window.innerHeight - 12
    ) {

        top =
            Math.max(
                12,
                rect.top -
                popover.offsetHeight -
                8
            );
    }

    popover.style.left =
        `${left}px`;

    popover.style.top =
        `${top}px`;

    popover
        .querySelectorAll(
            "select[data-marketplace-avanzado]"
        )
        .forEach(
            select => {

                select.addEventListener(
                    "change",
                    () => {

                        const campo =
                            select.dataset.campo;

                        filtrosMarketplace[campo] =
                            select.value;
                    }
                );
            }
        );

    popover
        .querySelector(
            "#cerrar-mas-filtros-marketplace"
        )
        ?.addEventListener(
            "click",
            cerrarPopoverFiltroMarketplace
        );

    popover
        .querySelector(
            "#limpiar-filtros-marketplace"
        )
        ?.addEventListener(
            "click",
            () => {

                limpiarFiltrosMarketplace();

                cerrarPopoverFiltroMarketplace();
            }
        );

    popover
        .querySelector(
            "#aplicar-mas-filtros-marketplace"
        )
        ?.addEventListener(
            "click",
            () => {

                renderizarDisponibles();

                actualizarEstadoVisualFiltrosMarketplace();

                cerrarPopoverFiltroMarketplace();
            }
        );

    if (window.lucide) {
        lucide.createIcons();
    }
}

function crearSelectAvanzadoMarketplace(
    etiqueta,
    id,
    opciones,
    valorActual,
    valorTodos,
    textoTodos
) {

    const mapaCampos = {

        "filtro-avanzado-tipo":
            "tipoServicio",

        "filtro-avanzado-precio":
            "precio",

        "filtro-avanzado-volumen":
            "volumen",

        "filtro-avanzado-articulos":
            "articulos",

        "filtro-avanzado-ascensor":
            "ascensor",

        "filtro-avanzado-fotos":
            "fotos",

        "filtro-avanzado-servicios":
            "servicios"
    };

    const campo =
        mapaCampos[id] ||
        id.replace(
            "filtro-avanzado-",
            ""
        );

    let html = `

        <label class="block">

            <span class="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                ${escapeHtmlMarketplace(
                    etiqueta
                )}
            </span>

            <select
                id="${escapeHtmlMarketplace(id)}"
                data-marketplace-avanzado="true"
                data-campo="${escapeHtmlMarketplace(campo)}"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b1e5b]/20 focus:border-[#0b1e5b]"
            >
    `;

    if (
        !opciones.some(
            opcion =>
                opcion.valor ===
                valorTodos
        )
    ) {

        html += `

            <option
                value="${escapeHtmlMarketplace(
                    valorTodos
                )}"
            >
                ${escapeHtmlMarketplace(
                    textoTodos
                )}
            </option>

        `;
    }

    opciones.forEach(
        opcion => {

            const seleccionado =
                opcion.valor ===
                valorActual
                    ? "selected"
                    : "";

            html += `

                <option
                    value="${escapeHtmlMarketplace(
                        opcion.valor
                    )}"
                    ${seleccionado}
                >
                    ${escapeHtmlMarketplace(
                        opcion.texto
                    )}
                </option>

            `;
        }
    );

    html += `

            </select>

        </label>

    `;

    return html;
}

function limpiarFiltrosMarketplace() {

    filtroMarketplaceBusqueda =
        "";

    const input =
        document.getElementById(
            "filtro-buscar-marketplace"
        ) ||
        document.querySelector(
            'input[placeholder="Buscar origen o destino..."]'
        );

    if (input) {
        input.value = "";
    }

    Object.assign(
        filtrosMarketplace,
        {
            fecha: "todas",
            fechaPersonalizada: "",
            zona: "todas",
            distancia: "todas",
            vehiculo: "todas",
            tipoServicio: "todos",
            precio: "todos",
            volumen: "todos",
            articulos: "todos",
            ascensor: "todos",
            fotos: "todos",
            servicios: "todos"
        }
    );

    renderizarDisponibles();

    actualizarEstadoVisualFiltrosMarketplace();
}

function actualizarEstadoVisualFiltrosMarketplace() {

    const configuracion = [

        [
            "filtro-fecha-marketplace",
            filtrosMarketplace.fecha !==
                "todas"
        ],

        [
            "filtro-zona-marketplace",
            filtrosMarketplace.zona !==
                "todas"
        ],

        [
            "filtro-distancia-marketplace",
            filtrosMarketplace.distancia !==
                "todas"
        ],

        [
            "filtro-vehiculo-marketplace",
            filtrosMarketplace.vehiculo !==
                "todas"
        ],

        [
            "filtro-mas-marketplace",

            filtrosMarketplace.tipoServicio !==
                "todos" ||

            filtrosMarketplace.precio !==
                "todos" ||

            filtrosMarketplace.volumen !==
                "todos" ||

            filtrosMarketplace.articulos !==
                "todos" ||

            filtrosMarketplace.ascensor !==
                "todos" ||

            filtrosMarketplace.fotos !==
                "todos" ||

            filtrosMarketplace.servicios !==
                "todos"
        ]
    ];

    configuracion.forEach(
        ([id, activo]) => {

            const boton =
                document.getElementById(
                    id
                );

            if (!boton) {
                return;
            }

            boton.classList.toggle(
                "border-[#0b1e5b]",
                activo
            );

            boton.classList.toggle(
                "bg-[#0b1e5b]/10",
                activo
            );

            boton.classList.toggle(
                "text-[#0b1e5b]",
                activo
            );

            const indicador =
                boton.querySelector(
                    "[data-filtro-indicador]"
                );

            if (indicador) {

                indicador.textContent =
                    activo
                        ? "•"
                        : "";

                indicador.classList.toggle(
                    "text-sky-500",
                    activo
                );
            }
        }
    );

    const hayFiltros =
        Boolean(
            normalizarTextoMarketplace(
                filtroMarketplaceBusqueda
            )
        ) ||
        configuracion.some(
            ([, activo]) =>
                activo
        );

    const limpiar =
        document.getElementById(
            "limpiar-todos-filtros-marketplace"
        );

    if (limpiar) {

        limpiar.classList.toggle(
            "hidden",
            !hayFiltros
        );
    }
}

function abrirFiltroMarketplace(tipo) {

    const dinamicos =
        crearOpcionesDinamicasMarketplace();

    if (tipo === "fecha") {

        crearPopoverFiltroMarketplace({

            botonId:
                "filtro-fecha-marketplace",

            titulo:
                "Fecha del servicio",

            valorActual:
                filtrosMarketplace.fecha,

            incluirFecha:
                true,

            opciones: [

                {
                    valor: "todas",
                    texto: "Todas las fechas"
                },

                {
                    valor: "hoy",
                    texto: "Hoy"
                },

                {
                    valor: "manana",
                    texto: "Mañana"
                },

                {
                    valor: "7dias",
                    texto: "Próximos 7 días"
                },

                {
                    valor: "30dias",
                    texto: "Próximos 30 días"
                }
            ],

            alSeleccionar:
                valor => {

                    filtrosMarketplace.fecha =
                        valor;

                    if (
                        valor !==
                        "personalizada"
                    ) {

                        filtrosMarketplace.fechaPersonalizada =
                            "";
                    }

                    renderizarDisponibles();

                    actualizarEstadoVisualFiltrosMarketplace();
                }
        });

        return;
    }

    if (tipo === "zona") {

        crearPopoverFiltroMarketplace({

            botonId:
                "filtro-zona-marketplace",

            titulo:
                "Zona",

            valorActual:
                filtrosMarketplace.zona,

            opciones: [

                {
                    valor: "todas",
                    texto: "Todas las zonas"
                },

                ...dinamicos.zonas.map(
                    zona => ({
                        valor: zona,
                        texto: zona
                    })
                )
            ],

            alSeleccionar:
                valor => {

                    filtrosMarketplace.zona =
                        valor;

                    renderizarDisponibles();

                    actualizarEstadoVisualFiltrosMarketplace();
                }
        });

        return;
    }

    if (tipo === "distancia") {

        crearPopoverFiltroMarketplace({

            botonId:
                "filtro-distancia-marketplace",

            titulo:
                "Distancia",

            valorActual:
                filtrosMarketplace.distancia,

            opciones: [

                {
                    valor: "todas",
                    texto: "Cualquier distancia"
                },

                {
                    valor: "0-100",
                    texto: "Hasta 100 km"
                },

                {
                    valor: "100-300",
                    texto: "100 – 300 km"
                },

                {
                    valor: "300-600",
                    texto: "300 – 600 km"
                },

                {
                    valor: "600-1000",
                    texto: "600 – 1.000 km"
                },

                {
                    valor: "1000+",
                    texto: "Más de 1.000 km"
                }
            ],

            alSeleccionar:
                valor => {

                    filtrosMarketplace.distancia =
                        valor;

                    renderizarDisponibles();

                    actualizarEstadoVisualFiltrosMarketplace();
                }
        });

        return;
    }

    if (tipo === "vehiculo") {

        crearPopoverFiltroMarketplace({

            botonId:
                "filtro-vehiculo-marketplace",

            titulo:
                "Vehículo",

            valorActual:
                filtrosMarketplace.vehiculo,

            opciones: [

                {
                    valor: "todas",
                    texto: "Cualquier vehículo"
                },

                ...dinamicos.vehiculos.map(
                    vehiculo => ({
                        valor: vehiculo,
                        texto: vehiculo
                    })
                )
            ],

            alSeleccionar:
                valor => {

                    filtrosMarketplace.vehiculo =
                        valor;

                    renderizarDisponibles();

                    actualizarEstadoVisualFiltrosMarketplace();
                }
        });

        return;
    }

    if (tipo === "mas") {

        crearPopoverMasFiltrosMarketplace();
    }
}

function inicializarFiltrosMarketplace() {

    const input =
        document.getElementById(
            "filtro-buscar-marketplace"
        ) ||
        document.querySelector(
            'input[placeholder="Buscar origen o destino..."]'
        );

    if (
        input &&
        !input.dataset.marketplaceConectado
    ) {

        input.dataset.marketplaceConectado =
            "true";

        input.addEventListener(
            "input",
            aplicarFiltroBusquedaMarketplace
        );
    }

    const botones = [

        [
            "filtro-fecha-marketplace",
            "fecha"
        ],

        [
            "filtro-zona-marketplace",
            "zona"
        ],

        [
            "filtro-distancia-marketplace",
            "distancia"
        ],

        [
            "filtro-vehiculo-marketplace",
            "vehiculo"
        ],

        [
            "filtro-mas-marketplace",
            "mas"
        ]
    ];

    botones.forEach(
        ([id, tipo]) => {

            const boton =
                document.getElementById(
                    id
                );

            if (
                !boton ||
                boton.dataset.marketplaceConectado
            ) {
                return;
            }

            boton.dataset.marketplaceConectado =
                "true";

            boton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    if (
                        marketplaceFiltroPopover &&
                        marketplaceFiltroPopover.dataset.botonId ===
                            id
                    ) {

                        cerrarPopoverFiltroMarketplace();

                        return;
                    }

                    abrirFiltroMarketplace(
                        tipo
                    );

                    if (
                        marketplaceFiltroPopover
                    ) {

                        marketplaceFiltroPopover.dataset.botonId =
                            id;
                    }
                }
            );
        }
    );

    const limpiarTodo =
        document.getElementById(
            "limpiar-todos-filtros-marketplace"
        );

    if (
        limpiarTodo &&
        !limpiarTodo.dataset.marketplaceConectado
    ) {

        limpiarTodo.dataset.marketplaceConectado =
            "true";

        limpiarTodo.addEventListener(
            "click",
            limpiarFiltrosMarketplace
        );
    }

    document.addEventListener(
        "click",
        event => {

            if (
                !marketplaceFiltroPopover
            ) {
                return;
            }

            if (
                marketplaceFiltroPopover.contains(
                    event.target
                ) ||
                event.target.closest?.(
                    "[data-marketplace-filtro]"
                )
            ) {
                return;
            }

            cerrarPopoverFiltroMarketplace();
        }
    );

    window.addEventListener(
        "resize",
        cerrarPopoverFiltroMarketplace
    );

    window.addEventListener(
        "scroll",
        cerrarPopoverFiltroMarketplace,
        true
    );

    actualizarEstadoVisualFiltrosMarketplace();

    console.log(
        "✅ Filtros Marketplace conectados correctamente."
    );
}


// UTILIDADES
///////////////////////////////////////////////////////////

function escapeHtmlMarketplace(valor) {

    return String(valor ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function apiTransportistaDisponible() {

    const api =
        window.Transportista;

    return api &&
        typeof api.getTotalArticulos ===
            "function" &&
        typeof api.getTotalM3 ===
            "function" &&
        typeof api.formatM3 ===
            "function" &&
        typeof api.getAccesos ===
            "function";
}


// CARGAR TRABAJOS DISPONIBLES
///////////////////////////////////////////////////////////

async function cargarTrabajosDisponibles() {

    if (marketplaceCargando) {

        console.log(
            "Marketplace: consulta ya en curso; se evita duplicado."
        );

        return;
    }

    const cliente =
        obtenerDbClientMarketplace();

    if (!cliente) {

        console.error(
            "Marketplace: no hay un cliente Supabase disponible. " +
            "Expón window.dbClient = dbClient antes de cargar marketplace.js."
        );

        obtenerStateMarketplace().disponibles = [];

        renderizarDisponibles();

        return;
    }

    marketplaceCargando = true;

    try {

        const {
            data,
            error
        } = await cliente
            .from("mudanzas")
            .select("*")
            .eq(
                "estado",
                "Pendiente de asignación"
            )
            .eq(
                "publicada_marketplace",
                true
            )
            .eq(
                "bloqueada",
                false
            )
            .is(
                "transportista_id",
                null
            )
            .order(
                "fecha",
                {
                    ascending: true
                }
            );

        if (error) {

            console.error(
                "❌ ERROR CARGANDO MARKETPLACE:",
                error.message,
                error.details,
                error.hint
            );

            obtenerStateMarketplace().disponibles = [];

            renderizarDisponibles();

            return;
        }

        obtenerStateMarketplace().disponibles =
            Array.isArray(data)
                ? data
                : [];

        renderizarDisponibles();

    } catch (error) {

        console.error(
            "❌ EXCEPCIÓN CARGANDO MARKETPLACE:",
            error
        );

        obtenerStateMarketplace().disponibles = [];

        renderizarDisponibles();

    } finally {

        marketplaceCargando =
            false;
    }
}


// FECHAS
///////////////////////////////////////////////////////////

function crearEncabezadoFechaMarketplace(
    fecha
) {

    if (!fecha) {
        return "Fecha no disponible";
    }

    const fechaT =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaT.getTime()
        )
    ) {

        return String(fecha);
    }

    const hoy =
        new Date();

    const manana =
        new Date(hoy);

    manana.setDate(
        hoy.getDate() + 1
    );

    const mismoDia =
        (a, b) =>
            a.getFullYear() ===
                b.getFullYear() &&
            a.getMonth() ===
                b.getMonth() &&
            a.getDate() ===
                b.getDate();

    const fechaFormateada =
        fechaT.toLocaleDateString(
            "es-ES",
            {
                day: "numeric",
                month: "long"
            }
        );

    if (
        mismoDia(
            fechaT,
            hoy
        )
    ) {

        return `Hoy • ${fechaFormateada}`;
    }

    if (
        mismoDia(
            fechaT,
            manana
        )
    ) {

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

    return `
        ${diasSemana[fechaT.getDay()]}
        •
        ${fechaFormateada}
    `;
}


// RENDER MARKETPLACE
///////////////////////////////////////////////////////////

function renderizarDisponibles() {

    const contenedor =
        document.getElementById(
            "contenedor-disponibles"
        );

    const badge =
        document.getElementById(
            "badge-disponibles"
        );

    const banner =
        document.getElementById(
            "banner-contador-trabajos"
        );

    const trabajos =
        obtenerTrabajosFiltradosMarketplace();

    if (badge) {

        badge.textContent =
            trabajos.length;
    }

    if (banner) {

        banner.textContent =
            trabajos.length;
    }

    if (!contenedor) {
        return;
    }

    if (
        trabajos.length === 0
    ) {

        contenedor.innerHTML = `

            <div
                class="col-span-1 lg:col-span-2 text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300"
            >

                <i
                    data-lucide="satellite"
                    class="w-14 h-14 text-gray-300 mx-auto mb-4"
                ></i>

                <h4
                    class="text-xl font-bold text-gray-700 mb-2"
                >
                    Buscando nuevas rutas
                </h4>

                <p
                    class="text-gray-400 font-medium text-sm"
                >
                    En cuanto un cliente reserve aparecerá aquí automáticamente.
                </p>

            </div>

        `;

        if (window.lucide) {
            lucide.createIcons();
        }

        return;
    }

    // AGRUPAR POR FECHA
    ///////////////////////////////////////////////////////

    const gruposPorFecha = {};

    trabajos.forEach(
        trabajo => {

            const titulo =
                crearEncabezadoFechaMarketplace(
                    trabajo.fecha
                );

            if (
                !gruposPorFecha[titulo]
            ) {

                gruposPorFecha[titulo] =
                    [];
            }

            gruposPorFecha[titulo].push(
                trabajo
            );
        }
    );

    // COMPROBAR API UTILIDADES
    ///////////////////////////////////////////////////////

    if (
        !apiTransportistaDisponible()
    ) {

        console.error(
            "❌ Marketplace: utils.js no ha expuesto todavía la API Transportista.",
            window.Transportista
        );

        contenedor.innerHTML = `

            <div
                class="col-span-1 lg:col-span-2 text-center py-12 bg-white rounded-3xl border border-red-100"
            >

                <h4
                    class="text-lg font-bold text-red-600 mb-2"
                >
                    Error cargando los datos de las mudanzas
                </h4>

                <p
                    class="text-sm text-slate-500"
                >
                    No se ha cargado correctamente el módulo de utilidades.
                </p>

            </div>

        `;

        return;
    }

    // GENERAR HTML
    ///////////////////////////////////////////////////////

    let htmlFinal = "";

    for (
        const [
            fechaTitulo,
            trabajosFecha
        ]
        of Object.entries(
            gruposPorFecha
        )
    ) {

        htmlFinal += `

            <div
                class="col-span-1 lg:col-span-2 flex items-center gap-2.5 mt-6 mb-3 no-print"
            >

                <span
                    class="text-xs font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100/70 font-sans flex items-center gap-1.5"
                >

                    <i
                        data-lucide="calendar"
                        class="w-3.5 h-3.5"
                    ></i>

                    ${escapeHtmlMarketplace(
                        fechaTitulo
                    )}

                </span>

                <span
                    class="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md"
                >

                    ${trabajosFecha.length}
                    trabajos disponibles

                </span>

                <div
                    class="flex-1 border-t border-slate-200/60"
                ></div>

            </div>

        `;

        trabajosFecha.forEach(
            t => {

                htmlFinal +=
                    window.Transportista.Tarjetas
                        .crearTarjetaMarketplace(
                            t
                        );
            }
        );
    }

    contenedor.innerHTML =
        htmlFinal;

    if (window.lucide) {
        lucide.createIcons();
    }
}


// ACEPTAR MUDANZA
///////////////////////////////////////////////////////////

async function procesarAceptacion(
    id
) {

    const modalContentMarketplace =
        document.getElementById(
            "modal-content"
        );

    const actionModalMarketplace =
        document.getElementById(
            "action-modal"
        );

    if (
        !modalContentMarketplace
    ) {

        console.error(
            "❌ No existe #modal-content"
        );

        return;
    }

    modalContentMarketplace.innerHTML = `

        <i
            data-lucide="loader-2"
            class="w-10 h-10 animate-spin mx-auto text-blue-600 mb-3"
        ></i>

        <p
            class="text-gray-600 font-medium text-sm"
        >
            Asignando mudanza...
        </p>

    `;

    if (window.lucide) {
        lucide.createIcons();
    }

    try {

        const cliente =
            obtenerDbClientMarketplace();

        const transportistaId =
            obtenerCurrentUserIdMarketplace();

        if (!cliente) {

            throw new Error(
                "No hay un cliente Supabase disponible para aceptar la mudanza."
            );
        }

        if (!transportistaId) {

            throw new Error(
                "No se ha podido identificar al transportista conectado."
            );
        }

        const {
            data,
            error
        } = await cliente
            .from("mudanzas")
            .update({

                estado:
                    "Transportista asignado",

                transportista_id:
                    transportistaId,

                bloqueada:
                    true,

                fecha_asignacion:
                    new Date().toISOString()

            })
            .eq(
                "id",
                id
            )
            .eq(
                "estado",
                "Pendiente de asignación"
            )
            .eq(
                "publicada_marketplace",
                true
            )
            .eq(
                "bloqueada",
                false
            )
            .is(
                "transportista_id",
                null
            )
            .select();

        if (error) {

            console.error(
                "❌ Error al aceptar mudanza:",
                error
            );

            alert(
                "No se pudo asignar la mudanza.\n\n" +
                "Puede que otro transportista la haya aceptado antes."
            );

            if (
                actionModalMarketplace
            ) {

                actionModalMarketplace.classList.add(
                    "hidden"
                );
            }

            await cargarTrabajosDisponibles();

            return;
        }

        if (
            !data ||
            data.length === 0
        ) {

            alert(
                "Esta mudanza ya no está disponible.\n\n" +
                "Es posible que otro transportista la haya aceptado."
            );

            if (
                actionModalMarketplace
            ) {

                actionModalMarketplace.classList.add(
                    "hidden"
                );
            }

            await cargarTrabajosDisponibles();

            return;
        }

        console.log(
            "✅ Mudanza asignada correctamente:",
            data[0]
        );

        if (
            actionModalMarketplace
        ) {

            actionModalMarketplace.classList.add(
                "hidden"
            );
        }

        if (
            typeof cerrarDrawer ===
            "function"
        ) {

            cerrarDrawer();
        }

        if (
            typeof cargarMisMudanzas ===
            "function"
        ) {

            await cargarMisMudanzas();
        }

        await cargarTrabajosDisponibles();

        if (
            typeof cambiarTab ===
            "function"
        ) {

            cambiarTab(
                "mis-mudanzas"
            );
        }

    } catch (error) {

        console.error(
            "❌ Excepción aceptando mudanza:",
            error
        );

        alert(
            "Se produjo un error al aceptar la mudanza.\n\n" +
            (
                error?.message ||
                "Error desconocido"
            )
        );

        if (
            actionModalMarketplace
        ) {

            actionModalMarketplace.classList.add(
                "hidden"
            );
        }
    }
}


// EVENTO — FILTROS MARKETPLACE
///////////////////////////////////////////////////////////

document.addEventListener(
    "DOMContentLoaded",
    inicializarFiltrosMarketplace
);


// API GLOBAL
///////////////////////////////////////////////////////////

window.cargarTrabajosDisponibles =
    cargarTrabajosDisponibles;

window.renderizarDisponibles =
    renderizarDisponibles;

window.procesarAceptacion =
    procesarAceptacion;

console.log(
    "✅ Marketplace cargado correctamente"
);