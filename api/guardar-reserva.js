const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(

    process.env.SUPABASE_URL,

    process.env.SUPABASE_SERVICE_ROLE_KEY

);

//////////////////////////////////////////////////////
// GENERADOR DE NÚMERO DE RESERVA
//////////////////////////////////////////////////////

function generarNumeroReserva(){

    const año =
    new Date()
    .getFullYear()
    .toString()
    .slice(-2);

    const numero =
    Math.floor(
        100000 + Math.random()*900000
    );

    return `RDX-${año}-${numero}`;

}

module.exports = async (req,res)=>{

    if(req.method!=="POST"){

        return res.status(405).json({

            error:"Método no permitido."

        });

    }

    try{

        const datos = req.body;

console.log("=================================");
console.log("BODY RECIBIDO EN guardar-reserva");
console.log(datos);
console.log("Inventario:", datos.inventario);
console.log("Fotos:", datos.urls_fotos);
console.log("=================================");

        

        //////////////////////////////////////////////////////
// VALIDACIONES
//////////////////////////////////////////////////////

if(

    !datos.nombre ||

    !datos.email ||

    !datos.telefono ||

    !datos.origen ||

    !datos.destino ||

    !datos.fecha ||

    !datos.franja_horaria_recogida ||

    !datos.preciototal ||

    !datos.precioreserva

){

    return res.status(400).json({

        error:"Faltan datos obligatorios."

    });

}

//////////////////////////////////////////////////////
// VALIDAR FRANJA HORARIA DE RECOGIDA
//////////////////////////////////////////////////////

const franjasPermitidas = [
    "08:00 – 13:00",
    "14:00 – 18:00"
];

if (
    !franjasPermitidas.includes(
        datos.franja_horaria_recogida
    )
) {

    return res.status(400).json({

        error:
            "La franja horaria de recogida no es válida."

    });

}

//////////////////////////////////////////////////////
// NÚMERO DE RESERVA
//////////////////////////////////////////////////////

const numeroReserva =
generarNumeroReserva();

//////////////////////////////////////////////////////
// COMPROBAR SI YA EXISTE
//////////////////////////////////////////////////////

const { data: existe } = await supabase

.from("mudanzas")

.select("numero_reserva")

.eq("numero_reserva", numeroReserva)

.maybeSingle();

if(existe){

    return res.status(409).json({

        error:"Número de reserva duplicado."

    });

}

//////////////////////////////////////////////////////
// GUARDAR RESERVA
//////////////////////////////////////////////////////

const { data, error } = await supabase

.from("mudanzas")

.insert({

    numero_reserva: numeroReserva,

    nombre: datos.nombre,

    telefono: datos.telefono,

    email: datos.email,

    origen: datos.origen,

    destino: datos.destino,

    km: Number(datos.km) || 0,

    fecha: datos.fecha,

    franja_horaria_recogida:
        datos.franja_horaria_recogida,

    hora_llegada_confirmada:
        null,

    volumen: datos.volumen,

    ascensor: datos.ascensor,

    extras: datos.extras,

    observaciones: datos.observaciones,

    tipo_servicio: datos.tipo_servicio,

    preciototal: datos.preciototal,

    precioreserva: datos.precioreserva,

    urls_fotos: datos.urls_fotos,

    inventario: datos.inventario,

    estado: "Pendiente de pago",

    estado_pago: "Checkout iniciado",

    fecha_creacion: new Date(),

    transportista_id: null,

    version_presupuesto: 1

})

.select()

.single();

if (error) {

    console.error("ERROR INSERT SUPABASE");

    console.error(error);

    return res.status(500).json(error);

}

//////////////////////////////////////////////////////
// RESPUESTA
//////////////////////////////////////////////////////

return res.status(200).json({

    ok: true,

    id: data.id,

    numero_reserva: numeroReserva

});

    }

    catch(err){

        console.error(err);

        return res.status(500).json({

            error: err.message

        });

    }

};