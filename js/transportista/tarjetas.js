function obtenerUbicacionCorta(d){if(window.Transportista?.obtenerUbicacionCorta)return window.Transportista.obtenerUbicacionCorta(d);const p=String(d||"").split(",").map(x=>x.trim()).filter(Boolean);if(p.length>=4)return `${p[1]}, ${p[2]}, ${p[3]}`;if(p.length==3)return p.join(", ");return d||"Ubicación no disponible";}
/* ============================================================
   RODAX TRANSPORTISTA
   tarjetas.js
   ------------------------------------------------------------
   RESPONSABILIDAD:
   - Generar tarjetas visuales del Marketplace.
   - Generar tarjetas de Mis Mudanzas Activas.
   - Preparar los datos necesarios para la presentación.
   - NO consulta Supabase.
   - NO modifica Supabase.
   - NO calcula precios económicos.
   - NO inventa horarios.
   - Utiliza las funciones comunes expuestas por utils.js.
   ============================================================ */

(function () {

    "use strict";


    //////////////////////////////////////////////////////////////
    // API GLOBAL
    //////////////////////////////////////////////////////////////

    window.Transportista =
        window.Transportista || {};


    //////////////////////////////////////////////////////////////
    // CONFIGURACIÓN VISUAL
    //////////////////////////////////////////////////////////////

    const TARJETAS_CONFIG = {

        marketplace: {

            serviciosMudanzaTotal: 6,

            operariosTexto:
                "2 operarios",

            observacionesTexto:
                "Observaciones"

        },

        activas: {

            horasDesbloqueo:
                24

        }

    };


    //////////////////////////////////////////////////////////////
    // ESCAPAR HTML
    //////////////////////////////////////////////////////////////

    function escapeHtml(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

    // CORRECCIÓN CENTRALIZADA: Extractor nativo robusto para formato exacto "Ciudad - CP XXXXX - Comunidad Autónoma"
    function obtenerUbicacionCorta(d){

        if(window.Transportista?.obtenerUbicacionCorta)
            return window.Transportista.obtenerUbicacionCorta(d);

        if(!d) return "Ubicación no disponible";

        const texto=String(d).trim();

        const cp=(texto.match(/\b\d{5}\b/)||[])[0]||"";

        const partes=texto
            .split(",")
            .map(x=>x.trim())
            .filter(Boolean);

        const comunidades=[
            "Andalucía","Aragón","Asturias","Illes Balears",
            "Canarias","Cantabria","Castilla-La Mancha",
            "Castilla y León","Cataluña","Catalunya",
            "Comunidad Valenciana","Extremadura","Galicia",
            "Comunidad de Madrid","Madrid","Murcia","Navarra",
            "País Vasco","La Rioja","Ceuta","Melilla"
        ];

        const comunidad=partes.find(p=>
            comunidades.some(c=>p.includes(c))
        )||"";

        let ciudad="";

        const indiceCP=partes.findIndex(p=>/\b\d{5}\b/.test(p));

        if(indiceCP>0){
            ciudad=partes[indiceCP-1];
        }else{
            for(const p of partes){
                if(p===comunidad) continue;
                if(/\d{5}/.test(p)) continue;
                if(/España|Spain|Spania|Spanien/i.test(p)) continue;
                ciudad=p;
                break;
            }
        }

        if(ciudad&&cp&&comunidad)
            return `${ciudad} - CP ${cp} - ${comunidad}`;

        if(ciudad&&cp)
            return `${ciudad} - CP ${cp}`;

        return texto;
    }

    //////////////////////////////////////////////////////////////
    // OBTENER CONFIGURACIÓN
    //////////////////////////////////////////////////////////////

    function obtenerConfigTarjetas() {

        return TARJETAS_CONFIG;

    }


    //////////////////////////////////////////////////////////////
    // NORMALIZAR TEXTO
    //////////////////////////////////////////////////////////////

    function normalizarTexto(valor) {

        return String(valor ?? "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    }

    //////////////////////////////////////////////////////////////
// UBICACIÓN PÚBLICA — CIUDAD + CP + COMUNIDAD AUTÓNOMA
//////////////////////////////////////////////////////////////

function obtenerUbicacionPublica(
    mudanza,
    tipo
) {

    const origen =
        tipo === "origen";

    const ciudad =
        origen
            ? (
                mudanza?.origen_ciudad ??
                mudanza?.ciudad_origen ??
                mudanza?.ciudadOrigen ??
                mudanza?.localidad_origen ??
                mudanza?.municipio_origen ??
                mudanza?.poblacion_origen ??
                ""
            )
            : (
                mudanza?.destino_ciudad ??
                mudanza?.ciudad_destino ??
                mudanza?.ciudadDestino ??
                mudanza?.localidad_destino ??
                mudanza?.municipio_destino ??
                mudanza?.poblacion_destino ??
                ""
            );

    const codigoPostal =
        origen
            ? (
                mudanza?.origen_cp ??
                mudanza?.cp_origen ??
                mudanza?.codigo_postal_origen ??
                mudanza?.postal_origen ??
                ""
            )
            : (
                mudanza?.destino_cp ??
                mudanza?.cp_destino ??
                mudanza?.codigo_postal_destino ??
                mudanza?.postal_destino ??
                ""
            );

    const comunidad =
        origen
            ? (
                mudanza?.origen_comunidad_autonoma ??
                mudanza?.comunidad_autonoma_origen ??
                mudanza?.comunidad_origen ??
                mudanza?.autonomia_origen ??
                mudanza?.comunidadOrigen ??
                ""
            )
            : (
                mudanza?.destino_comunidad_autonoma ??
                mudanza?.comunidad_autonoma_destino ??
                mudanza?.comunidad_destino ??
                mudanza?.autonomia_destino ??
                mudanza?.comunidadDestino ??
                ""
            );

    const partes = [
        ciudad,
        codigoPostal,
        comunidad
    ]
        .map(
            valor =>
                String(valor || "").trim()
        )
        .filter(Boolean);

    return partes.length
        ? partes.join(" · ")
        : "Ubicación no disponible";
}

    //////////////////////////////////////////////////////////////
    // DETECTAR MUDANZA TOTAL
    //////////////////////////////////////////////////////////////

    function esMudanzaTotal(mudanza) {

        const tipo =
            normalizarTexto(
                mudanza?.tipo_servicio
            );

        return tipo.includes("total");

    }


    //////////////////////////////////////////////////////////////
    // FECHA — DÍA Y MES
    //////////////////////////////////////////////////////////////

    function obtenerDiaMes(fecha) {

        if (!fecha) {

            return {

                dia: "—",

                mes: "—"

            };

        }


        const fechaTexto =
            String(fecha)
                .trim();


        /*
         * Si viene como YYYY-MM-DD,
         * utilizamos los componentes directamente
         * para evitar desplazamientos de zona horaria.
         */

        const match =
            fechaTexto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (match) {

            const meses = [

                "ENE",
                "FEB",
                "MAR",
                "ABR",
                "MAY",
                "JUN",
                "JUL",
                "AGO",
                "SEP",
                "OCT",
                "NOV",
                "DIC"

            ];


            const mesNumero =
                parseInt(
                    match[2],
                    10
                );


            const dia =
                parseInt(
                    match[3],
                    10
                );


            if (
                mesNumero >= 1 &&
                mesNumero <= 12
            ) {

                return {

                    dia:
                        String(dia),

                    mes:
                        meses[mesNumero - 1]

                };

            }

        }


        const fechaT =
            new Date(fecha);


        if (
            Number.isNaN(
                fechaT.getTime()
            )
        ) {

            return {

                dia: "—",

                mes: "—"

            };

        }


        const meses = [

            "ENE",
            "FEB",
            "MAR",
            "ABR",
            "MAY",
            "JUN",
            "JUL",
            "AGO",
            "SEP",
            "OCT",
            "NOV",
            "DIC"

        ];


        return {

            dia:
                String(
                    fechaT.getDate()
                ),

            mes:
                meses[
                    fechaT.getMonth()
                ]

        };

    }


    //////////////////////////////////////////////////////////////
    // FORMATO DE FECHA COMPLETA
    //////////////////////////////////////////////////////////////

    function obtenerFechaCompleta(fecha) {

        if (!fecha) {

            return "Fecha no disponible";

        }


        const fechaTexto =
            String(fecha)
                .trim();


        const match =
            fechaTexto.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (match) {

            const fechaLocal =
                new Date(

Number(match[1]),
Number(match[2]) - 1,
Number(match[3])
);
if (
!Number.isNaN(
fechaLocal.getTime()
)
) {
return fechaLocal.toLocaleDateString(
"es-ES",
{
weekday: "long",
day: "numeric",
month: "long",
year: "numeric"
}
);
}
}
const fechaT =
new Date(fecha);
if (
Number.isNaN(
fechaT.getTime()
)
) {
return fechaTexto;
}
return fechaT.toLocaleDateString(
"es-ES",
{
weekday: "long",
day: "numeric",
month: "long",
year: "numeric"
}
);
}
//////////////////////////////////////////////////////////////
// HORARIO
//////////////////////////////////////////////////////////////
function obtenerHorario(mudanza) {
const t =
mudanza || {};
const candidatosTexto = [
t.franja_horaria_recogida,
t.franja_horaria,
t.franjaHoraria,
t.horario,
t.horario_mudanza,
t.horarioMudanza,
t.hora_llegada,
t.horaLlegada,
t.hora_inicio_fin,
t.horaInicioFin
];
for (
const valor
of candidatosTexto
) {
if (
valor !== null &&
valor !== undefined &&
String(valor).trim() !== ""
) {
const texto =
String(valor)
.trim();
if (
texto.includes("-") ||
texto.includes("–") ||
texto.includes("a")
) {
return texto;
}
}
}
const horaInicio =
t.hora_inicio ??
t.horaInicio ??
t.hora_desde ??
t.horaDesde ??
null;
const horaFin =
t.hora_fin ??
t.horaFin ??
t.hora_hasta ??
t.horaHasta ??
null;
if (
horaInicio &&
horaFin
) {
return ${String(horaInicio).trim()} – ${String(horaFin).trim()};
}
if (horaInicio) {
return String(
horaInicio
).trim();
}
return "Horario pendiente de elección";
}
//////////////////////////////////////////////////////////////
// FOTOS
//////////////////////////////////////////////////////////////
function contarFotos(urlsFotos) {
if (!urlsFotos) {
return 0;
}
if (
Array.isArray(urlsFotos)
) {
return urlsFotos
.map(
url =>
String(url).trim()
)
.filter(Boolean)
.length;
}
if (
typeof urlsFotos === "string"
) {
const texto =
urlsFotos.trim();
if (
texto.startsWith("[") &&
texto.endsWith("]")
) {
try {
const parsed =
JSON.parse(texto);
if (
Array.isArray(parsed)
) {
return parsed
.map(
url =>
String(url).trim()
)
.filter(Boolean)
.length;
}
} catch (error) {
}
}
return texto
.split(/,|\s*|\s*/)
.map(
url =>
url.trim()
)
.filter(Boolean)
.length;
}
return 0;
}
//////////////////////////////////////////////////////////////
// OBTENER EXTRAS DE MUDANZA TOTAL
//////////////////////////////////////////////////////////////
function obtenerExtrasMudanzaTotal(mudanza) {
const t = mudanza || {};
const total = esMudanzaTotal(t);
if (!total) return [];
const api = window.Transportista;
let datos = null;
if (api && typeof api.obtenerExtrasMudanzaTotal === "function") {
datos = api.obtenerExtrasMudanzaTotal(t);
}
if (!datos) {
datos = {
"Cajas pequeñas": 0,
"Cajas medianas": 0,
"Cajas grandes": 0
};
let arr = t.inventario;
if (typeof arr === "string") { try { arr = JSON.parse(arr); } catch { arr = []; } }
if (!Array.isArray(arr)) arr = [];
arr.forEach(item => {
const nombre = normalizarTexto(item?.nombre ?? item?.mueble ?? item?.item ?? "");
const cantidad = Number.parseInt(item?.cantidad, 10) || 0;
if (nombre === "caja pequena") datos["Cajas pequeñas"] += cantidad;
if (nombre === "caja mediana") datos["Cajas medianas"] += cantidad;
if (nombre === "caja grande") datos["Cajas grandes"] += cantidad;
});
}
return Object.entries(datos).map(([nombre, cantidad]) => ({
nombre,
cantidad: Number(cantidad) || 0
}));
}
//////////////////////////////////////////////////////////////
// INVENTARIO
//////////////////////////////////////////////////////////////
function obtenerInventario(mudanza) {
const inventario =
mudanza?.inventario;
if (
window.Transportista &&
typeof window.Transportista.parseInventario ===
"function"
) {
return window.Transportista.parseInventario(
inventario
);
}
if (
Array.isArray(inventario)
) {
return inventario;
}
if (
typeof inventario === "string"
) {
try {
const parsed =
JSON.parse(inventario);
return Array.isArray(parsed)
? parsed
: [];
} catch (error) {
return [];
}
}
return [];
}
//////////////////////////////////////////////////////////////
// INVENTARIO VISIBLE
//////////////////////////////////////////////////////////////
function prepararInventarioVisible(mudanza) {
const t = mudanza || {};
const api = window.Transportista;
if (api && typeof api.separarInventarioMudanza === "function") {
return api.separarInventarioMudanza(t.inventario, t.tipo_servicio).visible
.map(item => ({
nombre: String(item.nombre || "Artículo").trim(),
cantidad: Math.max(0, Number.parseInt(item.cantidad, 10) || 0),
categoria: item.categoria || (typeof api.obtenerCategoriaInventario === "function" ? api.obtenerCategoriaInventario(item.nombre) : "Otros")
}))
.filter(item => item.cantidad > 0);
}
const inventario = obtenerInventario(t);
const total = esMudanzaTotal(t);
const extras = new Set(["caja pequena", "caja mediana", "caja grande"]);
return inventario.map(item => {
const nombre = String(item?.nombre ?? item?.mueble ?? item?.descripcion ?? "Artículo").trim();
return {
nombre,
cantidad: Math.max(0, Number.parseInt(item?.cantidad, 10) || 0),
categoria: item?.categoria ?? item?.grupo ?? item?.seccion ?? "Otros"
};
}).filter(item => item.cantidad > 0 && !(total && extras.has(normalizarTexto(item.nombre))));
}
//////////////////////////////////////////////////////////////
// AGRUPAR INVENTARIO POR CATEGORÍA
//////////////////////////////////////////////////////////////
function agruparInventario(inventario) {
const grupos = {};
const orden = ["Salón", "Cocina", "Comedor", "Dormitorio", "Baño", "Otros"];
orden.forEach(categoria => grupos[categoria] = []);
inventario.forEach(item => {
const categoria = String(item.categoria || "Otros").trim();
if (!grupos[categoria]) grupos[categoria] = [];
grupos[categoria].push(item);
});
return grupos;
}
//////////////////////////////////////////////////////////////
// HTML DEL INVENTARIO
//////////////////////////////////////////////////////////////
function crearHTMLInventario(
inventario,
extras
) {
if (
!inventario.length &&
!extras.length
) {
return `
${
obtenerInventarioVisible(mudanza).length
? obtenerInventarioVisible(mudanza)
.map(item=>`
${escapeHtml(item.nombre)}
${item.cantidad}
`)
.join("")
: `
No se especificó inventario detallado.

`
}
`;
}
let html = "";
if (
inventario.length
) {
const grupos =
agruparInventario(
inventario
);
html += `
Inventario

${inventario.reduce(
(total, item) =>
total + item.cantidad,
0
)} artículos
`;
Object.entries(grupos)
.forEach(
([categoria, items]) => {
html += `
${escapeHtml(
categoria
)}
`;
items.forEach(
item => {
html += `
${escapeHtml(
item.nombre
)}

x${item.cantidad}

`;
}
);
html += `
`;
}
);
html += `
`;
}
if (
extras.length
) {
html += `
Extras — Beneficios Mudanza Total

`;
extras.forEach(
item => {
html += `
${escapeHtml(
item.nombre
)}

x${item.cantidad}

`;
}
);
html += `
`;
}
return html;
}
//////////////////////////////////////////////////////////////
// DATOS COMUNES DE UNA MUDANZA
//////////////////////////////////////////////////////////////
function obtenerDatosMudanza(
mudanza
) {
const t =
mudanza || {};
const esTotal =
esMudanzaTotal(t);
//////////////////////////////////////////////////////////
// ARTÍCULOS
//////////////////////////////////////////////////////////
let numArticulos = 0;
if (
window.Transportista &&
typeof window.Transportista.getTotalArticulos ===
"function"
) {
numArticulos =
window.Transportista.getTotalArticulos(
t.inventario,
t.tipo_servicio
);
}
//////////////////////////////////////////////////////////
// M³
//////////////////////////////////////////////////////////
let totalM3 = 0;
let m3Texto =
"0,0 m³";
if (
window.Transportista &&
typeof window.Transportista.getTotalM3 ===
"function"
) {
totalM3 =
window.Transportista.getTotalM3(
t.inventario,
t.tipo_servicio
);
}
if (
window.Transportista &&
typeof window.Transportista.formatM3 ===
"function"
) {
m3Texto =
window.Transportista.formatM3(
totalM3
);
}
//////////////////////////////////////////////////////////
// ACCESOS
//////////////////////////////////////////////////////////
let accesos = {
recogida:
"Acceso por confirmar",
entrega:
"Acceso por confirmar"
};
if (
window.Transportista &&
typeof window.Transportista.getAccesos ===
"function"
) {
accesos =
window.Transportista.getAccesos(
t
) || accesos;
}
//////////////////////////////////////////////////////////
// FOTOS
//////////////////////////////////////////////////////////
const numFotos =
contarFotos(
t.urls_fotos
);
//////////////////////////////////////////////////////////
// INVENTARIO
//////////////////////////////////////////////////////////
const inventario =
prepararInventarioVisible(
t
);
//////////////////////////////////////////////////////////
// EXTRAS
//////////////////////////////////////////////////////////
const extras =
obtenerExtrasMudanzaTotal(
t
);
//////////////////////////////////////////////////////////
// SERVICIOS
//////////////////////////////////////////////////////////
const serviciosContratados =
esTotal
? TARJETAS_CONFIG
.marketplace
.serviciosMudanzaTotal
: 1;
//////////////////////////////////////////////////////////
// RESERVA
//////////////////////////////////////////////////////////
let numeroReserva =
"—";
if (
window.Transportista &&
typeof window.Transportista.getNumeroReserva ===
"function"
) {
numeroReserva =
window.Transportista.getNumeroReserva(
t
);
}
//////////////////////////////////////////////////////////
// RESULTADO
//////////////////////////////////////////////////////////
// CORRECCIÓN CENTRALIZADA: Forzar máscara estricta en las propiedades de renderizado mapeadas para las tarjetas
const origenProcesado = obtenerUbicacionCorta(t.origen);
const destinoProcesado = obtenerUbicacionCorta(t.destino);
return {
id:
Number(t.id),
numeroReserva:
escapeHtml(
numeroReserva
),
origen:
escapeHtml(
origenProcesado ||
"—"
),
destino:
escapeHtml(
destinoProcesado ||
"—"
),
tituloOrigen:
escapeHtml(
origenProcesado ||
"—"
),
tituloDestino:
escapeHtml(
destinoProcesado ||
"—"
),
fecha:
t.fecha ||
"",
fechaCompleta:
obtenerFechaCompleta(
t.fecha
),
fechaVisual:
obtenerDiaMes(
t.fecha
),
horario:
escapeHtml(
obtenerHorario(
t
)
),
km:
escapeHtml(
t.km ??
"?"
),
precio:
escapeHtml(
t.preciototal ??
"—"
),
numArticulos:
numArticulos,
totalM3:
totalM3,
m3Texto:
escapeHtml(
m3Texto
),
accesos: {
recogida:
escapeHtml(
accesos.recogida ||
"Acceso por confirmar"
),
entrega:
escapeHtml(
accesos.entrega ||
"Acceso por confirmar"
)
},
numFotos:
numFotos,
serviciosContratados:
serviciosContratados,
esMudanzaTotal:
esTotal,
nombre:
escapeHtml(
t.nombre ||
"—"
),
telefono:
escapeHtml(
t.telefono ||
"—"
),
email:
escapeHtml(
t.email ||
""
),
extrasTexto:
escapeHtml(
t.extras ||
""
),
volumen:
escapeHtml(
t.volumen ||
""
),
ascensor:
escapeHtml(
t.ascensor ||
""
),
inventario:
inventario,
extras:
extras,
mudanzaOriginal:
t
};
}
//////////////////////////////////////////////////////////////
// TARJETA MARKETPLACE
//////////////////////////////////////////////////////////////
function crearTarjetaMarketplace(
mudanza
) {
const d =
obtenerDatosMudanza(
mudanza
);
return `

${d.fechaVisual.dia}


${d.fechaVisual.mes}


<span class="inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
d.esMudanzaTotal
? "border-emerald-100 bg-emerald-50 text-emerald-600"
: "border-blue-100 bg-blue-50 text-blue-600"
}">
${
d.esMudanzaTotal
? "MUDANZA TOTAL"
: "MUDANZA ESTÁNDAR"
}

${d.horario}




ID


${d.numeroReserva}



Origen

${d.origen}


${d.accesos.recogida}


${d.km} km








Destino

${d.destino}


${d.accesos.entrega}




${d.numArticulos} ART.
·
${d.m3Texto}


${d.serviciosContratados} servicios


${d.numFotos} fotos


Tu cobro



${d.precio}

IVA incl.


Ver detalles



`;
}
//////////////////////////////////////////////////////////////
// CREAR TARJETA ACTIVA
//////////////////////////////////////////////////////////////
function crearTarjetaActiva(
mudanza
) {
const d =
obtenerDatosMudanza(
mudanza
);
const t =
mudanza || {};
const ubicacionOrigenPublica =
obtenerUbicacionPublica(
t,
"origen"
);
const ubicacionDestinoPublica =
obtenerUbicacionPublica(
t,
"destino"
);
//////////////////////////////////////////////////////////
// FECHA DE LA MUDANZA
//////////////////////////////////////////////////////////
const fechaTexto =
String(
t.fecha || ""
);
const fechaParts =
fechaTexto.split("-");
let moveDate =
new Date(NaN);
if (
fechaParts.length === 3
) {
moveDate =
new Date(
parseInt(
fechaParts[0],
10
),
parseInt(
fechaParts[1],
10
) - 1,
parseInt(
fechaParts[2],
10
),
0,
0,
0
);
}
const now =
new Date();
const diffMs =
moveDate.getTime() -
now.getTime();
const diffHoras =
diffMs /
(1000 * 60 * 60);
//////////////////////////////////////////////////////////
// REGLAS DE PRIVACIDAD — MIS MUDANZAS ACTIVAS
//////////////////////////////////////////////////////////
const fechaValida =
!Number.isNaN(
moveDate.getTime()
);
const mostrarDireccionExacta =
fechaValida &&
diffHoras <= 24;
const esMismoDia =
fechaValida &&
moveDate.getFullYear() === now.getFullYear() &&
moveDate.getMonth() === now.getMonth() &&
moveDate.getDate() === now.getDate();
const mostrarTelefonoCliente =
esMismoDia &&
now.getHours() >= 6;
const mostrarTelefonoRodax =
mostrarDireccionExacta &&
!mostrarTelefonoCliente;
//////////////////////////////////////////////////////////
// MENSAJE DE TIEMPO
//////////////////////////////////////////////////////////
let tiempoRestanteHTML =
"";
if (
!Number.isNaN(
diffHoras
)
) {
if (
diffHoras >
TARJETAS_CONFIG
.activas
.horasDesbloqueo
) {
const horas =
Math.floor(
diffHoras
);
const dias =
Math.floor(
horas / 24
);
tiempoRestanteHTML = `
Datos del cliente visibles en
${
dias > 0
? dias + "d "
: ""
}
${horas % 24}h
`;
} else if (
diffHoras > 0
) {
tiempoRestanteHTML = `
Datos completos del cliente disponibles
`;
} else {
tiempoRestanteHTML = `
Servicio ya pasado — marcar como finalizado
`;
}
}
//////////////////////////////////////////////////////////
// DATOS DEL CLIENTE
//////////////////////////////////////////////////////////
let datosClienteHTML =
"";
let rutaCompletaHTML =
"";
if (
mostrarTelefonoCliente
) {
datosClienteHTML = `
Cliente:

${d.nombre}

Teléfono:
${d.telefono}

${
d.email
? `
Email:
${d.email}

`
: ""
}
`;
rutaCompletaHTML = `
${d.origen}
↓ ${d.km} km
${d.destino}
`;
} else {
datosClienteHTML = `
Nombre y teléfono ocultos
por seguridad
Los datos de contacto del cliente
se mostrarán automáticamente
24h antes del servicio.
`;
rutaCompletaHTML = `
Dirección de recogida oculta
↓ ${d.km} km
Dirección de entrega oculta
`;
}
return `

${d.fechaVisual.dia}


${d.fechaVisual.mes}


<span class="inline-flex items-center rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
d.esMudanzaTotal
? "border-emerald-100 bg-emerald-50 text-emerald-600"
: "border-blue-100 bg-blue-50 text-blue-600"
}">
${
d.esMudanzaTotal
? "MUDANZA TOTAL"
: "MUDANZA ESTÁNDAR"
}

${d.horario}


ID: ${d.numeroReserva}



Tu cobro

${d.precio}
IVA incl.



${tiempoRestanteHTML}

Origen
<div
class="mt-1 truncate text-sm font-bold leading-tight text-slate-800"
title="${
mostrarDireccionExacta
? d.tituloOrigen
: ubicacionOrigenPublica
}"
${
mostrarDireccionExacta
? d.origen
: ubicacionOrigenPublica
}


${d.accesos.recogida}


${d.km} km








Destino
<div
class="mt-1 truncate text-sm font-bold leading-tight text-slate-800"
title="${
mostrarDireccionExacta
? d.tituloDestino
: ubicacionDestinoPublica
}"
${
mostrarDireccionExacta
? d.destino
: ubicacionDestinoPublica
}


${d.accesos.entrega}



${mostrarTelefonoCliente && d.telefono ? `


${d.telefono}

: mostrarTelefonoRodax ?


NUMERO_EMPRESA_RODAX

:

Teléfono de contacto disponible 24 h antes del servicio
`}

${d.numArticulos} ART.
·
${d.m3Texto}


${d.serviciosContratados} servicios


${d.numFotos} fotos



Ficha PDF


Marcar como Finalizada


`;
}
//////////////////////////////////////////////////////////////
// RENDER GRUPOS
//////////////////////////////////////////////////////////////
function renderizarGruposDeTarjetas(
trabajos,
crearTarjeta
) {
if (
!Array.isArray(trabajos) ||
typeof crearTarjeta !== "function"
) {
return "";
}
const ordenados =
[...trabajos].sort(
(a, b) =>
String(a?.fecha || "9999-12-31")
.localeCompare(
String(b?.fecha || "9999-12-31")
)
);
const grupos = new Map();
ordenados.forEach(
trabajo => {
const clave =
String(
trabajo?.fecha ||
"sin-fecha"
);
if (!grupos.has(clave)) {
grupos.set(clave, []);
}
grupos
.get(clave)
.push(trabajo);
}
);
let html = <div class="rodax-grupos-fecha w-full" style="grid-column: 1 / -1;" >;
for (
const [
clave,
trabajosFecha
] of grupos.entries()
) {
const titulo =
clave === "sin-fecha"
? "Fecha no disponible"
: obtenerFechaCompleta(clave);
html += `
`;
}
html += </div>;
return html;
}
//////////////////////////////////////////////////////////////
// RENDER MARKETPLACE
//////////////////////////////////////////////////////////////
function renderizarTarjetasMarketplace(
trabajos
) {
return renderizarGruposDeTarjetas(
trabajos,
crearTarjetaMarketplace
);
}
//////////////////////////////////////////////////////////////
// RENDER ACTIVAS
//////////////////////////////////////////////////////////////
function renderizarTarjetasActivas(
trabajos
) {
return renderizarGruposDeTarjetas(
trabajos,
crearTarjetaActiva
);
}
//////////////////////////////////////////////////////////////
// API PÚBLICA
//////////////////////////////////////////////////////////////
window.Transportista.Tarjetas = {
config:
TARJETAS_CONFIG,
escapeHtml,
obtenerConfigTarjetas,
obtenerHorario,
obtenerExtrasMudanzaTotal,
obtenerInventario,
prepararInventarioVisible,
obtenerDatosMudanza,
crearHTMLInventario,
crearTarjetaMarketplace,
crearTarjetaActiva,
renderizarTarjetasMarketplace,
renderizarTarjetasActivas,
renderizarGruposDeTarjetas
};
//////////////////////////////////////////////////////////////
// CONFIRMACIÓN
//////////////////////////////////////////////////////////////
console.log(
"✅ tarjetas.js cargado correctamente — versión modular RODAX"
);
})();

