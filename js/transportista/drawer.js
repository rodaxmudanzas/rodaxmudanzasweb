(function () {

    "use strict";

    function verDetalleMudanza(id){

        // Buscar la mudanza en memoria dentro de disponibles o activas
        const mudanza = state.disponibles.find(m => Number(m.id) === Number(id)) || 
                        state.activas.find(m => Number(m.id) === Number(id));

        if(!mudanza){
            alert("No se ha encontrado la mudanza.");
            return;
        }

        abrirDrawer();

        // Código Identificador del expediente
        const elReserva = document.getElementById("drawerReserva") || document.getElementById("drawerIdTexto");
        if(elReserva) {
            elReserva.textContent = mudanza.numero_reserva || `RDX-26-${mudanza.id}`;
        }

        // Configuración visual del Badge de Servicio
        const elServicio = document.getElementById("drawerServicioBadge");
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

        // Tipo de vivienda / Volumen text
        const tipoVivienda = mudanza.volumen || "—";
        const elTipoVivResumen = document.getElementById("drawerTipoViviendaResumen");
        if(elTipoVivResumen) elTipoVivResumen.textContent = tipoVivienda;

        // Metros Cúbicos (m³) en azul
        let valorM3 = "0.0 m³";
        if (mudanza.volumen) {
            const matchM3 = mudanza.volumen.match(/([0-9.,]+)\s*m³/i);
            valorM3 = matchM3 ? `${matchM3[0].trim()}` : `${mudanza.volumen} m³`;
        }
        
        const elM3Texto = document.getElementById("drawerM3Texto");
        const elM3Badge = document.getElementById("drawerM3Badge");
        const elVolumen = document.getElementById("drawerVolumen");
        if(elM3Texto) elM3Texto.textContent = valorM3;
        if(elM3Badge) elM3Badge.textContent = valorM3;
        if(elVolumen) elVolumen.innerHTML = `<span class="text-blue-600 font-bold">${valorM3}</span>`;

        // Datos Logísticos fijos
        if(document.getElementById("drawerKm")) document.getElementById("drawerKm").textContent = mudanza.km ? `${mudanza.km} km` : "—";
        if(document.getElementById("drawerFecha")) document.getElementById("drawerFecha").textContent = mudanza.fecha || "—";
        if(document.getElementById("drawerPrecio")) document.getElementById("drawerPrecio").innerHTML = `${mudanza.preciototal || "—"}`;
        if(document.getElementById("drawerObservaciones")) document.getElementById("drawerObservaciones").textContent = mudanza.observaciones || "Sin observaciones preliminares.";

        // ==========================================
        // 🔐 REGLA DE PRIVACIDAD: RESTRICCIÓN HORARIA (Problema 3)
        // ==========================================
        let mostrarDatosSensibles = false;
        if (mudanza.fecha) {
            const hoy = new Date();
            const fechaMudanza = new Date(mudanza.fecha);
            
            const esMismoDia = hoy.getFullYear() === fechaMudanza.getFullYear() &&
                               hoy.getMonth() === fechaMudanza.getMonth() &&
                               hoy.getDate() === fechaMudanza.getDate();
                               
            const horaActual = hoy.getHours();
            
            // Filtro estricto: Mismo día a partir de las 6:00 AM
            if (esMismoDia && horaActual >= 6) {
                mostrarDatosSensibles = true;
            }
        }

        const direccionOrigenFinal = mostrarDatosSensibles ? (mudanza.origen || "—") : "Dirección oculta por seguridad (Visible el día del servicio a partir de las 6:00 AM)";
        const direccionDestinoFinal = mostrarDatosSensibles ? (mudanza.destino || "—") : "Dirección oculta por seguridad (Visible el día del servicio a partir de las 6:00 AM)";

        if(document.getElementById("drawerOrigenResumen")) document.getElementById("drawerOrigenResumen").textContent = direccionOrigenFinal;
        if(document.getElementById("drawerDestinoResumen")) document.getElementById("drawerDestinoResumen").textContent = direccionDestinoFinal;

        // Separación Correcta de los Accesos (Sintaxis sin errores de Array)
        let txtOrig = "—", txtDest = "—";
        if (mudanza.ascensor && mudanza.ascensor.includes('|')) {
            const partes = mudanza.ascensor.split('|');
            txtOrig = partes[0] ? partes[0].replace('Recogida:', '').trim() : "—";
            txtDest = partes[1] ? partes[1].replace('Entrega:', '').trim() : "—";
        } else {
            txtOrig = mudanza.ascensor || "C/ascensor";
        }
        if(document.getElementById("drawerOrigenAcceso")) document.getElementById("drawerOrigenAcceso").textContent = txtOrig;
        if(document.getElementById("drawerDestinoAcceso")) document.getElementById("drawerDestinoAcceso").textContent = txtDest;

        // ==========================================
        // 🎨 DISEÑO CREATIVO DE LA PESTAÑA RUTA
        // ==========================================
        const elRutaDetalle = document.getElementById("drawerRutaDetalleContenedor");
        if(elRutaDetalle) {
            elRutaDetalle.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gradient-to-r from-blue-50 to-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                            <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider">PUNTO DE RECOGIDA</span>
                        </div>
                        <p class="text-sm font-bold text-slate-800 leading-snug">${direccionOrigenFinal}</p>
                        <div class="mt-2 flex items-center gap-4 text-xs text-slate-500 font-medium">
                            <span class="flex items-center gap-1">🛗 Acceso: <strong class="text-slate-700">${txtOrig}</strong></span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 px-4">
                        <div class="flex-1 border-t-2 border-dashed border-slate-200"></div>
                        <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
                            🚚 ${mudanza.km ? `${mudanza.km} km en carretera` : 'Calcular ruta'}
                        </span>
                        <div class="flex-1 border-t-2 border-dashed border-slate-200"></div>
                    </div>

                    <div class="bg-gradient-to-r from-orange-50 to-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100"></span>
                            <span class="text-[10px] font-bold text-orange-600 uppercase tracking-wider">PUNTO DE ENTREGA</span>
                        </div>
                        <p class="text-sm font-bold text-slate-800 leading-snug">${direccionDestinoFinal}</p>
                        <div class="mt-2 flex items-center gap-4 text-xs text-slate-500 font-medium">
                            <span class="flex items-center gap-1">🛗 Acceso: <strong class="text-slate-700">${txtDest}</strong></span>
                        </div>
                    </div>

                    <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mt-2 space-y-2 text-xs">
                        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Información Confidencial del Cliente</span>
                        ${mostrarDatosSensibles ? `
                            <p class="text-slate-700 font-medium"><strong>Nombre:</strong> ${mudanza.nombre || '—'}</p>
                            <p class="text-slate-700 font-medium"><strong>Teléfono:</strong> <a href="tel:${mudanza.telefono}" class="text-blue-600 font-bold hover:underline">${mudanza.telefono}</a></p>
                            <p class="text-slate-700 font-medium"><strong>Email:</strong> ${mudanza.email || '—'}</p>
                        ` : `
                            <p class="text-slate-400 italic flex items-center gap-1.5">🔒 Los datos de contacto se revelarán el día de la mudanza.</p>
                        `}
                    </div>
                </div>`;
        }

                // ========================================================
        // 6. INYECTAR BENEFICIOS O SERVICIOS SEGÚN EL MODELO
        // ========================================================
        const elExtras = document.getElementById("drawerExtras") || document.getElementById("drawerServiciosLista");
        
        if (elExtras) {
            if (esMudanzaTotal) {
                elExtras.innerHTML = `
                    <div class="space-y-1.5 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-semibold leading-relaxed font-sans shadow-sm">
                        <p class="flex items-center gap-2 text-emerald-700">✔ Desmontaje ilimitado</p>
                        <p class="flex items-center gap-2 text-emerald-700">✔ Montaje ilimitado</p>
                        <p class="flex items-center gap-2 text-emerald-700">✔ Embalaje ilimitado</p>
                        <p class="flex items-center gap-2 text-emerald-700">✔ Empaquetado y cajas Ilimitado</p>
                        <p class="flex items-center gap-2 text-emerald-700">✔ Seguro premium hasta 50.000€</p>
                        <p class="flex items-center gap-2 text-emerald-700">✔ Prioridad operativa</p>
                    </div>`;
            } else {
                elExtras.innerHTML = `
                    <div class="space-y-1.5 bg-blue-50/40 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 font-semibold shadow-sm">
                        <p class="flex items-center gap-2 text-blue-700">✔ Transporte Estándar Básico</p>
                        <p class="text-[10px] text-slate-400 font-normal mt-1">Servicios adicionales seleccionados:</p>
                        <p class="font-bold text-slate-700 mt-0.5">${mudanza.extras || 'Solo transporte básico'}</p>
                    </div>`;
            }
        }

        // ========================================================
        // 7. LANZAR LOS RENDERIZADORES EXTERNOS DE INVENTARIO Y FOTOS
        // ========================================================
        if (typeof renderInventarioDrawer === "function") {
            renderInventarioDrawer(mudanza.inventario);
        }
        if (typeof renderFotosDrawer === "function") {
            renderFotosDrawer(mudanza.urls_fotos);
        }

        const elIndicaciones = document.getElementById("drawerIndicacionesContenedor");
        if (elIndicaciones) {
            elIndicaciones.textContent = mudanza.observaciones || "Sin indicaciones adicionales.";
        }

        // Forzar a abrir la pestaña de 'Resumen' por defecto
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

    // CONTROLADOR DE PESTAÑAS (Maneja la visibilidad e inyección en cada Tab)
    function cambiarDrawerTab(tabName) {
        const tabs = ['resumen', 'ruta', 'inventario', 'servicios', 'fotos', 'indicaciones'];
        
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-d-${t}`);
            const pane = document.getElementById(`pane-d-${t}`);
            
            if (btn) {
                btn.className = t === tabName 
                    ? "px-3 py-3 text-xs font-semibold border-b-2 border-blue-600 text-blue-600 whitespace-nowrap transition-colors" 
                    : "px-3 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap transition-colors";
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

    // Evento para cerrar haciendo clic fuera en el fondo oscuro
    document.getElementById("drawerOverlay")?.addEventListener("click", cerrarDrawer);

    window.verDetalleMudanza = verDetalleMudanza;
    window.cambiarDrawerTab = cambiarDrawerTab;

})();
