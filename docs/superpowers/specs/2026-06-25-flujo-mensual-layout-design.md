# Diseño de Layout para Flujo Mensual y Desglose Operacional

## Contexto y Objetivos
Este diseño tiene como objetivo mejorar la experiencia de usuario y la visualización de datos en la sección de **Flujo Mensual** de Ganancy.
Se realizarán dos modificaciones clave:
1. **Destacar el mes más reciente (o en curso) en la parte superior** de la pantalla de Flujo Mensual, mostrando de forma desglosada sus ingresos y egresos fijos y variables. Los meses anteriores se listarán abajo en una sección de historial.
2. **Reorganizar el modal de desglose operacional** para mostrar las 4 tarjetas (Ingresos Fijos, Egresos Fijos, Ingresos Variables, Egresos Variables) en una cuadrícula simétrica de 2x2 en pantallas de escritorio, en lugar del orden actual de 3 y 1.

---

## Cambios Propuestos

### 1. Vista Principal de Flujo Mensual (`src/sections/FlujoMensualView.jsx`)

* **Identificación del Mes Principal:**
  - Se ordenarán los meses del trimestre seleccionado de forma cronológica descendente.
  - El mes más reciente del trimestre actual se convertirá en el "Mes Destacado".
  - Los meses restantes se clasificarán como "Otros Meses".

* **Tarjeta Destacada (`.main-month-card`):**
  - Se mostrará en la parte superior de la página con un ancho destacado.
  - Dividirá el desglose en dos columnas principales (Ingresos a la izquierda, Egresos a la derecha).
  - Cada columna mostrará el subtotal de Fijos y Variables, y el total acumulado correspondiente.
  - El pie de la tarjeta mostrará el Balance del Mes de manera prominente junto al botón de "Ver desglose / Editar transacciones".

* **Listado de Otros Meses:**
  - Se agruparán bajo el título "Otros Meses del Trimestre".
  - Se mostrarán usando el diseño de tarjetas compacto actual en una cuadrícula.

---

### 2. Estructura del Modal de Desglose Operacional

* Se reemplazará el estilo inline de la cuadrícula de tarjetas dentro del modal por una clase CSS dedicada `.operational-grid-2x2`.
* La clase `.operational-grid-2x2` definirá una cuadrícula de dos columnas (`grid-template-columns: repeat(2, 1fr)`) para pantallas de escritorio (`@media (min-width: 769px)`), y una sola columna para móviles (`@media (max-width: 768px)`).
* El orden de las tarjetas será:
  - Fila 1: Ingresos Fijos (Izquierda), Egresos Fijos (Derecha).
  - Fila 2: Ingresos Variables (Izquierda), Egresos Variables (Derecha).

---

### 3. Hojas de Estilos (`src/index.css`)

Se agregarán las siguientes clases y estilos:
* `.main-month-card`: Estilos para la tarjeta destacada en la parte superior, incluyendo fondo con gradiente sutil, bordes pulidos y estructura interna en dos columnas.
* `.operational-grid-2x2`: Estilos de cuadrícula responsiva 2x2 para el modal.
* `.historical-months-header`: Estilo para el título de la sección de meses anteriores.

---

## Plan de Verificación

### Pruebas Manuales
1. **Verificación de Vista de Flujo Mensual:**
   - Comprobar que el mes más reciente del trimestre seleccionado aparece arriba destacado con su desglose detallado.
   - Comprobar que los meses históricos del mismo trimestre se listan debajo en la sección de "Otros Meses".
   - Probar añadiendo un nuevo mes y verificar que este nuevo mes pasa a ser el destacado automáticamente.

2. **Verificación del Modal:**
   - Abrir el modal del mes destacado o de cualquier otro mes.
   - Verificar que los 4 cuadros se visualizan ordenados en un diseño de 2x2 (Ingresos Fijos y Egresos Fijos arriba, Ingresos Variables y Egresos Variables abajo).
   - Probar en diferentes tamaños de pantalla para verificar la adaptabilidad responsiva.
