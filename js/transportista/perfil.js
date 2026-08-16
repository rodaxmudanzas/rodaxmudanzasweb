/**

 * ==========================================================

 * RODAX Marketplace

 * Archivo : js/transportista/perfil.js

 * Módulo  : Mi perfil + Equipo / Operarios

 * ==========================================================

 *

 * La sección Equipo / Operarios queda preparada para una

 * futura tabla de operarios en Supabase.

 *

 * NO se realiza ninguna consulta de operarios mientras

 * dicha estructura no exista.

 * ==========================================================

 */

 

(function (window) {

 

    "use strict";

 

 

    ////////////////////////////////////////////////////////////

    // OBTENER CLIENTE SUPABASE

    ////////////////////////////////////////////////////////////

 

    function obtenerSupabase() {

 

        if (window.supabaseClient) {

            return window.supabaseClient;

        }

 

        if (window.dbClient) {

            return window.dbClient;

        }

 

        if (

            window.RODAX &&

            window.RODAX.supabaseClient

        ) {

            return window.RODAX.supabaseClient;

        }

 

        if (

            window.RODAX &&

            window.RODAX.supabase

        ) {

            return window.RODAX.supabase;

        }

 

        return null;

    }

 

 

    ////////////////////////////////////////////////////////////

    // OBTENER ID DEL TRANSPORTISTA

    ////////////////////////////////////////////////////////////

 

    function obtenerTransportistaId() {

 

        if (window.currentUserId) {

            return window.currentUserId;

        }

 

        if (

            window.Transportista &&

            window.Transportista.currentUserId

        ) {

            return window.Transportista.currentUserId;

        }

 

        if (

            window.transportista &&

            window.transportista.currentUserId

        ) {

            return window.transportista.currentUserId;

        }

 

        if (

            window.RODAX &&

            window.RODAX.state &&

            typeof window.RODAX.state.get === "function"

        ) {

 

            return (

 

                window.RODAX.state.get(

                    "auth.user.id"

                )

 

                ||

 

                window.RODAX.state.get(

                    "transportista.id"

                )

 

                ||

 

                window.RODAX.state.get(

                    "user.id"

                )

 

                ||

 

                null

 

            );

        }

 

        return null;

    }

 

 

    ////////////////////////////////////////////////////////////

    // ESCAPAR HTML

    ////////////////////////////////////////////////////////////

 

    function escaparHTML(valor) {

 

        return String(valor ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }

 

 

    ////////////////////////////////////////////////////////////

    // CARGAR PERFIL

    ////////////////////////////////////////////////////////////

 

    async function cargarPerfil() {

 

        const contenedor =

            document.getElementById(

                "perfil-contenido"

            );

 

        if (!contenedor) {

            return;

        }

 

 

        const supabase =

            obtenerSupabase();

 

        const transportistaId =

            obtenerTransportistaId();

 

 

        ////////////////////////////////////////////////////////

        // COMPROBAR CONEXIÓN

        ////////////////////////////////////////////////////////

 

        if (!supabase) {

 

            contenedor.innerHTML = `

 

                <div class="

                    bg-white

                    rounded-2xl

                    border

                    border-red-200

                    p-6

                ">

 

                    <div class="

                        font-bold

                        text-red-600

                    ">

                        No se pudo conectar con Supabase.

                    </div>

 

                </div>

            `;

 

            return;

        }

 

 

        ////////////////////////////////////////////////////////

        // COMPROBAR USUARIO

        ////////////////////////////////////////////////////////

 

        if (!transportistaId) {

 

            contenedor.innerHTML = `

 

                <div class="

                    bg-white

                    rounded-2xl

                    border

                    border-slate-200

                    p-6

                    text-sm

                    text-slate-500

                ">

                    No se ha podido identificar al transportista.

                </div>

 

            `;

 

            return;

        }

 

 

        ////////////////////////////////////////////////////////

        // CARGANDO

        ////////////////////////////////////////////////////////

 

        contenedor.innerHTML = `

 

            <div class="

                py-12

                text-center

                text-slate-400

            ">

 

                Cargando perfil...

 

            </div>

 

        `;

 

 

        try {

 

            ////////////////////////////////////////////////////

            // CONSULTAR TRANSPORTISTA

            ////////////////////////////////////////////////////

 

            const {

                data,

                error

            } = await supabase

 

                .from("transportistas")

 

                .select("*")

 

                .eq(

                    "id",

                    transportistaId

                )

 

                .maybeSingle();

 

 

            if (error) {

                throw error;

            }

 

 

            const perfil =

                data || {};

 

 

            ////////////////////////////////////////////////////

            // RENDER DEL PERFIL

            ////////////////////////////////////////////////////

 

            contenedor.innerHTML = `

 

                <div class="space-y-6">

 

 

                    <!-- ===================================== -->

                    <!-- MI PERFIL -->

                    <!-- ===================================== -->

 

                    <section class="

                        bg-white

                        rounded-2xl

                        border

                        border-slate-200

                        shadow-sm

                        p-6

                    ">

 

 

                        <div class="

                            flex

                            items-center

                            gap-3

                            mb-6

                        ">

 

                            <div class="

                                w-10

                                h-10

                                rounded-xl

                                bg-blue-50

                                flex

                                items-center

                                justify-center

                            ">

 

                                <i

                                    data-lucide="user"

                                    class="w-5 h-5 text-blue-600">

                                </i>

 

                            </div>

 

 

                            <div>

 

                                <h2 class="

                                    text-lg

                                    font-black

                                    text-slate-800

                                ">

                                    Mi perfil

                                </h2>

 

 

                                <p class="

                                    text-xs

                                    text-slate-500

                                ">

                                    Información de tu cuenta

                                    de transportista.

                                </p>

 

                            </div>

 

                        </div>

 

 

                        <div class="

                            grid

                            grid-cols-1

                            md:grid-cols-2

                            gap-4

                        ">

 

 

                            <!-- NOMBRE -->

 

                            <div class="

                                rounded-xl

                                bg-slate-50

                                border

                                border-slate-200

                                p-4

                            ">

 

                                <div class="

                                    text-[10px]

                                    uppercase

                                    tracking-wider

                                    text-slate-400

                                    font-black

                                ">

                                    Nombre

                                </div>

 

                                <div class="

                                    font-bold

                                    text-slate-800

                                    mt-1

                                ">

                                    ${escaparHTML(

                                        perfil.nombre || "—"

                                    )}

                                </div>

 

                            </div>

 

 

                            <!-- EMAIL -->

 

                            <div class="

                                rounded-xl

                                bg-slate-50

                                border

                                border-slate-200

                                p-4

                            ">

 

                                <div class="

                                    text-[10px]

                                    uppercase

                                    tracking-wider

                                    text-slate-400

                                    font-black

                                ">

                                    Email

                                </div>

 

                                <div class="

                                    font-bold

                                    text-slate-800

                                    mt-1

                                ">

                                    ${escaparHTML(

                                        perfil.email || "—"

                                    )}

                                </div>

 

                            </div>

 

 

                            <!-- TELÉFONO -->

 

                            <div class="

                                rounded-xl

                                bg-slate-50

                                border

                                border-slate-200

                                p-4

                            ">

 

                                <div class="

                                    text-[10px]

                                    uppercase

                                    tracking-wider

                                    text-slate-400

                                    font-black

                                ">

                                    Teléfono

                                </div>

 

                                <div class="

                                    font-bold

                                    text-slate-800

                                    mt-1

                                ">

                                    ${escaparHTML(

                                        perfil.telefono ||

                                        perfil.phone ||

                                        "—"

                                    )}

                                </div>

 

                            </div>

 

 

                            <!-- DISPONIBILIDAD -->

 

                            <div class="

                                rounded-xl

                                bg-slate-50

                                border

                                border-slate-200

                                p-4

                            ">

 

                                <div class="

                                    text-[10px]

                                    uppercase

                                    tracking-wider

                                    text-slate-400

                                    font-black

                                ">

                                    Disponibilidad

                                </div>

 

                                <div class="

                                    font-bold

                                    text-emerald-600

                                    mt-1

                                ">

                                    ${escaparHTML(

                                        perfil.disponibilidad ||

                                        "—"

                                    )}

                                </div>

 

                            </div>

 

 

                        </div>

 

                    </section>

 

 

 

                    <!-- ===================================== -->

                    <!-- EQUIPO / OPERARIOS -->

                    <!-- ===================================== -->

 

                    <section class="

                        bg-white

                        rounded-2xl

                        border

                        border-slate-200

                        shadow-sm

                        p-6

                    ">

 

 

                        <div class="

                            flex

                            items-center

                            gap-3

                            mb-5

                        ">

 

 

                            <div class="

                                w-10

                                h-10

                                rounded-xl

                                bg-violet-50

                                flex

                                items-center

                                justify-center

                            ">

 

                                <i

                                    data-lucide="users"

                                    class="w-5 h-5 text-violet-600">

                                </i>

 

                            </div>

 

 

                            <div>

 

                                <h2 class="

                                    text-lg

                                    font-black

                                    text-slate-800

                                ">

                                    Equipo / Operarios

                                </h2>

 

 

                                <p class="

                                    text-xs

                                    text-slate-500

                                ">

                                    Gestiona los miembros

                                    que trabajan contigo.

                                </p>

 

                            </div>

 

                        </div>

 

 

                        <div

                            id="equipo-contenido"

                            class="

                                rounded-xl

                                border

                                border-dashed

                                border-slate-300

                                bg-slate-50

                                p-6

                            "

                        >

 

                            <div class="

                                flex

                                items-start

                                gap-3

                            ">

 

 

                                <i

                                    data-lucide="users-round"

                                    class="

                                        w-5

                                        h-5

                                        text-violet-500

                                        mt-0.5

                                        shrink-0

                                    ">

                                </i>

 

 

                                <div>

 

                                    <div class="

                                        font-bold

                                        text-slate-700

                                    ">

                                        Sin operarios registrados

                                    </div>

 

 

                                    <div class="

                                        mt-1

                                        text-sm

                                        text-slate-500

                                        leading-6

                                    ">

                                        Este apartado está preparado

                                        para gestionar tu equipo.

                                        La consulta de operarios

                                        quedará habilitada cuando

                                        se defina la estructura

                                        correspondiente en Supabase.

                                    </div>

 

                                </div>

 

                            </div>

 

                        </div>

 

                    </section>

 

 

                </div>

 

            `;

 

 

            ////////////////////////////////////////////////////

            // ICONOS LUCIDE

            ////////////////////////////////////////////////////

 

            if (

                window.lucide &&

                typeof window.lucide.createIcons === "function"

            ) {

 

                window.lucide.createIcons();

 

            }

 

 

        }

 

        catch (error) {

 

            console.error(

                "Error cargando perfil:",

                error

            );

 

 

            contenedor.innerHTML = `

 

                <div class="

                    bg-white

                    rounded-2xl

                    border

                    border-red-200

                    p-8

                    text-center

                ">

 

                    <p class="

                        text-red-600

                        font-bold

                    ">

                        No se pudo cargar Mi perfil.

                    </p>

 

 

                    <p class="

                        text-sm

                        text-slate-400

                        mt-2

                    ">

                        ${escaparHTML(

                            error.message ||

                            "Error desconocido"

                        )}

                    </p>

 

                </div>

 

            `;

 

        }

 

    }

 

 

    ////////////////////////////////////////////////////////////

    // EXPONER FUNCIÓN

    ////////////////////////////////////////////////////////////

 

    window.cargarPerfil =

        cargarPerfil;

 

})(window);