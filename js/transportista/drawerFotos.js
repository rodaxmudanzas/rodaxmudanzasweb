console.log("drawerFotos cargado");

(function () {

    "use strict";

    window.renderFotosDrawer = function (mudanza) {

        const contenedor = document.getElementById("drawerFotos");

        if (!contenedor) return;

        contenedor.innerHTML = "";

        let fotos = [];

        if (Array.isArray(mudanza.urls_fotos)) {

            fotos = mudanza.urls_fotos;

        } else if (typeof mudanza.urls_fotos === "string") {

            fotos = mudanza.urls_fotos
                .split(",")
                .map(f => f.trim())
                .filter(Boolean);

        }

        if (fotos.length === 0) {

            contenedor.innerHTML = `
                <div class="col-span-2 text-slate-400 text-sm italic">
                    No hay fotografías.
                </div>
            `;

            return;

        }

        fotos.forEach(url => {

            const img = document.createElement("img");

            img.src = url;

            img.className =
                "rounded-xl border shadow cursor-pointer hover:scale-105 transition";

            img.onclick = () => window.open(url, "_blank");

            contenedor.appendChild(img);

        });

    };

})();