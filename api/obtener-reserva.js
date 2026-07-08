
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Método no permitido."
        });
    }

    try {

        const numeroReserva = req.query.reserva;

if (!numeroReserva) {

    return res.status(400).json({
        error: "Falta el número de reserva."
    });

}

        // Buscar la reserva

        const { data, error } = await supabase

            .from("mudanzas")

            .select("*")

            .eq("numero_reserva", numeroReserva)

            .single();

        if (error) throw error;

        return res.status(200).json(data);

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            error: err.message

        });

    }

};