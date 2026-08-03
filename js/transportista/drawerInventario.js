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

    const mapeoCategorias = {
        "Cajas de Mudanza": ["Caja Pequeña", "Caja Mediana", "Caja Grande"],
        "Salón y Estancia": ["Sofá 2 plazas", "Sofá 3 plazas", "Sofá chaise longue", "Butaca", "Mueble TV", "Estantería"],
        "Electrodomésticos": ["Nevera", "Frigorífico americano", "Congelador", "Microondas", "Horno", "Lavadora", "Lavavajillas"],
        "Comedor y Mesas": ["Mesa comedor pequeña", "Mesa comedor grande", "Mesa extensible", "Silla comedor", "Aparador"],
        "Dormitorio": ["Cama Individual", "Cama Doble", "Cama king size", "Colchón", "Armario", "Mesita de noche", "Cómoda"],
        "Baño e Higiene": ["Mueble Baño", "Lavabo auxiliar", "Espejo baño", "Mampara"],
        "Otros Enseres": ["Maleta", "Bici", "Planta", "Espejo grande"]
    };

    const categoriasConItems = {
        "Cajas de Mudanza": [], "Salón y Estancia": [], "Electrodomésticos": [], "Comedor y Mesas": [], "Dormitorio": [], "Baño e Higiene": [], "Otros Enseres": []
    };

    let totalContado = 0;

    inventarioArray.forEach(item => {
        const nombre = item.nombre || item.mueble || "Mueble sin nombre";
        const cantidad = parseInt(item.cantidad, 10) || 0;

        if (cantidad > 0) {
            totalContado += cantidad;
            let clasificado = false;

            for (const [categoria, listaMuebles] of Object.entries(mapeoCategorias)) {
                if (listaMuebles.includes(nombre)) {
                    categoriasConItems[categoria].push({ nombre, cantidad });
                    clasificado = true;
                    break;
                }
            }
            if (!clasificado) {
                categoriasConItems["Otros Enseres"].push({ nombre, cantidad });
            }
        }
    });

    if (totalContado === 0) {
        const msg = `<p class="text-sm text-gray-400 italic">No se especificó inventario detallado.</p>`;
        contenedorResumen.innerHTML = msg;
        contenedorFull.innerHTML = msg;
        return;
    }

    // Generador de bloques HTML colapsables
    let htmlAcordeon = `<div class="space-y-2 mt-1 w-full">`;
    for (const [categoria, items] of Object.entries(categoriasConItems)) {
        if (items.length === 0) continue;
        const totalCategoria = items.reduce((acc, curr) => acc + curr.cantidad, 0);

        htmlAcordeon += `
            <details class="group border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden transition-all duration-200 open:bg-white open:ring-1 open:ring-blue-500/20">
                <summary class="flex items-center justify-between p-3 font-semibold text-xs text-slate-800 cursor-pointer list-none select-none hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-2">
                        <span class="text-slate-700 font-bold">${categoria}</span>
                        <span class="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium">${totalCategoria}</span>
                    </div>
                    <span class="transition-transform duration-200 group-open:rotate-180 text-slate-400">
                        <svg xmlns="http://w3.org" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                </summary>
                <div class="border-t border-slate-100 bg-white p-3">
                    <ul class="space-y-2 text-xs text-slate-600">
                        ${items.map(i => `
                            <li class="flex justify-between items-center border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                                <span class="font-medium text-slate-700">${i.nombre}</span>
                                <span class="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black">x${i.cantidad}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </details>`;
    }
    htmlAcordeon += `</div>`;

    // Inyectamos el mismo acordeón en ambas vistas simultáneamente
    contenedorResumen.innerHTML = htmlAcordeon;
    contenedorFull.innerHTML = htmlAcordeon;
}
