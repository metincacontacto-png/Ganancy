# Diseño Técnico: Replicación Automática de Deudas en Egresos

Este documento detalla el diseño técnico para replicar automáticamente las deudas registradas en la pestaña de Deudas en el listado de egresos mensuales del Dashboard y de la Vista de Flujo Mensual.

## Requerimientos y Reglas de Negocio
1. **Deudas de Pago Único (One-off):**
   - Deben reflejarse en el listado de **egresos variables** del mes correspondiente a su fecha pactada de pago (`fechaVencimiento`).
   - El monto a reflejar es el total de la deuda.
   - Su estado de pago (Pagado/Pendiente) se mapea directamente al estado de la deuda (`completed`).
2. **Deudas en Cuotas:**
   - Deben reflejarse en el listado de **egresos fijos** de forma automática en cada mes correspondiente a sus cuotas.
   - El mes de inicio de la deuda se define de forma explícita o se infiere a partir de la cuota actual (`cuotaActual`).
   - Si una cuota no es pagada en su mes correspondiente, su monto se **acumula (roll over)** al mes siguiente con la nota indicando que incluye saldo del mes anterior (y así sucesivamente hasta que se pague).
   - Marcar el egreso como pagado en un mes posterior salda tanto la cuota actual como todas las cuotas anteriores acumuladas que estuviesen impagas.
3. **Seguridad y Edición:**
   - Las transacciones replicadas de deudas son de sólo lectura en las tablas del historial de egresos. Los botones de edición y eliminación directa se deshabilitarán o se ocultarán para estos elementos, guiando al usuario a gestionarlos en la pestaña de **Deudas**.
   - El cambio de estado (Pagado/Pendiente) de las deudas en el desglose mensual actualizará el estado de las cuotas de la deuda mediante `toggleCuota`.

---

## 1. Algoritmo de Cálculo en `App.jsx`

Modificaremos la propiedad calculada `filteredMonthlyDetails` en `App.jsx` para realizar la simulación cronológica y la inyección de las deudas.

```javascript
// Helpers de fecha y ordenación cronológica
const parseMonthYear = (str) => {
  const parts = str.split(' ');
  const abbr = parts[0];
  const yr = parseInt(parts[1], 10);
  const monthMap = {
    "Ene": 0, "Feb": 1, "Mar": 2, "Abr": 3, "May": 4, "Jun": 5,
    "Jul": 6, "Ago": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dic": 11,
    "Mayo": 4
  };
  return new Date(yr, monthMap[abbr] !== undefined ? monthMap[abbr] : 0, 1);
};

const getMonthDistance = (startMonth, endMonth) => {
  const start = parseMonthYear(startMonth);
  const end = parseMonthYear(endMonth);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
};

const getStartMonth = (debt, activeMonth) => {
  if (debt.startMonth) return debt.startMonth;
  const date = parseMonthYear(activeMonth);
  date.setMonth(date.getMonth() - debt.cuotaActual);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};
```

### Inyección de Egresos de Deudas en `filteredMonthlyDetails`
```javascript
  const filteredMonthlyDetails = React.useMemo(() => {
    const res = {};
    
    // 1. Copiar los detalles existentes
    Object.keys(monthlyDetailsState).forEach(month => {
      const monthObj = monthlyDetailsState[month] || { ingresos: [], egresos: [] };
      res[month] = {
        ingresos: [...(monthObj.ingresos || [])],
        egresos: [...(monthObj.egresos || [])]
      };
    });
    
    // Obtener los meses ordenados cronológicamente
    const sortedMonths = Object.keys(res).sort((a, b) => parseMonthYear(a) - parseMonthYear(b));
    if (sortedMonths.length === 0) return res;
    
    const latestMonth = sortedMonths[sortedMonths.length - 1];

    // Estructuras para acumular montos impagos de deudas en cuotas
    const accumulatedUnpaid = {}; // debtId -> count of unpaid installments
    
    // 2. Procesar mes a mes cronológicamente para inyectar deudas de cuotas y arrastrar saldos
    sortedMonths.forEach(month => {
      debtsState.forEach(debt => {
        const suffix = debt.context === 'personal' ? ' [Personal]' : ' [Empresa]';
        const taggedName = debt.name.includes('[Personal]') || debt.name.includes('[Empresa]') 
          ? debt.name 
          : debt.name + suffix;

        // Caso A: Deudas con Cuotas (fija)
        if (debt.tipo === "fija" || debt.cuotasTotales > 1) {
          const startMonth = getStartMonth(debt, latestMonth);
          const index_M = getMonthDistance(startMonth, month);
          
          if (index_M >= 0 && index_M < debt.cuotasTotales) {
            const isCurrentPaid = debt.cuotas[index_M];
            const prevUnpaidCount = accumulatedUnpaid[debt.id] || 0;
            
            if (isCurrentPaid) {
              // Si la cuota de este mes está pagada, se agrega como pagada
              res[month].egresos.push({
                id: `debt_virtual_${debt.id}`,
                name: taggedName,
                value: debt.montoMensual,
                paid: true,
                isVariable: false,
                dueDate: "",
                isDebtLink: true,
                cuotaIndex: index_M,
                debtId: debt.id
              });
            } else {
              // Si no está pagada, el monto de este mes se sumará al acumulado
              const totalUnpaidCountForThisMonth = prevUnpaidCount + 1;
              const totalValueDue = debt.montoMensual * totalUnpaidCountForThisMonth;
              
              const labelNote = prevUnpaidCount > 0 
                ? ` (Incluye ${prevUnpaidCount} cuotas atrasadas)` 
                : "";

              res[month].egresos.push({
                id: `debt_virtual_${debt.id}`,
                name: taggedName + labelNote,
                value: totalValueDue,
                paid: false,
                isVariable: false,
                dueDate: "",
                isDebtLink: true,
                cuotaIndex: index_M,
                debtId: debt.id,
                unpaidCount: totalUnpaidCountForThisMonth
              });
              
              // Arrastrar el saldo impago para el siguiente mes
              accumulatedUnpaid[debt.id] = totalUnpaidCountForThisMonth;
            }
          }
        }
        
        // Caso B: Pago Único (one-off)
        if (debt.tipo === "pago_unico" && debt.fechaVencimiento) {
          // Obtener mes correspondiente a la fecha pactada de pago
          const date = new Date(debt.fechaVencimiento + "T00:00:00");
          if (!isNaN(date.getTime())) {
            const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const debtMonth = `${months[date.getMonth()]} ${date.getFullYear()}`;
            
            if (debtMonth === month) {
              res[month].egresos.push({
                id: `debt_virtual_${debt.id}`,
                name: taggedName,
                value: debt.total,
                paid: debt.completed,
                isVariable: true,
                dueDate: debt.fechaVencimiento,
                isDebtLink: true,
                debtId: debt.id
              });
            }
          }
        }
      });
    });

    // 3. Aplicar filtro de contexto activo
    const filteredRes = {};
    Object.keys(res).forEach(month => {
      filteredRes[month] = {
        ingresos: filterByActiveContext(res[month].ingresos),
        egresos: filterByActiveContext(res[month].egresos)
      };
    });
    
    return filteredRes;
  }, [monthlyDetailsState, debtsState, filterByActiveContext]);
```

---

## 2. Modificaciones en la UI y Manejo de Eventos

### Deshabilitar Edición y Eliminación en `DashboardView.jsx`
- El botón de transferencia de contexto ("Tributario / Destino") se mostrará como un texto/badge deshabilitado si `item.isDebtLink` es verdadero.
- El botón de eliminación (Trash) se ocultará o deshabilitará, mostrando el título `"Gestionado en Deudas"`.

### Deshabilitar Edición y Eliminación en `FlujoMensualView.jsx`
- Ocultar botones de edición y eliminación si `item.isDebtLink` es verdadero.
- Mapear el toggle de pago de la siguiente manera:
```javascript
  const handleTogglePaid = (type, index) => {
    const list = currentDetails[type] || [];
    const item = list[index];
    if (item && item.isDebtLink) {
      if (item.cuotaIndex !== undefined) {
        // Deuda en cuota
        if (toggleCuota) {
          toggleCuota(item.debtId, item.cuotaIndex);
        }
      } else {
        // Pago único
        if (toggleCuota) {
          toggleCuota(item.debtId, 0);
        }
      }
      return;
    }
    updateMonthlyTransaction(selectedMonthDetail, type, "toggle", { index });
  };
```
