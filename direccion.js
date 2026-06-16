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

console.log('direccion.js cargado');
