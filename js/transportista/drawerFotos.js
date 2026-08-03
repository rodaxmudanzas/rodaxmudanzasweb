// js/transportista/drawerFotos.js

function renderFotosDrawer(urlsFotosString) {
    const contenedorFotos = document.getElementById("drawerFotos");
    if (!contenedorFotos) return;

    contenedorFotos.innerHTML = ""; // Limpiar fotos de cargas previas

    if (urlsFotosString && urlsFotosString.trim() !== "") {
        // Separamos las URLs ya vengan unidas por comas (,) o por barras ( | )
        const arrayFotos = urlsFotosString.split(/,|\s*\|\s*/);
        
        arrayFotos.forEach(url => {
            const urlLimpia = url.trim();
            if (urlLimpia !== "") {
                contenedorFotos.innerHTML += `
                    <a href="${urlLimpia}" target="_blank" class="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm block group relative">
                        <img src="${urlLimpia}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Foto de inventario">
                        <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <i data-lucide="eye" class="text-white w-4 h-4"></i>
                        </div>
                    </a>`;
            }
        });
    } else {
        // Si no hay fotos, mostramos el aviso centrado abarcando las 2 columnas del grid
        contenedorFotos.innerHTML = `<div class="col-span-2 text-center text-gray-400 text-xs py-2 italic">El cliente no adjuntó fotografías.</div>`;
    }

    if (window.lucide) window.lucide.createIcons();
}
