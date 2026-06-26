const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {

    res.status(200).json({

        mensaje: "Webhook funcionando"

    });

};