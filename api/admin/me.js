const { obtenerContextoAdmin } = require("./_auth");

module.exports = async function handler(req, res) {
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

    return res.status(200).json({
        ok: true,
        usuario: contexto.usuario,
        colaborador: contexto.colaborador,
        esGerenteGeneralProtegido: contexto.esGerenteGeneralProtegido,
        permisos: contexto.permisos
    });
};
