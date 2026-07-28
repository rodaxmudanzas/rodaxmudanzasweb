(function () {

    "use strict";

    window.renderRutaDrawer = function (mudanza) {

        document.getElementById("drawerOrigen").textContent =
            mudanza.origen || "—";

        document.getElementById("drawerDestino").textContent =
            mudanza.destino || "—";

        document.getElementById("drawerKm").textContent =
            (mudanza.km || "—") + " km";

        const accesos = (mudanza.ascensor || "").split("|");

const recogida = accesos[0]?.trim() || "—";

const entrega = accesos[1]?.trim() || "—";

document.getElementById("drawerAscensor").innerHTML = `
<div class="flex flex-col gap-2">

    <div>

        <span class="font-semibold text-slate-700">
            Recogida:
        </span>

        ${recogida}

    </div>

    <div class="border-l-2 border-blue-200 pl-3">

        <span class="font-semibold text-slate-700">
            Entrega:
        </span>

        ${entrega}

    </div>

</div>
`;

    };

})();