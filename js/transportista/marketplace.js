/*
=========================================================
RODAX Marketplace
Módulo:
Trabajos disponibles
=========================================================
*/

window.Transportista = window.Transportista || {};

(function () {

    console.log("Marketplace cargado");

})();

async function cargarTrabajosDisponibles() {

    console.log("====================================");
    console.log("🔎 DIAGNÓSTICO TRABAJOS DISPONIBLES");
    console.log("Transportista:", currentUserId);

    // PRUEBA 1: intentar leer todas las mudanzas
    const { data: todas, error: errorTodas } = await dbClient
        .from('mudanzas')
        .select('*')
        .order('id', { ascending: false });

    console.log("PRUEBA 1 - Todas las mudanzas:", todas);
    console.log("PRUEBA 1 - Error:", errorTodas);

    // PRUEBA 2: solo por estado
    const { data: porEstado, error: errorEstado } = await dbClient
        .from('mudanzas')
        .select('*')
        .eq('estado', 'Pendiente de asignación')
        .order('id', { ascending: false });

    console.log("PRUEBA 2 - Pendiente de asignación:", porEstado);
    console.log("PRUEBA 2 - Error:", errorEstado);

    // PRUEBA 3: consulta completa del Marketplace
    const { data, error } = await dbClient
        .from('mudanzas')
        .select('*')
        .eq('estado', 'Pendiente de asignación')
        .eq('publicada_marketplace', true)
        .eq('bloqueada', false)
        .is('transportista_id', null)
        .order('id', { ascending: false });

    console.log("PRUEBA 3 - Marketplace:", data);
    console.log("PRUEBA 3 - Error:", error);
    console.log("====================================");

    if (error) {
        console.error(
            "❌ ERROR CARGANDO MARKETPLACE:",
            error.message,
            error.details,
            error.hint
        );

        state.disponibles = [];
        renderizarDisponibles();
        return;
    }

    state.disponibles = data || [];
    renderizarDisponibles();
}