# Flujo Mensual Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the monthly cash flow dashboard (Flujo Mensual) to show the most recent month highlighted at the top with a detailed fixed and variable breakdown, list other months below it, and organize the modal's 4 breakdown cards in a symmetrical 2x2 grid.

**Architecture:** We will add CSS rules to `src/index.css` for the 2x2 grid layout and the featured month card. In `src/sections/FlujoMensualView.jsx`, we will calculate the chronologically descending list of months, render the latest month at the top, render the other months in the compact grid below, and style the modal panels using our new CSS classes.

**Tech Stack:** React, Vanilla CSS

---

### Task 1: Agregar clases CSS para la nueva distribución

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Añadir estilos de diseño para la tarjeta destacada y la cuadrícula de 2x2**

Add the following CSS declarations to the end of `src/index.css`:

```css
/* Custom styles for Flujo Mensual layout improvements */

.main-month-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--accent);
  border-radius: var(--border-radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-md);
  margin-bottom: 32px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.main-month-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.main-month-card-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .main-month-card-cols {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.main-month-col {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 20px;
}

.main-month-col-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
  border-bottom: 1.5px solid var(--border-color);
  padding-bottom: 8px;
}

.main-month-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.main-month-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 2px solid var(--border-color);
  font-weight: 600;
}

.historical-months-header {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 32px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Modal Operational Grid 2x2 */
.operational-grid-2x2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .operational-grid-2x2 {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

- [ ] **Step 2: Commit CSS changes**

Run:
```bash
git add src/index.css
git commit -m "style: add css classes for main month card and 2x2 modal grid"
```

---

### Task 2: Modificar la lógica y el renderizado en FlujoMensualView

**Files:**
- Modify: `src/sections/FlujoMensualView.jsx`

- [ ] **Step 1: Modificar `src/sections/FlujoMensualView.jsx` para implementar la ordenación de meses, el desglose detallado y la vista destacada/historial**

We will locate lines 159-168:
```javascript
  // Filter months by quarter
  const filteredMonths = historicalFlowsState.filter(item => item.q === selectedTrimestre);
```
And the months grid rendering from line 611 to 669:
```javascript
      {/* Cards por Mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {filteredMonths.map(item => {
          ...
        })}
      </div>
```
And replace them to:
1. Define a memoized function to sort `filteredMonths` chronologically descending.
2. Define a helper function `getMonthDetailedTotals` to aggregate fixed/variable transactions from `monthlyDetailsState` for a month name.
3. Render the highlighted month card at the top (if any exists).
4. Render the remaining months under "Otros Meses del Trimestre" in the original grid layout.
5. In the details modal, replace the inline grid with the `.operational-grid-2x2` CSS class.

Let's specify the exact replacement chunks for `FlujoMensualView.jsx`.

**Replacement Chunk 1 (Sort and Helper Setup):**
Target content:
```javascript
  // Filter months by quarter
  const filteredMonths = historicalFlowsState.filter(item => item.q === selectedTrimestre);
```
Replacement content:
```javascript
  // Filter months by quarter
  const filteredMonths = historicalFlowsState.filter(item => item.q === selectedTrimestre);

  // Sort months chronologically descending (newest first)
  const sortedFilteredMonths = React.useMemo(() => {
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
    return [...filteredMonths].sort((a, b) => parseMonthYear(b.month) - parseMonthYear(a.month));
  }, [filteredMonths]);

  const latestMonth = sortedFilteredMonths[0];
  const otherMonths = sortedFilteredMonths.slice(1);

  // Helper to get fixed and variable totals for a specific month
  const getMonthDetailedTotals = (monthName) => {
    const monthDetails = monthlyDetailsState[monthName] || { ingresos: [], egresos: [] };
    const incomes = monthDetails.ingresos || [];
    const expenses = monthDetails.egresos || [];

    const ingresosFijos = incomes.filter(x => !x.isVariable).reduce((sum, x) => sum + x.value, 0);
    const ingresosVariables = incomes.filter(x => x.isVariable).reduce((sum, x) => sum + x.value, 0);
    const egresosFijos = expenses.filter(x => !x.isVariable).reduce((sum, x) => sum + x.value, 0);
    const egresosVariables = expenses.filter(x => x.isVariable).reduce((sum, x) => sum + x.value, 0);
    
    return {
      ingresosFijos,
      ingresosVariables,
      egresosFijos,
      egresosVariables
    };
  };
```

**Replacement Chunk 2 (Main Page Render):**
Target content:
```javascript
      {/* Cards por Mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {filteredMonths.map(item => {
          const isNegative = item.balance < 0;
          return (
            <div 
              key={item.month} 
              className="card" 
              onClick={() => setSelectedMonthDetail(item.month)}
              style={{ 
                cursor: 'pointer', 
                borderLeft: `4px solid ${isNegative ? 'var(--danger)' : 'var(--success)'}`,
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--text-secondary)" />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>{item.month}</span>
                </div>
                <span className={`badge ${isNegative ? 'danger' : 'success'}`}>
                  {isNegative ? 'Deficit' : 'Superávit'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ingresos totales</span>
                  <strong className="num-positive">{formatMoney(item.ingresos)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Egresos totales</span>
                  <strong className="num-negative">{formatMoney(item.egresos)}</strong>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                  <strong>Balance del Mes</strong>
                  <strong className={isNegative ? "num-negative" : "num-positive"}>
                    {isNegative ? '' : '+'}{formatMoney(item.balance)}
                  </strong>
                </div>
              </div>

              <div style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: 'var(--accent)', 
                fontWeight: 500,
                padding: '6px',
                borderRadius: '6px',
                background: 'var(--bg-primary)'
              }}>
                Ver desglose / Editar transacciones
              </div>
            </div>
          );
        })}
      </div>
```
Replacement content:
```javascript
      {/* Tarjeta del Mes Principal */}
      {latestMonth && (() => {
        const { ingresosFijos, ingresosVariables, egresosFijos, egresosVariables } = getMonthDetailedTotals(latestMonth.month);
        const isNegative = latestMonth.balance < 0;
        
        return (
          <div 
            className="main-month-card" 
            style={{ borderLeft: `4px solid ${isNegative ? 'var(--danger)' : 'var(--success)'}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={22} color="var(--accent)" />
                <span style={{ fontSize: '22px', fontWeight: 700 }}>{latestMonth.month}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px', fontWeight: 500 }}>(Mes Actual / Principal)</span>
              </div>
              <span className={`badge ${isNegative ? 'danger' : 'success'}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                {isNegative ? 'Deficit' : 'Superávit'}
              </span>
            </div>

            <div className="main-month-card-cols">
              {/* Columna de Ingresos */}
              <div className="main-month-col">
                <div className="main-month-col-title" style={{ color: 'var(--success)' }}>Ingresos</div>
                <div className="main-month-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Ingresos Fijos</span>
                  <strong>{formatMoney(ingresosFijos)}</strong>
                </div>
                <div className="main-month-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Ingresos Variables</span>
                  <strong>{formatMoney(ingresosVariables)}</strong>
                </div>
                <div className="main-month-total-row">
                  <span>Ingresos Totales</span>
                  <span className="num-positive" style={{ fontSize: '16px' }}>{formatMoney(latestMonth.ingresos)}</span>
                </div>
              </div>

              {/* Columna de Egresos */}
              <div className="main-month-col">
                <div className="main-month-col-title" style={{ color: 'var(--danger)' }}>Egresos</div>
                <div className="main-month-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Egresos Fijos</span>
                  <strong>{formatMoney(egresosFijos)}</strong>
                </div>
                <div className="main-month-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Egresos Variables</span>
                  <strong>{formatMoney(egresosVariables)}</strong>
                </div>
                <div className="main-month-total-row">
                  <span>Egresos Totales</span>
                  <span className="num-negative" style={{ fontSize: '16px' }}>{formatMoney(latestMonth.egresos)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginRight: '8px' }}>Balance del Mes:</span>
                <strong style={{ fontSize: '20px' }} className={isNegative ? "num-negative" : "num-positive"}>
                  {isNegative ? '' : '+'}{formatMoney(latestMonth.balance)}
                </strong>
              </div>
              <button 
                onClick={() => setSelectedMonthDetail(latestMonth.month)}
                style={{ 
                  background: 'var(--accent)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: '13px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background 0.2s'
                }}
              >
                Ver desglose / Editar transacciones
              </button>
            </div>
          </div>
        );
      })()}

      {/* Otros Meses */}
      {otherMonths.length > 0 && (
        <>
          <h4 className="historical-months-header">
            <Calendar size={18} color="var(--text-secondary)" />
            Otros Meses del Trimestre
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {otherMonths.map(item => {
              const isNegative = item.balance < 0;
              return (
                <div 
                  key={item.month} 
                  className="card" 
                  onClick={() => setSelectedMonthDetail(item.month)}
                  style={{ 
                    cursor: 'pointer', 
                    borderLeft: `4px solid ${isNegative ? 'var(--danger)' : 'var(--success)'}`,
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={18} color="var(--text-secondary)" />
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>{item.month}</span>
                    </div>
                    <span className={`badge ${isNegative ? 'danger' : 'success'}`}>
                      {isNegative ? 'Deficit' : 'Superávit'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Ingresos totales</span>
                      <strong className="num-positive">{formatMoney(item.ingresos)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Egresos totales</span>
                      <strong className="num-negative">{formatMoney(item.egresos)}</strong>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                      <strong>Balance del Mes</strong>
                      <strong className={isNegative ? "num-negative" : "num-positive"}>
                        {isNegative ? '' : '+'}{formatMoney(item.balance)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: '12px', 
                    color: 'var(--accent)', 
                    fontWeight: 500,
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'var(--bg-primary)'
                  }}>
                    Ver desglose / Editar transacciones
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
```

**Replacement Chunk 3 (Modal Grid Replace):**
Target content:
```javascript
            {/* Grid Columns for Incomes / Expenses - 4 Panels */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: '24px', 
              marginTop: '20px' 
            }}>
```
Replacement content:
```javascript
            {/* Grid Columns for Incomes / Expenses - 4 Panels (2x2 Grid) */}
            <div className="operational-grid-2x2">
```

- [ ] **Step 2: Commit FlujoMensualView changes**

Run:
```bash
git add src/sections/FlujoMensualView.jsx
git commit -m "feat: implement main month layout highlighting and 2x2 modal grid in FlujoMensualView"
```

---

### Task 3: Verificación y Compilación

- [ ] **Step 1: Ejecutar la compilación del proyecto para asegurar que no hay errores de sintaxis**

Run: `npm run build`
Expected: Compilación exitosa sin errores de React/Vite.

- [ ] **Step 2: Ejecutar el linter**

Run: `npm run lint`
Expected: Sin errores de lint en los archivos modificados.
