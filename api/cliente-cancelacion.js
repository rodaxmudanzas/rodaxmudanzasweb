
const { createClient } = require("@supabase/supabase-js");
const Stripe = require("stripe");

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

/*
 * El email se compara con ILIKE para ignorar mayúsculas. Los caracteres
 * % y _ son comodines en ILIKE, así que se escapan para que un email
 * como "a_b@dominio.com" no pueda coincidir con otro cliente distinto.
 */
function escaparPatronIlike(valor) {
    return String(valor).replace(/[\\%_]/g, "\\$&");
}

/*
 * Busca en Stripe, recorriendo todas las páginas, los reembolsos del
 * PaymentIntent creados para esta mudanza (metadata.rodax_mudanza_id).
 * Si hay varios, prioriza el completado y después el pendiente.
 * Si no puede recorrer todo el listado lanza error: nunca se asume
 * que la primera página contiene todos los reembolsos.
 */
async function buscarReembolsoDeMudanza(stripe, paymentIntent, mudanzaId) {
    const coincidentes = [];
    let startingAfter = null;

    for (let pagina = 0; pagina < 20; pagina++) {
        const parametros = {
            payment_intent: paymentIntent,
            limit: 100
        };

        if (startingAfter) {
            parametros.starting_after = startingAfter;
        }

        const resultado = await stripe.refunds.list(parametros);

        for (const refund of resultado.data) {
            if (refund.metadata?.rodax_mudanza_id === String(mudanzaId)) {
                coincidentes.push(refund);
            }
        }

        if (!resultado.has_more || resultado.data.length === 0) {
            return (
                coincidentes.find((r) => r.status === "succeeded") ||
                coincidentes.find((r) => r.status === "pending") ||
                coincidentes[0] ||
                null
            );
        }

        startingAfter = resultado.data[resultado.data.length - 1].id;
    }

    throw new Error("Listado de reembolsos demasiado extenso para verificarlo.");
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


    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const stripe = new Stripe(
        process.env.STRIPE_SECRET_KEY
    );


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
        const emailIlike = escaparPatronIlike(emailUsuario);

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
            .ilike("email", emailIlike)
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


        // 4. No aceptar cancelaciones sin un pago identificable.
        const importeReserva = obtenerImporteReserva(reserva);
        const paymentIntent = reserva.stripe_payment_intent;

        if (!importeReserva || !paymentIntent) {
            return respuesta(res, 409, {
                error:
                    "La reserva no tiene un importe pagado o un pago de Stripe verificable. No se ha realizado ningún reembolso."
            });
        }

        // Verificar en Stripe que el pago de la reserva se completó.
let pagoStripe;

try {
    pagoStripe = await stripe.paymentIntents.retrieve(paymentIntent);
} catch (errorStripe) {
    console.error(
        "Cancelaciones: no se pudo verificar el pago en Stripe.",
        errorStripe.message
    );

    return respuesta(res, 502, {
        error: "No se ha podido verificar el pago en Stripe. No se ha iniciado ningún reembolso."
    });
}

if (pagoStripe.status !== "succeeded") {
    return respuesta(res, 409, {
        error: "El pago de la reserva no figura como completado en Stripe. No se ha iniciado ningún reembolso."
    });
}


const importeCobradoStripe = Number(pagoStripe.amount_received) / 100;
const monedaStripe = String(pagoStripe.currency || "").toLowerCase();

const importeReservaCentimos = Math.round(importeReserva * 100);

if (
    !Number.isSafeInteger(pagoStripe.amount_received) ||
    pagoStripe.amount_received <= 0 ||
    !monedaStripe ||
    Math.round(importeCobradoStripe * 100) < importeReservaCentimos ||
    monedaStripe !== "eur"
) {
    console.error(
        "Cancelaciones: el importe o la moneda de Stripe no coinciden con los requisitos.",
        {
            mudanzaId,
            importeCobradoCentimos: pagoStripe.amount_received,
            importeReservaCentimos,
            monedaStripe
        }
    );

    return respuesta(res, 409, {
        error: "No se ha podido verificar que el pago cubra la reserva en euros. No se ha iniciado ningún reembolso."
    });
}


                // 6. Consultar y reconciliar solicitudes anteriores.
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
            solicitudId = solicitudExistente.id;

            const estadoSolicitud = normalizarEstado(
                solicitudExistente.estado
            );

            let refundRecuperado = null;

            // Si el reembolso es cero, no hay dinero que recuperar de Stripe.
            if (Number(solicitudExistente.importe_reembolso) <= 0) {
                refundRecuperado = null;
            } else if (solicitudExistente.stripe_refund_id) {
                // Si guardamos el ID, consultar directamente ese reembolso.
                try {
                    refundRecuperado = await stripe.refunds.retrieve(
                        solicitudExistente.stripe_refund_id
                    );
                } catch (errorStripe) {
                    console.error(
                        "Cancelaciones: no se pudo recuperar el reembolso existente.",
                        errorStripe.message
                    );

                    return respuesta(res, 502, {
                        error: "No se ha podido verificar el reembolso anterior. No se iniciará otro."
                    });
                }
            } else if (
                estadoSolicitud === "procesando" ||
                estadoSolicitud === "error"
            ) {
                // El registro pudo fallar después de que Stripe recibiera
                // la petición. Buscar el reembolso antes de permitir otro intento.
                try {
                    refundRecuperado = await buscarReembolsoDeMudanza(
                        stripe,
                        paymentIntent,
                        reserva.id
                    );
                } catch (errorStripe) {
                    console.error(
                        "Cancelaciones: error reconciliando reembolsos.",
                        errorStripe.message
                    );

                    return respuesta(res, 502, {
                        error: "No se ha podido comprobar si Stripe ya realizó el reembolso. No se iniciará otro."
                    });
                }
            }

            if (
                Number(solicitudExistente.importe_reembolso) > 0 &&
                !refundRecuperado
            ) {
                return respuesta(res, 409, {
                    error: "Existe una solicitud anterior sin un reembolso verificable. No se realizará otro automáticamente; requiere revisión.",
                    estado: solicitudExistente.estado
                });
            }

if (refundRecuperado) {
    const reembolsoCoincide =
        refundRecuperado.payment_intent === paymentIntent &&
        Number(refundRecuperado.amount) ===
            Math.round(
                Number(solicitudExistente.importe_reembolso) * 100
            ) &&
        refundRecuperado.metadata?.rodax_mudanza_id ===
            String(reserva.id);

    if (!reembolsoCoincide) {
        console.error(
            "El reembolso recuperado no coincide con la solicitud."
        );

        return respuesta(res, 409, {
            error: "El reembolso recuperado no coincide con la solicitud. Requiere revisión antes de continuar."
        });
    }

    if (refundRecuperado.status === "pending") {
        const { error: errorGuardarPendiente } = await supabase
            .from("solicitudes_cancelacion_cliente")
            .update({
                estado: "procesando",
                stripe_refund_id: refundRecuperado.id,
                updated_at: new Date().toISOString()
            })
            .eq("id", solicitudId);

        if (errorGuardarPendiente) {
            console.error(
                "Error guardando el estado pendiente:",
                errorGuardarPendiente
            );

            return respuesta(res, 500, {
                error: "No se pudo actualizar el estado del reembolso."
            });
        }

        return respuesta(res, 409, {
            error: "Stripe todavía está procesando el reembolso. No vuelvas a solicitarlo.",
            estado: "procesando"
        });
    }

    
    if (refundRecuperado.status !== "succeeded") {
        return respuesta(res, 409, {
            error: "El reembolso anterior no figura como completado en Stripe. Requiere revisión antes de continuar.",
            estado: refundRecuperado.status
        });
    }

}


            // Stripe confirmó el reembolso (o el importe es cero).
            // Completar el registro para permitir recuperar una operación interrumpida.
            const refundIdRecuperado = refundRecuperado?.id || null;
            const ahoraRecuperacion = new Date().toISOString();

            const {
                error: errorRecuperacion
            } = await supabase
                .from("solicitudes_cancelacion_cliente")
                .update({
                    estado: "completada",
                    stripe_refund_id: refundIdRecuperado,
                    motivo_error: null,
                    updated_at: ahoraRecuperacion,
                    completed_at: ahoraRecuperacion
                })
                .eq("id", solicitudId);

            if (errorRecuperacion) {
                console.error(
                    "Cancelaciones: no se pudo reconciliar la solicitud.",
                    errorRecuperacion.message
                );

                return respuesta(res, 500, {
                    error: "El resultado financiero se ha verificado, pero no se pudo actualizar el registro. No se iniciará otro reembolso."
                });
            }

            const {
                error: errorEstadoRecuperado
            } = await supabase
                .from("mudanzas")
                .update({
                    estado: "Cancelada por cliente"
                })
                .eq("id", reserva.id)
                .ilike("email", emailIlike);

            if (errorEstadoRecuperado) {
                console.error(
                    "Cancelaciones: no se pudo recuperar el estado de la mudanza.",
                    errorEstadoRecuperado.message
                );

                return respuesta(res, 500, {
                    error: "La cancelación financiera está reconciliada, pero el estado de la mudanza necesita revisión. No vuelvas a solicitar el reembolso."
                });
            }

            return respuesta(res, 200, {
                ok: true,
                mensaje: "La cancelación anterior se ha reconciliado correctamente.",
                numero_reserva: reserva.numero_reserva,
                porcentaje_penalizacion:
                    solicitudExistente.porcentaje_penalizacion,
                importe_reembolso:
                    solicitudExistente.importe_reembolso,
                stripe_refund_id: refundIdRecuperado
            });
        }

        // Solo se rechaza el estado de la mudanza si no existe
        // ninguna solicitud anterior que haya que reconciliar.
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

        // 5. Calcular la penalización en el servidor.
        // Se calcula después de reconciliar solicitudes anteriores: una
        // operación interrumpida se cierra con los importes ya guardados
        // aunque la fecha del servicio haya pasado entre intentos.
        let evaluacion;

        try {
            evaluacion = calcularPenalizacion(reserva.fecha);
        } catch (errorFecha) {
            return respuesta(res, 409, {
                error: `${errorFecha.message} No se ha realizado ningún reembolso.`
            });
        }

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
        amount: Math.round(importeReembolso * 100),
        metadata: {
            rodax_mudanza_id: String(reserva.id),
            rodax_numero_reserva: String(reserva.numero_reserva)
        }
    },
    {
        idempotencyKey:
            `rodax-cliente-cancelacion-${reserva.id}`
    }
);

                                refundId = reembolso.id;

                if (reembolso.status !== "succeeded") {
                    const estadoReembolso =
                        reembolso.status === "failed" ||
                        reembolso.status === "canceled"
                            ? "error"
                            : "procesando";

                    const {
                        error: errorGuardarEstadoStripe
                    } = await supabase
                        .from("solicitudes_cancelacion_cliente")
                        .update({
                            estado: estadoReembolso,
                            stripe_refund_id: refundId,
                            motivo_error:
                                "Stripe todavía no ha confirmado el reembolso como completado.",
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", solicitudId);

                    if (errorGuardarEstadoStripe) {
                        console.error(
                            "Cancelaciones: no se pudo guardar el estado del reembolso.",
                            errorGuardarEstadoStripe.message
                        );
                    }

                    return respuesta(res, 409, {
                        error:
                            "Stripe no ha confirmado el reembolso como completado. No vuelvas a solicitarlo.",
                        estado: estadoReembolso,
                        stripe_refund_id: refundId
                    });
                }
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
            .ilike("email", emailIlike);

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
