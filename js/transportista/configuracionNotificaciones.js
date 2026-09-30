/* ============================================================
 * RODAX TRANSPORTISTA — PREFERENCIA DE NOTIFICACIONES
 * Gestiona la opción "Notificaciones de servicios" desde
 * Configuración y evita crear nuevas notificaciones de servicio
 * cuando el transportista las desactiva.
 * ============================================================ */

(function () {
    "use strict";

    const TIPOS_SERVICIO = new Set([
        "nuevo_trabajo",
        "servicio_aceptado",
        "cambio_servicio",
        "cancelacion",
        "cancelacion_solicitada",
        "cancelacion_aprobada",
        "cancelacion_rechazada",
        "pago",
        "liquidacion"
    ]);

    let transportistaId = null;
    let notificacionesServiciosActivas = true;
    let wrapperAplicado = false;

    function obtenerDb() {
        return window.dbClient || window.supabaseClient || null;
    }

    async function obtenerTransportistaId() {
        if (window.currentUserId) {
            return window.currentUserId;
        }

        const db = obtenerDb();
        if (!db?.auth) return null;

        const { data, error } = await db.auth.getUser();
        if (error || !data?.user) return null;

        return data.user.id;
    }

    function obtenerFilaConfiguracion() {
        const candidatos = Array.from(document.querySelectorAll("div"));

        const titulo = candidatos.find(el =>
            el.children.length === 0 &&
            el.textContent.trim() === "Notificaciones de servicios"
        );

        if (!titulo) return null;

        return titulo.closest(".flex.items-center.justify-between");
    }

    function pintarInterruptor() {
        const fila = obtenerFilaConfiguracion();
        if (!fila) return false;

        let control = fila.querySelector("[data-rodax-notificaciones-servicios]");

        if (!control) {
            control = document.createElement("button");
            control.type = "button";
            control.setAttribute("data-rodax-notificaciones-servicios", "true");
            control.className = "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200";
            control.addEventListener("click", cambiarPreferencia);
            fila.lastElementChild.replaceWith(control);
        }

        control.setAttribute("role", "switch");
        control.setAttribute("aria-checked", String(notificacionesServiciosActivas));
        control.setAttribute("aria-label", "Notificaciones de servicios");
        control.title = notificacionesServiciosActivas
            ? "Desactivar notificaciones de servicios"
            : "Activar notificaciones de servicios";

        control.className = "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 " +
            (notificacionesServiciosActivas ? "bg-emerald-500" : "bg-slate-300");

        control.innerHTML = `
            <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                notificacionesServiciosActivas ? "translate-x-6" : "translate-x-1"
            }"></span>
        `;

        return true;
    }

    async function cargarPreferencia() {
        const db = obtenerDb();
        if (!db) return;

        transportistaId = await obtenerTransportistaId();
        if (!transportistaId) return;

        const { data, error } = await db
            .from("transportistas")
            .select("notificaciones_servicios")
            .eq("id", transportistaId)
            .maybeSingle();

        if (error) {
            console.error("❌ Error cargando preferencia de notificaciones:", error);
            return;
        }

        notificacionesServiciosActivas = data?.notificaciones_servicios !== false;
        pintarInterruptor();
        aplicarWrapperNotificaciones();
    }

    async function cambiarPreferencia(event) {
        event?.preventDefault();

        const db = obtenerDb();
        if (!db || !transportistaId) return;

        const anterior = notificacionesServiciosActivas;
        const nuevoValor = !anterior;
        notificacionesServiciosActivas = nuevoValor;
        pintarInterruptor();

        const control = document.querySelector("[data-rodax-notificaciones-servicios]");
        if (control) control.disabled = true;

        const { error } = await db
            .from("transportistas")
            .update({ notificaciones_servicios: nuevoValor })
            .eq("id", transportistaId);

        if (control) control.disabled = false;

        if (error) {
            console.error("❌ Error guardando preferencia de notificaciones:", error);
            notificacionesServiciosActivas = anterior;
            pintarInterruptor();
            alert("No se pudo guardar la preferencia de notificaciones.");
            return;
        }

        aplicarWrapperNotificaciones();
    }

    function aplicarWrapperNotificaciones() {
        if (wrapperAplicado) return;
        if (!window.RodaxNotificaciones?.crearNotificacion) return;

        const original = window.RodaxNotificaciones.crearNotificacion;

        window.RodaxNotificaciones.crearNotificacion = async function (datos) {
            const tipo = datos?.tipo || "sistema";

            if (!notificacionesServiciosActivas && TIPOS_SERVICIO.has(tipo)) {
                console.log("🔕 Notificación de servicio omitida por preferencia del transportista:", tipo);
                return { ok: true, omitida_por_preferencia: true };
            }

            return original(datos);
        };

        wrapperAplicado = true;
    }

    async function iniciar() {
        // Esperamos a que el panel haya cargado Supabase y el sistema de notificaciones.
        let intentos = 0;
        const maxIntentos = 60;

        const esperar = async () => {
            const db = obtenerDb();
            if (db && document.readyState !== "loading") {
                await cargarPreferencia();
                aplicarWrapperNotificaciones();
                return;
            }

            intentos += 1;
            if (intentos < maxIntentos) {
                setTimeout(esperar, 250);
            }
        };

        esperar();

        // El sistema de notificaciones se carga después de este módulo.
        const interval = setInterval(() => {
            aplicarWrapperNotificaciones();
            if (wrapperAplicado) clearInterval(interval);
        }, 250);

        setTimeout(() => clearInterval(interval), 15000);
    }

    window.RodaxPreferenciasNotificaciones = {
        cargar: cargarPreferencia,
        estaActiva: () => notificacionesServiciosActivas
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
