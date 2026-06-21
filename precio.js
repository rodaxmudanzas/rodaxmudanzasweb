window.calcularPresupuesto = function calcularPresupuesto() {

    console.log("UI =", UI);

if (!UI.cajaPrecio){
    console.log("NO EXISTE cajaPrecio");
    return;
}

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

console.log("KM =", km);

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

    console.log("m3 =", metrosCubicos);
console.log("Inventario =", totalInventario);

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

    console.log(
    "actualizarResumenGlobal =",
    typeof actualizarResumenGlobal
);

console.log({
    totalBase,
    totalExtras,
    totalInventario,
    totalServicios,
    recargoLogistico,
    totalFinalIA
});

window.actualizarResumenGlobal(
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
