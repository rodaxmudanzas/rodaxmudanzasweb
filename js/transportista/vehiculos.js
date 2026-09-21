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

    function formatearFecha(fecha) {
    if (!fecha) {
        return "";
    }

    const partes = String(fecha).split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    const [anio, mes, dia] = partes;

    return `${dia}-${mes}-${anio}`;
}

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

              <!-- PESTAÑAS -->
<div class="bg-white rounded-2xl border border-slate-200
            flex items-center overflow-hidden">

    <!-- MIS VEHÍCULOS -->
    <button
        type="button"
        onclick="cargarMisVehiculos()"
        class="flex-1 flex items-center justify-center gap-2
               px-5 py-4 text-slate-600
               hover:bg-slate-50 transition">

        <i data-lucide="truck" class="w-5 h-5"></i>
        Mis vehículos

    </button>

    <!-- DOCUMENTACIÓN ACTIVA -->
    <button
        type="button"
        class="flex-1 flex items-center justify-center gap-2
               px-5 py-4 bg-blue-600 text-white font-semibold">

        <i data-lucide="file-text" class="w-5 h-5"></i>
        Documentación

    </button>

</div>  

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
            tipo: "seguro_transporte",
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
                       border-slate-100">

                <div class="text-xs text-slate-500">
                    ${
                        documento.fecha_caducidad
                            ? `Caducidad:
                               ${formatearFecha(documento.fecha_caducidad)}`
                            : "Sin fecha de caducidad"
                    }
                </div>

                ${
                    documento.archivo_path
                        ? `
                            <div class="mt-3">

                                <div class="flex items-center gap-2
                                            text-xs text-emerald-600 mb-2">

                                    <i
                                        data-lucide="paperclip"
                                        class="w-4 h-4">
                                    </i>

                                    Documento adjunto

                                </div>

                                <div class="flex gap-2">

                                    <button
                                        type="button"
                                        onclick="event.stopPropagation(); verDocumentoVehiculo('${documento.archivo_path}')"
                                        class="inline-flex items-center gap-2
                                               px-3 py-2 rounded-lg
                                               bg-blue-50 text-blue-600
                                               text-xs font-semibold
                                               hover:bg-blue-100
                                               transition">

                                        <i
                                            data-lucide="external-link"
                                            class="w-4 h-4">
                                        </i>

                                        Ver documento

                                    </button>

                                    <button
                                        type="button"
                                        onclick="event.stopPropagation(); subirDocumentoVehiculo('${documento.id}', '${vehiculo.id}', '${tipoDocumento.tipo}')"
                                        class="inline-flex items-center gap-2
                                               px-3 py-2 rounded-lg
                                               bg-slate-50 text-slate-600
                                               text-xs font-semibold
                                               hover:bg-slate-100
                                               transition">

                                        <i
                                            data-lucide="refresh-cw"
                                            class="w-4 h-4">
                                        </i>

                                        Cambiar

                                    </button>

                                </div>

                            </div>
                        `
                        : `
                            <button
                                type="button"
                                onclick="event.stopPropagation(); subirDocumentoVehiculo('${documento.id}', '${vehiculo.id}', '${tipoDocumento.tipo}')"
                                class="mt-3 inline-flex items-center gap-2
                                       px-3 py-2 rounded-lg
                                       bg-blue-50 text-blue-700
                                       hover:bg-blue-100
                                       text-xs font-semibold
                                       transition">

                                <i
                                    data-lucide="upload"
                                    class="w-4 h-4">
                                </i>

                                Subir documento

                            </button>
                        `
                }

            </div>
        `
        : `
            <div class="mt-3 pt-3 border-t border-slate-100">

                <button
                    type="button"
                    onclick="event.stopPropagation(); subirDocumentoVehiculo(null, '${vehiculo.id}', '${tipoDocumento.tipo}')"
                    class="inline-flex items-center gap-2
                           px-3 py-2 rounded-lg
                           bg-blue-50 text-blue-700
                           hover:bg-blue-100
                           text-xs font-semibold
                           transition">

                    <i
                        data-lucide="upload"
                        class="w-4 h-4">
                    </i>

                    Subir documento

                </button>

            </div>
        `
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

    <div
        class="flex items-center gap-3 cursor-pointer"
        onclick="abrirFormularioDocumentacionVehiculo('${vehiculo.id}', 'otros')">

        <div
            class="w-10 h-10 rounded-lg
                   bg-slate-50
                   flex items-center justify-center">

            <i
                data-lucide="plus"
                class="w-5 h-5 text-slate-500">
            </i>

        </div>

        <div>
            <div class="font-medium text-slate-700">
                Añadir otro documento
            </div>

            <div class="text-xs text-slate-500 mt-1">
                Añade autorizaciones, licencias u otros documentos
            </div>
        </div>

    </div>

    <button
        type="button"
        onclick="event.stopPropagation(); subirDocumentoVehiculo(null, '${vehiculo.id}', 'otros')"
        class="mt-4 inline-flex items-center gap-2
               px-3 py-2 rounded-lg
               bg-blue-50 text-blue-600
               text-xs font-semibold
               hover:bg-blue-100 transition">

        <i
            data-lucide="upload"
            class="w-4 h-4">
        </i>

        Subir documento

    </button>

</div>

${
    documentosVehiculo
        .filter(doc => doc.tipo_documento === "otros")
        .map(documento => {

            const estado =
                obtenerEstadoDocumento(documento);

            return `
                <div
                    onclick="abrirFormularioDocumentacionVehiculo('${vehiculo.id}', 'otros')"
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
                                   bg-slate-50
                                   flex items-center justify-center">

                            <i data-lucide="file-plus"
                               class="w-5 h-5 text-slate-600">
                            </i>

                        </div>

                        <div class="min-w-0">

                            <div class="font-medium text-slate-900">
                                ${documento.nombre_documento || "Otros documentos"}
                            </div>

                            <div class="text-xs mt-1 ${estado.clase}">
                                ${estado.texto}
                            </div>

                        </div>

                    </div>

                    <div
    class="mt-3 pt-3
           border-t border-slate-100">

    <div class="text-xs text-slate-500">

        ${
            documento.numero_referencia
                ? `Referencia: ${documento.numero_referencia}`
                : ""
        }

        ${
            documento.fecha_caducidad
                ? ` · Caducidad: ${formatearFecha(documento.fecha_caducidad)}`
                : ""
        }

    </div>


    ${
        documento.archivo_path
            ? `
                <div class="mt-3">

                    <div class="flex items-center gap-2
                                text-xs text-emerald-600 mb-2">

                        <i
                            data-lucide="paperclip"
                            class="w-4 h-4">
                        </i>

                        Documento adjunto

                    </div>


                    <div class="flex gap-2">

                        <button
                            type="button"
                            onclick="event.stopPropagation(); verDocumentoVehiculo('${documento.archivo_path}')"
                            class="inline-flex items-center gap-2
                                   px-3 py-2 rounded-lg
                                   bg-blue-50 text-blue-600
                                   text-xs font-semibold
                                   hover:bg-blue-100
                                   transition">

                            <i
                                data-lucide="external-link"
                                class="w-4 h-4">
                            </i>

                            Ver documento

                        </button>


                        <button
                            type="button"
                            onclick="event.stopPropagation(); subirDocumentoVehiculo('${documento.id}', '${vehiculo.id}', 'otros')"
                            class="inline-flex items-center gap-2
                                   px-3 py-2 rounded-lg
                                   bg-slate-50 text-slate-600
                                   text-xs font-semibold
                                   hover:bg-slate-100
                                   transition">

                            <i
                                data-lucide="refresh-cw"
                                class="w-4 h-4">
                            </i>

                            Cambiar

                        </button>

                    </div>

                </div>
            `
            : `
                <button
                    type="button"
                    onclick="event.stopPropagation(); subirDocumentoVehiculo('${documento.id}', '${vehiculo.id}', 'otros')"
                    class="mt-3 inline-flex items-center gap-2
                           px-3 py-2 rounded-lg
                           bg-blue-50 text-blue-700
                           text-xs font-semibold
                           hover:bg-blue-100
                           transition">

                    <i
                        data-lucide="upload"
                        class="w-4 h-4">
                    </i>

                    Subir documento

                </button>
            `
    }

</div>

                </div>
            `;

        }).join("")
}

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
        seguro_transporte: "Seguro de mercancías / transporte"
    };

    const esOtroDocumento = tipoDocumento === "otros";

const nombreDocumento =
    nombresDocumentos[tipoDocumento] ||
    "Otros documentos";

    const modal = document.createElement("div");

    modal.id = "modal-documentacion-vehiculo";

modal.dataset.vehiculoId = vehiculoId;
modal.dataset.tipoDocumento = tipoDocumento;

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

                               Registra los datos del documento y adjunta
el archivo correspondiente.

                            </p>

                        </div>

                    </div>

                </div>


                <!-- NOMBRE -->

                <div>

                   <!-- NOMBRE -->

<div>

    <label
        class="block text-sm font-semibold
               text-slate-700 mb-2">

        ${esOtroDocumento
            ? "Nombre del documento"
            : "Tipo de documento"}

    </label>

    <input
        id="documentacion-nombre"
        type="text"
        value="${esOtroDocumento ? "" : nombreDocumento}"
        placeholder="${esOtroDocumento
            ? "Ej. Autorización especial, tarjeta de transporte..."
            : ""}"
        ${esOtroDocumento ? "" : "readonly"}
        class="w-full px-4 py-3 rounded-xl
               border border-slate-200
               focus:outline-none
               focus:ring-2
               focus:ring-blue-500
               focus:border-blue-500
               ${esOtroDocumento
                   ? ""
                   : "bg-slate-50 text-slate-700"}">

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

<!-- ARCHIVO -->

<div>

    <label
        class="block text-sm font-semibold
               text-slate-700 mb-2">

        Documento

    </label>

    <input
        id="documentacion-archivo"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        class="w-full px-4 py-3 rounded-xl
               border border-slate-200
               bg-white
               text-sm text-slate-700
               focus:outline-none
               focus:ring-2
               focus:ring-blue-500
               focus:border-blue-500">

    <p class="text-xs text-slate-500 mt-2">
        PDF o imagen. Tamaño máximo: 10 MB.
    </p>

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
    onclick="guardarDocumentoVehiculo()"
    class="px-5 py-2.5 rounded-xl
           bg-blue-600 hover:bg-blue-700
           text-white font-semibold
           transition">

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

async function guardarDocumentoVehiculo() {

    const modal =
        document.getElementById("modal-documentacion-vehiculo");

    if (!modal) {
        console.error(
            "RODAX Vehículos: no se encontró el modal de documentación."
        );
        return;
    }

    const vehiculoId =
        modal.dataset.vehiculoId;

    const tipoDocumento =
        modal.dataset.tipoDocumento;

    const nombre =
        document
            .getElementById("documentacion-nombre")
            ?.value
            .trim();

    const referencia =
        document
            .getElementById("documentacion-referencia")
            ?.value
            .trim();

    const fechaEmision =
        document
            .getElementById("documentacion-fecha-emision")
            ?.value || null;

    const fechaCaducidad =
        document
            .getElementById("documentacion-fecha-caducidad")
            ?.value || null;

    const observaciones =
        document
            .getElementById("documentacion-observaciones")
            ?.value
            .trim();

    const archivo =
        document
            .getElementById("documentacion-archivo")
            ?.files?.[0] || null;


    /*
     * VALIDACIONES
     */

    if (!vehiculoId) {

        alert(
            "No se ha podido identificar el vehículo."
        );

        return;
    }

    if (!tipoDocumento) {

        alert(
            "No se ha podido identificar el tipo de documento."
        );

        return;
    }

    if (!nombre) {

        alert(
            "Introduce el nombre del documento."
        );

        return;
    }

    if (
        fechaEmision &&
        fechaCaducidad &&
        fechaCaducidad < fechaEmision
    ) {

        alert(
            "La fecha de caducidad no puede ser anterior a la fecha de emisión."
        );

        return;
    }


    /*
     * VALIDAR ARCHIVO
     */

    const TAMANO_MAXIMO =
        10 * 1024 * 1024;

    if (archivo && archivo.size > TAMANO_MAXIMO) {

        alert(
            "El archivo supera el límite de 10 MB."
        );

        return;
    }


    const cliente =
        window.dbClient;

    if (!cliente) {

        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );

        alert(
            "No se ha podido conectar con el sistema."
        );

        return;
    }

    /*
     * BUSCAR DOCUMENTO EXISTENTE
     *
     * Para los 5 tipos estándar:
     * solo puede existir un documento de cada tipo
     * por vehículo.
     *
     * Para "otros":
     * pueden existir varios.
     */

    let documentoExistente = null;

    if (tipoDocumento !== "otros") {

        const {
            data: documentoEncontrado,
            error: errorBusqueda
        } = await cliente
            .from("vehiculos_documentacion")
            .select("*")
            .eq("vehiculo_id", vehiculoId)
            .eq("tipo_documento", tipoDocumento)
            .maybeSingle();

        if (errorBusqueda) {

            console.error(
                "RODAX Vehículos: error buscando documentación existente:",
                errorBusqueda
            );

            alert(
                "No se ha podido comprobar el documento existente.\n\n" +
                errorBusqueda.message
            );

            return;
        }

        documentoExistente =
            documentoEncontrado || null;
    }


    /*
     * DATOS DEL DOCUMENTO
     */

    const datosDocumento = {

        vehiculo_id: vehiculoId,

        tipo_documento: tipoDocumento,

        nombre_documento: nombre,

        fecha_emision: fechaEmision,

        fecha_caducidad: fechaCaducidad,

        numero_referencia:
            referencia || null,

        observaciones:
            observaciones || null
    };


    /*
     * GUARDAR / ACTUALIZAR DATOS
     */

    let documentoGuardado = null;

    if (documentoExistente) {

        const {
            data,
            error
        } = await cliente
            .from("vehiculos_documentacion")
            .update(datosDocumento)
            .eq("id", documentoExistente.id)
            .select()
            .single();

        if (error) {

            console.error(
                "RODAX Vehículos: error actualizando documentación:",
                error
            );

            alert(
                "No se ha podido actualizar el documento.\n\n" +
                error.message
            );

            return;
        }

        documentoGuardado = data;

    } else {

        const {
            data,
            error
        } = await cliente
            .from("vehiculos_documentacion")
            .insert([{
                ...datosDocumento,
                archivo_path: null
            }])
            .select()
            .single();

        if (error) {

            console.error(
                "RODAX Vehículos: error guardando documentación:",
                error
            );

            alert(
                "No se ha podido guardar el documento.\n\n" +
                error.message
            );

            return;
        }

        documentoGuardado = data;
    }


    /*
     * SUBIR ARCHIVO SI SE HA SELECCIONADO
     */

    if (archivo) {

        try {

            const transportistaId =
                window.Transportista?.currentUserId ||
                window.currentUserId ||
                null;

            if (!transportistaId) {

                alert(
                    "No se ha podido identificar al transportista."
                );

                return;
            }


            /*
             * Obtener extensión
             */

            const partesNombre =
                archivo.name.split(".");

            const extension =
                partesNombre.length > 1
                    ? partesNombre
                        .pop()
                        .toLowerCase()
                    : "archivo";


            /*
             * Nombre único
             */

            const nombreArchivo =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 10)}.${extension}`;


            /*
             * Tipo de carpeta seguro
             */

            const carpetaTipo =
                tipoDocumento || "otros";


            /*
             * Ruta Storage
             */

            const rutaArchivo =
                `documentos-vehiculos/${transportistaId}/${vehiculoId}/${carpetaTipo}/${nombreArchivo}`;


            console.log(
                "RODAX Vehículos — subiendo archivo desde formulario:",
                rutaArchivo
            );


            /*
             * SUBIR ARCHIVO
             */

            const {
                error: errorSubida
            } = await cliente.storage
                .from("documentos")
                .upload(
                    rutaArchivo,
                    archivo,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


            if (errorSubida) {

                console.error(
                    "RODAX Vehículos: error subiendo archivo:",
                    errorSubida
                );

                alert(
                    "Los datos del documento se han guardado, pero el archivo no se ha podido subir.\n\n" +
                    errorSubida.message
                );

                return;
            }


            /*
             * VINCULAR ARCHIVO CON EL REGISTRO
             */

            const {
                error: errorArchivoPath
            } = await cliente
                .from("vehiculos_documentacion")
                .update({
                    archivo_path: rutaArchivo
                })
                .eq("id", documentoGuardado.id);


            if (errorArchivoPath) {

                console.error(
                    "RODAX Vehículos: error vinculando archivo:",
                    errorArchivoPath
                );

                alert(
                    "El archivo se ha subido, pero no se ha podido vincular al documento.\n\n" +
                    errorArchivoPath.message
                );

                return;
            }
        }

        catch (error) {

            console.error(
                "RODAX Vehículos: error inesperado subiendo archivo:",
                error
            );

            alert(
                "Se ha producido un error al subir el archivo."
            );

            return;
        }
    }


    /*
     * TODO CORRECTO
     */

    console.log(
        "RODAX Vehículos: documento guardado correctamente:",
        documentoGuardado
    );


    cerrarFormularioDocumentacionVehiculo();


    await cargarDocumentacionVehiculos(
        window.Transportista?.currentUserId ||
        window.currentUserId ||
        null
    );
}

window.abrirFormularioDocumentacionVehiculo =
    abrirFormularioDocumentacionVehiculo;

window.cerrarFormularioDocumentacionVehiculo =
    cerrarFormularioDocumentacionVehiculo;

window.abrirPestanaDocumentacionVehiculos =
    abrirPestanaDocumentacionVehiculos;

window.cargarDocumentacionVehiculos =
    cargarDocumentacionVehiculos;

window.guardarDocumentoVehiculo =
    guardarDocumentoVehiculo;

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

        const { data: documentosVehiculo, error: errorDocumentosVehiculo } =
        await cliente
            .from("vehiculos_documentacion")
            .select("*")
            .eq("vehiculo_id", vehiculoId)
            .order("creado_en", {
                ascending: false
            });

    if (errorDocumentosVehiculo) {
        console.error(
            "RODAX Vehículos: error cargando documentación del vehículo:",
            errorDocumentosVehiculo
        );
    }

    console.log(
        "RODAX Vehículos: documentación del vehículo:",
        documentosVehiculo || []
    );

        const documentoITV =
        (documentosVehiculo || []).find(
            documento =>
                documento.tipo_documento === "itv"
        ) || null;

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
        <div class="w-full max-w-5xl max-h-[92vh] overflow-hidden
                    bg-white rounded-2xl shadow-2xl flex flex-col">

            <!-- CABECERA -->
            <div class="flex items-center justify-between
                        px-6 py-5 border-b border-slate-200">

                <div>
                    <h2 class="text-xl font-bold text-slate-900">
                        ${vehiculo.marca || "Vehículo"}
                        ${vehiculo.modelo || ""}
                    </h2>

                    <div class="flex items-center gap-3 mt-1">

                        <span class="text-sm text-slate-500">
                            Matrícula:
                            <strong class="text-slate-700">
                                ${vehiculo.matricula || "No indicada"}
                            </strong>
                        </span>

                        <span class="inline-flex items-center
                                     px-2.5 py-1 rounded-full
                                     text-xs font-semibold
                                     bg-emerald-100 text-emerald-700">
                            ${vehiculo.estado || "Activo"}
                        </span>

                    </div>
                </div>

                <button
                    type="button"
                    onclick="cerrarGestionVehiculo()"
                    class="p-2 rounded-lg hover:bg-slate-100
                           text-slate-500"
                    aria-label="Cerrar">

                    <i data-lucide="x" class="w-5 h-5"></i>

                </button>

            </div>


            <!-- NAVEGACIÓN DE LA FICHA -->
            <div class="border-b border-slate-200 bg-slate-50">

                <div class="flex items-center gap-1 px-4 overflow-x-auto">

                    <button
                        type="button"
                        data-gestion-tab="informacion"
                        class="gestion-vehiculo-tab px-4 py-3
                               text-sm font-semibold
                               text-blue-600
                               border-b-2 border-blue-600
                               whitespace-nowrap">
                        Información
                    </button>

                    <button
                        type="button"
                        data-gestion-tab="fotografias"
                        class="gestion-vehiculo-tab px-4 py-3
                               text-sm font-medium
                               text-slate-500
                               hover:text-slate-800
                               border-b-2 border-transparent
                               whitespace-nowrap">
                        Fotografías
                    </button>

                    <button
                        type="button"
                        data-gestion-tab="documentacion"
                        class="gestion-vehiculo-tab px-4 py-3
                               text-sm font-medium
                               text-slate-500
                               hover:text-slate-800
                               border-b-2 border-transparent
                               whitespace-nowrap">
                        Documentación
                    </button>

                    <button
                        type="button"
                        data-gestion-tab="seguros"
                        class="gestion-vehiculo-tab px-4 py-3
                               text-sm font-medium
                               text-slate-500
                               hover:text-slate-800
                               border-b-2 border-transparent
                               whitespace-nowrap">
                        Seguros
                    </button>

                    <button
                        type="button"
                        data-gestion-tab="revisiones"
                        class="gestion-vehiculo-tab px-4 py-3
                               text-sm font-medium
                               text-slate-500
                               hover:text-slate-800
                               border-b-2 border-transparent
                               whitespace-nowrap">
                        Revisiones
                    </button>

                    <button
                        type="button"
                        data-gestion-tab="estadisticas"
                        class="gestion-vehiculo-tab px-4 py-3
                               text-sm font-medium
                               text-slate-500
                               hover:text-slate-800
                               border-b-2 border-transparent
                               whitespace-nowrap">
                        Estadísticas
                    </button>

                </div>

            </div>


           <!-- CONTENIDO -->
<div
    id="gestion-vehiculo-contenido"
    class="flex-1 min-h-0 overflow-y-auto p-6">

                <!-- INFORMACIÓN -->
                <div data-gestion-contenido="informacion">

                    <div class="mb-6">

                        <h3 class="text-lg font-bold text-slate-900">
                            Información del vehículo
                        </h3>

                        <p class="text-sm text-slate-500 mt-1">
                            Datos generales registrados del vehículo.
                        </p>

                    </div>


                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <!-- MATRÍCULA -->
                        <div class="rounded-xl border border-slate-200
                                    bg-white p-5">

                            <p class="text-xs font-semibold
                                      uppercase tracking-wide
                                      text-slate-400">
                                Matrícula
                            </p>

                            <p class="mt-2 text-base font-semibold
                                      text-slate-900">
                                ${vehiculo.matricula || "No indicada"}
                            </p>

                        </div>


                        <!-- ESTADO -->
                        <div class="rounded-xl border border-slate-200
                                    bg-white p-5">

                            <p class="text-xs font-semibold
                                      uppercase tracking-wide
                                      text-slate-400">
                                Estado
                            </p>

                            <p class="mt-2 text-base font-semibold
                                      text-slate-900">
                                ${vehiculo.estado || "Activo"}
                            </p>

                        </div>


                        <!-- MARCA -->
                        <div class="rounded-xl border border-slate-200
                                    bg-white p-5">

                            <p class="text-xs font-semibold
                                      uppercase tracking-wide
                                      text-slate-400">
                                Marca
                            </p>

                            <p class="mt-2 text-base font-semibold
                                      text-slate-900">
                                ${vehiculo.marca || "No indicada"}
                            </p>

                        </div>


                        <!-- MODELO -->
                        <div class="rounded-xl border border-slate-200
                                    bg-white p-5">

                            <p class="text-xs font-semibold
                                      uppercase tracking-wide
                                      text-slate-400">
                                Modelo
                            </p>

                            <p class="mt-2 text-base font-semibold
                                      text-slate-900">
                                ${vehiculo.modelo || "No indicado"}
                            </p>

                        </div>


                        <!-- TIPO -->
                        <div class="rounded-xl border border-slate-200
                                    bg-white p-5">

                            <p class="text-xs font-semibold
                                      uppercase tracking-wide
                                      text-slate-400">
                                Tipo de vehículo
                            </p>

                            <p class="mt-2 text-base font-semibold
                                      text-slate-900">
                                ${vehiculo.tipo_vehiculo || "No indicado"}
                            </p>

                        </div>


                        <!-- AÑO -->
                        <div class="rounded-xl border border-slate-200
                                    bg-white p-5">

                            <p class="text-xs font-semibold
                                      uppercase tracking-wide
                                      text-slate-400">
                                Año
                            </p>

                            <p class="mt-2 text-base font-semibold
                                      text-slate-900">
                                ${vehiculo.anio || "No indicado"}
                            </p>

                        </div>

                    </div>


                    <!-- BLOQUE INFORMATIVO -->
                    <div class="mt-6 rounded-xl border border-blue-100
                                bg-blue-50 p-5">

                        <div class="flex items-start gap-3">

                            <i
                                data-lucide="info"
                                class="w-5 h-5 text-blue-600 mt-0.5">
                            </i>

                            <div>

                                <p class="text-sm font-semibold
                                          text-blue-900">
                                    Ficha completa del vehículo
                                </p>

                                <p class="text-sm text-blue-800 mt-1">
                                    Desde esta ficha gestionaremos
                                    fotografías, documentación, seguros,
                                    revisiones y estadísticas del vehículo.
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

<!-- FOTOGRAFÍAS -->
<div
    data-gestion-contenido="fotografias"
    class="hidden">

    <div class="mb-6">
        <h3 class="text-lg font-bold text-slate-900">
            Fotografías del vehículo
        </h3>

        <p class="text-sm text-slate-500 mt-1">
            Añade y gestiona las fotografías de tu vehículo.
        </p>
    </div>

    <div class="mb-6 rounded-xl border border-blue-100
                bg-blue-50 p-4">

        <div class="flex items-start gap-3">

            <i
                data-lucide="info"
                class="w-5 h-5 text-blue-600 mt-0.5">
            </i>

            <div>
                <p class="text-sm font-semibold text-blue-900">
                    Fotografías del vehículo
                </p>

                <p class="text-sm text-blue-800 mt-1">
                    Añade fotografías claras y actuales de tu vehículo.
                    Podrás cambiarlas cuando necesites actualizar la
                    información.
                </p>
            </div>

        </div>

    </div>

    <div
        id="vehiculo-fotografias-contenedor"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        <div class="col-span-full bg-white border border-slate-200
                    rounded-2xl p-10 text-center">

            <i
                data-lucide="loader-circle"
                class="w-8 h-8 mx-auto text-slate-400 animate-spin">
            </i>

            <p class="mt-3 text-sm text-slate-500">
                Cargando fotografías...
            </p>

        </div>

    </div>

</div>

                <!-- RESTO DE SECCIONES: RESERVADAS -->
                <div
    data-gestion-contenido="documentacion"
    class="hidden">

    <div class="mb-6">

        <h3 class="text-lg font-bold text-slate-900">
            Documentación del vehículo
        </h3>

        <p class="text-sm text-slate-500 mt-1">
            Gestiona la documentación asociada a este vehículo.
        </p>

    </div>


    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- PERMISO DE CIRCULACIÓN -->
        <div
            class="rounded-xl border border-slate-200
                   bg-white p-5">

            <div class="flex items-start gap-3">

                <div
                    class="w-10 h-10 rounded-lg bg-blue-50
                           flex items-center justify-center">

                    <i
                        data-lucide="file-text"
                        class="w-5 h-5 text-blue-600">
                    </i>

                </div>

                <div class="flex-1">

                    <h4 class="font-semibold text-slate-900">
                        Permiso de circulación
                    </h4>

                    <p class="text-sm text-slate-500 mt-1">
                        Documento oficial del vehículo.
                    </p>

                    <button
                        type="button"
                        onclick="abrirFormularioDocumentacionVehiculo(
                            '${vehiculo.id}',
                            'permiso_circulacion'
                        )"
                        class="mt-4 inline-flex items-center gap-2
                               px-4 py-2 rounded-lg
                               bg-blue-50 text-blue-700
                               hover:bg-blue-100
                               text-sm font-semibold">

                        <i
                            data-lucide="file-plus"
                            class="w-4 h-4">
                        </i>

                        Gestionar

                    </button>

                </div>

            </div>

        </div>


        <!-- FICHA TÉCNICA -->
        <div
            class="rounded-xl border border-slate-200
                   bg-white p-5">

            <div class="flex items-start gap-3">

                <div
                    class="w-10 h-10 rounded-lg bg-blue-50
                           flex items-center justify-center">

                    <i
                        data-lucide="file-check"
                        class="w-5 h-5 text-blue-600">
                    </i>

                </div>

                <div class="flex-1">

                    <h4 class="font-semibold text-slate-900">
                        Ficha técnica
                    </h4>

                    <p class="text-sm text-slate-500 mt-1">
                        Características técnicas del vehículo.
                    </p>

                    <button
                        type="button"
                        onclick="abrirFormularioDocumentacionVehiculo(
                            '${vehiculo.id}',
                            'ficha_tecnica'
                        )"
                        class="mt-4 inline-flex items-center gap-2
                               px-4 py-2 rounded-lg
                               bg-blue-50 text-blue-700
                               hover:bg-blue-100
                               text-sm font-semibold">

                        <i
                            data-lucide="file-plus"
                            class="w-4 h-4">
                        </i>

                        Gestionar

                    </button>

                </div>

            </div>

        </div>


        <!-- ITV -->
        <div
            class="rounded-xl border border-slate-200
                   bg-white p-5">

            <div class="flex items-start gap-3">

                <div
                    class="w-10 h-10 rounded-lg bg-blue-50
                           flex items-center justify-center">

                    <i
                        data-lucide="clipboard-check"
                        class="w-5 h-5 text-blue-600">
                    </i>

                </div>

                <div class="flex-1">

                    <h4 class="font-semibold text-slate-900">
                        ITV
                    </h4>

                    <p class="text-sm text-slate-500 mt-1">
                        Inspección técnica del vehículo.
                    </p>

                    <button
                        type="button"
                        onclick="abrirFormularioDocumentacionVehiculo(
                            '${vehiculo.id}',
                            'itv'
                        )"
                        class="mt-4 inline-flex items-center gap-2
                               px-4 py-2 rounded-lg
                               bg-blue-50 text-blue-700
                               hover:bg-blue-100
                               text-sm font-semibold">

                        <i
                            data-lucide="file-plus"
                            class="w-4 h-4">
                        </i>

                        Gestionar

                    </button>

                </div>

            </div>

        </div>


        <!-- SEGURO DEL VEHÍCULO -->
        <div
            class="rounded-xl border border-slate-200
                   bg-white p-5">

            <div class="flex items-start gap-3">

                <div
                    class="w-10 h-10 rounded-lg bg-emerald-50
                           flex items-center justify-center">

                    <i
                        data-lucide="shield-check"
                        class="w-5 h-5 text-emerald-600">
                    </i>

                </div>

                <div class="flex-1">

                    <h4 class="font-semibold text-slate-900">
                        Seguro del vehículo
                    </h4>

                    <p class="text-sm text-slate-500 mt-1">
                        Póliza y documentación del seguro.
                    </p>

                    <button
                        type="button"
                        onclick="abrirFormularioDocumentacionVehiculo(
                            '${vehiculo.id}',
                            'seguro_vehiculo'
                        )"
                        class="mt-4 inline-flex items-center gap-2
                               px-4 py-2 rounded-lg
                               bg-emerald-50 text-emerald-700
                               hover:bg-emerald-100
                               text-sm font-semibold">

                        <i
                            data-lucide="shield-plus"
                            class="w-4 h-4">
                        </i>

                        Gestionar

                    </button>

                </div>

            </div>

        </div>


        <!-- SEGURO DE MERCANCÍAS / TRANSPORTE -->
        <div
            class="rounded-xl border border-slate-200
                   bg-white p-5">

            <div class="flex items-start gap-3">

                <div
                    class="w-10 h-10 rounded-lg bg-emerald-50
                           flex items-center justify-center">

                    <i
                        data-lucide="shield"
                        class="w-5 h-5 text-emerald-600">
                    </i>

                </div>

                <div class="flex-1">

                    <h4 class="font-semibold text-slate-900">
                        Seguro de mercancías / transporte
                    </h4>

                    <p class="text-sm text-slate-500 mt-1">
                        Cobertura de mercancías y transporte.
                    </p>

                    <button
                        type="button"
                        onclick="abrirFormularioDocumentacionVehiculo(
                            '${vehiculo.id}',
                            'seguro_transporte'
                        )"
                        class="mt-4 inline-flex items-center gap-2
                               px-4 py-2 rounded-lg
                               bg-emerald-50 text-emerald-700
                               hover:bg-emerald-100
                               text-sm font-semibold">

                        <i
                            data-lucide="shield-plus"
                            class="w-4 h-4">
                        </i>

                        Gestionar

                    </button>

                </div>

            </div>

        </div>


        <!-- OTROS DOCUMENTOS -->
        <div
            class="rounded-xl border border-slate-200
                   bg-white p-5">

            <div class="flex items-start gap-3">

                <div
                    class="w-10 h-10 rounded-lg bg-slate-100
                           flex items-center justify-center">

                    <i
                        data-lucide="files"
                        class="w-5 h-5 text-slate-600">
                    </i>

                </div>

                <div class="flex-1">

                    <h4 class="font-semibold text-slate-900">
                        Otros documentos
                    </h4>

                    <p class="text-sm text-slate-500 mt-1">
                        Licencias, autorizaciones y otros documentos.
                    </p>

                    <button
                        type="button"
                        onclick="abrirFormularioDocumentacionVehiculo(
                            '${vehiculo.id}',
                            'otros'
                        )"
                        class="mt-4 inline-flex items-center gap-2
                               px-4 py-2 rounded-lg
                               bg-slate-100 text-slate-700
                               hover:bg-slate-200
                               text-sm font-semibold">

                        <i
                            data-lucide="plus"
                            class="w-4 h-4">
                        </i>

                        Añadir documento

                    </button>

                </div>

            </div>

        </div>

    </div>


    <div
        class="mt-6 rounded-xl border border-blue-100
               bg-blue-50 p-4">

        <div class="flex items-start gap-3">

            <i
                data-lucide="info"
                class="w-5 h-5 text-blue-600 mt-0.5">
            </i>

            <div>

                <p class="text-sm font-semibold text-blue-900">
                    Documentación centralizada
                </p>

                <p class="text-sm text-blue-800 mt-1">
                    Desde aquí podrás registrar la información,
                    adjuntar archivos y actualizar los documentos
                    asociados a este vehículo.
                </p>

            </div>

        </div>

    </div>

</div>


                <div
                    data-gestion-contenido="documentacion"
                    class="hidden">

                    <div class="text-center py-16">

                        <i
                            data-lucide="file-text"
                            class="w-10 h-10 mx-auto
                                   text-slate-300">
                        </i>

                        <h3 class="mt-4 text-lg font-bold
                                   text-slate-800">
                            Documentación
                        </h3>

                        <p class="mt-2 text-sm text-slate-500">
                            Esta sección se desarrollará en el siguiente paso.
                        </p>

                    </div>

                </div>


                <div
    data-gestion-contenido="seguros"
    class="hidden">

    <div class="mb-6">
        <h2 class="text-lg font-bold text-slate-800">
            Seguros del vehículo
        </h2>

        <p class="mt-1 text-sm text-slate-500">
            Gestiona los seguros asociados a este vehículo.
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- SEGURO DEL VEHÍCULO -->
        <div class="border border-slate-200 rounded-xl p-5 bg-white">

            <div class="flex items-start gap-3">

                <div class="w-10 h-10 rounded-xl bg-emerald-50
                            flex items-center justify-center shrink-0">
                    <i
                        data-lucide="shield-check"
                        class="w-5 h-5 text-emerald-600">
                    </i>
                </div>

                <div class="flex-1">

                    <h3 class="font-semibold text-slate-800">
                        Seguro del vehículo
                    </h3>

                    <p class="mt-1 text-sm text-slate-500">
                        Póliza y documentación del seguro obligatorio
                        del vehículo.
                    </p>

                    <button
                        type="button"
                        onclick="abrirFormularioDocumentacionVehiculo('${vehiculo.id}', 'seguro_vehiculo')"
                        class="mt-4 inline-flex items-center gap-2
                               px-4 py-2 rounded-lg
                               bg-emerald-50 text-emerald-700
                               text-sm font-semibold
                               hover:bg-emerald-100 transition">

                        <i
                            data-lucide="file-text"
                            class="w-4 h-4">
                        </i>

                        Gestionar seguro
                    </button>

                </div>
            </div>
        </div>


        <!-- SEGURO DE MERCANCÍAS / TRANSPORTE -->
        <div class="border border-slate-200 rounded-xl p-5 bg-white">

            <div class="flex items-start gap-3">

                <div class="w-10 h-10 rounded-xl bg-emerald-50
                            flex items-center justify-center shrink-0">
                    <i
                        data-lucide="shield-check"
                        class="w-5 h-5 text-emerald-600">
                    </i>
                </div>

                <div class="flex-1">

                    <h3 class="font-semibold text-slate-800">
                        Seguro de mercancías / transporte
                    </h3>

                    <p class="mt-1 text-sm text-slate-500">
                        Cobertura de mercancías y responsabilidad
                        asociada al transporte.
                    </p>

                    <button
                        type="button"
                        onclick="abrirFormularioDocumentacionVehiculo('${vehiculo.id}', 'seguro_transporte')"
                        class="mt-4 inline-flex items-center gap-2
                               px-4 py-2 rounded-lg
                               bg-emerald-50 text-emerald-700
                               text-sm font-semibold
                               hover:bg-emerald-100 transition">

                        <i
                            data-lucide="file-text"
                            class="w-4 h-4">
                        </i>

                        Gestionar seguro
                    </button>

                </div>
            </div>
        </div>

    </div>

    <div class="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">

        <div class="flex items-start gap-3">

            <i
                data-lucide="info"
                class="w-5 h-5 text-blue-600 mt-0.5 shrink-0">
            </i>

            <div>
                <p class="text-sm font-semibold text-blue-800">
                    Seguros centralizados
                </p>

                <p class="mt-1 text-sm text-blue-700">
                    Los seguros se gestionan desde esta ficha y utilizan
                    la documentación ya asociada al vehículo.
                </p>
            </div>

        </div>
    </div>
</div>

                </div>


                <div
    data-gestion-contenido="revisiones"
    class="hidden">

    <div class="space-y-5 px-5 sm:px-6 pb-6">

    <div>
        <h3 class="text-lg font-bold text-slate-900">
            Revisiones del vehículo
        </h3>

        <p class="text-sm text-slate-500 mt-1">
            Consulta y gestiona las revisiones e inspecciones del vehículo.
        </p>
    </div>


    <!-- ITV -->
    <div class="rounded-xl border border-slate-200 bg-white p-5">

        <div class="flex items-start justify-between gap-4">

            <div class="flex items-start gap-3">

                <div
                    class="w-11 h-11 rounded-xl bg-blue-50
                           flex items-center justify-center">

                    <i
                        data-lucide="clipboard-check"
                        class="w-5 h-5 text-blue-600">
                    </i>

                </div>

                <div>

                    <h4 class="font-semibold text-slate-900">
                        ITV
                    </h4>

                    <p class="text-sm text-slate-500 mt-1">
                        Inspección Técnica de Vehículos
                    </p>

                </div>

            </div>


            ${
                documentoITV
                    ? `
                        <span
                            class="inline-flex items-center px-3 py-1
                                   rounded-full text-xs font-semibold
                                   bg-emerald-50 text-emerald-700">
                            Registrada
                        </span>
                    `
                    : `
                        <span
                            class="inline-flex items-center px-3 py-1
                                   rounded-full text-xs font-semibold
                                   bg-amber-50 text-amber-700">
                            Pendiente
                        </span>
                    `
            }

        </div>


        <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">

            <!-- FECHA EMISIÓN -->
            <div
                class="rounded-lg border border-slate-100
                       bg-slate-50 p-4">

                <p class="text-xs font-semibold uppercase
                          tracking-wide text-slate-400">
                    Fecha de emisión
                </p>

                <p class="mt-2 text-sm font-semibold text-slate-800">
                    ${
                        documentoITV?.fecha_emision
                            ? formatearFecha(documentoITV.fecha_emision)
                            : "No indicada"
                    }
                </p>

            </div>


            <!-- FECHA CADUCIDAD -->
            <div
                class="rounded-lg border border-slate-100
                       bg-slate-50 p-4">

                <p class="text-xs font-semibold uppercase
                          tracking-wide text-slate-400">
                    Próxima ITV
                </p>

                <p class="mt-2 text-sm font-semibold text-slate-800">
                    ${
                        documentoITV?.fecha_caducidad
                            ? formatearFecha(documentoITV.fecha_caducidad)
                            : "No indicada"
                    }
                </p>

            </div>


            <!-- REFERENCIA -->
            <div
                class="rounded-lg border border-slate-100
                       bg-slate-50 p-4">

                <p class="text-xs font-semibold uppercase
                          tracking-wide text-slate-400">
                    Nº referencia
                </p>

                <p class="mt-2 text-sm font-semibold text-slate-800">
                    ${
                        documentoITV?.numero_referencia
                            || "No indicado"
                    }
                </p>

            </div>

        </div>


        <!-- ACCIONES -->
        <div
            class="mt-5 pt-5 border-t border-slate-100
                   flex flex-wrap items-center gap-3">

            <button
                type="button"
                onclick="abrirFormularioDocumentacionVehiculo(
                    '${vehiculo.id}',
                    'itv'
                )"
                class="inline-flex items-center gap-2
                       px-4 py-2 rounded-lg
                       bg-blue-600 text-white
                       hover:bg-blue-700
                       text-sm font-semibold">

                <i
                    data-lucide="file-edit"
                    class="w-4 h-4">
                </i>

                Gestionar ITV

            </button>


            ${
                documentoITV?.archivo_path
                    ? `
                        <button
                            type="button"
                            onclick="event.stopPropagation();
                                     verDocumentoVehiculo(
                                         '${documentoITV.archivo_path}'
                                     )"
                            class="inline-flex items-center gap-2
                                   px-4 py-2 rounded-lg
                                   bg-slate-100 text-slate-700
                                   hover:bg-slate-200
                                   text-sm font-semibold">

                            <i
                                data-lucide="eye"
                                class="w-4 h-4">
                            </i>

                            Ver documento

                        </button>
                    `
                    : ""
            }

        </div>

    </div>


    <!-- INFORMACIÓN -->
    <div
        class="rounded-xl border border-blue-100
               bg-blue-50 p-4">

        <div class="flex items-start gap-3">

            <i
                data-lucide="info"
                class="w-5 h-5 text-blue-600 mt-0.5">
            </i>

            <div>

                <p class="text-sm font-semibold text-blue-900">
                    Gestión de revisiones
                </p>

                <p class="text-sm text-blue-800 mt-1">
                    La ITV se gestiona desde esta sección y utiliza
                    el mismo documento registrado en Documentación.
                </p>

            </div>

        </div>

    </div>

</div>

                </div>


                <div
                    data-gestion-contenido="estadisticas"
                    class="hidden">

                    <div class="text-center py-16">

                        <i
                            data-lucide="bar-chart-3"
                            class="w-10 h-10 mx-auto
                                   text-slate-300">
                        </i>

                        <h3 class="mt-4 text-lg font-bold
                                   text-slate-800">
                            Estadísticas
                        </h3>

                        <p class="mt-2 text-sm text-slate-500">
                            Esta sección se desarrollará en el siguiente paso.
                        </p>

                    </div>

                </div>

            </div>


            <!-- PIE -->
            <div class="flex items-center justify-between
                        px-6 py-5 border-t border-slate-200
                        bg-white">

                <button
                    type="button"
                    onclick="editarVehiculo('${vehiculo.id}')"
                    class="px-5 py-3 rounded-xl
                           bg-blue-600 hover:bg-blue-700
                           text-white font-semibold">

                    Editar vehículo

                </button>

                <button
                    type="button"
                    onclick="cerrarGestionVehiculo()"
                    class="px-5 py-3 rounded-xl
                           border border-slate-300
                           text-slate-700 font-medium
                           hover:bg-slate-50">

                    Cerrar

                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);


    /* NAVEGACIÓN ENTRE PESTAÑAS */

    const botones =
        modal.querySelectorAll(".gestion-vehiculo-tab");

    const contenidos =
        modal.querySelectorAll("[data-gestion-contenido]");


    botones.forEach((boton) => {
    boton.addEventListener("click", async () => {

            const seccion =
                boton.getAttribute("data-gestion-tab");

            botones.forEach((b) => {

                b.classList.remove(
                    "text-blue-600",
                    "border-blue-600",
                    "font-semibold"
                );

                b.classList.add(
                    "text-slate-500",
                    "border-transparent",
                    "font-medium"
                );

            });


            boton.classList.remove(
                "text-slate-500",
                "border-transparent",
                "font-medium"
            );

            boton.classList.add(
                "text-blue-600",
                "border-blue-600",
                "font-semibold"
            );


            contenidos.forEach((contenido) => {

                contenido.classList.add("hidden");

            });


            const contenidoActivo =
                modal.querySelector(
                    `[data-gestion-contenido="${seccion}"]`
                );

            if (contenidoActivo) {
                contenidoActivo.classList.remove("hidden");
            }

            if (seccion === "fotografias") {
    await renderizarFotografiasVehiculo(modal, vehiculoId);
}

        });

    });


    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

}

/* ============================================================
   CONFIGURACIÓN DE FOTOGRAFÍAS
   ============================================================ */

const TIPOS_FOTOGRAFIAS_VEHICULO = [
    {
        tipo: "frontal",
        titulo: "Foto frontal",
        descripcion: "Vista frontal completa del vehículo.",
        icono: "car-front",
        orden: 1
    },
    {
        tipo: "trasera",
        titulo: "Foto trasera",
        descripcion: "Vista trasera completa del vehículo.",
        icono: "car-front",
        orden: 2
    },
    {
        tipo: "lateral_derecho",
        titulo: "Lateral derecho",
        descripcion: "Vista completa del lateral derecho.",
        icono: "move-horizontal",
        orden: 3
    },
    {
        tipo: "lateral_izquierdo",
        titulo: "Lateral izquierdo",
        descripcion: "Vista completa del lateral izquierdo.",
        icono: "move-horizontal",
        orden: 4
    },
    {
        tipo: "interior",
        titulo: "Interior",
        descripcion: "Fotografía del interior de la cabina.",
        icono: "armchair",
        orden: 5
    },
    {
        tipo: "zona_carga",
        titulo: "Zona de carga",
        descripcion: "Vista de la zona de carga del vehículo.",
        icono: "package-open",
        orden: 6
    },
    {
        tipo: "otras",
        titulo: "Otras fotografías",
        descripcion: "Otra imagen relevante del vehículo.",
        icono: "images",
        orden: 7
    }
];

/* ============================================================
   CARGAR FOTOGRAFÍAS DEL VEHÍCULO
   ============================================================ */

async function cargarFotografiasVehiculo(vehiculoId) {

    if (!vehiculoId) {
        console.error(
            "RODAX Vehículos: no se recibió el id del vehículo."
        );
        return [];
    }

    const cliente = window.dbClient;

    if (!cliente) {
        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );
        return [];
    }

    const {
        data: fotografias,
        error
    } = await cliente
        .from("vehiculos_fotografias")
        .select("*")
        .eq("vehiculo_id", vehiculoId)
        .order("orden", {
            ascending: true
        })
        .order("creado_en", {
            ascending: true
        });

    if (error) {
        console.error(
            "RODAX Vehículos: error cargando fotografías:",
            error
        );

        return [];
    }

    console.log(
        "RODAX Vehículos - fotografías cargadas:",
        fotografias
    );

    return fotografias || [];
}

/* ============================================================
   RENDERIZAR FOTOGRAFÍAS
   ============================================================ */

async function renderizarFotografiasVehiculo(modal, vehiculoId) {

    const contenedor =
        modal?.querySelector("#vehiculo-fotografias-contenedor");

    if (!contenedor) {
        console.error(
            "RODAX Vehículos: no se encontró el contenedor de fotografías."
        );
        return;
    }

    const fotografias =
        await cargarFotografiasVehiculo(vehiculoId);

    const fotografiasPorTipo = {};

    fotografias.forEach((foto) => {
        fotografiasPorTipo[foto.tipo_fotografia] = foto;
    });

    contenedor.innerHTML =
        TIPOS_FOTOGRAFIAS_VEHICULO.map((config) => {

            const foto =
                fotografiasPorTipo[config.tipo];

            let imagenUrl = "";

            if (foto?.archivo_path && window.dbClient) {

                const resultado =
                    window.dbClient.storage
                        .from("documentos")
                        .getPublicUrl(foto.archivo_path);

                imagenUrl =
                    resultado?.data?.publicUrl || "";
            }

            return `
                <div class="rounded-2xl border border-slate-200
                            bg-white overflow-hidden shadow-sm">

                    <div class="relative aspect-video bg-slate-100
                                flex items-center justify-center
                                overflow-hidden">

                        ${
                            imagenUrl
                                ? `
                                    <img
                                        src="${imagenUrl}"
                                        alt="${config.titulo}"
                                        class="w-full h-full object-cover">
                                  `
                                : `
                                    <div class="text-center">

                                        <i
                                            data-lucide="${config.icono}"
                                            class="w-10 h-10 mx-auto
                                                   text-slate-300">
                                        </i>

                                        <p class="mt-2 text-xs
                                                  text-slate-400">
                                            Sin fotografía
                                        </p>

                                    </div>
                                  `
                        }

                    </div>

                    <div class="p-4">

                        <div class="flex items-start
                                    justify-between gap-3">

                            <div>
                                <h4 class="font-semibold text-slate-900">
                                    ${config.titulo}
                                </h4>

                                <p class="text-sm text-slate-500 mt-1">
                                    ${config.descripcion}
                                </p>
                            </div>

                            ${
                                foto?.archivo_path
                                    ? `
                                        <span
                                            class="shrink-0 inline-flex
                                                   items-center gap-1
                                                   px-2 py-1 rounded-full
                                                   bg-emerald-50
                                                   text-emerald-700
                                                   text-xs font-semibold">

                                            <i
                                                data-lucide="check"
                                                class="w-3.5 h-3.5">
                                            </i>

                                            Añadida

                                        </span>
                                      `
                                    : `
                                        <span
                                            class="shrink-0 inline-flex
                                                   px-2 py-1 rounded-full
                                                   bg-slate-100
                                                   text-slate-500
                                                   text-xs font-semibold">

                                            Pendiente

                                        </span>
                                      `
                            }

                        </div>

                        <div class="mt-4 flex gap-2">

                            <label
                                class="flex-1 inline-flex
                                       items-center justify-center
                                       gap-2 px-4 py-2.5
                                       rounded-xl bg-blue-600
                                       hover:bg-blue-700 text-white
                                       font-semibold text-sm
                                       cursor-pointer transition">

                                <i
                                    data-lucide="upload"
                                    class="w-4 h-4">
                                </i>

                                ${
                                    foto?.archivo_path
                                        ? "Cambiar fotografía"
                                        : "Subir fotografía"
                                }

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    class="hidden"
                                    onchange="subirFotografiaVehiculo(
                                        '${vehiculoId}',
                                        '${config.tipo}',
                                        ${config.orden},
                                        this
                                    )">

                            </label>

                            ${
                                foto?.archivo_path
                                    ? `
                                        <button
                                            type="button"
                                            onclick="eliminarFotografiaVehiculo(
    '${vehiculoId}',
    '${foto.id}',
    '${foto.archivo_path}',
    this
)"
                                            class="inline-flex
                                                   items-center
                                                   justify-center
                                                   px-3 rounded-xl
                                                   bg-red-50
                                                   text-red-600
                                                   hover:bg-red-100">

                                            <i
                                                data-lucide="trash-2"
                                                class="w-4 h-4">
                                            </i>

                                        </button>
                                      `
                                    : ""
                            }

                        </div>

                    </div>

                </div>
            `;

        }).join("");

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}


/* ============================================================
   SUBIR / CAMBIAR FOTOGRAFÍA
   ============================================================ */

async function subirFotografiaVehiculo(
    vehiculoId,
    tipoFotografia,
    orden,
    input
) {

    const archivo = input?.files?.[0];

    if (!archivo) {
        return;
    }

    if (!archivo.type.startsWith("image/")) {
        alert("El archivo seleccionado no es una imagen válida.");
        input.value = "";
        return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
        alert("La fotografía no puede superar los 10 MB.");
        input.value = "";
        return;
    }

    const cliente = window.dbClient;

    if (!cliente) {
        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );
        return;
    }

    try {

        const {
            data: fotografiaAnterior,
            error: errorAnterior
        } = await cliente
            .from("vehiculos_fotografias")
            .select("id, archivo_path")
            .eq("vehiculo_id", vehiculoId)
            .eq("tipo_fotografia", tipoFotografia)
            .maybeSingle();

        if (errorAnterior) {
            console.error(
                "RODAX Vehículos: error comprobando fotografía:",
                errorAnterior
            );
            alert(
                "No se ha podido comprobar la fotografía actual."
            );
            return;
        }

        const extension =
            archivo.name
                .split(".")
                .pop()
                .toLowerCase();

        const nombreSeguro =
            archivo.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9_-]/g, "_")
                .substring(0, 60);

        const nombreFinal =
            `${tipoFotografia}-${Date.now()}-${nombreSeguro}.${extension}`;

        const ruta =
            `vehiculos/${vehiculoId}/fotografias/${nombreFinal}`;

        const {
            error: errorStorage
        } = await cliente.storage
            .from("documentos")
            .upload(
                ruta,
                archivo,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: archivo.type
                }
            );

        if (errorStorage) {
            console.error(
                "RODAX Vehículos: error subiendo fotografía:",
                errorStorage
            );
            alert("No se ha podido subir la fotografía.");
            return;
        }

        if (fotografiaAnterior) {

            const {
                error: errorUpdate
            } = await cliente
                .from("vehiculos_fotografias")
                .update({
                    archivo_path: ruta,
                    nombre_archivo: archivo.name,
                    orden: orden,
                    actualizado_en:
                        new Date().toISOString()
                })
                .eq("id", fotografiaAnterior.id);

            if (errorUpdate) {

                await cliente.storage
                    .from("documentos")
                    .remove([ruta]);

                console.error(
                    "RODAX Vehículos: error actualizando fotografía:",
                    errorUpdate
                );

                alert(
                    "No se pudo actualizar el registro de la fotografía."
                );

                return;
            }

            if (fotografiaAnterior.archivo_path) {

                await cliente.storage
                    .from("documentos")
                    .remove([
                        fotografiaAnterior.archivo_path
                    ]);
            }

        } else {

            const {
                error: errorInsert
            } = await cliente
                .from("vehiculos_fotografias")
                .insert({
                    vehiculo_id: vehiculoId,
                    tipo_fotografia: tipoFotografia,
                    archivo_path: ruta,
                    nombre_archivo: archivo.name,
                    orden: orden
                });

            if (errorInsert) {

                await cliente.storage
                    .from("documentos")
                    .remove([ruta]);

                console.error(
                    "RODAX Vehículos: error guardando fotografía:",
                    errorInsert
                );

                alert(
                    "La fotografía se subió, pero no se pudo guardar."
                );

                return;
            }
        }

        const modal =
            input.closest(".fixed");

        if (modal) {
            await renderizarFotografiasVehiculo(
                modal,
                vehiculoId
            );
        }

    } catch (error) {

        console.error(
            "RODAX Vehículos: error inesperado:",
            error
        );

        alert(
            "Se ha producido un error al subir la fotografía."
        );

    } finally {

        input.value = "";
    }
}


/* ============================================================
   ELIMINAR FOTOGRAFÍA
   ============================================================ */

async function eliminarFotografiaVehiculo(
    vehiculoId,
    fotografiaId,
    archivoPath,
    boton
) {

    if (!confirm(
        "¿Quieres eliminar esta fotografía del vehículo?"
    )) {
        return;
    }

    const cliente = window.dbClient;

    if (!cliente) {
        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );
        return;
    }

    try {

        const {
            error: errorDelete
        } = await cliente
            .from("vehiculos_fotografias")
            .delete()
            .eq("id", fotografiaId)
            .eq("vehiculo_id", vehiculoId);

        if (errorDelete) {

            console.error(
                "RODAX Vehículos: error eliminando fotografía:",
                errorDelete
            );

            alert(
                "No se ha podido eliminar la fotografía."
            );

            return;
        }

        if (archivoPath) {

            const {
                error: errorStorage
            } = await cliente.storage
                .from("documentos")
                .remove([archivoPath]);

            if (errorStorage) {

                console.warn(
                    "RODAX Vehículos: registro eliminado, " +
                    "pero no se pudo eliminar el archivo de Storage:",
                    errorStorage
                );
            }
        }

       /*
 * Obtener directamente el modal de gestión del vehículo.
 */
const modal =
    document.getElementById("modal-gestionar-vehiculo");

        if (!modal) {

            console.error(
                "RODAX Vehículos: no se encontró el modal " +
                "de gestión del vehículo."
            );

            return;
        }

        /*
         * Volver a cargar inmediatamente las fotografías.
         * La fotografía eliminada ya no existe en Supabase,
         * por lo que desaparecerá de la interfaz sin
         * necesidad de actualizar la página.
         */
        await renderizarFotografiasVehiculo(
            modal,
            vehiculoId
        );

        console.log(
            "RODAX Vehículos: fotografía eliminada correctamente."
        );

    } catch (error) {

        console.error(
            "RODAX Vehículos: error eliminando fotografía:",
            error
        );

        alert(
            "Se ha producido un error al eliminar la fotografía."
        );
    }
}


/* ============================================================
   EXPONER FUNCIONES
   ============================================================ */

window.renderizarFotografiasVehiculo =
    renderizarFotografiasVehiculo;

window.subirFotografiaVehiculo =
    subirFotografiaVehiculo;

window.eliminarFotografiaVehiculo =
    eliminarFotografiaVehiculo;

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

async function subirDocumentoVehiculo(documentoId, vehiculoId, tipoDocumento) {

    console.log(
        "RODAX Vehículos — iniciar subida:",
        {
            documentoId,
            vehiculoId,
            tipoDocumento
        }
    );

    /*
     * Si todavía no existe el registro documental,
     * primero registramos los datos del documento.
     */
    if (!documentoId) {

        abrirFormularioDocumentacionVehiculo(
            vehiculoId,
            tipoDocumento
        );

        return;
    }

    const cliente = window.dbClient;

    if (!cliente) {

        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );

        alert(
            "No se ha podido conectar con el sistema."
        );

        return;
    }

        /*
     * Obtener la ruta del archivo actual
     * para poder eliminarlo después de sustituirlo.
     */
    let archivoAnterior = null;

    const {
        data: documentoActual,
        error: errorDocumentoActual
    } = await cliente
        .from("vehiculos_documentacion")
        .select("archivo_path")
        .eq("id", documentoId)
        .single();

    if (errorDocumentoActual) {

        console.error(
            "RODAX Vehículos: error obteniendo el archivo actual:",
            errorDocumentoActual
        );

        alert(
            "No se ha podido comprobar el documento actual.\n\n" +
            errorDocumentoActual.message
        );

        return;
    }

    archivoAnterior =
        documentoActual?.archivo_path || null;

    /*
     * Selector de archivo
     */
    const inputArchivo =
        document.createElement("input");

    inputArchivo.type = "file";

    inputArchivo.accept =
        ".pdf,.jpg,.jpeg,.png,.webp";

    inputArchivo.style.display = "none";

    inputArchivo.addEventListener(
        "change",
        async function () {

            const archivo =
                inputArchivo.files?.[0];

            if (!archivo) {
                return;
            }

            /*
             * Límite inicial: 10 MB
             */
            const TAMANO_MAXIMO =
                10 * 1024 * 1024;

            if (archivo.size > TAMANO_MAXIMO) {

                alert(
                    "El archivo supera el límite de 10 MB."
                );

                return;
            }

            try {

                /*
                 * Obtener transportista
                 */
                const transportistaId =
                    window.Transportista?.currentUserId ||
                    window.currentUserId ||
                    null;

                if (!transportistaId) {

                    console.error(
                        "RODAX Vehículos: no se ha podido obtener el transportista_id."
                    );

                    alert(
                        "No se ha podido identificar al transportista."
                    );

                    return;
                }

                /*
                 * Obtener extensión
                 */
                const partesNombre =
                    archivo.name.split(".");

                const extension =
                    partesNombre.length > 1
                        ? partesNombre.pop().toLowerCase()
                        : "archivo";

                /*
                 * Nombre único del archivo
                 */
                const nombreArchivo =
                    `${Date.now()}-${Math.random()
                        .toString(36)
                        .substring(2, 10)}.${extension}`;

                /*
                 * Ruta organizada del documento
                 */
                const rutaArchivo =
                    `documentos-vehiculos/${transportistaId}/${vehiculoId}/${tipoDocumento}/${nombreArchivo}`;

                console.log(
                    "RODAX Vehículos — subiendo archivo:",
                    rutaArchivo
                );

                /*
                 * Subir a Supabase Storage
                 */
                const {
                    error: errorSubida
                } = await cliente.storage
                    .from("documentos")
                    .upload(
                        rutaArchivo,
                        archivo,
                        {
                            cacheControl: "3600",
                            upsert: false
                        }
                    );

                if (errorSubida) {

                    console.error(
                        "RODAX Vehículos: error subiendo archivo:",
                        errorSubida
                    );

                    alert(
                        "No se ha podido subir el documento.\n\n" +
                        errorSubida.message
                    );

                    return;
                }

                /*
                 * Guardar la ruta en vehiculos_documentacion
                 */
                const {
                    error: errorActualizacion
                } = await cliente
                    .from("vehiculos_documentacion")
                    .update({
                        archivo_path: rutaArchivo
                    })
                    .eq("id", documentoId);

                if (errorActualizacion) {

                    console.error(
                        "RODAX Vehículos: error actualizando documento:",
                        errorActualizacion
                    );

                    alert(
                        "El archivo se ha subido, pero no se ha podido vincular al documento.\n\n" +
                        errorActualizacion.message
                    );

                    return;
                }
                
/*
 * Eliminar el archivo anterior de Storage
 * solo después de haber vinculado correctamente
 * el nuevo archivo.
 */
if (
    archivoAnterior &&
    archivoAnterior !== rutaArchivo
) {

    const {
        error: errorEliminacion
    } = await cliente.storage
        .from("documentos")
        .remove([
            archivoAnterior
        ]);

    if (errorEliminacion) {

        console.warn(
            "RODAX Vehículos: el nuevo documento está correctamente vinculado, pero no se pudo eliminar el archivo anterior:",
            errorEliminacion
        );

    } else {

        console.log(
            "RODAX Vehículos — archivo anterior eliminado:",
            archivoAnterior
        );
    }
}

                console.log(
                    "RODAX Vehículos — documento subido correctamente:",
                    rutaArchivo
                );

                alert(
                    "Documento subido correctamente."
                );

                /*
                 * Recargar documentación
                 */
                cargarDocumentacionVehiculos(
                    transportistaId
                );

            } catch (error) {

                console.error(
                    "RODAX Vehículos: error inesperado durante la subida:",
                    error
                );

                alert(
                    "Se ha producido un error al subir el documento."
                );
            }
        }
    );

    document.body.appendChild(inputArchivo);

    inputArchivo.click();

    setTimeout(() => {
        inputArchivo.remove();
    }, 1000);
}

function verDocumentoVehiculo(archivoPath) {

    if (!archivoPath) {

        alert(
            "Este documento no tiene ningún archivo asociado."
        );

        return;
    }

    const cliente = window.dbClient;

    if (!cliente) {

        console.error(
            "RODAX Vehículos: no se encontró dbClient."
        );

        alert(
            "No se ha podido conectar con el sistema."
        );

        return;
    }

    const { data } =
        cliente.storage
            .from("documentos")
            .getPublicUrl(archivoPath);

    if (!data?.publicUrl) {

        alert(
            "No se ha podido obtener el documento."
        );

        return;
    }

    window.open(
        data.publicUrl,
        "_blank",
        "noopener,noreferrer"
    );
}

window.subirDocumentoVehiculo =
    subirDocumentoVehiculo;

window.verDocumentoVehiculo =
    verDocumentoVehiculo;

})();
