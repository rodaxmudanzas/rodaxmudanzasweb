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

        const session = await stripe.checkout.sessions.create({

            payment_method_types: ["card"],

            mode: "payment",

            customer_email: email,

            metadata: {
                nombre,
                telefono
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
