(function () {

    "use strict";

    window.renderFotosDrawer = function (mudanza) {

        const contenedor = document.getElementById("drawerFotos");

        contenedor.innerHTML = "";

        if (!mudanza.urls_fotos) {

            contenedor.innerHTML = `
                <div class="text-slate-400 text-sm">
                    No hay fotografías.
                </div>
            `;

            return;

        }

        const fotos = mudanza.urls_fotos
            .split(",")
            .map(f => f.trim())
            .filter(Boolean);

        if (!fotos.length) {

            contenedor.innerHTML = `
                <div class="text-slate-400 text-sm">
                    No hay fotografías.
                </div>
            `;

            return;

        }

        fotos.forEach(url => {

            contenedor.innerHTML += `
                <img
                    src="${url}"
                    class="rounded-xl border shadow-sm w-full h-36 object-cover cursor-pointer hover:scale-105 transition"
                    onclick="window.open('${url}','_blank')"
                >
            `;

        });

    };

})();