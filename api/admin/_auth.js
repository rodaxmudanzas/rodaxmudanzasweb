const { createClient } = require("@supabase/supabase-js");

function crearClientesSupabase() {
    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !publishableKey || !serviceRoleKey) {
        throw new Error("Faltan variables de entorno de Supabase para el módulo administrativo.");
    }

    const authClient = createClient(url, publishableKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    });

    const adminClient = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    });

    return { authClient, adminClient };
}

function responderError(status, codigo, mensaje) {
    return { ok: false, status, error: codigo, mensaje };
}

/**
 * Obtiene y valida la identidad administrativa desde el JWT de Supabase.
 * Nunca confía en user_metadata, localStorage ni en el rol enviado por el navegador.
 */
async function obtenerContextoAdmin(req) {
    try {
        const authorization = req.headers.authorization || req.headers.Authorization || "";
        const coincidencia = authorization.match(/^Bearer\s+(.+)$/i);

        if (!coincidencia) {
            return responderError(401, "no_autenticado", "Debes iniciar sesión.");
        }

        const { authClient, adminClient } = crearClientesSupabase();
        const { data: authData, error: authError } = await authClient.auth.getUser(coincidencia[1]);

        if (authError || !authData?.user) {
            return responderError(401, "sesion_no_valida", "La sesión no es válida o ha caducado.");
        }

        const usuario = authData.user;

        const { data: colaborador, error: colaboradorError } = await adminClient
            .from("rodax_colaboradores")
            .select("user_id, perfil, departamento, equipo, estado, protegido")
            .eq("user_id", usuario.id)
            .maybeSingle();

        if (colaboradorError) {
            console.error("Error consultando colaborador administrativo:", colaboradorError);
            return responderError(500, "error_perfil", "No se pudo verificar el perfil administrativo.");
        }

        if (!colaborador || colaborador.estado !== "activo") {
            return responderError(403, "cuenta_no_autorizada", "La cuenta no está habilitada para el panel administrativo.");
        }

        const esGerenteGeneralProtegido =
            colaborador.perfil === "gerente_general" &&
            colaborador.protegido === true;

        // Una cuenta marcada como protegida con un perfil distinto al Gerente General
        // se considera una inconsistencia y no recibe privilegios.
        if (colaborador.protegido === true && !esGerenteGeneralProtegido) {
            return responderError(403, "perfil_protegido_invalido", "La configuración de esta cuenta requiere revisión.");
        }

        let permisos = [];

        if (esGerenteGeneralProtegido) {
            const { data: catalogo, error: catalogoError } = await adminClient
                .from("rodax_permisos_catalogo")
                .select("codigo")
                .eq("activo", true);

            if (catalogoError) {
                console.error("Error consultando catálogo administrativo:", catalogoError);
                return responderError(500, "error_permisos", "No se pudieron cargar los permisos.");
            }

            permisos = (catalogo || []).map(item => item.codigo);
        } else {
            const { data: asignaciones, error: asignacionesError } = await adminClient
                .from("rodax_permisos_usuario")
                .select("permiso_id")
                .eq("user_id", usuario.id)
                .eq("permitido", true);

            if (asignacionesError) {
                console.error("Error consultando permisos individuales:", asignacionesError);
                return responderError(500, "error_permisos", "No se pudieron verificar los permisos.");
            }

            const ids = (asignaciones || []).map(item => item.permiso_id);

            if (ids.length) {
                const { data: catalogo, error: catalogoError } = await adminClient
                    .from("rodax_permisos_catalogo")
                    .select("codigo")
                    .in("id", ids)
                    .eq("activo", true);

                if (catalogoError) {
                    console.error("Error consultando catálogo de permisos:", catalogoError);
                    return responderError(500, "error_permisos", "No se pudieron cargar los permisos.");
                }

                permisos = (catalogo || []).map(item => item.codigo);
            }
        }

        return {
            ok: true,
            adminClient,
            usuario: {
                id: usuario.id,
                email: usuario.email || null
            },
            colaborador,
            esGerenteGeneralProtegido,
            permisos
        };
    } catch (error) {
        console.error("Error interno de autorización administrativa:", error);
        return responderError(500, "error_autorizacion", "No se pudo verificar la autorización.");
    }
}

async function exigirPermisoAdmin(req, codigoPermiso) {
    const contexto = await obtenerContextoAdmin(req);

    if (!contexto.ok) {
        return contexto;
    }

    if (
        contexto.esGerenteGeneralProtegido ||
        contexto.permisos.includes(codigoPermiso)
    ) {
        return contexto;
    }

    return responderError(403, "permiso_insuficiente", "No tienes autorización para realizar esta acción.");
}

module.exports = {
    obtenerContextoAdmin,
    exigirPermisoAdmin
};
