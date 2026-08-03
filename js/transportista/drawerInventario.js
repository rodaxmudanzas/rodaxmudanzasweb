// js/transportista/drawerInventario.js

function renderInventarioDrawer(datosInventario) {
    const contenedorInventario = document.getElementById("drawerInventario");
    if (!contenedorInventario) return;

    contenedorInventario.innerHTML = ""; // Limpiar contenido previo

    let inventarioObjeto = datosInventario;

    // Si viene como una cadena de texto JSON desde Supabase, la transformamos en Objeto
    if (typeof inventarioObjeto === "string") {
        try {
            inventarioObjeto = JSON.parse(inventarioObjeto);
        } catch (e) {
            console.error("Error al transformar el JSON de inventario:", e);
            inventarioObjeto = null;
        }
    }

    // Validamos que sea un objeto válido y que contenga elementos
    if (inventarioObjeto && Object.keys(inventarioObjeto).length > 0) {
        let listaHtml = `<ul class="space-y-2 text-sm text-gray-700">`;
        
        for (const [mueble, cantidad] of Object.entries(inventarioObjeto)) {
            // Solo listamos los muebles cuya cantidad sea mayor a 0
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
    } else {
        contenedorInventario.innerHTML = `<p class="text-sm text-gray-400 italic">No se especificó inventario detallado.</p>`;
    }
}
