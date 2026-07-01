const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {

    try {

        const {

    nombre,
    email,
    telefono,
    importe

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

const session = await stripe.checkout.sessions.create({

            payment_method_types: ["card"],

            mode: "payment",

            customer_email: email,

            metadata: {

    nombre,

    email,

    telefono,

    importe: importe.toString(),

    numero_reserva: req.body.numero_reserva || "",

    origen: req.body.origen || "",

    destino: req.body.destino || "",

    fecha: req.body.fecha || "",

    tipo_servicio: req.body.tipo_servicio || ""

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
                "https://rodaxmudanzasweb.vercel.app/?pago=ok",

            cancel_url:
                "https://rodaxmudanzasweb.vercel.app/?pago=cancel"

        });

        res.status(200).json({

            id: session.id

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            error: err.message

        });

    }

};
