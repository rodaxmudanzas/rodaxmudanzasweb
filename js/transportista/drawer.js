(function () {

    "use strict";


    ///////////////////////////////////////////////////////
    // UTILIDADES
    ///////////////////////////////////////////////////////

    function extraerCiudadYCP(direccionCompleta) {

        if (!direccionCompleta || String(direccionCompleta).trim() === "") {
            return "—";
        }

        const texto = String(direccionCompleta).trim();
        const matchCP = texto.match(/\b\d{5}\b/);
        const cp = matchCP ? matchCP[0] : "";

        const partes = texto.split(",");

        let ciudad =
            partes.length >= 2
                ? partes[1].trim()
                : texto;

        if (cp) {
            ciudad = ciudad
                .replace(cp, "")
                .replace(/\bMadrid\b/gi, "")
                .trim();

            return `${ciudad}, ${cp}`;
        }

        return ciudad || "—";
    }


    function obtenerMostrarDireccionCompleta(mudanza) {

        if (!mudanza?.fecha) return false;

        const ahora = new Date();
        const fechaServicio = new Date(mudanza.fecha);

        if (Number.isNaN(fechaServicio.getTime())) {
            return false;
        }

        const diferenciaHoras =
            (fechaServicio.getTime() - ahora.getTime()) /
            (1000 * 60 * 60);

        return diferenciaHoras <= 24 && diferenciaHoras >= -48;
    }


    function obtenerMostrarContactoCompleto(mudanza) {

        if (!mudanza?.fecha) return false;

        const ahora = new Date();
        const fechaServicio = new Date(mudanza.fecha);

        if (Number.isNaN(fechaServicio.getTime())) {
            return false;
        }

        const mismoDia =
            ahora.getFullYear() === fechaServicio.getFullYear() &&
            ahora.getMonth() === fechaServicio.getMonth() &&
            ahora.getDate() === fechaServicio.getDate();

        return mismoDia && ahora.getHours() >= 6;
    }


    ///////////////////////////////////////////////////////
    // VER DETALLE
    ///////////////////////////////////////////////////////

    function verDetalleMudanza(id) {

        const mudanza =
            (Array.isArray(state.disponibles)
                ? state.disponibles
                : []
            ).find(m => Number(m.id) === Number(id)) ||
            (Array.isArray(state.activas)
                ? state.activas
                : []
            ).find(m => Number(m.id) === Number(id));

        if (!mudanza) {
            alert("No se ha encontrado la mudanza.");
            return;
        }

        abrirDrawer();


        ///////////////////////////////////////////////////////
        // BOTÓN ACEPTAR
        ///////////////////////////////////////////////////////

        const btnAceptarDrawer =
            document.getElementById("btnAceptarDrawer");

        if (btnAceptarDrawer) {

            btnAceptarDrawer.onclick = function () {

                console.log(
                    "🟦 BOTÓN ACEPTAR TRABAJO PULSADO. ID:",
                    mudanza.id
                );

                if (typeof confirmarAceptar === "function") {
                    confirmarAceptar(mudanza.id);
                } else {
                    console.error(
                        "❌ confirmarAceptar() no está disponible."
                    );
                }
            };
        }


        ///////////////////////////////////////////////////////
        // ID / NÚMERO DE RESERVA
        ///////////////////////////////////////////////////////

        const elReserva =
            document.getElementById("drawerIdTexto");

        if (elReserva) {
            elReserva.textContent =
                window.Transportista?.getNumeroReserva
                    ? window.Transportista.getNumeroReserva(mudanza)
                    : (mudanza.numero_reserva || mudanza.id || "—");
        }


        ///////////////////////////////////////////////////////
        // TIPO DE SERVICIO
        ///////////////////////////////////////////////////////

        const esMudanzaTotal =
            String(mudanza.tipo_servicio || "")
                .toLowerCase()
                .includes("total");

        const elServicio =
            document.getElementById("drawerServicioBadge");

        if (elServicio) {

            elServicio.textContent =
                esMudanzaTotal
                    ? "MUDANZA TOTAL"
                    : "MUDANZA ESTÁNDAR";

            elServicio.className = esMudanzaTotal
                ? "text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-sans"
                : "text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-sans";
        }


        ///////////////////////////////////////////////////////
        // TIPO DE VIVIENDA
        ///////////////////////////////////////////////////////

        let tipoVivienda =
            mudanza.volumen || "Estudio / Loft";

        tipoVivienda = String(tipoVivienda)
            .replace(/([0-9.,]+)\s*m³/i, "")
            .replace(/—/g, "")
            .trim();

        if (!tipoVivienda) {
            tipoVivienda =
                mudanza.volumen || "Estudio / Loft";
        }

        const elTipoVivResumen =
            document.getElementById("drawerTipoViviendaResumen");

        if (elTipoVivResumen) {
            elTipoVivResumen.textContent =
                tipoVivienda.toUpperCase();
        }


        ///////////////////////////////////////////////////////
        // INVENTARIO / M³
        ///////////////////////////////////////////////////////

        const api = window.Transportista;

        if (
            api &&
            typeof api.getTotalArticulos === "function" &&
            typeof api.getTotalM3 === "function" &&
            typeof api.formatM3 === "function"
        ) {

            const totalArticulos =
                api.getTotalArticulos(mudanza.inventario);

            const totalM3 =
                api.getTotalM3(mudanza.inventario);

            const valorM3 =
                api.formatM3(totalM3);

            const elTotalArticulos =
                document.getElementById("drawerTotalArticulos");

            const elM3Texto =
                document.getElementById("drawerM3Texto");

            const elM3Badge =
                document.getElementById("drawerM3Badge");

            const elVolumen =
                document.getElementById("drawerVolumen");

            if (elTotalArticulos) {
                elTotalArticulos.textContent = totalArticulos;
            }

            if (elM3Texto) {
                elM3Texto.textContent = valorM3;
            }

            if (elM3Badge) {
                elM3Badge.textContent = valorM3;
            }

            if (elVolumen) {
                elVolumen.innerHTML =
                    `<span class="text-blue-600 font-bold">${valorM3}</span>`;
            }

        } else {

            console.error(
                "❌ utils.js no está disponible al abrir el drawer.",
                window.Transportista
            );
        }


        ///////////////////////////////////////////////////////
        // PRECIO / KM / FECHA / OBSERVACIONES
        ///////////////////////////////////////////////////////

        const elKm =
            document.getElementById("drawerKm");

        if (elKm) {
            elKm.textContent =
                mudanza.km !== undefined &&
                mudanza.km !== null &&
                mudanza.km !== ""
                    ? `${mudanza.km} km`
                    : "—";
        }

        const elFecha =
            document.getElementById("drawerFecha");

        if (elFecha) {
            elFecha.textContent =
                mudanza.fecha || "—";
        }

        const elFranjaHorariaRecogida =
    document.getElementById(
        "drawerFranjaHorariaRecogida"
    );

if (elFranjaHorariaRecogida) {
    elFranjaHorariaRecogida.textContent =
        mudanza.franja_horaria_recogida || "—";
}

        const elPrecio =
            document.getElementById("drawerPrecio");

        if (elPrecio) {
            elPrecio.textContent =
                mudanza.preciototal || "—";
        }

        const elObservaciones =
            document.getElementById("drawerObservaciones");

        if (elObservaciones) {
            elObservaciones.textContent =
                mudanza.observaciones ||
                "Sin observaciones.";
        }


        ///////////////////////////////////////////////////////
        // PRIVACIDAD DE DIRECCIONES Y CONTACTO
        ///////////////////////////////////////////////////////

        const mostrarDireccionCompleta =
            obtenerMostrarDireccionCompleta(mudanza);

        const mostrarContactoCompleto =
            obtenerMostrarContactoCompleto(mudanza);

        const direccionOrigenFinal =
            mostrarDireccionCompleta
                ? (mudanza.origen || "—")
                : extraerCiudadYCP(mudanza.origen);

        const direccionDestinoFinal =
            mostrarDireccionCompleta
                ? (mudanza.destino || "—")
                : extraerCiudadYCP(mudanza.destino);


        ///////////////////////////////////////////////////////
        // RESUMEN DE RUTA
        ///////////////////////////////////////////////////////

        const elOrigenResumen =
            document.getElementById("drawerOrigenResumen");

        const elDestinoResumen =
            document.getElementById("drawerDestinoResumen");

        if (elOrigenResumen) {
            elOrigenResumen.textContent =
                direccionOrigenFinal;
        }

        if (elDestinoResumen) {
            elDestinoResumen.textContent =
                direccionDestinoFinal;
        }


        ///////////////////////////////////////////////////////
        // ACCESOS
        ///////////////////////////////////////////////////////

        let accesos =
            api && typeof api.getAccesos === "function"
                ? api.getAccesos(mudanza)
                : { recogida: "—", entrega: "—" };

        const elOrigenAcceso =
            document.getElementById("drawerOrigenAcceso");

        const elDestinoAcceso =
            document.getElementById("drawerDestinoAcceso");

        if (elOrigenAcceso) {
            elOrigenAcceso.textContent =
                accesos?.recogida || "—";
        }

        if (elDestinoAcceso) {
            elDestinoAcceso.textContent =
                accesos?.entrega || "—";
        }


        ///////////////////////////////////////////////////////
        // OBJETO SEGURO PARA LOS RENDERIZADORES
        ///////////////////////////////////////////////////////

        const mudanzaDrawer = {
            ...mudanza,
            origen: direccionOrigenFinal,
            destino: direccionDestinoFinal,
            __mostrarDireccionCompleta: mostrarDireccionCompleta,
            __mostrarContactoCompleto: mostrarContactoCompleto
        };


        ///////////////////////////////////////////////////////
        // RUTA
        ///////////////////////////////////////////////////////

        if (typeof window.renderRutaDrawer === "function") {

            mudanzaDrawer = {

    ...mudanzaDrawer,

    origen: obtenerUbicacionCorta(mudanzaDrawer.origen),

    destino: obtenerUbicacionCorta(mudanzaDrawer.destino)

};

            window.renderRutaDrawer(mudanzaDrawer);
        }


        ///////////////////////////////////////////////////////
        // SERVICIOS
        ///////////////////////////////////////////////////////

        if (typeof window.renderServiciosDrawer === "function") {
            window.renderServiciosDrawer(mudanzaDrawer);
        }


        ///////////////////////////////////////////////////////
        // INVENTARIO
        ///////////////////////////////////////////////////////

        if (typeof window.renderInventarioDrawer === "function") {
            window.renderInventarioDrawer(
                mudanza.inventario,
                mudanza.tipo_servicio
            );
        }


        ///////////////////////////////////////////////////////
        // FOTOS
        ///////////////////////////////////////////////////////

        if (typeof window.renderFotosDrawer === "function") {
            window.renderFotosDrawer(
                mudanza.urls_fotos
            );
        }


        ///////////////////////////////////////////////////////
        // INDICACIONES
        ///////////////////////////////////////////////////////

        if (typeof window.renderIndicacionesDrawer === "function") {
            window.renderIndicacionesDrawer(mudanzaDrawer);
        } else {

            const elIndicaciones =
                document.getElementById(
                    "drawerIndicacionesContenedor"
                );

            if (elIndicaciones) {
                elIndicaciones.textContent =
                    mudanza.observaciones ||
                    "Sin indicaciones adicionales.";
            }
        }


        ///////////////////////////////////////////////////////
        // ABRIR SIEMPRE EN RESUMEN
        ///////////////////////////////////////////////////////

        cambiarDrawerTab("resumen");
    }


    ///////////////////////////////////////////////////////
    // ABRIR / CERRAR
    ///////////////////////////////////////////////////////

    function abrirDrawer() {

        const overlay =
            document.getElementById("drawerOverlay");

        const drawer =
            document.getElementById("drawerMudanza");

        overlay?.classList.remove("hidden");
        drawer?.classList.remove("translate-x-full");
    }


    function cerrarDrawer() {

        const overlay =
            document.getElementById("drawerOverlay");

        const drawer =
            document.getElementById("drawerMudanza");

        overlay?.classList.add("hidden");
        drawer?.classList.add("translate-x-full");
    }


    ///////////////////////////////////////////////////////
    // PESTAÑAS
    ///////////////////////////////////////////////////////

    function cambiarDrawerTab(tabName) {

        const tabs = [
            "resumen",
            "ruta",
            "inventario",
            "servicios",
            "fotos",
            "indicaciones"
        ];

        tabs.forEach(tab => {

            const btn =
                document.getElementById(`tab-d-${tab}`);

            const pane =
                document.getElementById(`pane-d-${tab}`);

            if (btn) {

                btn.className =
                    tab === tabName
                        ? "px-3 py-3 text-xs font-semibold border-b-2 border-blue-600 text-blue-600 transition-colors flex-1 text-center"
                        : "px-3 py-3 text-xs font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors flex-1 text-center";
            }

            if (pane) {

                if (tab === tabName) {
                    pane.classList.remove("hidden");
                } else {
                    pane.classList.add("hidden");
                }
            }
        });
    }


    ///////////////////////////////////////////////////////
    // EVENTOS
    ///////////////////////////////////////////////////////

    document
        .getElementById("drawerOverlay")
        ?.addEventListener("click", cerrarDrawer);


    ///////////////////////////////////////////////////////
    // API GLOBAL
    ///////////////////////////////////////////////////////

    window.verDetalleMudanza =
        verDetalleMudanza;

    window.abrirDrawer =
        abrirDrawer;

    window.cerrarDrawer =
        cerrarDrawer;

    window.cambiarDrawerTab =
        cambiarDrawerTab;

    console.log("✅ Drawer principal cargado correctamente");

})();
