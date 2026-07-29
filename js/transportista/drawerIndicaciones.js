console.log("drawerIndicaciones cargado");

(function () {

    "use strict";

    window.renderIndicacionesDrawer = function (mudanza) {

        document.getElementById("drawerObservaciones").textContent =
            mudanza.observaciones ||
            "El cliente no ha añadido observaciones.";

    };

    console.log(typeof renderIndicacionesDrawer);

})();