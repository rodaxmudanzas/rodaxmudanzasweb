// js/transportista/drawerInventario.js

function renderInventarioDrawer(datosInventario) {
    const contenedorInventario = document.getElementById("drawerInventario");
    if (!contenedorInventario) return;

    contenedorInventario.innerHTML = ""; // Limpiar contenido previo

    let inventarioArray = datosInventario;

    // 1. Parsear JSON si viene como texto desde Supabase
    if (typeof inventarioArray === "string") {
        try {
            inventarioArray = JSON.parse(inventarioArray);
        } catch (e) {
            console.error("Error al transformar el JSON de inventario:", e);
            inventarioArray = null;
        }
    }

    if (!Array.isArray(inventarioArray) || inventarioArray.length === 0) {
        contenedorInventario.innerHTML = `<p class="text-sm text-gray-400 italic">No se especificó inventario detallado.</p>`;
        return;
    }

    // 2. Mapeo Dinámico de Muebles por Categoría (Fácil de ampliar en el futuro)
    const mapeoCategorias = {
        "Salón": ["Sofá 2 plazas", "Sofá 3 plazas", "Sofá chaise longue", "Butaca", "Mueble TV", "Estantería"],
        "Cocina": ["Nevera", "Frigorífico americano", "Congelador", "Microondas", "Horno", "Lavadora", "Lavavajillas"],
        "Comedor": ["Mesa comedor pequeña", "Mesa comedor grande", "Mesa extensible", "Silla comedor", "Aparador"],
        "Dormitorio": ["Cama Individual", "Cama Doble", "Cama king size", "Colchón", "Armario", "Mesita de noche", "Cómoda"],
        "Baño": ["Mueble Baño", "Lavabo auxiliar", "Espejo baño", "Mampara"],
        "Otros": ["Caja Pequeña", "Caja Mediana", "Caja Grande", "Maleta", "Bici", "Planta", "Espejo grande"]
    };

    // Estructura interna para almacenar los muebles que sí tengan cantidad > 0
    const categoriasConItems = {
        "Salón": [], "Cocina": [], "Comedor": [], "Dormitorio": [], "Baño": [], "Otros": []
    };

    let totalMueblesContados = 0;

    // 3. Clasificar los muebles del cliente en sus grupos correspondientes
    inventarioArray.forEach(item => {
        const nombre = item.nombre || item.mueble || "Mueble sin nombre";
        const cantidad = parseInt(item.cantidad, 10) || 0;

        if (cantidad > 0) {
            totalMueblesContados += cantidad;
            let clasificado = false;

            // Buscamos a qué grupo pertenece el mueble según el mapa
            for (const [categoria, listaMuebles] of Object.entries(mapeoCategorias)) {
                if (listaMuebles.includes(nombre)) {
                    categoriasConItems[categoria].push({ nombre, cantidad });
                    clasificado = true;
                    break;
                }
            }

            // Si añades un mueble en la Home y olvidas meterlo en el mapa, cae automáticamente en "Otros"
            if (!clasificado) {
                categoriasConItems["Otros"].push({ nombre, cantidad });
            }
        }
    });

    if (totalMueblesContados === 0) {
        contenedorInventario.innerHTML = `<p class="text-sm text-gray-400 italic">No se especificó inventario detallado.</p>`;
        return;
    }

    // 4. Renderizar los bloques desplegables (Acordeones) usando Tailwind CSS nativo (<details>)
    const contenedorAcordeon = document.createElement("div");
    contenedorAcordeon.className = "space-y-2 mt-2 w-full";

    for (const [categoria, items] of Object.entries(categoriasConItems)) {
        if (items.length === 0) continue; // Si la categoría no tiene muebles contratados, no la dibujamos

        const totalItemsCategoria = items.reduce((acc, curr) => acc + curr.cantidad, 0);

        contenedorAcordeon.innerHTML += `
            <details class="group border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden transition-all duration-200 open:bg-white open:ring-1 open:ring-blue-500/20">
                <summary class="flex items-center justify-between p-3.5 font-semibold text-sm text-slate-800 cursor-pointer list-none select-none hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-2">
                        <span class="text-slate-700 font-bold">${categoria}</span>
                        <span class="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-medium">${totalItemsCategoria}</span>
                    </div>
                    <span class="transition-transform duration-200 group-open:rotate-180 text-slate-400">
                        <svg xmlns="http://w3.org" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                </summary>
                <div class="border-t border-slate-100 bg-white p-3">
                    <ul class="space-y-2 text-sm text-slate-600">
                        ${items.map(item => `
                            <li class="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                <span class="font-medium text-slate-700">${item.nombre}</span>
                                <span class="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black">x${item.cantidad}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </details>
        `;
    }

    contenedorInventario.appendChild(contenedorAcordeon);
}
