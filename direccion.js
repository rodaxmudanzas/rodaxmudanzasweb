/*
=========================================
RODAX DIRECCIONES
OpenRouteService
=========================================
*/

const ORS_API_KEY =
'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjViY2ZiNmRiN2EzZDQxMzJhZDlmMmY4NGIyN2RlNzVmIiwiaCI6Im11cm11cjY0In0=';

const oriInput =
document.getElementById('origen');

const desInput =
document.getElementById('destino');

const oriDropdown =
document.getElementById('origen-dropdown');

const desDropdown =
document.getElementById('destino-dropdown');

const kmInput =
document.getElementById('km');

const coords = {
    origen: null,
    destino: null
};

const pinIcon = `
<svg xmlns="http://www.w3.org/2000/svg"
width="14"
height="14"
fill="none"
stroke="currentColor"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round"
class="dd-icon"
style="color:#3b82f6;flex-shrink:0;">
<path d="M12 10c0 5-6 12-6 12S0 15 0 10a6 6 0 1 1 12 0z"/>
<circle cx="6" cy="10" r="2"/>
</svg>`;

console.log('direccion.js cargado');

function normalizarBusqueda(texto) {

    let q = texto
        .trim()
        .replace(/\s+/g, ' ');

    q = q.replace(/^c\//i, 'calle ');
    q = q.replace(/^cl\b/i, 'calle');
    q = q.replace(/^avda\b/i, 'avenida');
    q = q.replace(/^av\b/i, 'avenida');
    q = q.replace(/^pº\b/i, 'paseo');
    q = q.replace(/^pto\b/i, 'puerto');

    return q;
}

function normalizarTextoUbicacion(valor) {
    return String(valor || "")
        .trim()
        .replace(/\s+/g, " ");
}

function normalizarComunidadAutonoma(valor) {

    const texto = normalizarTextoUbicacion(valor)
        .toLowerCase();

    const mapa = {
        "madrid": "Comunidad de Madrid",
        "comunidad de madrid": "Comunidad de Madrid",

        "cataluña": "Cataluña",
        "catalunya": "Cataluña",
        "catalonia": "Cataluña",

        "andalucía": "Andalucía",
        "andalucia": "Andalucía",

        "castilla y león": "Castilla y León",
        "castilla-leon": "Castilla y León",

        "castilla-la mancha": "Castilla-La Mancha",
        "castilla la mancha": "Castilla-La Mancha",

        "comunidad valenciana": "Comunidad Valenciana",
        "comunitat valenciana": "Comunidad Valenciana",
        "valencia": "Comunidad Valenciana",

        "galicia": "Galicia",

        "asturias": "Principado de Asturias",
        "principado de asturias": "Principado de Asturias",

        "cantabria": "Cantabria",

        "país vasco": "País Vasco",
        "pais vasco": "País Vasco",
        "euskadi": "País Vasco",

        "navarra": "Navarra",
        "comunidad foral de navarra": "Navarra",

        "aragón": "Aragón",
        "aragon": "Aragón",

        "extremadura": "Extremadura",

        "murcia": "Región de Murcia",
        "región de murcia": "Región de Murcia",

        "islas baleares": "Islas Baleares",
        "illes balears": "Islas Baleares",

        "canarias": "Canarias",
        "islas canarias": "Canarias",

        "la rioja": "La Rioja",

        "ceuta": "Ceuta",

        "melilla": "Melilla"
    };

    return mapa[texto] || "";
}


function obtenerComunidadDesdeProvincia(provincia) {

    const texto =
        normalizarTextoUbicacion(provincia)
            .toLowerCase();

   const mapa = {

    // COMUNIDAD DE MADRID
    "madrid":
        "Comunidad de Madrid",

    // CATALUÑA
    "barcelona":
        "Cataluña",
    "girona":
        "Cataluña",
    "gerona":
        "Cataluña",
    "lleida":
        "Cataluña",
    "lerida":
        "Cataluña",
    "tarragona":
        "Cataluña",

    // COMUNIDAD VALENCIANA
    "valencia":
        "Comunidad Valenciana",
    "castellon":
        "Comunidad Valenciana",
    "castellón":
        "Comunidad Valenciana",
    "alicante":
        "Comunidad Valenciana",

    // ANDALUCÍA
    "almeria":
        "Andalucía",
    "almería":
        "Andalucía",
    "cadiz":
        "Andalucía",
    "cádiz":
        "Andalucía",
    "cordoba":
        "Andalucía",
    "córdoba":
        "Andalucía",
    "granada":
        "Andalucía",
    "huelva":
        "Andalucía",
    "jaen":
        "Andalucía",
    "jaén":
        "Andalucía",
    "malaga":
        "Andalucía",
    "málaga":
        "Andalucía",
    "sevilla":
        "Andalucía",

    // PRINCIPADO DE ASTURIAS
    "asturias":
        "Principado de Asturias",
    "oviedo":
        "Principado de Asturias",

    // CANTABRIA
    "cantabria":
        "Cantabria",
    "santander":
        "Cantabria",

    // PAÍS VASCO
    "alava":
        "País Vasco",
    "álava":
        "País Vasco",
    "araba":
        "País Vasco",
    "vizcaya":
        "País Vasco",
    "bizkaia":
        "País Vasco",
    "guipuzcoa":
        "País Vasco",
    "guipúzcoa":
        "País Vasco",
    "gipuzkoa":
        "País Vasco",

    // ARAGÓN
    "huesca":
        "Aragón",
    "teruel":
        "Aragón",
    "zaragoza":
        "Aragón",

    // NAVARRA
    "navarra":
        "Navarra",
    "pamplona":
        "Navarra",

    // LA RIOJA
    "la rioja":
        "La Rioja",
    "rioja":
        "La Rioja",
    "logroño":
        "La Rioja",
    "logrono":
        "La Rioja",

    // CASTILLA Y LEÓN
    "avila":
        "Castilla y León",
    "ávila":
        "Castilla y León",
    "burgos":
        "Castilla y León",
    "leon":
        "Castilla y León",
    "león":
        "Castilla y León",
    "palencia":
        "Castilla y León",
    "salamanca":
        "Castilla y León",
    "segovia":
        "Castilla y León",
    "soria":
        "Castilla y León",
    "valladolid":
        "Castilla y León",
    "zamora":
        "Castilla y León",

    // CASTILLA-LA MANCHA
    "albacete":
        "Castilla-La Mancha",
    "ciudad real":
        "Castilla-La Mancha",
    "cuenca":
        "Castilla-La Mancha",
    "guadalajara":
        "Castilla-La Mancha",
    "toledo":
        "Castilla-La Mancha",

    // EXTREMADURA
    "badajoz":
        "Extremadura",
    "caceres":
        "Extremadura",
    "cáceres":
        "Extremadura",

    // GALICIA
    "a coruña":
        "Galicia",
    "a coruna":
        "Galicia",
    "la coruña":
        "Galicia",
    "la coruna":
        "Galicia",
    "coruña":
        "Galicia",
    "coruna":
        "Galicia",
    "lugo":
        "Galicia",
    "ourense":
        "Galicia",
    "orense":
        "Galicia",
    "pontevedra":
        "Galicia",

    // REGIÓN DE MURCIA
    "murcia":
        "Región de Murcia",

    // ISLAS BALEARES
    "baleares":
        "Islas Baleares",
    "illes balears":
        "Islas Baleares",
    "islas baleares":
        "Islas Baleares",
    "palma":
        "Islas Baleares",

    // CANARIAS
    "las palmas":
        "Canarias",
    "las palmas de gran canaria":
        "Canarias",
    "santa cruz de tenerife":
        "Canarias",
    "tenerife":
        "Canarias",

    // CEUTA Y MELILLA
    "ceuta":
        "Ceuta",
    "melilla":
        "Melilla"
};

    return mapa[texto] || "";
}


function construirDireccion(item) {

    const p =
        item?.properties ||
        {};

    const geometry =
        item?.geometry?.coordinates ||
        [];

    const municipio =
        normalizarTextoUbicacion(
            p.locality ||
            p.municipality ||
            p.city ||
            p.county ||
            p.localadmin ||
            ""
        );

    const provincia =
    normalizarTextoUbicacion(
        p.region ||
        p.province ||
        p.county ||
        ""
    )
    .replace(/^provinz\s+/i, "")
    .replace(/^province\s+of\s+/i, "")
    .trim();

    const comunidad =
        normalizarComunidadAutonoma(
            p.region ||
            p.state ||
            ""
        ) ||
        obtenerComunidadDesdeProvincia(
            provincia
        );

    const codigoPostal =
        normalizarTextoUbicacion(
            p.postalcode ||
            ""
        );

    return {

        texto:
            p.label ||
            "",

        calle:
            normalizarTextoUbicacion(
                p.street ||
                p.name ||
                ""
            ),

        numero:
            normalizarTextoUbicacion(
                p.housenumber ||
                ""
            ),

        municipio,

        provincia,

        comunidadAutonoma:
            comunidad,

        codigoPostal,

        lat:
            Number(geometry[1]),

        lon:
            Number(geometry[0])
    };
}

function obtenerUbicacionPublicaFormulario(tipo) {

    const direccion = coords[tipo];

    if (!direccion) {
        return {
            ciudad: "",
            cp: "",
            provincia: "",
            comunidad_autonoma: ""
        };
    }

    return {
        ciudad: String(direccion.municipio || "").trim(),

        cp: String(direccion.codigoPostal || "").trim(),

        provincia: String(direccion.provincia || "").trim(),

        comunidad_autonoma: String(
            direccion.comunidadAutonoma || ""
        ).trim()
    };
}

async function buscarDireccion(query, dropdown, tipo) {

    if (!query || query.trim().length < 3) {

        dropdown.classList.add('hidden');
        return;
    }

    try {

        const busqueda = normalizarBusqueda(query);

const url =
`https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(busqueda)}&size=20&layers=address,street,venue&boundary.country=ES`;

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error('ORS ' + res.status);
        }

        const json = await res.json();

        const resultados =
        json.features || [];

        resultados.sort((a, b) => {

    const aLabel =
        (a.properties.label || '').toLowerCase();

    const bLabel =
        (b.properties.label || '').toLowerCase();

    const texto =
        busqueda.toLowerCase();

    const aCoincide =
        aLabel.includes(texto);

    const bCoincide =
        bLabel.includes(texto);

    return Number(bCoincide) - Number(aCoincide);

});

        dropdown.innerHTML = '';

        if (!resultados.length) {

            dropdown.classList.add('hidden');
            return;
        }

        dropdown.classList.remove('hidden');

        resultados.forEach(item => {

            const direccion = construirDireccion(item);

const div = document.createElement('div');

div.className = 'dd-item';

const linea1 = [
    direccion.calle,
    direccion.numero
].filter(Boolean).join(' ');

const linea2 = [
    direccion.municipio,
    direccion.provincia
].filter(Boolean).join(', ');

div.innerHTML = `

${pinIcon}

<div class="dd-text">

    ${
        linea1
            ? `<div class="dd-line1">${linea1}</div>`
            : ''
    }

    ${
        linea2
            ? `<div class="dd-line2">${linea2}</div>`
            : ''
    }

    ${
        direccion.codigoPostal
            ? `<div class="dd-line3">${direccion.codigoPostal}</div>`
            : ''
    }

</div>

`;
            div.addEventListener(
                'mousedown',
                () => {

                    document.getElementById(tipo).value =
    direccion.texto;

                    coords[tipo] = direccion;

                    dropdown.classList.add(
                        'hidden'
                    );

                    if (
                        coords.origen &&
                        coords.destino
                    ) {

                        calcularRutaORS();
                    }
                }
            );

            dropdown.appendChild(div);
        });

    } catch (error) {

        console.error(
            'Error geocodificando:',
            error
        );

        dropdown.classList.add('hidden');
    }
}

function crearAutocomplete({

    input,
    dropdown,
    tipo

}) {

    let timeout = null;

    input.addEventListener('input', (e) => {

        clearTimeout(timeout);

        coords[tipo] = null;

        timeout = setTimeout(() => {

            buscarDireccion(
                e.target.value,
                dropdown,
                tipo
            );

        }, 400);

    });

}

crearAutocomplete({

    input: oriInput,

    dropdown: oriDropdown,

    tipo: 'origen'

});

crearAutocomplete({

    input: desInput,

    dropdown: desDropdown,

    tipo: 'destino'

});

document.addEventListener(
    'mousedown',
    (e) => {

        if (
            !oriInput.contains(e.target) &&
            !oriDropdown.contains(e.target)
        ) {
            oriDropdown.classList.add('hidden');
        }

        if (
            !desInput.contains(e.target) &&
            !desDropdown.contains(e.target)
        ) {
            desDropdown.classList.add('hidden');
        }
    }
);

async function calcularRutaORS() {

    if (!coords.origen || !coords.destino) return;

    try {

        const res = await fetch(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            {
                method: "POST",
                headers: {
                    "Authorization": ORS_API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({

                    coordinates: [

                        [
                            coords.origen.lon,
                            coords.origen.lat
                        ],

                        [
                            coords.destino.lon,
                            coords.destino.lat
                        ]

                    ]

                })

            }
        );

        if (!res.ok) {

            throw new Error(
                "ORS Directions " + res.status
            );

        }

        const data = await res.json();

        const ruta = data.routes[0];

        const km =
            ruta.summary.distance / 1000;

        kmInput.value =
            km.toFixed(1);

        console.log(
            "Kilómetros:",
            km.toFixed(1)
        );

        if (typeof calcularPresupuesto === "function") {

            calcularPresupuesto();

        }

    }

    catch (err) {

        console.error(
            "Error calculando ruta:",
            err
        );

    }

}

window.RodaxDireccion =
    window.RodaxDireccion || {};

window.RodaxDireccion.obtenerUbicacionPublicaFormulario =
    obtenerUbicacionPublicaFormulario;

window.RodaxDireccion.coords =
    coords;