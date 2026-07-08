const ESTADOS_RESERVA = {

    PENDIENTE_PAGO: {
        codigo: "pendiente_pago",
        titulo: "Pendiente de pago",
        color: "#f59e0b",
        progreso: 10
    },

    PAGO_CONFIRMADO: {
        codigo: "pago_confirmado",
        titulo: "Pago confirmado",
        color: "#22c55e",
        progreso: 25
    },

    PENDIENTE_ASIGNACION: {
        codigo: "pendiente_asignacion",
        titulo: "Pendiente de asignación",
        color: "#3b82f6",
        progreso: 40
    },

    TRANSPORTISTA_ASIGNADO: {
        codigo: "transportista_asignado",
        titulo: "Transportista asignado",
        color: "#8b5cf6",
        progreso: 60
    },

    EN_RUTA: {
        codigo: "en_ruta",
        titulo: "En ruta",
        color: "#0ea5e9",
        progreso: 80
    },

    FINALIZADA: {
        codigo: "finalizada",
        titulo: "Mudanza finalizada",
        color: "#16a34a",
        progreso: 100
    }

};

window.ESTADOS_RESERVA = ESTADOS_RESERVA;