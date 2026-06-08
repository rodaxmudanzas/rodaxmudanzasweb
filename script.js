/**
 * RODAX MARKETPLACE — script.js v3.0
 * Motor de Cálculo, Mapas OSM/OSRM, Envío Supabase, Banner RGPD
 */
//////////////////////////////////////////////////////
// VARIABLES GLOBALES IA
//////////////////////////////////////////////////////

let totalFinal = 0;
let metrosCubicosTotales = 0;
let reserva30 = 0;

let mudanzaTotal = false;

document.addEventListener('DOMContentLoaded', () => {
    
let origenCoords = null;
let destinoCoords = null;

let kmReales = 0;
let tiempoRuta = 0;
    //////////////////////////////////////////////////////
// PREMIUM PROGRESS BAR ENGINE
//////////////////////////////////////////////////////

const progressBar =
    document.getElementById('rodax-progress-bar');
    
    console.log(progressBar);

let progressValue = 8;

let progressTarget = 8;

let progressRAF = null;

//////////////////////////////////////////////////////
// SET PROGRESS
//////////////////////////////////////////////////////

function setRodaxProgress(value){

    progressTarget =
        Math.max(6, Math.min(100, value));

    if(!progressRAF){

        animateProgress();
    }
}

//////////////////////////////////////////////////////
// ANIMACIÓN SUAVE REAL
//////////////////////////////////////////////////////

function animateProgress(){

    progressRAF = requestAnimationFrame(() => {

        progressValue +=
            (progressTarget - progressValue) * 0.08;

        if(
            Math.abs(progressTarget - progressValue)
            < 0.15
        ){
            progressValue = progressTarget;
        }

        progressBar.style.width =
    progressValue + '%';

const progressText =
    document.getElementById(
        'rodax-progress-text'
    );

if(progressText){

    progressText.textContent =
        Math.round(progressValue) + '%';
}

        if(progressValue !== progressTarget){

            animateProgress();

        }else{

            progressRAF = null;
        }
    });
}

//////////////////////////////////////////////////////
// CALCULAR PROGRESO GLOBAL REAL
//////////////////////////////////////////////////////

function actualizarBarraGlobal(){

    let progreso = 8;

    //////////////////////////////////////////////////
    // DATOS PERSONALES
    //////////////////////////////////////////////////

    const nombre =
        document.getElementById('nombre')?.value.trim();

    const telefono =
        document.getElementById('telefono')?.value.trim();

    const email =
        document.getElementById('email')?.value.trim();

    const fecha =
        document.getElementById('fecha')?.value;

    if(nombre) progreso += 8;
    if(telefono) progreso += 8;
    if(email) progreso += 8;
    if(fecha) progreso += 6;

    //////////////////////////////////////////////////
    // DIRECCIONES
    //////////////////////////////////////////////////

    const origen =
        document.getElementById('origen')?.value.trim();

    const destino =
        document.getElementById('destino')?.value.trim();

    if(origen) progreso += 14;
    if(destino) progreso += 14;

    //////////////////////////////////////////////////
    // KM REALES
    //////////////////////////////////////////////////

    const km =
        parseFloat(
            document.getElementById('km')?.value
        ) || 0;

    if(km > 0){
        progreso += 10;
    }

    //////////////////////////////////////////////////
    // INVENTARIO
    //////////////////////////////////////////////////

    let inventarioTotal = 0;

    document
    .querySelectorAll('.inventario-input')
    .forEach(input => {

        inventarioTotal +=
            parseInt(input.value) || 0;
    });

    if(inventarioTotal > 0){

        progreso += Math.min(
            18,
            inventarioTotal * 1.8
        );
    }

    //////////////////////////////////////////////////
    // SERVICIOS
    //////////////////////////////////////////////////

    const desmontar =
        parseInt(document.getElementById('cant_desmontar')?.value) || 0;

    const montar =
        parseInt(document.getElementById('cant_montar')?.value) || 0;

    const embalar =
        parseInt(document.getElementById('cant_embalar')?.value) || 0;

    const seguro =
        parseFloat(document.getElementById('valor_seguro')?.value) || 0;

    const servicios =
        desmontar + montar + embalar;

    if(servicios > 0){

        progreso += Math.min(
            10,
            servicios * 1.5
        );
    }

    if(seguro > 0){
        progreso += 4;
    }

    //////////////////////////////////////////////////
    // LIMITADOR
    //////////////////////////////////////////////////

    progreso =
        Math.max(8, Math.min(100, progreso));

    //////////////////////////////////////////////////
    // UX PREMIUM
    //////////////////////////////////////////////////

    if(progreso > 92){

        progreso = 92 + (
            (progreso - 92) * 0.4
        );
    }

    //////////////////////////////////////////////////
    // ACTUALIZAR
    //////////////////////////////////////////////////

    setRodaxProgress(progreso);
}

//////////////////////////////////////////////////////
// ESCUCHAR TODO
//////////////////////////////////////////////////////

document.addEventListener('input', () => {

    actualizarBarraGlobal();
});

document.addEventListener('change', () => {

    actualizarBarraGlobal();
});

//////////////////////////////////////////////////////
// ARRANQUE
//////////////////////////////////////////////////////

setTimeout(() => {

    setRodaxProgress(12);

}, 300);

   const mudanzaTotalCard =
document.getElementById('mudanza-total-card');

const toggleMudanzaTotal =
document.getElementById(
'toggle-mudanza-total'
);

if(toggleMudanzaTotal){

    console.log('BOTON ENCONTRADO');

    toggleMudanzaTotal.addEventListener('click',()=>{

        console.log('CLICK');

        mudanzaTotal = !mudanzaTotal;

        console.log('mudanzaTotal:', mudanzaTotal);

        mudanzaTotalCard?.classList.toggle(
            'active',
            mudanzaTotal
        );

        //////////////////////////////////////////////////
        // SERVICIOS
        //////////////////////////////////////////////////

        const desmontar =
        document.getElementById('cant_desmontar');

        const montar =
        document.getElementById('cant_montar');

        const embalar =
        document.getElementById('cant_embalar');

        const seguro =
        document.getElementById('valor_seguro');

        if(mudanzaTotal){

            if(desmontar){
                desmontar.value = 0;
                desmontar.disabled = true;
            }

            if(montar){
                montar.value = 0;
                montar.disabled = true;
            }

            if(embalar){
                embalar.value = 0;
                embalar.disabled = true;
            }

            if(seguro){
                seguro.value = 0;
                seguro.disabled = true;
            }

        }else{

            if(desmontar) desmontar.disabled = false;
            if(montar) montar.disabled = false;
            if(embalar) embalar.disabled = false;
            if(seguro) seguro.disabled = false;
        }

        //////////////////////////////////////////////////
        // TEXTO BOTÓN
        //////////////////////////////////////////////////

        const texto =
        document.getElementById(
            'texto-mudanza-total'
        );

        if(texto){

            texto.innerHTML =
            mudanzaTotal
            ? '✅ Mudanza Total Activada'
            : 'Quiero Mudanza Total';
        }

        calcularPresupuesto();

    });

}
    
    // ─── 1. CONFIGURACIÓN SUPABASE ────────────────────────────────────────────
    const SUPABASE_URL = 'https://defvfvyfrydopaybnisg.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_dKIRJ1_K4u1ypfCNTuylIw_AyAKeZTS';
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

    // ─── 2. REFERENCIAS UI ───────────────────────────────────────────────────
    const UI = {
        form:          document.getElementById('contact-form'),
        btnSubmit:     document.querySelector('#contact-form button[type="submit"]'),
        cajaPrecio:    document.getElementById('caja-precio'),
        precioTotal:   document.getElementById('precio-total'),
        precioReserva: document.getElementById('precio-reserva'),
        desglose:      document.getElementById('desglose-precio'),
        successModal:  document.getElementById('success-modal'),
        closeModal:    document.getElementById('close-modal'),
    };

    // ─── 3. BANNER RGPD (solo LocalStorage, cero librerías) ─────────────────
    const cookieBanner       = document.getElementById('cookie-banner');
    const btnCookiesAceptar  = document.getElementById('btn-cookies-aceptar');
    const btnCookiesEsencial = document.getElementById('btn-cookies-esenciales');

    if (!localStorage.getItem('rodax_cookies_rgpd') && cookieBanner) {
        // Mostrar tras un momento para no bloquear la carga
        setTimeout(() => { cookieBanner.style.display = 'block'; }, 800);
    }

    function ocultarBanner(tipo) {
        localStorage.setItem('rodax_cookies_rgpd', tipo);
        if (cookieBanner) {
            cookieBanner.style.transform = 'translateY(100%)';
            setTimeout(() => { cookieBanner.style.display = 'none'; }, 310);
        }
    }

    btnCookiesAceptar?.addEventListener('click',  () => ocultarBanner('todas'));
    btnCookiesEsencial?.addEventListener('click', () => ocultarBanner('esenciales'));


    // ─── 4. TOGGLE PISO (global para usar desde onchange en HTML) ───────────
window.togglePiso = function (tipo) {

    const select =
        document.getElementById('ascensor_' + tipo);

    const input =
        document.getElementById('piso_' + tipo);

    const nota =
        document.getElementById('nota_piso_' + tipo);

    if (select.value === 'si') {

        input.disabled = true;
        input.value = 0;

        if (nota) {
            nota.textContent =
                'Con ascensor, el piso no afecta al precio.';

            nota.style.color = '#3b82f6';
        }

    } else {

        input.disabled = false;

        if (nota) {
            nota.textContent =
                'Piso 1–3: +35 € | Piso 4+: +30 €';

            nota.style.color = '#f97316';
        }
    }

    calcularPresupuesto();
};

  //////////////////////////////////////////////////////
// FUNCIÓN CENTRAL IA
//////////////////////////////////////////////////////

function actualizarResumenGlobal(total, metrosCubicos) {

    totalFinal = total;

    metrosCubicosTotales = metrosCubicos;

    reserva30 = total * 0.30;

    //////////////////////////////////////////////////
    // BLOQUE PRINCIPAL
    //////////////////////////////////////////////////

    if (UI.precioTotal) {

        UI.precioTotal.textContent =
            `${totalFinal.toFixed(2)} €`;
    }

    if (UI.precioReserva) {

        UI.precioReserva.textContent =
            `${reserva30.toFixed(2)} €`;
    }

    //////////////////////////////////////////////////
    // POPUP FLOTANTE
    //////////////////////////////////////////////////

    const floatingTotal =
        document.getElementById('floating-total');

    const floatingM3 =
        document.getElementById('floating-m3');

    const floatingReserva =
        document.getElementById('floating-reserva');

    if (floatingTotal) {

        floatingTotal.textContent =
            `${totalFinal.toFixed(2)} €`;
    }

    if (floatingM3) {

        floatingM3.textContent =
            `${metrosCubicosTotales.toFixed(1)} m³`;
    }

    if (floatingReserva) {

        floatingReserva.textContent =
            `${reserva30.toFixed(2)} €`;
    }
}

window.calcularPresupuesto = function calcularPresupuesto() {

    if (!UI.cajaPrecio) return;

    //////////////////////////////////////////////////
// VARIABLES PRINCIPALES
//////////////////////////////////////////////////

let metrosCubicos = 0;

let totalBase = 0;
let totalExtras = 0;
let totalInventario = 0;
let totalServicios = 0;

    //////////////////////////////////////////////////
// NUEVO UPGRADE TOTALCARE
//////////////////////////////////////////////////
    
let recargoLogistico = 0;

let totalFinalIA = 0;

let tipoVehiculo = 'Furgoneta pequeña';
let operarios = 1;

const items = [];

    //////////////////////////////////////////////////
    // VENTANA 1 — DATOS / RUTA / ACCESOS
    //////////////////////////////////////////////////

    const km =
        parseFloat(document.getElementById('km')?.value) || 0;
 //////////////////////////////////////////////////
// NO CALCULAR SIN KM REAL
//////////////////////////////////////////////////

if(km <= 0){

    UI.cajaPrecio.classList.add('hidden');

    return;
}

//////////////////////////////////////////////////
// PRECIO REAL POR KM
//////////////////////////////////////////////////

totalBase = km * 0.75;

    items.push({
    label: `Ruta y transporte (${km} km)`,
    valor: totalBase
});

    //////////////////////////////////////////////////
    // ACCESOS
    //////////////////////////////////////////////////

    const ascOrigen =
        document.getElementById('ascensor_origen')?.value || 'si';

    const pisoOrigen =
        parseInt(document.getElementById('piso_origen')?.value) || 0;

    if (ascOrigen === 'no' && pisoOrigen > 0) {

        const extra =
            pisoOrigen <= 3 ? 35 : 65;

        totalExtras += extra;

        items.push({
            label: `Recogida sin ascensor piso ${pisoOrigen}`,
            valor: extra
        });
    }

    const ascDestino =
        document.getElementById('ascensor_destino')?.value || 'si';

    const pisoDestino =
        parseInt(document.getElementById('piso_destino')?.value) || 0;

    if (ascDestino === 'no' && pisoDestino > 0) {

        const extra =
            pisoDestino <= 3 ? 35 : 65;

        totalExtras += extra;

        items.push({
            label: `Entrega sin ascensor piso ${pisoDestino}`,
            valor: extra
        });
    }

    //////////////////////////////////////////////////
    // VENTANA 2 — INVENTARIO
    //////////////////////////////////////////////////

    document.querySelectorAll('.inventario-input').forEach(input => {

        const cantidad =
            parseInt(input.value) || 0;

        const precio =
            parseFloat(input.dataset.precio) || 0;

        const m3 =
            parseFloat(input.dataset.m3) || 0.5;

        const fragil =
            input.dataset.fragil === 'si';

        if (cantidad > 0) {

            const subtotal =
                cantidad * precio;

            totalInventario += subtotal;

            metrosCubicos +=
                cantidad * m3;

            //////////////////////////////////////////////////
            // IA FRÁGIL
            //////////////////////////////////////////////////
        }
    });

    items.push({
        label: 'Inventario mudanza',
        valor: totalInventario
    });

    //////////////////////////////////////////////////
    // VENTANA 3 — SERVICIOS
    //////////////////////////////////////////////////

    const cantDesmontar =
        parseInt(document.getElementById('cant_desmontar')?.value) || 0;

    const cantMontar =
        parseInt(document.getElementById('cant_montar')?.value) || 0;

    const cantEmbalar =
        parseInt(document.getElementById('cant_embalar')?.value) || 0;

   if (!mudanzaTotal && cantDesmontar > 0) {

        const totalDesmontaje =
            cantDesmontar * 20;

        totalServicios += totalDesmontaje;

        items.push({
            label: `Desmontaje (${cantDesmontar})`,
            valor: totalDesmontaje
        });
    }

    if (!mudanzaTotal && cantMontar > 0) {

        const totalMontaje =
            cantMontar * 30;

        totalServicios += totalMontaje;

        items.push({
            label: `Montaje (${cantMontar})`,
            valor: totalMontaje
        });
    }

    if (!mudanzaTotal && cantEmbalar > 0) {

        const totalEmbalar =
            cantEmbalar * 10;

        totalServicios += totalEmbalar;

        items.push({
            label: `Embalaje (${cantEmbalar})`,
            valor: totalEmbalar
        });
    }

    //////////////////////////////////////////////////
    // SEGURO
    //////////////////////////////////////////////////

    const valorSeguro =
        parseFloat(document.getElementById('valor_seguro')?.value) || 0;

    if (!mudanzaTotal && valorSeguro > 0) {

        const costoSeguro =
            Math.ceil(valorSeguro / 1000) * 20;

        totalServicios += costoSeguro;

        items.push({
            label: 'Seguro premium',
            valor: costoSeguro
        });
    }

    //////////////////////////////////////////////////
// IA LOGÍSTICA
//////////////////////////////////////////////////

const volumenLogistico = metrosCubicos;

if (metrosCubicos >= 25) {

    tipoVehiculo = 'Camión tráiler';
    operarios = 4;
    recargoLogistico = 420;

} else if (metrosCubicos >= 20) {

    tipoVehiculo = 'Camión grande';
    operarios = 3;
    recargoLogistico = 280;

} else if (metrosCubicos >= 10) {

    tipoVehiculo = 'Camión mediano';
    operarios = 2;
    recargoLogistico = 160;

} else if (metrosCubicos >= 5) {

    tipoVehiculo = 'Furgón XL';
    operarios = 2;
    recargoLogistico = 90;

} else {

    tipoVehiculo = 'Furgoneta pequeña';
    operarios = 1;
    recargoLogistico = 0;
}
    //////////////////////////////////////////////////
    // TOTAL GLOBAL REAL
    //////////////////////////////////////////////////

    totalFinalIA =

    totalBase +
    totalExtras +
    totalInventario +
    totalServicios +
    recargoLogistico;

//////////////////////////////////////////////////
// MUDANZA TOTAL REAL
//////////////////////////////////////////////////

if(mudanzaTotal){

    console.log('ENTRA EN MUDANZA TOTAL');

    totalServicios = 0;

    totalFinalIA += 249;

    //////////////////////////////////////////////////
    // LABEL
    //////////////////////////////////////////////////

    items.push({
        label: 'Mudanza Total',
        valor: 249
    });

}
    //////////////////////////////////////////////////
    // BONUS IA
    //////////////////////////////////////////////////

    if (metrosCubicos >= 30) {

        totalFinalIA += 250;

        items.push({
            label: 'Operación logística especial',
            valor: 250
        });
    }

    //////////////////////////////////////////////////
    // REDONDEO FINAL
    //////////////////////////////////////////////////

    totalFinalIA =
parseFloat(totalFinalIA.toFixed(2));

console.log('TOTAL FINAL:', totalFinalIA);
    
//////////////////////////////////////////////////
// TIPO DE MUDANZA
//////////////////////////////////////////////////

const tipoMudanza =
mudanzaTotal
? 'Mudanza Total'
: 'Mudanza Estándar';

items.push({
    label: mudanzaTotal
        ? '✅ Mudanza Total'
        : '✅ Mudanza Estándar',
    valor: 0
});
    
    //////////////////////////////////////////////////
    // DESGLOSE IA
    //////////////////////////////////////////////////

    items.push({
        label: `Logística IA (${tipoVehiculo})`,
        valor: recargoLogistico
    });

    items.push({
        label: `Operarios IA (${operarios})`,
        valor: 0
    });


    //////////////////////////////////////////////////
    // ACTUALIZAR WEB + POPUP
    //////////////////////////////////////////////////

    actualizarResumenGlobal(
        totalFinalIA,
        metrosCubicos
    );

    //////////////////////////////////////////////////
    // DESGLOSE VISUAL
    //////////////////////////////////////////////////

    if (UI.desglose) {

        UI.desglose.innerHTML =

            items.map(d => `
                <div class="flex justify-between items-center py-1 border-b border-white/10">
                    <span class="text-blue-200 text-xs">
    ${d.label}
    ${d.tipo ? ` — ${d.tipo}` : ''}
</span>
                    <span class="text-white font-bold text-xs">
                        ${d.valor > 0
? `${d.valor.toFixed(2)} €`
: ''}
                    </span>
                </div>
            `).join('')

            +

            `
            <div class="flex justify-between items-center pt-3 mt-2">
                <span class="text-white font-black text-sm">
                    PRECIO TOTAL CERRADO
                </span>

                <span class="text-green-400 font-black text-lg">
                    ${totalFinalIA.toFixed(2)} €
                </span>
            </div>
            `;
    }

    //////////////////////////////////////////////////
    // MOSTRAR
    //////////////////////////////////////////////////
//////////////////////////////////////////////////////
// UX PREMIUM FINAL
//////////////////////////////////////////////////////

actualizarBarraGlobal();

//////////////////////////////////////////////////////
// CUANDO EL CÁLCULO YA ES REAL
//////////////////////////////////////////////////////

if(totalFinalIA > 0){

    setRodaxProgress(100);

    setTimeout(() => {

        actualizarBarraGlobal();

    }, 1200);
}
    
    //////////////////////////////////////////////////////
// MOSTRAR SOLO SI HAY KM
//////////////////////////////////////////////////////

if(km > 0){

    UI.cajaPrecio.classList.remove('hidden');

    void UI.cajaPrecio.offsetWidth;

    UI.cajaPrecio.classList.add('fade-in');

}else{

    UI.cajaPrecio.classList.add('hidden');
}
};

    // Escuchar todos los inputs con clase calculo-trigger
    document.querySelectorAll('.calculo-trigger').forEach(el => {
        el.addEventListener('input',  calcularPresupuesto);
        el.addEventListener('change', calcularPresupuesto);
    });


    // ─── 6. SUBIDA DE FOTOS A SUPABASE STORAGE ───────────────────────────────
    async function subirFotos(inputEl) {
        if (!inputEl || !inputEl.files.length || !supabase) return null;
        const urls = [];

        for (const file of Array.from(inputEl.files)) {
            const ext  = file.name.split('.').pop().toLowerCase();
            const path = `fotos-mudanzas/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
            try {
                const { error } = await supabase.storage.from('documentos').upload(path, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path);
                urls.push(publicUrl);
            } catch (err) {
                console.error('Error subiendo foto:', err.message);
            }
        }

        return urls.length ? urls.join(', ') : null;
    }


    // ─── 7. ENVÍO DEL FORMULARIO ─────────────────────────────────────────────
    if (UI.form) {
        UI.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!supabase) {
                alert('Error: Sin conexión con la base de datos. Contacta con soporte.');
                return;
            }

            const btnOriginal = UI.btnSubmit.innerHTML;
            UI.btnSubmit.disabled = true;
            UI.btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-6 h-6 mr-3 animate-spin"></i> Procesando tu reserva...`;
            if (window.lucide) lucide.createIcons();

            try {
                // Subir fotos si las hay
                const fotosString = await subirFotos(document.getElementById('fotos_upload'));

                // Recopilar datos de ascensores
                const ascOrigen  = document.getElementById('ascensor_origen')?.value  || 'si';
                const pisoOrigen = parseInt(document.getElementById('piso_origen')?.value)  || 0;
                const ascDestino = document.getElementById('ascensor_destino')?.value || 'si';
                const pisoDestino= parseInt(document.getElementById('piso_destino')?.value) || 0;

                // Recopilar extras para el campo texto
                const extrasArr = [];
                const cantD = parseInt(document.getElementById('cant_desmontar')?.value) || 0;
                const cantM = parseInt(document.getElementById('cant_montar')?.value)    || 0;
                const cantE = parseInt(document.getElementById('cant_embalar')?.value)   || 0;
                const seguro= parseFloat(document.getElementById('valor_seguro')?.value) || 0;

                if (cantD > 0) extrasArr.push(`Desmontaje ×${cantD}`);
                if (cantM > 0) extrasArr.push(`Montaje ×${cantM}`);
                if (cantE > 0) extrasArr.push(`Embalaje ×${cantE}`);
                if (seguro > 0) extrasArr.push(`Seguro: ${seguro} €`);

                const volumenSelect = document.getElementById('volumen');
                const volumenTexto  = volumenSelect?.options[volumenSelect.selectedIndex]?.text || '';

                // Payload completo para Supabase
                const payload = {
                    nombre:        document.getElementById('nombre').value.trim(),
                    telefono:      document.getElementById('telefono').value.trim(),
                    email:         document.getElementById('email').value.trim(),
                    origen:        document.getElementById('origen').value.trim(),
                    destino:       document.getElementById('destino').value.trim(),
                    km:            parseFloat(document.getElementById('km')?.value) || 0,
                    fecha:         document.getElementById('fecha').value,
                    volumen:       volumenTexto,
                    ascensor:      `Recogida: ${ascOrigen === 'si' ? 'Con ascensor' : `Sin ascensor (piso ${pisoOrigen})`} | Entrega: ${ascDestino === 'si' ? 'Con ascensor' : `Sin ascensor (piso ${pisoDestino})`}`,
                    extras:        extrasArr.join(' | ') || 'Solo transporte básico',

                    tipo_servicio:
mudanzaTotal
? 'Mudanza Total'
: 'Mudanza Estándar',
                    
                    estado:        'Pendiente de Pago',
                    urls_fotos:    fotosString,
                    preciototal:   UI.precioTotal.textContent,
                    precioreserva: UI.precioReserva.textContent,
                };

                const { error } = await supabase.from('mudanzas').insert([payload]);
                if (error) throw error;

                // Éxito: mostrar modal con instrucciones de pago
                UI.successModal.classList.remove('hidden');
                UI.form.reset();
                UI.cajaPrecio.classList.add('hidden');

                // Resetear estados de piso
                ['origen', 'destino'].forEach(tipo => {
                    const p = document.getElementById('piso_' + tipo);
                    if (p) { p.value = 0; p.disabled = true; }
                    const s = document.getElementById('ascensor_' + tipo);
                    if (s) s.value = 'si';
                    const n = document.getElementById('nota_piso_' + tipo);
                    if (n) { n.textContent = 'Con ascensor el piso no afecta al precio.'; n.style.color = '#3b82f6'; }
                });

            } catch (err) {
                console.error('Error al enviar:', err);
                alert('Error al procesar la reserva: ' + (err.message || 'Comprueba tu conexión a internet.'));
            } finally {
                UI.btnSubmit.disabled = false;
                UI.btnSubmit.innerHTML = btnOriginal;
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    UI.closeModal?.addEventListener('click', () => UI.successModal.classList.add('hidden'));


    // ─── 8. SISTEMA DE MAPAS OSM + OSRM ──────────────────────────────────────
    const ORS_API_KEY =
'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjVhNjk0ODk0YmE2MTQ0YzA4NGQwZmQwMTVjM2E2NTFiIiwiaCI6Im11cm11cjY0In0=';
    const oriInput    = document.getElementById('origen');
    const desInput    = document.getElementById('destino');
    const oriDropdown = document.getElementById('origen-dropdown');
    const desDropdown = document.getElementById('destino-dropdown');
    const kmInput     = document.getElementById('km');

    if (!oriInput || !desInput) return;

    let coords = { origen: null, destino: null };
    let timeoutOri, timeoutDes;

    // Ícono SVG de pin para los items del dropdown
    const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dd-icon" style="color:#3b82f6;flex-shrink:0;margin-top:2px"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    /**
     * // Busca direcciones con OpenRouteService
     * Usamos 'countrycodes=es' para España, y también sin restricción como fallback
     */
 async function buscarDireccion(query, dropdown, tipo) {

    if (!query || query.length < 3) {
        dropdown.classList.add('hidden');
        return;
    }

    try {

        //////////////////////////////////////////////////////
        // NOMINATIM OSM
        //////////////////////////////////////////////////////

        const url =
`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=es&addressdetails=1&limit=8`;

        const res = await fetch(url, {
            headers: {
                'Accept-Language': 'es'
            }
        });

        if (!res.ok) {
            throw new Error('Nominatim HTTP ' + res.status);
        }

        const data = await res.json();

        dropdown.innerHTML = '';

        if (data.length > 0) {

            dropdown.classList.remove('hidden');

            data.forEach(item => {

                const div = document.createElement('div');

                div.className = 'dd-item';

                //////////////////////////////////////////////////////
                // DIRECCIÓN
                //////////////////////////////////////////////////////

                const address = item.address || {};

                const calle =
                    address.road ||
                    address.pedestrian ||
                    address.residential ||
                    '';

                const numero =
                    address.house_number ||
                    '';

                const pueblo =
                    address.town ||
                    address.village ||
                    address.city ||
                    address.municipality ||
                    '';

                const provincia =
                    address.state ||
                    '';

                const cp =
                    address.postcode ||
                    '';

                //////////////////////////////////////////////////////
                // TEXTO
                //////////////////////////////////////////////////////

                let etiqueta = '';

                if (calle) {
                    etiqueta += calle;
                }

                if (numero) {
                    etiqueta += ' ' + numero;
                }

                if (pueblo) {
                    etiqueta += ', ' + pueblo;
                }

                if (cp) {
                    etiqueta += ' (' + cp + ')';
                }

                //////////////////////////////////////////////////////
                // FALLBACK
                //////////////////////////////////////////////////////

                if (!etiqueta.trim()) {
                    etiqueta = item.display_name;
                }

                //////////////////////////////////////////////////////
                // HTML
                //////////////////////////////////////////////////////

                div.innerHTML =
`${pinIcon}<span>${etiqueta.substring(0, 120)}</span>`;

                //////////////////////////////////////////////////////
// CLICK
//////////////////////////////////////////////////////

div.addEventListener('mousedown', (ev) => {

    ev.preventDefault();

    //////////////////////////////////////////////////////
    // GUARDAR TEXTO
    //////////////////////////////////////////////////////

    document.getElementById(tipo).value =
        etiqueta;

    //////////////////////////////////////////////////////
    // GUARDAR COORDENADAS
    //////////////////////////////////////////////////////

    coords[tipo] = {

        lat: parseFloat(item.lat),

        lon: parseFloat(item.lon)
    };

    //////////////////////////////////////////////////////
    // CERRAR DROPDOWN
    //////////////////////////////////////////////////////

    dropdown.classList.add('hidden');

    //////////////////////////////////////////////////////
    // DEBUG VISUAL
    //////////////////////////////////////////////////////

    console.log(
        'Dirección seleccionada:',
        etiqueta
    );

    console.log(
        'Coords:',
        coords[tipo]
    );

    //////////////////////////////////////////////////////
    // CALCULAR RUTA
    //////////////////////////////////////////////////////

    if (coords.origen && coords.destino) {

        console.log(
            'Calculando ruta...'
        );

        calcularRutaORS();
    }
});

                dropdown.appendChild(div);
            });

        } else {

            dropdown.classList.add('hidden');
        }

    } catch (err) {

        console.warn(
            'Nominatim error:',
            err.message
        );

        dropdown.classList.add('hidden');
    }
}

    // Event listeners para los inputs de dirección
    oriInput.addEventListener('input', (e) => {
        clearTimeout(timeoutOri);
        coords.origen = null;
        timeoutOri = setTimeout(() => buscarDireccion(e.target.value, oriDropdown, 'origen'), 700);
    });

    desInput.addEventListener('input', (e) => {
        clearTimeout(timeoutDes);
        coords.destino = null;
        timeoutDes = setTimeout(() => buscarDireccion(e.target.value, desDropdown, 'destino'), 700);
    });

    // Cerrar dropdowns al hacer clic fuera (usar mousedown para no interferir con mobile)
    document.addEventListener('mousedown', (e) => {
        if (!oriInput.contains(e.target) && !oriDropdown.contains(e.target)) {
            oriDropdown.classList.add('hidden');
        }
        if (!desInput.contains(e.target) && !desDropdown.contains(e.target)) {
            desDropdown.classList.add('hidden');
        }
    });


    /**
     * Calcula la ruta real en carretera entre los dos puntos usando OSRM
     * y actualiza el campo KM oculto para recalcular el precio
     */
    async function calcularRutaORS() {

    if (!coords.origen || !coords.destino || !kmInput) return;

    kmInput.value = '';

    kmInput.setAttribute(
        'placeholder',
        'Calculando ruta...'
    );

    try {

        const res = await fetch(
            'https://api.openrouteservice.org/v2/directions/driving-car',
            {
                method: 'POST',

                headers: {
                    'Authorization': ORS_API_KEY,
                    'Content-Type': 'application/json'
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

        const data = await res.json();

//////////////////////////////////////////////////
// KM
//////////////////////////////////////////////////

const km =
    (
        data.routes[0].summary.distance
        / 1000
    ).toFixed(1);

//////////////////////////////////////////////////
// TIEMPO
//////////////////////////////////////////////////

const tiempoRuta =
    Math.round(
        data.routes[0].summary.duration / 60
    );

//////////////////////////////////////////////////
// ACTUALIZAR UI
//////////////////////////////////////////////////

kmInput.value = km;

document.getElementById('tiempo-ruta').textContent =
    `Duración aproximada: ${tiempoRuta} min`;

        kmInput.dispatchEvent(
            new Event('input')
        );

        calcularPresupuesto();

    } catch (err) {

        console.warn(
            'OpenRouteService error:',
            err.message
        );

        kmInput.setAttribute(
            'placeholder',
            'Error calculando ruta'
        );
    }
}
    
window.addEventListener('scroll', () => {

    if(window.scrollY > 40){

        document.body.classList.add('scrolled');

    }else{

        document.body.classList.remove('scrolled');

    }

});

}); // fin DOMContentLoaded
