// Arranque del Área Administración: inicio de sesión, navegación y vistas.

const VISTAS = {
    dashboard: { titulo: "Panel general", icono: "layout-dashboard", permiso: "leer_expedientes", vista: VistaDashboard },
    expedientes: { titulo: "Expedientes", icono: "folder-open", permiso: "leer_expedientes", vista: VistaExpedientes },
    solicitudes: { titulo: "Solicitudes", icono: "inbox", permiso: "leer_solicitudes", vista: VistaSolicitudes },
    transportistas: { titulo: "Transportistas", icono: "truck", permiso: "leer_transportistas", vista: VistaTransportistas },
    finanzas: { titulo: "Finanzas", icono: "wallet", permiso: "leer_finanzas", vista: VistaFinanzas },
    auditoria: { titulo: "Auditoría", icono: "history", permiso: "leer_auditoria", vista: VistaAuditoria }
};

const NOMBRES_ROL = {
    superadmin: "Superadministrador",
    operaciones: "Operaciones",
    finanzas: "Finanzas",
    soporte: "Soporte"
};

let vistaActual = null;

const pantallaLogin = document.getElementById("login-screen");
const aplicacion = document.getElementById("app");
const errorLogin = document.getElementById("login-error");

function mostrarErrorLogin(texto) {
    errorLogin.textContent = texto;
    errorLogin.classList.remove("hidden");
}

//////////////////////////////////////////////////////
// SESIÓN
//////////////////////////////////////////////////////

async function entrar() {

    // El servidor decide si la cuenta es de administración; esto solo prepara la interfaz.
    const r = await api("sesion");

    sesionAdmin.admin = r.admin;
    sesionAdmin.permisos = r.permisos;

    document.getElementById("usuario-nombre").textContent = r.admin.nombre;
    document.getElementById("usuario-rol").textContent = NOMBRES_ROL[r.admin.rol] || r.admin.rol;

    const visibles = Object.entries(VISTAS).filter(([, v]) => puede(v.permiso));

    document.getElementById("menu").innerHTML = visibles.map(([clave, v]) => `
        <button type="button" data-vista="${clave}" onclick="irAVista('${clave}')"
            class="menu-item w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <i data-lucide="${v.icono}" class="w-4 h-4"></i> ${esc(v.titulo)}
        </button>`).join("");

    pantallaLogin.classList.add("hidden");
    aplicacion.classList.remove("hidden");
    iconos();

    const deseada = location.hash.replace("#", "");
    irAVista(visibles.some(([clave]) => clave === deseada) ? deseada : (visibles[0]?.[0] || "dashboard"));
}

async function cerrarSesion() {
    await dbAdmin.auth.signOut();
    sesionAdmin.admin = null;
    sesionAdmin.permisos = [];
    aplicacion.classList.add("hidden");
    document.getElementById("ficha").classList.add("hidden");
    pantallaLogin.classList.remove("hidden");
    document.getElementById("admin-password").value = "";
}

document.addEventListener("admin:sesion-caducada", async () => {
    await cerrarSesion();
    mostrarErrorLogin("La sesión ha caducado. Vuelve a iniciar sesión.");
});

document.getElementById("admin-login-form").addEventListener("submit", async evento => {

    evento.preventDefault();
    errorLogin.classList.add("hidden");

    const boton = document.getElementById("btn-login");
    const email = document.getElementById("admin-email").value.trim();
    const clave = document.getElementById("admin-password").value;

    await conBoton(boton, async () => {

        const { error } = await dbAdmin.auth.signInWithPassword({ email, password: clave });

        if (error) {
            mostrarErrorLogin("Email o contraseña incorrectos.");
            return;
        }

        try {
            await entrar();
        } catch (fallo) {
            await dbAdmin.auth.signOut();
            mostrarErrorLogin(fallo.status === 403
                ? "Esta cuenta no tiene acceso a Administración."
                : fallo.message);
        }
    });
});

//////////////////////////////////////////////////////
// NAVEGACIÓN
//////////////////////////////////////////////////////

function irAVista(clave) {

    const definicion = VISTAS[clave];
    if (!definicion || !puede(definicion.permiso)) return;

    vistaActual = clave;
    location.hash = clave;

    document.querySelectorAll(".menu-item").forEach(boton => {
        const activo = boton.dataset.vista === clave;
        boton.classList.toggle("bg-blue-600", activo);
        boton.classList.toggle("text-white", activo);
        boton.classList.toggle("text-slate-300", !activo);
    });

    document.getElementById("barra-lateral").classList.remove("abierta");
    cerrarFicha();
    definicion.vista.montar(document.getElementById("vista"));
}

function refrescarVistaActual() {
    if (!vistaActual) return;
    const vista = VISTAS[vistaActual].vista;
    // Los filtros del listado se conservan: solo se vuelve a pedir la tabla.
    if (vista === VistaExpedientes) vista.cargar();
    else vista.montar(document.getElementById("vista"));
}

document.getElementById("btn-refrescar").addEventListener("click", refrescarVistaActual);
document.getElementById("btn-salir").addEventListener("click", cerrarSesion);
document.getElementById("btn-menu").addEventListener("click", () =>
    document.getElementById("barra-lateral").classList.toggle("abierta"));
document.getElementById("ficha-fondo").addEventListener("click", cerrarFicha);
document.getElementById("ficha-cerrar").addEventListener("click", cerrarFicha);

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && document.getElementById("modal-confirmacion").classList.contains("hidden")) {
        cerrarFicha();
    }
});

//////////////////////////////////////////////////////
// ARRANQUE
//////////////////////////////////////////////////////

(async function iniciar() {

    iconos();

    const { data } = await dbAdmin.auth.getSession();
    if (!data?.session) return;

    try {
        await entrar();
    } catch (error) {
        await dbAdmin.auth.signOut();
        mostrarErrorLogin(error.status === 403
            ? "Esta cuenta no tiene acceso a Administración."
            : error.message);
    }
})();
