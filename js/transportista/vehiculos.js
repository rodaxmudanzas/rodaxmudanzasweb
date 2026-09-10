(function () {

    async function cargarMisVehiculos() {

        const contenedor = document.getElementById(
            "mis-vehiculos-contenido"
        );

        if (!contenedor) {
            return;
        }

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
                        class="flex items-center gap-2 px-6 py-3 rounded-xl
                               bg-blue-600 hover:bg-blue-700 text-white
                               font-semibold shadow-sm transition">

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
                                    0
                                </div>

                                <div class="text-xs text-slate-500">
                                    Sin vehículos cargados
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

})();
