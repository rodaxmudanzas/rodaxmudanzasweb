(function () {

    async function cargarMisVehiculos() {

        const contenedor = document.getElementById(
            "mis-vehiculos-contenido"
        );

        if (!contenedor) {
            return;
        }

                const transportistaId =
            window.Transportista?.currentUserId ||
            window.currentUserId ||
            null;

        if (!transportistaId) {
            console.error(
                "RODAX Vehículos: no se ha podido obtener el transportista_id"
            );
            return;
        }

        const cliente =
            window.dbClient;

        if (!cliente) {
            console.error(
                "RODAX Vehículos: no se encontró dbClient"
            );
            return;
        }

        const { data: vehiculos, error } =
            await cliente
                .from("vehiculos")
                .select("*")
                .eq("transportista_id", transportistaId)
                .order("creado_en", {
                    ascending: false
                });

        if (error) {
            console.error(
                "RODAX Vehículos: error cargando vehículos:",
                error
            );
            return;
        }

        console.log(
            "RODAX Vehículos — vehículos cargados:",
            vehiculos
        );

        contenedor.innerHTML = `
            <div class="space-y-6">

                <!-- CABECERA -->
                <div class="flex items-center justify-between">

                    <div class="flex items-center gap-4">

                        <div class="w-14 h-14 rounded-2xl bg-blue-600
                                    flex items-center justify-center text-white">
                            <i data-lucide="car-front" class="w-7 h-7"></i>
                        </div>

                        <div>
                            <h1 class="text-3xl font-bold text-slate-900">
                                Mis vehículos
                            </h1>

                            <p class="text-slate-500">
                                Gestiona aquí todos tus vehículos, documentación y seguros.
                            </p>
                        </div>

                    </div>

                    <button
    type="button"
    onclick="abrirFormularioVehiculo()"
    class="flex items-center gap-2 px-6 py-3 rounded-xl
           bg-blue-600 hover:bg-blue-700 text-white
           font-semibold shadow-sm transition"
>

                        <i data-lucide="plus" class="w-5 h-5"></i>

                        Añadir vehículo

                    </button>

                </div>


                <!-- RESUMEN -->
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                    <div class="bg-white rounded-2xl border border-slate-200 p-5">
                        <div class="flex items-center gap-4">

                            <div class="w-12 h-12 rounded-full bg-blue-50
                                        flex items-center justify-center">
                                <i data-lucide="truck"
                                   class="w-6 h-6 text-blue-600"></i>
                            </div>

                            <div>
                                <div class="text-sm text-slate-500">
                                    Vehículos registrados
                                </div>

                               <div class="text-2xl font-bold text-slate-900">
    ${vehiculos.length}
</div>

<div class="text-xs text-slate-500">
    ${vehiculos.length === 0
        ? "Sin vehículos cargados"
        : vehiculos.length === 1
            ? "Vehículo registrado"
            : "Vehículos registrados"}
</div>
                            </div>

                        </div>
                    </div>


                    <div class="bg-white rounded-2xl border border-slate-200 p-5">
                        <div class="flex items-center gap-4">

                            <div class="w-12 h-12 rounded-full bg-blue-50
                                        flex items-center justify-center">
                                <i data-lucide="file-text"
                                   class="w-6 h-6 text-blue-600"></i>
                            </div>

                            <div>
                                <div class="text-sm text-slate-500">
                                    Documentación al día
                                </div>

                                <div class="text-2xl font-bold text-slate-900">
                                    —
                                </div>

                                <div class="text-xs text-slate-500">
                                    Pendiente de registrar vehículos
                                </div>
                            </div>

                        </div>
                    </div>


                    <div class="bg-white rounded-2xl border border-slate-200 p-5">
                        <div class="flex items-center gap-4">

                            <div class="w-12 h-12 rounded-full bg-emerald-50
                                        flex items-center justify-center">
                                <i data-lucide="shield-check"
                                   class="w-6 h-6 text-emerald-600"></i>
                            </div>

                            <div>
                                <div class="text-sm text-slate-500">
                                    Seguros activos
                                </div>

                                <div class="text-2xl font-bold text-slate-900">
                                    —
                                </div>

                                <div class="text-xs text-slate-500">
                                    Pendiente de registrar vehículos
                                </div>
                            </div>

                        </div>
                    </div>


                    <div class="bg-white rounded-2xl border border-slate-200 p-5">
                        <div class="flex items-center gap-4">

                            <div class="w-12 h-12 rounded-full bg-blue-50
                                        flex items-center justify-center">
                                <i data-lucide="calendar-days"
                                   class="w-6 h-6 text-blue-600"></i>
                            </div>

                            <div>
                                <div class="text-sm text-slate-500">
                                    Próxima renovación
                                </div>

                                <div class="text-2xl font-bold text-slate-900">
                                    —
                                </div>

                                <div class="text-xs text-slate-500">
                                    Sin datos todavía
                                </div>
                            </div>

                        </div>
                    </div>

                </div>


                <!-- PESTAÑAS -->
                <div class="bg-white rounded-2xl border border-slate-200
                            flex items-center overflow-hidden">

                    <button
                        type="button"
                        class="flex-1 flex items-center justify-center gap-2
                               px-5 py-4 bg-blue-600 text-white font-semibold">

                        <i data-lucide="truck" class="w-5 h-5"></i>
                        Mis vehículos

                    </button>

                    <button
    type="button"
    onclick="abrirPestanaDocumentacionVehiculos()"
    class="flex-1 flex items-center justify-center gap-2
           px-5 py-4 text-slate-600 hover:bg-slate-50 transition">

    <i data-lucide="file-text" class="w-5 h-5"></i>
    Documentación

</button>

                    <button
                        type="button"
                        class="flex-1 flex items-center justify-center gap-2
                               px-5 py-4 text-slate-600 hover:bg-slate-50 transition">

                        <i data-lucide="shield-check" class="w-5 h-5"></i>
                        Seguros

                    </button>

                    <button
                        type="button"
                        class="flex-1 flex items-center justify-center gap-2
                               px-5 py-4 text-slate-600 hover:bg-slate-50 transition">

                        <i data-lucide="wrench" class="w-5 h-5"></i>
                        Revisiones

                    </button>

                    <button
                        type="button"
                        class="flex-1 flex items-center justify-center gap-2
                               px-5 py-4 text-slate-600 hover:bg-slate-50 transition">

                        <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                        Estadísticas

                    </button>

                </div>


                <!-- CONTENIDO -->
                <div>

                    <div class="flex items-end justify-between mb-5">

                        <div>
                            <h2 class="text-2xl font-bold text-slate-900">
                                Tus vehículos
                            </h2>

                            <p class="text-slate-500">
                                Aquí puedes ver, editar y gestionar todos los vehículos de tu flota.
                            </p>
                        </div>

                        <div class="flex gap-3">

                            <div class="relative">
                                <i data-lucide="search"
                                   class="absolute left-4 top-1/2 -translate-y-1/2
                                          w-5 h-5 text-slate-400"></i>

                                <input
                                    type="text"
                                    placeholder="Buscar vehículo..."
                                    class="w-64 pl-11 pr-4 py-3 bg-white
                                           border border-slate-200 rounded-xl
                                           outline-none focus:ring-2
                                           focus:ring-blue-500">
                            </div>

                            <select
                                class="px-4 py-3 bg-white border border-slate-200
                                       rounded-xl text-slate-700 outline-none">

                                <option>Todos los estados</option>

                            </select>

                        </div>

                    </div>


                                        <!-- VEHÍCULOS -->
                    ${
                        vehiculos.length === 0
                            ? `
                                <div class="bg-white border border-slate-200 rounded-2xl
                                            p-12 text-center">

                                    <div class="w-20 h-20 mx-auto mb-5 rounded-full
                                                bg-blue-50 flex items-center justify-center">

                                        <i data-lucide="truck"
                                           class="w-10 h-10 text-blue-600"></i>

                                    </div>

                                    <h3 class="text-xl font-bold text-slate-900 mb-2">
                                        Todavía no tienes vehículos registrados
                                    </h3>

                                    <p class="text-slate-500 max-w-md mx-auto mb-6">
                                        Añade tu primer vehículo para gestionar su
                                        documentación, seguros y revisiones desde aquí.
                                    </p>

                                    <button
                                        type="button"
                                        onclick="abrirFormularioVehiculo()"
                                        class="inline-flex items-center gap-2 px-6 py-3
                                               rounded-xl bg-blue-600 hover:bg-blue-700
                                               text-white font-semibold transition">

                                        <i data-lucide="plus" class="w-5 h-5"></i>

                                        Añadir vehículo

                                    </button>

                                </div>
                            `
                            : `
                                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                                    ${vehiculos.map(vehiculo => `
                                        <div class="bg-white border border-slate-200
                                                    rounded-2xl p-6 shadow-sm">

                                            <div class="flex items-start justify-between mb-5">

                                                <div class="w-12 h-12 rounded-xl bg-blue-50
                                                            flex items-center justify-center">

                                                    <i data-lucide="truck"
                                                       class="w-6 h-6 text-blue-600"></i>

                                                </div>

                                                <span class="px-3 py-1 rounded-full
                                                             text-xs font-semibold
                                                             bg-emerald-50 text-emerald-700">
                                                    ${vehiculo.estado || "Activo"}
                                                </span>

                                            </div>

                                            <h3 class="text-lg font-bold text-slate-900">
                                                ${vehiculo.marca || "Sin marca"}
                                                ${vehiculo.modelo || ""}
                                            </h3>

                                            <p class="text-sm text-slate-500 mt-1">
    ${vehiculo.tipo_vehiculo || "Tipo no especificado"}
</p>

<p class="text-sm text-slate-500 mt-1">
    Año: ${vehiculo.anio || "No indicado"}
</p>

                                            <div class="mt-5 pt-5 border-t border-slate-100">

                                                <div class="text-xs text-slate-500 mb-1">
                                                    Matrícula
                                                </div>

                                                <div class="font-bold text-slate-900">
                                                    ${vehiculo.matricula}
                                                </div>

                                            </div>

                                            <div class="mt-4 flex gap-3">

                                                <button
    type="button"
    onclick="abrirGestionVehiculo('${vehiculo.id}')"
    class="flex-1 px-4 py-2.5 rounded-xl
           border border-slate-200
           text-slate-700 font-medium
           hover:bg-slate-50 transition">
    Gestionar
</button>

                                            </div>

                                        </div>
                                    `).join("")}

                                </div>
                            `
                    }

                </div>

            </div>
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }

    window.cargarMisVehiculos = cargarMisVehiculos;

    function abrirPestanaDocumentacionVehiculos() {

    const contenedor =
        document.getElementById("mis-vehiculos-contenido");

    if (!contenedor) {
        console.error(
            "RODAX Vehículos: no se encontró el contenedor principal."
        );
        return;
    }

    const cliente = window.dbClient;

    if (!cliente) {
        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );
        return;
    }

    const transportistaId =
        window.Transportista?.currentUserId ||
        window.currentUserId ||
        null;

    if (!transportistaId) {
        console.error(
            "RODAX Vehículos: no se ha podido obtener el transportista_id."
        );
        return;
    }

    contenedor.innerHTML = `
        <div class="space-y-6">

            <!-- CABECERA -->
            <div class="flex items-center justify-between">

                <div>
                    <h2 class="text-2xl font-bold text-slate-900">
                        Documentación
                    </h2>

                    <p class="text-slate-500 mt-1">
                        Gestiona la documentación de todos tus vehículos.
                    </p>
                </div>

                <button
                    type="button"
                    onclick="cargarMisVehiculos()"
                    class="px-5 py-3 rounded-xl border
                           border-slate-200 text-slate-700
                           font-semibold hover:bg-slate-50 transition">

                    Volver a mis vehículos

                </button>

            </div>

            <!-- INFORMACIÓN -->
            <div class="bg-blue-50 border border-blue-100
                        rounded-2xl p-5">

                <div class="flex items-start gap-4">

                    <div class="w-11 h-11 rounded-xl bg-white
                                flex items-center justify-center
                                shrink-0">

                        <i data-lucide="info"
                           class="w-5 h-5 text-blue-600"></i>

                    </div>

                    <div>

                        <h3 class="font-semibold text-blue-900">
                            Documentación de tu flota
                        </h3>

                        <p class="text-sm text-blue-800 mt-1">
                            Aquí podrás consultar y gestionar la documentación
                            asociada a cada uno de tus vehículos.
                        </p>

                    </div>

                </div>

            </div>

            <!-- DOCUMENTACIÓN -->
            <div
                id="vehiculos-documentacion-lista"
                class="space-y-5">

                <div class="bg-white border border-slate-200
                            rounded-2xl p-8 text-center">

                    <div class="w-12 h-12 mx-auto mb-4 rounded-xl
                                bg-slate-100 flex items-center justify-center">

                        <i data-lucide="loader-circle"
                           class="w-6 h-6 text-slate-500 animate-spin"></i>

                    </div>

                    <p class="text-slate-500">
                        Cargando vehículos...
                    </p>

                </div>

            </div>

        </div>
    `;

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    cargarDocumentacionVehiculos(transportistaId);
}

async function cargarDocumentacionVehiculos(transportistaId) {

    const contenedor =
        document.getElementById("vehiculos-documentacion-lista");

    if (!contenedor) {
        console.error(
            "RODAX Vehículos: no se encontró el contenedor de documentación."
        );
        return;
    }

    const cliente = window.dbClient;

    if (!cliente) {
        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );
        return;
    }

    /*
     * ============================================================
     * 1. CARGAR VEHÍCULOS DEL TRANSPORTISTA
     * ============================================================
     */

    const { data: vehiculos, error: errorVehiculos } =
        await cliente
            .from("vehiculos")
            .select("*")
            .eq("transportista_id", transportistaId)
            .order("creado_en", {
                ascending: false
            });

    if (errorVehiculos) {

        console.error(
            "RODAX Vehículos: error cargando vehículos:",
            errorVehiculos
        );

        contenedor.innerHTML = `
            <div class="bg-white border border-red-200
                        rounded-2xl p-8">

                <div class="flex items-start gap-4">

                    <div class="w-11 h-11 rounded-xl bg-red-50
                                flex items-center justify-center">

                        <i data-lucide="alert-circle"
                           class="w-6 h-6 text-red-600"></i>

                    </div>

                    <div>

                        <h3 class="font-semibold text-red-800">
                            No se han podido cargar los vehículos
                        </h3>

                        <p class="text-sm text-red-700 mt-1">
                            ${errorVehiculos.message || "Error desconocido"}
                        </p>

                    </div>

                </div>

            </div>
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

        return;
}

window._rodaxVehiculosDocumentacion = vehiculos || [];

if (!vehiculos || vehiculos.length === 0) {

        contenedor.innerHTML = `
        
            <div class="bg-white border border-slate-200
                        rounded-2xl p-10 text-center">

                <div class="w-16 h-16 mx-auto mb-5 rounded-full
                            bg-blue-50 flex items-center justify-center">

                    <i data-lucide="file-text"
                       class="w-8 h-8 text-blue-600"></i>

                </div>

                <h3 class="text-xl font-bold text-slate-900 mb-2">
                    No tienes vehículos registrados
                </h3>

                <p class="text-slate-500 max-w-md mx-auto mb-6">
                    Añade primero un vehículo para poder gestionar
                    posteriormente su documentación.
                </p>

                <button
                    type="button"
                    onclick="abrirFormularioVehiculo()"
                    class="inline-flex items-center gap-2 px-6 py-3
                           rounded-xl bg-blue-600 hover:bg-blue-700
                           text-white font-semibold transition">

                    <i data-lucide="plus" class="w-5 h-5"></i>

                    Añadir vehículo

                </button>

            </div>
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

        return;
    }


    /*
     * ============================================================
     * 3. CARGAR DOCUMENTACIÓN REAL
     * ============================================================
     */

    const idsVehiculos =
        vehiculos.map(vehiculo => vehiculo.id);

    const { data: documentos, error: errorDocumentos } =
        await cliente
            .from("vehiculos_documentacion")
            .select("*")
            .in("vehiculo_id", idsVehiculos)
            .order("creado_en", {
                ascending: false
            });


    if (errorDocumentos) {

        console.error(
            "RODAX Vehículos: error cargando documentación:",
            errorDocumentos
        );

        contenedor.innerHTML = `
            <div class="bg-white border border-red-200
                        rounded-2xl p-8">

                <div class="flex items-start gap-4">

                    <div class="w-11 h-11 rounded-xl bg-red-50
                                flex items-center justify-center">

                        <i data-lucide="alert-circle"
                           class="w-6 h-6 text-red-600"></i>

                    </div>

                    <div>

                        <h3 class="font-semibold text-red-800">
                            No se ha podido cargar la documentación
                        </h3>

                        <p class="text-sm text-red-700 mt-1">
                            ${errorDocumentos.message || "Error desconocido"}
                        </p>

                    </div>

                </div>

            </div>
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

        return;
    }


    console.log(
        "RODAX Vehículos — documentación cargada:",
        documentos
    );


    /*
     * ============================================================
     * 4. TIPOS DE DOCUMENTACIÓN
     * ============================================================
     */

    const tiposDocumentacion = [

        {
            tipo: "permiso_circulacion",
            nombre: "Permiso de circulación",
            icono: "file-text",
            color: "blue"
        },

        {
            tipo: "ficha_tecnica",
            nombre: "Ficha técnica",
            icono: "file-check",
            color: "blue"
        },

        {
            tipo: "itv",
            nombre: "ITV",
            icono: "clipboard-check",
            color: "blue"
        },

        {
            tipo: "seguro_vehiculo",
            nombre: "Seguro del vehículo",
            icono: "shield-check",
            color: "green"
        },

        {
            tipo: "seguro_mercancias",
            nombre: "Seguro de mercancías / transporte",
            icono: "shield",
            color: "green"
        }

    ];


    /*
     * ============================================================
     * 5. CALCULAR ESTADO SEGÚN FECHA DE CADUCIDAD
     * ============================================================
     */

    function obtenerEstadoDocumento(documento) {

        if (!documento) {
            return {
                texto: "Pendiente de registrar",
                clase: "text-slate-500",
                fondo: "bg-slate-100"
            };
        }

        if (!documento.fecha_caducidad) {
            return {
                texto: "Registrado",
                clase: "text-blue-700",
                fondo: "bg-blue-50"
            };
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const caducidad =
            new Date(documento.fecha_caducidad + "T00:00:00");

        const diferencia =
            Math.ceil(
                (caducidad - hoy) /
                (1000 * 60 * 60 * 24)
            );

        if (diferencia < 0) {

            return {
                texto: "Caducado",
                clase: "text-red-700",
                fondo: "bg-red-50"
            };
        }

        if (diferencia <= 30) {

            return {
                texto: `Caduca en ${diferencia} días`,
                clase: "text-amber-700",
                fondo: "bg-amber-50"
            };
        }

        return {
            texto: "Vigente",
            clase: "text-emerald-700",
            fondo: "bg-emerald-50"
        };
    }


    /*
     * ============================================================
     * 6. CREAR TARJETAS
     * ============================================================
     */

    contenedor.innerHTML = vehiculos.map(vehiculo => {

        const documentosVehiculo =
            (documentos || []).filter(
                documento =>
                    documento.vehiculo_id === vehiculo.id
            );


        return `
            <div class="bg-white border border-slate-200
                        rounded-2xl overflow-hidden shadow-sm
                        hover:shadow-md transition-shadow duration-200">

                <!-- CABECERA VEHÍCULO -->
                <div class="p-6 border-b border-slate-100">

                    <div class="flex items-start justify-between">

                        <div class="flex items-center gap-4">

                            <div class="w-12 h-12 rounded-xl bg-blue-50
                                        flex items-center justify-center">

                                <i data-lucide="truck"
                                   class="w-6 h-6 text-blue-600"></i>

                            </div>

                            <div>

                                <h3 class="text-lg font-bold text-slate-900">
                                    ${vehiculo.marca || "Sin marca"}
                                    ${vehiculo.modelo || ""}
                                </h3>

                                <p class="text-sm text-slate-500 mt-1">
                                    ${vehiculo.matricula || "Sin matrícula"}
                                    ·
                                    ${vehiculo.tipo_vehiculo || "Tipo no especificado"}
                                    ${vehiculo.anio
                                        ? ` · Año ${vehiculo.anio}`
                                        : ""}
                                </p>

                            </div>

                        </div>

                        <span
                            class="px-3 py-1 rounded-full text-xs
                                   font-semibold bg-emerald-50
                                   text-emerald-700">

                            ${vehiculo.estado || "Activo"}

                        </span>

                    </div>

                </div>


                <!-- DOCUMENTACIÓN -->
                <div class="p-6">

                    <h4 class="font-semibold text-slate-900 mb-4">
                        Documentación
                    </h4>

                    <div class="grid grid-cols-1 md:grid-cols-2
                                xl:grid-cols-3 gap-4">

                        ${tiposDocumentacion.map(tipoDocumento => {

                            const documento =
                                documentosVehiculo.find(
                                    doc =>
                                        doc.tipo_documento ===
                                        tipoDocumento.tipo
                                );

                            const estado =
                                obtenerEstadoDocumento(documento);

                            return `
    <div
        onclick="abrirFormularioDocumentacionVehiculo('${vehiculo.id}', '${tipoDocumento.tipo}')"
        class="border border-slate-200
               rounded-xl p-4
               bg-white shadow-sm
               hover:shadow-md
               hover:border-blue-300
               cursor-pointer
               transition-all duration-200">

                                    <div class="flex items-center gap-3">

                                        <div
                                            class="w-10 h-10 rounded-lg
                                                   ${
                                                       tipoDocumento.color === "green"
                                                           ? "bg-emerald-50"
                                                           : "bg-blue-50"
                                                   }
                                                   flex items-center justify-center">

                                            <i
                                                data-lucide="${tipoDocumento.icono}"
                                                class="w-5 h-5
                                                       ${
                                                           tipoDocumento.color === "green"
                                                               ? "text-emerald-600"
                                                               : "text-blue-600"
                                                       }">
                                            </i>

                                        </div>

                                        <div class="min-w-0">

                                            <div class="font-medium
                                                        text-slate-900">
                                                ${tipoDocumento.nombre}
                                            </div>

                                            <div class="text-xs mt-1
                                                        ${estado.clase}">

                                                ${estado.texto}

                                            </div>

                                        </div>

                                    </div>

                                    ${
                                        documento
                                            ? `
                                                <div
                                                    class="mt-3 pt-3
                                                           border-t
                                                           border-slate-100
                                                           text-xs
                                                           text-slate-500">

                                                    ${
                                                        documento.fecha_caducidad
                                                            ? `Caducidad:
                                                               ${documento.fecha_caducidad}`
                                                            : "Sin fecha de caducidad"
                                                    }

                                                </div>
                                            `
                                            : ""
                                    }

                                </div>
                            `;

                        }).join("")}


                        <!-- OTROS DOCUMENTOS -->

                        <div
                            class="border border-dashed
                                   border-slate-300 rounded-xl p-4
                                   bg-white hover:bg-slate-50
                                   transition">

                            <div class="flex items-center gap-3">

                                <div
                                    class="w-10 h-10 rounded-lg
                                           bg-slate-50
                                           flex items-center justify-center">

                                    <i data-lucide="plus"
                                       class="w-5 h-5 text-slate-500"></i>

                                </div>

                                <div>

                                    <div class="font-medium text-slate-700">
                                        Otros documentos
                                    </div>

                                    <div class="text-xs text-slate-500 mt-1">
                                        Podremos añadir documentos adicionales
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>
        `;

    }).join("");


    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

function abrirFormularioDocumentacionVehiculo(
    vehiculoId,
    tipoDocumento
) {

    const vehiculo =
        window._rodaxVehiculosDocumentacion?.find(
            v => v.id === vehiculoId
        );

    const nombresDocumentos = {
        permiso_circulacion: "Permiso de circulación",
        ficha_tecnica: "Ficha técnica",
        itv: "ITV",
        seguro_vehiculo: "Seguro del vehículo",
        seguro_mercancias: "Seguro de mercancías / transporte"
    };

    const nombreDocumento =
        nombresDocumentos[tipoDocumento] ||
        "Documento";

    const modal = document.createElement("div");

    modal.id = "modal-documentacion-vehiculo";

    modal.className =
        "fixed inset-0 z-[9999] flex items-center justify-center " +
        "bg-slate-900/50 backdrop-blur-sm p-4";

    modal.innerHTML = `

        <div
            class="w-full max-w-2xl bg-white rounded-2xl
                   shadow-2xl overflow-hidden">

            <!-- CABECERA -->

            <div
                class="px-6 py-5 border-b border-slate-200
                       flex items-center justify-between">

                <div class="flex items-center gap-4">

                    <div
                        class="w-11 h-11 rounded-xl bg-blue-50
                               flex items-center justify-center">

                        <i
                            data-lucide="file-text"
                            class="w-5 h-5 text-blue-600">
                        </i>

                    </div>

                    <div>

                        <h2
                            class="text-xl font-bold text-slate-900">

                            ${nombreDocumento}

                        </h2>

                        <p
                            class="text-sm text-slate-500 mt-1">

                            ${vehiculo
                                ? `${vehiculo.marca || "Sin marca"} ${vehiculo.modelo || ""} · ${vehiculo.matricula || "Sin matrícula"}`
                                : "Vehículo seleccionado"
                            }

                        </p>

                    </div>

                </div>

                <button
                    type="button"
                    onclick="cerrarFormularioDocumentacionVehiculo()"
                    class="w-9 h-9 rounded-lg
                           flex items-center justify-center
                           text-slate-400
                           hover:bg-slate-100
                           hover:text-slate-700
                           transition">

                    <i
                        data-lucide="x"
                        class="w-5 h-5">
                    </i>

                </button>

            </div>


            <!-- CONTENIDO -->

            <div class="p-6 space-y-5">

                <!-- INFORMACIÓN -->

                <div
                    class="bg-blue-50 border border-blue-100
                           rounded-xl p-4">

                    <div class="flex items-start gap-3">

                        <i
                            data-lucide="info"
                            class="w-5 h-5 text-blue-600 mt-0.5">
                        </i>

                        <div>

                            <p
                                class="text-sm font-medium
                                       text-blue-900">

                                Información del documento

                            </p>

                            <p
                                class="text-xs text-blue-800 mt-1">

                                Registra los datos del documento.
                                En el siguiente paso añadiremos
                                la subida del archivo.

                            </p>

                        </div>

                    </div>

                </div>


                <!-- NOMBRE -->

                <div>

                    <label
                        class="block text-sm font-semibold
                               text-slate-700 mb-2">

                        Nombre del documento

                    </label>

                    <input
                        id="documentacion-nombre"
                        type="text"
                        value="${nombreDocumento}"
                        class="w-full px-4 py-3 rounded-xl
                               border border-slate-200
                               focus:outline-none
                               focus:ring-2
                               focus:ring-blue-500
                               focus:border-blue-500">

                </div>


                <!-- REFERENCIA -->

                <div>

                    <label
                        class="block text-sm font-semibold
                               text-slate-700 mb-2">

                        Número / referencia

                    </label>

                    <input
                        id="documentacion-referencia"
                        type="text"
                        placeholder="Número de póliza, referencia, etc."
                        class="w-full px-4 py-3 rounded-xl
                               border border-slate-200
                               focus:outline-none
                               focus:ring-2
                               focus:ring-blue-500
                               focus:border-blue-500">

                </div>


                <!-- FECHAS -->

                <div
                    class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                        <label
                            class="block text-sm font-semibold
                                   text-slate-700 mb-2">

                            Fecha de emisión

                        </label>

                        <input
                            id="documentacion-fecha-emision"
                            type="date"
                            class="w-full px-4 py-3 rounded-xl
                                   border border-slate-200
                                   focus:outline-none
                                   focus:ring-2
                                   focus:ring-blue-500
                                   focus:border-blue-500">

                    </div>


                    <div>

                        <label
                            class="block text-sm font-semibold
                                   text-slate-700 mb-2">

                            Fecha de caducidad

                        </label>

                        <input
                            id="documentacion-fecha-caducidad"
                            type="date"
                            class="w-full px-4 py-3 rounded-xl
                                   border border-slate-200
                                   focus:outline-none
                                   focus:ring-2
                                   focus:ring-blue-500
                                   focus:border-blue-500">

                    </div>

                </div>


                <!-- OBSERVACIONES -->

                <div>

                    <label
                        class="block text-sm font-semibold
                               text-slate-700 mb-2">

                        Observaciones

                    </label>

                    <textarea
                        id="documentacion-observaciones"
                        rows="3"
                        placeholder="Información adicional..."
                        class="w-full px-4 py-3 rounded-xl
                               border border-slate-200
                               resize-none
                               focus:outline-none
                               focus:ring-2
                               focus:ring-blue-500
                               focus:border-blue-500"></textarea>

                </div>

            </div>


            <!-- PIE -->

            <div
                class="px-6 py-4 border-t border-slate-200
                       bg-slate-50 flex justify-end gap-3">

                <button
                    type="button"
                    onclick="cerrarFormularioDocumentacionVehiculo()"
                    class="px-5 py-2.5 rounded-xl
                           border border-slate-200
                           bg-white text-slate-700
                           font-semibold
                           hover:bg-slate-50
                           transition">

                    Cancelar

                </button>

                <button
                    type="button"
                    disabled
                    title="Se activará en el siguiente paso"
                    class="px-5 py-2.5 rounded-xl
                           bg-slate-300 text-white
                           font-semibold cursor-not-allowed">

                    Guardar documento

                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}


function cerrarFormularioDocumentacionVehiculo() {

    const modal =
        document.getElementById(
            "modal-documentacion-vehiculo"
        );

    if (modal) {
        modal.remove();
    }
}


window.abrirFormularioDocumentacionVehiculo =
    abrirFormularioDocumentacionVehiculo;

window.cerrarFormularioDocumentacionVehiculo =
    cerrarFormularioDocumentacionVehiculo;

    window.abrirPestanaDocumentacionVehiculos =
    abrirPestanaDocumentacionVehiculos;

window.cargarDocumentacionVehiculos =
    cargarDocumentacionVehiculos;

function abrirFormularioVehiculo() {

    const modal = document.createElement("div");

    modal.id = "modal-vehiculo";

    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4";

    modal.innerHTML = `
        <div class="w-full max-w-3xl max-h-[90vh] overflow-y-auto
                    bg-white rounded-2xl shadow-2xl">

            <div class="flex items-center justify-between
                        px-6 py-5 border-b border-slate-200">

                <div>
                    <h2 class="text-xl font-bold text-slate-900">
                        Añadir vehículo
                    </h2>

                    <p class="text-sm text-slate-500 mt-1">
                        Registra un nuevo vehículo de tu flota.
                    </p>
                </div>

                <button
                    type="button"
                    onclick="cerrarFormularioVehiculo()"
                    class="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    aria-label="Cerrar"
                >
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>

            </div>

            <div class="p-6">

                <div class="rounded-xl border border-blue-100
                            bg-blue-50 p-4 mb-6">

                    <p class="text-sm text-blue-800">
                        En este formulario registraremos los datos del
                        vehículo. La documentación, fotografías, seguros
                        y revisiones se incorporarán posteriormente.
                    </p>

                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Matrícula
                        </label>

                        <input
                            type="text"
                            id="vehiculo-matricula"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500"
                            placeholder="1234 ABC"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Marca
                        </label>

                        <input
                            type="text"
                            id="vehiculo-marca"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500"
                            placeholder="Marca del vehículo"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Modelo
                        </label>

                        <input
                            type="text"
                            id="vehiculo-modelo"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500"
                            placeholder="Modelo"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Tipo de vehículo
                        </label>

                        <select
                            id="vehiculo-tipo"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">
                                Seleccionar tipo
                            </option>

                            <option value="Furgoneta">
                                Furgoneta
                            </option>

                            <option value="Camión">
                                Camión
                            </option>

                            <option value="Camión con plataforma">
                                Camión con plataforma
                            </option>

                            <option value="Otro">
                                Otro
                            </option>
                        </select>
                    </div>

                </div>

            </div>

            <div class="flex justify-end gap-3
                        px-6 py-5 border-t border-slate-200">

                <button
                    type="button"
                    onclick="cerrarFormularioVehiculo()"
                    class="px-5 py-3 rounded-xl border
                           border-slate-300 text-slate-700
                           font-medium hover:bg-slate-50"
                >
                    Cancelar
                </button>

                <button
    type="button"
    onclick="guardarVehiculo()"
    class="px-5 py-3 rounded-xl bg-blue-600
           hover:bg-blue-700 text-white
           font-semibold"
>
    Guardar vehículo
</button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

async function guardarVehiculo() {

    const transportistaId =
    window.Transportista?.currentUserId ||
    window.currentUserId ||
    null;

    const matricula =
        document.getElementById("vehiculo-matricula")?.value.trim();

    const marca =
        document.getElementById("vehiculo-marca")?.value.trim();

    const modelo =
        document.getElementById("vehiculo-modelo")?.value.trim();

    const tipoVehiculo =
        document.getElementById("vehiculo-tipo")?.value;

    if (!transportistaId) {
        console.error(
            "RODAX Vehículos: no se ha podido obtener el transportista_id"
        );
        return;
    }

    if (!matricula) {
        alert("Introduce la matrícula del vehículo.");
        return;
    }

    if (!tipoVehiculo) {
        alert("Selecciona el tipo de vehículo.");
        return;
    }

    const datosVehiculo = {
        transportista_id: transportistaId,
        matricula: matricula,
        marca: marca || null,
        modelo: modelo || null,
        tipo_vehiculo: tipoVehiculo
    };

    console.log(
        "RODAX Vehículos — datos preparados:",
        datosVehiculo
    );

    const cliente = window.dbClient;

    if (!cliente) {
        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );
        return;
    }

    const { data, error } = await cliente
        .from("vehiculos")
        .insert([datosVehiculo])
        .select()
        .single();

    if (error) {
        console.error(
            "RODAX Vehículos: error guardando vehículo:",
            error
        );
        alert(
            "No se ha podido guardar el vehículo: " +
            error.message
        );
        return;
    }

        console.log(
        "RODAX Vehículos: vehículo guardado correctamente:",
        data
    );

    cerrarFormularioVehiculo();

    await cargarMisVehiculos();

}

async function abrirGestionVehiculo(vehiculoId) {

    if (!vehiculoId) {
        console.error("RODAX Vehículos: no se recibió el id del vehículo.");
        return;
    }

    const cliente = window.dbClient;

    if (!cliente) {
        console.error("RODAX Vehículos: no se encontró dbClient.");
        return;
    }

    const { data: vehiculo, error } = await cliente
        .from("vehiculos")
        .select("*")
        .eq("id", vehiculoId)
        .single();

    if (error) {
        console.error(
            "RODAX Vehículos: error cargando vehículo:",
            error
        );

        alert("No se ha podido cargar la información del vehículo.");
        return;
    }

    console.log(
        "RODAX Vehículos: vehículo seleccionado para gestionar:",
        vehiculo
    );

    const modalExistente =
        document.getElementById("modal-gestionar-vehiculo");

    if (modalExistente) {
        modalExistente.remove();
    }

    const modal = document.createElement("div");

    modal.id = "modal-gestionar-vehiculo";

    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4";

    modal.innerHTML = `
        <div class="w-full max-w-3xl max-h-[90vh] overflow-y-auto
                    bg-white rounded-2xl shadow-2xl">

            <div class="flex items-center justify-between
                        px-6 py-5 border-b border-slate-200">

                <div>
                    <h2 class="text-xl font-bold text-slate-900">
                        ${vehiculo.marca || "Vehículo"}
                        ${vehiculo.modelo || ""}
                    </h2>

                    <p class="text-sm text-slate-500 mt-1">
                        Gestiona la información de este vehículo.
                    </p>
                </div>

                <button
                    type="button"
                    onclick="cerrarGestionVehiculo()"
                    class="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    aria-label="Cerrar">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>

            </div>

            <div class="p-6">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Matrícula
                        </label>

                        <input
                            type="text"
                            value="${vehiculo.matricula || ""}"
                            disabled
                            class="w-full rounded-xl border border-slate-300
                                   bg-slate-50 px-4 py-3 text-slate-700">
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Estado
                        </label>

                        <input
                            type="text"
                            value="${vehiculo.estado || "Activo"}"
                            disabled
                            class="w-full rounded-xl border border-slate-300
                                   bg-slate-50 px-4 py-3 text-slate-700">
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Marca
                        </label>

                        <input
                            type="text"
                            value="${vehiculo.marca || ""}"
                            disabled
                            class="w-full rounded-xl border border-slate-300
                                   bg-slate-50 px-4 py-3 text-slate-700">
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Modelo
                        </label>

                        <input
                            type="text"
                            value="${vehiculo.modelo || ""}"
                            disabled
                            class="w-full rounded-xl border border-slate-300
                                   bg-slate-50 px-4 py-3 text-slate-700">
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Tipo de vehículo
                        </label>

                        <input
                            type="text"
                            value="${vehiculo.tipo_vehiculo || ""}"
                            disabled
                            class="w-full rounded-xl border border-slate-300
                                   bg-slate-50 px-4 py-3 text-slate-700">
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Año
                        </label>

                        <input
                            type="text"
                            value="${vehiculo.anio || "No indicado"}"
                            disabled
                            class="w-full rounded-xl border border-slate-300
                                   bg-slate-50 px-4 py-3 text-slate-700">
                    </div>

                </div>

                <div class="mt-6 rounded-xl border border-blue-100
                            bg-blue-50 p-4">

                    <p class="text-sm text-blue-800">
                        Desde esta ficha podremos incorporar posteriormente
                        la documentación, fotografías, seguros y revisiones
                        de este vehículo.
                    </p>

                </div>

            </div>

            <div class="flex justify-between
            px-6 py-5 border-t border-slate-200">

    <button
        type="button"
        onclick="editarVehiculo('${vehiculo.id}')"
        class="px-5 py-3 rounded-xl bg-blue-600
               hover:bg-blue-700 text-white
               font-semibold">
        Editar vehículo
    </button>

    <button
        type="button"
        onclick="cerrarGestionVehiculo()"
        class="px-5 py-3 rounded-xl border
               border-slate-300 text-slate-700
               font-medium hover:bg-slate-50">
        Cerrar
    </button>

</div>

        </div>
    `;

    document.body.appendChild(modal);

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

async function editarVehiculo(vehiculoId) {

    if (!vehiculoId) {
        console.error("RODAX Vehículos: no se recibió el id del vehículo.");
        return;
    }

    const cliente = window.dbClient;

    if (!cliente) {
        console.error("RODAX Vehículos: no se encontró dbClient.");
        return;
    }

    const { data: vehiculo, error } = await cliente
        .from("vehiculos")
        .select("*")
        .eq("id", vehiculoId)
        .single();

    if (error) {
        console.error(
            "RODAX Vehículos: error cargando vehículo para editar:",
            error
        );

        alert("No se ha podido cargar el vehículo.");
        return;
    }

    const modalExistente =
        document.getElementById("modal-editar-vehiculo");

    if (modalExistente) {
        modalExistente.remove();
    }

    const modal = document.createElement("div");

    modal.id = "modal-editar-vehiculo";

    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4";

    modal.innerHTML = `
        <div class="w-full max-w-3xl max-h-[90vh] overflow-y-auto
                    bg-white rounded-2xl shadow-2xl">

            <div class="flex items-center justify-between
                        px-6 py-5 border-b border-slate-200">

                <div>
                    <h2 class="text-xl font-bold text-slate-900">
                        Editar vehículo
                    </h2>

                    <p class="text-sm text-slate-500 mt-1">
                        Modifica los datos básicos de tu vehículo.
                    </p>
                </div>

                <button
                    type="button"
                    onclick="cerrarEditarVehiculo()"
                    class="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    aria-label="Cerrar">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>

            </div>

            <div class="p-6">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Matrícula
                        </label>

                        <input
                            type="text"
                            id="editar-vehiculo-matricula"
                            value="${vehiculo.matricula || ""}"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Marca
                        </label>

                        <input
                            type="text"
                            id="editar-vehiculo-marca"
                            value="${vehiculo.marca || ""}"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Modelo
                        </label>

                        <input
                            type="text"
                            id="editar-vehiculo-modelo"
                            value="${vehiculo.modelo || ""}"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Tipo de vehículo
                        </label>

                        <select
                            id="editar-vehiculo-tipo"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500">

                            <option value="Furgoneta"
                                ${vehiculo.tipo_vehiculo === "Furgoneta" ? "selected" : ""}>
                                Furgoneta
                            </option>

                            <option value="Camión"
                                ${vehiculo.tipo_vehiculo === "Camión" ? "selected" : ""}>
                                Camión
                            </option>

                            <option value="Camión con plataforma"
                                ${vehiculo.tipo_vehiculo === "Camión con plataforma" ? "selected" : ""}>
                                Camión con plataforma
                            </option>

                            <option value="Otro"
                                ${vehiculo.tipo_vehiculo === "Otro" ? "selected" : ""}>
                                Otro
                            </option>

                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium
                                      text-slate-700 mb-2">
                            Año
                        </label>

                        <input
                            type="number"
                            id="editar-vehiculo-anio"
                            value="${vehiculo.anio || ""}"
                            placeholder="Ej. 2021"
                            class="w-full rounded-xl border border-slate-300
                                   px-4 py-3 outline-none
                                   focus:ring-2 focus:ring-blue-500">
                    </div>

                </div>

            </div>

            <div class="flex justify-between
                        px-6 py-5 border-t border-slate-200">

                <button
                    type="button"
                    onclick="cerrarEditarVehiculo()"
                    class="px-5 py-3 rounded-xl border
                           border-slate-300 text-slate-700
                           font-medium hover:bg-slate-50">
                    Cancelar
                </button>

                <button
                    type="button"
                    onclick="guardarEdicionVehiculo('${vehiculo.id}')"
                    class="px-5 py-3 rounded-xl bg-blue-600
                           hover:bg-blue-700 text-white
                           font-semibold">
                    Guardar cambios
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

async function guardarEdicionVehiculo(vehiculoId) {

    if (!vehiculoId) {
        console.error(
            "RODAX Vehículos: no se recibió el id del vehículo."
        );
        return;
    }

    const transportistaId =
        window.Transportista?.currentUserId ||
        window.currentUserId ||
        null;

    if (!transportistaId) {
        console.error(
            "RODAX Vehículos: no se ha podido obtener el transportista_id."
        );
        return;
    }

    const matricula =
        document
            .getElementById("editar-vehiculo-matricula")
            ?.value
            .trim();

    const marca =
        document
            .getElementById("editar-vehiculo-marca")
            ?.value
            .trim();

    const modelo =
        document
            .getElementById("editar-vehiculo-modelo")
            ?.value
            .trim();

    const tipoVehiculo =
        document.getElementById("editar-vehiculo-tipo")?.value;

    const anioValor =
        document
            .getElementById("editar-vehiculo-anio")
            ?.value
            .trim();

    if (!matricula) {
        alert("Introduce la matrícula del vehículo.");
        return;
    }

    if (!tipoVehiculo) {
        alert("Selecciona el tipo de vehículo.");
        return;
    }

    const anio =
        anioValor ? parseInt(anioValor, 10) : null;

    if (anioValor && Number.isNaN(anio)) {
        alert("El año introducido no es válido.");
        return;
    }

    const datosActualizados = {
        matricula: matricula,
        marca: marca || null,
        modelo: modelo || null,
        tipo_vehiculo: tipoVehiculo,
        anio: anio,
        actualizado_en: new Date().toISOString()
    };

    console.log(
        "RODAX Vehículos — datos para actualizar:",
        datosActualizados
    );

    const cliente = window.dbClient;

    if (!cliente) {
        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );
        return;
    }

    const { data, error } = await cliente
        .from("vehiculos")
        .update(datosActualizados)
        .eq("id", vehiculoId)
        .eq("transportista_id", transportistaId)
        .select()
        .single();

    if (error) {
        console.error(
            "RODAX Vehículos: error actualizando vehículo:",
            error
        );

        alert(
            "No se han podido guardar los cambios: " +
            error.message
        );

        return;
    }

    console.log(
        "RODAX Vehículos: vehículo actualizado correctamente:",
        data
    );

    cerrarEditarVehiculo();
    cerrarGestionVehiculo();

    await cargarMisVehiculos();
}


window.guardarEdicionVehiculo =
    guardarEdicionVehiculo;

function cerrarEditarVehiculo() {

    const modal =
        document.getElementById("modal-editar-vehiculo");

    if (modal) {
        modal.remove();
    }
}


window.editarVehiculo =
    editarVehiculo;

window.cerrarEditarVehiculo =
    cerrarEditarVehiculo;

function cerrarGestionVehiculo() {

    const modal =
        document.getElementById("modal-gestionar-vehiculo");

    if (modal) {
        modal.remove();
    }
}


window.abrirGestionVehiculo =
    abrirGestionVehiculo;

window.cerrarGestionVehiculo =
    cerrarGestionVehiculo;

function cerrarFormularioVehiculo() {

    const modal =
        document.getElementById("modal-vehiculo");

    if (modal) {
        modal.remove();
    }
}


window.abrirFormularioVehiculo =
    abrirFormularioVehiculo;

window.cerrarFormularioVehiculo =
    cerrarFormularioVehiculo;

    window.guardarVehiculo =
    guardarVehiculo;

})();
