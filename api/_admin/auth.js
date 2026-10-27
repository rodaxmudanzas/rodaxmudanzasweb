// Autenticación del Área Administración.
// El token lo emite Supabase Auth; la pertenencia a la tabla
// "administradores" (y que esté activa) es lo que concede el acceso.

class ErrorAdmin extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

async function autenticarAdmin(req, supabase) {

    const autorizacion = req.headers.authorization || "";

    if (!autorizacion.startsWith("Bearer ")) {
        throw new ErrorAdmin(401, "No autenticado.");
    }

    const { data: userData, error: userError } =
        await supabase.auth.getUser(autorizacion.slice(7));

    if (userError || !userData?.user) {
        throw new ErrorAdmin(401, "Sesión no válida.");
    }

    const { data: admin, error: adminError } = await supabase
        .from("administradores")
        .select("id, email, nombre, rol, activo")
        .eq("id", userData.user.id)
        .maybeSingle();

    if (adminError) {
        console.error("Admin: error consultando administradores:", adminError.message);
        throw new ErrorAdmin(500, "No se pudo comprobar el acceso de administración.");
    }

    if (!admin || !admin.activo) {
        throw new ErrorAdmin(403, "Esta cuenta no tiene acceso a Administración.");
    }

    return admin;
}

module.exports = { ErrorAdmin, autenticarAdmin };
