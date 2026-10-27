(function () {

    "use strict";

    function renderIndicacionesDrawer(mudanza) {

        const texto =
            mudanza?.observaciones ||
            "El cliente no ha añadido observaciones.";

        const resumen =
            document.getElementById("drawerObservaciones");

        if (resumen) {
            resumen.textContent = texto;
        }

        const contenedor =
            document.getElementById(
                "drawerIndicacionesContenedor"
            );

        if (contenedor) {
            contenedor.textContent = texto;
        }
    }

    window.renderIndicacionesDrawer =
        renderIndicacionesDrawer;

    console.log(
        "✅ Drawer Indicaciones cargado correctamente"
    );

})();
