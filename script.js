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

//////////////////////////////////////////////////////
// LÍMITES DE CAJAS
//////////////////////////////////////////////////////

let maxCajasPequenas = 0;
let maxCajasMedianas = 0;
let maxCajasGrandes = 0;

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
    function campoRelleno(id){

    const el = document.getElementById(id);

    if(!el) return false;

    return el.value.trim() !== '';
}

//////////////////////////////////////////////////////
// CALCULAR PROGRESO GLOBAL REAL
//////////////////////////////////////////////////////

function actualizarBarraGlobal(){

    let progreso = 0;

    //////////////////////////////////////////////////
    // VENTANA 1
    //////////////////////////////////////////////////

    let ventana1 = 0;

    if(campoRelleno('nombre'))
        ventana1++;

    if(campoRelleno('telefono'))
        ventana1++;

    if(campoRelleno('email'))
        ventana1++;

    if(campoRelleno('fecha'))
        ventana1++;

    if(campoRelleno('origen'))
        ventana1++;

    if(campoRelleno('destino'))
        ventana1++;

    progreso += (ventana1 / 6) * 33;

    //////////////////////////////////////////////////
    // VENTANA 2
    //////////////////////////////////////////////////

    let inventarioTotal = 0;

    document
    .querySelectorAll('.inventario-input')
    .forEach(input => {

        inventarioTotal +=
            parseInt(input.value) || 0;
    });

    if(inventarioTotal > 0){

        progreso += 33;
    }

    //////////////////////////////////////////////////
    // MUDANZA TOTAL
    //////////////////////////////////////////////////

    if(mudanzaTotal){

        progreso = 100;

    }else{

        //////////////////////////////////////////////////
        // VENTANA 4
        //////////////////////////////////////////////////

        let servicios = 0;

        servicios +=
            parseInt(
                document.getElementById(
                    'cant_desmontar'
                )?.value
            ) || 0;

        servicios +=
            parseInt(
                document.getElementById(
                    'cant_montar'
                )?.value
            ) || 0;

        servicios +=
            parseInt(
                document.getElementById(
                    'cant_embalar'
                )?.value
            ) || 0;

        const seguro =
            parseFloat(
                document.getElementById(
                    'valor_seguro'
                )?.value
            ) || 0;

        if(servicios > 0 || seguro > 0){

            progreso += 34;
        }
    }

    //////////////////////////////////////////////////
    // LIMITADOR
    //////////////////////////////////////////////////

    progreso =
        Math.max(
            0,
            Math.min(
                100,
                progreso
            )
        );

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
    const badgeMudanzaTotal =
document.getElementById(
    'mudanza-total-badge'
);
    const ahorroMudanzaTotal =
document.getElementById(
    'mudanza-total-ahorro'
);

if(toggleMudanzaTotal){

    console.log('BOTON ENCONTRADO');

    toggleMudanzaTotal.addEventListener('click',()=>{

        console.log('CLICK');

        mudanzaTotal = !mudanzaTotal;

       const badgeDesmontar =
document.getElementById('badge-desmontar');

const badgeMontar =
document.getElementById('badge-montar');

const badgeEmbalar =
document.getElementById('badge-embalar');

const badgeEmpaquetar =
document.getElementById('badge-empaquetar');

const badgeSeguro =
document.getElementById('badge-seguro');

const beneficiosMudanzaTotal =
document.getElementById('beneficios-mudanza-total');

const cajasMudanzaTotal =
document.getElementById('cajas-mudanza-total');
        
        badgeMudanzaTotal.classList.toggle(
    'hidden',
    !mudanzaTotal
);
        ahorroMudanzaTotal?.classList.toggle(
    'hidden',
    !mudanzaTotal
);
        badgeDesmontar?.classList.toggle(
    'hidden',
    !mudanzaTotal
);

badgeMontar?.classList.toggle(
    'hidden',
    !mudanzaTotal
);

badgeEmbalar?.classList.toggle(
    'hidden',
    !mudanzaTotal
);

badgeEmpaquetar?.classList.toggle(
    'hidden',
    !mudanzaTotal
);

badgeSeguro?.classList.toggle(
    'hidden',
    !mudanzaTotal
);

beneficiosMudanzaTotal?.classList.toggle(
    'hidden',
    !mudanzaTotal
);

cajasMudanzaTotal?.classList.toggle(
    'hidden',
    !mudanzaTotal
);

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

        const empaquetar =
document.getElementById(
    'cant_empaquetar'
);
        
        const botonesServicios = document.querySelectorAll(
'#card-desmontar .qty-btn, #card-montar .qty-btn, #card-embalar .qty-btn, #card-empaquetar .qty-btn'
);

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

            if(empaquetar){

    empaquetar.value = 0;

    empaquetar.disabled = true;

}
            
            botonesServicios.forEach(btn => {

    btn.disabled = true;

    btn.classList.add(
        'opacity-40',
        'cursor-not-allowed'
    );

});

        }else{

            if(desmontar) desmontar.disabled = false;
            if(montar) montar.disabled = false;
            if(embalar) embalar.disabled = false;
            if(seguro) seguro.disabled = false;
            if(empaquetar)
    empaquetar.disabled = false;
            botonesServicios.forEach(btn => {

    btn.disabled = false;

    btn.classList.remove(
        'opacity-40',
        'cursor-not-allowed'
    );

});
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
    ? '✅ MUDANZA TOTAL ACTIVADA'
    : 'ACTIVAR MUDANZA TOTAL (+249 €)';
}
        //////////////////////////////////////////////////
// COLOR DEL BOTÓN
//////////////////////////////////////////////////

if(mudanzaTotal){

    toggleMudanzaTotal.classList.remove(
        'bg-violet-600'
    );

    toggleMudanzaTotal.classList.remove(
        'hover:bg-violet-700'
    );

    toggleMudanzaTotal.classList.add(
        'bg-green-600'
    );

}else{

    toggleMudanzaTotal.classList.remove(
        'bg-green-600'
    );

    toggleMudanzaTotal.classList.add(
        'bg-violet-600'
    );

    toggleMudanzaTotal.classList.add(
        'hover:bg-violet-700'
    );
}

if (typeof window.calcularPresupuesto === "function") {

    window.calcularPresupuesto();

}

actualizarCajasRecomendadas();

    });

}
    
    // ─── 1. CONFIGURACIÓN SUPABASE ────────────────────────────────────────────
    const SUPABASE_URL =
'https://defvfvfyrydopaybnisg.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_dKIRJ1_K4u1ypfCNTuylIw_AyAKeZTS';
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
    const stripe = Stripe(
"pk_test_51Tfg4OFSVrBYF3DQje28gVz9BNoboiNfu5hoOnB8DWQ1WLXe15NoZy8uO7lz7m5IqStjvJ1ovpg0mSvfetzJTN9r005QEQmEip"
);
console.log("Stripe cargado:", stripe);

    // ─── 2. REFERENCIAS UI ───────────────────────────────────────────────────
    window.UI = {
    form: document.getElementById('contact-form'),
    btnSubmit: document.getElementById('btn_submit'),
    cajaPrecio: document.getElementById('caja-precio'),
    precioTotal: document.getElementById('precio-total'),
    precioReserva: document.getElementById('precio-reserva'),
    desglose: document.getElementById('desglose-precio'),
    successModal: document.getElementById('success-modal'),
    closeModal: document.getElementById('close-modal'),
};

// 👇 PÉGALOS AQUÍ
console.log("FORM:", document.getElementById("contact-form"));
console.log("BTN:", document.getElementById("btn_submit"));

// ─── 3. BANNER RGPD ─────────────────────────────────────────
const cookieBanner = document.getElementById('cookie-banner');
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

    if (typeof window.calcularPresupuesto === "function") {

    window.calcularPresupuesto();

}
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

if(mudanzaTotal){

    actualizarCajasRecomendadas();

}

}   // ← ESTA LLAVE FALTABA

//////////////////////////////////////////////////////
// CAJAS RECOMENDADAS IA
//////////////////////////////////////////////////////

function actualizarCajasRecomendadas(){

    if(!mudanzaTotal) return;

    const m3 = metrosCubicosTotales;

    let pequenas = 6;
    let medianas = 3;
    let grandes = 1;

    if(m3 > 5){

        pequenas = 10;
        medianas = 5;
        grandes = 2;

    }

    if(m3 > 10){

        pequenas = 15;
        medianas = 8;
        grandes = 3;

    }

    if(m3 > 15){

        pequenas = 20;
        medianas = 10;
        grandes = 4;

    }

    if(m3 > 20){

        pequenas = 25;
        medianas = 12;
        grandes = 6;

    }

    if(m3 > 25){

        pequenas = 30;
        medianas = 15;
        grandes = 8;

    }

    if(m3 > 30){

        pequenas = 35;
        medianas = 18;
        grandes = 10;

    }

    document.getElementById("cajas_pequenas").value = pequenas;

    document.getElementById("cajas_medianas").value = medianas;

    document.getElementById("cajas_grandes").value = grandes;

    //////////////////////////////////////////////////////
// GUARDAR LÍMITES (+20%)
//////////////////////////////////////////////////////

maxCajasPequenas = Math.ceil(pequenas * 1.20);

maxCajasMedianas = Math.ceil(medianas * 1.20);

maxCajasGrandes = Math.ceil(grandes * 1.20);

actualizarEstadoCajas();

}

//////////////////////////////////////////////////////
// CONTROL DE LÍMITES DE CAJAS
//////////////////////////////////////////////////////

function actualizarEstadoCajas(){

    const configuracion = [

        {
            input:"cajas_pequenas",
            info:"info-cajas-pequenas",
            boton:"mas-cajas-pequenas",
            max: maxCajasPequenas
        },

        {
            input:"cajas_medianas",
            info:"info-cajas-medianas",
            boton:"mas-cajas-medianas",
            max: maxCajasMedianas
        },

        {
            input:"cajas_grandes",
            info:"info-cajas-grandes",
            boton:"mas-cajas-grandes",
            max: maxCajasGrandes
        }

    ];

    configuracion.forEach(caja=>{

        const input =
        document.getElementById(caja.input);

        const info =
        document.getElementById(caja.info);

        const boton =
        document.getElementById(caja.boton);

        if(!input || !info || !boton) return;

        const valor =
        parseInt(input.value)||0;

        info.textContent =
        valor + " / " + caja.max;

        if(valor>=caja.max){

            boton.disabled = true;

            boton.classList.add(
                "opacity-40",
                "cursor-not-allowed"
            );

            info.classList.remove(
                "text-gray-500"
            );

            info.classList.add(
                "text-red-600",
                "font-bold"
            );

        }else{

            boton.disabled = false;

            boton.classList.remove(
                "opacity-40",
                "cursor-not-allowed"
            );

            info.classList.remove(
                "text-red-600",
                "font-bold"
            );

            info.classList.add(
                "text-gray-500"
            );

        }

    });

}

//////////////////////////////////////////////////////
// MOTOR UNIVERSAL DE CANTIDADES
//////////////////////////////////////////////////////

function cambiarCantidad(inputId, cambio, minimo = 0, maximo = Infinity){

    const input =
    document.getElementById(inputId);

    if(!input) return;

    let valor =
    parseInt(input.value) || 0;

    valor += cambio;

    if(valor < minimo){

        valor = minimo;

    }

    if(valor > maximo){

        valor = maximo;

    }

    input.value = valor;

    input.dispatchEvent(
        new Event("input")
    );

    input.dispatchEvent(
        new Event("change")
    );

}

//////////////////////////////////////////////////////
// EVENTOS CAJA PEQUEÑA
//////////////////////////////////////////////////////

const btnMenosPequenas =
document.getElementById("menos-cajas-pequenas");

const btnMasPequenas =
document.getElementById("mas-cajas-pequenas");

btnMenosPequenas?.addEventListener("click",()=>{

    cambiarCantidad(
        "cajas_pequenas",
        -1,
        0,
        maxCajasPequenas
    );

    actualizarEstadoCajas();

});

btnMasPequenas?.addEventListener("click",()=>{

    cambiarCantidad(
        "cajas_pequenas",
        1,
        0,
        maxCajasPequenas
    );

    actualizarEstadoCajas();

});

//////////////////////////////////////////////////////
// EVENTOS CAJA MEDIANA
//////////////////////////////////////////////////////

const btnMenosMedianas =
document.getElementById("menos-cajas-medianas");

const btnMasMedianas =
document.getElementById("mas-cajas-medianas");

btnMenosMedianas?.addEventListener("click",()=>{

    cambiarCantidad(
        "cajas_medianas",
        -1,
        0,
        maxCajasMedianas
    );

    actualizarEstadoCajas();

});

btnMasMedianas?.addEventListener("click",()=>{

    cambiarCantidad(
        "cajas_medianas",
        1,
        0,
        maxCajasMedianas
    );

    actualizarEstadoCajas();

});

//////////////////////////////////////////////////////
// EVENTOS CAJA GRANDE
//////////////////////////////////////////////////////

const btnMenosGrandes =
document.getElementById("menos-cajas-grandes");

const btnMasGrandes =
document.getElementById("mas-cajas-grandes");

btnMenosGrandes?.addEventListener("click",()=>{

    cambiarCantidad(
        "cajas_grandes",
        -1,
        0,
        maxCajasGrandes
    );

    actualizarEstadoCajas();

});

btnMasGrandes?.addEventListener("click",()=>{

    cambiarCantidad(
        "cajas_grandes",
        1,
        0,
        maxCajasGrandes
    );

    actualizarEstadoCajas();

});
    
    window.actualizarResumenGlobal = actualizarResumenGlobal;

    document.querySelectorAll('.calculo-trigger').forEach(el => {

    el.addEventListener('input', () => {

        if (typeof window.calcularPresupuesto === "function") {
            window.calcularPresupuesto();
        }

    });

    el.addEventListener('change', () => {

        if (typeof window.calcularPresupuesto === "function") {
            window.calcularPresupuesto();
        }

    });

});


    // ─── 6. SUBIDA DE FOTOS A SUPABASE STORAGE ───────────────────────────────
    async function subirFotos(inputEl) {
        if (!inputEl || !inputEl.files.length || !supabase) return null;
        const urls = [];

        for (const file of Array.from(inputEl.files)) {
            const ext  = file.name.split('.').pop().toLowerCase();
            const path = `fotos-mudanzas/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
            try {
                const { data, error } =
await supabase.storage
.from('documentos')
.upload(path, file);

console.log("UPLOAD");
console.log(data);
console.log(error);

                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path);
                console.log("PUBLIC URL");
console.log(publicUrl);
                urls.push(publicUrl);
            } catch (err) {
                console.error('Error subiendo foto:', err.message);
            }
        }

        console.log("URLS FINALES");
console.log(urls);

        return urls.length ? urls.join(', ') : null;
    }

//////////////////////////////////////////////////////
// OBTENER INVENTARIO COMPLETO
//////////////////////////////////////////////////////

function obtenerInventario() {

    const inventario = [];

    document.querySelectorAll(".inventario-input").forEach(input => {

        const cantidad = parseInt(input.value) || 0;

        if (cantidad <= 0) return;

        const item = input.closest(".inventario-item");

        inventario.push({

            nombre:
                item.querySelector("span")?.textContent.trim() || "",

            cantidad,

            precio:
                parseFloat(input.dataset.precio) || 0,

            metrosCubicos:
                parseFloat(input.dataset.m3) || 0,

            fragil:
                input.dataset.fragil === "si"

        });

    });

    return inventario;

}

//////////////////////////////////////////////////////
// OBTENER DATOS DEL FORMULARIO
//////////////////////////////////////////////////////

function obtenerDatosFormulario({

    fotosString,

    inventario,

    volumenTexto,

    ascOrigen,

    ascDestino,

    pisoOrigen,

    pisoDestino,

    extrasArr

}){

    return {

        nombre:
            document.getElementById("nombre").value.trim(),

        telefono:
            document.getElementById("telefono").value.trim(),

        email:
            document.getElementById("email").value.trim(),

        origen:
            document.getElementById("origen").value.trim(),

        destino:
            document.getElementById("destino").value.trim(),

        km:
            parseFloat(
                document.getElementById("km")?.value
            ) || 0,

        fecha:
            document.getElementById("fecha").value,

        volumen:
            volumenTexto,

        ascensor:

            `Recogida: ${
                ascOrigen === "si"

                ? "Con ascensor"

                : `Sin ascensor (piso ${pisoOrigen})`

            } | Entrega: ${
                ascDestino === "si"

                ? "Con ascensor"

                : `Sin ascensor (piso ${pisoDestino})`

            }`,

        extras:

            extrasArr.join(" | ")

            || "Solo transporte básico",

        observaciones:

            document
                .getElementById("observaciones")
                ?.value
                .trim() || "",

        tipo_servicio:

            mudanzaTotal

                ? "Mudanza Total"

                : "Mudanza Estándar",

        preciototal:
            window.UI.precioTotal.textContent,

        precioreserva:
            window.UI.precioReserva.textContent,

        urls_fotos:
            fotosString,

        inventario

    };

}

    // ─── 7. ENVÍO DEL FORMULARIO ─────────────────────────────────────────────
    if (window.UI.form) {

    window.UI.form.addEventListener('submit', async (e) => {

        e.preventDefault();

        const btnOriginal = window.UI.btnSubmit.innerHTML;

        window.UI.btnSubmit.disabled = true;

        window.UI.btnSubmit.innerHTML =
            `<i data-lucide="loader-2" class="w-6 h-6 mr-3 animate-spin"></i> Procesando tu reserva...`;
            if (window.lucide) lucide.createIcons();

            try {
                // Subir fotos si las hay
            
                const fotosString = await subirFotos(document.getElementById('fotos_upload'));

                console.log("FOTOS DEVUELTAS");
console.log(fotosString);
console.log(typeof fotosString);

                console.log("================================");
console.log("RESULTADO SUBIRFOTOS");
console.log(fotosString);
console.log("================================");

                console.log("FOTOS SUBIDAS:");
console.log(fotosString);

                // Recopilar datos de ascensores
                const ascOrigen  = document.getElementById('ascensor_origen')?.value  || 'si';
                const pisoOrigen = parseInt(document.getElementById('piso_origen')?.value)  || 0;
                const ascDestino = document.getElementById('ascensor_destino')?.value || 'si';
                const pisoDestino= parseInt(document.getElementById('piso_destino')?.value) || 0;

                console.log("DESMONTAJE",
document.getElementById("cant_desmontar")?.value);

console.log("MONTAJE",
document.getElementById("cant_montar")?.value);

console.log("EMBALAJE",
document.getElementById("cant_embalar")?.value);

console.log("EMPAQUETADO",
document.getElementById("cant_empaquetar")?.value);
                // Recopilar extras para el campo texto
                const extrasArr = [];
                const cantD = parseInt(document.getElementById('cant_desmontar')?.value) || 0;
                const cantM = parseInt(document.getElementById('cant_montar')?.value)    || 0;
                const cantE = parseInt(document.getElementById('cant_embalar')?.value)   || 0;
                const cantP = parseInt(document.getElementById('cant_empaquetar')?.value) || 0;
                const seguro= parseFloat(document.getElementById('valor_seguro')?.value) || 0;

                if (cantD > 0) extrasArr.push(`Desmontaje ×${cantD}`);
                if (cantM > 0) extrasArr.push(`Montaje ×${cantM}`);
                if (cantE > 0) extrasArr.push(`Embalaje ×${cantE}`);
                if (cantP > 0) extrasArr.push(`Empaquetado ×${cantP}`);
                if (seguro > 0) extrasArr.push(`Seguro: ${seguro} €`);

                const volumenSelect = document.getElementById('volumen');
                const volumenTexto  = volumenSelect?.options[volumenSelect.selectedIndex]?.text || '';

                //////////////////////////////////////////////////////
// GUARDAR RESERVA EN SUPABASE
//////////////////////////////////////////////////////
const inventario = obtenerInventario();

console.log("INVENTARIO COMPLETO");
console.log(inventario);
console.log("Cantidad de objetos:", inventario.length);

const datosFormulario = obtenerDatosFormulario({

    fotosString,

    inventario,

    volumenTexto,

    ascOrigen,

    ascDestino,

    pisoOrigen,

    pisoDestino,

    extrasArr

});

console.log("================================");
console.log("DATOS QUE SE VAN A ENVIAR");
console.log(datosFormulario);

console.log("Inventario:");
console.log(datosFormulario.inventario);

console.log("Fotos:");
console.log(datosFormulario.urls_fotos);

console.log("================================");

const respuestaReserva = await fetch("/api/guardar-reserva", {

    method: "POST",

    headers: {
        "Content-Type": "application/json"
    },

    body: JSON.stringify(datosFormulario)

});

const datosReserva = await respuestaReserva.json();

if (!respuestaReserva.ok) {

    throw new Error(

        datosReserva.error ||

        "No se pudo guardar la reserva."

    );

}

                const respuestaStripe = await fetch("/api/create-checkout-session", {

    method: "POST",

    headers: {
        "Content-Type": "application/json"
    },

    body: JSON.stringify({

        nombre: document.getElementById("nombre").value.trim(),

        email: document.getElementById("email").value.trim(),

        telefono: document.getElementById("telefono").value.trim(),

        importe: parseFloat(
            window.UI.precioReserva.textContent
                .replace("€", "")
                .replace(",", ".")
        ),

        origen: document.getElementById("origen").value.trim(),

        destino: document.getElementById("destino").value.trim(),

        km: parseFloat(document.getElementById("km")?.value) || 0,

        fecha: document.getElementById("fecha").value,

        volumen: volumenTexto,

        ascensor:
            `Recogida: ${
                ascOrigen === "si"
                    ? "Con ascensor"
                    : `Sin ascensor (piso ${pisoOrigen})`
            } | Entrega: ${
                ascDestino === "si"
                    ? "Con ascensor"
                    : `Sin ascensor (piso ${pisoDestino})`
            }`,

        extras: extrasArr.join(" | ") || "Solo transporte básico",

        observaciones:
            document.getElementById("observaciones")?.value.trim() || "",

        tipo_servicio:
            mudanzaTotal
                ? "Mudanza Total"
                : "Mudanza Estándar",

        preciototal: window.UI.precioTotal.textContent,

        precioreserva: window.UI.precioReserva.textContent,

urls_fotos: "Consultar en Panel Rodax",


    inventario: inventario,

    numero_reserva: datosReserva.numero_reserva

})

});   // ← ESTA LÍNEA FALTABA

const datosStripe = await respuestaStripe.json();

console.log("ID DEVUELTO:", datosStripe.id);
console.log("Stripe object:", stripe);

if (!respuestaStripe.ok) {

    throw new Error(
        datosStripe.error ||
        "Error creando la sesión Stripe."
    );

}

const stripeResult = await stripe.redirectToCheckout({
    sessionId: datosStripe.id
});

if (stripeResult.error) {

    throw stripeResult.error;

}

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
    observaciones: document.getElementById('observaciones')?.value.trim() || '',
    tipo_servicio: mudanzaTotal ? 'Mudanza Total' : 'Mudanza Estándar',
    estado:        'Pendiente de Pago',
    urls_fotos:    fotosString,
    inventario:    JSON.stringify(inventario), // 👈 AGREGA ESTA LÍNEA (Guardamos el inventario como texto JSON)
    preciototal:   window.UI.precioTotal.textContent,
    precioreserva: window.UI.precioReserva.textContent,
};


                
                const { error } = await supabase.from('mudanzas').insert([payload]);
                if (error) throw error;
            

                // Éxito: mostrar modal con instrucciones de pago
                /*
                UI.successModal.classList.remove('hidden');
                UI.form.reset();
                UI.cajaPrecio.classList.add('hidden');
                */

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
                window.UI.btnSubmit.disabled = false;

window.UI.btnSubmit.innerHTML = btnOriginal;
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    window.UI.closeModal?.addEventListener('click', () => {

    window.UI.successModal.classList.add('hidden');

});

    //////////////////////////////////////////////////////
// CONTADOR DE OBSERVACIONES
//////////////////////////////////////////////////////

const observaciones =
document.getElementById("observaciones");

const contadorObservaciones =
document.getElementById("contador-observaciones");

if(observaciones && contadorObservaciones){

    observaciones.addEventListener("input",()=>{

        const caracteres =
        observaciones.value.length;

        contadorObservaciones.textContent =
        caracteres;

        contadorObservaciones.classList.remove(
            "text-gray-400",
            "text-orange-500",
            "text-red-600"
        );

        if(caracteres >= 450){

            contadorObservaciones.classList.add(
                "text-red-600"
            );

        }

        else if(caracteres >= 400){

            contadorObservaciones.classList.add(
                "text-orange-500"
            );

        }

        else{

            contadorObservaciones.classList.add(
                "text-gray-400"
            );

        }

    });

}
    
window.addEventListener('scroll', () => {

    if(window.scrollY > 40){

        document.body.classList.add('scrolled');

    }else{

        document.body.classList.remove('scrolled');

    }

});

}); // fin DOMContentLoaded
