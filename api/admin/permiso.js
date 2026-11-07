const { obtenerContextoAdmin } = require("../../lib/admin-auth");

const GERENTE_GENERAL_USER_ID = "ffd55e6b-7d3e-4735-851f-636cfbf94d70";

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST" && req.method !== "GET") {
        res.setHeader("Allow", "GET, POST");
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
            mensaje: "Solo el Gerente General puede modificar permisos."
        });
    }

    if (req.method === "GET") {
        const userIdConsulta = typeof req.query?.user_id === "string" ? req.query.user_id.trim() : "";
        if (!userIdConsulta) {
            return res.status(400).json({
                ok: false,
                error: "colaborador_requerido",
                mensaje: "Indica el colaborador que deseas consultar."
            });
        }

        const { data: colaboradorConsulta, error: colaboradorConsultaError } = await contexto.adminClient
            .from("rodax_colaboradores")
            .select("user_id, perfil, estado, protegido")
            .eq("user_id", userIdConsulta)
            .maybeSingle();

        if (colaboradorConsultaError || !colaboradorConsulta || colaboradorConsulta.protegido) {
            return res.status(404).json({
                ok: false,
                error: "colaborador_no_disponible",
                mensaje: "El colaborador no existe o no está disponible."
            });
        }

        const { data: asignacionesConsulta, error: asignacionesConsultaError } = await contexto.adminClient
            .from("rodax_permisos_usuario")
            .select("permiso_id, permitido, motivo")
            .eq("user_id", userIdConsulta);

        if (asignacionesConsultaError) {
            console.error("Error consultando permisos del colaborador:", asignacionesConsultaError);
            return res.status(500).json({
                ok: false,
                error: "error_lectura_permisos",
                mensaje: "No se pudieron consultar los permisos del colaborador."
            });
        }

        const { data: plantillaConsulta, error: plantillaConsultaError } = await contexto.adminClient
            .from("rodax_asignacion_plantilla")
            .select("plantilla_id")
            .eq("user_id", userIdConsulta)
            .maybeSingle();

        if (plantillaConsultaError) {
            console.error("Error consultando plantilla del colaborador:", plantillaConsultaError);
            return res.status(500).json({
                ok: false,
                error: "error_lectura_plantilla",
                mensaje: "No se pudo consultar la plantilla del colaborador."
            });
        }

        let permisosPlantilla = [];
        if (plantillaConsulta?.plantilla_id) {
            const { data: detalle, error: detalleError } = await contexto.adminClient
                .from("rodax_plantilla_detalle_permisos")
                .select("permiso_id, permitido")
                .eq("plantilla_id", plantillaConsulta.plantilla_id);

            if (detalleError) {
                console.error("Error consultando detalle de plantilla:", detalleError);
                return res.status(500).json({
                    ok: false,
                    error: "error_lectura_plantilla",
                    mensaje: "No se pudo consultar el detalle de la plantilla."
                });
            }
            permisosPlantilla = detalle || [];
        }

        return res.status(200).json({
            ok: true,
            user_id: userIdConsulta,
            plantilla_id: plantillaConsulta?.plantilla_id || null,
            asignaciones: asignacionesConsulta || [],
            permisos_plantilla: permisosPlantilla
        });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const userId = typeof body.user_id === "string" ? body.user_id.trim() : "";
    const codigo = typeof body.codigo === "string" ? body.codigo.trim() : "";
    const permitido = body.permitido;
    const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";

    if (!userId || !codigo || typeof permitido !== "boolean" || !motivo || motivo.length > 500) {
        return res.status(400).json({
            ok: false,
            error: "datos_incompletos",
            mensaje: "Indica colaborador, permiso, autorización o denegación y motivo (máximo 500 caracteres)."
        });
    }

    if (userId === GERENTE_GENERAL_USER_ID || userId === contexto.usuario.id) {
        return res.status(403).json({
            ok: false,
            error: "cuenta_protegida",
            mensaje: "No se pueden modificar permisos de la cuenta del Gerente General."
        });
    }

    const { adminClient, usuario } = contexto;

    const { data: colaborador, error: colaboradorError } = await adminClient
        .from("rodax_colaboradores")
        .select("user_id, perfil, estado, protegido")
        .eq("user_id", userId)
        .maybeSingle();

    if (colaboradorError) {
        console.error("Error consultando colaborador para permisos:", colaboradorError);
        return res.status(500).json({
            ok: false,
            error: "error_colaborador",
            mensaje: "No se pudo verificar el colaborador."
        });
    }

    if (!colaborador || colaborador.protegido || colaborador.estado !== "activo") {
        return res.status(404).json({
            ok: false,
            error: "colaborador_no_disponible",
            mensaje: "El colaborador no existe, está suspendido o está protegido."
        });
    }

    const { data: permiso, error: permisoError } = await adminClient
        .from("rodax_permisos_catalogo")
        .select("id, grupo, accion, codigo")
        .eq("codigo", codigo)
        .eq("activo", true)
        .maybeSingle();

    if (permisoError) {
        console.error("Error consultando permiso del catálogo:", permisoError);
        return res.status(500).json({
            ok: false,
            error: "error_catalogo",
            mensaje: "No se pudo verificar el permiso."
        });
    }

    if (!permiso) {
        return res.status(404).json({
            ok: false,
            error: "permiso_no_encontrado",
            mensaje: "El permiso no existe o está inactivo."
        });
    }

    const { data: anterior, error: anteriorError } = await adminClient
        .from("rodax_permisos_usuario")
        .select("permitido, asignado_por, motivo")
        .eq("user_id", userId)
        .eq("permiso_id", permiso.id)
        .maybeSingle();

    if (anteriorError) {
        console.error("Error consultando asignación anterior:", anteriorError);
        return res.status(500).json({
            ok: false,
            error: "error_lectura_asignacion",
            mensaje: "No se pudo consultar la asignación actual."
        });
    }

    const { error: upsertError } = await adminClient
        .from("rodax_permisos_usuario")
        .upsert({
            user_id: userId,
            permiso_id: permiso.id,
            permitido,
            asignado_por: usuario.id,
            motivo,
            updated_at: new Date().toISOString()
        }, { onConflict: "user_id,permiso_id" });

    if (upsertError) {
        console.error("Error guardando permiso individual:", upsertError);
        return res.status(500).json({
            ok: false,
            error: "error_guardado_permiso",
            mensaje: "No se pudo guardar el permiso."
        });
    }

    const { error: auditoriaError } = await adminClient
        .from("rodax_auditoria_administrativa")
        .insert({
            actor_user_id: usuario.id,
            objetivo_user_id: userId,
            modulo: "equipo",
            accion: permitido ? "conceder_permiso" : "retirar_permiso",
            referencia: codigo,
            valor_anterior: anterior || null,
            valor_nuevo: { permitido, motivo },
            motivo,
            resultado: "correcto"
        });

    if (auditoriaError) {
        console.error("Error registrando auditoría de permiso:", auditoriaError);

        let rollbackError = null;
        if (anterior) {
            const rollback = await adminClient
                .from("rodax_permisos_usuario")
                .update({
                    permitido: anterior.permitido,
                    asignado_por: anterior.asignado_por,
                    motivo: anterior.motivo
                })
                .eq("user_id", userId)
                .eq("permiso_id", permiso.id);
            rollbackError = rollback.error;
        } else {
            const rollback = await adminClient
                .from("rodax_permisos_usuario")
                .delete()
                .eq("user_id", userId)
                .eq("permiso_id", permiso.id);
            rollbackError = rollback.error;
        }

        if (rollbackError) {
            console.error("ATENCIÓN: no se pudo revertir el permiso sin auditoría:", rollbackError);
        }

        return res.status(500).json({
            ok: false,
            error: "error_auditoria_permiso",
            mensaje: "No se pudo registrar la auditoría. La operación se ha revertido; verifica los permisos antes de repetirla."
        });
    }

    return res.status(200).json({
        ok: true,
        mensaje: permitido ? "Permiso concedido." : "Permiso retirado.",
        user_id: userId,
        codigo,
        permitido
    });
};
