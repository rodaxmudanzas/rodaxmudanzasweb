(function () {

function renderEstadoReserva(contenedor, estadoCodigo) {

    if (!window.ESTADOS_RESERVA) return;

    const estado = Object.values(window.ESTADOS_RESERVA)

        .find(e => e.codigo === estadoCodigo);

    if (!estado) return;

    contenedor.innerHTML = `

<div class="bg-white rounded-2xl shadow-lg p-6">

    <div class="flex justify-between items-center mb-4">

        <div>

            <div class="text-sm text-gray-500">
                Estado de la reserva
            </div>

            <div
                class="text-xl font-bold"
                style="color:${estado.color};">

                ${estado.titulo}

            </div>

        </div>

        <div
            class="text-3xl">

            🚚

        </div>

    </div>

    <div
        class="w-full bg-gray-200 rounded-full h-4">

        <div

            class="h-4 rounded-full transition-all duration-700"

            style="width:${estado.progreso}%;
                   background:${estado.color};">

        </div>

    </div>

    <div
        class="mt-3 text-right text-sm text-gray-600">

        ${estado.progreso}% completado

    </div>

</div>

`;

}

window.renderEstadoReserva =
renderEstadoReserva;

})();