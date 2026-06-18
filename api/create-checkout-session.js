const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {

    try {

        const session = await stripe.checkout.sessions.create({

            payment_method_types: ["card"],

            mode: "payment",

            line_items: [

                {

                    price_data: {

                        currency: "eur",

                        product_data: {

                            name: "Reserva RODAX"

                        },

                        unit_amount: 5000

                    },

                    quantity: 1

                }

            ],

            success_url: "https://rodaxmudanzasweb.vercel.app",

            cancel_url: "https://rodaxmudanzasweb.vercel.app"

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
