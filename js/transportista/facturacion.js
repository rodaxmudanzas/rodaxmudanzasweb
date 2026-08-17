/**
 * ==========================================================
 * RODAX Marketplace
 * Archivo : js/transportista/facturacion.js
 * Módulo  : Facturación
 * ----------------------------------------------------------
 * Función:
 * - Mostrar únicamente Liquidaciones previstas y Liquidaciones efectuadas.
 * - Relacionar pagos con la mudanza y con la autofactura.
 * - Mostrar importes, fechas y estado real del pago.
 * - Permitir abrir/imprimir la autofactura cuando existe.
 * - Si todavía no existe registro de autofactura, permitir una
 *   previsualización imprimible con los datos disponibles.
 *
 * Nota:
 * Este módulo no crea registros en autofacturas desde el navegador.
 * La creación definitiva de la autofactura debe hacerse en backend
 * (webhook/servidor) para no depender de permisos de inserción RLS.
 * ==========================================================
 */

(function (window) {
    "use strict";

    const CACHE = {
        pagos: [],
        mudanzas: new Map(),
        autofacturas: new Map(),
        transportista: null
    };

    function obtenerSupabase() {
        if (window.dbClient && typeof window.dbClient.from === "function") {
            return window.dbClient;
        }

        if (window.supabaseClient && typeof window.supabaseClient.from === "function") {
            return window.supabaseClient;
        }

        if (
            window.RODAX &&
            window.RODAX.supabase &&
            typeof window.RODAX.supabase.from === "function"
        ) {
            return window.RODAX.supabase;
        }

        if (
            window.RODAX &&
            window.RODAX.supabaseClient &&
            typeof window.RODAX.supabaseClient.from === "function"
        ) {
            return window.RODAX.supabaseClient;
        }

        return null;
    }

    function obtenerTransportistaId() {
        const candidatos = [
            window.currentUserId,
            window.Transportista && window.Transportista.currentUserId,
            window.transportista && window.transportista.currentUserId,
            window.transportista && window.transportista.id,
            window.Transportista && window.Transportista.id,
            window.RODAX && window.RODAX.state &&
                typeof window.RODAX.state.get === "function"
                ? window.RODAX.state.get("transportista.id")
                : null,
            window.RODAX && window.RODAX.state &&
                typeof window.RODAX.state.get === "function"
                ? window.RODAX.state.get("auth.user.id")
                : null,
            window.RODAX && window.RODAX.state &&
                typeof window.RODAX.state.get === "function"
                ? window.RODAX.state.get("user.id")
                : null
        ];

        return candidatos.find(Boolean) || null;
    }

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatearEuros(valor) {
        const numero = Number(valor) || 0;
        return numero.toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR"
        });
    }

    function numero(valor) {
        const n = Number(valor);
        return Number.isFinite(n) ? n : 0;
    }

    function formatearFecha(valor) {
        if (!valor) return "—";
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) return escaparHTML(valor);
        return fecha.toLocaleDateString("es-ES");
    }

    function formatearFechaHora(valor) {
        if (!valor) return "—";
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) return escaparHTML(valor);
        return fecha.toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }

    function estadoPagoNormalizado(valor) {
        return String(valor || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function esProcesado(pago) {
        const estado = estadoPagoNormalizado(pago && pago.estado_pago);
        return [
            "pagado",
            "pagada",
            "procesado",
            "procesada",
            "completado",
            "completada",
            "liquidado",
            "liquidada"
        ].includes(estado);
    }

    function obtenerImportePago(pago) {
        const candidatos = [
            pago && pago.importe_transportista,
            pago && pago.importe_total,
            pago && pago.preciototal,
            pago && pago.importe_reserva
        ];

        for (const candidato of candidatos) {
            const n = Number(candidato);
            if (Number.isFinite(n) && n > 0) return n;
        }

        return 0;
    }

    function obtenerFechaPago(pago) {
        return pago && (
            pago.fecha_pagado ||
            pago.fecha_pago ||
            pago.updated_at ||
            pago.created_at
        );
    }

    function obtenerFechaProgramada(pago) {
        return pago && (
            pago.fecha_programada ||
            pago.fecha_cobro_70 ||
            pago.fecha ||
            pago.created_at
        );
    }

    function descripcionServicio(mudanza, pago) {
        if (!mudanza) {
            return pago && pago.numero_reserva
                ? `Servicio ${pago.numero_reserva}`
                : "Servicio de mudanza";
        }

        const origen = mudanza.origen || "Origen no disponible";
        const destino = mudanza.destino || "Destino no disponible";
        const tipo = String(mudanza.tipo_servicio || "").toLowerCase().includes("total")
            ? "Mudanza Total"
            : "Mudanza Estándar";

        return `${tipo}: ${origen} → ${destino}`;
    }

    function obtenerDatosTransportista() {
        return CACHE.transportista || {};
    }

    function obtenerAutofacturaParaPago(pago) {
        if (!pago) return null;

        if (pago.autofactura_id && CACHE.autofacturas.has(pago.autofactura_id)) {
            return CACHE.autofacturas.get(pago.autofactura_id);
        }

        const mudanzaId = pago.mudanza_id != null ? String(pago.mudanza_id) : null;
        const numeroReserva = String(pago.numero_reserva || "").trim();

        for (const factura of CACHE.autofacturas.values()) {
            if (
                mudanzaId &&
                factura.mudanza_id != null &&
                String(factura.mudanza_id) === mudanzaId
            ) {
                return factura;
            }

            if (
                numeroReserva &&
                factura.numero_reserva &&
                String(factura.numero_reserva) === numeroReserva
            ) {
                return factura;
            }
        }

        return null;
    }

    function generarNumeroPrevisualizacion(pago) {
        const reserva = String(pago && pago.numero_reserva || "SIN-RESERVA");
        return `BORRADOR-${reserva}`;
    }

    function normalizarJSON(valor) {
        if (!valor) return {};
        if (typeof valor === "object") return valor;
        try {
            return JSON.parse(valor);
        } catch {
            return {};
        }
    }

    function abrirFactura(pagoKey) {
        const pago = CACHE.pagos.find(function (item) {
            return String(item.__key) === String(pagoKey);
        });

        if (!pago) {
            console.error("RODAX Facturación: pago no encontrado", pagoKey);
            return;
        }

        const mudanza = pago.__mudanza || {};
        const factura = obtenerAutofacturaParaPago(pago);
        const transportista = obtenerDatosTransportista();

        if (factura && factura.pdf_url) {
            window.open(factura.pdf_url, "_blank", "noopener,noreferrer");
            return;
        }

        const transportistaDatos = normalizarJSON(
            factura && factura.transportista_datos
        );

        const servicioDatos = normalizarJSON(
            factura && factura.servicio_datos
        );

        const nombreTransportista =
            transportistaDatos.nombre ||
            transportista.nombre ||
            "Transportista RODAX";

        const emailTransportista =
            transportistaDatos.email ||
            transportista.email ||
            "";

        const telefonoTransportista =
            transportistaDatos.telefono ||
            transportista.telefono ||
            "";

        const base = numero(
            factura && factura.base_imponible
        ) || obtenerImportePago(pago) / 1.21;

        const ivaPorcentaje = numero(
            factura && factura.iva_porcentaje
        ) || 21;

        const iva = numero(
            factura && factura.iva_importe
        ) || base * ivaPorcentaje / 100;

        const total = numero(
            factura && factura.total_factura
        ) || base + iva;

        const numeroFactura =
            factura && factura.numero_factura
                ? factura.numero_factura
                : generarNumeroPrevisualizacion(pago);

        const fechaFactura =
            factura && factura.fecha_factura
                ? factura.fecha_factura
                : new Date().toISOString();

        const origen = servicioDatos.origen || mudanza.origen || "—";
        const destino = servicioDatos.destino || mudanza.destino || "—";
        const fechaServicio =
            servicioDatos.fecha || mudanza.fecha || pago.fecha_programada || "—";
        const km = servicioDatos.km ?? mudanza.km ?? "—";
        const volumen = servicioDatos.volumen || mudanza.volumen || "—";
        const tipoServicio =
            servicioDatos.tipo_servicio ||
            mudanza.tipo_servicio ||
            "Mudanza";

        const observaciones =
            factura && factura.observaciones
                ? factura.observaciones
                : mudanza.observaciones || "";

        const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Factura ${escaparHTML(numeroFactura)} - RODAX</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
    *{box-sizing:border-box}
    body{margin:0;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a}
    .pagina{width:min(900px,100% - 32px);margin:32px auto;background:#fff;padding:42px;border-radius:18px;box-shadow:0 12px 40px rgba(15,23,42,.10)}
    .cabecera{display:flex;justify-content:space-between;gap:30px;border-bottom:3px solid #165DDB;padding-bottom:22px}
    .marca{font-size:30px;font-weight:900;color:#165DDB;letter-spacing:.5px}
    .submarca{font-size:12px;color:#64748b;font-weight:700;letter-spacing:1.6px;margin-top:4px}
    .titulo{font-size:28px;font-weight:900;color:#0f3f9f;text-align:right}
    .numero{margin-top:8px;font-size:14px;color:#334155;text-align:right}
    .bloques{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:28px 0}
    .bloque{border:1px solid #dbe4f0;border-radius:14px;padding:18px;background:#f8fafc}
    .etiqueta{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;font-weight:800}
    .valor{font-size:15px;font-weight:700;margin-top:6px;line-height:1.45}
    .tabla{width:100%;border-collapse:collapse;margin-top:24px}
    .tabla th{background:#eff5ff;color:#174ea6;font-size:12px;text-align:left;padding:12px;border-bottom:1px solid #dbe4f0}
    .tabla td{padding:14px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;vertical-align:top}
    .totales{width:min(380px,100%);margin:20px 0 0 auto}
    .fila{display:flex;justify-content:space-between;padding:8px 0;color:#334155}
    .total{display:flex;justify-content:space-between;padding:14px 0;margin-top:6px;border-top:2px solid #165DDB;font-weight:900;font-size:20px;color:#0f3f9f}
    .nota{margin-top:28px;background:#f8fafc;border:1px solid #dbe4f0;border-radius:12px;padding:14px;font-size:12px;color:#475569;line-height:1.5}
    .acciones{display:flex;gap:12px;margin-top:30px}
    button{border:0;border-radius:10px;padding:12px 18px;font-weight:800;cursor:pointer}
    .primario{background:#165DDB;color:#fff}
    .secundario{background:#e8eef8;color:#173b72}
    @media(max-width:700px){.pagina{padding:24px}.cabecera,.bloques{grid-template-columns:1fr;display:grid}.titulo,.numero{text-align:left}.acciones{flex-direction:column}.totales{width:100%}}
    @media print{body{background:#fff}.pagina{width:100%;margin:0;padding:12px;box-shadow:none;border-radius:0}.acciones{display:none}}
</style>
</head>
<body>
<div class="pagina">
    <div class="cabecera">
        <div>
            <div class="marca">RODAX</div>
            <div class="submarca">MUDANZAS · FACTURACIÓN</div>
        </div>
        <div>
            <div class="titulo">FACTURA</div>
            <div class="numero">N.º ${escaparHTML(numeroFactura)}</div>
            <div class="numero">Fecha: ${escaparHTML(formatearFecha(fechaFactura))}</div>
        </div>
    </div>

    <div class="bloques">
        <div class="bloque">
            <div class="etiqueta">Transportista</div>
            <div class="valor">${escaparHTML(nombreTransportista)}</div>
            <div class="valor">${escaparHTML(emailTransportista)}</div>
            <div class="valor">${escaparHTML(telefonoTransportista)}</div>
            ${transportistaDatos.nif ? `<div class="valor">NIF: ${escaparHTML(transportistaDatos.nif)}</div>` : ""}
            ${transportistaDatos.direccion ? `<div class="valor">${escaparHTML(transportistaDatos.direccion)}</div>` : ""}
        </div>
        <div class="bloque">
            <div class="etiqueta">RODAX</div>
            <div class="valor">RODAX Furgo Mudanzas</div>
            <div class="valor">Factura generada automáticamente para la liquidación del servicio.</div>
            <div class="valor">Reserva: ${escaparHTML(pago.numero_reserva || "—")}</div>
        </div>
    </div>

    <table class="tabla">
        <thead>
            <tr><th>Descripción del servicio</th><th>Datos del servicio</th><th>Importe</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>${escaparHTML(factura && factura.descripcion_servicio || descripcionServicio(mudanza, pago))}</td>
                <td>
                    ${escaparHTML(tipoServicio)}<br>
                    ${escaparHTML(fechaServicio)}<br>
                    ${escaparHTML(origen)} → ${escaparHTML(destino)}<br>
                    ${escaparHTML(String(km))} km · ${escaparHTML(String(volumen))}
                </td>
                <td>${formatearEuros(base)}</td>
            </tr>
        </tbody>
    </table>

    <div class="totales">
        <div class="fila"><span>Base imponible</span><strong>${formatearEuros(base)}</strong></div>
        <div class="fila"><span>IVA (${ivaPorcentaje.toLocaleString("es-ES")}%)</span><strong>${formatearEuros(iva)}</strong></div>
        <div class="total"><span>Total</span><span>${formatearEuros(total)}</span></div>
    </div>

    ${observaciones ? `<div class="nota"><strong>Observaciones:</strong><br>${escaparHTML(observaciones)}</div>` : ""}

    <div class="nota">
        ${factura && factura.pdf_url
            ? "Esta factura corresponde al registro de autofacturación almacenado en RODAX."
            : "Esta es una previsualización imprimible generada con los datos actualmente disponibles. La factura definitiva debe quedar registrada en autofacturas por el proceso de backend de RODAX."
        }
    </div>

    <div class="acciones">
        <button class="primario" onclick="window.print()">Imprimir / Guardar PDF</button>
        <button class="secundario" onclick="window.close()">Cerrar</button>
    </div>
</div>
</body>
</html>`;

        const ventana = window.open("", "_blank", "width=1000,height=900");
        if (!ventana) {
            alert("El navegador ha bloqueado la ventana de la factura. Permite ventanas emergentes para este sitio.");
            return;
        }

        ventana.document.open();
        ventana.document.write(html);
        ventana.document.close();
        ventana.focus();
    }

    function crearBotonFactura(pago) {
        const factura = obtenerAutofacturaParaPago(pago);
        const texto = factura ? "Factura" : "Previsualizar factura";
        return `
            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                onclick="window.RODAX_facturacion_abrirFactura('${escaparHTML(pago.__key)}')"
            >
                <i data-lucide="file-text" class="h-4 w-4"></i>
                ${texto}
            </button>
        `;
    }

    function renderPagoCard(pago, modo) {
        const mudanza = pago.__mudanza || {};
        const procesado = modo === "procesados";
        const importe = obtenerImportePago(pago);
        const factura = obtenerAutofacturaParaPago(pago);
        const estado = procesado
    ? "Liquidación efectuada"
    : "Liquidación prevista";
        const reserva = escaparHTML(pago.numero_reserva || mudanza.numero_reserva || "—");
        const descripcion = escaparHTML(
            mudanza.tipo_servicio || (String(mudanza.tipo_servicio || "").toLowerCase().includes("total") ? "Mudanza Total" : "Mudanza")
        );

        const fecha = procesado
            ? formatearFechaHora(obtenerFechaPago(pago))
            : formatearFecha(obtenerFechaProgramada(pago));

        const estadoClase = procesado
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700";

        return `
            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-black tracking-wide text-blue-700">${reserva}</span>
                            <span class="rounded-full border px-3 py-1 text-[11px] font-bold ${estadoClase}">${estado}</span>
                            ${factura ? '<span class="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700">Autofactura disponible</span>' : ''}
                        </div>
                        <h3 class="mt-3 text-base font-black text-slate-800">${descripcion}</h3>
                        <p class="mt-1 text-sm text-slate-500">${escaparHTML(mudanza.origen || "Origen no disponible")} → ${escaparHTML(mudanza.destino || "Destino no disponible")}</p>
                    </div>
                    <div class="lg:text-right">
                        <div class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Importe transportista</div>
                        <div class="mt-1 text-2xl font-black text-blue-700">${formatearEuros(importe)}</div>
                    </div>
                </div>

                <div class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div class="rounded-xl bg-slate-50 p-4">
                        <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">
    ${procesado ? "Liquidado el" : "Liquidación prevista"}
</div>
                        <div class="mt-1 text-sm font-bold text-slate-700">${fecha}</div>
                    </div>
                    <div class="rounded-xl bg-slate-50 p-4">
                        <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Servicio</div>
                        <div class="mt-1 text-sm font-bold text-slate-700">${formatearFecha(mudanza.fecha || pago.fecha_programada)}</div>
                    </div>
                    <div class="rounded-xl bg-slate-50 p-4">
                        <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Referencia</div>
                        <div class="mt-1 truncate text-sm font-bold text-slate-700">${escaparHTML(pago.referencia_transferencia || "Pendiente de liquidación")}</div>
                    </div>
                </div>

                <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div class="text-xs text-slate-500">
                        ${procesado
                            ? (factura ? `Factura ${escaparHTML(factura.numero_factura || "—")}` : "Factura definitiva todavía no registrada")
                            : "Liquidación prevista en un máximo de 48 horas después del servicio, según el estado de pago."
                        }
                    </div>
                    <div>
    ${
        procesado
            ? crearBotonFactura(pago)
            : ""
    }
</div>
                </div>
            </article>
        `;
    }

    function renderLista(pagos, modo) {
        if (!pagos.length) {
            return `
                <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                        <i data-lucide="inbox" class="h-6 w-6 text-slate-400"></i>
                    </div>
                    <div class="mt-3 font-bold text-slate-700">
                        ${modo === "procesados" ? "Todavía no hay liquidaciones efectuadas." : "No hay liquidaciones previstas actualmente."}
                    </div>
                    <div class="mt-1 text-sm text-slate-400">
                        Los movimientos aparecerán aquí automáticamente cuando RODAX actualice la liquidación.
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-4">
                ${pagos.map(function (pago) {
                    return renderPagoCard(pago, modo);
                }).join("")}
            </div>
        `;
    }

    function resumenImportes(pagos) {
        return pagos.reduce(function (total, pago) {
            return total + obtenerImportePago(pago);
        }, 0);
    }

    async function cargarDatos(supabase, transportistaId) {
        const pagosResult = await supabase
            .from("pagos_transportistas")
            .select("*")
            .eq("transportista_id", transportistaId)
            .order("created_at", { ascending: false });

        if (pagosResult.error) throw pagosResult.error;

        const pagos = Array.isArray(pagosResult.data) ? pagosResult.data : [];

        const mudanzaIds = [...new Set(
            pagos
                .map(function (pago) { return pago.mudanza_id; })
                .filter(function (id) { return id !== null && id !== undefined; })
                .map(String)
        )];

        let mudanzas = [];

        if (mudanzaIds.length) {
            const mudanzasResult = await supabase
                .from("mudanzas")
                .select("*")
                .in("id", mudanzaIds.map(Number));

            if (mudanzasResult.error) throw mudanzasResult.error;
            mudanzas = Array.isArray(mudanzasResult.data) ? mudanzasResult.data : [];
        }

        const autofacturasResult = await supabase
            .from("autofacturas")
            .select("*")
            .eq("transportista_id", transportistaId)
            .order("fecha_factura", { ascending: false });

        if (autofacturasResult.error) throw autofacturasResult.error;

        const autofacturas = Array.isArray(autofacturasResult.data)
            ? autofacturasResult.data
            : [];

        const transportistaResult = await supabase
            .from("transportistas")
            .select("*")
            .eq("id", transportistaId)
            .maybeSingle();

        if (transportistaResult.error) {
            console.warn("RODAX Facturación: no se pudo cargar el perfil del transportista.", transportistaResult.error);
        }

        CACHE.mudanzas = new Map(mudanzas.map(function (mudanza) {
            return [String(mudanza.id), mudanza];
        }));

        CACHE.autofacturas = new Map(autofacturas.map(function (factura) {
            return [String(factura.id), factura];
        }));

        CACHE.transportista = transportistaResult.data || null;

        CACHE.pagos = pagos.map(function (pago, index) {
            const key = String(pago.id || `${pago.numero_reserva || "pago"}-${index}`);
            return Object.assign({}, pago, {
                __key: key,
                __mudanza: pago.mudanza_id != null
                    ? CACHE.mudanzas.get(String(pago.mudanza_id)) || null
                    : null
            });
        });

        return CACHE.pagos;
    }

    function renderFacturacion(contenedor) {

    const pagosProgramados = CACHE.pagos
        .filter(function (pago) {
            return !esProcesado(pago);
        })
        .sort(function (a, b) {

            const fechaA = new Date(
                obtenerFechaProgramada(a) || 0
            ).getTime();

            const fechaB = new Date(
                obtenerFechaProgramada(b) || 0
            ).getTime();

            return fechaB - fechaA;
        });

    const pagosProcesados = CACHE.pagos
        .filter(function (pago) {
            return esProcesado(pago);
        })
        .sort(function (a, b) {

            const fechaA = new Date(
                obtenerFechaPago(a) || 0
            ).getTime();

            const fechaB = new Date(
                obtenerFechaPago(b) || 0
            ).getTime();

            return fechaB - fechaA;
        });

    const totalProgramado = resumenImportes(
        pagosProgramados
    );

    const totalProcesado = resumenImportes(
        pagosProcesados
    );

        contenedor.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <div class="text-xs font-black uppercase tracking-wider text-amber-700">Liquidaciones previstas</div>
                                <div class="mt-2 text-3xl font-black text-slate-900">${formatearEuros(totalProgramado)}</div>
                                <div class="mt-1 text-sm text-slate-600">${pagosProgramados.length} servicio(s) pendiente(s) de liquidación</div>
                            </div>
                            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                                <i data-lucide="clock-3" class="h-5 w-5 text-amber-600"></i>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <div class="text-xs font-black uppercase tracking-wider text-emerald-700">Liquidaciones efectuadas</div>
                                <div class="mt-2 text-3xl font-black text-slate-900">${formatearEuros(totalProcesado)}</div>
                                <div class="mt-1 text-sm text-slate-600">${pagosProcesados.length} servicio(s) ya liquidado(s)</div>
                            </div>
                            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                                <i data-lucide="circle-check" class="h-5 w-5 text-emerald-600"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                        <div>
                            <h2 class="text-lg font-black text-slate-800">Pagos y autofacturas</h2>
                            <p class="mt-1 text-sm text-slate-500">Consulta tus liquidaciones y abre la factura correspondiente a cada servicio.</p>
                        </div>
                        <div class="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            ${CACHE.autofacturas.size} autofactura(s) registrada(s)
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                        <button type="button" id="facturacion-tab-programados" class="rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm">Liquidaciones previstas</button>
                        <button type="button" id="facturacion-tab-procesados" class="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200">Liquidaciones efectuadas</button>
                    </div>

                    <div class="p-5">
                        <section id="facturacion-panel-programados">
                            ${renderLista(pagosProgramados, "programados")}
                        </section>
                        <section id="facturacion-panel-procesados" class="hidden">
                            ${renderLista(pagosProcesados, "procesados")}
                        </section>
                    </div>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="flex items-start gap-3">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                            <i data-lucide="info" class="h-5 w-5 text-blue-600"></i>
                        </div>
                        <div>
                            <div class="font-black text-slate-700">Autofacturación RODAX</div>
                            <p class="mt-1 text-sm leading-6 text-slate-500">
                                RODAX puede mostrar la autofactura asociada a cada servicio. La creación definitiva y numeración de las facturas debe realizarse en el proceso de backend que tenga los permisos correspondientes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const btnProgramados = document.getElementById("facturacion-tab-programados");
        const btnProcesados = document.getElementById("facturacion-tab-procesados");
        const panelProgramados = document.getElementById("facturacion-panel-programados");
        const panelProcesados = document.getElementById("facturacion-panel-procesados");

        function activarProgramados() {
            panelProgramados.classList.remove("hidden");
            panelProcesados.classList.add("hidden");
            btnProgramados.className = "rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm";
            btnProcesados.className = "rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200";
        }

        function activarProcesados() {
            panelProgramados.classList.add("hidden");
            panelProcesados.classList.remove("hidden");
            btnProgramados.className = "rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200";
            btnProcesados.className = "rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm";
        }

        btnProgramados.addEventListener("click", activarProgramados);
        btnProcesados.addEventListener("click", activarProcesados);

        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    }

    async function cargarFacturacion() {
        const contenedor = document.getElementById("facturacion-contenido");
        if (!contenedor) return;

        contenedor.innerHTML = `
            <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                    <i data-lucide="loader-circle" class="h-6 w-6 animate-spin text-blue-600"></i>
                </div>
                <div class="mt-3 font-bold text-slate-700">Cargando facturación...</div>
            </div>
        `;

        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }

        try {
            const supabase = obtenerSupabase();
            if (!supabase) {
                throw new Error("No se encontró el cliente de Supabase.");
            }

            const transportistaId = obtenerTransportistaId();
            if (!transportistaId) {
                throw new Error("No se ha podido identificar al transportista.");
            }

            await cargarDatos(supabase, transportistaId);
            renderFacturacion(contenedor);

        } catch (error) {
            console.error("RODAX Facturación:", error);

            contenedor.innerHTML = `
                <div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                    <div class="flex items-start gap-3">
                        <i data-lucide="circle-alert" class="mt-0.5 h-5 w-5 shrink-0"></i>
                        <div>
                            <div class="font-black">No se pudo cargar Facturación.</div>
                            <div class="mt-2 text-sm">${escaparHTML(error.message || "Error desconocido")}</div>
                        </div>
                    </div>
                </div>
            `;

            if (window.lucide && typeof window.lucide.createIcons === "function") {
                window.lucide.createIcons();
            }
        }
    }

    window.RODAX_facturacion_abrirFactura = abrirFactura;
    window.cargarFacturacion = cargarFacturacion;

})(window);
