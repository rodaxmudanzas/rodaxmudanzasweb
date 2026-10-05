/*
 * RODAX MUDANZAS — Contacto bilateral protegido
 *
 * Regla única de seguridad:
 * - Cliente y transportista NO ven el contacto de la contraparte antes de las 06:00.
 * - Solo se libera a partir de las 06:00 del mismo día del servicio.
 * - La autorización real la hace Supabase mediante obtener_contacto_contraparte().
 */

window.RODAX_CONTACTO = window.RODAX_CONTACTO || {};

window.RODAX_CONTACTO.obtener = async function (mudanzaId, supabaseClient) {
    if (!mudanzaId || !supabaseClient?.rpc) {
        return {
            visible: false,
            motivo: 'parametros_invalidos'
        };
    }

    const { data, error } = await supabaseClient.rpc(
        'obtener_contacto_contraparte',
        { p_mudanza_id: Number(mudanzaId) }
    );

    if (error) {
        console.error('RODAX contacto contraparte:', error);
        return {
            visible: false,
            motivo: 'error_seguridad',
            error
        };
    }

    return data || {
        visible: false,
        motivo: 'sin_respuesta'
    };
};

window.RODAX_CONTACTO.mensajeBloqueo = function (respuesta) {
    switch (respuesta?.motivo) {
        case 'bloqueado_hasta_las_06':
            return 'Los datos de contacto de la otra parte estarán disponibles el mismo día del servicio a partir de las 06:00.';
        case 'no_es_el_dia_del_servicio':
            return 'Los datos de contacto de la otra parte se habilitarán el mismo día del servicio a partir de las 06:00.';
        case 'sin_transportista_asignado':
            return 'Los datos del transportista estarán disponibles cuando el servicio tenga transportista asignado.';
        case 'servicio_no_activo':
            return 'Los datos de contacto no están disponibles porque el servicio ya no está activo.';
        case 'sin_acceso':
            return 'No tienes autorización para consultar estos datos.';
        default:
            return 'Los datos de contacto están protegidos y se mostrarán cuando corresponda.';
    }
};
