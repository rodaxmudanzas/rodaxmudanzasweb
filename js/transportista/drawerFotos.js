const contenedor =
document.getElementById("drawerFotos");

contenedor.innerHTML="";

let fotos=[];

if(Array.isArray(mudanza.urls_fotos)){

    fotos=mudanza.urls_fotos;

}else{

    fotos=(mudanza.urls_fotos||"")

        .split(",")

        .map(f=>f.trim())

        .filter(Boolean);

}

if(fotos.length===0){

    contenedor.innerHTML=`
        <div class="text-slate-400 text-sm">
            No hay fotografías.
        </div>
    `;

    return;

}