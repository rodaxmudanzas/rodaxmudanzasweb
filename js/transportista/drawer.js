(function () {

    "use strict";

    function verDetalleMudanza(id){

        // Buscar la mudanza en memoria
        const mudanza = state.disponibles.find(
            m => Number(m.id) === Number(id)
        ) || state.activas.find(
            m => Number(m.id) === Number(id)
        );

        console.log("=========== MUDANZA COMPLETA ===========");
        console.log(mudanza);
        console.log("========================================");

        if(!mudanza){
            alert("No se ha encontrado la mudanza.");
            return;
        }

        abrirDrawer();

        // 1. Rellenar ID, Badges y Datos Fijos de la Cabecera
        document.getElementById("drawerIdTexto").textContent = mudanza.numero_reserva || `#RDX-26-${mudanza.id}`;
        document.getElementById("drawerServicioBadge").textContent = (mudanza.tipo_servicio || "MUDANZA ESTÁNDAR").toUpperCase();

        // 2. Direcciones de la Ruta (Línea de tiempo)
        document.getElementById("drawerOrigen").textContent = mudanza.origen || "—";
        document.getElementById("drawerDestino").textContent = mudanza.destino || "—";

        // 3. Separación inteligente de los accesos (Origen | Destino) sin errores de sintaxis
        if (mudanza.ascensor && mudanza.ascensor.includes('|')) {
            const partesAccesos = mudanza.ascensor.split('|');
            document.getElementById("drawerOrigenAcceso").textContent = partesAccesos[0].replace('Recogida:', '').trim();
            document.getElementById("drawerDestinoAcceso").textContent = partesAccesos[1].replace('Entrega:', '').trim();
        } else {
            document.getElementById("drawerOrigenAcceso").textContent = mudanza.ascensor || "C/ascensor";
            document.getElementById("drawerDestinoAcceso").textContent = "—";
        }

        // 4. Bloques de Logística (Distancia y Volumen)
        document.getElementById("drawerKm").textContent = mudanza.km ? `${mudanza.km} km` : "—";
        document.getElementById("drawerVolumen").textContent = mudanza.volumen || "—";

        // 5. Servicios Contratados (Extras)
        document.getElementById("drawerExtras").textContent = mudanza.extras || "Solo transporte básico";

        // 6. Observaciones
        document.getElementById("drawerObservaciones").textContent = mudanza.observaciones && mudanza.observaciones.trim() !== "" 
            ? mudanza.observaciones 
            : "Sin observaciones.";

        // 7. Precios y Cobros (Tu Cobro)
        document.getElementById("drawerPrecio").innerHTML = `${mudanza.preciototal || "—"}`;

        // 8. Contador de artículos en el título de Inventario
        let totalArticulos = 0;
        if (mudanza.inventario) {
            let invObj = typeof mudanza.inventario === "string" ? JSON.parse(mudanza.inventario) : mudanza.inventario;
            if (Array.isArray(invObj)) {
                totalArticulos = invObj.reduce((acc, item) => acc + (parseInt(item.cantidad, 10) || 0), 0);
            }
        }
        document.getElementById("drawerTotalArticulos").textContent = totalArticulos;

        // 9. Ejecutar los renderizadores externos de Inventario y Fotografías
        if (typeof renderInventarioDrawer === "function") {
            renderInventarioDrawer(mudanza.inventario);
        }
        if (typeof renderFotosDrawer === "function") {
            renderFotosDrawer(mudanza.urls_fotos);
        }

        // Obligar a que el Drawer siempre se abra en la pestaña 'Resumen'
        cambiarDrawerTab('resumen');
    }

    window.onload = verificarSesion;

    function abrirDrawer(){
        document
            .getElementById("drawerOverlay")
            .classList.remove("hidden");

        document
            .getElementById("drawerMudanza")
            .classList.remove("translate-x-full");
    }

    function cerrarDrawer(){
        document
            .getElementById("drawerOverlay")
            .classList.add("hidden");

        document
            .getElementById("drawerMudanza")
            .classList.add("translate-x-full");
    }

    // CONTROLADOR DE PESTAÑAS (Maneja el color visual de los botones)
    function cambiarDrawerTab(tabName) {
        const tabs = ['resumen', 'ruta', 'inventario', 'servicios', 'fotos', 'indicaciones'];
        
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-d-${t}`);
            if (!btn) return;
            
            if (t === tabName) {
                // Pestaña Activa: Texto azul y línea azul inferior
                btn.className = "px-3 py-3 text-xs font-semibold border-b-2 border-blue-600 text-blue-600 whitespace-nowrap transition-colors";
            } else {
                // Pestaña Inactiva: Texto gris sin línea
                btn.className = "px-3 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap transition-colors";
            }
        });

        console.log(`Pestaña del detalle cambiada a: ${tabName}`);
    }

    // Escuchadores de eventos globales
    document
        .getElementById("drawerOverlay")
        .addEventListener("click", cerrarDrawer);

    window.verDetalleMudanza = verDetalleMudanza;
    window.cambiarDrawerTab = cambiarDrawerTab;

})();
