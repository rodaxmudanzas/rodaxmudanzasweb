// js/transportista/drawerFotos.js

function renderFotosDrawer(urlsFotosString) {
    const contenedorResumen = document.getElementById("drawerFotos");
    const contenedorFull = document.getElementById("drawerFotosFull");
    
    if (!contenedorResumen || !contenedorFull) return;

    contenedorResumen.innerHTML = "";
    contenedorFull.innerHTML = "";

    if (!urlsFotosString || urlsFotosString.trim() === "") {
        const msg = `<div class="text-center text-gray-400 text-xs py-2 italic">Sin fotografías adjuntas.</div>`;
        contenedorResumen.innerHTML = msg;
        contenedorFull.innerHTML = msg;
        return;
    }

    const arrayFotos = urlsFotosString.split(/,|\s*\|\s*/);
    let htmlGrid = `<div class="grid grid-cols-4 gap-2 w-full mt-1">`;

    arrayFotos.forEach(url => {
        const urlLimpia = url.trim();
        if (urlLimpia !== "") {
            htmlGrid += `
                <div class="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group relative" onclick="abrirVisorImagenRODAX('${urlLimpia}')">
                    <img src="${urlLimpia}" class="w-full h-full object-cover" alt="Miniatura">
                </div>`;
        }
    });
    htmlGrid += `</div>`;

    contenedorResumen.innerHTML = htmlGrid;
    contenedorFull.innerHTML = htmlGrid;
}
