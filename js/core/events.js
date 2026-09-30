/* ============================================================
   RODAX CORE EVENTS
   Carga de módulos globales del panel.
   ============================================================ */

(function () {
    "use strict";

    const scripts = [
        "js/transportista/estadisticasVehiculo.js",
        "js/transportista/configuracionNotificaciones.js"
    ];

    scripts.forEach(src => {
        if (document.querySelector(`script[src="${src}"]`)) {
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.defer = true;
        document.head.appendChild(script);
    });
})();
