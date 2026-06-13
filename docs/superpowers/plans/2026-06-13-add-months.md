# Selección y Creación Dinámica de Meses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir a los usuarios de GANANCY añadir, seleccionar y editar cualquier mes (histórico o futuro) de forma dinámica, manteniendo la base de datos limpia y la interfaz ordenada cronológicamente.

**Architecture:** Implementaremos una función global `addHistoricalMonth` en `App.jsx` que inserte registros en Supabase (si está logueado) y en el estado local de React. Reemplazaremos los trimestres estáticos en `FlujoMensualView.jsx` por una lista única y ordenada calculada dinámicamente en base a los meses cargados, y agregaremos el componente de modal interactivo `AddMonthModal` en el Dashboard y la Vista Mensual.

**Tech Stack:** React (JSX), CSS, Supabase JS Client, Lucide-React.

---

### Task 1: Acción Global para Añadir Meses en App.jsx

**Files:**
- Modify: `src/App.jsx` (alrededor de las líneas 1261-1264 antes de `updateMonthlyTransaction`)

- [ ] **Step 1: Implementar la función `addHistoricalMonth`**
  Agregaremos la función en `src/App.jsx` que maneje el cálculo de trimestre, inserte el registro en la tabla `flujos_historicos` de Supabase (si existe usuario logueado), inserte el nuevo mes de forma ordenada en `historicalFlowsState` e inicialice `monthlyDetailsState[newMonth]` como un objeto vacío con ingresos y egresos.
  
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

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('flujos_historicos')
          .insert({
            user_id: currentUser.id,
            month: monthName,
            q,
            ingresos: 0,
            egresos: 0,
            balance: 0
          });
        if (error) throw error;
      } catch (err) {
        console.error("Error al insertar mes en Supabase:", err);
        alert("No se pudo agregar el mes en la base de datos.");
        return false;
      }
    }

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

    return true;
  };
  ```

- [ ] **Step 2: Pasar la función a los componentes secundarios**
  Modificar el render de `App.jsx` para pasar `addHistoricalMonth` como prop a `DashboardView` y a `FlujoMensualView`.
  
  En `src/App.jsx` (alrededor de la línea 1457-1543, buscar los lugares donde se instancian `<DashboardView />` y `<FlujoMensualView />`):
  
  ```javascript
  // Para DashboardView:
  addHistoricalMonth={addHistoricalMonth}

  // Para FlujoMensualView:
  addHistoricalMonth={addHistoricalMonth}
  ```

- [ ] **Step 3: Guardar y verificar compilación de App.jsx**
  Correr: `npm run build` o revisar que no haya errores de sintaxis en la consola de desarrollo de Vite.

---

### Task 2: Trimestres Dinámicos en la Vista de Flujo Mensual

**Files:**
- Modify: `src/sections/FlujoMensualView.jsx` (reemplazando trimestres estáticos y destructurando la nueva prop)

- [ ] **Step 1: Destructurar `addHistoricalMonth` de las props**
  En `src/sections/FlujoMensualView.jsx` (línea 5-10):
  
  ```javascript
  export default function FlujoMensualView({ 
    historicalFlowsState, 
    monthlyDetailsState, 
    updateMonthlyTransaction,
    currentContext,
    addHistoricalMonth
  }) {
  ```

- [ ] **Step 2: Reemplazar `selectedTrimestre` y añadir `uniqueQuarters` dinámico**
  En lugar del listado estático, calcularemos dinámicamente los trimestres presentes en `historicalFlowsState` y los ordenaremos cronológicamente:
  
  ```javascript
  const uniqueQuarters = React.useMemo(() => {
    const quarters = historicalFlowsState.map(item => item.q);
    const unique = [];
    quarters.forEach(q => {
      if (q && !unique.includes(q)) {
        unique.push(q);
      }
    });
    
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

  const [selectedTrimestre, setSelectedTrimestre] = useState(() => {
    if (historicalFlowsState && historicalFlowsState.length > 0) {
      return historicalFlowsState[historicalFlowsState.length - 1].q;
    }
    return "Q2 2026";
  });
  ```

- [ ] **Step 3: Dinamizar los botones de trimestres en el render**
  En el render de `FlujoMensualView.jsx` (alrededor de la línea 250), usaremos `uniqueQuarters` y una función para dar formato al botón:
  
  ```javascript
  const formatQuarterLabel = (q) => {
    if (!q) return "";
    const parts = q.split(' ');
    if (parts.length === 2) {
      const qNum = parts[0].replace('Q', '');
      return `Trimestre ${qNum} ${parts[1]}`;
    }
    return q;
  };
  ```
  Y en el mapeo:
  ```javascript
  <div style={{ display: 'flex', background: 'var(--border-color)', padding: '4px', borderRadius: '10px', gap: '2px', flexWrap: 'wrap' }}>
    {uniqueQuarters.map(q => (
      <button
        key={q}
        onClick={() => setSelectedTrimestre(q)}
        style={{
          border: 'none',
          background: selectedTrimestre === q ? 'var(--bg-secondary)' : 'transparent',
          color: selectedTrimestre === q ? 'var(--text-primary)' : 'var(--text-secondary)',
          padding: '6px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: selectedTrimestre === q ? 'var(--shadow-sm)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        {formatQuarterLabel(q)}
      </button>
    ))}
  </div>
  ```

---

### Task 3: Modal de Creación de Meses "AddMonthModal" e Integración en Dashboard

**Files:**
- Modify: `src/sections/DashboardView.jsx`

- [ ] **Step 1: Recibir la prop `addHistoricalMonth`**
  Modificar la declaración de `DashboardView` para destructurar `addHistoricalMonth`:
  ```javascript
  export default function DashboardView({ 
    // ...
    historicalFlowsState = [],
    updateMonthlyTransaction,
    currentContext,
    addAsset,
    addDebt,
    addHistoricalMonth
  }) {
  ```

- [ ] **Step 2: Crear el modal flotante de selección de mes y año**
  Definir los estados para abrir el modal y seleccionar el mes y año en `DashboardView.jsx` (alrededor de la línea 170):
  
  ```javascript
  const [addMonthModalOpen, setAddMonthModalOpen] = useState(false);
  const [newMonthSelect, setNewMonthSelect] = useState("Ene");
  const [newYearSelect, setNewYearSelect] = useState(new Date().getFullYear());
  ```

- [ ] **Step 3: Agregar la función que llama a `addHistoricalMonth` en el envío del modal**
  ```javascript
  const handleAddMonthSubmit = async (e) => {
    e.preventDefault();
    const monthName = `${newMonthSelect} ${newYearSelect}`;
    
    // Verificar duplicado
    if (historicalFlowsState.some(f => f.month === monthName)) {
      alert("El periodo seleccionado ya existe en el registro.");
      return;
    }
    
    const success = await addHistoricalMonth(monthName);
    if (success) {
      setSelectedMonthForReceipt(monthName);
      setAddMonthModalOpen(false);
    }
  };
  ```

- [ ] **Step 4: Agregar el botón "+" al lado del select en DashboardView.jsx**
  En el render de `DashboardView.jsx` (alrededor de la línea 2288):
  
  ```javascript
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mes:</span>
    <select
      value={selectedMonthForReceipt}
      onChange={e => setSelectedMonthForReceipt(e.target.value)}
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
        padding: '6px 10px',
        borderRadius: '8px',
        fontSize: '11.5px',
        fontWeight: 600,
        outline: 'none',
        cursor: 'pointer'
      }}
    >
      {historicalFlowsState.map(f => (
        <option key={f.month} value={f.month}>{f.month}</option>
      ))}
      {historicalFlowsState.length === 0 && (
        <option value="Mayo 2026">Mayo 2026</option>
      )}
    </select>
    
    <button
      onClick={() => setAddMonthModalOpen(true)}
      style={{
        background: 'var(--accent)',
        color: 'white',
        border: 'none',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        outline: 'none'
      }}
      title="Agregar periodo contable"
      className="theme-btn"
    >
      <Plus size={14} />
    </button>
  </div>
  ```

- [ ] **Step 5: Renderizar el JSX del Modal flotante en DashboardView.jsx**
  Agregar al final del componente:
  ```javascript
  {addMonthModalOpen && (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setAddMonthModalOpen(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px', padding: '24px' }}>
        <button className="close-btn" onClick={() => setAddMonthModalOpen(false)}>
          <X size={16} />
        </button>

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Agregar Periodo Contable</h3>

        <form onSubmit={handleAddMonthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mes</label>
            <select
              value={newMonthSelect}
              onChange={e => setNewMonthSelect(e.target.value)}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Ene">Enero</option>
              <option value="Feb">Febrero</option>
              <option value="Mar">Marzo</option>
              <option value="Abr">Abril</option>
              <option value="May">Mayo</option>
              <option value="Jun">Junio</option>
              <option value="Jul">Julio</option>
              <option value="Ago">Agosto</option>
              <option value="Sep">Septiembre</option>
              <option value="Oct">Octubre</option>
              <option value="Nov">Noviembre</option>
              <option value="Dic">Diciembre</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Año</label>
            <select
              value={newYearSelect}
              onChange={e => setNewYearSelect(Number(e.target.value))}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
            >
              {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '6px',
              transition: 'background 0.2s'
            }}
          >
            Agregar Mes
          </button>
        </form>
      </div>
    </div>
  )}
  ```

---

### Task 4: Integración del Modal en la Vista de Flujo Mensual

**Files:**
- Modify: `src/sections/FlujoMensualView.jsx`

- [ ] **Step 1: Agregar estados locales para el modal**
  ```javascript
  const [addMonthModalOpen, setAddMonthModalOpen] = useState(false);
  const [newMonthSelect, setNewMonthSelect] = useState("Ene");
  const [newYearSelect, setNewYearSelect] = useState(new Date().getFullYear());
  ```

- [ ] **Step 2: Agregar botón "+" junto a los trimestres**
  En `FlujoMensualView.jsx` (alrededor de la línea 270, cerca de los botones de trimestres):
  
  ```javascript
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <button
      onClick={() => setAddMonthModalOpen(true)}
      style={{
        background: 'rgba(var(--accent-rgb), 0.1)',
        border: '1px solid rgba(var(--accent-rgb), 0.3)',
        color: 'var(--accent)',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12.5px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        outline: 'none'
      }}
      title="Agregar nuevo mes"
    >
      <Plus size={14} /> Añadir Mes
    </button>
  </div>
  ```

- [ ] **Step 3: Implementar el manejador de envío y autocambio de trimestre**
  ```javascript
  const handleAddMonthSubmit = async (e) => {
    e.preventDefault();
    const monthName = `${newMonthSelect} ${newYearSelect}`;
    
    if (historicalFlowsState.some(f => f.month === monthName)) {
      alert("El periodo seleccionado ya existe en el registro.");
      return;
    }
    
    const success = await addHistoricalMonth(monthName);
    if (success) {
      // Calcular a qué trimestre pertenece el nuevo mes
      const parts = monthName.split(' ');
      const monthAbbr = parts[0];
      const year = parts[1];
      
      let targetQ = "Q1 " + year;
      if (["Abr", "May", "Jun"].includes(monthAbbr)) {
        targetQ = "Q2 " + year;
      } else if (["Jul", "Ago", "Sep"].includes(monthAbbr)) {
        targetQ = "Q3 " + year;
      } else if (["Oct", "Nov", "Dic"].includes(monthAbbr)) {
        targetQ = "Q4 " + year;
      }
      
      setSelectedTrimestre(targetQ);
      setAddMonthModalOpen(false);
    }
  };
  ```

- [ ] **Step 4: Renderizar el JSX del Modal flotante en FlujoMensualView.jsx**
  Agregar al final del componente:
  ```javascript
  {addMonthModalOpen && (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setAddMonthModalOpen(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px', padding: '24px' }}>
        <button className="close-btn" onClick={() => setAddMonthModalOpen(false)}>
          <X size={16} />
        </button>

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Agregar Periodo Contable</h3>

        <form onSubmit={handleAddMonthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mes</label>
            <select
              value={newMonthSelect}
              onChange={e => setNewMonthSelect(e.target.value)}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Ene">Enero</option>
              <option value="Feb">Febrero</option>
              <option value="Mar">Marzo</option>
              <option value="Abr">Abril</option>
              <option value="May">Mayo</option>
              <option value="Jun">Junio</option>
              <option value="Jul">Julio</option>
              <option value="Ago">Agosto</option>
              <option value="Sep">Septiembre</option>
              <option value="Oct">Octubre</option>
              <option value="Nov">Noviembre</option>
              <option value="Dic">Diciembre</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Año</label>
            <select
              value={newYearSelect}
              onChange={e => setNewYearSelect(Number(e.target.value))}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
            >
              {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '6px',
              transition: 'background 0.2s'
            }}
          >
            Agregar Mes
          </button>
        </form>
      </div>
    </div>
  )}
  ```

---

### Task 5: Verificación y Compilación Final

- [ ] **Step 1: Compilar la aplicación**
  Run: `npm run build`
  Expected: Compile successfully, zero Errors.

- [ ] **Step 2: Probar la creación de meses en local**
  - Entrar al panel de desarrollo, hacer clic en Resetear Datos a Defectos.
  - Verificar que el listado histórico original (Oct 2025 a Jun 2026) se muestre correctamente.
  - Hacer clic en `+` al lado de Mes en el Dashboard, crear "Jul 2026".
  - Verificar que se agregue "Jul 2026" al selector de meses y quede seleccionado.
  - Verificar que en el "Flujo Mensual" aparezca el botón "Trimestre 3 2026" y al seleccionarlo se vea la tarjeta de "Jul 2026" vacía ($0).
  - Añadir una transacción de ingreso de $500,000 en Julio 2026 y verificar que el balance del mes suba correctamente.
