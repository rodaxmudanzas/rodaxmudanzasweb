/* ============================================================
   RODAX CORE EVENTS
   Carga del módulo de estadísticas de vehículos.
   ============================================================ */

(function () {
    "use strict";

    const src = "js/transportista/estadisticasVehiculo.js";

    if (document.querySelector(`script[src="${src}"]`)) {
        return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;

    document.head.appendChild(script);
})();
