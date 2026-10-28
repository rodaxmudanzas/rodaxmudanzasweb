/* ============================================================
 * RODAX TRANSPORTISTA — PREFERENCIAS DE NOTIFICACIONES
 * Gestiona desde Configuración:
 *   1) Notificaciones de servicios
 *   2) Avisos por email
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
    let avisosEmailActivos = true;
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

    function obtenerFilaConfiguracion(texto) {
        const candidatos = Array.from(document.querySelectorAll("div"));

        const titulo = candidatos.find(el =>
            el.children.length === 0 &&
            el.textContent.trim() === texto
        );

        if (!titulo) return null;

        return titulo.closest(".flex.items-center.justify-between");
    }

    function pintarInterruptor(fila, atributo, activo, etiqueta) {
        if (!fila) return false;

        let control = fila.querySelector(`[${atributo}]`);

        if (!control) {
            control = document.createElement("button");
            control.type = "button";
            control.setAttribute(atributo, "true");
            fila.lastElementChild.replaceWith(control);
        }

        control.setAttribute("role", "switch");
        control.setAttribute("aria-checked", String(activo));
        control.setAttribute("aria-label", etiqueta);
        control.title = activo
            ? `Desactivar ${etiqueta.toLowerCase()}`
            : `Activar ${etiqueta.toLowerCase()}`;

        control.className = "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 " +
            (activo ? "bg-emerald-500" : "bg-slate-300");

        control.innerHTML = `
            <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                activo ? "translate-x-6" : "translate-x-1"
            }"></span>
        `;

        return true;
    }

    function pintarPreferencias() {
        pintarInterruptor(
            obtenerFilaConfiguracion("Notificaciones de servicios"),
            "data-rodax-notificaciones-servicios",
            notificacionesServiciosActivas,
            "Notificaciones de servicios"
        );

        pintarInterruptor(
            obtenerFilaConfiguracion("Avisos por email"),
            "data-rodax-avisos-email",
            avisosEmailActivos,
            "Avisos por email"
        );

        const emailControl = document.querySelector("[data-rodax-avisos-email]");
        if (emailControl && !emailControl.dataset.listenerAttached) {
            emailControl.addEventListener("click", cambiarAvisosEmail);
            emailControl.dataset.listenerAttached = "true";
        }

        const serviciosControl = document.querySelector("[data-rodax-notificaciones-servicios]");
        if (serviciosControl && !serviciosControl.dataset.listenerAttached) {
            serviciosControl.addEventListener("click", cambiarPreferencia);
            serviciosControl.dataset.listenerAttached = "true";
        }
    }

    async function cargarPreferencias() {
        const db = obtenerDb();
        if (!db) return;

        transportistaId = await obtenerTransportistaId();
        if (!transportistaId) return;

        const { data, error } = await db
            .from("transportistas")
            .select("notificaciones_servicios, avisos_email")
            .eq("id", transportistaId)
            .maybeSingle();

        if (error) {
            console.error("❌ Error cargando preferencias de notificaciones:", error);
            return;
        }

        notificacionesServiciosActivas = data?.notificaciones_servicios !== false;
        avisosEmailActivos = data?.avisos_email !== false;

        pintarPreferencias();
        aplicarWrapperNotificaciones();
    }

    async function cambiarPreferencia(event) {
        event?.preventDefault();

        const db = obtenerDb();
        if (!db || !transportistaId) return;

        const anterior = notificacionesServiciosActivas;
        const nuevoValor = !anterior;
        notificacionesServiciosActivas = nuevoValor;
        pintarPreferencias();

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
            pintarPreferencias();
            alert("No se pudo guardar la preferencia de notificaciones.");
            return;
        }

        aplicarWrapperNotificaciones();
    }

    async function cambiarAvisosEmail(event) {
        event?.preventDefault();

        const db = obtenerDb();
        if (!db || !transportistaId) return;

        const anterior = avisosEmailActivos;
        const nuevoValor = !anterior;
        avisosEmailActivos = nuevoValor;
        pintarPreferencias();

        const control = document.querySelector("[data-rodax-avisos-email]");
        if (control) control.disabled = true;

        const { error } = await db
            .from("transportistas")
            .update({ avisos_email: nuevoValor })
            .eq("id", transportistaId);

        if (control) control.disabled = false;

        if (error) {
            console.error("❌ Error guardando preferencia de avisos por email:", error);
            avisosEmailActivos = anterior;
            pintarPreferencias();
            alert("No se pudo guardar la preferencia de avisos por email.");
        }
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
        let intentos = 0;
        const maxIntentos = 60;

        const esperar = async () => {
            const db = obtenerDb();
            if (db && document.readyState !== "loading") {
                await cargarPreferencias();
                aplicarWrapperNotificaciones();
                return;
            }

            intentos += 1;
            if (intentos < maxIntentos) {
                setTimeout(esperar, 250);
            }
        };

        esperar();

        const interval = setInterval(() => {
            pintarPreferencias();
            aplicarWrapperNotificaciones();
            if (wrapperAplicado) clearInterval(interval);
        }, 250);

        setTimeout(() => clearInterval(interval), 15000);
    }

    window.RodaxPreferenciasNotificaciones = {
        cargar: cargarPreferencias,
        estaActiva: () => notificacionesServiciosActivas,
        avisosEmailActivos: () => avisosEmailActivos
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
