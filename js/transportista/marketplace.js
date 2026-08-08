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

  function renderizarDisponibles() {
    const contenedor = document.getElementById('contenedor-disponibles');
    const badge = document.getElementById('badge-disponibles');
    
    if (badge) badge.textContent = state.disponibles.length;
    
    // Aquí está la línea corregida sin la letra 't':
    const elContadorBanner = document.getElementById('banner-contador-trabajos');
    if (elContadorBanner) elContadorBanner.textContent = state.disponibles.length;

    if (!contenedor) return;

    if (state.disponibles.length === 0) {
        contenedor.innerHTML = `
            <div class="col-span-1 lg:col-span-2 text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                <i data-lucide="satellite" class="w-14 h-14 text-gray-300 mx-auto mb-4"></i>
                <h4 class="text-xl font-bold text-gray-700 mb-2">Buscando nuevas rutas</h4>
                <p class="text-gray-400 font-medium text-sm">En cuanto un cliente reserve aparecerá aquí automáticamente.</p>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // 1. AGRUPACIÓN DE TRABAJOS POR FECHAS (Hoy, Mañana, Próximos)
    const gruposPorFecha = {};

    state.disponibles.forEach(t => {
        if (!t.fecha) return;
        
        const hoy = new Date();
        const mañana = new Date();
        mañana.setDate(hoy.getDate() + 1);

        const fechaT = new Date(t.fecha);
        let encabezadoFecha = t.fecha;

        const esMismoDia = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
        const opciones = { day: 'numeric', month: 'long' };
        const fechaFormateada = fechaT.toLocaleDateString('es-ES', opciones);

        if (esMismoDia(fechaT, hoy)) {
            encabezadoFecha = `Hoy • ${fechaFormateada}`;
        } else if (esMismoDia(fechaT, mañana)) {
            encabezadoFecha = `Mañana • ${fechaFormateada}`;
        } else {
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            encabezadoFecha = `${diasSemana[fechaT.getDay()]} • ${fechaFormateada}`;
        }

        if (!gruposPorFecha[encabezadoFecha]) {
            gruposPorFecha[encabezadoFecha] = [];
        }
        gruposPorFecha[encabezadoFecha].push(t);
    });

    // 2. GENERACIÓN DEL HTML EXACTO DE LA CAPTURA
    let htmlFinal = "";

    for (const [fechaTitulo, trabajos] of Object.entries(gruposPorFecha)) {
        // Barra separadora de días con el contador dinámico en azul
        htmlFinal += `
            <div class="col-span-1 lg:col-span-2 flex items-center gap-2.5 mt-6 mb-3 no-print">
                <span class="text-xs font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100/70 font-sans flex items-center gap-1.5">
                    <i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${fechaTitulo}
                </span>
                <span class="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">${trabajos.length} trabajos disponibles</span>
                <div class="flex-1 border-t border-slate-200/60"></div>
            </div>
        `;

        trabajos.forEach(t => {
            const esMudanzaTotal = (t.tipo_servicio || "").toLowerCase().includes("total");
            
            let horaServicio = "09:00"; 
            if(t.fecha && t.fecha.includes('T')) {
                horaServicio = t.fecha.split('T')[1].substring(0,5);
            }

            // Parsear inventario de Supabase para calcular bultos totales de forma dinámica
            let numArticulos = 0;
            let numFotos = 0;
            if (t.inventario) {
                let inv = typeof t.inventario === "string" ? JSON.parse(t.inventario) : t.inventario;
                if (Array.isArray(inv)) numArticulos = inv.reduce((acc, item) => acc + (parseInt(item.cantidad, 10) || 0), 0);
            }
            if (t.urls_fotos && t.urls_fotos.trim() !== "") {
                numFotos = t.urls_fotos.split(/,|\s*\|\s*/).filter(u => u.trim() !== "").length;
            }

            let m3Texto = "0.0 m³";
            if (t.volumen) {
                const matchM3 = t.volumen.match(/([0-9.,]+)\s*m³/i);
                m3Texto = matchM3 ? `${matchM3[0]}` : `${t.volumen} m³`;
            }

            const serviciosContratadosCount = esMudanzaTotal ? 6 : 1; 

            // Separación y limpieza de textos de accesos (Filtro 24h/6am integrado)
            let txtOrigAcceso = "C/ascensor";
            let txtDestAcceso = "C/ascensor";
            if (t.ascensor && t.ascensor.includes('|')) {
                const partes = t.ascensor.split('|');
                txtOrigAcceso = partes[0].replace('Recogida:', '').trim();
                txtDestAcceso = partes[1].replace('Entrega:', '').trim();
            } else if (t.ascensor) {
                txtOrigAcceso = t.ascensor;
            }

                        // Bloque de fecha lateral izquierdo
            const fechaObjeto = new Date(t.fecha);
            const diaNumero = fechaObjeto.getDate() || "21";
            const mesesCortos = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const mesTexto = mesesCortos[fechaObjeto.getMonth()] || 'JUL';

            // Estructura de Rejilla por Columnas (Alineación horizontal perfecta)
            htmlFinal += `
                <div onclick="verDetalleMudanza(${t.id})" class="tarjeta-mudanza-premium col-span-1 lg:col-span-2 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 relative group">
                    
                    <!-- COLUMNA 1: BLOQUE DE TIEMPO FIJO -->
                    <div class="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 min-w-[75px] flex-shrink-0 select-none">

                        <span class="text-3xl font-black text-slate-800 leading-none tracking-tight">${diaNumero}</span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">${mesTexto}</span>
                        <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mt-3.5 font-mono">${horaServicio}</span>
                    </div>

                    <!-- COLUMNA 2: LOGÍSTICA DE RECORRIDO (CENTRO DE LA TARJETA) -->
                    <div class="flex-1 space-y-3.5 w-full">
                        <div>
                            <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border tracking-wide font-sans ${esMudanzaTotal ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-blue-600 bg-blue-50 border-blue-100'}">
                                ${esMudanzaTotal ? 'MUDANZA TOTAL' : 'MUDANZA ESTÁNDAR'}
                            </span>
                        </div>
                        
                        <!-- Distribución de Ruta Horizontal con Línea central -->
                        <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-3 relative w-full">
                            <!-- Origen -->
                            <div class="space-y-0.5 text-left">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Origen</span>
                                <p class="text-sm font-bold text-slate-800 leading-tight truncate max-w-[180px]" title="${t.origen}">${t.origen || '—'}</p>
                                <p class="text-xs text-slate-400 font-medium">${txtOrigAcceso}</p>
                            </div>
                            
                            <!-- Indicador de carretera central punteado -->
                            <div class="hidden md:flex flex-col items-center justify-center text-center px-1">
                                <span class="text-xs font-bold text-slate-600 font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.2 rounded mb-0.5">${t.km || '?'} km</span>
                                <div class="w-full flex items-center justify-center relative">
                                    <div class="w-full border-t border-dashed border-slate-300"></div>
                                    <div class="absolute bg-white px-1.5 text-slate-400">
                                        <i data-lucide="truck" class="w-3.5 h-3.5 text-blue-500"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Destino -->
                            <div class="space-y-0.5 text-left md:text-right">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destino</span>
                                <p class="text-sm font-bold text-slate-800 leading-tight truncate max-w-[180px] md:ml-auto" title="${t.destino}">${t.destino || '—'}</p>
                                <p class="text-xs text-red-500 font-bold">${txtDestAcceso}</p>
                            </div>
                        </div>

                                                <!-- Barra de contadores inferiores -->
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-50 text-xs text-slate-500 font-medium">
                            <span class="flex items-center gap-1.5"><i data-lucide="box" class="w-3.5 h-3.5 text-slate-400"></i> <strong>${numArticulos}</strong> artículos</span>
                            <span class="flex items-center gap-1.5"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-400"></i> <strong>${serviciosContratadosCount}</strong> servicios</span>
                            <span class="flex items-center gap-1.5"><i data-lucide="image" class="w-3.5 h-3.5 text-slate-400"></i> <strong>${numFotos}</strong> fotos</span>
                            <span class="flex items-center gap-1.5"><i data-lucide="message-square" class="w-3.5 h-3.5 text-slate-400"></i> Observaciones</span>
                        </div>
                    </div>

                    <!-- COLUMNA 3: OPERARIOS Y CARGA -->
                    <div class="flex flex-row md:flex-col justify-between md:justify-center items-start md:items-end gap-1.5 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 min-w-[120px] flex-shrink-0 w-full md:w-auto">
                        <div class="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i>
                            <span>2 operarios</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <i data-lucide="package-open" class="w-3.5 h-3.5 text-slate-400"></i>
                            <span>${m3Texto}</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium font-mono">
                            <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-300"></i>
                            <span>6h estimadas</span>
                        </div>
                    </div>

                    <!-- COLUMNA 4: SECCIÓN DE COBRO NETO -->
                    <div class="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 min-w-[110px] flex-shrink-0 text-right w-full md:w-auto">
                        <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 hidden md:block">TU COBRO</span>
                        <div class="flex items-baseline gap-0.5">
                            <span class="text-xl font-black text-blue-600 tracking-tight leading-none">${t.preciototal || '—'}</span>
                            <span class="text-[9px] font-bold text-slate-400">IVA incl.</span>
                        </div>
                        <span class="inline-block text-[10px] font-bold text-blue-600 bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded mt-2 font-sans select-none">Pago en 48h</span>
                    </div>
                    
                    <!-- Icono de flecha para la acción de click -->
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-500 transition-colors hidden lg:block">
                        <svg xmlns="http://w3.org" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>

                </div>
            `;
        });
    }

    contenedor.innerHTML = htmlFinal;
    if (window.lucide) lucide.createIcons();
}

async function procesarAceptacion(id) {
    modalContent.innerHTML = `
        <i data-lucide="loader-2" class="w-10 h-10 animate-spin mx-auto text-blue-600 mb-3"></i>
        <p class="text-gray-600 font-medium text-sm">Asignando mudanza...</p>`;
    lucide.createIcons();

    console.log("Intentando aceptar mudanza:", id);
    console.log("Transportista:", currentUserId);

    const { data, error } = await dbClient
        .from('mudanzas')
        .update({
            estado: 'Transportista asignado',
            transportista_id: currentUserId,
            bloqueada: true,
            fecha_asignacion: new Date().toISOString()
        })
        .eq('id', id)
        .eq('estado', 'Pendiente de asignación')
        .eq('publicada_marketplace', true)
        .eq('bloqueada', false)
        .is('transportista_id', null)
        .select();

    console.log("Resultado aceptación:", data);
    console.log("Error aceptación:", error);

    if (error) {
        console.error("Error al aceptar:", error);

        alert(
            'No se pudo asignar la mudanza.\n\n' +
            'Puede que otro transportista la haya aceptado antes.'
        );

        cerrarModal();
        await cargarTrabajosDisponibles();
        return;
    }

    if (!data || data.length === 0) {
        alert(
            'Esta mudanza ya no está disponible.\n\n' +
            'Es posible que otro transportista la haya aceptado.'
        );

        cerrarModal();
        await cargarTrabajosDisponibles();
        return;
    }

    console.log("Mudanza asignada correctamente:", data[0]);

    await Promise.all([
        cargarTrabajosDisponibles(),
        cargarMisMudanzas()
    ]);

        cerrarModal();
    cambiarTab('mis-mudanzas');
}