const { obtenerContextoAdmin } = require("../../lib/admin-auth");

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
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

    // La gestión global del equipo queda reservada al Gerente General protegido.
    if (!contexto.esGerenteGeneralProtegido) {
        return res.status(403).json({
            ok: false,
            error: "solo_gerente_general",
            mensaje: "Solo el Gerente General puede gestionar el equipo y consultar el listado global."
        });
    }

    const { data: colaboradores, error: colaboradoresError } = await contexto.adminClient
        .from("rodax_colaboradores")
        .select("user_id, perfil, departamento, equipo, estado, protegido, creado_por, creado_at, actualizado_at")
        .order("creado_at", { ascending: false });

    if (colaboradoresError) {
        console.error("Error consultando equipo RODAX:", colaboradoresError);
        return res.status(500).json({
            ok: false,
            error: "error_equipo",
            mensaje: "No se pudo cargar el equipo."
        });
    }

    const { data: usuariosAuth, error: usuariosError } = await contexto.adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });

    if (usuariosError) {
        console.error("Error consultando usuarios Auth:", usuariosError);
        return res.status(500).json({
            ok: false,
            error: "error_usuarios_auth",
            mensaje: "No se pudieron consultar las cuentas de acceso."
        });
    }

    const usuariosPorId = new Map(
        (usuariosAuth.users || []).map(usuario => [usuario.id, usuario])
    );

    const equipo = (colaboradores || []).map(colaborador => {
        const usuarioAuth = usuariosPorId.get(colaborador.user_id);
        return {
            ...colaborador,
            email: usuarioAuth?.email || null,
            ultimo_acceso: usuarioAuth?.last_sign_in_at || null,
            email_confirmado: Boolean(usuarioAuth?.email_confirmed_at)
        };
    });

    const { data: permisos, error: permisosError } = await contexto.adminClient
        .from("rodax_permisos_catalogo")
        .select("id, grupo, accion, codigo, descripcion")
        .eq("activo", true)
        .order("grupo", { ascending: true })
        .order("id", { ascending: true });

    if (permisosError) {
        console.error("Error consultando catálogo de permisos:", permisosError);
        return res.status(500).json({
            ok: false,
            error: "error_catalogo_permisos",
            mensaje: "No se pudo cargar el catálogo de permisos."
        });
    }

    return res.status(200).json({
        ok: true,
        equipo,
        permisos: permisos || []
    });
};
