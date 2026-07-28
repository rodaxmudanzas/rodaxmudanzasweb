(function () {

    "use strict";

    function verDetalleMudanza(id){

    // Buscar la mudanza en memoria
    const mudanza = state.disponibles.find(
        m => Number(m.id) === Number(id)
    );

    if(!mudanza){
        alert("No se ha encontrado la mudanza.");
        return;
    }

    abrirDrawer();

    renderRutaDrawer(mudanza);

    // Nº de reserva
    document.getElementById("drawerReserva").textContent =
        mudanza.numero_reserva || `RDX-26-${mudanza.id}`;

    // Fecha
    document.getElementById("drawerFecha").textContent =
        mudanza.fecha || "—";

    // Precio
    document.getElementById("drawerPrecio").innerHTML =
        `${mudanza.preciototal || "—"} <span class="text-xs font-normal">IVA incl.</span>`;

// Tipo de vivienda
document.getElementById("drawerVolumen").textContent =
    mudanza.volumen || "—";

    renderServiciosDrawer(mudanza);

// ===========================
// FOTOGRAFÍAS
// ===========================

const contenedorFotos = document.getElementById("drawerFotos");

contenedorFotos.innerHTML = "";

if (mudanza.urls_fotos) {

    const fotos = mudanza.urls_fotos
        .split(",")
        .map(f => f.trim())
        .filter(f => f !== "");

    if (fotos.length > 0) {

        fotos.forEach(url => {

            contenedorFotos.innerHTML += `
                <img
                    src="${url}"
                    class="rounded-xl border shadow-sm w-full h-36 object-cover cursor-pointer hover:scale-105 transition"
                    onclick="window.open('${url}','_blank')"
                >
            `;

        });

    } else {

        contenedorFotos.innerHTML = `
            <div class="text-slate-400 text-sm">
                No hay fotografías.
            </div>
        `;

    }

} else {

    contenedorFotos.innerHTML = `
        <div class="text-slate-400 text-sm">
            No hay fotografías.
        </div>
    `;

}

console.log("URLS FOTOS:");
console.log(mudanza.urls_fotos);
    // Observaciones
    document.getElementById("drawerObservaciones").textContent =
        mudanza.observaciones ||
        "El cliente no ha añadido observaciones.";
}

window.onload = verificarSesion;

function abrirDrawer(){

    document
        .getElementById("drawerOverlay")
        .classList.remove("hidden");

    document
        .getElementById("drawerMudanza")
        .classList.remove("translate-x-full");

}

function cerrarDrawer(){

    document
        .getElementById("drawerOverlay")
        .classList.add("hidden");

    document
        .getElementById("drawerMudanza")
        .classList.add("translate-x-full");

}

document
.getElementById("drawerOverlay")
.addEventListener("click",cerrarDrawer);

window.verDetalleMudanza = verDetalleMudanza;

})();