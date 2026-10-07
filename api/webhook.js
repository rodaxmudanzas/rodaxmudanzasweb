const Stripe = require("stripe");
const { buffer } = require("micro");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports.config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async function (req, res) {

    console.log("========================================");
    console.log("WEBHOOK INICIADO");
    console.log("Método:", req.method);
    console.log("========================================");

    if (req.method !== "POST") {
        console.log("Método no permitido");
        return res.status(405).send("Método no permitido");
    }

    try {

        const signature = req.headers["stripe-signature"];

        if (!signature) {
            console.error("Falta Stripe-Signature");
            return res.status(400).send("Sin firma Stripe");
        }

        const buf = await buffer(req);

        console.log("Body recibido");

        const event = stripe.webhooks.constructEvent(
            buf,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("EVENTO RECIBIDO");

console.log(event.type);

console.log(event.data.object.metadata);

        console.log("Evento verificado correctamente");
        console.log("Tipo:", event.type);

        if (event.type !== "checkout.session.completed") {

            console.log("Evento ignorado");

            return res.json({
                received: true
            });

        }

        console.log("Pago completado");

        const session = event.data.object;

console.log("SESSION COMPLETA");
console.log(session);

console.log("SESSION ID:", session.id);

console.log("Metadata:");
console.log(session.metadata);

if (!session.metadata) {

    console.error("La metadata viene vacía");

    return res.status(400).json({
        error: "Metadata vacía"
    });

}

const data = session.metadata;

let inventario = [];

try{

    inventario = JSON.parse(data.inventario || "[]");

}catch{

    inventario = [];

}

const numeroReserva = data.numero_reserva;

if (!numeroReserva) {

    console.error("numero_reserva no existe");

    return res.status(400).json({
        error: "numero_reserva inexistente"
    });

}

console.log("Reserva:", numeroReserva);

               function parseImporte(value) {
            let texto = String(value ?? "")
                .trim()
                .replace(/[€\s]/g, "");

            if (!texto) {
                return NaN;
            }

            const tieneComa = texto.includes(",");
            const tienePunto = texto.includes(".");

            if (tieneComa && tienePunto) {
                // Formato español: 1.274,80
                if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
                    texto = texto
                        .replace(/\./g, "")
                        .replace(",", ".");
                } else {
                    // Formato internacional: 1,274.80
                    texto = texto.replace(/,/g, "");
                }
            } else if (tieneComa) {
                texto = texto.replace(",", ".");
            }

            return Number(texto);
        }

       // ==========================================================
// IMPORTES DEL SERVICIO
// ==========================================================

// El precio TOTAL de la mudanza procede de nuestra propia metadata
// (preciototal, en euros, p. ej. "970.60 €" o "1.274,80 €").
// session.amount_total NO es el total: es solo lo que Stripe cobra en
// este checkout, es decir, la reserva del 30 % expresada en céntimos.

const importeTotal = parseImporte(data.preciototal);

if (!Number.isFinite(importeTotal) || importeTotal <= 0) {

    console.error(
        "Precio total inválido en metadata:",
        data.preciototal
    );

    return res.status(400).json({
        error: "El precio total de la mudanza no es válido."
    });
}


// La reserva procede de nuestra metadata.
// En el proyecto puede llegar:
// 58426     -> 584.26 €
// 584.26    -> 584.26 €

const importeReservaRaw =
    parseImporte(data.precioreserva);

if (!Number.isFinite(importeReservaRaw)) {

    console.error(
        "Importe de reserva inválido:",
        data.precioreserva
    );

    return res.status(400).json({
        error: "El importe de la reserva no es válido."
    });
}


let importeReserva = importeReservaRaw;


// Si la reserva llega como céntimos,
// será mayor que el importe total expresado en euros.
//
// Ejemplo:
// 58426 > 1947.55
//
// En ese caso convertimos:
// 58426 -> 584.26

if (importeReserva > importeTotal) {

    importeReserva =
        Number(
            (importeReserva / 100).toFixed(2)
        );

}


// Comprobación informativa:
// lo cobrado por Stripe debe coincidir con la reserva.

if (Math.round(importeReserva * 100) !== Number(session.amount_total)) {

    console.warn(
        "Aviso: amount_total de Stripe (céntimos) no coincide con la reserva:",
        session.amount_total,
        importeReserva
    );

}


// El 70 % restante se calcula a partir de
// los importes reales guardados en euros.

const importeRestante =
    Number(
        (importeTotal - importeReserva).toFixed(2)
    );


console.log("================================");
console.log("IMPORTES NORMALIZADOS");
console.log("Total Stripe:", session.amount_total);
console.log("Importe total €:", importeTotal);
console.log("Reserva original:", data.precioreserva);
console.log("Reserva €:", importeReserva);
console.log("Pendiente €:", importeRestante);
console.log("================================");

        console.log("Importe total:", importeTotal);
        console.log("Reserva:", importeReserva);
        console.log("Pendiente:", importeRestante);

        const fechaPago = new Date();

        const fechaCobro70 = new Date(data.fecha);

        fechaCobro70.setHours(7);
        fechaCobro70.setMinutes(0);
        fechaCobro70.setSeconds(0);
        fechaCobro70.setMilliseconds(0);

        console.log("Actualizando Supabase...");

        console.log("================================");

console.log("numeroReserva:", numeroReserva);
console.log("session.id:", session.id);
console.log("payment_intent:", session.payment_intent);
console.log("metadata completa:");
console.log(session.metadata);
console.log(
    "FRANJA HORARIA RECIBIDA:",
    session.metadata?.franja_horaria_recogida
);
console.log("================================");

const { data: reserva, error: errorReserva } = await supabase
    .from("mudanzas")
    .select("*")
    .eq("numero_reserva", numeroReserva);

console.log("================================");
console.log("RESERVA ENCONTRADA:");
console.log(reserva);
console.log("ERROR BUSCANDO RESERVA:");
console.log(errorReserva);
console.log("================================");

const { data: updateData, error } = await supabase
.from("mudanzas")
.update({
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent,
    estado: "Pendiente de asignación",
    estado_pago: "Pagado 30 % - Pendiente 70 %",
    fecha_pago_30: fechaPago,
    fecha_cobro_70: fechaCobro70,
    importe_total: importeTotal,
    importe_reserva: importeReserva,
    importe_restante: importeRestante
})
.eq("numero_reserva", numeroReserva)
.select();

console.log("ERROR:", error);

console.log("UPDATE:", updateData);

if(updateData){
    console.log("FILAS:", updateData.length);
}

            console.log("Filas actualizadas:");
console.log(updateData);
console.log("Cantidad:");
console.log(updateData?.length ?? 0);

if (error) {

    console.error("ERROR SUPABASE:");
    console.error(error);

    throw error;
}


        console.log("Resultado actualización:");

        console.log(updateData);

        // ==========================================================
// 🔔 NOTIFICACIÓN — NUEVO TRABAJO DISPONIBLE
// ==========================================================

try {

    const mudanzaActualizada =
        Array.isArray(updateData) &&
        updateData.length > 0
            ? updateData[0]
            : null;

    if (!mudanzaActualizada) {

        console.warn(
            "⚠️ NOTIFICACIONES: no se creó aviso porque no se encontró la mudanza actualizada."
        );

    } else {

        const {

            id: mudanzaId,
            numero_reserva: reservaNumero

        } = mudanzaActualizada;

        const {

            data: transportistas,
            error: errorTransportistas

        } = await supabase
            .from("transportistas")
            .select("id")
            .eq("estado", "Activo");

        if (errorTransportistas) {

            console.error(
                "❌ ERROR OBTENIENDO TRANSPORTISTAS PARA NOTIFICACIÓN:",
                errorTransportistas
            );

        } else if (
            Array.isArray(transportistas) &&
            transportistas.length > 0
        ) {

            for (const transportista of transportistas) {

                const eventoClave =
                    `nuevo_trabajo:${mudanzaId}:${reservaNumero}`;

                const {
                    data: existente,
                    error: errorExistente
                } = await supabase
                    .from("notificaciones")
                    .select("id")
                    .eq(
                        "transportista_id",
                        transportista.id
                    )
                    .eq(
                        "metadata->>evento_clave",
                        eventoClave
                    )
                    .limit(1);

                if (errorExistente) {

                    console.error(
                        "❌ ERROR COMPROBANDO DUPLICADO DE NOTIFICACIÓN:",
                        errorExistente
                    );

                    continue;
                }

                if (
                    Array.isArray(existente) &&
                    existente.length > 0
                ) {

                    console.log(
                        "🔔 NOTIFICACIÓN YA EXISTE:",
                        eventoClave
                    );

                    continue;
                }

                const {
                    error: errorNotificacion
                } = await supabase
                    .from("notificaciones")
                    .insert({

                        transportista_id:
                            transportista.id,

                        tipo:
                            "nuevo_trabajo",

                        titulo:
                            "Nuevo trabajo disponible",

                        mensaje:
                            `Hay una nueva mudanza disponible que puede encajar con tus rutas.`,

                        mudanza_id:
                            mudanzaId,

                        numero_reserva:
                            reservaNumero,

                        metadata: {

                            evento_clave:
                                eventoClave,

                            estado:
                                mudanzaActualizada.estado,

                            fecha_servicio:
                                mudanzaActualizada.fecha,

                            origen_ciudad:
                                mudanzaActualizada.origen_ciudad,

                            destino_ciudad:
                                mudanzaActualizada.destino_ciudad

                        },

                        leida:
                            false

                    });

                if (errorNotificacion) {

                    console.error(
                        "❌ ERROR CREANDO NOTIFICACIÓN:",
                        errorNotificacion
                    );

                } else {

                    console.log(
                        "🔔 NOTIFICACIÓN NUEVO TRABAJO CREADA:",
                        {
                            transportistaId:
                                transportista.id,

                            mudanzaId,

                            numeroReserva:
                                reservaNumero
                        }
                    );
                }
            }

        } else {

            console.warn(
                "⚠️ NOTIFICACIONES: no hay transportistas activos."
            );
        }
    }

} catch (errorNotificacionGeneral) {

    console.error(
        "❌ ERROR GENERAL EN NOTIFICACIONES:",
        errorNotificacionGeneral
    );

}

        console.log("WEBHOOK FINALIZADO CORRECTAMENTE");

        return res.status(200).json({
            received: true
        });

    } catch (err) {

        console.error("================================");
        console.error("ERROR EN WEBHOOK");
        console.error(err);
        console.error(err.stack);
        console.error("================================");

        return res.status(500).json({

            error: err.message,

            stack: err.stack

        });

    }

};