/**

 * ==========================================================

 * RODAX Marketplace

 * Archivo : js/transportista/perfil.js

  * Módulo  : Mi perfil

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
    justify-between
    gap-4
    mb-6
">

    <!-- IZQUIERDA: ICONO + TÍTULO -->
    <div class="
        flex
        items-center
        gap-3
    ">

        <div class="
            w-10
            h-10
            rounded-xl
            bg-blue-50
            flex
            items-center
            justify-center
            shrink-0
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


    <!-- DERECHA: EDITAR PERFIL -->
    <button
        type="button"
        onclick="editarPerfil()"
        class="
            inline-flex
            items-center
            gap-2
            px-4
            py-2
            rounded-xl
            bg-slate-900
            text-white
            text-sm
            font-semibold
            hover:bg-slate-800
            transition
            shrink-0
        "
    >

        <i
            data-lucide="pencil"
            class="w-4 h-4">
        </i>

        Editar perfil

    </button>

</div>


                        <div class="

                            grid

                            grid-cols-1

                            md:grid-cols-2

                            gap-4

                        ">

 

 

                            <!-- NOMBRE COMERCIAL -->

<div class="
    rounded-xl
    bg-blue-50
    border
    border-blue-100
    p-4
">

    <div class="
        text-[10px]
        uppercase
        tracking-wider
        text-blue-500
        font-black
    ">
        Nombre comercial
    </div>

    <div class="
        font-bold
        text-slate-800
        mt-1
    ">
        ${escaparHTML(
            perfil.nombre_comercial || "Sin definir"
        )}
    </div>

</div>


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


 <!-- DIRECCIÓN / UBICACIÓN -->

<div class="
    md:col-span-2
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
        Dirección
    </div>

    <div class="
        font-bold
        text-slate-800
        mt-1
    ">
        ${escaparHTML(
            perfil.direccion || "—"
        )}
    </div>

    <div class="
        text-xs
        text-slate-500
        mt-1
    ">
        ${escaparHTML(
            [
                perfil.ciudad,
                perfil.codigo_postal,
                perfil.provincia
            ].filter(Boolean).join(" · ") ||
            "Ubicación no indicada"
        )}
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
    // EDITAR PERFIL
    ////////////////////////////////////////////////////////////

    async function editarPerfil() {

        const supabase = obtenerSupabase();
        const transportistaId = obtenerTransportistaId();

        if (!supabase || !transportistaId) {
            console.error(
                "No se pudo obtener Supabase o el ID del transportista."
            );
            return;
        }

        try {

            const {
                data: perfil,
                error
            } = await supabase
                .from("transportistas")
                .select("*")
                .eq("id", transportistaId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!perfil) {
                alert("No se encontró la información del transportista.");
                return;
            }

            const modalExistente =
                document.getElementById("modal-editar-perfil");

            if (modalExistente) {
                modalExistente.remove();
            }

            const modal = document.createElement("div");

            modal.id = "modal-editar-perfil";

            modal.className = `
                fixed
                inset-0
                z-[9999]
                bg-slate-900/50
                flex
                items-center
                justify-center
                p-4
            `;

            modal.innerHTML = `

                <div
                    class="
                        w-full
                        max-w-2xl
                        bg-white
                        rounded-2xl
                        shadow-2xl
                        border
                        border-slate-200
                        overflow-hidden
                    "
                >

                    <!-- CABECERA -->

                    <div
                        class="
                            flex
                            items-center
                            justify-between
                            px-6
                            py-5
                            border-b
                            border-slate-200
                        "
                    >

                        <div>

                            <h2
                                class="
                                    text-lg
                                    font-black
                                    text-slate-800
                                "
                            >
                                Editar perfil
                            </h2>

                            <p
                                class="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                "
                            >
                                Actualiza los datos básicos de tu perfil de transportista.
                            </p>

                        </div>

                        <button
                            type="button"
                            onclick="cerrarEditarPerfil()"
                            class="
                                w-9
                                h-9
                                rounded-xl
                                flex
                                items-center
                                justify-center
                                text-slate-400
                                hover:bg-slate-100
                                hover:text-slate-700
                            "
                        >
                            <i
                                data-lucide="x"
                                class="w-5 h-5"
                            ></i>
                        </button>

                    </div>


                    <!-- FORMULARIO -->

                    <form
                        id="form-editar-perfil"
                        class="p-6"
                    >

                        <div
                            class="
                                grid
                                grid-cols-1
                                md:grid-cols-2
                                gap-4
                            "
                        >

                            <!-- NOMBRE COMERCIAL -->

                            <div class="md:col-span-2">

                                <label
                                    class="
                                        block
                                        text-xs
                                        font-bold
                                        text-slate-600
                                        mb-2
                                    "
                                >
                                    Nombre comercial
                                </label>

                                <input
                                    id="editar-nombre-comercial"
                                    type="text"
                                    maxlength="80"
                                    value="${escaparHTML(
                                        perfil.nombre_comercial || ""
                                    )}"
                                    placeholder="Ej.: FLORES18"
                                    class="
                                        w-full
                                        px-4
                                        py-3
                                        rounded-xl
                                        border
                                        border-slate-300
                                        text-sm
                                        font-semibold
                                        text-slate-800
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-blue-500
                                        focus:border-blue-500
                                    "
                                >

                                <p
                                    class="
                                        text-[11px]
                                        text-slate-400
                                        mt-2
                                    "
                                >
                                    Este será el nombre con el que te identificarán
                                    como transportista en RODAX.
                                </p>

                            </div>


                            <!-- NOMBRE -->

                            <div>

                                <label
                                    class="
                                        block
                                        text-xs
                                        font-bold
                                        text-slate-600
                                        mb-2
                                    "
                                >
                                    Nombre
                                </label>

                                <input
                                    id="editar-nombre"
                                    type="text"
                                    value="${escaparHTML(
                                        perfil.nombre || ""
                                    )}"
                                    class="
                                        w-full
                                        px-4
                                        py-3
                                        rounded-xl
                                        border
                                        border-slate-300
                                        text-sm
                                        text-slate-800
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-blue-500
                                        focus:border-blue-500
                                    "
                                >

                            </div>


                            <!-- TELÉFONO -->

                            <div>

                                <label
                                    class="
                                        block
                                        text-xs
                                        font-bold
                                        text-slate-600
                                        mb-2
                                    "
                                >
                                    Teléfono
                                </label>

                                <input
                                    id="editar-telefono"
                                    type="tel"
                                    value="${escaparHTML(
                                        perfil.telefono ||
                                        perfil.phone ||
                                        ""
                                    )}"
                                    class="
                                        w-full
                                        px-4
                                        py-3
                                        rounded-xl
                                        border
                                        border-slate-300
                                        text-sm
                                        text-slate-800
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-blue-500
                                        focus:border-blue-500
                                    "
                                >

                            </div>

<!-- DIRECCION -->

<div>
    <label class="block text-sm font-medium text-slate-700 mb-1">
        Dirección
    </label>

    <input
        id="editar-direccion"
        type="text"
        value="${escaparHTML(perfil.direccion || "")}"
        placeholder="Ej.: Calle Mayor, 18"
        class="
            w-full
            px-4
            py-3
            rounded-xl
            border
            border-slate-300
            focus:outline-none
            focus:ring-2
            focus:ring-slate-400
        "
    >
</div>

<!-- CODIGO POSTAL -->

<div>
    <label class="block text-sm font-medium text-slate-700 mb-1">
        Código postal
    </label>

    <input
        id="editar-codigo-postal"
        type="text"
        maxlength="5"
        inputmode="numeric"
        value="${escaparHTML(perfil.codigo_postal || "")}"
        placeholder="Ej.: 45612"
        class="
            w-full
            px-4
            py-3
            rounded-xl
            border
            border-slate-300
            focus:outline-none
            focus:ring-2
            focus:ring-slate-400
        "
    >
</div>

<!-- PROVINCIA -->

<div>
    <label class="block text-sm font-medium text-slate-700 mb-1">
        Provincia
    </label>

    <input
        id="editar-provincia"
        type="text"
        value="${escaparHTML(perfil.provincia || "")}"
        placeholder="Ej.: Toledo"
        class="
            w-full
            px-4
            py-3
            rounded-xl
            border
            border-slate-300
            focus:outline-none
            focus:ring-2
            focus:ring-slate-400
        "
    >
</div>

<!-- CIUDAD -->

<div>
    <label class="block text-sm font-medium text-slate-700 mb-1">
        Localidad
    </label>

    <input
        id="editar-ciudad"
        type="text"
        value="${escaparHTML(perfil.ciudad || "")}"
        placeholder="Ej.: Velada"
        class="
            w-full
            px-4
            py-3
            rounded-xl
            border
            border-slate-300
            focus:outline-none
            focus:ring-2
            focus:ring-slate-400
        "
    >
</div>

                            <!-- EMAIL -->

                            <div class="md:col-span-2">

                                <label
                                    class="
                                        block
                                        text-xs
                                        font-bold
                                        text-slate-600
                                        mb-2
                                    "
                                >
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value="${escaparHTML(
                                        perfil.email || ""
                                    )}"
                                    disabled
                                    class="
                                        w-full
                                        px-4
                                        py-3
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-slate-50
                                        text-sm
                                        text-slate-500
                                        cursor-not-allowed
                                    "
                                >

                                <p
                                    class="
                                        text-[11px]
                                        text-slate-400
                                        mt-2
                                    "
                                >
                                    El email de acceso a tu cuenta no se modifica desde aquí.
                                </p>

                            </div>

                        </div>


                        <!-- BOTONES -->

                        <div
                            class="
                                flex
                                items-center
                                justify-end
                                gap-3
                                mt-6
                                pt-5
                                border-t
                                border-slate-200
                            "
                        >

                            <button
                                type="button"
                                onclick="cerrarEditarPerfil()"
                                class="
                                    px-4
                                    py-2.5
                                    rounded-xl
                                    border
                                    border-slate-300
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                    hover:bg-slate-50
                                "
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                class="
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-5
                                    py-2.5
                                    rounded-xl
                                    bg-blue-600
                                    text-white
                                    text-sm
                                    font-bold
                                    hover:bg-blue-700
                                "
                            >

                                <i
                                    data-lucide="save"
                                    class="w-4 h-4"
                                ></i>

                                Guardar cambios

                            </button>

                        </div>

                    </form>

                </div>

            `;

            document.body.appendChild(modal);


            ////////////////////////////////////////////////////////
            // CERRAR AL HACER CLICK FUERA
            ////////////////////////////////////////////////////////

            modal.addEventListener("click", function (event) {

                if (event.target === modal) {
                    cerrarEditarPerfil();
                }

            });


            ////////////////////////////////////////////////////////
            // GUARDAR
            ////////////////////////////////////////////////////////

            const formulario =
                document.getElementById(
                    "form-editar-perfil"
                );

            formulario.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();

                    const nombreComercial =
                        document
                            .getElementById(
                                "editar-nombre-comercial"
                            )
                            .value
                            .trim();

                    const nombre =
                        document
                            .getElementById(
                                "editar-nombre"
                            )
                            .value
                            .trim();

                    const telefono =
                        document
                            .getElementById(
                                "editar-telefono"
                            )
                            .value
                            .trim();

                            const direccion =
    document
        .getElementById(
            "editar-direccion"
        )
        .value
        .trim();

const codigoPostal =
    document
        .getElementById(
            "editar-codigo-postal"
        )
        .value
        .trim();

const ciudad =
    document
        .getElementById(
            "editar-ciudad"
        )
        .value
        .trim();

const provincia =
    document
        .getElementById(
            "editar-provincia"
        )
        .value
        .trim();


                    if (!nombreComercial) {

                        alert(
                            "Debes indicar un nombre comercial."
                        );

                        return;

                    }

                    if (codigoPostal && !/^\d{5}$/.test(codigoPostal)) {
    alert("El código postal debe tener exactamente 5 números.");
    return;
}

                    const boton =
                        formulario.querySelector(
                            'button[type="submit"]'
                        );

                    boton.disabled = true;

                    boton.innerHTML = `
                        <i
                            data-lucide="loader-2"
                            class="w-4 h-4 animate-spin"
                        ></i>
                        Guardando...
                    `;


                    try {

                        const {
                            error: errorUpdate
                        } = await supabase

                            .from("transportistas")

                            .update({
    nombre_comercial:
        nombreComercial,

    nombre:
        nombre,

    telefono:
        telefono,

    direccion:
        direccion,

    codigo_postal:
        codigoPostal,

    ciudad:
        ciudad,

    provincia:
        provincia
})

                            .eq(
                                "id",
                                transportistaId
                            );


                        if (errorUpdate) {
                            throw errorUpdate;
                        }


                        cerrarEditarPerfil();

                        await cargarPerfil();


                    } catch (error) {

                        console.error(
                            "Error actualizando perfil:",
                            error
                        );

                        alert(
                            "No se pudieron guardar los cambios."
                        );


                        boton.disabled = false;

                        boton.innerHTML = `
                            <i
                                data-lucide="save"
                                class="w-4 h-4"
                            ></i>
                            Guardar cambios
                        `;

                        if (
                            window.lucide &&
                            typeof window.lucide.createIcons ===
                                "function"
                        ) {

                            window.lucide.createIcons();

                        }

                    }

                }
            );


            if (
                window.lucide &&
                typeof window.lucide.createIcons ===
                    "function"
            ) {

                window.lucide.createIcons();

            }


        } catch (error) {

            console.error(
                "Error abriendo editor de perfil:",
                error
            );

            alert(
                "No se pudo abrir el editor del perfil."
            );

        }

    }


    ////////////////////////////////////////////////////////////
    // CERRAR EDITOR DE PERFIL
    ////////////////////////////////////////////////////////////

    function cerrarEditarPerfil() {

        const modal =
            document.getElementById(
                "modal-editar-perfil"
            );

        if (modal) {
            modal.remove();
        }

    }


    ////////////////////////////////////////////////////////////
    // EXPONER FUNCIONES
    ////////////////////////////////////////////////////////////

    window.editarPerfil =
        editarPerfil;

    window.cerrarEditarPerfil =
        cerrarEditarPerfil;

    window.cargarPerfil = cargarPerfil;

})(window);