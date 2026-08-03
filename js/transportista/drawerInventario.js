// js/transportista/drawerInventario.js

function renderInventarioDrawer(datosInventario) {
    const contenedorResumen = document.getElementById("drawerInventarioResumen");
    const contenedorFull = document.getElementById("drawerInventarioFull");
    
    if (!contenedorResumen || !contenedorFull) return;

    contenedorResumen.innerHTML = "";
    contenedorFull.innerHTML = "";

    let inventarioArray = datosInventario;
    if (typeof inventarioArray === "string") {
        try { inventarioArray = JSON.parse(inventarioArray); } 
        catch (e) { inventarioArray = null; }
    }

    if (!Array.isArray(inventarioArray) || inventarioArray.length === 0) {
        const msg = `<p class="text-sm text-gray-400 italic">No se especificó inventario detallado.</p>`;
        contenedorResumen.innerHTML = msg;
        contenedorFull.innerHTML = msg;
        return;
    }

    const cajasEncontradas = [];
    let totalArticulosCount = 0;

    const mapeoCategorias = {
        "Salón y Estancia": ["Sofá 2 plazas", "Sofá 3 plazas", "Sofá chaise longue", "Butaca", "Mueble TV", "Estantería"],
        "Electrodomésticos": ["Nevera", "Frigorífico americano", "Congelador", "Microondas", "Horno", "Lavadora", "Lavavajillas"],
        "Comedor y Mesas": ["Mesa comedor pequeña", "Mesa comedor grande", "Mesa extensible", "Silla comedor", "Aparador"],
        "Dormitorio": ["Cama Individual", "Cama Doble", "Cama king size", "Colchón", "Armario", "Mesita de noche", "Cómoda"],
        "Baño e Higiene": ["Mueble Baño", "Lavabo auxiliar", "Espejo baño", "Mampara"],
        "Otros Enseres": ["Maleta", "Bici", "Planta", "Espejo grande"]
    };

    const categoriesConItems = {
        "Salón y Estancia": [], "Electrodomésticos": [], "Comedor y Mesas": [], "Dormitorio": [], "Baño e Higiene": [], "Otros Enseres": []
    };

    inventarioArray.forEach(item => {
        const nombre = item.nombre || item.mueble || "Mueble sin nombre";
        const cantidad = parseInt(item.cantidad, 10) || 0;

        if (cantidad > 0) {
            totalArticulosCount += cantidad;

            // Extraemos las cajas prioritarias del cliente (Problema 4)
            if (nombre.toLowerCase().includes("caja")) {
                cajasEncontradas.push({ nombre, cantidad });
            } else {
                let clasificado = false;
                for (const [categoria, listaMuebles] of Object.entries(mapeoCategorias)) {
                    if (listaMuebles.includes(nombre)) {
                        categoriesConItems[categoria].push({ nombre, cantidad });
                        clasificado = true;
                        break;
                    }
                }
                if (!clasificado) {
                    categoriesConItems["Otros Enseres"].push({ nombre, canvas: cantidad });
                }
            }
        }
    });

    // Inyectar el número real en la etiqueta de cantidad de artículos
    const elContador = document.getElementById("drawerTotalArticulos");
    if(elContador) elContador.textContent = totalArticulosCount;

    // --- HTML BLOQUE DE CAJAS SELECCIONADAS (Problema 4) ---
    let htmlCajas = "";
    if (cajasEncontradas.length > 0) {
        htmlCajas = `
            <div class="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-2 w-full text-left">
                <span class="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">📦 Cajas de mudanza incluidas</span>
                <div class="grid grid-cols-1 gap-1.5">
                    ${cajasEncontradas.map(c => `
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-medium text-slate-700">${c.nombre}</span>
                            <span class="bg-blue-600 text-white px-2 py-0.5 rounded-md font-black text-[10px]">x${c.cantidad}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    // --- HTML GRUPOS DESPLEGABLES DE MUEBLES (Problema 2) ---
    let htmlAcordeon = `<div class="space-y-1 w-full text-left">`;
    let tieneMuebles = false;

    for (const [categoria, items] of Object.entries(categoriesConItems)) {
        if (items.length === 0) continue;
        tieneMuebles = true;
        const totalCategoria = items.reduce((acc, curr) => acc + curr.cantidad, 0);

        htmlAcordeon += `
            <details class="group border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden transition-all duration-200 open:bg-white open:ring-1 open:ring-blue-500/20">
                <summary class="flex items-center justify-between p-2.5 font-semibold text-xs text-slate-800 cursor-pointer list-none select-none hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-1.5">
                        <span class="text-slate-700 font-bold">${categoria}</span>
                        <span class="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-medium">${totalCategoria}</span>
                    </div>
                    <span class="transition-transform duration-200 group-open:rotate-180 text-slate-400">
                        <svg xmlns="http://w3.org" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                </summary>
                <div class="border-t border-slate-100 bg-white p-2.5">
                    <ul class="space-y-1.5 text-xs text-slate-600">
                        ${items.map(i => `
                            <li class="flex justify-between items-center border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                                <span class="font-medium text-slate-700">${i.nombre}</span>
                                <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">x${i.cantidad}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </details>`;
    }
    htmlAcordeon += `</div>`;

    if (cajasEncontradas.length === 0 && !tieneMuebles) {
        const msg = `<p class="text-sm text-gray-400 italic">No se especificó inventario detallado.</p>`;
        contenedorResumen.innerHTML = msg;
        contenedorFull.innerHTML = msg;
        return;
    }

    // Inyectamos el bloque combinado en las dos vistas simultáneamente
    contenedorResumen.innerHTML = htmlCajas + htmlAcordeon;
    contenedorFull.innerHTML = htmlCajas + htmlAcordeon;
    }