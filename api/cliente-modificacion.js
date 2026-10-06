const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        error:"Método no permitido."
      });
  }

  try {

    const auth =
      req.headers.authorization || "";

    if (!auth.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({
          error:"No autenticado."
        });
    }

    const token =
      auth.slice(7);

    const {
      data: userData,
      error: userError
    } =
      await supabase.auth.getUser(token);

    if (
      userError ||
      !userData?.user?.email
    ) {
      return res
        .status(401)
        .json({
          error:"Sesión no válida."
        });
    }

    const {
      mudanza_id,
      cambios
    } = req.body || {};

    if (
      !mudanza_id ||
      !cambios ||
      typeof cambios !== "object"
    ) {
      return res
        .status(400)
        .json({
          error:"Faltan datos de la solicitud."
        });
    }

    const email =
      userData.user.email
        .trim()
        .toLowerCase();

    const {
      data: reserva,
      error: reservaError
    } =
      await supabase
        .from("mudanzas")
        .select(
          "id,numero_reserva,email,estado"
        )
        .eq(
          "id",
          mudanza_id
        )
        .ilike(
          "email",
          email
        )
        .maybeSingle();

    if (reservaError) {
      throw reservaError;
    }

    if (!reserva) {
      return res
        .status(404)
        .json({
          error:
            "La reserva no pertenece a esta cuenta."
        });
    }

    const {
      data,
      error
    } =
      await supabase
        .from("solicitudes_modificacion")
        .insert({

          mudanza_id:
            reserva.id,

          numero_reserva:
            reserva.numero_reserva,

          email_cliente:
            email,

          cambios,

          estado:
            "pendiente"
        })

        .select(
          "id,created_at,estado"
        )

        .single();

    if (error) {
      throw error;
    }

    return res
      .status(201)
      .json({
        ok:true,
        solicitud:data
      });

  } catch (error) {

    console.error(
      "cliente-modificacion:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          "No se pudo registrar la solicitud de modificación."
      });
  }
};