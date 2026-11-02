
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
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Método no permitido."
        });
    }

    try {
        // 1. Exigir autenticación de Supabase.
        const authorization = req.headers.authorization || "";
        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7).trim()
            : "";

        if (!token) {
            return res.status(401).json({
                error: "Debes iniciar sesión para consultar esta reserva."
            });
        }

        const {
            data: { user },
            error: errorAuth
        } = await supabase.auth.getUser(token);

        if (errorAuth || !user || !user.email) {
            return res.status(401).json({
                error: "La sesión no es válida. Inicia sesión nuevamente."
            });
        }

        // 2. Comprobar el identificador de Stripe.
        const sessionId = req.query.session_id;

        if (
            typeof sessionId !== "string" ||
            !/^cs_(test|live)_/.test(sessionId)
        ) {
            return res.status(400).json({
                error: "Identificador de pago no válido."
            });
        }

        // 3. Recuperar y verificar la sesión directamente en Stripe.
        const session =
            await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return res.status(402).json({
                error: "El pago todavía no está confirmado."
            });
        }

        const numeroReserva = session.metadata?.numero_reserva;

        if (!numeroReserva) {
            return res.status(404).json({
                error: "No se encontró la reserva asociada al pago."
            });
        }

        // 4. Buscar exclusivamente la reserva identificada por Stripe.
        const { data: reserva, error: errorReserva } = await supabase
            .from("mudanzas")
            .select(`
                id,
                numero_reserva,
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
                importe_restante,
                stripe_session_id
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
        const emailCliente = String(reserva.email || "")
            .trim()
            .toLowerCase();

        const emailAutenticado = String(user.email)
            .trim()
            .toLowerCase();

        if (
            !emailCliente ||
            emailCliente !== emailAutenticado
        ) {
            return res.status(403).json({
                error: "No tienes autorización para consultar esta reserva."
            });
        }

        // 6. Impedir que una sesión diferente reclame la reserva.
        if (
            reserva.stripe_session_id &&
            reserva.stripe_session_id !== session.id
        ) {
            return res.status(403).json({
                error: "La sesión de pago no corresponde a esta reserva."
            });
        }

        // 7. Sincronizar el pago si el webhook todavía no lo ha hecho.
        const importeTotal = parseImporte(reserva.preciototal);
        const importeReserva = parseImporte(reserva.precioreserva);

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

        const importeRestante = Number(
            (importeTotal - importeReserva).toFixed(2)
        );

        const payload = {
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            estado: "Pendiente de asignación",
            estado_pago: "Pagado 30 % - Pendiente 70 %",
            importe_total: importeTotal,
            importe_reserva: importeReserva,
            importe_restante: importeRestante
        };

        const { data: sincronizada, error: errorSync } =
            await supabase
                .from("mudanzas")
                .update(payload)
                .eq("id", reserva.id)
                .or(
                    `stripe_session_id.is.null,stripe_session_id.eq.${session.id}`
                )
                .select(`
                    numero_reserva,
                    nombre,
                    fecha,
                    origen,
                    destino,
                    estado,
                    importe_total,
                    importe_reserva,
                    importe_restante
                `)
                .maybeSingle();

        if (errorSync) throw errorSync;

        if (!sincronizada) {
            return res.status(409).json({
                error: "No se pudo verificar la reserva. Contacta con RODAX."
            });
        }

        // 8. Devolver únicamente los datos necesarios para la confirmación.
        return res.status(200).json(sincronizada);

    } catch (err) {
        console.error("ERROR OBTENIENDO RESERVA:", err);

        return res.status(500).json({
            error: "No se pudo verificar la reserva. Inténtalo de nuevo."
        });
    }
};
