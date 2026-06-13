// Test script for debt replication and rollover logic
const assert = require('assert');

// 1. Helper functions from App.jsx
const parseMonthYear = (str) => {
  if (!str) return new Date();
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

const getStartMonth = (debt) => {
  if (debt.startMonth) return debt.startMonth;
  const match = debt.details && debt.details.match(/\[StartMonth:\s*([^\]\s]+)\s*(\d+)\]/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  const baseMonth = "May 2026";
  const date = parseMonthYear(baseMonth);
  const cuotaAct = debt.cuotaActual || 0;
  date.setMonth(date.getMonth() - cuotaAct);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// 2. Simulated debts State (like template data)
const debtsState = [
  {
    id: "credito_be",
    name: "Crédito consumo BE",
    total: 5234023,
    cuotaActual: 22,
    cuotasTotales: 66,
    montoMensual: 119000,
    tipo: "fija",
    details: "Deuda Banco Estado",
    context: "personal",
    cuotas: Array.from({ length: 66 }, (_, i) => i < 22) // cuotas 0..21 are paid (true), index 22 is first unpaid (false)
  },
  {
    id: "deuda_pato",
    name: "Deuda Pato",
    total: 625000,
    cuotaActual: 0,
    cuotasTotales: 1,
    montoMensual: 0,
    tipo: "pago_unico",
    fechaVencimiento: "2026-06-15",
    details: "Pago único Pato",
    context: "empresa",
    completed: false,
    cuotas: [false]
  }
];

const monthlyDetailsState = {
  "Abr 2026": { ingresos: [], egresos: [] },
  "May 2026": { ingresos: [], egresos: [] },
  "Jun 2026": { ingresos: [], egresos: [] },
  "Jul 2026": { ingresos: [], egresos: [] }
};

// 3. Dynamic replication calculation
const runSimulation = (currentContext) => {
  const filterByActiveContext = (list) => {
    if (currentContext === 'empresa') {
      return list.filter(item => !item.name.includes('[Personal]'));
    } else if (currentContext === 'personal') {
      return list.filter(item => item.name.includes('[Personal]'));
    }
    return list;
  };

  const res = {};
  Object.keys(monthlyDetailsState).forEach(month => {
    res[month] = { ingresos: [], egresos: [] };
  });

  const sortedMonths = Object.keys(res).sort((a, b) => parseMonthYear(a) - parseMonthYear(b));
  const accumulatedUnpaid = {};

  sortedMonths.forEach(month => {
    debtsState.forEach(debt => {
      const suffix = debt.context === 'personal' ? ' [Personal]' : ' [Empresa]';
      const taggedName = debt.name.includes('[Personal]') || debt.name.includes('[Empresa]') 
        ? debt.name 
        : debt.name + suffix;

      // Case A: Fija / Cuotas
      if (debt.tipo === "fija" || debt.cuotasTotales > 1) {
        const startMonth = getStartMonth(debt);
        const index_M = getMonthDistance(startMonth, month);
        
        if (index_M >= 0 && index_M < debt.cuotasTotales) {
          const isCurrentPaid = debt.cuotas && debt.cuotas[index_M];
          const prevUnpaidCount = accumulatedUnpaid[debt.id] || 0;
          
          if (isCurrentPaid) {
            res[month].egresos.push({
              id: `debt_virtual_${debt.id}_${index_M}`,
              name: taggedName,
              value: debt.montoMensual,
              paid: true,
              isVariable: false,
              isDebtLink: true,
              cuotaIndex: index_M,
              debtId: debt.id
            });
          } else {
            const totalUnpaidCountForThisMonth = prevUnpaidCount + 1;
            const totalValueDue = debt.montoMensual * totalUnpaidCountForThisMonth;
            const labelNote = prevUnpaidCount > 0 
              ? ` (Incluye ${prevUnpaidCount} cuota${prevUnpaidCount > 1 ? 's' : ''} anterior${prevUnpaidCount > 1 ? 'es' : ''} impaga${prevUnpaidCount > 1 ? 's' : ''})` 
              : "";

            res[month].egresos.push({
              id: `debt_virtual_${debt.id}_${index_M}`,
              name: taggedName + labelNote,
              value: totalValueDue,
              paid: false,
              isVariable: false,
              isDebtLink: true,
              cuotaIndex: index_M,
              debtId: debt.id,
              unpaidCount: totalUnpaidCountForThisMonth
            });
            
            accumulatedUnpaid[debt.id] = totalUnpaidCountForThisMonth;
          }
        }
      }

      // Case B: Pago Único
      if (debt.tipo === "pago_unico" && debt.fechaVencimiento) {
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

  const filteredRes = {};
  Object.keys(res).forEach(month => {
    filteredRes[month] = {
      ingresos: filterByActiveContext(res[month].ingresos),
      egresos: filterByActiveContext(res[month].egresos)
    };
  });

  return filteredRes;
};

// --- RUN TESTS ---

console.log("Running parsedMonthYear & getStartMonth tests...");
const startBE = getStartMonth(debtsState[0]);
console.log("Inferred Start Month for BE (cuotaActual=22 relative to May 2026):", startBE);
assert.strictEqual(startBE, "Jul 2024"); // May 2026 (month 4) - 22 months = July 2024 (month 6)

// Run simulation with consolidated context (no filters)
console.log("Running simulation...");
const simConsolidado = runSimulation("consolidado");

// Check May 2026
const MayEgresos = simConsolidado["May 2026"].egresos;
const virtualBE_May = MayEgresos.find(e => e.debtId === "credito_be");
console.log("May 2026 BE Debt virtual entry:", virtualBE_May);
assert.ok(virtualBE_May);
assert.strictEqual(virtualBE_May.cuotaIndex, 22); // May 2026 - July 2024 = 22 months
assert.strictEqual(virtualBE_May.paid, false); // index 22 is false (not paid)
assert.strictEqual(virtualBE_May.value, 119000); // 1 cuota impaga

// Check Jun 2026 (BE unpaid in May should roll over)
const JunEgresos = simConsolidado["Jun 2026"].egresos;
const virtualBE_Jun = JunEgresos.find(e => e.debtId === "credito_be");
console.log("Jun 2026 BE Debt virtual entry (should roll over):", virtualBE_Jun);
assert.ok(virtualBE_Jun);
assert.strictEqual(virtualBE_Jun.cuotaIndex, 23); // Jun 2026 - July 2024 = 23 months
assert.strictEqual(virtualBE_Jun.paid, false);
assert.strictEqual(virtualBE_Jun.value, 238000); // 119000 * 2 (current + 1 unpaid)
assert.ok(virtualBE_Jun.name.includes("anterior"));

// Check Deuda Pato (Pago único in June 2026)
const pato_Jun = JunEgresos.find(e => e.debtId === "deuda_pato");
console.log("Jun 2026 Deuda Pato entry:", pato_Jun);
assert.ok(pato_Jun);
assert.strictEqual(pato_Jun.isVariable, true); // Pago único is variable expense
assert.strictEqual(pato_Jun.value, 625000);
assert.strictEqual(pato_Jun.paid, false);

console.log("Context filter tests...");
const simPersonal = runSimulation("personal");
const simEmpresa = runSimulation("empresa");

// BE is personal, Pato is empresa
assert.ok(simPersonal["May 2026"].egresos.some(e => e.debtId === "credito_be"));
assert.ok(!simPersonal["Jun 2026"].egresos.some(e => e.debtId === "deuda_pato"));

assert.ok(!simEmpresa["May 2026"].egresos.some(e => e.debtId === "credito_be"));
assert.ok(simEmpresa["Jun 2026"].egresos.some(e => e.debtId === "deuda_pato"));

console.log("All assertion tests passed successfully!");
