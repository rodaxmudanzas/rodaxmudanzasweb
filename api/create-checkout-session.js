const Stripe = require("stripe");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Catálogo extraído del index.html: nombre -> variantes [precio, m³, frágil].
const CATALOGO = {"Sofá 2 plazas":[[30.0,1.5,false]],"Sofá 3 plazas":[[35.0,2.0,false]],"Sofá chaise longue":[[35.0,2.7,false]],"Sofá cama":[[25.0,3.0,false]],"Butaca":[[25.0,0.8,false]],"Puff":[[20.0,0.3,false]],"Mesa de centro":[[25.0,0.6,false]],"Mesa auxiliar":[[25.0,0.3,false],[25.0,0.35,false]],"Mueble TV":[[25.0,1.2,false]],"Televisión pequeña - 40\"":[[25.0,0.2,true]],"Televisión grande + 40\"":[[35.0,0.5,true]],"Equipo de sonido":[[35.0,0.4,true]],"Altavoces":[[35.0,0.5,true]],"Estantería pequeña":[[25.0,1.2,false]],"Estantería grande":[[35.0,2.5,false]],"Librería":[[25.0,2.0,false],[25.0,1.5,false]],"Vitrina":[[35.0,1.9,false]],"Aparador":[[25.0,2.2,false],[25.0,1.7,false]],"Consola recibidor":[[25.0,0.8,false]],"Chimenea eléctrica":[[25.0,1.1,false]],"Mesa escritorio":[[25.0,0.5,false]],"Silla escritorio":[[25.0,0.4,false],[25.0,0.5,false]],"Ordenador sobremesa":[[35.0,0.3,true]],"Monitor":[[25.0,0.2,true]],"Impresora":[[25.0,0.3,true]],"Lámpara de pie":[[15.0,0.4,false]],"Lámpara de mesa":[[7.0,0.1,false]],"Cuadros grandes":[[25.0,0.4,true]],"Cuadros pequeños":[[10.0,0.1,true]],"Alfombra pequeña":[[10.0,0.3,false]],"Alfombra grande":[[20.0,0.8,false]],"Cortinas":[[10.0,0.2,false],[10.0,0.12,false]],"Espejo grande":[[25.0,0.6,true]],"Espejo pequeño":[[15.0,0.2,true]],"Aire acondicionado portátil":[[15.0,0.5,false]],"Planta decorativa grande":[[25.0,0.7,false]],"Planta decorativa pequeña":[[10.0,0.3,false]],"Nevera":[[35.0,1.1,false]],"Frigorífico americano":[[35.0,1.9,false]],"Congelador":[[35.0,1.2,false]],"Lavadora":[[35.0,0.7,false]],"Secadora":[[30.0,0.65,false]],"Lavavajillas":[[30.0,0.7,false]],"Horno":[[30.0,0.35,false]],"Microondas":[[15.0,0.12,false]],"Vitrocerámica":[[20.0,0.08,true]],"Cafetera":[[10.0,0.06,false]],"Mesa cocina":[[25.0,1.4,false]],"Sillas cocina":[[5.0,0.28,false]],"Isla cocina":[[25.0,2.5,false]],"Carro auxiliar cocina":[[25.0,0.45,false]],"Estantería cocina":[[25.0,1.1,false]],"Vajillero":[[25.0,1.8,false],[25.0,1.5,false]],"Campana extractora":[[25.0,0.25,false]],"Taburete":[[7.0,0.22,false]],"Mueble auxiliar":[[20.0,0.8,false]],"Cubo reciclaje":[[5.0,0.12,false]],"Robot cocina":[[10.0,0.05,false]],"Batidora":[[10.0,0.03,false]],"Tostadora":[[5.0,0.03,false]],"Freidora de aire":[[15.0,0.06,false]],"Envasadora vacío":[[10.0,0.04,false]],"Botellero":[[20.0,0.06,false]],"Nevera pequeña":[[25.0,0.45,false]],"Arcón congelador":[[30.0,1.4,false]],"Dispensador agua":[[20.0,0.5,false]],"Caja utensilios":[[10.0,0.08,false]],"Bandejas cocina":[[5.0,0.15,false]],"Mesa comedor pequeña":[[25.0,1.2,false]],"Mesa comedor grande":[[30.0,1.0,false]],"Mesa extensible":[[25.0,1.5,false]],"Sillas comedor":[[5.0,0.3,false]],"Banco comedor":[[15.0,0.75,false]],"Cómoda comedor":[[25.0,1.4,false]],"Carrito bebidas":[[25.0,0.45,false]],"Mueble bar":[[25.0,1.0,false]],"Espejo comedor":[[25.0,0.35,false]],"Lámpara techo":[[10.0,0.18,true],[25.0,0.15,true]],"Alfombra comedor":[[15.0,0.4,false]],"Cuadro decorativo":[[15.0,0.15,true]],"Estantería comedor":[[25.0,1.5,false]],"Consola comedor":[[25.0,0.9,false]],"Trona bebé":[[25.0,0.28,false]],"Cama Individual":[[25.0,1.3,false]],"Cama Doble":[[35.0,1.5,false]],"Cama king size":[[35.0,2.0,false]],"Litera":[[25.0,1.8,false]],"Canapé abatible":[[25.0,1.5,false]],"Colchón individual":[[25.0,0.75,false]],"Colchón doble":[[30.0,1.3,false]],"Cabecero":[[15.0,0.45,false]],"Mesita de noche":[[10.0,0.35,false]],"Cómoda":[[25.0,1.2,false]],"Sinfonier":[[25.0,0.9,false]],"Armario pequeño":[[25.0,1.8,false]],"Armario grande":[[35.0,2.5,false]],"Armario corredero":[[35.0,2.5,false]],"Vestidor desmontable":[[25.0,2.5,false]],"Escritorio":[[25.0,1.1,false]],"Tocador":[[25.0,1.0,false]],"Espejo cuerpo entero":[[25.0,0.4,true]],"Televisión dormitorio":[[25.0,0.3,true]],"Estantería":[[20.0,1.4,false]],"Zapatero":[[20.0,0.8,false]],"Cuna bebé":[[20.0,0.8,false]],"Cambiador bebé":[[25.0,0.75,false]],"Sillón dormitorio":[[25.0,0.9,false]],"Perchero":[[10.0,0.25,false],[10.0,0.22,false]],"Banco dormitorio":[[10.0,0.65,false]],"Caja organizadora":[[20.0,0.18,false]],"Maleta pequeña":[[10.0,0.12,false],[13.0,0.12,false]],"Maleta grande":[[25.0,0.28,false],[18.0,0.28,false]],"Ventilador":[[25.0,0.2,false]],"Lámpara mesa":[[10.0,0.08,false]],"Alfombra":[[10.0,0.35,false]],"Mueble Baño":[[25.0,0.95,false]],"Lavabo auxiliar":[[25.0,0.45,false]],"Espejo baño":[[25.0,0.18,true]],"Estantería baño":[[25.0,0.7,false]],"Armario baño":[[25.0,1.2,false]],"Cesto ropa":[[7.0,0.2,false]],"Lavadora pequeña":[[35.0,0.55,false]],"Secadora pequeña":[[30.0,0.5,false]],"Mueble almacenaje":[[25.0,1.0,false]],"Zapatero baño":[[15.0,0.6,false]],"Calefactor baño":[[20.0,0.1,false]],"Toallero eléctrico":[[20.0,0.15,false]],"Carrito baño":[[20.0,0.3,false]],"Banco baño":[[7.0,0.45,false]],"Organizador baño":[[20.0,0.12,false]],"Caja Pequeña":[[6.0,0.036,false]],"Caja Mediana":[[9.0,0.072,false]],"Caja Grande":[[12.0,0.096,false]],"Caja armario":[[35.0,0.8,false]],"Caja libros":[[15.0,0.15,false]],"Caja frágil":[[25.0,0.22,false]],"Bicicleta":[[25.0,0.8,false]],"Patinete eléctrico":[[25.0,0.25,true]],"Moto pequeña":[[50.0,2.5,true]],"Esquíes":[[25.0,0.18,false]],"Tabla surf":[[35.0,0.9,false]],"Tabla paddle surf":[[35.0,1.1,false]],"Instrumento musical pequeño":[[25.0,0.2,true]],"Piano eléctrico":[[50.0,1.15,true]],"Guitarra":[[35.0,0.35,true]],"Batería musical":[[50.0,2.0,true]],"Impresora grande":[[25.0,0.6,true]],"Caja herramientas":[[15.0,0.2,false]],"Aspiradora":[[15.0,0.25,false]],"Escalera":[[25.0,0.4,false]],"Radiador portátil":[[25.0,0.18,false]],"Cuadro grande":[[25.0,0.2,true]],"Cuadro pequeño":[[10.0,0.08,true]],"Planta grande":[[25.0,0.4,false]],"Planta pequeña":[[15.0,0.2,false]],"Jaula mascota":[[10.0,0.5,false]],"Acuario pequeño":[[35.0,0.35,false]],"Acuario grande":[[50.0,1.0,false]],"Silla plegable":[[5.0,0.15,false]],"Mesa plegable":[[25.0,0.45,false]],"Barbacoa":[[25.0,0.18,false]],"Sombrilla":[[10.0,1.2,false]],"Bicicleta estática":[[25.0,1.5,false]],"Cinta correr":[[25.0,2.0,false]],"Máquina gimnasio":[[25.0,1.8,false]],"Pesas":[[8.0,0.35,false]],"Archivador":[[20.0,0.8,false]],"Torre ordenador":[[35.0,0.15,false]],"Proyector":[[15.0,0.8,false]],"Router / equipos internet":[[10.0,0.04,true]],"Cortacésped":[[25.0,1.1,false]],"Herramientas jardín":[[25.0,0.45,false]],"Manguera jardín":[[20.0,0.8,false]],"Macetero grande":[[20.0,0.7,false]],"Macetero pequeño":[[10.0,0.18,false]]};

function numero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function redondear(v) { return Number(v.toFixed(2)); }
function parseExtras(valor) {
  const texto = String(valor || "");
  const leerCantidad = (nombre) => {
    // Exigir inicio de texto o separador para no confundir
    // "Montaje" con la palabra "Desmontaje".
    const re = new RegExp(
      String.raw`(?:^|\s\|\s|,\s*)${nombre}\s*[×x]\s*(\d+)`,
      "i"
    );
    const m = texto.match(re);
    return m ? Number(m[1]) : 0;
  };
  const seguroMatch = texto.match(/Seguro:\s*([\d.,]+)\s*€/i);
  const seguro = seguroMatch ? Number(seguroMatch[1].replace(",", ".")) : 0;
  return {
    desmontaje: leerCantidad("Desmontaje"),
    montaje: leerCantidad("Montaje"),
    embalaje: leerCantidad("Embalaje"),
    empaquetado: leerCantidad("Empaquetado"),
    seguro
  };
}
function calcularPrecio(reserva) {
  const km = numero(reserva.km);
  if (!Number.isFinite(km) || km <= 0 || km > 5000) {
    throw new Error("La distancia guardada no es válida.");
  }

  let inventario = reserva.inventario;
  if (typeof inventario === "string") {
    try { inventario = JSON.parse(inventario); } catch { throw new Error("El inventario guardado no es válido."); }
  }
  if (!Array.isArray(inventario)) throw new Error("La reserva no contiene un inventario válido.");

  let volumen = 0;
  let totalInventario = 0;
  for (const item of inventario) {
    const nombre = String(item.nombre || "").trim();
    const cantidad = numero(item.cantidad);
    const precio = numero(item.precio);
    const m3 = numero(item.metrosCubicos ?? item.m3);
    const fragil = item.fragil === true || item.fragil === "si";
    if (!nombre || !Number.isInteger(cantidad) || cantidad < 0 || cantidad > 500) {
      throw new Error("Hay un artículo del inventario con datos no válidos.");
    }
    if (cantidad === 0) continue;

    if (item.es_extra_mudanza_total === true) {
      const bonus = {
        "Caja Pequeña": [0, 0.036],
        "Caja Mediana": [0, 0.072],
        "Caja Grande": [0, 0.096]
      }[nombre];
      if (!bonus || precio !== 0 || Math.abs(m3 - bonus[1]) > 0.0001) {
        throw new Error("Hay una caja promocional no válida.");
      }
      volumen += cantidad * bonus[1];
      continue;
    }

    const variantes = CATALOGO[nombre];
    const permitida = variantes && variantes.some(v =>
      Math.abs(v[0] - precio) < 0.001 &&
      Math.abs(v[1] - m3) < 0.001 &&
      Boolean(v[2]) === fragil
    );
    if (!permitida) throw new Error("El inventario contiene un artículo o precio no reconocido: " + nombre);
    totalInventario += cantidad * precio;
    volumen += cantidad * m3;
  }

  const pisoOrigen = numero(reserva.piso_origen || 0);
  const pisoDestino = numero(reserva.piso_destino || 0);
  if (![pisoOrigen, pisoDestino].every(n => Number.isInteger(n) && n >= 0 && n <= 100)) {
    throw new Error("Los datos de acceso no son válidos.");
  }
  let extrasAcceso = 0;
  if (reserva.ascensor_origen === "no" && pisoOrigen > 0) extrasAcceso += pisoOrigen <= 3 ? 35 : 65;
  if (reserva.ascensor_destino === "no" && pisoDestino > 0) extrasAcceso += pisoDestino <= 3 ? 35 : 65;

  const total = String(reserva.tipo_servicio || "").toLowerCase().includes("total");
  const extras = parseExtras(reserva.extras);
  const cantidades = [extras.desmontaje, extras.montaje, extras.embalaje, extras.empaquetado];
  if (!cantidades.every(n => Number.isInteger(n) && n >= 0 && n <= 100) ||
      !Number.isFinite(extras.seguro) || extras.seguro < 0 || extras.seguro > 10000000) {
    throw new Error("Los servicios adicionales guardados no son válidos.");
  }

  let servicios = 0;
  if (!total) {
    servicios =
      extras.desmontaje * 20 +
      extras.montaje * 30 +
      extras.embalaje * 10 +
      extras.empaquetado * 12 +
      (extras.seguro > 0 ? Math.ceil(extras.seguro / 1000) * 20 : 0);
  }

  const recargo = volumen >= 25 ? 420 : volumen >= 20 ? 280 : volumen >= 10 ? 160 : volumen >= 5 ? 90 : 0;
  let totalFinal = km * 0.75 + extrasAcceso + totalInventario + servicios + recargo;
  if (total) totalFinal += 249;
  if (volumen >= 30) totalFinal += 250;
  totalFinal = redondear(totalFinal);
  if (!(totalFinal > 0)) throw new Error("El importe calculado no es válido.");

  return { total: totalFinal, reserva: redondear(totalFinal * 0.30), volumen: Number(volumen.toFixed(3)) };
}

function metadataTexto(valor) {
  return String(valor ?? "").slice(0, 500);
}

function construirParametrosSesion(reserva, precio) {
  const importeTotal = precio.total.toFixed(2);
  const importeReserva = precio.reserva.toFixed(2);
  return {
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: String(reserva.email || "").trim().toLowerCase(),
    metadata: {
      numero_reserva: metadataTexto(reserva.numero_reserva),
      franja_horaria_recogida: metadataTexto(reserva.franja_horaria_recogida),
      nombre: metadataTexto(reserva.nombre),
      telefono: metadataTexto(reserva.telefono),
      origen: metadataTexto(reserva.origen),
      destino: metadataTexto(reserva.destino),
      km: metadataTexto(reserva.km),
      fecha: metadataTexto(reserva.fecha),
      volumen: metadataTexto(precio.volumen),
      ascensor: metadataTexto(reserva.ascensor),
      ascensor_origen: metadataTexto(reserva.ascensor_origen),
      piso_origen: metadataTexto(reserva.piso_origen),
      ascensor_destino: metadataTexto(reserva.ascensor_destino),
      piso_destino: metadataTexto(reserva.piso_destino),
      extras: metadataTexto(reserva.extras),
      observaciones: metadataTexto(reserva.observaciones),
      tipo_servicio: metadataTexto(reserva.tipo_servicio),
      preciototal: importeTotal,
      precioreserva: importeReserva
    },
    line_items: [{
      price_data: {
        currency: "eur",
        product_data: { name: "Reserva Mudanza RODAX" },
        unit_amount: Math.round(precio.reserva * 100)
      },
      quantity: 1
    }],
    success_url: "https://rodaxmudanzasweb.vercel.app/confirmacion.html?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://rodaxmudanzasweb.vercel.app/?pago=cancel"
  };
}

function sesionCoincide(sesion, parametros) {
  const meta = sesion.metadata || {};
  const metaNueva = parametros.metadata || {};
  return sesion.status === "open" &&
    sesion.mode === "payment" &&
    sesion.currency === "eur" &&
    Number(sesion.amount_total) === parametros.line_items[0].price_data.unit_amount &&
    String(sesion.customer_email || "").trim().toLowerCase() === parametros.customer_email &&
    meta.numero_reserva === metaNueva.numero_reserva &&
    meta.preciototal === metaNueva.preciototal &&
    meta.precioreserva === metaNueva.precioreserva &&
    meta.fecha === metaNueva.fecha &&
    Number(sesion.expires_at || 0) * 1000 > Date.now() + 60 * 1000;
}

async function expirarSesionSinError(idSesion) {
  try {
    await stripe.checkout.sessions.expire(idSesion);
  } catch (err) {
    console.warn("No se pudo expirar la sesión de Stripe:", idSesion, err.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    // El navegador solo identifica la reserva. Ningún importe enviado por él se utiliza.
    const numeroReserva = String(body?.numero_reserva || "").trim();
    if (!/^RDX-\d{2}-\d{6}$/.test(numeroReserva)) {
      return res.status(400).json({ error: "Número de reserva no válido." });
    }

    const { data: reserva, error } = await supabase
      .from("mudanzas")
      .select("*")
      .eq("numero_reserva", numeroReserva)
      .maybeSingle();

    if (error) throw error;
    if (!reserva) return res.status(404).json({ error: "No se encontró la reserva." });

    if (reserva.estado !== "Pendiente de pago" ||
        String(reserva.estado_pago || "").toLowerCase().startsWith("pagado")) {
      return res.status(409).json({ error: "Esta reserva ya no admite un nuevo pago." });
    }

    if (!reserva.email) {
      return res.status(422).json({ error: "La reserva no tiene un email válido." });
    }

    // Precio y anticipo se calculan con datos guardados y catálogo del servidor.
    const precio = calcularPrecio(reserva);
    const importeTotal = precio.total.toFixed(2);
    const importeReserva = precio.reserva.toFixed(2);
    const importeRestante = redondear(precio.total - precio.reserva);

    // Actualizar importes con control de estado. Se conservan los campos del esquema
    // utilizado por la versión anterior del parche.
    const { data: actualizada, error: errorUpdate } = await supabase
      .from("mudanzas")
      .update({
        preciototal: importeTotal,
        precioreserva: importeReserva,
        importe_total: Number(importeTotal),
        importe_reserva: Number(importeReserva),
        importe_restante: importeRestante
      })
      .eq("id", reserva.id)
      .eq("estado", "Pendiente de pago")
      .select("id")
      .maybeSingle();

    if (errorUpdate) throw errorUpdate;
    if (!actualizada) {
      return res.status(409).json({ error: "La reserva ha cambiado. Actualiza la página e inténtalo de nuevo." });
    }

    const parametros = construirParametrosSesion(reserva, precio);
    let sesionPreviaId = reserva.stripe_session_id || null;

    // Si hay una sesión anterior, comprobar si se puede reutilizar o si debe cerrarse.
    if (sesionPreviaId) {
      let sesionPrevia = null;
      try {
        sesionPrevia = await stripe.checkout.sessions.retrieve(sesionPreviaId);
      } catch (err) {
        if (!err || err.code !== "resource_missing") throw err;
      }

      if (sesionPrevia) {
        if (sesionPrevia.status === "complete" || sesionPrevia.payment_status === "paid") {
          return res.status(409).json({ error: "Esta reserva ya está pagada." });
        }

        if (sesionPrevia.status === "open") {
          if (sesionCoincide(sesionPrevia, parametros)) {
            return res.status(200).json({
              id: sesionPrevia.id,
              numero_reserva: numeroReserva
            });
          }
          await expirarSesionSinError(sesionPrevia.id);
        }
      }

      // Limpiar el vínculo anterior solo si sigue siendo el mismo.
      const { data: liberada, error: errorLiberar } = await supabase
        .from("mudanzas")
        .update({ stripe_session_id: null })
        .eq("id", reserva.id)
        .eq("stripe_session_id", sesionPreviaId)
        .eq("estado", "Pendiente de pago")
        .select("id")
        .maybeSingle();

      if (errorLiberar) throw errorLiberar;
      if (!liberada) {
        const { data: estadoActual, error: errorEstado } = await supabase
          .from("mudanzas")
          .select("stripe_session_id, estado")
          .eq("id", reserva.id)
          .maybeSingle();
        if (errorEstado) throw errorEstado;
        if (estadoActual?.stripe_session_id) {
          // Otra petición ya pudo crear/vincular una sesión válida.
          const concurrente = await stripe.checkout.sessions.retrieve(estadoActual.stripe_session_id);
          if (sesionCoincide(concurrente, parametros)) {
            return res.status(200).json({ id: concurrente.id, numero_reserva: numeroReserva });
          }
          return res.status(409).json({ error: "La reserva ya tiene otra sesión de pago." });
        }
      }
    }

    // Idempotencia Stripe: peticiones simultáneas con los mismos datos generan
    // la misma sesión. La referencia anterior distingue una nueva sesión tras expirar.
    const claveIdempotencia = "rodax-checkout-" + crypto
      .createHash("sha256")
      .update(JSON.stringify({ numeroReserva, sesionPreviaId, parametros }))
      .digest("hex");

    const session = await stripe.checkout.sessions.create(
      parametros,
      { idempotencyKey: claveIdempotencia }
    );

    // Vincular la sesión sin sobrescribir una sesión que otra petición haya asociado.
    const { data: vinculada, error: errorVincular } = await supabase
      .from("mudanzas")
      .update({ stripe_session_id: session.id })
      .eq("id", reserva.id)
      .eq("estado", "Pendiente de pago")
      .is("stripe_session_id", null)
      .select("id")
      .maybeSingle();

    if (errorVincular) {
      await expirarSesionSinError(session.id);
      throw errorVincular;
    }

    if (!vinculada) {
      const { data: actual, error: errorActual } = await supabase
        .from("mudanzas")
        .select("stripe_session_id, estado")
        .eq("id", reserva.id)
        .maybeSingle();

      if (errorActual) {
        await expirarSesionSinError(session.id);
        throw errorActual;
      }

      if (actual?.estado === "Pendiente de pago" &&
          actual.stripe_session_id === session.id) {
        return res.status(200).json({ id: session.id, numero_reserva: numeroReserva });
      }

      await expirarSesionSinError(session.id);
      return res.status(409).json({ error: "La reserva cambió mientras se creaba el pago. Inténtalo de nuevo." });
    }

    console.log("SESSION CREADA", session.id, "RESERVA", numeroReserva);
    return res.status(200).json({ id: session.id, numero_reserva: numeroReserva });

  } catch (err) {
    console.error("ERROR CREATE CHECKOUT:", err);
    if (err && Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({
      error: "No se pudo iniciar el pago. Revisa los datos de la reserva."
    });
  }
};
