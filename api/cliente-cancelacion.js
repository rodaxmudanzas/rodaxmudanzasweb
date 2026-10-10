
const { createClient } = require("@supabase/supabase-js");
const Stripe = require("stripe");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function respuesta(res, codigo, datos) {
    return res.status(codigo).json(datos);
}

function normalizarEstado(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function fechaActualMadrid() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Madrid",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function diasHastaServicio(fechaServicio) {
    if (
        typeof fechaServicio !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaServicio)
    ) {
        throw new Error("La fecha de la mudanza no es válida.");
    }

    const [anio, mes, dia] = fechaServicio.split("-").map(Number);
    const fechaUTC = Date.UTC(anio, mes - 1, dia);

    const fechaComprobada = new Date(fechaUTC);

    if (
        fechaComprobada.getUTCFullYear() !== anio ||
        fechaComprobada.getUTCMonth() !== mes - 1 ||
        fechaComprobada.getUTCDate() !== dia
    ) {
        throw new Error("La fecha de la mudanza no existe.");
    }

    const hoy = fechaActualMadrid();
    const [anioHoy, mesHoy, diaHoy] = hoy.split("-").map(Number);
    const hoyUTC = Date.UTC(anioHoy, mesHoy - 1, diaHoy);

    return Math.round((fechaUTC - hoyUTC) / 86400000);
}

/*
 * La penalización se aplica sobre la reserva pagada,
 * nunca sobre el precio total del servicio.
 *
 * Como mudanzas.fecha es de tipo DATE y no almacena
 * la hora de la mudanza, el cálculo se realiza por días
 * naturales. La fecha del servicio tiene prioridad.
 */
function calcularPenalizacion(fechaServicio) {
    const dias = diasHastaServicio(fechaServicio);

    if (dias < 0) {
        throw new Error(
            "No se puede cancelar mediante este proceso una mudanza cuya fecha ya ha pasado."
        );
    }

    if (dias <= 1) {
        return {
            dias,
            porcentaje: 100,
            regla: "24 horas anteriores o día del servicio"
        };
    }

    if (dias <= 3) {
        return {
            dias,
            porcentaje: 50,
            regla: "Entre 24 y 72 horas, aproximadas por fecha"
        };
    }

    if (dias <= 7) {
        return {
            dias,
            porcentaje: 25,
            regla: "Entre 3 y 7 días"
        };
    }

    if (dias <= 14) {
        return {
            dias,
            porcentaje: 10,
            regla: "Entre 8 y 14 días"
        };
    }

    return {
        dias,
        porcentaje: 0,
        regla: "Más de 14 días"
    };
}

function obtenerImporteReserva(reserva) {
    const importe = Number(reserva.importe_reserva);

    if (
        Number.isFinite(importe) &&
        importe > 0
    ) {
        return Math.round(importe * 100) / 100;
    }

    return null;
}

module.exports = async function clienteCancelaciones(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return respuesta(res, 405, {
            error: "Método no permitido."
        });
    }

    if (
        !process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_ROLE_KEY ||
        !process.env.STRIPE_SECRET_KEY
    ) {
        console.error(
            "Cancelaciones: faltan variables de entorno."
        );

        return respuesta(res, 500, {
            error: "El servicio de cancelaciones no está configurado."
        });
    }

    let solicitudId = null;
    let mudanzaId = null;

    try {
        // 1. Autenticar al cliente mediante su sesión de Supabase.
        const autorizacion = req.headers.authorization || "";

        if (!autorizacion.startsWith("Bearer ")) {
            return respuesta(res, 401, {
                error: "Debes iniciar sesión para cancelar una mudanza."
            });
        }

        const token = autorizacion.slice(7).trim();

        const {
            data: datosUsuario,
            error: errorUsuario
        } = await supabase.auth.getUser(token);

        const emailUsuario = datosUsuario?.user?.email
            ?.trim()
            .toLowerCase();

        if (errorUsuario || !emailUsuario) {
            return respuesta(res, 401, {
                error: "La sesión no es válida."
            });
        }

        // 2. Validar el identificador enviado por el cliente.
        const idRecibido = req.body?.mudanza_id;

        if (
            !(
                (typeof idRecibido === "number" &&
                    Number.isSafeInteger(idRecibido) &&
                    idRecibido > 0) ||
                (typeof idRecibido === "string" &&
                    /^\d+$/.test(idRecibido) &&
                    Number.isSafeInteger(Number(idRecibido)) &&
                    Number(idRecibido) > 0)
            )
        ) {
            return respuesta(res, 400, {
                error: "El identificador de la mudanza no es válido."
            });
        }

        mudanzaId = Number(idRecibido);

        // 3. Buscar la reserva y verificar que pertenece al cliente.
        const {
            data: reserva,
            error: errorReserva
        } = await supabase
            .from("mudanzas")
            .select(
                "id, numero_reserva, email, fecha, estado, estado_pago, importe_reserva, stripe_payment_intent"
            )
            .eq("id", mudanzaId)
            .ilike("email", emailUsuario)
            .maybeSingle();

        if (errorReserva) {
            console.error(
                "Cancelaciones: error consultando reserva.",
                errorReserva.message
            );

            return respuesta(res, 500, {
                error: "No se ha podido consultar la reserva."
            });
        }

        if (!reserva) {
            return respuesta(res, 404, {
                error: "No se ha encontrado la reserva asociada a tu cuenta."
            });
        }

        const estadoActual = normalizarEstado(reserva.estado);

        if (
            estadoActual.includes("cancel") ||
            estadoActual.includes("completad") ||
            estadoActual.includes("finaliz") ||
            estadoActual.includes("realizad")
        ) {
            return respuesta(res, 409, {
                error: "Esta mudanza ya está cancelada o finalizada."
            });
        }

        // 4. No aceptar cancelaciones sin un pago identificable.
        const importeReserva = obtenerImporteReserva(reserva);
        const paymentIntent = reserva.stripe_payment_intent;

        if (!importeReserva || !paymentIntent) {
            return respuesta(res, 409, {
                error:
                    "La reserva no tiene un importe pagado o un pago de Stripe verificable. No se ha realizado ningún reembolso."
            });
        }

        // 5. Calcular la penalización en el servidor.
        const evaluacion = calcularPenalizacion(reserva.fecha);

        const importePenalizacion =
            Math.round(
                importeReserva *
                evaluacion.porcentaje
            ) / 100;

        const importeReembolso =
            Math.round(
                (importeReserva - importePenalizacion) * 100
            ) / 100;

        const porcentajePenalizacion = evaluacion.porcentaje;

        // 6. Consultar si ya existe una solicitud para esta mudanza.
        const {
            data: solicitudExistente,
            error: errorExistente
        } = await supabase
            .from("solicitudes_cancelacion_cliente")
            .select(
                "id, estado, stripe_refund_id, importe_reembolso, porcentaje_penalizacion"
            )
            .eq("mudanza_id", reserva.id)
            .maybeSingle();

        if (errorExistente) {
            console.error(
                "Cancelaciones: error consultando solicitud existente.",
                errorExistente.message
            );

            return respuesta(res, 500, {
                error: "No se ha podido comprobar el estado de la cancelación."
            });
        }

        if (solicitudExistente) {
            if (
                normalizarEstado(solicitudExistente.estado) ===
                "completada"
            ) {
                return respuesta(res, 200, {
                    ok: true,
                    mensaje: "La cancelación ya se había completado.",
                    numero_reserva: reserva.numero_reserva
                });
            }

            return respuesta(res, 409, {
                error:
                    "Ya existe una solicitud de cancelación para esta mudanza. No se ha creado otra ni se ha iniciado un segundo reembolso.",
                estado: solicitudExistente.estado
            });
        }

        // 7. Registrar la solicitud antes de solicitar el reembolso.
        const {
            data: nuevaSolicitud,
            error: errorInsert
        } = await supabase
            .from("solicitudes_cancelacion_cliente")
            .insert({
                mudanza_id: reserva.id,
                numero_reserva: reserva.numero_reserva,
                email_cliente: emailUsuario,
                stripe_payment_intent: paymentIntent,
                importe_reserva: importeReserva,
                porcentaje_penalizacion: porcentajePenalizacion,
                importe_penalizacion: importePenalizacion,
                importe_reembolso: importeReembolso,
                estado: "procesando",
                updated_at: new Date().toISOString()
            })
            .select("id")
            .single();

        if (errorInsert || !nuevaSolicitud) {
            console.error(
                "Cancelaciones: no se pudo registrar la solicitud.",
                errorInsert?.message
            );

            return respuesta(res, 409, {
                error:
                    "No se ha podido registrar la cancelación. Comprueba si ya existe una solicitud antes de volver a intentarlo."
            });
        }

        solicitudId = nuevaSolicitud.id;

        // 8. Ejecutar el reembolso en Stripe.
        // Si la penalización es del 100 %, no se devuelve dinero.
        let refundId = null;

        if (importeReembolso > 0) {
            try {
                const reembolso = await stripe.refunds.create(
                    {
                        payment_intent: paymentIntent,
                        amount: Math.round(importeReembolso * 100)
                    },
                    {
                        idempotencyKey:
                            `rodax-cliente-cancelacion-${reserva.id}`
                    }
                );

                refundId = reembolso.id;
            } catch (errorStripe) {
                console.error(
                    "Cancelaciones: error en el reembolso Stripe.",
                    errorStripe.message
                );

                await supabase
                    .from("solicitudes_cancelacion_cliente")
                    .update({
                        estado: "error",
                        motivo_error:
                            "Stripe no confirmó el reembolso. Requiere comprobación antes de reintentar.",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", solicitudId);

                return respuesta(res, 502, {
                    error:
                        "Stripe no ha confirmado el reembolso. La solicitud queda registrada para revisión; no vuelvas a enviar la cancelación."
                });
            }
        }

        // 9. Guardar el resultado del reembolso.
        const ahora = new Date().toISOString();

        const {
            error: errorFinal
        } = await supabase
            .from("solicitudes_cancelacion_cliente")
            .update({
                estado: "completada",
                stripe_refund_id: refundId,
                motivo_error: null,
                updated_at: ahora,
                completed_at: ahora
            })
            .eq("id", solicitudId);

        if (errorFinal) {
            console.error(
                "Cancelaciones: Stripe respondió, pero no se pudo actualizar la solicitud.",
                {
                    solicitudId,
                    refundId,
                    error: errorFinal.message
                }
            );

            return respuesta(res, 500, {
                error:
                    "Stripe ha procesado la operación, pero no se pudo actualizar el registro. No repitas la cancelación; necesita revisión."
            });
        }

        // 10. Actualizar el estado de la reserva.
        const {
            error: errorActualizarReserva
        } = await supabase
            .from("mudanzas")
            .update({
                estado: "Cancelada por cliente"
            })
            .eq("id", reserva.id)
            .ilike("email", emailUsuario);

        if (errorActualizarReserva) {
            console.error(
                "Cancelaciones: no se pudo actualizar el estado de la mudanza.",
                {
                    mudanzaId: reserva.id,
                    error: errorActualizarReserva.message
                }
            );

            return respuesta(res, 500, {
                error:
                    "La cancelación y el registro del reembolso se han procesado, pero el estado de la mudanza requiere revisión."
            });
        }

        return respuesta(res, 200, {
            ok: true,
            mensaje: "La cancelación se ha procesado correctamente.",
            numero_reserva: reserva.numero_reserva,
            fecha: reserva.fecha,
            reserva_pagada: importeReserva,
            porcentaje_penalizacion: porcentajePenalizacion,
            importe_penalizacion: importePenalizacion,
            importe_reembolso: importeReembolso,
            stripe_refund_id: refundId
        });

    } catch (error) {
        console.error(
            "Error inesperado en cancelación de cliente.",
            {
                mudanzaId,
                solicitudId,
                error: error.message
            }
        );

        return respuesta(res, 500, {
            error: "Se ha producido un error al procesar la cancelación."
        });
    }
};
