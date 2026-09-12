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


                    <!-- ESTADO INICIAL -->
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
                            Registra tu primer vehículo para gestionar su
                            documentación, seguros y revisiones desde aquí.
                        </p>

                        <button
                            type="button"
                            class="inline-flex items-center gap-2 px-6 py-3
                                   rounded-xl bg-blue-600 hover:bg-blue-700
                                   text-white font-semibold transition">

                            <i data-lucide="plus" class="w-5 h-5"></i>

                            Registrar vehículo

                        </button>

                    </div>

                </div>

            </div>
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    }

    window.cargarMisVehiculos = cargarMisVehiculos;

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

}

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
