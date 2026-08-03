const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {

    try {

        const {

    nombre,
    email,
    telefono,
    importe,
    numero_reserva

} = req.body;

//////////////////////////////////////////////////////
// VALIDACIONES
//////////////////////////////////////////////////////

if (!nombre || !email || !telefono) {

    return res.status(400).json({

        error: "Faltan datos obligatorios."

    });

}

if (!importe || importe <= 0) {

    return res.status(400).json({

        error: "Importe inválido."

    });

}

console.log("================================");
console.log("CREATE CHECKOUT");
console.log("SUCCESS URL:");
console.log(
"https://rodaxmudanzasweb.vercel.app/confirmacion.html?session_id={CHECKOUT_SESSION_ID}"
);
console.log("================================");

const session = await stripe.checkout.sessions.create({

            payment_method_types: ["card"],

            mode: "payment",

            customer_email: email,

           metadata: {

    numero_reserva: numero_reserva,

    nombre,
    email,
    telefono,

    importe: importe.toString(),

    origen: req.body.origen || "",
    destino: req.body.destino || "",
    km: (req.body.km || "").toString(),

    fecha: req.body.fecha || "",

    volumen: req.body.volumen || "",

    ascensor: req.body.ascensor || "",

    extras: req.body.extras || "",

    observaciones: req.body.observaciones || "",

    tipo_servicio: req.body.tipo_servicio || "",

    preciototal: req.body.preciototal || "",

    precioreserva: req.body.precioreserva || "",

    urls_fotos: req.body.urls_fotos || "",

inventario: JSON.stringify(req.body.inventario || []),

},

            line_items: [

                {

                    price_data: {

                        currency: "eur",

                        product_data: {

                            name: "Reserva Mudanza RODAX"

                        },

                        unit_amount: Math.round(importe * 100)

                    },

                    quantity: 1

                }

            ],

            success_url:
"https://rodaxmudanzasweb.vercel.app/confirmacion.html?session_id={CHECKOUT_SESSION_ID}",

            cancel_url:
                "https://rodaxmudanzasweb.vercel.app/?pago=cancel"

        });

        console.log("SESSION CREADA");

console.log(session.id);

console.log(session.success_url);

console.log(session.cancel_url);

        res.status(200).json({

    id: session.id,

    numero_reserva

});

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            error: err.message

        });

    }

};
