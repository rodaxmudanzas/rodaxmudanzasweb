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

        document.getElementById("estado").textContent =
            datos.estado || "";

        document.getElementById("nombre").textContent =
            datos.nombre || "";

        const fecha = new Date(datos.fecha);

document.getElementById("fecha").textContent =
    fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

        document.getElementById("origen").textContent =
            datos.origen || "";

        document.getElementById("destino").textContent =
            datos.destino || "";

        document.getElementById("importeTotal").textContent =
            datos.importe_total + " €";

        document.getElementById("importeReserva").textContent =
            datos.importe_reserva + " €";

        document.getElementById("importePendiente").textContent =
    datos.importe_restante + " €";

renderEstadoReserva(

    document.getElementById("estadoReserva"),

    datos.estado

);

} catch (err) {

    console.error(err);

    document.getElementById("numeroReserva").textContent =
        err.message;

}

}

document.addEventListener("DOMContentLoaded", cargarReserva);