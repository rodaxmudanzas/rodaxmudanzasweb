// js/transportista/drawerInventario.js
//
// MOD-003A
// INVENTARIO + M3 + EXTRAS MUDANZA TOTAL
//
// REGLAS:
// 1. El inventario siempre se agrupa por categorías.
// 2. Las cajas normales forman parte del INVENTARIO.
// 3. EXTRAS NO se detectan por la palabra "caja".
// 4. EXTRAS proceden únicamente de las cantidades específicas
//    de Cajas de Beneficios Mudanza Total.
// 5. EXTRAS aparecen SIEMPRE DESPUÉS del INVENTARIO.
// 6. EXTRAS no se suman a ART. ni a M3.
// 7. Orden obligatorio: ART. · M3.
//

(function () {

    "use strict";

    //////////////////////////////////////////////////////////////
    // CONFIGURACIÓN CENTRAL
    //////////////////////////////////////////////////////////////

    const CONFIG_INVENTARIO = {
        categorias: {
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
},
        extras: {
            pequenas: ["cajas_pequenas","cajasPequenas","cajas_pequena","cajasPequena"],
            medianas: ["cajas_medianas","cajasMedianas","cajas_mediana","cajasMediana"],
            grandes: ["cajas_grandes","cajasGrandes","cajas_grande","cajasGrande"]
        }
    };


    //////////////////////////////////////////////////////////////
    // ESCAPE HTML
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
    // NÚMERO SEGURO
    //////////////////////////////////////////////////////////////

    function numeroSeguro(valor) {

        const numero = Number(valor);

        return Number.isFinite(numero) && numero > 0
            ? numero
            : 0;
    }


    //////////////////////////////////////////////////////////////
    // FORMATEAR M3
    //////////////////////////////////////////////////////////////

    function formatearM3(totalM3) {

        const api = window.Transportista;

        if (
            api &&
            typeof api.formatM3 === "function"
        ) {
            return api.formatM3(totalM3);
        }

        return `${totalM3.toFixed(1).replace(".", ",")} m³`;
    }


    //////////////////////////////////////////////////////////////
    // BUSCAR CAMPO DE EXTRAS
    //////////////////////////////////////////////////////////////

    function obtenerCampo(objeto, nombres) {

        if (!objeto || typeof objeto !== "object") {
            return 0;
        }

        for (const nombre of nombres) {

            if (
                Object.prototype.hasOwnProperty.call(
                    objeto,
                    nombre
                )
            ) {

                const cantidad =
                    numeroSeguro(objeto[nombre]);

                if (cantidad > 0) {
                    return cantidad;
                }
            }
        }

        return 0;
    }


    //////////////////////////////////////////////////////////////
    // OBTENER EXTRAS
    //////////////////////////////////////////////////////////////

    function obtenerExtrasCajas(datos) {
        const resultado = { pequenas: 0, medianas: 0, grandes: 0 };
        const t = datos || {};
        const tipo = t?.tipo_servicio ?? t?.tipoServicio ?? "";
        const total = String(tipo).toLowerCase().includes("total");
        if (!total) return resultado;

        const direct = window.Transportista?.obtenerExtrasMudanzaTotal;
        if (typeof direct === "function") {
            const r = direct(t);
            resultado.pequenas = Number(r?.["Cajas pequeñas"]) || 0;
            resultado.medianas = Number(r?.["Cajas medianas"]) || 0;
            resultado.grandes = Number(r?.["Cajas grandes"]) || 0;
            return resultado;
        }

        // Fallback: solo los tres nombres exactos de las cajas de beneficios.
        let arr = t.inventario ?? t;
        if (typeof arr === "string") { try { arr = JSON.parse(arr); } catch { arr = []; } }
        if (!Array.isArray(arr)) arr = Array.isArray(arr?.inventario) ? arr.inventario : [];
        arr.forEach(item => {
            const nombre = String(item?.nombre ?? item?.mueble ?? item?.item ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cantidad = Number(item?.cantidad) || 0;
            if (nombre === "caja pequena") resultado.pequenas += cantidad;
            if (nombre === "caja mediana") resultado.medianas += cantidad;
            if (nombre === "caja grande") resultado.grandes += cantidad;
        });
        return resultado;
    }


    //////////////////////////////////////////////////////////////
    // RENDER EXTRAS
    //////////////////////////////////////////////////////////////

    function renderExtrasCajas(extras, esMudanzaTotal) {
        if (!esMudanzaTotal) return "";

        const filas = [];
        const lista = [
            ["Cajas pequeñas", Number(extras?.pequenas) || 0],
            ["Cajas medianas", Number(extras?.medianas) || 0],
            ["Cajas grandes", Number(extras?.grandes) || 0]
        ];

        lista.forEach(([nombre, cantidad]) => {
            filas.push(`
                <div class="flex items-center justify-between gap-3 py-1.5">
                    <span class="font-medium text-slate-700">${nombre}</span>
                    <span class="shrink-0 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black">x${cantidad}</span>
                </div>
            `);
        });

        return `
            <div class="mt-3 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 w-full text-left">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm">🎁</span>
                    <span class="text-[10px] font-black text-emerald-700 uppercase tracking-wider">EXTRAS</span>
                </div>
                <div class="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mb-1.5">Beneficios Mudanza Total</div>
                <div class="divide-y divide-emerald-100/70">${filas.join("")}</div>
            </div>
        `;
    }


    //////////////////////////////////////////////////////////////
    // RENDER CATEGORÍA
    //////////////////////////////////////////////////////////////

    function renderCategoria(categoria, items) {

        if (!items || items.length === 0) {
            return "";
        }

        const totalCategoria =
            items.reduce(
                (total, item) =>
                    total + numeroSeguro(item.cantidad),
                0
            );

        const iconos = {
            "Salón": "🛋️",
            "Cocina": "🍳",
            "Comedor": "🍽️",
            "Dormitorio": "🛏️",
            "Baño": "🚿",
            "Otros": "📦"
        };

        const icono =
            iconos[categoria] || "📦";


        const filas = items.map(item => {

            return `
                <li class="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">

                    <span class="text-xs font-medium text-slate-700 leading-snug">
                        ${escapeHtml(item.nombre)}
                    </span>

                    <span class="shrink-0 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-black">
                        x${item.cantidad}
                    </span>

                </li>
            `;

        }).join("");


        return `
            <details class="group border border-slate-200 rounded-xl bg-white overflow-hidden transition-all duration-200">

                <summary class="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer list-none select-none hover:bg-slate-50">

                    <div class="flex items-center gap-2 min-w-0">

                        <span class="text-sm">
                            ${icono}
                        </span>

                        <span class="text-xs font-bold text-slate-800">
                            ${escapeHtml(categoria)}
                        </span>

                        <span class="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                            ${totalCategoria}
                        </span>

                    </div>

                    <span class="text-slate-400 text-xs transition-transform duration-200 group-open:rotate-180">
                        ▼
                    </span>

                </summary>

                <div class="border-t border-slate-100 px-3 py-2 bg-slate-50/40">

                    <ul>
                        ${filas}
                    </ul>

                </div>

            </details>
        `;
    }


    //////////////////////////////////////////////////////////////
    // FUNCIÓN PRINCIPAL
    //////////////////////////////////////////////////////////////

    function renderInventarioDrawer(
        datosInventario,
        tipoServicioText,
        extrasCajasExternos = null
    ) {
        const datosOriginales = datosInventario;
        if (datosInventario && typeof datosInventario === "object" && !Array.isArray(datosInventario) && Array.isArray(datosInventario.inventario)) {
            datosInventario = datosInventario.inventario;
        }

        if (!tipoServicioText && datosOriginales && typeof datosOriginales === "object") {
            tipoServicioText = datosOriginales.tipo_servicio || datosOriginales.tipoServicio || "";
        }

        const contenedorResumen =
            document.getElementById(
                "drawerInventarioResumen"
            );

        const contenedorFull =
            document.getElementById(
                "drawerInventarioFull"
            );


        if (
            !contenedorResumen &&
            !contenedorFull
        ) {
            return;
        }


        if (contenedorResumen) {
            contenedorResumen.innerHTML = "";
        }

        if (contenedorFull) {
            contenedorFull.innerHTML = "";
        }


        //////////////////////////////////////////////////////////
        // TIPO DE SERVICIO
        //////////////////////////////////////////////////////////

        const esMudanzaTotal =
            String(tipoServicioText || "")
                .toLowerCase()
                .includes("total");


        //////////////////////////////////////////////////////////
        // NORMALIZAR INVENTARIO
        //////////////////////////////////////////////////////////

        let inventarioArray =
            datosInventario;


        if (typeof inventarioArray === "string") {

            try {

                inventarioArray =
                    JSON.parse(inventarioArray);

            } catch (error) {

                console.error(
                    "❌ No se pudo interpretar el inventario:",
                    error
                );

                inventarioArray = [];
            }
        }


        /*
         * Si recibimos un objeto con una propiedad inventario,
         * utilizamos esa propiedad.
         */

        if (
            inventarioArray &&
            !Array.isArray(inventarioArray) &&
            Array.isArray(inventarioArray.inventario)
        ) {

            inventarioArray =
                inventarioArray.inventario;
        }


        if (!Array.isArray(inventarioArray)) {
            inventarioArray = [];
        }


        //////////////////////////////////////////////////////////
        // CATEGORÍAS
        //////////////////////////////////////////////////////////

        const categoriasConItems = {};

        for (
            const categoria of
            Object.keys(CONFIG_INVENTARIO.categorias)
        ) {

            categoriasConItems[categoria] = [];
        }


        //////////////////////////////////////////////////////////
        // TOTALES
        //////////////////////////////////////////////////////////

        let totalArticulosCount = 0;
        let totalM3 = 0;


        //////////////////////////////////////////////////////////
        // RECORRER INVENTARIO
        //////////////////////////////////////////////////////////

        inventarioArray.forEach(item => {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return;
            }


            const nombre =
                String(
                    item.nombre ||
                    item.mueble ||
                    item.item ||
                    "Mueble sin nombre"
                ).trim();


            const cantidad =
                numeroSeguro(item.cantidad);


            if (cantidad <= 0) {
                return;
            }

            // En Mudanza Total, las tres cajas de BENEFICIOS son EXTRAS.
            // Se excluyen de ART. y M3, pero las cajas normales permanecen
            // dentro del inventario.
            const nombreNormalizado =
                nombre.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

            const esCajaBeneficio =
                esMudanzaTotal &&
                (nombreNormalizado === "caja pequena" ||
                 nombreNormalizado === "caja mediana" ||
                 nombreNormalizado === "caja grande");

            if (esCajaBeneficio) {
                return;
            }


            //////////////////////////////////////////////////////
            // ARTÍCULOS
            //////////////////////////////////////////////////////

            totalArticulosCount += cantidad;


            //////////////////////////////////////////////////////
            // M3
            //////////////////////////////////////////////////////

            const m3Unitario =
                Number(
                    item.metrosCubicos ??
                    item.m3 ??
                    item.metros_cubicos ??
                    0.5
                );


            if (
                Number.isFinite(m3Unitario) &&
                m3Unitario > 0
            ) {

                totalM3 +=
                    cantidad * m3Unitario;
            }


            //////////////////////////////////////////////////////
            // CLASIFICACIÓN
            //////////////////////////////////////////////////////

            let clasificado = false;


            for (
                const [
                    categoria,
                    listaMuebles
                ] of Object.entries(
                    CONFIG_INVENTARIO.categorias
                )
            ) {

                if (
                    listaMuebles.includes(nombre)
                ) {

                    categoriasConItems[
                        categoria
                    ].push({
                        nombre,
                        cantidad
                    });

                    clasificado = true;

                    break;
                }
            }


            //////////////////////////////////////////////////////
            // IMPORTANTE:
            //
            // NO preguntar:
            //
            // nombre.includes("caja")
            //
            // Las cajas normales son INVENTARIO.
            //////////////////////////////////////////////////////

            if (!clasificado) {

                categoriasConItems[
                    "Otros"
                ].push({
                    nombre,
                    cantidad
                });
            }

        });


        //////////////////////////////////////////////////////////
        // CONTADOR DE ARTÍCULOS
        //////////////////////////////////////////////////////////

        const elContador =
            document.getElementById(
                "drawerTotalArticulos"
            );


        if (elContador) {

            elContador.textContent =
                totalArticulosCount;
        }


        //////////////////////////////////////////////////////////
        // M3
        //////////////////////////////////////////////////////////

        const m3Formateado =
            formatearM3(totalM3);


        const elM3Texto =
            document.getElementById(
                "drawerM3Texto"
            );


        const elM3Badge =
            document.getElementById(
                "drawerM3Badge"
            );


        if (elM3Texto) {
            elM3Texto.textContent =
                m3Formateado;
        }


        if (elM3Badge) {
            elM3Badge.textContent =
                m3Formateado;
        }


        //////////////////////////////////////////////////////////
        // CONSTRUIR INVENTARIO AGRUPADO
        //////////////////////////////////////////////////////////

        let htmlInventario = `
            <div class="space-y-2 w-full text-left">

                <div class="flex items-center justify-between mb-1">

                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        INVENTARIO
                    </span>

                    <span class="text-[10px] font-semibold text-slate-400">
                        ${totalArticulosCount} artículos
                    </span>

                </div>
        `;


        let tieneInventario =
            false;


        for (
            const [
                categoria,
                items
            ] of Object.entries(
                categoriasConItems
            )
        ) {

            if (
                !items ||
                items.length === 0
            ) {
                continue;
            }


            tieneInventario = true;


            htmlInventario +=
                renderCategoria(
                    categoria,
                    items
                );
        }


        htmlInventario += `
            </div>
        `;


        //////////////////////////////////////////////////////////
        // EXTRAS
        //////////////////////////////////////////////////////////
        //
        // PRIORIDAD:
        //
        // 1. extrasCajasExternos
        // 2. datosInventario
        //
        // Nunca se buscan por el nombre del mueble.
        //////////////////////////////////////////////////////////

        let extrasCajas =
            extrasCajasExternos &&
            typeof extrasCajasExternos === "object"
                ? {
                    pequenas:
                        numeroSeguro(
                            extrasCajasExternos.pequenas ??
                            extrasCajasExternos.cajas_pequenas ??
                            extrasCajasExternos.cajasPequenas
                        ),

                    medianas:
                        numeroSeguro(
                            extrasCajasExternos.medianas ??
                            extrasCajasExternos.cajas_medianas ??
                            extrasCajasExternos.cajasMedianas
                        ),

                    grandes:
                        numeroSeguro(
                            extrasCajasExternos.grandes ??
                            extrasCajasExternos.cajas_grandes ??
                            extrasCajasExternos.cajasGrandes
                        )
                }
                : obtenerExtrasCajas(
                    datosOriginales
                );


        //////////////////////////////////////////////////////////
        // HTML FINAL
        //////////////////////////////////////////////////////////

        let htmlFinal = "";


        if (tieneInventario) {

            htmlFinal +=
                htmlInventario;

        } else {

            htmlFinal += `
                <p class="text-sm text-gray-400 italic text-center py-4">
                    No se especificó inventario detallado.
                </p>
            `;
        }


        //////////////////////////////////////////////////////////
        // MUY IMPORTANTE:
        //
        // EXTRAS SIEMPRE DESPUÉS DEL INVENTARIO.
        //////////////////////////////////////////////////////////

        htmlFinal +=
            renderExtrasCajas(
                extrasCajas,
                esMudanzaTotal
            );


        //////////////////////////////////////////////////////////
        // INSERTAR
        //////////////////////////////////////////////////////////

        if (contenedorResumen) {

            contenedorResumen.innerHTML =
                htmlFinal;
        }


        if (contenedorFull) {

            contenedorFull.innerHTML =
                htmlFinal;
        }


        //////////////////////////////////////////////////////////
        // LOG DE CONTROL
        //////////////////////////////////////////////////////////

        console.log(
            "✅ Inventario drawer renderizado",
            {
                articulos: totalArticulosCount,
                m3: totalM3,
                mudanzaTotal: esMudanzaTotal,
                extras: extrasCajas,
                categorias: categoriasConItems
            }
        );
    }


    //////////////////////////////////////////////////////////////
    // API GLOBAL
    //////////////////////////////////////////////////////////////

    window.renderInventarioDrawer =
        renderInventarioDrawer;


    window.RodaxInventario =
        window.RodaxInventario || {};

    window.RodaxInventario.config =
        CONFIG_INVENTARIO;

    window.RodaxInventario.obtenerExtrasCajas =
        obtenerExtrasCajas;

    window.RodaxInventario.normalizarNombre =
        valor => String(valor ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");


    console.log(
        "✅ Drawer Inventario MOD-003A cargado correctamente"
    );

})();
