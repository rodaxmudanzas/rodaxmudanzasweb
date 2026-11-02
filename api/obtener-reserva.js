
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseImporte(value) {
    let texto = String(value ?? "")
        .trim()
        .replace(/[€\s]/g, "");

    if (!texto) return NaN;

    const tieneComa = texto.includes(",");
    const tienePunto = texto.includes(".");

    if (tieneComa && tienePunto) {
        if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
            texto = texto.replace(/\./g, "").replace(",", ".");
        } else {
            texto = texto.replace(/,/g, "");
        }
    } else if (tieneComa) {
        texto = texto.replace(",", ".");
    }

    return Number(texto);
}

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Método no permitido."
        });
    }

    try {
        // 1. Exigir autenticación de Supabase.
        const autorizacion = req.headers.authorization || "";
        const coincidencia = autorizacion.match(/^Bearer\s+(.+)$/i);

        if (!coincidencia) {
            return res.status(401).json({
                error: "Debes iniciar sesión para consultar esta reserva."
            });
        }

        const token = coincidencia[1];

        const {
            data: { user },
            error: errorUsuario
        } = await supabase.auth.getUser(token);

        if (errorUsuario || !user || !user.email) {
            return res.status(401).json({
                error: "La sesión no es válida. Inicia sesión de nuevo."
            });
        }

        // 2. Validar el identificador de Stripe.
        const sessionId = req.query.session_id;

        if (
            typeof sessionId !== "string" ||
            !sessionId.startsWith("cs_")
        ) {
            return res.status(400).json({
                error: "Identificador de pago no válido."
            });
        }

        // 3. Comprobar la sesión directamente con Stripe.
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return res.status(409).json({
                error: "El pago todavía no está confirmado."
            });
        }

        const numeroReserva = session.metadata?.numero_reserva;

        if (!numeroReserva) {
            return res.status(404).json({
                error: "La sesión no contiene un número de reserva."
            });
        }

        // 4. Buscar exclusivamente la reserva asociada a esa sesión.
        const { data: reserva, error: errorReserva } = await supabase
            .from("mudanzas")
            .select(`
                id,
                numero_reserva,
                stripe_session_id,
                email,
                nombre,
                fecha,
                origen,
                destino,
                estado,
                preciototal,
                precioreserva,
                importe_total,
                importe_reserva,
                importe_restante
            `)
            .eq("numero_reserva", numeroReserva)
            .maybeSingle();

        if (errorReserva) throw errorReserva;

        if (!reserva) {
            return res.status(404).json({
                error: "No se encontró la reserva."
            });
        }

        // 5. Verificar que la reserva pertenece al usuario autenticado.
        const emailUsuario = user.email.trim().toLowerCase();
        const emailReserva = String(reserva.email || "")
            .trim()
            .toLowerCase();

        if (!emailReserva || emailUsuario !== emailReserva) {
            return res.status(403).json({
                error: "No tienes permiso para consultar esta reserva."
            });
        }

        // 6. Evitar asociar una sesión de Stripe diferente.
        if (
            reserva.stripe_session_id &&
            reserva.stripe_session_id !== session.id
        ) {
            return res.status(403).json({
                error: "La sesión de pago no corresponde a esta reserva."
            });
        }

        // 7. Recuperar la sincronización si el webhook aún no la realizó.
        let importeTotal = reserva.importe_total;
        let importeReserva = reserva.importe_reserva;
        let importeRestante = reserva.importe_restante;

        if (!reserva.stripe_session_id) {
            importeTotal = parseImporte(reserva.preciototal);
            importeReserva = parseImporte(reserva.precioreserva);

            if (
                !Number.isFinite(importeTotal) ||
                !Number.isFinite(importeReserva) ||
                importeTotal < 0 ||
                importeReserva < 0 ||
                importeReserva > importeTotal
            ) {
                return res.status(500).json({
                    error: "Los importes de la reserva no son válidos."
                });
            }

            importeRestante = Number(
                (importeTotal - importeReserva).toFixed(2)
            );

            const { error: errorSync } = await supabase
                .from("mudanzas")
                .update({
                    stripe_session_id: session.id,
                    stripe_payment_intent: session.payment_intent,
                    estado: "Pendiente de asignación",
                    estado_pago: "Pagado 30 % - Pendiente 70 %",
                    importe_total: importeTotal,
                    importe_reserva: importeReserva,
                    importe_restante: importeRestante
                })
                .eq("id", reserva.id)
                .is("stripe_session_id", null);

            if (errorSync) throw errorSync;
        }

        // 8. Devolver únicamente los datos necesarios.
        return res.status(200).json({
            numero_reserva: reserva.numero_reserva,
            nombre: reserva.nombre,
            fecha: reserva.fecha,
            origen: reserva.origen,
            destino: reserva.destino,
            estado: reserva.estado,
            importe_total: importeTotal,
            importe_reserva: importeReserva,
            importe_restante: importeRestante
        });

    } catch (err) {
        console.error("ERROR OBTENIENDO RESERVA:", err);

        return res.status(500).json({
            error: "No se pudo consultar la reserva."
        });
    }
};
