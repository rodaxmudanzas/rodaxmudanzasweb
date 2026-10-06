const Stripe = require("stripe");

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);

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

        const sessionId = req.query.session_id;

if (!sessionId) {

    return res.status(400).json({
        error: "Falta session_id."
    });

}

        // Buscar la reserva

       const { data: reserva, error: errorReserva } = await supabase
    .from("mudanzas")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

if (errorReserva) throw errorReserva;

if (reserva) {
    return res.status(200).json(reserva);
}

// Stripe puede redirigir a confirmacion.html antes de que
// el webhook haya actualizado la reserva en Supabase.
// Recuperamos directamente la sesión de Stripe.

const session = await stripe.checkout.sessions.retrieve(sessionId);

const numeroReserva = session?.metadata?.numero_reserva;

if (!numeroReserva) {
    return res.status(404).json({
        error: "La sesión de pago no contiene número de reserva."
    });
}

const { data: reservaPorNumero, error: errorNumero } = await supabase
    .from("mudanzas")
    .select("*")
    .eq("numero_reserva", numeroReserva)
    .maybeSingle();

if (errorNumero) throw errorNumero;

if (!reservaPorNumero) {
    return res.status(404).json({
        error: "No se encontró la reserva asociada al pago."
    });
}

if (session.payment_status === "paid") {

    // Recuperamos los importes originales guardados
    // al crear la reserva.
    const importeTotal = Number(
        String(reservaPorNumero.preciototal ?? "")
            .replace("€", "")
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
    );

    const importeReserva = Number(
        String(reservaPorNumero.precioreserva ?? "")
            .replace("€", "")
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
    );

    if (
        !Number.isFinite(importeTotal) ||
        !Number.isFinite(importeReserva)
    ) {
        return res.status(500).json({
            error:
                "La reserva no contiene importes válidos para completar el pago."
        });
    }

    const importeRestante =
        Number(
            (importeTotal - importeReserva).toFixed(2)
        );

    const payload = {
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        estado: "Pendiente de asignación",
        estado_pago: "Pagado 30 % - Pendiente 70 %",
        importe_total: importeTotal,
        importe_reserva: importeReserva,
        importe_restante: importeRestante
    };

    const { data: sincronizada, error: errorSync } =
        await supabase
            .from("mudanzas")
            .update(payload)
            .eq("id", reservaPorNumero.id)
            .select("*")
            .maybeSingle();

    if (errorSync) throw errorSync;

    return res.status(200).json(
        sincronizada || {
            ...reservaPorNumero,
            ...payload
        }
    );
}

return res.status(200).json(reservaPorNumero);


        }

    catch (err) {

        console.error(err);

        return res.status(500).json({
            error: err.message
        });

    }

};