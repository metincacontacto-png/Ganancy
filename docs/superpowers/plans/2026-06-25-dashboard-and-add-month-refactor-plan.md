# Dashboard and Add Month Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 
1. Make the Dashboard KPI charts and metrics reflect the actual transaction details from the latest month in the Monthly Flow (Flujo Mensual).
2. Enhance the "Agregar Periodo Contable" (Add Month) modal to allow adding default fixed incomes and fixed expenses (with option "Todos", "Seleccionar/Editar", or "Ninguno").
3. Implement a "Delete Month" option in both the main highlighted month card and the historical list cards.

**Architecture:**
1. Update `DashboardView.jsx` to dynamically compute the structural fixed/variable totals based on the latest month in `historicalFlowsState` (falling back to the defaults if empty).
2. Pass `deleteHistoricalMonth`, `ingresosFijosState={filteredIngresosFijos}`, and `egresosFijosState={filteredEgresosFijos}` props to `FlujoMensualView` in `src/App.jsx`.
3. Implement `deleteHistoricalMonth` in `src/App.jsx` to clean up Supabase and local states.
4. Update `addHistoricalMonth` in `src/App.jsx` to accept arrays of selected incomes/expenses to pre-populate.
5. In `FlujoMensualView.jsx`, add option dropdowns and checklist sections to the "Agregar Periodo Contable" modal.
6. Add trash delete buttons to the monthly flow cards and map them to `deleteHistoricalMonth`.

**Tech Stack:** React, Supabase, Vanilla CSS

---

### Task 1: Sincronizar KPIs del Dashboard con el Flujo Mensual Real

**Files:**
- Modify: `src/sections/DashboardView.jsx`

- [ ] **Step 1: Modificar `DashboardView.jsx` para recalcular ingresos/egresos fijos y variables basándose en el mes más reciente del historial**

Target content (around lines 91-112):
```javascript
  // 1. Calculate dynamic liabilities total
  const liabilitiesTotal = debtsState.reduce((sum, d) => {
    if (d.completed) return sum;
    const paidCount = (d.cuotas || []).filter(Boolean).length;
    if (d.cuotasTotales === 0) return sum + d.total;
    if (d.cuotasTotales === 1) return sum + (paidCount === 1 ? 0 : d.total);
    return sum + Math.round(d.total * (1 - paidCount / d.cuotasTotales));
  }, 0);

  const patrimonioNeto = assetsTotal - liabilitiesTotal;

  // 2. Calculate dynamic fixed structural flows
  const ingresosFijosTotal = ingresosFijosState.reduce((sum, item) => sum + item.value, 0);
  const egresosFijosTotal = egresosFijosState.reduce((sum, item) => sum + item.value, 0);
  const balanceFijo = ingresosFijosTotal - egresosFijosTotal;

  // 3. Calculate dynamic variable structural flows from state tables
  const avgVarIncome = ingresosVariablesState.reduce((sum, item) => sum + item.value, 0);
  const avgVarExpense = egresosVariablesState.reduce((sum, item) => sum + item.value, 0);
  const balanceVariable = avgVarIncome - avgVarExpense;
  const balanceTotal = balanceFijo + balanceVariable;
```
Replacement content:
```javascript
  // 1. Calculate dynamic liabilities total
  const liabilitiesTotal = debtsState.reduce((sum, d) => {
    if (d.completed) return sum;
    const paidCount = (d.cuotas || []).filter(Boolean).length;
    if (d.cuotasTotales === 0) return sum + d.total;
    if (d.cuotasTotales === 1) return sum + (paidCount === 1 ? 0 : d.total);
    return sum + Math.round(d.total * (1 - paidCount / d.cuotasTotales));
  }, 0);

  const patrimonioNeto = assetsTotal - liabilitiesTotal;

  // Get the latest month from historical flows
  const latestMonthFromFlows = React.useMemo(() => {
    if (!historicalFlowsState || historicalFlowsState.length === 0) return null;
    const parseMonthYear = (str) => {
      const p = str.split(' ');
      const abbr = p[0];
      const yr = parseInt(p[1], 10);
      const monthMap = {
        "Ene": 0, "Feb": 1, "Mar": 2, "Abr": 3, "May": 4, "Jun": 5,
        "Jul": 6, "Ago": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dic": 11
      };
      return new Date(yr, monthMap[abbr] || 0);
    };
    const sorted = [...historicalFlowsState].sort((a, b) => parseMonthYear(b.month) - parseMonthYear(a.month));
    return sorted[0];
  }, [historicalFlowsState]);

  const latestMonthDetails = latestMonthFromFlows ? (monthlyDetailsState[latestMonthFromFlows.month] || { ingresos: [], egresos: [] }) : null;

  // 2. Calculate dynamic fixed structural flows from the latest month (or fallback to projections)
  const ingresosFijosTotal = latestMonthDetails 
    ? latestMonthDetails.ingresos.filter(it => !it.isVariable).reduce((sum, item) => sum + item.value, 0)
    : ingresosFijosState.reduce((sum, item) => sum + item.value, 0);

  const egresosFijosTotal = latestMonthDetails 
    ? latestMonthDetails.egresos.filter(it => !it.isVariable).reduce((sum, item) => sum + item.value, 0)
    : egresosFijosState.reduce((sum, item) => sum + item.value, 0);

  const balanceFijo = ingresosFijosTotal - egresosFijosTotal;

  // 3. Calculate dynamic variable structural flows from the latest month (or fallback to projections)
  const avgVarIncome = latestMonthDetails 
    ? latestMonthDetails.ingresos.filter(it => it.isVariable).reduce((sum, item) => sum + item.value, 0)
    : ingresosVariablesState.reduce((sum, item) => sum + item.value, 0);

  const avgVarExpense = latestMonthDetails 
    ? latestMonthDetails.egresos.filter(it => it.isVariable).reduce((sum, item) => sum + item.value, 0)
    : egresosVariablesState.reduce((sum, item) => sum + item.value, 0);

  const balanceVariable = avgVarIncome - avgVarExpense;
  const balanceTotal = balanceFijo + balanceVariable;
```

- [ ] **Step 2: Commit**

Run:
```bash
git add src/sections/DashboardView.jsx
git commit -m "feat: sync Dashboard KPI cards with actual monthly flow data"
```

---

### Task 2: Implementar lógica de agregar/eliminar meses en `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Actualizar `addHistoricalMonth` para pre-poblar ingresos y egresos fijos**

Target content (around lines 1422-1445):
```javascript
  const addHistoricalMonth = async (monthName) => {
    if (!monthName) return false;
    
    // Parsear el trimestre desde el mes (ej: "Jul 2026" -> "Q3 2026")
    const parts = monthName.split(' ');
    const monthAbbr = parts[0];
    const year = parts[1];
    
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
```
Replacement content:
```javascript
  const addHistoricalMonth = async (monthName, selectedIncomes = [], selectedExpenses = []) => {
    if (!monthName) return false;
    
    // Parsear el trimestre desde el mes (ej: "Jul 2026" -> "Q3 2026")
    const parts = monthName.split(' ');
    const monthAbbr = parts[0];
    const year = parts[1];
    
    let q = "Q1 " + year;
    if (["Abr", "May", "Jun"].includes(monthAbbr)) {
      q = "Q2 " + year;
    } else if (["Jul", "Ago", "Sep"].includes(monthAbbr)) {
      q = "Q3 " + year;
    } else if (["Oct", "Nov", "Dic"].includes(monthAbbr)) {
      q = "Q4 " + year;
    }
    
    const totalIncomesCopied = selectedIncomes.reduce((sum, it) => sum + it.value, 0);
    const totalExpensesCopied = selectedExpenses.reduce((sum, it) => sum + it.value, 0);

    const newFlow = {
      month: monthName,
      q,
      ingresos: totalIncomesCopied,
      egresos: totalExpensesCopied,
      balance: totalIncomesCopied - totalExpensesCopied
    };
```

- [ ] **Step 2: Actualizar la actualización de estado local y de Supabase en `addHistoricalMonth`**

Target content (around lines 1478-1490):
```javascript
    setHistoricalFlowsState(prev => {
      if (prev.some(f => f.month === monthName)) return prev;
      const updated = [...prev, newFlow];
      return updated.sort((a, b) => parseMonthYear(a.month) - parseMonthYear(b.month));
    });

    setMonthlyDetailsState(prev => {
      if (prev[monthName]) return prev;
      return {
        ...prev,
        [monthName]: { ingresos: [], egresos: [] }
      };
    });
```
Replacement content:
```javascript
    // Inyectar ítems seleccionados en Supabase si está conectado
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const txsToInsert = [];
        selectedIncomes.forEach(item => {
          txsToInsert.push({
            user_id: currentUser.id,
            month: monthName,
            type: 'ingreso',
            name: item.name,
            value: item.value,
            paid: false,
            is_variable: false,
            due_date: null
          });
        });
        selectedExpenses.forEach(item => {
          txsToInsert.push({
            user_id: currentUser.id,
            month: monthName,
            type: 'egreso',
            name: item.name,
            value: item.value,
            paid: false,
            is_variable: false,
            due_date: null
          });
        });

        if (txsToInsert.length > 0) {
          const { error: txsErr } = await supabase
            .from('detalles_mensuales')
            .insert(txsToInsert);
          if (txsErr) throw txsErr;
        }
      } catch (err) {
        console.error("Error al pre-poblar transacciones fijas en Supabase:", err);
      }
    }

    setHistoricalFlowsState(prev => {
      if (prev.some(f => f.month === monthName)) return prev;
      const updated = [...prev, newFlow];
      return updated.sort((a, b) => parseMonthYear(a.month) - parseMonthYear(b.month));
    });

    setMonthlyDetailsState(prev => {
      if (prev[monthName]) return prev;
      
      const incomes = selectedIncomes.map(item => ({
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        name: item.name,
        value: item.value,
        paid: false,
        isVariable: false,
        dueDate: "",
        reminderEnabled: false,
        reminderEmail: "",
        reminderTime: "3_days_before"
      }));

      const expenses = selectedExpenses.map(item => ({
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        name: item.name,
        value: item.value,
        paid: false,
        isVariable: false,
        dueDate: "",
        reminderEnabled: false,
        reminderEmail: "",
        reminderTime: "3_days_before"
      }));

      return {
        ...prev,
        [monthName]: { ingresos: incomes, egresos: expenses }
      };
    });
```

- [ ] **Step 3: Implementar función `deleteHistoricalMonth` en `src/App.jsx`**

Add the function below `addHistoricalMonth`:

```javascript
  const deleteHistoricalMonth = async (monthName) => {
    if (!monthName) return false;
    
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error: flowErr } = await supabase
          .from('flujos_historicos')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('month', monthName);
        if (flowErr) throw flowErr;

        const { error: txsErr } = await supabase
          .from('detalles_mensuales')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('month', monthName);
        if (txsErr) throw txsErr;
      } catch (err) {
        console.error("Error al eliminar mes y transacciones en Supabase:", err);
        alert("No se pudo eliminar el mes en la base de datos.");
        return false;
      }
    }

    setHistoricalFlowsState(prev => prev.filter(f => f.month !== monthName));
    setMonthlyDetailsState(prev => {
      const copy = { ...prev };
      delete copy[monthName];
      return copy;
    });

    return true;
  };
```

- [ ] **Step 4: Pasar las nuevas propiedades y funciones en el renderizado de `FlujoMensualView`**

Modify case `"flujo"` (around line 1770) to pass:
`ingresosFijosState={filteredIngresosFijos}`
`egresosFijosState={filteredEgresosFijos}`
`deleteHistoricalMonth={deleteHistoricalMonth}`

- [ ] **Step 5: Commit App.jsx changes**

Run:
```bash
git add src/App.jsx
git commit -m "feat: implement add/delete month handlers and propagate fixed states"
```

---

### Task 3: Actualizar el modal de agregar mes y las tarjetas en `FlujoMensualView`

**Files:**
- Modify: `src/sections/FlujoMensualView.jsx`

- [ ] **Step 1: Recibir las nuevas props y definir los estados del modal**

Update component parameters to accept:
- `ingresosFijosState`
- `egresosFijosState`
- `deleteHistoricalMonth`

Define state variables inside `FlujoMensualView`:
```javascript
  const [addIncomesOption, setAddIncomesOption] = useState("all"); // "all", "edit", "none"
  const [addExpensesOption, setAddExpensesOption] = useState("all"); // "all", "edit", "none"
  const [selectedIncomesCheck, setSelectedIncomesCheck] = useState({});
  const [selectedExpensesCheck, setSelectedExpensesCheck] = useState({});
```

Define the trigger handler:
```javascript
  const handleOpenAddMonth = () => {
    setAddIncomesOption("all");
    setAddExpensesOption("all");
    
    const incomesCheck = {};
    (ingresosFijosState || []).forEach(item => {
      incomesCheck[item.id] = true;
    });
    setSelectedIncomesCheck(incomesCheck);
    
    const expensesCheck = {};
    (egresosFijosState || []).forEach(item => {
      expensesCheck[item.id] = true;
    });
    setSelectedExpensesCheck(expensesCheck);
    
    setAddMonthModalOpen(true);
  };
```

- [ ] **Step 2: Actualizar el botón de Añadir Mes para que llame a `handleOpenAddMonth`**

- [ ] **Step 3: Actualizar `handleAddMonthSubmit` para filtrar y pasar los ingresos/egresos fijos**

- [ ] **Step 4: Rediseñar el modal de agregar mes para mostrar las opciones "Todos / Editar / Ninguno" y la lista de checkboxes**

- [ ] **Step 5: Implementar función `handleDeleteMonth` y agregar botones de papelera en las tarjetas**

- [ ] **Step 6: Commit FlujoMensualView changes**

Run:
```bash
git add src/sections/FlujoMensualView.jsx
git commit -m "feat: enhance Add Month modal with options checklist and add Delete Month buttons"
```

---

### Task 4: Verificación y Compilación

- [ ] **Step 1: Compilar el proyecto**

Run: `npm run build`
Expected: Compilación exitosa.

- [ ] **Step 2: Verificar con el linter**

Run: `npm run lint`
Expected: Sin errores.
