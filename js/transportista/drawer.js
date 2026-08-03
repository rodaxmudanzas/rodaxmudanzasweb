(function () {

    "use strict";

    function verDetalleMudanza(id){

        // Buscar la mudanza en memoria
        const mudanza = state.disponibles.find(
            m => Number(m.id) === Number(id)
        );

        console.log("=========== MUDANZA COMPLETA ===========");
        console.log(mudanza);
        console.table(mudanza);
        console.log("========================================");

        if(!mudanza){
            alert("No se ha encontrado la mudanza.");
            return;
        }

        abrirDrawer();

        renderRutaDrawer(mudanza);

        // ==========================================
        // 🛠️ PASO 3: ADAPTAR VARIABLES AL NUEVO DISEÑO
        // ==========================================
        // ID de reserva y Badge del tipo de servicio
        document.getElementById("drawerIdTexto").textContent = mudanza.numero_reserva || `#RDX-26-${mudanza.id}`;
        document.getElementById("drawerServicioBadge").textContent = (mudanza.tipo_servicio || "MUDANZA ESTÁNDAR").toUpperCase();

        // Separación inteligente de los accesos (Origen | Destino)
        if (mudanza.ascensor && mudanza.ascensor.includes('|')) {
            const partesAccesos = mudanza.ascensor.split('|');
            document.getElementById("drawerOrigenAcceso").textContent = partesAccesos[0].replace('Recogida:', '').trim();
            document.getElementById("drawerDestinoAcceso").textContent = partesAccesos[1].replace('Entrega:', '').trim();
        } else {
            document.getElementById("drawerOrigenAcceso").textContent = mudanza.ascensor || "C/ascensor";
            document.getElementById("drawerDestinoAcceso").textContent = "—";
        }

        // Fecha
        document.getElementById("drawerFecha").textContent =
            mudanza.fecha || "—";

        // Precio
        document.getElementById("drawerPrecio").innerHTML =
            `${mudanza.preciototal || "—"} <span class="text-xs font-normal">IVA incl.</span>`;

        // Tipo de vivienda
        document.getElementById("drawerVolumen").textContent =
            mudanza.volumen || "—";

        renderServiciosDrawer(mudanza);

        console.log("ANTES DE ENVIAR A INVENTARIO");
        console.log(mudanza);

        console.log("inventario:");
        console.log(mudanza.inventario);

        console.log("urls_fotos:");
        console.log(mudanza.urls_fotos);

        // Envío de propiedades específicas a los renderizadores
        renderInventarioDrawer(mudanza.inventario);

        renderFotosDrawer(mudanza.urls_fotos);

        renderIndicacionesDrawer(mudanza);

        console.log("URLS FOTOS:");
        console.log(mudanza.urls_fotos);

        // Resetear la pestaña activa visualmente a 'Resumen' cada vez que abres una mudanza
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

    // ========================================================
    // 🛠️ PASO 2: CONTROLADOR DE PESTAÑAS (DENTRO DEL CONTENEDOR)
    // ========================================================
    function cambiarDrawerTab(tabName) {
        const tabs = ['resumen', 'ruta', 'inventario', 'servicios', 'fotos', 'indicaciones'];
        
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-d-${t}`);
            if (!btn) return;
            
            if (t === tabName) {
                // Estilos activos (Azul)
                btn.className = "px-3 py-3 text-xs font-semibold border-b-2 border-blue-600 text-blue-600 whitespace-nowrap transition-colors";
            } else {
                // Estilos inactivos (Gris)
                btn.className = "px-3 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap transition-colors";
            }
        });

        console.log(`Cambiando pestaña del detalle a: ${tabName}`);
    }

    // Vinculación de eventos y registro en el objeto Window global
    document
        .getElementById("drawerOverlay")
        .addEventListener("click", cerrarDrawer);

    window.verDetalleMudanza = verDetalleMudanza;
    window.cambiarDrawerTab = cambiarDrawerTab; // Hace accesible la función desde el HTML

})();
