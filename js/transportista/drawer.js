(function () {

    "use strict";

    function verDetalleMudanza(id){

        const mudanza = state.disponibles.find(m => Number(m.id) === Number(id)) || 
                        state.activas.find(m => Number(m.id) === Number(id));

        if(!mudanza){
            alert("No se ha encontrado la mudanza.");
            return;
        }

        abrirDrawer();

        // 1. Identificadores de cabecera
        document.getElementById("drawerIdTexto").textContent = mudanza.numero_reserva || `#RDX-26-${mudanza.id}`;
        
        const esMudanzaTotal = (mudanza.tipo_servicio || "").toLowerCase().includes("total");
        const badgeServicio = document.getElementById("drawerServicioBadge");
        
        if(esMudanzaTotal) {
            badgeServicio.textContent = "MUDANZA TOTAL";
            badgeServicio.className = "text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100";
        } else {
            badgeServicio.textContent = "MUDANZA ESTÁNDAR";
            badgeServicio.className = "text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100";
        }

        // 2. Extraer y formatear de forma limpia los Metros Cúbicos (m³)
        let textoM3 = "0.0 m³";
        if (mudanza.volumen) {
            const coincidencia = mudanza.volumen.match(/([0-9.,]+)\s*m³/i);
            if (coincidencia) {
                textoM3 = `${coincidencia[1].trim()} m³`;
            } else {
                textoM3 = mudanza.volumen; 
            }
        }
        
        // Inyectar m³ en color azul al lado de volumen/inventario
        document.getElementById("drawerM3Texto").textContent = textoM3;
        document.getElementById("drawerM3Badge").textContent = textoM3;
        document.getElementById("drawerVolumen").textContent = textoM3;

        // 3. Asignación de Datos Básicos de Ruta y Logística
        document.getElementById("drawerOrigenResumen").textContent = mudanza.origen || "—";
        document.getElementById("drawerDestinoResumen").textContent = mudanza.destino || "—";
        document.getElementById("drawerKm").textContent = mudanza.km ? `${mudanza.km} km` : "—";
        document.getElementById("drawerFecha").textContent = mudanza.fecha || "—";
        document.getElementById("drawerPrecio").innerHTML = `${mudanza.preciototal || "—"}`;
        
        document.getElementById("drawerObservaciones").textContent = mudanza.observaciones && mudanza.observaciones.trim() !== "" 
            ? mudanza.observaciones 
            : "Sin observaciones preliminares.";

        // 4. Procesar Separación de Accesos de Forma Segura
        if (mudanza.ascensor && mudanza.ascensor.includes('|')) {
            const partes = mudanza.ascensor.split('|');
            document.getElementById("drawerOrigenAcceso").textContent = partes[0].replace('Recogida:', '').trim();
            document.getElementById("drawerDestinoAcceso").textContent = partes[1].replace('Entrega:', '').trim();
        } else {
            document.getElementById("drawerOrigenAcceso").textContent = mudanza.ascensor || "C/ascensor";
            document.getElementById("drawerDestinoAcceso").textContent = "—";
        }

        // 5. Calcular Contador Total de Artículos Incluyendo Cajas
        let totalArticulos = 0;
        if (mudanza.inventario) {
            let invObj = typeof mudanza.inventario === "string" ? JSON.parse(mudanza.inventario) : mudanza.inventario;
            if (Array.isArray(invObj)) {
                totalArticulos = invObj.reduce((acc, item) => acc + (parseInt(item.cantidad, 10) || 0), 0);
            }
        }
        document.getElementById("drawerTotalArticulos").textContent = `${totalArticulos} artículos junto a`;

        // 6. Inyectar Servicios Contratados Dinámicos (Según Tipo de Mudanza)
        const contenedorServicios = document.getElementById("drawerServiciosLista");
        if(esMudanzaTotal) {
            contenedorServicios.innerHTML = `
                <div class="space-y-2 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 text-sm text-emerald-800 font-medium">
                    <p class="flex items-center gap-2">✔ Desmontaje Ilimitado</p>
                    <p class="flex items-center gap-2">✔ Montaje Ilimitado</p>
                    <p class="flex items-center gap-2">✔ Embalaje Ilimitado</p>
                    <p class="flex items-center gap-2">✔ Empaquetado y cajas Ilimitado</p>
                    <p class="flex items-center gap-2">✔ Seguro premium hasta 50.000€</p>
                    <p class="flex items-center gap-2">✔ Prioridad operativa</p>
                </div>
                <div class="text-xs text-slate-400 mt-2 p-1">Extras del cliente: ${mudanza.extras || 'Ninguno'}</div>`;
        } else {
            contenedorServicios.innerHTML = `
                <div class="space-y-2 bg-blue-50/40 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 font-medium">
                    <p class="flex items-center gap-2">✔ Transporte Estándar Básico</p>
                    <p class="text-xs text-slate-500 font-normal mt-1">Servicios adicionales seleccionados por el cliente:</p>
                    <p class="font-bold text-slate-700 mt-1">${mudanza.extras || 'Solo transporte básico'}</p>
                </div>`;
        }

        // 7. Ejecutar Renderizadores de Inventario y Fotos Duplicando en Paneles
        if (typeof renderInventarioDrawer === "function") {
            renderInventarioDrawer(mudanza.inventario);
        }
        if (typeof renderFotosDrawer === "function") {
            renderFotosDrawer(mudanza.urls_fotos);
        }

        // Llenar Pestaña Ruta Detallada e Indicaciones Operativas
        document.getElementById("drawerRutaDetalleContenedor").innerHTML = `
            <div class="bg-slate-50 p-4 rounded-xl border space-y-3 text-sm">
                <p><strong>Origen:</strong> ${mudanza.origen || "—"}</p>
                <p><strong>Destino:</strong> ${mudanza.destino || "—"}</p>
                <p><strong>Accesos:</strong> ${mudanza.ascensor || "—"}</p>
            </div>`;
        
        document.getElementById("drawerIndicacionesContenedor").textContent = mudanza.observaciones || "Sin indicaciones adicionales.";

        cambiarDrawerTab('resumen');
    }

    window.onload = verificarSesion;

    function abrirDrawer(){
        document.getElementById("drawerOverlay").classList.remove("hidden");
        document.getElementById("drawerMudanza").classList.remove("translate-x-full");
    }

    function cerrarDrawer(){
        document.getElementById("drawerOverlay").classList.add("hidden");
        document.getElementById("drawerMudanza").classList.add("translate-x-full");
    }

    // CONTROLADOR DE PESTAÑAS (Intercambia la visibilidad de los paneles)
    function cambiarDrawerTab(tabName) {
        const tabs = ['resumen', 'ruta', 'inventario', 'servicios', 'fotos', 'indicaciones'];
        
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-d-${t}`);
            const pane = document.getElementById(`pane-d-${t}`);
            
            if (btn) {
                if (t === tabName) {
                    btn.className = "px-3 py-3 text-xs font-semibold border-b-2 border-blue-600 text-blue-600 whitespace-nowrap transition-colors";
                } else {
                    btn.className = "px-3 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap transition-colors";
                }
            }
            
            if (pane) {
                if (t === tabName) {
                    pane.classList.remove("hidden");
                } else {
                    pane.classList.add("hidden");
                }
            }
        });
    }

    document.getElementById("drawerOverlay")?.addEventListener("click", cerrarDrawer);

    window.verDetalleMudanza = verDetalleMudanza;
    window.cambiarDrawerTab = cambiarDrawerTab;

})();
