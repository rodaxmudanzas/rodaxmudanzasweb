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

let timeoutOri = null;
let timeoutDes = null;

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

            const etiqueta =
            item.properties.label || '';

            const div =
            document.createElement('div');

            div.className = 'dd-item';

            div.innerHTML =
            `${pinIcon}<span>${etiqueta}</span>`;

            div.addEventListener(
                'mousedown',
                () => {

                    document.getElementById(tipo).value =
                    etiqueta;

                    coords[tipo] = {

    texto: etiqueta,

    lon: item.geometry.coordinates[0],

    lat: item.geometry.coordinates[1],

    municipio:
        item.properties.locality ||
        item.properties.city ||
        '',

    provincia:
        item.properties.region ||
        '',

    codigoPostal:
        item.properties.postalcode ||
        ''
};

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
