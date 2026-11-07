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

        const GERENTE_GENERAL_USER_ID = "ffd55e6b-7d3e-4735-851f-636cfbf94d70";
        const esGerenteGeneralProtegido =
            usuario.id === GERENTE_GENERAL_USER_ID &&
            colaborador.perfil === "gerente_general" &&
            colaborador.protegido === true;

        // La protección está vinculada a la identidad exacta verificada en Auth,
        // no solo a una marca editable en la tabla de colaboradores.
        if (
            (colaborador.protegido === true && !esGerenteGeneralProtegido) ||
            (usuario.id === GERENTE_GENERAL_USER_ID && !esGerenteGeneralProtegido)
        ) {
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
            const permisosBase = new Set();

            // 1. Permisos heredados de la plantilla asignada, si existe.
            const { data: asignacionPlantilla, error: plantillaError } = await adminClient
                .from("rodax_asignacion_plantilla")
                .select("plantilla_id")
                .eq("user_id", usuario.id)
                .maybeSingle();

            if (plantillaError) {
                console.error("Error consultando plantilla del colaborador:", plantillaError);
                return responderError(500, "error_plantilla", "No se pudo verificar la plantilla de permisos.");
            }

            if (asignacionPlantilla?.plantilla_id) {
                const { data: detallePlantilla, error: detalleError } = await adminClient
                    .from("rodax_plantilla_detalle_permisos")
                    .select("permiso_id, permitido")
                    .eq("plantilla_id", asignacionPlantilla.plantilla_id)
                    .eq("permitido", true);

                if (detalleError) {
                    console.error("Error consultando permisos de plantilla:", detalleError);
                    return responderError(500, "error_plantilla", "No se pudieron cargar los permisos de la plantilla.");
                }

                const idsPlantilla = (detallePlantilla || []).map(item => item.permiso_id);
                if (idsPlantilla.length) {
                    const { data: catalogoPlantilla, error: catalogoPlantillaError } = await adminClient
                        .from("rodax_permisos_catalogo")
                        .select("id, codigo")
                        .in("id", idsPlantilla)
                        .eq("activo", true);

                    if (catalogoPlantillaError) {
                        console.error("Error consultando catálogo de plantilla:", catalogoPlantillaError);
                        return responderError(500, "error_permisos", "No se pudieron cargar los permisos de la plantilla.");
                    }

                    for (const item of catalogoPlantilla || []) {
                        permisosBase.add(item.codigo);
                    }
                }
            }

            // 2. Las asignaciones individuales prevalecen sobre la plantilla,
            // tanto para conceder como para denegar un permiso.
            const { data: asignaciones, error: asignacionesError } = await adminClient
                .from("rodax_permisos_usuario")
                .select("permiso_id, permitido")
                .eq("user_id", usuario.id);

            if (asignacionesError) {
                console.error("Error consultando permisos individuales:", asignacionesError);
                return responderError(500, "error_permisos", "No se pudieron verificar los permisos.");
            }

            const idsIndividuales = (asignaciones || []).map(item => item.permiso_id);
            if (idsIndividuales.length) {
                const { data: catalogoIndividual, error: catalogoIndividualError } = await adminClient
                    .from("rodax_permisos_catalogo")
                    .select("id, codigo")
                    .in("id", idsIndividuales)
                    .eq("activo", true);

                if (catalogoIndividualError) {
                    console.error("Error consultando catálogo individual:", catalogoIndividualError);
                    return responderError(500, "error_permisos", "No se pudieron cargar las asignaciones individuales.");
                }

                const codigoPorId = new Map((catalogoIndividual || []).map(item => [item.id, item.codigo]));
                for (const asignacion of asignaciones || []) {
                    const codigo = codigoPorId.get(asignacion.permiso_id);
                    if (!codigo) continue;
                    if (asignacion.permitido === true) permisosBase.add(codigo);
                    else permisosBase.delete(codigo);
                }
            }

            permisos = Array.from(permisosBase);
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
