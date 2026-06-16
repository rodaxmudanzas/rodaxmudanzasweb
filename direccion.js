/*
=========================================
RODAX DIRECCIONES
OpenRouteService
=========================================
*/

const ORS_API_KEY =
'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjViY2ZiNmRiN2EzZDQxMzJhZDlmMmY4NGIyN2RlNzVmIiwiaCI6Im11cm11cjY0In0=';

let origenSeleccionado = null;
let destinoSeleccionado = null;

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
