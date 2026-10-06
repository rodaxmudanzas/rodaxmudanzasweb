const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TIME_ZONE = "Europe/Madrid";

function madridNowParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  const get = (type) =>
    Number(parts.find((p) => p.type === type)?.value || 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second")
  };
}

function reservationDateParts(value) {
  const match =
    String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function sameCalendarDate(a, b) {
  return Boolean(
    a &&
    b &&
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day
  );
}

function buildPublicRoute(r) {
  const origen = [
    r.origen_ciudad,
    r.origen_cp,
    r.origen_comunidad_autonoma
  ].filter(Boolean).join(" - ");

  const destino = [
    r.destino_ciudad,
    r.destino_cp,
    r.destino_comunidad_autonoma
  ].filter(Boolean).join(" - ");

  return {
    origen: origen || "Origen pendiente",
    destino: destino || "Destino pendiente"
  };
}

function applyPrivacy(r, now) {
  const reservationDate =
    reservationDateParts(r.fecha);

  const sameDay =
    sameCalendarDate(reservationDate, now);

  const addressUnlocked =
    sameDay;

  const contactUnlocked =
    sameDay && now.hour >= 6;

  const publicRoute =
    buildPublicRoute(r);

  // Never send exact addresses before 00:00 of the service day.
  const origen = addressUnlocked
    ? (r.origen || publicRoute.origen)
    : publicRoute.origen;

  const destino = addressUnlocked
    ? (r.destino || publicRoute.destino)
    : publicRoute.destino;

  const transportista = r.transportista
    ? {
        id: r.transportista.id,
        nombre:
          r.transportista.nombre ||
          "Transportista RODAX",

        nombre_comercial:
          r.transportista.nombre_comercial ||
          null,

        telefono:
          contactUnlocked
            ? (r.transportista.telefono || null)
            : null,

        email:
          contactUnlocked
            ? (r.transportista.email || null)
            : null
      }
    : null;

  return {
    ...r,

    // Do not leak the nested source object to the browser.
    transportista: undefined,

    origen,
    destino,

    privacidad: {
      direccion_exacta_disponible:
        addressUnlocked,

      contacto_transportista_disponible:
        contactUnlocked,

      contacto_transportista_desde:
        "06:00",

      direccion_exacta_desde:
        "00:00",

      zona_horaria:
        TIME_ZONE
    },

    transportista_contacto:
      transportista
  };
}

module.exports = async (req, res) => {

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({
        error:"Método no permitido."
      });
  }

  try {

    const auth =
      req.headers.authorization || "";

    if (!auth.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({
          error:"No autenticado."
        });
    }

    const token =
      auth.slice(7);

    const {
      data: userData,
      error: userError
    } =
      await supabase.auth.getUser(token);

    if (
      userError ||
      !userData?.user?.email
    ) {
      return res
        .status(401)
        .json({
          error:"Sesión no válida."
        });
    }

    const email =
      userData.user.email
        .trim()
        .toLowerCase();

    const {
      data,
      error
    } =
      await supabase
        .from("mudanzas")
        .select([
          "id",
          "numero_reserva",
          "nombre",
          "email",
          "telefono",

          "origen",
          "destino",

          "origen_ciudad",
          "origen_cp",
          "origen_comunidad_autonoma",

          "destino_ciudad",
          "destino_cp",
          "destino_comunidad_autonoma",

          "fecha",
          "franja_horaria_recogida",
          "hora_llegada_confirmada",

          "volumen",

          "ascensor_origen",
          "piso_origen",

          "ascensor_destino",
          "piso_destino",

          "extras",
          "observaciones",

          "tipo_servicio",

                    "preciototal",
          "precioreserva",

          "importe_total",
          "importe_reserva",
          "importe_restante",

          "estado",
          "estado_pago",

          "transportista_id",

          "fecha_creacion"
        ].join(","))

        .ilike("email", email)

        .order(
          "fecha",
          {
            ascending:true
          }
        );

    if (error) throw error;

    // No dependemos de una relación FK declarada entre mudanzas y transportistas.
    // El servidor obtiene los perfiles por UUID y solo después aplica la privacidad.

    const transportistaIds =
      [
        ...new Set(
          (data || [])
            .map(r => r.transportista_id)
            .filter(Boolean)
        )
      ];

    let transportistas = [];

    if (transportistaIds.length) {

      const {
        data: transportistasData,
        error: transportistasError
      } =
        await supabase
          .from("transportistas")
          .select(
            "id,nombre,nombre_comercial,telefono,email"
          )
          .in(
            "id",
            transportistaIds
          );

      if (transportistasError) {
        throw transportistasError;
      }

      transportistas =
        transportistasData || [];
    }

    const transportistasById =
      new Map(
        transportistas.map(
          t => [
            String(t.id),
            t
          ]
        )
      );

    const now =
      madridNowParts();

    const reservas =
      (data || []).map(r =>
        applyPrivacy(
          {
            ...r,

            transportista:
              transportistasById.get(
                String(r.transportista_id)
              ) || null
          },

          now
        )
      );

    return res
      .status(200)
      .json({

        cliente: {
          nombre:
            data?.[0]?.nombre || "",

          email
        },

        privacidad: {

          zona_horaria:
            TIME_ZONE,

          direccion_exacta_desde:
            "00:00 del día del servicio",

          contacto_transportista_desde:
            "06:00 del día del servicio"
        },

        reservas
      });

  } catch (error) {

    console.error(
      "cliente-reservas:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          "No se pudieron cargar las reservas."
      });
  }
};