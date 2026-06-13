# Replicación de Deudas en Egresos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate single-payment debts as variable expenses and installment debts as fixed expenses in the monthly ledger, managing unpaid installments rollover month-to-month and keeping virtual items read-only.

**Architecture:** Inject virtual debt items dynamically into `filteredMonthlyDetails` in `App.jsx` by simulating chronological rollover of unpaid installments. Intercept payment toggle actions in the view to invoke `toggleCuota` (updating preceding unpaid installments) instead of raw transaction mutation.

**Tech Stack:** React, JavaScript, Vite

---

### Task 1: Modificar `filteredMonthlyDetails` y `updateMonthlyTransaction` en `App.jsx`

**Files:**
- Modify: `src/App.jsx:275-300` (Implementar cálculo dinámico con simulación cronológica e inyección de deudas)
- Modify: `src/App.jsx:1337-1455` (Actualizar `updateMonthlyTransaction` para corregir descalces de índices bajo filtros de contexto)
- Modify: `src/App.jsx:970-1011` (Actualizar `toggleCuota` para saldar cuotas anteriores si es un pago acumulativo)

- [ ] **Step 1: Modificar `filteredMonthlyDetails` para inyectar deudas virtuales**
  
  Reemplazar el hook `filteredMonthlyDetails` para:
  1. Ordenar todos los meses cronológicamente.
  2. Mantener un registro de cuotas atrasadas e impagas por deuda (`accumulatedUnpaid`).
  3. Inyectar las deudas fijas en cuotas como egresos fijos (`isVariable: false`) y las deudas de pago único en su mes correspondiente como egresos variables (`isVariable: true`).
  4. Agregar el flag `isDebtLink: true`, `debtId` y `cuotaIndex` (para cuotas) a los egresos virtuales.
  5. Asegurar que los nombres de las deudas contengan el sufijo `[Personal]` o `[Empresa]` correspondiente.

  Implementar las funciones auxiliares de tiempo al principio del archivo:
  ```javascript
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

  Y definir `filteredMonthlyDetails`:
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
        if (debt.tipo === "fija" || (debt.cuotasTotales && debt.cuotasTotales > 1)) {
          const startMonth = getStartMonth(debt, latestMonth);
          const index_M = getMonthDistance(startMonth, month);
          
          if (index_M >= 0 && index_M < debt.cuotasTotales) {
            const isCurrentPaid = debt.cuotas && debt.cuotas[index_M];
            const prevUnpaidCount = accumulatedUnpaid[debt.id] || 0;
            
            if (isCurrentPaid) {
              // Si la cuota de este mes está pagada, se agrega con su valor normal
              res[month].egresos.push({
                id: `debt_virtual_${debt.id}_${index_M}`,
                name: taggedName,
                value: debt.montoMensual || 0,
                paid: true,
                isVariable: false,
                dueDate: "",
                isDebtLink: true,
                cuotaIndex: index_M,
                debtId: debt.id
              });
            } else {
              // Si no está pagada, el monto se suma al acumulado
              const totalUnpaidCountForThisMonth = prevUnpaidCount + 1;
              const totalValueDue = (debt.montoMensual || 0) * totalUnpaidCountForThisMonth;
              
              const labelNote = prevUnpaidCount > 0 
                ? ` (Incluye ${prevUnpaidCount} cuota${prevUnpaidCount > 1 ? 's' : ''} anterior${prevUnpaidCount > 1 ? 'es' : ''} impaga${prevUnpaidCount > 1 ? 's' : ''})` 
                : "";

              res[month].egresos.push({
                id: `debt_virtual_${debt.id}_${index_M}`,
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
          const date = new Date(debt.fechaVencimiento + "T00:00:00");
          if (!isNaN(date.getTime())) {
            const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const debtMonth = `${months[date.getMonth()]} ${date.getFullYear()}`;
            
            if (debtMonth === month) {
              res[month].egresos.push({
                id: `debt_virtual_${debt.id}`,
                name: taggedName,
                value: debt.total || 0,
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

- [ ] **Step 2: Modificar `updateMonthlyTransaction` para resolver descalce de índices**
  
  Actualizar `updateMonthlyTransaction` en `App.jsx` para encontrar el índice real de la transacción original comparando el item o su `id` si se pasa un índice filtrado:
  ```javascript
  const updateMonthlyTransaction = async (month, type, action, data) => {
    const monthObject = monthlyDetailsState[month] || { ingresos: [], egresos: [] };
    const rawList = monthObject[type] || [];
    
    let rawIndex = data.index;
    if (action !== "add" && data.index !== undefined) {
      const filteredList = filterByActiveContext(rawList);
      const targetItem = filteredList[data.index];
      if (targetItem) {
        rawIndex = rawList.findIndex(it => it === targetItem || (it.id && it.id === targetItem.id));
      }
    }
    // Si no se encuentra, usar el original
    if (rawIndex === -1) rawIndex = data.index;
  ```
  *(Reemplazar `data.index` con `rawIndex` en el cuerpo de la función)*

- [ ] **Step 3: Modificar `toggleCuota` para saldar cuotas anteriores**
  
  En `toggleCuota` en `App.jsx`, si el nuevo estado es `true` (pagada), marcar todas las cuotas previas (`i < cuotaIndex`) como `true` también:
  ```javascript
    const newCuotas = [...current.cuotas];
    const targetVal = !newCuotas[cuotaIndex];
    newCuotas[cuotaIndex] = targetVal;
    
    if (targetVal) {
      // Saldar automáticamente cuotas anteriores impagas
      for (let i = 0; i < cuotaIndex; i++) {
        newCuotas[i] = true;
      }
    }
    const paidCount = newCuotas.filter(Boolean).length;
    const completed = paidCount === current.cuotasTotales;
  ```

---

### Task 2: Modificar `FlujoMensualView.jsx`

**Files:**
- Modify: `src/sections/FlujoMensualView.jsx:8-12` (Recibir prop `toggleCuota`)
- Modify: `src/sections/FlujoMensualView.jsx:241-244` (Actualizar `handleTogglePaid` para soportar `isDebtLink`)
- Modify: `src/sections/FlujoMensualView.jsx:622-680` (Deshabilitar botones de edición/eliminación de deudas)

- [ ] **Step 1: Recibir `toggleCuota` en los destructured props**
  ```javascript
  export default function FlujoMensualView({
    historicalFlowsState,
    monthlyDetailsState,
    updateMonthlyTransaction,
    currentContext,
    addHistoricalMonth,
    toggleCuota // <-- Agregar prop
  }) {
  ```

- [ ] **Step 2: Interceptar clics de pago en `handleTogglePaid`**
  ```javascript
  const handleTogglePaid = (type, index) => {
    const list = currentDetails[type] || [];
    const item = list[index];
    if (item && item.isDebtLink) {
      if (toggleCuota) {
        const cuotaIdx = item.cuotaIndex !== undefined ? item.cuotaIndex : 0;
        toggleCuota(item.debtId, cuotaIdx);
      }
      return;
    }
    updateMonthlyTransaction(selectedMonthDetail, type, "toggle", { index });
  };
  ```

- [ ] **Step 3: Ocultar o deshabilitar edición y eliminación para deudas en `FlujoMensualView.jsx`**
  En el mapeo de `currentDetails.egresos`, buscar los botones de edición y eliminación (ícono lápiz y basura) y ocultarlos si `item.isDebtLink` es `true`.
  ```javascript
  {!item.isDebtLink && (
    <button onClick={() => handleTransEdit(idx)} ...>Editar</button>
  )}
  {!item.isDebtLink && (
    <button onClick={() => handleTransDelete("egresos", idx, item.name)} ...>Eliminar</button>
  )}
  ```

---

### Task 3: Modificar `DashboardView.jsx`

**Files:**
- Modify: `src/sections/DashboardView.jsx:2484-2545` (Ocultar o deshabilitar acciones del listado contable para deudas)

- [ ] **Step 1: Ocultar o deshabilitar acciones de transferencia de contexto y eliminación en el Dashboard**
  
  En el listado contable de boletas y egresos del Dashboard:
  - Si `item.isDebtLink` es `true`, deshabilitar el botón de transferencia de contexto (`context-toggle-btn`), remover el click handler, o renderizar un pill estático y cambiar el estilo para que se vea deshabilitado.
  - Ocultar o deshabilitar el botón de eliminación de transacción (`Trash`) si es una deuda, agregando la advertencia/tooltip `"Gestionado en Deudas"`.
  ```javascript
  {item.isDebtLink ? (
    <span style={{
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--text-tertiary)',
      border: '1px solid var(--border-color)',
      fontSize: '11px',
      fontWeight: 500,
      padding: '4px 10px',
      borderRadius: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      opacity: 0.7
    }}>
      {isPersonal ? '🏠 Personal' : '🏢 Negocio'}
    </span>
  ) : (
    <button onClick={() => { ... }} className="context-toggle-btn">...</button>
  )}
  ```
  Y para el botón Trash:
  ```javascript
  {item.isDebtLink ? (
    <span style={{ color: 'var(--text-tertiary)', opacity: 0.5, cursor: 'not-allowed', display: 'inline-flex', padding: '4px' }} title="Gestionado en Deudas">
      <Trash size={14} />
    </span>
  ) : (
    <button onClick={() => { ... }}>
      <Trash size={14} />
    </button>
  )}
  ```

---

### Task 4: Verificar la implementación

- [ ] **Step 1: Construir el proyecto**
  Correr `npm run build` para asegurar que no hay errores de sintaxis o empaquetado.

- [ ] **Step 2: Verificar comportamiento dinámico e inyección**
  Ejecutar el servidor local e ingresar a la pestaña de Deudas. Registrar una deuda con 3 cuotas. Confirmar su aparición en la pestaña "Flujo Mensual" y en el Dashboard como egreso fijo.
  Comprobar que si no se marca como pagada en un mes, el valor se acumula y muestra la nota de saldo del mes anterior en el mes siguiente.
  Comprobar que al pagar la deuda en el mes siguiente, las cuotas anteriores también se marcan como pagadas en el estado global.
