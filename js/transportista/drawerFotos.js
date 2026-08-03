// js/transportista/drawerFotos.js

function renderFotosDrawer(urlsFotosString) {
    const contenedorFotos = document.getElementById("drawerFotos");
    if (!contenedorFotos) return;

    contenedorFotos.innerHTML = ""; // Limpiar fotos previas

    if (!urlsFotosString || urlsFotosString.trim() === "") {
        contenedorFotos.innerHTML = `<div class="col-span-3 text-center text-gray-400 text-xs py-2 italic">El cliente no adjuntó fotografías.</div>`;
        return;
    }

    const arrayFotos = urlsFotosString.split(/,|\s*\|\s*/);
    
    // Grid Responsive: 3 columnas en móviles, 4 en pantallas más grandes
    const gridFotos = document.createElement("div");
    gridFotos.className = "grid grid-cols-3 sm:grid-cols-4 gap-2.5 w-full mt-2";

    arrayFotos.forEach(url => {
        const urlLimpia = url.trim();
        if (urlLimpia !== "") {
            gridFotos.innerHTML += `
                <div class="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm cursor-pointer group relative"
                     onclick="abrirVisorImagenRODAX('${urlLimpia}')">
                    <img src="${urlLimpia}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="Miniatura mueble">
                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg xmlns="http://w3.org" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
                    </div>
                </div>`;
        }
    });

    contenedorFotos.appendChild(gridFotos);

    // Inyectar el HTML del Visor Modal si no existe ya en la página
    if (!document.getElementById("rodaxFotoModal")) {
        const modalVisor = document.createElement("div");
        modalVisor.id = "rodaxFotoModal";
        // Diseño responsive centrado con fondo oscuro y efecto difuminado
        modalVisor.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 hidden opacity-0 transition-opacity duration-200";
        modalVisor.onclick = cerrarVisorImagenRODAX;
        modalVisor.innerHTML = `
            <button class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors" onclick="cerrarVisorImagenRODAX()">
                <svg xmlns="http://w3.org" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            </button>
            <div class="max-w-full max-h-full flex items-center justify-center" onclick="event.stopPropagation()">
                <img id="rodaxFotoModalImg" src="" class="max-w-[95vw] max-h-[85vh] md:max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10" alt="Foto ampliada">
            </div>
        `;
        document.body.appendChild(modalVisor);
    }
}

// Funciones globales para controlar la ampliación de imágenes
window.abrirVisorImagenRODAX = function(url) {
    const modal = document.getElementById("rodaxFotoModal");
    const img = document.getElementById("rodaxFotoModalImg");
    if (modal && img) {
        img.src = url;
        modal.classList.remove("hidden");
        setTimeout(() => modal.classList.remove("opacity-0"), 10);
    }
};

window.cerrarVisorImagenRODAX = function() {
    const modal = document.getElementById("rodaxFotoModal");
    if (modal) {
        modal.classList.add("opacity-0");
        setTimeout(() => modal.classList.add("hidden"), 200);
    }
};
