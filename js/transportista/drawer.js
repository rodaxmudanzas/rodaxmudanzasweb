(function () {

    "use strict";

    function verDetalleMudanza(id){

        // Buscar la mudanza en memoria de forma segura
        const mudanza = state.disponibles.find(m => Number(m.id) === Number(id)) || 
                        state.activas.find(m => Number(m.id) === Number(id));

        console.log("=========== MUDANZA COMPLETA ===========");
        console.log(mudanza);
        console.log("========================================");

        if(!mudanza){
            alert("No se ha encontrado la mudanza.");
            return;
        }

        abrirDrawer();

        // 1. CONTROL DE IDENTIFICADORES (IDs con protección contra fallos)
        const elReserva = document.getElementById("drawerReserva") || document.getElementById("drawerIdTexto");
        if(elReserva) {
            elReserva.textContent = mudanza.numero_reserva || `RDX-26-${mudanza.id}`;
        }

        // Tipo de Servicio (Mudanza Total o Estándar)
        const elServicio = document.getElementById("drawerServicio") || document.getElementById("drawerServicioBadge");
        const esMudanzaTotal = (mudanza.tipo_servicio || "").toLowerCase().includes("total");
        
        if(elServicio) {
            if(esMudanzaTotal) {
                elServicio.textContent = "MUDANZA TOTAL";
                elServicio.className = "text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-sans";
            } else {
                elServicio.textContent = "MUDANZA ESTÁNDAR";
                elServicio.className = "text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-sans";
            }
        }

        // 2. EXTRAER Y COLOCAR LOS METROS CÚBICOS (m³)
        let valorM3 = "0.0 m³";
        if (mudanza.volumen) {
            const matchM3 = mudanza.volumen.match(/([0-9.,]+)\s*m³/i);
            valorM3 = matchM3 ? matchM3[0].trim() : `${mudanza.volumen} m³`;
        }

        const elVolumen = document.getElementById("drawerVolumen");
        if(elVolumen) {
            elVolumen.innerHTML = `<span class="text-blue-600 font-bold">${valorM3}</span>`;
        }

        // 3. ASIGNACIÓN SEGURA DE RUTA
        const elOrigen = document.getElementById("drawerOrigen") || document.getElementById("drawerOrigenResumen");
        if(elOrigen) elOrigen.textContent = mudanza.origen || "—";

        const elDestino = document.getElementById("drawerDestino") || document.getElementById("drawerDestinoResumen");
        if(elDestino) elDestino.textContent = mudanza.destino || "—";

        // Desglose Seguro de Accesos y Ascensores
        const elOrigenAcceso = document.getElementById("drawerOrigenAcceso");
        const elDestinoAcceso = document.getElementById("drawerDestinoAcceso");
        const elAscensorGeneral = document.getElementById("drawerAscensor");

        if (mudanza.ascensor && mudanza.ascensor.includes('|')) {
            const partes = mudanza.ascensor.split('|');
            const txtOrig = partes[0] ? partes[0].replace('Recogida:', '').trim() : "—";
            const txtDest = partes[1] ? partes[1].replace('Entrega:', '').trim() : "—";

            if(elOrigenAcceso) elOrigenAcceso.textContent = txtOrig;
            if(elDestinoAcceso) elDestinoAcceso.textContent = txtDest;
            if(elAscensorGeneral) elAscensorGeneral.textContent = `${txtOrig} | ${txtDest}`;
        } else {
            if(elOrigenAcceso) elOrigenAcceso.textContent = mudanza.ascensor || "C/ascensor";
            if(elDestinoAcceso) elDestinoAcceso.textContent = "—";
            if(elAscensorGeneral) elAscensorGeneral.textContent = mudanza.ascensor || "—";
        }

        // 4. LOGÍSTICA COMPLEMENTARIA (Distancia, Fecha, Observaciones y Precios)
        const elKm = document.getElementById("drawerKm");
        if(elKm) elKm.textContent = mudanza.km ? `${mudanza.km} km` : "—";

        const elFecha = document.getElementById("drawerFecha");
        if(elFecha) elFecha.textContent = mudanza.fecha || "—";

        const elPrecio = document.getElementById("drawerPrecio");
        if(elPrecio) elPrecio.innerHTML = `${mudanza.preciototal || "—"}`;

        const elObs = document.getElementById("drawerObservaciones");
        if(elObs) {
            elObs.textContent = mudanza.observaciones && mudanza.observaciones.trim() !== "" 
                ? mudanza.observaciones 
                : "Sin observaciones preliminares por parte del cliente.";
        }

        // 5. CALCULAR CONTADOR GLOBAL DE ARTÍCULOS
        let totalItemsContados = 0;
        if (mudanza.inventario) {
            let invParsed = typeof mudanza.inventario === "string" ? JSON.parse(mudanza.inventario) : mudanza.inventario;
            if (Array.isArray(invParsed)) {
                totalItemsContados = invParsed.reduce((acc, item) => acc + (parseInt(item.cantidad, 10) || 0), 0);
            }
        }

        const elTotalArticulos = document.getElementById("drawerTotalArticulos");
        if (elTotalArticulos) {
            elTotalArticulos.innerHTML = `INVENTARIO (${totalItemsContados} ARTÍCULOS) — <span class="text-blue-600 font-bold">${valorM3}</span>`;
        }

        // 6. INYECTAR BENEFICIOS O SERVICIOS SEGÚN EL MODELO
        const elExtras = document.getElementById("drawerExtras") || document.getElementById("drawerServiciosLista");
        if (elExtras) {
            if (esMudanzaTotal) {
                elExtras.innerHTML = `
                    <div class="space-y-1.5 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-semibold leading-relaxed">
                        <p class="flex items-center gap-2">✔ Desmontaje ilimitado</p>
                        <p class="flex items-center gap-2">✔ Montaje ilimitado</p>
                        <p class="flex items-center gap-2">✔ Embalaje ilimitado</p>
                        <p class="flex items-center gap-2">✔ Empaquetado y cajas Ilimitado</p>
                        <p class="flex items-center gap-2">✔ Seguro premium hasta 50.000€</p>
                        <p class="flex items-center gap-2">✔ Prioridad operativa</p>
                    </div>
                    <div class="text-[10px] text-slate-400 mt-2 font-normal">Notas adicionales del cliente: ${mudanza.extras || 'Ninguna'}</div>`;
            } else {
                elExtras.innerHTML = `
                    <div class="space-y-1.5 bg-blue-50/40 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 font-semibold">
                        <p class="flex items-center gap-2">✔ Transporte Estándar Básico</p>
                        <p class="text-[10px] text-slate-400 font-normal mt-1">Servicios extras seleccionados:</p>
                        <p class="font-bold text-slate-700">${mudanza.extras || 'Solo transporte básico'}</p>
                    </div>`;
            }
        }

        // 7. DISPARAR LOS RENDERIZADORES EXTERNOS DE INVENTARIO Y FOTOGRAFÍAS
        if (typeof renderInventarioDrawer === "function") {
            renderInventarioDrawer(mudanza.inventario);
        }
        if (typeof renderFotosDrawer === "function") {
            renderFotosDrawer(mudanza.urls_fotos);
        }

        // Poblar pestañas secundarias si existen en el HTML
        const elRutaDetalle = document.getElementById("drawerRutaDetalleContenedor");
        if(elRutaDetalle) {
            elRutaDetalle.innerHTML = `
                <div class="bg-slate-50 p-4 rounded-xl border text-xs space-y-2">
                    <p><strong>Punto de Recogida:</strong> ${mudanza.origen || "—"}</p>
                    <p><strong>Punto de Entrega:</strong> ${mudanza.destino || "—"}</p>
                    <p><strong>Logística de Accesos:</strong> ${mudanza.ascensor || "—"}</p>
                </div>`;
        }

        const elIndicaciones = document.getElementById("drawerIndicacionesContenedor");
        if(elIndicaciones) elIndicaciones.textContent = mudanza.observaciones || "Sin indicaciones adicionales.";

        cambiarDrawerTab('resumen');
    }

    window.onload = verificarSesion;

    function abrirDrawer(){
        document.getElementById("drawerOverlay").classList.remove("hidden");
        document.getElementById("drawerMudanza").classList.remove("translate-x-full");
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

    window.verDetalleMudanza = verDetalleMudanza;
    window.cambiarDrawerTab = cambiarDrawerTab;

})();
