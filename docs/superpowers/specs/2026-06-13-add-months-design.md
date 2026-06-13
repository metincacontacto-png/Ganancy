# Diseño Técnico: Selección y Creación Dinámica de Meses

Este documento detalla el diseño para permitir a los usuarios de GANANCY añadir, seleccionar y editar cualquier mes (histórico o futuro) de forma dinámica, manteniendo la base de datos limpia y la interfaz ordenada cronológicamente.

## Requerimientos y Casos de Uso
1. **Editar Meses Posteriores:** Permitir al usuario crear periodos contables futuros (ej. Julio 2026, Agosto 2026) y agregar transacciones/boletas en ellos.
2. **Preservar Registro Histórico:** Los meses del pasado y sus transacciones registradas deben mantenerse intactos.
3. **Trimestres Dinámicos:** La navegación trimestral en la vista de flujo mensual debe generarse dinámicamente en base a los meses existentes en el historial, eliminando los botones estáticos de trimestres predefinidos.
4. **Sincronización Cloud & Local:** Los nuevos meses deben registrarse tanto en el almacenamiento local como en la tabla `flujos_historicos` de Supabase para los usuarios logueados.

---

## 1. Modificaciones en el Estado Global (`App.jsx`)

### Nueva Acción: `addHistoricalMonth`
Se implementará la función `addHistoricalMonth` en el componente principal `App` y se pasará a las vistas del Dashboard y Flujo Mensual.

```javascript
const addHistoricalMonth = async (monthName) => {
  // monthName ej: "Jul 2026"
  const parts = monthName.split(' ');
  const monthAbbr = parts[0];
  const year = parts[1];
  
  // Calcular trimestre
  let q = "Q1 " + year;
  if (["Abr", "May", "Jun"].includes(monthAbbr)) {
    q = "Q2 " + year;
  } else if (["Jul", "Ago", "Sep"].includes(monthAbbr)) {
    q = "Q3 " + year;
  } else if (["Oct", "Nov", "Dic"].includes(monthAbbr)) {
    q = "Q4 " + year;
  }
  
  const newFlow = {
    month: monthName,
    q,
    ingresos: 0,
    egresos: 0,
    balance: 0
  };

  // Guardar en Supabase si está logueado
  if (currentUser && currentUser.provider === 'supabase') {
    try {
      const { data, error } = await supabase
        .from('flujos_historicos')
        .insert({
          user_id: currentUser.id,
          month: monthName,
          q,
          ingresos: 0,
          egresos: 0,
          balance: 0
        })
        .select()
        .single();
      if (error) throw error;
    } catch (err) {
      console.error("Error al insertar mes en Supabase:", err);
      alert("No se pudo agregar el mes en la base de datos.");
      return false;
    }
  }

  // Helper para parsear mes y año para ordenación cronológica
  const parseMonthYear = (str) => {
    const parts = str.split(' ');
    const abbr = parts[0];
    const yr = parseInt(parts[1], 10);
    const monthMap = {
      "Ene": 0, "Feb": 1, "Mar": 2, "Abr": 3, "May": 4, "Jun": 5,
      "Jul": 6, "Ago": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dic": 11
    };
    return new Date(yr, monthMap[abbr] || 0);
  };

  // Actualizar flujos históricos ordenados cronológicamente
  setHistoricalFlowsState(prev => {
    if (prev.some(f => f.month === monthName)) return prev;
    const updated = [...prev, newFlow];
    return updated.sort((a, b) => parseMonthYear(a.month) - parseMonthYear(b.month));
  });

  // Inicializar detalles de transacciones del mes
  setMonthlyDetailsState(prev => {
    if (prev[monthName]) return prev;
    return {
      ...prev,
      [monthName]: { ingresos: [], egresos: [] }
    };
  });
  
  return true;
};
```

---

## 2. Componente de Modal: `AddMonthModal`

Crearemos un modal reutilizable o localizable en las vistas (`DashboardView.jsx` y `FlujoMensualView.jsx`) para que el usuario pueda añadir periodos fácilmente:

- **Meses (Abreviados):** `Ene`, `Feb`, `Mar`, `Abr`, `May`, `Jun`, `Jul`, `Ago`, `Sep`, `Oct`, `Nov`, `Dic` (se mostrará el nombre completo en la selección y se guardará abreviado).
- **Años:** Desde 2025 hasta 2030 (con posibilidad de extender).
- **Validaciones:**
  - El mes no puede estar duplicado en el estado actual.
  - Al completar la creación, se seleccionará automáticamente el nuevo mes como el activo para facilitarle al usuario comenzar a registrar transacciones de inmediato.

---

## 3. Navegación Dinámica por Trimestres en `FlujoMensualView.jsx`

En lugar de renderizar botones estáticos, los trimestres se obtendrán dinámicamente a partir de los datos en `historicalFlowsState`:

```javascript
const uniqueQuarters = React.useMemo(() => {
  const quarters = historicalFlowsState.map(item => item.q);
  const unique = [];
  quarters.forEach(q => {
    if (q && !unique.includes(q)) {
      unique.push(q);
    }
  });
  
  // Ordenar trimestres cronológicamente
  return unique.sort((a, b) => {
    const partsA = a.split(' ');
    const partsB = b.split(' ');
    const yearA = parseInt(partsA[1], 10);
    const yearB = parseInt(partsB[1], 10);
    if (yearA !== yearB) return yearA - yearB;
    const qA = parseInt(partsA[0].replace('Q', ''), 10);
    const qB = parseInt(partsB[0].replace('Q', ''), 10);
    return qA - qB;
  });
}, [historicalFlowsState]);
```

El estado inicial `selectedTrimestre` será inicializado al trimestre del último mes registrado en el historial contable, evitando quedar vacío en una vista sin datos pre-cargados.

---

## Plan de Verificación

### Pruebas Manuales
1. **Verificación de Preservación:** Confirmar que al resetear los valores o ingresar a una cuenta con flujos pasados, el historial anterior ("registro histórico") de Oct 2025 - Mayo 2026 se mantenga correctamente en el gráfico y tablas.
2. **Creación de Meses Posteriores:** Añadir "Jul 2026" y verificar que aparezca en el selector del Dashboard y cree su tarjeta correspondiente en la pestaña "Flujo Mensual" bajo la sección "Trimestre 3 2026" (Q3 2026).
3. **Edición de Movimientos:** En el mes de Julio 2026 recién creado, subir una boleta mediante el escáner IA o agregar un egreso variable manualmente, verificando que se sume correctamente en el balance de ese mes y se guarde en Supabase/localStorage.
