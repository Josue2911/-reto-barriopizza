Dashboard de Órdenes de Compra — Barrio Pizza

Esta pagina carga datos de inventario, ingredientes, consumo histórico y órdenes de compra desde archivos CSV, también permite elegir una sucursal desde un <select> y ver su tabla de inventario con la cantidad restante en bodega, consumo proyectado semanal, la cantidad de insumos necesarios para la semana y la cantidad de insumos que se piensa comprar.

Para facilitar el trabajo del usuario, utilice un icono de alerta ⚠️ el cual indica si la cantidad de insumos comprado esta correcto o no y también en la parte superior coloque el total de alertas existentes en la sucursal seleccionada. Además se muestra un resumen por sucursal, si una sucursal está comprando más de 15% por encima de lo proyectado, se le señala con un mensaje de exceso; si está dentro del rango, se marca con ✅.
Para editar manualmente la cantidad restante y la cantidad a comprar de un ingrediente, cree un pequeño formulario, el cual, como no utilice node.js, se guarda en memoria y se refresca la tabla con lo valores actualizados, y el usuario puede exportar una copia de la tabla actualizada en un archivo CSV.

La parte del diseño lo cree yo inspirándome en el diseño de la pagina de Barrio pizza, utilice el framework Taildwind, por comodidad mas que todo, y el la carga de datos, cálculos y render de los avisos lo hice con javascript, para esto ultimo si utilice la IAs de ChatGPT y ClaideAI como apoyo.

La logica principal del codigo la dividi en varias funciones:
obtenerSucursales(): obtiene la lista de sucursales únicas a partir del inventario.
analizarSucursales(): por cada sucursal, calcula el total proyectado vs. el total comprado y saca el porcentaje de diferencia. Este resultado alimenta la tabla resumen.
mostrarSucursal(): función central de render. Dibuja la tabla resumen de todas las sucursales y luego la tabla de inventario detallada de la sucursal seleccionada, calculando alertas ingrediente por ingrediente.
editarIngrediente() / guardarCambios(): permiten editar y persistir (en memoria) los valores de un ingrediente específico.
exportarCSV(): genera y descarga un CSV con las órdenes de compra actualizadas.

el link de la pagina en vercel: https://reto-barriopizza.vercel.app
