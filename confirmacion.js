async function cargarReserva() {

    try {

        const params = new URLSearchParams(window.location.search);

const sessionId = params.get("session_id");

if (!sessionId) {

    document.getElementById("numeroReserva").textContent =
        "No se recibió el identificador del pago.";

    return;

}

       const res = await fetch(
    `/api/obtener-reserva?session_id=${encodeURIComponent(sessionId)}`
);

        const datos = await res.json();

        if (!res.ok) {

            throw new Error(datos.error || "No se pudo obtener la reserva.");

        }

        document.getElementById("numeroReserva").textContent =
            datos.numero_reserva || "";

            const estado = document.getElementById("estado");

            const iconosEstado = {

    "Pendiente de asignación":"🟢",

    "Transportista asignado":"🔵",

    "En curso":"🟠",

    "Finalizada":"⚪"

};

estado.textContent =
`${iconosEstado[datos.estado] || "⚪"} ${datos.estado}`;

switch (datos.estado) {

    case "Pendiente de asignación":

        estado.className =
        "font-bold text-green-600";

        break;

    case "Transportista asignado":

        estado.className =
        "font-bold text-blue-600";

        break;

    case "En curso":

        estado.className =
        "font-bold text-orange-500";

        break;

    case "Finalizada":

        estado.className =
        "font-bold text-gray-600";

        break;

    default:

        estado.className =
        "font-bold";

}

        document.getElementById("nombre").textContent =
            datos.nombre || "";

        const fecha = new Date(datos.fecha);

document.getElementById("fecha").textContent =
fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
});

               // Construir la ruta de forma segura.
        // Origen y destino se insertan como texto, nunca como HTML.
        const ruta = document.getElementById("ruta");

        ruta.replaceChildren();

        const columnaRuta = document.createElement("div");
        columnaRuta.className = "flex flex-col";

        const origen = document.createElement("div");
        origen.className = "font-semibold";
        origen.textContent = `📍 ${datos.origen || ""}`;

        const separador = document.createElement("div");
        separador.className = "flex justify-center items-center py-3";

        const flecha = document.createElement("span");
        flecha.className = "text-blue-600 text-5xl leading-none";
        flecha.textContent = "↓";

        const destino = document.createElement("div");
        destino.className = "font-semibold";
        destino.textContent = `📍 ${datos.destino || ""}`;

        separador.appendChild(flecha);

        columnaRuta.append(
            origen,
            separador,
            destino
        );

        ruta.appendChild(columnaRuta);

        document.getElementById("importeTotal").textContent =
Number(datos.importe_total).toLocaleString("es-ES",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
}) + " €";

        document.getElementById("importeReserva").textContent =
Number(datos.importe_reserva).toLocaleString("es-ES",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
}) + " €";

        document.getElementById("importePendiente").textContent =
    Number(datos.importe_restante)
.toLocaleString("es-ES", {

minimumFractionDigits:2,

maximumFractionDigits:2

}) + " €";

} catch (err) {

    console.error(err);

    document.getElementById("numeroReserva").textContent =
        err.message;

}

}

document.addEventListener("DOMContentLoaded", cargarReserva);