const Stripe = require("stripe");
const { buffer } = require("micro");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports.config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async function (req, res) {

    console.log("========================================");
    console.log("WEBHOOK INICIADO");
    console.log("Método:", req.method);
    console.log("========================================");

    if (req.method !== "POST") {
        console.log("Método no permitido");
        return res.status(405).send("Método no permitido");
    }

    try {

        const signature = req.headers["stripe-signature"];

        if (!signature) {
            console.error("Falta Stripe-Signature");
            return res.status(400).send("Sin firma Stripe");
        }

        const buf = await buffer(req);

        console.log("Body recibido");

        const event = stripe.webhooks.constructEvent(
            buf,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("Evento verificado correctamente");
        console.log("Tipo:", event.type);

        if (event.type !== "checkout.session.completed") {

            console.log("Evento ignorado");

            return res.json({
                received: true
            });

        }

        console.log("Pago completado");

        const session = event.data.object;

        console.log("SESSION COMPLETA");
console.log(session);

        console.log("SESSION ID:", session.id);

        console.log("Metadata:");
        console.log(session.metadata);

        if (!session.metadata) {

            console.error("La metadata viene vacía");

            return res.status(400).json({
                error: "Metadata vacía"
            });

        }

        const data = session.metadata;

        const numeroReserva = data.numero_reserva;

        if (!numeroReserva) {

            console.error("numero_reserva no existe");

            return res.status(400).json({
                error: "numero_reserva inexistente"
            });

        }

        console.log("Reserva:", numeroReserva);

        const importeTotal = Number(
            String(data.preciototal)
                .replace("€", "")
                .replace(",", ".")
                .trim()
        );

        const importeReserva = Number(
            String(data.precioreserva)
                .replace("€", "")
                .replace(",", ".")
                .trim()
        );

        const importeRestante = importeTotal - importeReserva;

        console.log("Importe total:", importeTotal);
        console.log("Reserva:", importeReserva);
        console.log("Pendiente:", importeRestante);

        const fechaPago = new Date();

        const fechaCobro70 = new Date(data.fecha);

        fechaCobro70.setHours(7);
        fechaCobro70.setMinutes(0);
        fechaCobro70.setSeconds(0);
        fechaCobro70.setMilliseconds(0);

        console.log("Actualizando Supabase...");

        console.log("================================");

console.log("numeroReserva:", numeroReserva);
console.log("session.id:", session.id);
console.log("payment_intent:", session.payment_intent);
console.log("metadata completa:");
console.log(session.metadata);
console.log("================================");

const { data: updateData, error } = await supabase
            .from("mudanzas")
            .update({

                stripe_session_id: session.id,

                stripe_payment_intent: session.payment_intent,

                estado: "Pendiente de asignación",

                estado_pago: "Pagado 30 % - Pendiente 70 %",

                fecha_pago_30: fechaPago,

                fecha_cobro_70: fechaCobro70,

                importe_total: importeTotal,

                importe_reserva: importeReserva,

                importe_restante: importeRestante

            })
            .eq("numero_reserva", numeroReserva)
            .select();

            console.log("Filas actualizadas:");
console.log(updateData);
console.log("Cantidad:");
console.log(updateData.length);

        if (error) {

            console.error("ERROR SUPABASE:");

            console.error(error);

            throw error;

        }

        console.log("Resultado actualización:");

        console.log(updateData);

        console.log("WEBHOOK FINALIZADO CORRECTAMENTE");

        return res.status(200).json({
            received: true
        });

    } catch (err) {

        console.error("================================");
        console.error("ERROR EN WEBHOOK");
        console.error(err);
        console.error(err.stack);
        console.error("================================");

        return res.status(500).json({

            error: err.message,

            stack: err.stack

        });

    }

};