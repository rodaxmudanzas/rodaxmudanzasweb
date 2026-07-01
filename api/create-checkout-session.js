const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//////////////////////////////////////////////////////
// GENERADOR DE NÚMERO DE RESERVA
//////////////////////////////////////////////////////

function generarNumeroReserva(){

    const año =
    new Date().getFullYear().toString().slice(-2);

    const caracteres =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let codigo = "";

    for(let i=0;i<6;i++){

        codigo += caracteres.charAt(

            Math.floor(
                Math.random()*caracteres.length
            )

        );

    }

    return `RDX-${año}-${codigo}`;

}

module.exports = async (req, res) => {

    try {

        const {

    nombre,
    email,
    telefono,
    importe

} = req.body;

const numeroReserva =
generarNumeroReserva();

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

    numero_reserva: numeroReserva,

    nombre,

    email,

    telefono,

    importe: importe.toString(),

    origen: req.body.origen || "",

    destino: req.body.destino || "",

    fecha: req.body.fecha || "",

    tipo_servicio: req.body.tipo_servicio || "",

    km: req.body.km || "",

    volumen: req.body.volumen || "",

    extras: req.body.extras || "",

    observaciones: req.body.observaciones || ""

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

    id: session.id,

    numeroReserva

});

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            error: err.message

        });

    }

};
