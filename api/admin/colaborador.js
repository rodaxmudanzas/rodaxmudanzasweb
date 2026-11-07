const { obtenerContextoAdmin } = require("../../lib/admin-auth");

const PERFILES_PERMITIDOS = new Set(["administrador", "supervisor", "operario"]);
const DEPARTAMENTOS_PERMITIDOS = new Set([
    "Operaciones",
    "Marketplace",
    "Atención al Cliente",
    "Transportistas",
    "Flota y Documentación",
    "Finanzas",
    "Administración",
    "Tecnología y Sistemas"
]);

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({
            ok: false,
            error: "metodo_no_permitido",
            mensaje: "Método no permitido."
        });
    }

    const contexto = await obtenerContextoAdmin(req);
    if (!contexto.ok) {
        return res.status(contexto.status).json({
            ok: false,
            error: contexto.error,
            mensaje: contexto.mensaje
        });
    }

    if (!contexto.esGerenteGeneralProtegido) {
        return res.status(403).json({
            ok: false,
            error: "solo_gerente_general",
            mensaje: "Solo el Gerente General puede incorporar colaboradores."
        });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const perfil = typeof body.perfil === "string" ? body.perfil.trim() : "";
    const departamento = typeof body.departamento === "string" ? body.departamento.trim() : "";
    const equipo = typeof body.equipo === "string" ? body.equipo.trim() : null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            ok: false,
            error: "email_invalido",
            mensaje: "Introduce un correo electrónico válido."
        });
    }

    if (!PERFILES_PERMITIDOS.has(perfil)) {
        return res.status(400).json({
            ok: false,
            error: "perfil_invalido",
            mensaje: "El perfil debe ser Administrador, Supervisor u Operario."
        });
    }

    if (!DEPARTAMENTOS_PERMITIDOS.has(departamento)) {
        return res.status(400).json({
            ok: false,
            error: "departamento_invalido",
            mensaje: "Selecciona un departamento válido."
        });
    }

    if (equipo && (equipo.length > 100 || /[<>]/.test(equipo))) {
        return res.status(400).json({
            ok: false,
            error: "equipo_invalido",
            mensaje: "El nombre del equipo no es válido."
        });
    }

    const { adminClient, usuario } = contexto;

    // Esta primera versión vincula cuentas que ya existen en Supabase Auth.
    // No crea contraseñas ni envía invitaciones hasta configurar el correo corporativo.
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });

    if (authError) {
        console.error("Error buscando cuenta Auth para incorporar:", authError);
        return res.status(500).json({
            ok: false,
            error: "error_busqueda_auth",
            mensaje: "No se pudo comprobar la cuenta de acceso."
        });
    }

    const coincidencias = (authData.users || []).filter(
        item => (item.email || "").toLowerCase() === email
    );

    if (coincidencias.length !== 1) {
        return res.status(404).json({
            ok: false,
            error: "cuenta_auth_no_encontrada",
            mensaje: "No existe una cuenta única con ese correo en Supabase Auth. La creación de cuentas nuevas se habilitará al configurar las invitaciones."
        });
    }

    const cuenta = coincidencias[0];

    if (cuenta.id === usuario.id) {
        return res.status(400).json({
            ok: false,
            error: "no_puede_asignarse_a_si_mismo",
            mensaje: "No puedes crear una asignación de colaborador sobre tu propia cuenta."
        });
    }

    const GERENTE_GENERAL_USER_ID = "ffd55e6b-7d3e-4735-851f-636cfbf94d70";
    if (cuenta.id === GERENTE_GENERAL_USER_ID) {
        return res.status(403).json({
            ok: false,
            error: "cuenta_gerente_protegida",
            mensaje: "La cuenta protegida del Gerente General no puede modificarse desde esta operación."
        });
    }

    const { data: existente, error: existenteError } = await adminClient
        .from("rodax_colaboradores")
        .select("user_id")
        .eq("user_id", cuenta.id)
        .maybeSingle();

    if (existenteError) {
        console.error("Error comprobando colaborador existente:", existenteError);
        return res.status(500).json({
            ok: false,
            error: "error_comprobacion_colaborador",
            mensaje: "No se pudo comprobar si la cuenta ya pertenece al equipo."
        });
    }

    if (existente) {
        return res.status(409).json({
            ok: false,
            error: "colaborador_ya_registrado",
            mensaje: "Esta cuenta ya está registrada como colaborador."
        });
    }

    const nuevoColaborador = {
        user_id: cuenta.id,
        perfil,
        departamento,
        equipo: equipo || null,
        estado: "activo",
        protegido: false,
        creado_por: usuario.id
    };

    const { error: insertError } = await adminClient
        .from("rodax_colaboradores")
        .insert(nuevoColaborador);

    if (insertError) {
        console.error("Error creando colaborador RODAX:", insertError);
        return res.status(500).json({
            ok: false,
            error: "error_alta_colaborador",
            mensaje: "No se pudo incorporar el colaborador."
        });
    }

    const { error: auditoriaError } = await adminClient
        .from("rodax_auditoria_administrativa")
        .insert({
            actor_user_id: usuario.id,
            objetivo_user_id: cuenta.id,
            modulo: "equipo",
            accion: "crear_colaborador",
            referencia: email,
            valor_anterior: null,
            valor_nuevo: {
                perfil,
                departamento,
                equipo: equipo || null,
                estado: "activo",
                permisos_iniciales: []
            },
            motivo: "Alta de colaborador por el Gerente General",
            resultado: "correcto"
        });

    if (auditoriaError) {
        console.error("Error registrando auditoría de alta:", auditoriaError);
        const { error: rollbackError } = await adminClient
            .from("rodax_colaboradores")
            .delete()
            .eq("user_id", cuenta.id);

        if (rollbackError) {
            console.error("ATENCIÓN: no se pudo revertir el alta sin auditoría:", rollbackError);
        }

        return res.status(500).json({
            ok: false,
            error: "error_auditoria_alta",
            mensaje: "No se pudo registrar la auditoría. La operación se ha cancelado; comprueba el equipo antes de repetirla."
        });
    }

    return res.status(201).json({
        ok: true,
        mensaje: "Colaborador incorporado. No se han asignado permisos por defecto.",
        colaborador: {
            user_id: cuenta.id,
            email: cuenta.email,
            perfil,
            departamento,
            equipo: equipo || null,
            estado: "activo",
            permisos: []
        }
    });
};
