let inventario = [];
    let ingredientes = [];
    let consumo_proyectado = [];
    let ordenesCompra = [];
    let resumenSucursales = [];
    let ingredienteEditando = "";
    let sucursalEditando = "";

    async function leerCSV(ruta){

        const respuesta = await fetch(ruta);
        const texto = await respuesta.text();

        const filas = texto.trim().split("\n");

        const encabezados = filas[0]
            .replace("\ufeff","")
            .split(",");

        let datos = [];

        for(let i=1;i<filas.length;i++){

            const columnas = filas[i].split(",");

            let objeto = {};

            encabezados.forEach((encabezado,index)=>{

                objeto[encabezado]=columnas[index];

            });

            datos.push(objeto);

        }
        return datos;
    }

    function editarIngrediente(id, nombre, cantidadCompra, cantidadRestante) {

        document.getElementById("nombreIngrediente").value = nombre;
        document.getElementById("cantidadComprar").value = cantidadCompra;
        document.getElementById("cantidadRestante").value = cantidadRestante;

        ingredienteEditando = nombre;
        sucursalEditando = document.getElementById("sucursales").value;
    }

    async function cargarDatos(){

        inventario = await leerCSV("datos/inventario_actual.csv");
        ingredientes = await leerCSV("datos/ingredientes.csv");
        consumo_proyectado = await leerCSV("datos/consumo_historico.csv");
        ordenesCompra = await leerCSV("datos/orden_compra_semana.csv");

        console.log(ordenesCompra);

        cargarSucursales();

        const ultimaSucursal = localStorage.getItem("ultimaSucursal");

        if (ultimaSucursal) {
            document.getElementById("sucursales").value = ultimaSucursal;
            mostrarSucursal();

        }
    }

    cargarDatos();

    document
    .getElementById("guardar")
    .addEventListener("click", guardarCambios);

    document
    .getElementById("exportar")
    .addEventListener("click", exportarCSV);

    function cargarSucursales(){

        const select = document.getElementById("sucursales");

        const sucursales = obtenerSucursales();

        sucursales.forEach(sucursal=>{

            const option = document.createElement("option");

            option.value = sucursal;
            option.textContent = sucursal;

            select.appendChild(option);
        });
    }

    function obtenerSucursales() {
        return [...new Set(
            inventario.map(item => item.sucursal)
        )];
    }

    function analizarSucursales() {

        resumenSucursales = [];

        const sucursales = obtenerSucursales();

        sucursales.forEach(sucursal => {

            let totalProyectado = 0;
            let totalComprado = 0;

            // Inventario de esa sucursal
            const inventarioSucursal = inventario.filter(item =>
                item.sucursal === sucursal
            );

            inventarioSucursal.forEach(item => {

                const ingrediente = ingredientes.find(i =>
                    i.ingrediente_id === item.ingrediente_id
                );

                const historial = consumo_proyectado.filter(c =>
                    c.sucursal === sucursal &&
                    c.ingrediente_id === item.ingrediente_id
                );

                let promedio = 0;

                historial.forEach(h => {
                    promedio += Number(h.consumo_unidad_base);
                });

                if (historial.length > 0) {
                    promedio /= historial.length;
                }

                const necesaria =
                    Math.max(
                        0,
                        Math.round(promedio - Number(item.stock_actual_unidad_base))
                    );

                totalProyectado += necesaria;

                const orden = ordenesCompra.find(o =>
                    o.sucursal === sucursal &&
                    o.ingrediente_id === item.ingrediente_id
                );

                if (orden) {

                    totalComprado +=
                        Number(orden.cantidad_formatos) *
                        Number(ingrediente.unidad_base_por_formato);

                }

            });

            const porcentaje =
                totalProyectado > 0
                ? ((totalComprado - totalProyectado) / totalProyectado) * 100
                : 0;

            resumenSucursales.push({
                sucursal,
                porcentaje
            });

        });

    }

    const select = document.getElementById("sucursales");

    select.addEventListener("change", () => {
        localStorage.setItem("ultimaSucursal", select.value);
        mostrarSucursal();
    });

    document
        .getElementById("sucursales")
        .addEventListener("change", mostrarSucursal);

    function mostrarSucursal(){

        const sucursal =
            document.getElementById("sucursales").value;

        const tbody =
            document.getElementById("tablaInventario");

        tbody.innerHTML="";

        const sucursalTabla = 
            document.getElementById("tablaSucursales");
        sucursalTabla.innerHTML="";

        // Analiza todas las sucursales UNA sola vez (antes se llamaba dentro
        // de un forEach anidado, lo que repetía cada fila una vez por sucursal)
        analizarSucursales();

        resumenSucursales.forEach(resumen => {

            let estado = "";

            if (resumen.porcentaje > 15) {
                // Mensaje cuando la sucursal está fuera de rango (comprando de más)
                estado = `⚠️ Esta sucursal está comprando ${resumen.porcentaje.toFixed(1)}% de más en insumos`;
            } else {
                // Ganchito solo cuando está dentro del rango aceptable
                estado = "✅";
            }

            sucursalTabla.innerHTML += `
                <tr class="border-b border-gray-300">
                    <td class="px-2 text-center">${resumen.sucursal}</td>
                    <td class="px-2 text-center">${estado}</td>
                </tr>
            `;

        });

        // Inventario de esa sucursal
        const inventarioSucursal = inventario.filter(item =>
            item.sucursal === sucursal
        );

        //calcular el total de alertas
            let totalAlertas = 0;

        inventarioSucursal.forEach(item=>{

            // Buscar el nombre del ingrediente
            const ingrediente = ingredientes.find(i =>
                i.ingrediente_id === item.ingrediente_id
            );

            // Historial de consumo
            const historial = consumo_proyectado.filter(c =>
                c.sucursal === sucursal &&
                c.ingrediente_id === item.ingrediente_id
            );

            // Promedio de consumo
            let promedio = 0;

            if(historial.length>0){

                let suma = 0;

                historial.forEach(h=>{

                    suma += Number(h.consumo_unidad_base);

                });

                promedio = suma / historial.length;

            }

            //buscar la orden de compra
            const orden = ordenesCompra.find(o =>
                    o.sucursal === sucursal &&
                    o.ingrediente_id === item.ingrediente_id
                );

                console.log(`--- item ${item.ingrediente_id} (${sucursal}) ---`);
                console.log("item (inventario):", item);
                console.log("ingrediente:", ingrediente);
                console.log("historial:", historial);
                console.log("promedio:", promedio);
                console.log("orden:", orden);

            // Cantidad necesaria
            const necesaria =
                Math.max(
                    0,
                    Math.round(promedio - Number(item.stock_actual_unidad_base))
                    
                );
            
            // Convertir la cantidad necesaria a formatos, para la alerta
            const necesariaFormatos = 
                Math.ceil(
                necesaria / Number(ingrediente.unidad_base_por_formato)
            );

            //Mostrar alerta
            let alerta = "";

            const tipoFormato = ingrediente.formato_compra.split(" ")[0];

            let cantidadUnidadBase = 0;

            if (orden) {

                // Convertir la cantidad de formatos a unidad base, para mostrar en la tabla
                cantidadUnidadBase = 
                        Number(orden.cantidad_formatos) * Number(ingrediente.unidad_base_por_formato);

                // Convertir formatos a unidad base
                const formatosComprados = Number(orden.cantidad_formatos);

                if (formatosComprados < necesariaFormatos) {

                    totalAlertas++;

                    const diferencia = (necesariaFormatos - formatosComprados).toFixed(2);

                    alerta = `
                        <img
                            src="img/Atention.png"
                            class="inline-block w-5 h-5 ml-2 cursor-pointer"
                            title="ALERTA: ${sucursal} está pidiendo ${diferencia} ${tipoFormato} de ${ingrediente.nombre} menos que lo proyectado → riesgo de quiebre"
                        >
                    `;
                    
                }

            }

            let claseFila = "";

            if (alerta !== "") {
                claseFila = "bg-red-100";
            }

            let textoCompra = "";

            if (orden) {
                textoCompra = `${orden.cantidad_formatos} (${cantidadUnidadBase.toFixed(2)} ${ingrediente.unidad_base})`;
            } else {
                textoCompra = "Sin Pedido";
            }

            tbody.innerHTML += `
                <tr class="border-b border-gray-300 ${claseFila}">
                    <td class=" px-2 text-center">${ingrediente.nombre} ${alerta}</td>
                    <td class=" px-2 text-center">${item.stock_actual_unidad_base+" "+ingrediente.unidad_base}</td>
                    <td class="px-2 text-center">${promedio.toFixed(2)+" "+ingrediente.unidad_base}</td>
                    <td class=" px-2 text-center">${necesaria+" "+ingrediente.unidad_base}</td>
                    <td class=" px-2 text-center">${textoCompra}</td>
                    <td class=" px-2 text-center">
                        <button class="cursor-pointer" 
                            onclick="editarIngrediente(
                            '${ingrediente.ingrediente_id}',
                            '${ingrediente.nombre}',
                            ${orden ? orden.cantidad_formatos : 0},
                            ${item.stock_actual_unidad_base})">
                            <img src="img/app_icon.png" class="size-8 inline-block mr-1">
                        </button>
                    </td>
                </tr>
            `;
        });document.getElementById("totalAlertas").textContent = totalAlertas;
    }

    function guardarCambios() {
        const nuevaCompra = Number(document.getElementById("cantidadComprar").value);
        const nuevoInventario = Number(document.getElementById("cantidadRestante").value);

        // Busca el ingrediente por nombre
        const ingrediente = ingredientes.find(i =>
            i.nombre === ingredienteEditando
        );

        if (!ingrediente) {
            alert("Ingrediente no encontrado.");
            return;
        }

        // Actualizar orden de compra
        const orden = ordenesCompra.find(o =>
            o.sucursal === sucursalEditando &&
            o.ingrediente_id === ingrediente.ingrediente_id
        );

        if (orden) {
            orden.cantidad_formatos = nuevaCompra;
        }

        // Actualizar inventario
        const inventarioItem = inventario.find(i =>
            i.sucursal === sucursalEditando &&
            i.ingrediente_id === ingrediente.ingrediente_id
        );

        if (inventarioItem) {
            inventarioItem.stock_actual_unidad_base = nuevoInventario;
        }

        mostrarSucursal();

        alert("Cambios guardados.");
    }

    function exportarCSV() {

        let csv = "sucursal,ingrediente_id,cantidad_formatos\n";

        ordenesCompra.forEach(orden => {

            csv += `${orden.sucursal},${orden.ingrediente_id},${orden.cantidad_formatos}\n`;

        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

        const enlace = document.createElement("a");

        enlace.href = URL.createObjectURL(blob);
        enlace.download = "orden_compra_semana_actualizada.csv";
        enlace.click();

        URL.revokeObjectURL(enlace.href);

    }