(function () {

    "use strict";

    window.renderRutaDrawer = function (mudanza) {

        document.getElementById("drawerOrigen").textContent =
            mudanza.origen || "—";

        document.getElementById("drawerDestino").textContent =
            mudanza.destino || "—";

        document.getElementById("drawerKm").textContent =
            (mudanza.km || "—") + " km";

        document.getElementById("drawerAscensor").textContent =
            mudanza.ascensor || "—";

    };

})();