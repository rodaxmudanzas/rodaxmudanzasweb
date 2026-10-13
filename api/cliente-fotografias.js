
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = "documentos";
const CARPETA = "fotos-mudanzas";
const MAX_BYTES = 10 * 1024 * 1024;

function responder(res, status, data) {
  return res.status(status).json(data);
}

function listaFotos(value) {
  if (Array.isArray(value)) return value.filter(v => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(v => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function rutaDesdeUrl(value) {
  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

async function autenticar(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;

  const { data, error } = await supabase.auth.getUser(header.slice(7));
  if (error || !data?.user?.email) return null;

  return data.user;
}

async function obtenerMudanza(id, user) {
  const { data, error } = await supabase
    .from("mudanzas")
    .select("id,email,urls_fotos")
    .eq("id", id)
    .eq("email", user.email)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function obtenerObjetoStorage(path) {
  const separador = path.lastIndexOf("/");
  const carpeta = path.slice(0, separador);
  const nombre = path.slice(separador + 1);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(carpeta, {
      limit: 100,
      search: nombre
    });

  if (error) throw error;

  return (data || []).find(objeto => objeto.name === nombre) || null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return responder(res, 405, { error: "Método no permitido." });
  }

  try {
    const user = await autenticar(req);
    if (!user) {
      return responder(res, 401, { error: "Sesión no válida." });
    }

    const { accion, mudanza_id, nombre, tipo, url } = req.body || {};

    if (!mudanza_id) {
      return responder(res, 400, { error: "Falta la mudanza." });
    }

    const mudanza = await obtenerMudanza(mudanza_id, user);
    if (!mudanza) {
      return responder(res, 404, { error: "No se encontró tu mudanza." });
    }

    const fotos = listaFotos(mudanza.urls_fotos);

    if (accion === "preparar") {
      const nombreSeguro = String(nombre || "foto")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-100);

      const mime = String(tipo || "").toLowerCase();
      const extensiones = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
      };

      if (!extensiones[mime]) {
        return responder(res, 400, {
          error: "Solo se permiten imágenes JPG, PNG o WEBP."
        });
      }

      const path =
        `${CARPETA}/${mudanza.id}/${crypto.randomUUID()}-${nombreSeguro}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      return responder(res, 200, {
        path: data.path || path,
        token: data.token,
        publicUrl: publicData.publicUrl
      });
    }

    if (accion === "registrar") {
  if (typeof url !== "string") {
    return responder(res, 400, {
      error: "La URL de la fotografía no es válida."
    });
  }

  const path = rutaDesdeUrl(url);

  if (
    !path ||
    !path.startsWith(`${CARPETA}/${mudanza.id}/`) ||
    !/\.(jpe?g|png|webp)$/i.test(path)
  ) {
    return responder(res, 400, {
      error: "La fotografía no pertenece a esta mudanza."
    });
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  if (url !== publicData.publicUrl) {
    return responder(res, 400, {
      error: "La URL de la fotografía no es válida."
    });
  }

  // Comprobar que el archivo existe realmente en Storage.
  const objeto = await obtenerObjetoStorage(path);

  if (!objeto) {
    return responder(res, 400, {
      error: "La fotografía todavía no está subida a Storage."
    });
  }

  const metadata = objeto.metadata || {};
  const bytes = Number(metadata.size ?? metadata.contentLength);
  const mime = String(metadata.mimetype || "").toLowerCase();

  if (!Number.isFinite(bytes) || bytes < 0) {
    return responder(res, 422, {
      error: "No se pudo verificar el tamaño de la fotografía."
    });
  }

  if (bytes > MAX_BYTES) {
    return responder(res, 413, {
      error: "La fotografía supera el límite de 10 MB."
    });
  }

  const extensionesMime = {
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".png": ["image/png"],
    ".webp": ["image/webp"]
  };

  const extension = path
    .slice(path.lastIndexOf("."))
    .toLowerCase();

  if (!extensionesMime[extension]?.includes(mime)) {
    return responder(res, 400, {
      error: "El formato real de la fotografía no es válido."
    });
  }

  if (!fotos.includes(url)) {
    fotos.push(url);
  }

  const { error } = await supabase
    .from("mudanzas")
    .update({ urls_fotos: fotos })
    .eq("id", mudanza.id)
    .eq("email", user.email);

  if (error) throw error;

  return responder(res, 200, {
    ok: true,
    urls_fotos: fotos
  });
}

    if (accion === "eliminar") {
  if (typeof url !== "string" || !fotos.includes(url)) {
    return responder(res, 404, {
      error: "La fotografía no figura en esta mudanza."
    });
  }

  const path = rutaDesdeUrl(url);
  const esFotoNueva = Boolean(
    path && path.startsWith(`${CARPETA}/${mudanza.id}/`)
  );

  const restantes = fotos.filter(foto => foto !== url);

  // Primero quitamos la referencia de la base de datos.
  const { error: dbError } = await supabase
    .from("mudanzas")
    .update({ urls_fotos: restantes })
    .eq("id", mudanza.id)
    .eq("email", user.email);

  if (dbError) throw dbError;

  // Solo borramos físicamente las fotos de la carpeta individual.
  // Si falla Storage, la foto ya no aparecerá en la galería.
  if (esFotoNueva) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (storageError) {
      console.error(
        "No se pudo borrar el archivo de Storage:",
        storageError
      );

      return responder(res, 200, {
        ok: true,
        urls_fotos: restantes,
        aviso: "La foto se quitó de la galería, pero el archivo no pudo eliminarse del almacenamiento."
      });
    }
  }

  return responder(res, 200, {
    ok: true,
    urls_fotos: restantes
  });
}

    return responder(res, 400, { error: "Acción no válida." });
  } catch (error) {
    console.error("cliente-fotografias:", error);
    return responder(res, 500, {
      error: "No se pudo completar la operación de fotografías."
    });
  }
};
