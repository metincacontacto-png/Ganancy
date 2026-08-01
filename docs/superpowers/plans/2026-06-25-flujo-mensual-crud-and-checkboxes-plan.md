# Flujo Mensual CRUD & Checkbox Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable editing and deletion for virtual debt links in the monthly flow, and fix the checkboxes (blank boxes next to items) so they can successfully mark both regular items and virtual debt links as paid/received and reflect them in the totals.

**Architecture:** 
1. Pass the missing `toggleCuota={toggleCuota}` prop from `src/App.jsx` to `FlujoMensualView`.
2. Update the transaction table rendering in `src/sections/FlujoMensualView.jsx` to show edit and delete buttons for virtual debt links (unconditionally).
3. Update `filteredMonthlyDetails` in `src/App.jsx` to filter out excluded virtual debt links (checking for `__EXCLUDED__` prefixes).
4. Update `updateMonthlyTransaction` in `src/App.jsx` to handle edit and delete actions on virtual debt links by inserting exclusion rows (and new custom records if editing) in Supabase and updating the local state.

**Tech Stack:** React, Supabase, Vanilla CSS

---

### Task 1: Pasar prop `toggleCuota` a FlujoMensualView

**Files:**
- Modify: `src/App.jsx:1768-1776`

- [ ] **Step 1: Modificar `src/App.jsx` para pasar `toggleCuota`**

Target content:
```javascript
      case "flujo":
        return (
          <FlujoMensualView 
            historicalFlowsState={filteredHistoricalFlows}
            monthlyDetailsState={filteredMonthlyDetails}
            updateMonthlyTransaction={updateMonthlyTransaction}
            currentContext={currentContext}
            addHistoricalMonth={addHistoricalMonth}
          />
        );
```
Replacement content:
```javascript
      case "flujo":
        return (
          <FlujoMensualView 
            historicalFlowsState={filteredHistoricalFlows}
            monthlyDetailsState={filteredMonthlyDetails}
            updateMonthlyTransaction={updateMonthlyTransaction}
            currentContext={currentContext}
            addHistoricalMonth={addHistoricalMonth}
            toggleCuota={toggleCuota}
          />
        );
```

- [ ] **Step 2: Commit**

Run:
```bash
git add src/App.jsx
git commit -m "fix: pass toggleCuota prop to FlujoMensualView"
```

---

### Task 2: Habilitar botones de Editar/Eliminar para todos los ítems

**Files:**
- Modify: `src/sections/FlujoMensualView.jsx`

- [ ] **Step 1: Remover la restricción `!item.isDebtLink` en los botones de acción**

Target content (around lines 510-520):
```javascript
                      {!item.isDebtLink && (
                        <>
                          <button 
                            onClick={() => handleOpenEdit(type, item.originalIndex, item)} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }} 
                            title="Editar"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button 
                            onClick={() => handleTransDelete(type, item.originalIndex, item.name, item.id)} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }} 
                            title="Eliminar"
                          >
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
```
Replacement content:
```javascript
                      <>
                        <button 
                          onClick={() => handleOpenEdit(type, item.originalIndex, item)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }} 
                          title="Editar"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button 
                          onClick={() => handleTransDelete(type, item.originalIndex, item.name, item.id)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }} 
                          title="Eliminar"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
```

- [ ] **Step 2: Commit**

Run:
```bash
git add src/sections/FlujoMensualView.jsx
git commit -m "feat: show edit and delete buttons for virtual debt links in FlujoMensualView"
```

---

### Task 3: Implementar la lógica de exclusión y sobreescritura de deudas virtuales

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Filtrar deudas virtuales excluidas en `filteredMonthlyDetails`**

We will locate `filteredMonthlyDetails` around line 308:
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
```
And replace it to detect exclusions starting with `__EXCLUDED__`:
```javascript
  const filteredMonthlyDetails = React.useMemo(() => {
    const res = {};
    const exclusions = {}; // month -> Set of excluded IDs
    
    // 1. Copiar los detalles existentes y detectar exclusiones
    Object.keys(monthlyDetailsState).forEach(month => {
      const monthObj = monthlyDetailsState[month] || { ingresos: [], egresos: [] };
      exclusions[month] = new Set();
      
      const cleanIngresos = [];
      const cleanEgresos = [];
      
      (monthObj.ingresos || []).forEach(it => {
        if (it.name && it.name.startsWith('__EXCLUDED__')) {
          const excludedId = it.name.replace('__EXCLUDED__', '');
          exclusions[month].add(excludedId);
        } else {
          cleanIngresos.push(it);
        }
      });
      
      (monthObj.egresos || []).forEach(it => {
        if (it.name && it.name.startsWith('__EXCLUDED__')) {
          const excludedId = it.name.replace('__EXCLUDED__', '');
          exclusions[month].add(excludedId);
        } else {
          cleanEgresos.push(it);
        }
      });
      
      res[month] = {
        ingresos: cleanIngresos,
        egresos: cleanEgresos
      };
    });
```

And then, where we inject fixed cuotas:
```javascript
          if (index_M >= 0 && index_M < debt.cuotasTotales) {
            const virtualId = `debt_virtual_${debt.id}_${index_M}`;
            if (exclusions[month] && exclusions[month].has(virtualId)) {
              return; // Skip this virtual installment
            }
```
And single payments:
```javascript
            if (debtMonth === month) {
              const virtualId = `debt_virtual_${debt.id}`;
              if (exclusions[month] && exclusions[month].has(virtualId)) {
                return; // Skip this virtual payment
              }
```

Let's write down the exact replacements in Task 3 execution.

- [ ] **Step 2: Manejar la edición y eliminación de deudas virtuales en `updateMonthlyTransaction`**

We will locate `updateMonthlyTransaction` around line 1500 and add the interception logic for `"debt_virtual_"` IDs.

- [ ] **Step 3: Commit**

Run:
```bash
git add src/App.jsx
git commit -m "feat: implement virtual debt link editing and deletion via exclusion rows"
```

---

### Task 4: Verificación y Compilación

- [ ] **Step 1: Compilar el proyecto**

Run: `npm run build`
Expected: Compilación exitosa.

- [ ] **Step 2: Verificar con el linter**

Run: `npm run lint`
Expected: Cero errores en los archivos modificados.
