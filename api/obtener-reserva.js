const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ESTADO_PENDIENTE_PAGO = "Pendiente de pago";
const ESTADO_PENDIENTE_ASIGNACION = "Pendiente de asignación";

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

function importeGuardado(numerico, texto) {
  if (numerico !== null && numerico !== undefined && numerico !== "") {
    const numero = Number(numerico);
    if (Number.isFinite(numero)) return numero;
  }
  return parseImporte(texto);
}

function normalizarEmail(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

function responderError(res, status, error) {
  return res.status(status).json({ error });
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return responderError(res, 405, "Método no permitido.");
  }

  try {
    const sessionId = req.query?.session_id;

    // El ID de Checkout actúa como credencial limitada para consultar
    // exclusivamente el recibo asociado. No autentica en el Área Cliente.
    if (
      typeof sessionId !== "string" ||
      !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)
    ) {
      return responderError(res, 400, "Identificador de pago no válido.");
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      if (err && err.code === "resource_missing") {
        return responderError(res, 404, "No se encontró el pago.");
      }
      throw err;
    }

    if (
      session.id !== sessionId ||
      session.mode !== "payment" ||
      String(session.currency || "").toLowerCase() !== "eur"
    ) {
      return responderError(res, 403, "La sesión de pago no es válida.");
    }

    if (session.payment_status !== "paid") {
      return responderError(res, 409, "El pago todavía no está confirmado.");
    }

    const numeroReserva = session.metadata?.numero_reserva;
    if (
      typeof numeroReserva !== "string" ||
      !/^RDX-\d{2}-\d{6}$/.test(numeroReserva)
    ) {
      return responderError(res, 404, "La sesión no contiene un número de reserva válido.");
    }

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
      return responderError(res, 404, "No se encontró la reserva.");
    }

    // La sesión de Stripe debe pertenecer al mismo email usado al reservar.
    const emailStripe = normalizarEmail(
      session.customer_details?.email || session.customer_email
    );
    const emailReserva = normalizarEmail(reserva.email);

    if (!emailStripe || !emailReserva || emailStripe !== emailReserva) {
      return responderError(res, 403, "El pago no corresponde a esta reserva.");
    }

    // No se permite asociar una sesión pagada distinta de la ya vinculada.
    if (reserva.stripe_session_id && reserva.stripe_session_id !== session.id) {
      return responderError(res, 403, "La sesión de pago no corresponde a esta reserva.");
    }

    const importeTotal = importeGuardado(
      reserva.importe_total,
      reserva.preciototal
    );
    const importeReserva = importeGuardado(
      reserva.importe_reserva,
      reserva.precioreserva
    );

    if (
      !Number.isFinite(importeTotal) ||
      !Number.isFinite(importeReserva) ||
      importeTotal <= 0 ||
      importeReserva <= 0 ||
      importeReserva > importeTotal
    ) {
      return responderError(res, 500, "Los importes de la reserva no son válidos.");
    }

    // Stripe devuelve amount_total en céntimos. Se compara contra el anticipo
    // guardado en Supabase; el navegador no interviene en esta comprobación.
    const amountTotal = Number(session.amount_total);
    if (
      !Number.isInteger(amountTotal) ||
      amountTotal <= 0 ||
      Math.round(importeReserva * 100) !== amountTotal
    ) {
      return responderError(res, 409, "El importe cobrado no coincide con la reserva.");
    }

    const importeRestanteCalculado = Number(
      (importeTotal - importeReserva).toFixed(2)
    );

    let estado = reserva.estado;
    let importeRestante = importeGuardado(
      reserva.importe_restante,
      null
    );

    if (!Number.isFinite(importeRestante) || importeRestante < 0) {
      importeRestante = importeRestanteCalculado;
    }

    // Si create-checkout ya vinculó la sesión, no se modifica el estado.
    // Si aún no está vinculada, se permite sincronizar únicamente una reserva
    // que siga pendiente de pago. El filtro evita sobrescribir otra sesión.
    if (!reserva.stripe_session_id) {
      if (reserva.estado !== ESTADO_PENDIENTE_PAGO) {
        // Puede haber ganado la carrera el webhook. Releer antes de rechazar.
        const { data: actual, error: errorActual } = await supabase
          .from("mudanzas")
          .select("stripe_session_id, estado, importe_restante")
          .eq("id", reserva.id)
          .maybeSingle();

        if (errorActual) throw errorActual;

        if (!actual || actual.stripe_session_id !== session.id) {
          return responderError(res, 409, "No se pudo vincular el pago a la reserva.");
        }

        estado = actual.estado;
        const restanteActual = Number(actual.importe_restante);
        if (
          actual.importe_restante !== null &&
          actual.importe_restante !== undefined &&
          Number.isFinite(restanteActual) &&
          restanteActual >= 0
        ) {
          importeRestante = restanteActual;
        }
      } else {
        const { data: filas, error: errorSync } = await supabase
          .from("mudanzas")
          .update({
            stripe_session_id: session.id,
            stripe_payment_intent:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
            estado: ESTADO_PENDIENTE_ASIGNACION,
            estado_pago: "Pagado 30 % - Pendiente 70 %",
            importe_total: importeTotal,
            importe_reserva: importeReserva,
            importe_restante: importeRestanteCalculado
          })
          .eq("id", reserva.id)
          .eq("estado", ESTADO_PENDIENTE_PAGO)
          .is("stripe_session_id", null)
          .select("id");

        if (errorSync) throw errorSync;

        if (filas && filas.length === 1) {
          estado = ESTADO_PENDIENTE_ASIGNACION;
          importeRestante = importeRestanteCalculado;
        } else {
          // El webhook u otra petición pudo sincronizarla primero.
          const { data: actual, error: errorActual } = await supabase
            .from("mudanzas")
            .select("stripe_session_id, estado, importe_restante")
            .eq("id", reserva.id)
            .maybeSingle();

          if (errorActual) throw errorActual;

          if (!actual || actual.stripe_session_id !== session.id) {
            return responderError(res, 409, "No se pudo vincular el pago a la reserva.");
          }

          estado = actual.estado;
          const restanteActual = Number(actual.importe_restante);
          if (
            actual.importe_restante !== null &&
            actual.importe_restante !== undefined &&
            Number.isFinite(restanteActual) &&
            restanteActual >= 0
          ) {
            importeRestante = restanteActual;
          } else {
            importeRestante = importeRestanteCalculado;
          }
        }
      }
    }

    return res.status(200).json({
      numero_reserva: reserva.numero_reserva,
      nombre: reserva.nombre,
      fecha: reserva.fecha,
      origen: reserva.origen,
      destino: reserva.destino,
      estado,
      importe_total: importeTotal,
      importe_reserva: importeReserva,
      importe_restante: Number(importeRestante)
    });

  } catch (err) {
    console.error("ERROR OBTENIENDO RESERVA:", err);
    return responderError(res, 500, "No se pudo consultar la reserva.");
  }
};
