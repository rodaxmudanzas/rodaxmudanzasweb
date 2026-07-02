const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(

    process.env.SUPABASE_URL,

    process.env.SUPABASE_SERVICE_ROLE_KEY

);

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).send("Método no permitido");
    }

    const signature = req.headers["stripe-signature"];

    try {

        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        if (event.type === "checkout.session.completed") {

    console.log("✅ Pago recibido");

    console.log(event.data.object);

    const session = event.data.object;

    const data = session.metadata;

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
    .insert({

        numero_reserva: data.numero_reserva,

        nombre: data.nombre,

        telefono: data.telefono,

        email: data.email,

        origen: data.origen,

        destino: data.destino,

        km: Number(data.km),

        fecha: data.fecha,

        volumen: data.volumen,

        ascensor: data.ascensor,

        extras: data.extras,

        observaciones: data.observaciones,

        tipo_servicio: data.tipo_servicio,

        preciototal: data.preciototal,

        precioreserva: data.precioreserva,

        stripe_session_id: session.id,

        stripe_payment_intent: session.payment_intent,

        estado: "Pendiente de asignación",
        
        transportista_id: null,

        estado_pago: "Pagado 30 % - Pendiente 70 %",

        fecha_pago_30: fechaPago,

        fecha_cobro_70: fechaCobro70,

        importe_total: importeTotal,

        importe_reserva: importeReserva,

        importe_restante: importeRestante,

        urls_fotos: data.urls_fotos

    });

if (error) {

    console.error("Error Supabase:", error);

    throw error;

}

console.log("✅ Reserva guardada correctamente");

}

        return res.json({
            received: true
        });

    } catch (err) {

        console.error(err.message);

        return res.status(400).send(`Webhook Error: ${err.message}`);

    }

};