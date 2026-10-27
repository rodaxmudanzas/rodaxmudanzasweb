// Permisos y reglas de negocio del Área Administración.
// La carpeta empieza por "_" para que Vercel no la publique como endpoint.

const ESTADOS = {
    PENDIENTE_PAGO: "Pendiente de pago",
    PENDIENTE_ASIGNACION: "Pendiente de asignación",
    ASIGNADO: "Transportista asignado",
    COMPLETADA: "Completada",
    CANCELADA_CLIENTE: "Cancelada por cliente"
};

const PERMISOS_POR_ROL = {

    superadmin: ["*"],

    operaciones: [
        "leer_expedientes",
        "leer_transportistas",
        "leer_solicitudes",
        "leer_auditoria",
        "asignar",
        "completar",
        "editar_expediente",
        "nota",
        "resolver_solicitud"
    ],

    finanzas: [
        "leer_expedientes",
        "leer_finanzas",
        "leer_solicitudes",
        "leer_auditoria",
        "nota"
    ],

    soporte: [
        "leer_expedientes",
        "leer_solicitudes",
        "nota",
        "resolver_solicitud"
    ]
};

function permisosDe(rol) {
    return PERMISOS_POR_ROL[rol] || [];
}

function tienePermiso(rol, permiso) {
    const lista = permisosDe(rol);
    return lista.includes("*") || lista.includes(permiso);
}

// Estados desde los que se puede pasar cada estado de una solicitud
// de modificación. "rechazada" y "aplicada" son finales.
const TRANSICIONES_SOLICITUD = {
    pendiente: ["en_revision", "aprobada", "rechazada"],
    en_revision: ["aprobada", "rechazada"],
    aprobada: ["aplicada"],
    rechazada: [],
    aplicada: []
};

function transicionSolicitudValida(desde, hacia) {
    return (TRANSICIONES_SOLICITUD[desde] || []).includes(hacia);
}

module.exports = {
    ESTADOS,
    PERMISOS_POR_ROL,
    TRANSICIONES_SOLICITUD,
    permisosDe,
    tienePermiso,
    transicionSolicitudValida
};
