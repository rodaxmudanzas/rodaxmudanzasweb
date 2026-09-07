/*
 * RODAX — Backfill de ubicación pública
 *
 * Requiere variables de entorno:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_MAPS_API_KEY   (preferido)
 *   ORS_API_KEY           (fallback)
 *
 * Nunca modifica origen ni destino.
 */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_API_KEY || "";

const ORS_API_KEY =
    process.env.ORS_API_KEY || "";

const PROVINCIA_A_CCAA = {
    "alava": "País Vasco", "araba": "País Vasco",
    "albacete": "Castilla-La Mancha",
    "alicante": "Comunidad Valenciana", "alacant": "Comunidad Valenciana",
    "almeria": "Andalucía",
    "asturias": "Principado de Asturias",
    "avila": "Castilla y León",
    "badajoz": "Extremadura",
    "barcelona": "Cataluña",
    "burgos": "Castilla y León",
    "caceres": "Extremadura",
    "cadiz": "Andalucía",
    "cantabria": "Cantabria",
    "castellon": "Comunidad Valenciana", "castello": "Comunidad Valenciana",
    "ciudad real": "Castilla-La Mancha",
    "cordoba": "Andalucía",
    "cuenca": "Castilla-La Mancha",
    "girona": "Cataluña", "gerona": "Cataluña",
    "granada": "Andalucía",
    "guadalajara": "Castilla-La Mancha",
    "guipuzcoa": "País Vasco", "gipuzkoa": "País Vasco",
    "huelva": "Andalucía",
    "huesca": "Aragón",
    "illes balears": "Illes Balears", "islas baleares": "Illes Balears",
    "jaen": "Andalucía",
    "la coruna": "Galicia", "a coruna": "Galicia",
    "lleida": "Cataluña", "lerida": "Cataluña",
    "leon": "Castilla y León",
    "lugo": "Galicia",
    "madrid": "Comunidad de Madrid",
    "malaga": "Andalucía",
    "murcia": "Región de Murcia",
    "navarra": "Comunidad Foral de Navarra",
    "ourense": "Galicia", "orense": "Galicia",
    "palencia": "Castilla y León",
    "pontevedra": "Galicia",
    "la rioja": "La Rioja",
    "salamanca": "Castilla y León",
    "segovia": "Castilla y León",
    "sevilla": "Andalucía",
    "soria": "Castilla y León",
    "tarragona": "Cataluña",
    "teruel": "Aragón",
    "toledo": "Castilla-La Mancha",
    "valencia": "Comunidad Valenciana",
    "valladolid": "Castilla y León",
    "vizcaya": "País Vasco", "bizkaia": "País Vasco",
    "zamora": "Castilla y León",
    "zaragoza": "Aragón",
    "ceuta": "Ceuta",
    "melilla": "Melilla"
};

function normalizar(valor) {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function comunidadDesdeProvincia(provincia) {
    const clave = normalizar(provincia);
    return PROVINCIA_A_CCAA[clave] || "";
}

function componenteGoogle(components, tipo) {
    return (
        components.find(c =>
            Array.isArray(c.types) && c.types.includes(tipo)
        )?.longText || ""
    ).trim();
}

async function geocodeGoogle(address) {
    if (!GOOGLE_MAPS_API_KEY) return null;

    const url =
        "https://geocode.googleapis.com/v4/geocode/address/" +
        encodeURIComponent(address) +
        `?regionCode=es&languageCode=es&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Google Geocoding ${response.status}`);
    }

    const json = await response.json();
    const result = json.results?.[0];

    if (!result) return null;

    const components = result.addressComponents || [];
    const postalAddress = result.postalAddress || {};

    const provincia =
        componenteGoogle(components, "administrative_area_level_2") ||
        postalAddress.administrativeArea ||
        "";

    const ciudad =
        postalAddress.locality ||
        componenteGoogle(components, "locality") ||
        componenteGoogle(components, "administrative_area_level_3") ||
        "";

    const cp =
        postalAddress.postalCode ||
        componenteGoogle(components, "postal_code") ||
        "";

    const comunidad =
        componenteGoogle(components, "administrative_area_level_1") ||
        comunidadDesdeProvincia(provincia);

    return {
        ciudad,
        cp,
        provincia,
        comunidad_autonoma: comunidad
    };
}

async function geocodeORS(address) {
    if (!ORS_API_KEY) return null;

    const url =
        `https://api.openrouteservice.org/geocode/search?api_key=${encodeURIComponent(ORS_API_KEY)}` +
        `&text=${encodeURIComponent(address)}&size=1&boundary.country=ES`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`ORS Geocoding ${response.status}`);
    }

    const json = await response.json();
    const item = json.features?.[0];
    if (!item) return null;

    const p = item.properties || {};
    const provincia =
        p.region || p.county || p.localadmin || "";

    return {
        ciudad:
            p.locality ||
            p.localadmin ||
            p.city ||
            p.municipality ||
            p.county ||
            "",
        cp: p.postalcode || "",
        provincia,
        comunidad_autonoma:
            comunidadDesdeProvincia(provincia)
    };
}

async function geocode(address) {
    if (GOOGLE_MAPS_API_KEY) {
        const google = await geocodeGoogle(address);
        if (google?.ciudad && google?.cp && google?.comunidad_autonoma) {
            return google;
        }
    }

    return geocodeORS(address);
}

function completo(ubicacion) {
    return Boolean(
        ubicacion?.ciudad &&
        ubicacion?.cp &&
        ubicacion?.comunidad_autonoma
    );
}

async function actualizarMudanza(mudanza) {
    const origen = await geocode(mudanza.origen);
    await new Promise(resolve => setTimeout(resolve, 350));
    const destino = await geocode(mudanza.destino);

    if (!completo(origen) || !completo(destino)) {
        console.warn(
            `⚠️ ID ${mudanza.id}: ubicación incompleta; no se modifica.`
        );
        return false;
    }

    const { error } = await supabase
        .from("mudanzas")
        .update({
            origen_ciudad: origen.ciudad,
            origen_cp: origen.cp,
            origen_provincia: origen.provincia,
            origen_comunidad_autonoma: origen.comunidad_autonoma,
            destino_ciudad: destino.ciudad,
            destino_cp: destino.cp,
            destino_provincia: destino.provincia,
            destino_comunidad_autonoma: destino.comunidad_autonoma
        })
        .eq("id", mudanza.id);

    if (error) throw error;

    console.log(
        `✅ ID ${mudanza.id}: ${origen.ciudad} ${origen.cp} / ${destino.ciudad} ${destino.cp}`
    );

    return true;
}

async function main() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    }

    if (!GOOGLE_MAPS_API_KEY && !ORS_API_KEY) {
        throw new Error("Falta GOOGLE_MAPS_API_KEY u ORS_API_KEY.");
    }

    const { data, error } = await supabase
        .from("mudanzas")
        .select("id, origen, destino")
        .or("origen_ciudad.is.null,origen_cp.is.null,origen_comunidad_autonoma.is.null,destino_ciudad.is.null,destino_cp.is.null,destino_comunidad_autonoma.is.null")
        .order("id", { ascending: true });

    if (error) throw error;

    console.log(`Mudanzas pendientes: ${data.length}`);

    let actualizadas = 0;

    for (const mudanza of data) {
        try {
            if (await actualizarMudanza(mudanza)) {
                actualizadas++;
            }
        } catch (error) {
            console.error(`❌ ID ${mudanza.id}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 350));
    }

    console.log(`Finalizado. Actualizadas: ${actualizadas}/${data.length}`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
