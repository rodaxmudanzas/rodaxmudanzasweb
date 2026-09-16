/* ============================================================
   RODAX — ESTADÍSTICAS BÁSICAS DEL VEHÍCULO
   ============================================================ */

(function () {
    "use strict";

    const COMPLETADOS = [
        "completada",
        "finalizada",
        "mudanza finalizada"
    ];

    function normalizarEstado(valor) {
        return String(valor || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function esServicioCompletado(mudanza) {
        const estado = normalizarEstado(mudanza?.estado);
        return COMPLETADOS.some(valor => estado === valor);
    }

    function esServicioCancelado(mudanza) {
        return normalizarEstado(mudanza?.estado).includes("cancel");
    }

    function obtenerVehiculoIdDesdeModal(modal) {
        if (!modal) {
            return null;
        }

        const botonEditar = modal.querySelector(
            'button[onclick*="editarVehiculo("]'
        );

        if (!botonEditar) {
            return null;
        }

        const onclick = botonEditar.getAttribute("onclick") || "";
        const coincidencia = onclick.match(/editarVehiculo\(['\"]([^'\"]+)['\"]\)/);

        return coincidencia?.[1] || null;
    }

    function formatearMes(fecha) {
        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            return "Sin fecha";
        }

        return date.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric"
        });
    }

    function obtenerClaveMes(fecha) {
        const date = new Date(fecha);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    function crearUltimosSeisMeses() {
        const resultado = [];
        const ahora = new Date();

        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(
                ahora.getFullYear(),
                ahora.getMonth() - i,
                1
            );

            resultado.push({
                clave: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`,
                etiqueta: formatearMes(fecha),
                cantidad: 0
            });
        }

        return resultado;
    }

    function formatearEuros(valor) {
        const numero = Number(valor) || 0;

        return numero.toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function obtenerIngresoTransportista(mudanza) {
        try {
            if (
                window.Transportista &&
                typeof window.Transportista.getPrecioTransportista === "function"
            ) {
                const valor = Number(
                    window.Transportista.getPrecioTransportista(mudanza)
                );

                if (Number.isFinite(valor)) {
                    return valor;
                }
            }
        } catch (error) {
            console.warn(
                "RODAX Estadísticas: no se pudo calcular el ingreso del transportista.",
                error
            );
        }

        const candidatos = [
            mudanza?.importe_total,
            mudanza?.preciototal,
            mudanza?.precio_total
        ];

        for (const candidato of candidatos) {
            const numero = Number(
                String(candidato ?? "")
                    .replace("€", "")
                    .replace(/\./g, "")
                    .replace(",", ".")
            );

            if (Number.isFinite(numero)) {
                return numero * 0.60;
            }
        }

        return 0;
    }

    async function cargarEstadisticasVehiculo(modal, vehiculoId) {
        const contenido = modal?.querySelector(
            '[data-gestion-contenido="estadisticas"]'
        );

        if (!contenido) {
            return;
        }

        contenido.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-bold text-slate-900">
                        Estadísticas del vehículo
                    </h3>
                    <p class="text-sm text-slate-500 mt-1">
                        Resumen básico de los servicios asociados a este vehículo.
                    </p>
                </div>

                <div class="rounded-xl border border-slate-200 bg-white p-8 text-center">
                    <i data-lucide="loader-circle"
                       class="w-8 h-8 mx-auto text-slate-400 animate-spin"></i>
                    <p class="mt-3 text-sm text-slate-500">
                        Cargando estadísticas...
                    </p>
                </div>
            </div>
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

        const cliente = window.dbClient;

        if (!cliente) {
            renderizarErrorEstadisticas(contenido, "No se encontró la conexión con Supabase.");
            return;
        }

        if (!vehiculoId) {
            renderizarErrorEstadisticas(contenido, "No se ha podido identificar el vehículo.");
            return;
        }

        const { data: mudanzas, error } = await cliente
            .from("mudanzas")
            .select("id, estado, fecha, fecha_finalizacion, importe_total, preciototal")
            .eq("vehiculo_id", vehiculoId)
            .order("fecha", { ascending: false });

        if (error) {
            console.error(
                "RODAX Estadísticas: error cargando servicios del vehículo:",
                error
            );

            renderizarErrorEstadisticas(
                contenido,
                "No se han podido cargar las estadísticas del vehículo."
            );
            return;
        }

        const servicios = mudanzas || [];
        const completados = servicios.filter(esServicioCompletado);
        const cancelados = servicios.filter(esServicioCancelado);

        const meses = crearUltimosSeisMeses();
        const mapaMeses = new Map(
            meses.map(mes => [mes.clave, mes])
        );

        completados.forEach(mudanza => {
            const fecha =
                mudanza.fecha_finalizacion ||
                mudanza.fecha;

            const clave = obtenerClaveMes(fecha);
            const mes = mapaMeses.get(clave);

            if (mes) {
                mes.cantidad += 1;
            }
        });

        const ingresos = completados.reduce(
            (total, mudanza) =>
                total + obtenerIngresoTransportista(mudanza),
            0
        );

        contenido.innerHTML = `
            <div class="space-y-6">

                <div>
                    <h3 class="text-lg font-bold text-slate-900">
                        Estadísticas del vehículo
                    </h3>
                    <p class="text-sm text-slate-500 mt-1">
                        Resumen básico de los servicios asociados a este vehículo.
                    </p>
                </div>

                <!-- SERVICIOS REALIZADOS POR MES -->
                <div class="rounded-xl border border-slate-200 bg-white p-5">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <i data-lucide="calendar-days" class="w-5 h-5 text-blue-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-slate-900">
                                Servicios realizados por mes
                            </h4>
                            <p class="text-sm text-slate-500">
                                Servicios completados durante los últimos 6 meses.
                            </p>
                        </div>
                    </div>

                    <div class="divide-y divide-slate-100">
                        ${meses.map(mes => `
                            <div class="flex items-center justify-between py-3">
                                <span class="text-sm text-slate-600 capitalize">
                                    ${mes.etiqueta}
                                </span>
                                <span class="inline-flex min-w-8 justify-center px-2.5 py-1 rounded-full
                                             bg-blue-50 text-blue-700 text-sm font-bold">
                                    ${mes.cantidad}
                                </span>
                            </div>
                        `).join("")}
                    </div>
                </div>

                <!-- CANCELADOS + INGRESOS -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div class="rounded-xl border border-slate-200 bg-white p-5">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <i data-lucide="circle-x" class="w-5 h-5 text-red-600"></i>
                            </div>
                            <div>
                                <p class="text-sm text-slate-500">
                                    Servicios cancelados
                                </p>
                                <p class="mt-1 text-2xl font-bold text-slate-900">
                                    ${cancelados.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-xl border border-slate-200 bg-white p-5">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <i data-lucide="wallet" class="w-5 h-5 text-emerald-600"></i>
                            </div>
                            <div>
                                <p class="text-sm text-slate-500">
                                    Ingresos generados
                                </p>
                                <p class="mt-1 text-2xl font-bold text-slate-900">
                                    ${formatearEuros(ingresos)}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                ${
                    servicios.length === 0
                        ? `
                            <div class="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <div class="flex items-start gap-3">
                                    <i data-lucide="info" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                                    <p class="text-sm text-blue-800">
                                        Todavía no hay servicios vinculados a este vehículo.
                                        Las estadísticas aparecerán cuando una mudanza quede asociada a este vehículo.
                                    </p>
                                </div>
                            </div>
                          `
                        : ""
                }

            </div>
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }

    function renderizarErrorEstadisticas(contenido, mensaje) {
        contenido.innerHTML = `
            <div class="rounded-xl border border-red-100 bg-red-50 p-5">
                <div class="flex items-start gap-3">
                    <i data-lucide="triangle-alert" class="w-5 h-5 text-red-600 mt-0.5"></i>
                    <p class="text-sm text-red-800">
                        ${mensaje}
                    </p>
                </div>
            </div>
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }

    function activarEstadisticasVehiculo() {
        document.addEventListener("click", async function (evento) {
            const boton = evento.target.closest(
                '[data-gestion-tab="estadisticas"]'
            );

            if (!boton) {
                return;
            }

            const modal = boton.closest("#modal-gestionar-vehiculo");

            if (!modal) {
                return;
            }

            const vehiculoId = obtenerVehiculoIdDesdeModal(modal);

            await cargarEstadisticasVehiculo(
                modal,
                vehiculoId
            );
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            activarEstadisticasVehiculo,
            { once: true }
        );
    } else {
        activarEstadisticasVehiculo();
    }

    window.cargarEstadisticasVehiculo = cargarEstadisticasVehiculo;

})();
