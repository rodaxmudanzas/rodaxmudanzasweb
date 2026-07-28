(function () {

    "use strict";

    window.renderServiciosDrawer = function (mudanza) {

        // Tipo de servicio
        document.getElementById("drawerServicio").textContent =
            mudanza.tipo_servicio || "—";

        // Extras

        if (mudanza.tipo_servicio === "Mudanza Total") {

            document.getElementById("drawerExtras").innerHTML = `
                ✓ Desmontaje ilimitado<br>
                ✓ Montaje ilimitado<br>
                ✓ Embalaje ilimitado<br>
                ✓ Empaquetado ilimitado<br>
                ✓ Cajas incluidas<br>
                ✓ Seguro Premium
            `;

        }

        else {

            document.getElementById("drawerExtras").textContent =
                mudanza.extras || "Solo transporte básico";

        }

    };

})();