const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).send("Método no permitido");
    }

    res.status(200).json({
        recibido: true
    });

};