// Núcleo del Área Administración: sesión, llamadas a la API y utilidades de interfaz.
// La seguridad real vive en /api/admin; aquí solo se oculta lo que el rol no puede usar.

const SUPABASE_URL = "https://fitwaumzrdvsqozlzlit.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DfBOPKC1US-oy8-_O3hu6w__RBAJGWY";

// storageKey propia: la sesión de Administración no se mezcla con la de
// clientes o transportistas que usen el mismo navegador.
const dbAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { storageKey: "rodax-admin-auth" }
});

const sesionAdmin = { admin: null, permisos: [] };

function puede(permiso) {
    return sesionAdmin.permisos.includes("*") || sesionAdmin.permisos.includes(permiso);
}

//////////////////////////////////////////////////////
// API
//////////////////////////////////////////////////////

class ErrorApi extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

async function api(accion, datos = {}) {

    const { data } = await dbAdmin.auth.getSession();
    const token = data?.session?.access_token;

    if (!token) {
        throw new ErrorApi(401, "La sesión ha caducado.");
    }

    let respuesta;

    try {
        respuesta = await fetch("/api/admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ accion, ...datos })
        });
    } catch {
        throw new ErrorApi(0, "No se pudo conectar con el servidor.");
    }

    let cuerpo = {};

    try {
        cuerpo = await respuesta.json();
    } catch {
        // Respuesta sin JSON: se informa con el estado HTTP.
    }

    if (!respuesta.ok) {

        if (respuesta.status === 401) {
            document.dispatchEvent(new CustomEvent("admin:sesion-caducada"));
        }

        throw new ErrorApi(respuesta.status, cuerpo.error || `Error ${respuesta.status}`);
    }

    return cuerpo;
}

//////////////////////////////////////////////////////
// FORMATO Y SEGURIDAD DE PLANTILLAS
//////////////////////////////////////////////////////

// Todo dato procedente de la base de datos se escapa antes de llegar a innerHTML.
function esc(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function urlSegura(valor) {
    const url = String(valor ?? "").trim();
    return /^https:\/\//i.test(url) ? url : "";
}

function euro(valor) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fechaCorta(valor) {
    if (!valor) return "—";
    const texto = String(valor);
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(texto);
    const fecha = new Date(soloFecha ? `${texto}T12:00:00` : texto);
    if (Number.isNaN(fecha.getTime())) return esc(texto);
    return fecha.toLocaleDateString("es-ES", {
        day: "2-digit", month: "short", year: "numeric",
        ...(soloFecha ? {} : { hour: "2-digit", minute: "2-digit" })
    });
}

const ESTADO_CLASES = {
    "Pendiente de pago": "bg-amber-100 text-amber-800 border-amber-200",
    "Pendiente de asignación": "bg-blue-100 text-blue-800 border-blue-200",
    "Transportista asignado": "bg-violet-100 text-violet-800 border-violet-200",
    "Completada": "bg-green-100 text-green-800 border-green-200",
    "Cancelada por cliente": "bg-slate-200 text-slate-700 border-slate-300",
    pendiente: "bg-amber-100 text-amber-800 border-amber-200",
    en_revision: "bg-blue-100 text-blue-800 border-blue-200",
    aprobada: "bg-green-100 text-green-800 border-green-200",
    aplicada: "bg-slate-200 text-slate-700 border-slate-300",
    rechazada: "bg-red-100 text-red-800 border-red-200",
    procesando: "bg-amber-100 text-amber-800 border-amber-200",
    completada: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200"
};

function insignia(estado) {
    const clases = ESTADO_CLASES[estado] || "bg-slate-100 text-slate-700 border-slate-200";
    const texto = String(estado ?? "—").replace(/_/g, " ");
    return `<span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${clases}">${esc(texto)}</span>`;
}

function iconos() {
    if (window.lucide) lucide.createIcons();
}

function cargando(texto = "Cargando…") {
    return `<div class="p-10 text-center text-slate-400 font-medium">${esc(texto)}</div>`;
}

function mensajeError(error) {
    return `<div class="m-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">${esc(error.message || error)}</div>`;
}

//////////////////////////////////////////////////////
// AVISOS Y DIÁLOGO DE MOTIVO
//////////////////////////////////////////////////////

function aviso(texto, tipo = "ok") {

    const contenedor = document.getElementById("avisos");
    if (!contenedor) return;

    const colores = tipo === "error"
        ? "bg-red-600"
        : tipo === "atencion" ? "bg-amber-500" : "bg-slate-900";

    const el = document.createElement("div");
    el.className = `${colores} text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg max-w-sm`;
    el.textContent = texto;
    contenedor.appendChild(el);

    setTimeout(() => el.remove(), tipo === "error" ? 7000 : 4000);
}

// Sustituye a confirm()/prompt(): pide confirmación y, si se indica, un texto.
// Devuelve el texto escrito ("" si no se pidió) o null si se cancela.
function pedirConfirmacion({ titulo, mensaje = "", etiqueta = "", obligatorio = false, textoBoton = "Confirmar", peligro = false }) {

    return new Promise(resolver => {

        const modal = document.getElementById("modal-confirmacion");
        const campo = document.getElementById("confirmacion-texto");
        const error = document.getElementById("confirmacion-error");
        const boton = document.getElementById("confirmacion-aceptar");
        const pideTexto = Boolean(etiqueta);

        document.getElementById("confirmacion-titulo").textContent = titulo;
        document.getElementById("confirmacion-mensaje").textContent = mensaje;
        document.getElementById("confirmacion-etiqueta").textContent = etiqueta;
        document.getElementById("confirmacion-bloque").classList.toggle("hidden", !pideTexto);
        error.classList.add("hidden");
        campo.value = "";
        boton.textContent = textoBoton;
        boton.className = `px-5 py-2.5 rounded-xl font-bold text-white text-sm ${peligro ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`;

        modal.classList.remove("hidden");
        if (pideTexto) campo.focus(); else boton.focus();

        const cerrar = valor => {
            modal.classList.add("hidden");
            boton.onclick = null;
            document.getElementById("confirmacion-cancelar").onclick = null;
            resolver(valor);
        };

        boton.onclick = () => {
            const texto = campo.value.trim();
            if (pideTexto && obligatorio && texto.length < 3) {
                error.textContent = "Escribe al menos 3 caracteres.";
                error.classList.remove("hidden");
                return;
            }
            cerrar(texto);
        };

        document.getElementById("confirmacion-cancelar").onclick = () => cerrar(null);
    });
}

// Evita el doble clic: deshabilita el botón mientras dura la operación.
async function conBoton(boton, tarea) {
    if (boton) boton.disabled = true;
    try {
        return await tarea();
    } finally {
        if (boton) boton.disabled = false;
    }
}
