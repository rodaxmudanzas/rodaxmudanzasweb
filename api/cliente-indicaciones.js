// RODAX MUDANZAS - BLOQUE 7: Indicaciones para el transportista.
//
// El cliente edita desde el Área Cliente el texto que ya escribió en la Home.
// Se guarda en mudanzas.observaciones (la misma columna que lee el Panel
// Transportista y que leerá el Área Administración) y se deja el historial en
// solicitudes_modificacion con estado "aplicada".
//
// Reglas: sesión válida, mudanza del propio cliente, máximo 500 caracteres,
// mudanza no cancelada ni finalizada y editable solo hasta las 00:00
// (Europe/Madrid) del día del servicio.

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TIME_ZONE = "Europe/Madrid";
const MAX_CARACTERES = 500;

function responder(res, status, data) {
  return res.status(status).json(data);
}

async function autenticar(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;

  const { data, error } = await supabase.auth.getUser(header.slice(7));
  if (error || !data?.user?.email) return null;

  return data.user;
}

// Fecha de hoy en Madrid con formato YYYY-MM-DD.
function hoyMadrid() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

// Devuelve YYYY-MM-DD si el valor es una fecha de calendario válida.
function fechaServicio(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const comprobada = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    comprobada.getUTCFullYear() !== anio ||
    comprobada.getUTCMonth() !== mes - 1 ||
    comprobada.getUTCDate() !== dia
  ) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function estadoCerrado(estado) {
  const normalizado = String(estado || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return /cancel|completad|finaliz|realizad/.test(normalizado);
}

function limpiarTexto(value) {
  return String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return responder(res, 405, { error: "Método no permitido." });
  }

  try {
    const user = await autenticar(req);
    if (!user) {
      return responder(res, 401, { error: "No autenticado." });
    }

    const { mudanza_id, observaciones } = req.body || {};

    if (!mudanza_id || typeof observaciones !== "string") {
      return responder(res, 400, { error: "Faltan datos de las indicaciones." });
    }

    const texto = limpiarTexto(observaciones);

    if (texto.length > MAX_CARACTERES) {
      return responder(res, 400, {
        error: `Las indicaciones no pueden superar los ${MAX_CARACTERES} caracteres.`
      });
    }

    const email = user.email.trim().toLowerCase();

    const { data: mudanza, error: mudanzaError } = await supabase
      .from("mudanzas")
      .select("id,numero_reserva,email,estado,fecha,observaciones")
      .eq("id", mudanza_id)
      .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
      .maybeSingle();

    if (mudanzaError) throw mudanzaError;

    if (!mudanza) {
      return responder(res, 404, { error: "No se encontró tu mudanza." });
    }

    if (estadoCerrado(mudanza.estado)) {
      return responder(res, 403, {
        error: "Esta mudanza ya está cancelada o finalizada."
      });
    }

    const servicio = fechaServicio(mudanza.fecha);

    if (!servicio) {
      return responder(res, 409, {
        error: "No se puede comprobar la fecha del servicio."
      });
    }

    // Editable solo antes de las 00:00 del día del servicio.
    if (hoyMadrid() >= servicio) {
      return responder(res, 403, {
        error:
          "El plazo para modificar las indicaciones terminó a las 00:00 del día del servicio."
      });
    }

    const anterior = String(mudanza.observaciones || "");

    if (anterior.trim() === texto) {
      return responder(res, 200, { observaciones: anterior, sin_cambios: true });
    }

    const { data: actualizadas, error: updateError } = await supabase
      .from("mudanzas")
      .update({ observaciones: texto })
      .eq("id", mudanza.id)
      .eq("email", mudanza.email)
      .select("id");

    if (updateError) throw updateError;

    if (!actualizadas || actualizadas.length === 0) {
      return responder(res, 409, {
        error: "No se pudieron guardar las indicaciones. Inténtalo de nuevo."
      });
    }

    // Historial para Administración. Si falla, el cambio ya está aplicado:
    // se registra el error en el servidor y no se bloquea al cliente.
    const { error: historialError } = await supabase
      .from("solicitudes_modificacion")
      .insert({
        mudanza_id: mudanza.id,
        numero_reserva: mudanza.numero_reserva,
        email_cliente: email,
        cambios: {
          tipo: "indicaciones",
          campo: "observaciones",
          anterior,
          nuevo: texto,
          aplicada_automaticamente: true
        },
        estado: "aplicada"
      });

    if (historialError) {
      console.error(
        "No se pudo guardar el historial de indicaciones:",
        historialError
      );
    }

    return responder(res, 200, { observaciones: texto });
  } catch (error) {
    console.error("Error en cliente-indicaciones:", error);
    return responder(res, 500, {
      error: "No se pudieron guardar las indicaciones."
    });
  }
};