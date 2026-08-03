// js/transportista/drawerInventario.js

function renderInventarioDrawer(datosInventario) {
    const contenedorInventario = document.getElementById("drawerInventario");
    if (!contenedorInventario) return;

    contenedorInventario.innerHTML = ""; // Limpiar contenido previo

    let inventarioObjeto = datosInventario;

    // 1. Si viene como texto JSON de Supabase, lo transformamos a un Array/Objeto real
    if (typeof inventarioObjeto === "string") {
        try {
            inventarioObjeto = JSON.parse(inventarioObjeto);
        } catch (e) {
            console.error("Error al transformar el JSON de inventario:", e);
            inventarioObjeto = null;
        }
    }

    // 2. Comprobamos si es un Array válido (la estructura que muestra tu consola)
    if (Array.isArray(inventarioObjeto) && inventarioObjeto.length > 0) {
        let listaHtml = `<ul class="space-y-2 text-sm text-gray-700">`;
        let tieneElementos = false;

        // Recorremos el array elemento por elemento
        inventarioObjeto.forEach(item => {
            // Extraemos el nombre y la cantidad de cada mueble cuidando mayúsculas/minúsculas
            const nombreMueble = item.nombre || item.mueble || "Mueble sin nombre";
            const cantidad = parseInt(item.cantidad, 10) || 0;

            // Solo mostramos en la lista si el cliente seleccionó al menos 1 unidad
            if (cantidad > 0) {
                tieneElementos = true;
                listaHtml += `
                    <li class="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                        <span class="font-medium text-gray-800">${nombreMueble}</span>
                        <span class="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">x${cantidad}</span>
                    </li>`;
            }
        });

        listaHtml += `</ul>`;

        // Si el array tenía muebles pero todos con cantidad 0, ponemos el aviso
        if (tieneElementos) {
            contenedorInventario.innerHTML = listaHtml;
        } else {
            contenedorInventario.innerHTML = `<p class="text-sm text-gray-400 italic">No se especificó inventario detallado.</p>`;
        }

    } 
    // 3. Soporte por si acaso en el futuro vuelve a llegar como Objeto plano en lugar de Array
    else if (inventarioObjeto && typeof inventarioObjeto === "object" && Object.keys(inventarioObjeto).length > 0) {
        let listaHtml = `<ul class="space-y-2 text-sm text-gray-700">`;
        for (const [mueble, cantidad] of Object.entries(inventarioObjeto)) {
            if (cantidad > 0) {
                listaHtml += `
                    <li class="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                        <span class="font-medium text-gray-800">${mueble}</span>
                        <span class="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">x${cantidad}</span>
                    </li>`;
            }
        }
        listaHtml += `</ul>`;
        contenedorInventario.innerHTML = listaHtml;
    } 
    // 4. Si viene completamente vacío
    else {
        contenedorInventario.innerHTML = `<p class="text-sm text-gray-400 italic">No se especificó inventario detallado.</p>`;
    }
}
