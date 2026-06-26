const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

        }

        return res.json({
            received: true
        });

    } catch (err) {

        console.error(err.message);

        return res.status(400).send(`Webhook Error: ${err.message}`);

    }

};