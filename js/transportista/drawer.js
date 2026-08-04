(function () {

    "use strict";

    // Función auxiliar para extraer Ciudad y Código Postal
    function extraerCiudadYCP(direccionCompleta) {
        if (!direccionCompleta || direccionCompleta.trim() === "") return "—";
        const regexCP = /\b\d{5}\b/;
        const matchCP = direccionCompleta.match(regexCP);
        const cp = matchCP ? matchCP[0] : "";

        const partes = direccionCompleta.split(',');
        let ciudad = partes.length >= 2 ? partes[1].trim() : direccionCompleta.trim();

        if (cp !== "") {
            ciudad = ciudad.replace(cp, '').replace(/\bMadrid\b/gi, '').trim(); 
            return `${ciudad}, ${cp}`;
        }
        return ciudad;
    }

    function verDetalleMudanza(id){

        const mudanza = state.disponibles.find(m => Number(m.id) === Number(id)) || 
                        state.activas.find(m => Number(m.id) === Number(id));

        if(!mudanza){
            alert("No se ha encontrado la mudanza.");
            return;
        }

        abrirDrawer();

        // Número o ID de reserva
        const elReserva = document.getElementById("drawerReserva") || document.getElementById("drawerIdTexto");
        if(elReserva) elReserva.textContent = mudanza.numero_reserva || `RDX-26-${mudanza.id}`;

        // Configuración de Badges según el tipo de servicio
        const elServicio = document.getElementById("drawerServicioBadge");
        const esMudanzaTotal = (mudanza.tipo_servicio || "").toLowerCase().includes("total");
        
        if(elServicio) {
            elServicio.textContent = esMudanzaTotal ? "MUDANZA TOTAL" : "MUDANZA ESTÁNDAR";
            elServicio.className = esMudanzaTotal 
                ? "text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100"
                : "text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100";
        }

        // Tipo de vivienda
        const tipoVivienda = mudanza.volumen || "—";
        const elTipoVivResumen = document.getElementById("drawerTipoViviendaResumen");
        if(elTipoVivResumen) elTipoVivResumen.textContent = tipoVivienda;

        // Extraer Metros Cúbicos (m³)
        let valorM3 = "0.0 m³";
        if (mudanza.volumen) {
            const matchM3 = mudanza.volumen.match(/([0-9.,]+)\s*m³/i);
            valorM3 = matchM3 ? `${matchM3[0]}` : `${mudanza.volumen} m³`;
        }
        
        if(document.getElementById("drawerM3Texto")) document.getElementById("drawerM3Texto").textContent = valorM3;
        if(document.getElementById("drawerM3Badge")) document.getElementById("drawerM3Badge").textContent = valorM3;
        
        const elVolumen = document.getElementById("drawerVolumen");
        if(elVolumen) elVolumen.innerHTML = `<span class="text-blue-600 font-bold">${valorM3}</span>`;

        // Datos Logísticos
        if(document.getElementById("drawerKm")) document.getElementById("drawerKm").textContent = mudanza.km ? `${mudanza.km} km` : "—";
        if(document.getElementById("drawerFecha")) document.getElementById("drawerFecha").textContent = mudanza.fecha || "—";
        if(document.getElementById("drawerPrecio")) document.getElementById("drawerPrecio").innerHTML = `${mudanza.preciototal || "—"}`;
        if(document.getElementById("drawerObservaciones")) document.getElementById("drawerObservaciones").textContent = mudanza.observaciones || "Sin observaciones.";

        // ==========================================
        // 🔐 REGLAS CRÍTICAS DE TIEMPO Y PRIVACIDAD
        // ==========================================
        let mostrarDireccionCompleta = false;
        let mostrarContactoCompleto = false;

        if (mudanza.fecha) {
            const ahora = new Date();
            const fechaServicio = new Date(mudanza.fecha);
            
            // RegalaDirecciones: Menos de 24 horas antes del servicio
            const diferenciaHoras = (fechaServicio - ahora) / (1000 * 60 * 60);
            if (diferenciaHoras <= 24 && diferenciaHoras >= -48) {
                mostrarDireccionCompleta = true;
            }

            // RegalaContacto: Mismo día a partir de las 6:00 AM
            const esMismoDia = ahora.getFullYear() === fechaServicio.getFullYear() &&
                               ahora.getMonth() === fechaServicio.getMonth() &&
                               ahora.getDate() === fechaServicio.getDate();
            if (esMismoDia && ahora.getHours() >= 6) {
                mostrarContactoCompleto = true;
            }
        }

        // Aplicación del filtro de direcciones
        const direccionOrigenFinal = mostrarDireccionCompleta ? (mudanza.origen || "—") : extraerCiudadYCP(mudanza.origen);
        const direccionDestinoFinal = mostrarDireccionCompleta ? (mudanza.destino || "—") : extraerCiudadYCP(mudanza.destino);

        document.getElementById("drawerOrigenResumen").textContent = direccionOrigenFinal;
        document.getElementById("drawerDestinoResumen").textContent = direccionDestinoFinal;

        // Formateo de los accesos
        let txtOrig = "—", txtDest = "—";
        if (mudanza.ascensor && mudanza.ascensor.includes('|')) {
            const partes = mudanza.ascensor.split('|');
            txtOrig = partes[0].replace('Recogida:', '').trim();
            txtDest = partes[1].replace('Entrega:', '').trim();
        } else {
            txtOrig = mudanza.ascensor || "C/ascensor";
        }
        if(document.getElementById("drawerOrigenAcceso")) document.getElementById("drawerOrigenAcceso").textContent = txtOrig;
        if(document.getElementById("drawerDestinoAcceso")) document.getElementById("drawerDestinoAcceso").textContent = txtDest;

        // Renderizado del Tab de Ruta Avanzada
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
                        <p class="text-xs text-slate-400 mt-1">${mostrarDireccionCompleta ? '📍 Dirección exacta liberada' : '🔒 Calle oculta (Disponible 24h antes)'}</p>
                    </div>

                    <div class="flex items-center gap-3 px-4">
                        <div class="flex-1 border-t-2 border-dashed border-slate-200"></div>
                        <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1">🚚 ${mudanza.km || '?'} km</span>
                        <div class="flex-1 border-t-2 border-dashed border-slate-200"></div>
                    </div>

                    <div class="bg-gradient-to-r from-orange-50 to-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100"></span>
                            <span class="text-[10px] font-bold text-orange-600 uppercase tracking-wider">PUNTO DE ENTREGA</span>
                        </div>
                        <p class="text-sm font-bold text-slate-800 leading-snug">${direccionDestinoFinal}</p>
                        <p class="text-xs text-slate-400 mt-1">${mostrarDireccionCompleta ? '📍 Dirección exacta liberada' : '🔒 Calle oculta (Disponible 24h antes)'}</p>
                    </div>

                    <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mt-2 space-y-2 text-xs">
                        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contacto de la mudanza</span>
                        ${mostrarContactoCompleto ? `
                            <p class="text-slate-700 font-medium"><strong>Nombre:</strong> ${mudanza.nombre || '—'}</p>
                            <p class="text-slate-700 font-medium"><strong>Teléfono:</strong> <a href="tel:${mudanza.telefono}" class="text-blue-600 font-bold hover:underline">${mudanza.telefono}</a></p>
                            <p class="text-slate-700 font-medium"><strong>Email:</strong> ${mudanza.email || '—'}</p>
                        ` : `
                            <p class="text-slate-500 font-medium bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-amber-700 flex items-center gap-1.5">
                                🔒 Los teléfonos y correos se revelarán de forma automática el mismo día del servicio a partir de las 06:00 AM.
                            </p>
                        `}
                    </div>
                </div>`;
        }

                // ========================================================
        // 6. INYECTAR SERVICIOS CONTRATADOS DINÁMICOS
        // ========================================================
        const elExtras = document.getElementById("drawerServiciosLista");
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
                        <p class="text-[10px] text-slate-400 font-normal mt-1">Servicios extras seleccionados:</p>
                        <p class="font-bold text-slate-700 mt-0.5">${mudanza.extras || 'Solo transporte básico'}</p>
                    </div>`;
            }
        }

        // ========================================================
        // 7. CALCULAR CONTEO DE ARTÍCULOS PARA EL TÍTULO
        // ========================================================
        let totalArticulosCount = 0;
        if (mudanza.inventario) {
            let invParsed = typeof mudanza.inventario === "string" ? JSON.parse(mudanza.inventario) : mudanza.inventario;
            if (Array.isArray(invParsed)) {
                totalArticulosCount = invParsed.reduce((acc, item) => acc + (parseInt(item.cantidad, 10) || 0), 0);
            }
        }

        const elTotalArticulos = document.getElementById("drawerTotalArticulos");
        if (elTotalArticulos) {
            elTotalArticulos.innerHTML = `${totalArticulosCount}`;
        }

        // ========================================================
        // 8. LANZAR RENDERIZADORES DE INVENTARIO Y FOTOS
        // ========================================================
        if (typeof renderInventarioDrawer === "function") {
            renderInventarioDrawer(mudanza.inventario, mudanza.tipo_servicio);
        }
        if (typeof renderFotosDrawer === "function") {
            renderFotosDrawer(mudanza.urls_fotos);
        }

        const elIndicaciones = document.getElementById("drawerIndicacionesContenedor");
        if (elIndicaciones) {
            elIndicaciones.textContent = mudanza.observaciones || "Sin indicaciones adicionales.";
        }

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

    // CONTROLADOR DE PESTAÑAS (Intercambia la visibilidad de los paneles de forma simétrica)
    function cambiarDrawerTab(tabName) {
        const tabs = ['resumen', 'ruta', 'inventario', 'servicios', 'fotos', 'indicaciones'];
        
        tabs.forEach(t => {
            const btn = document.getElementById(`tab-d-${t}`);
            const pane = document.getElementById(`pane-d-${t}`);
            
            if (btn) {
                btn.className = t === tabName 
                    ? "px-3 py-3 text-xs font-semibold border-b-2 border-blue-600 text-blue-600 whitespace-nowrap transition-colors flex-1 text-center" 
                    : "px-3 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 whitespace-nowrap transition-colors flex-1 text-center";
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
