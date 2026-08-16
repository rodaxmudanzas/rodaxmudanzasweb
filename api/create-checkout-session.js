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

        numero_reserva:
            String(numero_reserva || ""),

        franja_horaria_recogida:
            String(
                req.body.franja_horaria_recogida || ""
            ),

        nombre:
            String(nombre || ""),

        telefono:
            String(telefono || ""),

        origen:
            String(req.body.origen || ""),

        destino:
            String(req.body.destino || ""),

        km:
            String(req.body.km || ""),

        fecha:
            String(req.body.fecha || ""),

        volumen:
            String(req.body.volumen || ""),

        ascensor:
            String(req.body.ascensor || ""),

        extras:
            String(req.body.extras || ""),

        observaciones:
            String(req.body.observaciones || ""),

        tipo_servicio:
            String(req.body.tipo_servicio || ""),

        preciototal:
            String(req.body.preciototal || ""),

        precioreserva:
            String(req.body.precioreserva || ""),

        urls_fotos:
            String(req.body.urls_fotos || ""),

        inventario:
            String(req.body.inventario || "")

    },

    line_items: [

        {

            price_data: {

                currency: "eur",

                product_data: {

                    name:
                        "Reserva Mudanza RODAX"

                },

                unit_amount:
                    Math.round(
                        importe * 100
                    )

            },

            quantity: 1

        }

    ],

    success_url:
        "https://rodaxmudanzasweb.vercel.app/confirmacion.html?session_id={CHECKOUT_SESSION_ID}",

    cancel_url:
        "https://rodaxmudanzasweb.vercel.app/?pago=cancel"

});

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
