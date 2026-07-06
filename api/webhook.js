const Stripe = require("stripe");
const { buffer } = require("micro");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(

    process.env.SUPABASE_URL,

    process.env.SUPABASE_SERVICE_ROLE_KEY

);

export const config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async (req, res) => {

    console.log("======== WEBHOOK NUEVO =========");
    console.log(typeof req.body);

    if (req.method !== "POST") {
        return res.status(405).send("Método no permitido");
    }

    const signature = req.headers["stripe-signature"];

const buf = await buffer(req);

try {

    const event = stripe.webhooks.constructEvent(
            buf,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("EVENTO RECIBIDO");

console.log(event.type);

console.log(event.data.object.metadata);

        if (event.type === "checkout.session.completed") {

    console.log("✅ Pago recibido");

    console.log(event.data.object);

    const session = event.data.object;

    const data = session.metadata;

    if (!data) {

    console.log("NO HAY METADATA");

    return res.json({
        ok: false,
        mensaje: "Sin metadata"
    });

}

    const importeTotal = parseFloat(
        data.preciototal.replace("€", "").replace(",", ".")
    );

    const importeReserva = parseFloat(
        data.precioreserva.replace("€", "").replace(",", ".")
    );

    const importeRestante =
        importeTotal - importeReserva;

    const fechaPago = new Date();

    const fechaCobro70 = new Date(data.fecha);

    fechaCobro70.setHours(7);
    fechaCobro70.setMinutes(0);
    fechaCobro70.setSeconds(0);

    const { error } = await supabase
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
.eq("numero_reserva", data.numero_reserva);

if (error) {

    console.error("Error Supabase:", error);

    throw error;

}

console.log("✅ Reserva actualizada correctamente");

}

        return res.json({
            received: true
        });

    } catch (err) {

        console.error(err.message);

        return res.status(400).send(`Webhook Error: ${err.message}`);

    }

};