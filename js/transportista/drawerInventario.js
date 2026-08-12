(function () {

    "use strict";


    ///////////////////////////////////////////////////////
    // ESCAPAR HTML
    ///////////////////////////////////////////////////////

    function escapeHtml(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    ///////////////////////////////////////////////////////
    // NORMALIZAR NOMBRE
    ///////////////////////////////////////////////////////

    function normalizarNombre(nombre) {
        return String(nombre ?? "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }


    ///////////////////////////////////////////////////////
    // MAPA COMPLETO DE LA VENTANA 2 DE LA HOME
    ///////////////////////////////////////////////////////

    const mapeoCategoriasHome = {

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


    ///////////////////////////////////////////////////////
    // CREAR ÍNDICE NORMALIZADO
    ///////////////////////////////////////////////////////

    const indiceCategorias = new Map();

    Object.entries(mapeoCategoriasHome).forEach(
        ([categoria, items]) => {

            items.forEach(nombre => {
                indiceCategorias.set(
                    normalizarNombre(nombre),
                    categoria
                );
            });
        }
    );


    ///////////////////////////////////////////////////////
    // RENDER
    ///////////////////////////////////////////////////////

    function renderInventarioDrawer(
        datosInventario,
        tipoServicioText
    ) {

        const contenedorResumen =
            document.getElementById("drawerInventarioResumen");

        const contenedorFull =
            document.getElementById("drawerInventarioFull");

        if (!contenedorResumen || !contenedorFull) {
            console.warn(
                "Inventario: no existen los contenedores del drawer."
            );
            return;
        }

        contenedorResumen.innerHTML = "";
        contenedorFull.innerHTML = "";


        ///////////////////////////////////////////////////////
        // PARSEAR INVENTARIO
        ///////////////////////////////////////////////////////

        let inventarioArray = datosInventario;

        if (typeof inventarioArray === "string") {

            try {
                inventarioArray = JSON.parse(inventarioArray);
            } catch (error) {
                console.error(
                    "Inventario: JSON inválido.",
                    error
                );
                inventarioArray = [];
            }
        }

        if (!Array.isArray(inventarioArray)) {
            inventarioArray = [];
        }

        if (inventarioArray.length === 0) {

            const msg = `
                <p class="text-sm text-gray-400 italic">
                    No se especificó inventario detallado.
                </p>
            `;

            contenedorResumen.innerHTML = msg;
            contenedorFull.innerHTML = msg;

            return;
        }


        const esMudanzaTotal =
            String(tipoServicioText || "")
                .toLowerCase()
                .includes("total");

        const cajasExtrasList = [];


        ///////////////////////////////////////////////////////
        // LAS CATEGORÍAS SE INICIALIZAN VACÍAS A PROPÓSITO
        // Y SE RELLENAN CON EL INVENTARIO REAL.
        ///////////////////////////////////////////////////////

        const categoriasConItems = {};

        Object.keys(mapeoCategoriasHome).forEach(
            categoria => {
                categoriasConItems[categoria] = [];
            }
        );


        let totalArticulosCount = 0;


        ///////////////////////////////////////////////////////
        // CLASIFICAR INVENTARIO REAL
        ///////////////////////////////////////////////////////

        inventarioArray.forEach(item => {

            const nombre =
                item?.nombre ||
                item?.mueble ||
                "Mueble sin nombre";

            const cantidad =
                Number.parseInt(
                    item?.cantidad,
                    10
                ) || 0;

            if (cantidad <= 0) return;

            totalArticulosCount += cantidad;

            const nombreNormalizado =
                normalizarNombre(nombre);


            // CAJAS EXTRAS EN MUDANZA TOTAL
            if (nombreNormalizado.includes("caja")) {

                if (esMudanzaTotal) {

                    cajasExtrasList.push({
                        nombre,
                        cantidad
                    });

                    return;
                }
            }


            // BUSCAR CATEGORÍA
            const categoria =
                indiceCategorias.get(
                    nombreNormalizado
                ) || "Otros";

            categoriasConItems[categoria].push({
                nombre,
                cantidad
            });
        });


        ///////////////////////////////////////////////////////
        // CONTADOR TOTAL
        ///////////////////////////////////////////////////////

        const elContador =
            document.getElementById(
                "drawerTotalArticulos"
            );

        if (elContador) {
            elContador.textContent =
                totalArticulosCount;
        }


        ///////////////////////////////////////////////////////
        // CAJAS EXTRAS
        ///////////////////////////////////////////////////////

        let htmlCajasExtras = "";

        if (
            esMudanzaTotal &&
            cajasExtrasList.length > 0
        ) {

            htmlCajasExtras = `
                <div class="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-3 w-full text-left">
                    <span class="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        📦 CAJAS EXTRAS
                    </span>

                    <div class="grid grid-cols-1 gap-1.5">
                        ${cajasExtrasList.map(c => `
                            <div class="flex justify-between items-center text-xs">
                                <span class="font-semibold text-slate-700">
                                    ${escapeHtml(c.nombre)}
                                </span>

                                <span class="bg-blue-600 text-white px-2 py-0.5 rounded-md font-black text-[10px]">
                                    x${c.cantidad}
                                </span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }


        ///////////////////////////////////////////////////////
        // ACORDEÓN
        ///////////////////////////////////////////////////////

        let htmlAcordeon =
            `<div class="space-y-1 w-full text-left">`;

        let tieneElementosVisibles = false;

        for (
            const [categoria, items]
            of Object.entries(categoriasConItems)
        ) {

            if (!items.length) continue;

            tieneElementosVisibles = true;

            const totalCategoria =
                items.reduce(
                    (acc, item) =>
                        acc + item.cantidad,
                    0
                );

            htmlAcordeon += `
                <details class="group border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden transition-all duration-200 open:bg-white open:ring-1 open:ring-blue-500/20">

                    <summary class="flex items-center justify-between p-2.5 font-semibold text-xs text-slate-800 cursor-pointer list-none select-none hover:bg-slate-50 transition-colors">

                        <div class="flex items-center gap-1.5">
                            <span class="text-slate-700 font-bold">
                                ${escapeHtml(categoria)}
                            </span>

                            <span class="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                ${totalCategoria}
                            </span>
                        </div>

                        <span class="transition-transform duration-200 group-open:rotate-180 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                            </svg>
                        </span>
                    </summary>

                    <div class="border-t border-slate-100 bg-white p-2.5">
                        <ul class="space-y-1.5 text-xs text-slate-600">
                            ${items.map(item => `
                                <li class="flex justify-between items-center border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                                    <span class="font-medium text-slate-700">
                                        ${escapeHtml(item.nombre)}
                                    </span>

                                    <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                        x${item.cantidad}
                                    </span>
                                </li>
                            `).join("")}
                        </ul>
                    </div>
                </details>
            `;
        }

        htmlAcordeon += `</div>`;


        ///////////////////////////////////////////////////////
        // SIN ELEMENTOS
        ///////////////////////////////////////////////////////

        if (
            cajasExtrasList.length === 0 &&
            !tieneElementosVisibles
        ) {

            const msg = `
                <p class="text-sm text-gray-400 italic">
                    No se especificó inventario detallado.
                </p>
            `;

            contenedorResumen.innerHTML = msg;
            contenedorFull.innerHTML = msg;

            return;
        }


        ///////////////////////////////////////////////////////
        // PINTAR
        ///////////////////////////////////////////////////////

        const contenido =
            htmlCajasExtras + htmlAcordeon;

        contenedorResumen.innerHTML = contenido;
        contenedorFull.innerHTML = contenido;
    }


    ///////////////////////////////////////////////////////
    // API GLOBAL
    ///////////////////////////////////////////////////////

    window.renderInventarioDrawer =
        renderInventarioDrawer;

    console.log(
        "✅ Drawer Inventario cargado correctamente"
    );

})();
