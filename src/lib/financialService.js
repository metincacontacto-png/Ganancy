import { supabase } from './supabaseClient';
import { ACTIVOS_DATA, PASIVOS_DATA, INGRESOS_FIJOS, EGRESOS_FIJOS, HISTORICAL_FLOWS, MONTH_DETAILS } from '../data/financialData';

/**
 * Reconstructs the nested Assets State structure from flat database rows.
 */
export const reconstructAssetsState = (rows) => {
  const categories = [
    { id: "equipos", name: "Equipos tecnológicos", total: 0, items: [] },
    { id: "audiovisual", name: "Audiovisual", total: 0, items: [] },
    { id: "iluminacion", name: "Iluminación", total: 0, items: [] },
    { id: "muebles", name: "Muebles", total: 0, items: [] },
    { id: "otros", name: "Otros", total: 0, items: [] }
  ];
  
  rows.forEach(row => {
    const cat = categories.find(c => c.id === row.category_id);
    if (cat) {
      cat.items.push({
        id: row.id,
        name: row.name,
        value: Number(row.value)
      });
    }
  });
  
  let globalTotal = 0;
  categories.forEach(cat => {
    cat.total = cat.items.reduce((sum, item) => sum + item.value, 0);
    globalTotal += cat.total;
  });
  
  return { total: globalTotal, categories };
};

/**
 * Fetches all financial data for a specific user from Supabase.
 */
export const fetchAllUserData = async (userId) => {
  try {
    // 1. Fetch Assets
    const { data: assetsRows, error: assetsErr } = await supabase
      .from('activos')
      .select('*')
      .eq('user_id', userId);
    if (assetsErr) throw assetsErr;

    // 2. Fetch Debts
    const { data: debtsRows, error: debtsErr } = await supabase
      .from('deudas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (debtsErr) throw debtsErr;

    // 3. Fetch Fixed & Variable items
    const { data: fvRows, error: fvErr } = await supabase
      .from('ingresos_egresos_fijos')
      .select('*')
      .eq('user_id', userId);
    if (fvErr) throw fvErr;

    // 4. Fetch Historical Flows
    const { data: flowsRows, error: flowsErr } = await supabase
      .from('flujos_historicos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (flowsErr) throw flowsErr;

    // 5. Fetch Monthly Detailed Transactions
    const { data: detailsRows, error: detailsErr } = await supabase
      .from('detalles_mensuales')
      .select('*')
      .eq('user_id', userId);
    if (detailsErr) throw detailsErr;

    // --- MAPPING DATA TO REACT STATES ---
    const assetsState = reconstructAssetsState(assetsRows || []);

    const debtsState = (debtsRows || []).map(d => ({
      id: d.id,
      name: d.name,
      totalOriginal: Number(d.total_original),
      interes: Number(d.interes),
      total: Number(d.total),
      cuotaActual: d.cuota_actual,
      cuotasTotales: d.cuotas_totales,
      montoMensual: Number(d.monto_mensual),
      prepago: Number(d.prepago),
      completed: d.completed,
      details: d.details || "",
      tipo: d.tipo,
      fechaVencimiento: d.fecha_vencimiento || "",
      cuotas: Array.isArray(d.cuotas) ? d.cuotas : []
    }));

    const ingresosFijosState = (fvRows || [])
      .filter(r => r.type === 'ingreso_fijo')
      .map(r => ({ id: r.id, name: r.name, value: Number(r.value) }));

    const egresosFijosState = (fvRows || [])
      .filter(r => r.type === 'egreso_fijo')
      .map(r => ({ id: r.id, name: r.name, value: Number(r.value) }));

    const ingresosVariablesState = (fvRows || [])
      .filter(r => r.type === 'ingreso_variable')
      .map(r => ({ id: r.id, name: r.name, value: Number(r.value) }));

    const egresosVariablesState = (fvRows || [])
      .filter(r => r.type === 'egreso_variable')
      .map(r => ({ id: r.id, name: r.name, value: Number(r.value) }));

    const historicalFlowsState = (flowsRows || []).map(f => ({
      id: f.id,
      month: f.month,
      q: f.q,
      ingresos: Number(f.ingresos),
      egresos: Number(f.egresos),
      balance: Number(f.balance)
    }));

    const monthlyDetailsState = {};
    // Ensure all historical months have detail blocks even if empty initially
    historicalFlowsState.forEach(f => {
      monthlyDetailsState[f.month] = { ingresos: [], egresos: [] };
    });

    (detailsRows || []).forEach(row => {
      if (!monthlyDetailsState[row.month]) {
        monthlyDetailsState[row.month] = { ingresos: [], egresos: [] };
      }
      const list = row.type === 'ingreso' ? monthlyDetailsState[row.month].ingresos : monthlyDetailsState[row.month].egresos;
      list.push({
        id: row.id,
        name: row.name,
        value: Number(row.value),
        paid: row.paid,
        isVariable: row.is_variable,
        dueDate: row.due_date || "",
        reminderEnabled: row.reminder_enabled,
        reminderEmail: row.reminder_email || "",
        reminderTime: row.reminder_time || "3_days_before",
        receiptUrl: row.receipt_url || ""
      });
    });

    return {
      assetsState,
      debtsState,
      ingresosFijosState,
      egresosFijosState,
      ingresosVariablesState,
      egresosVariablesState,
      historicalFlowsState,
      monthlyDetailsState
    };
  } catch (err) {
    console.error("Error al obtener los datos de la base de datos:", err);
    throw err;
  }
};

/**
 * Seed newly registered users with default financial template data.
 */
export const initializeDefaultUserData = async (userId) => {
  try {
    console.log("Inicializando datos por defecto para el usuario:", userId);

    // 1. Seed Assets
    const assetsInserts = [];
    ACTIVOS_DATA.categories.forEach(cat => {
      cat.items.forEach(item => {
        assetsInserts.push({
          user_id: userId,
          category_id: cat.id,
          category_name: cat.name,
          name: item.name,
          value: item.value
        });
      });
    });
    if (assetsInserts.length > 0) {
      const { error } = await supabase.from('activos').insert(assetsInserts);
      if (error) throw error;
    }

    // 2. Seed Debts
    const debtsInserts = PASIVOS_DATA.map(d => {
      const cuotas = Array.from({ length: d.cuotasTotales }, (_, i) => d.completed || i < d.cuotaActual);
      const tipo = d.cuotasTotales === 1 ? "pago_unico" : "fija";
      return {
        user_id: userId,
        name: d.name,
        total_original: d.total,
        interes: 0,
        total: d.total,
        cuota_actual: d.cuotaActual,
        cuotas_totales: d.cuotasTotales,
        monto_mensual: d.montoMensual,
        prepago: d.prepago,
        completed: d.completed,
        details: d.details || "",
        tipo,
        fecha_vencimiento: d.id === "deuda_pato" ? "2026-06-15" : d.id === "tgr_nathy" ? "2026-07-20" : null,
        cuotas
      };
    });
    if (debtsInserts.length > 0) {
      const { error } = await supabase.from('deudas').insert(debtsInserts);
      if (error) throw error;
    }

    // 3. Seed Fixed Incomes
    const fixedIncomesInserts = INGRESOS_FIJOS.map(item => ({
      user_id: userId,
      type: 'ingreso_fijo',
      name: item.name,
      value: item.value
    }));
    if (fixedIncomesInserts.length > 0) {
      const { error } = await supabase.from('ingresos_egresos_fijos').insert(fixedIncomesInserts);
      if (error) throw error;
    }

    // 4. Seed Fixed Expenses
    const fixedExpensesInserts = EGRESOS_FIJOS.map(item => ({
      user_id: userId,
      type: 'egreso_fijo',
      name: item.name,
      value: item.value
    }));
    if (fixedExpensesInserts.length > 0) {
      const { error } = await supabase.from('ingresos_egresos_fijos').insert(fixedExpensesInserts);
      if (error) throw error;
    }

    // 5. Seed Variable Incomes & Expenses (Hardcoded starting points)
    const varIncomes = [
      { name: "Servicios Motoemotion", value: 400000 },
      { name: "Servicios Pancho Papas", value: 350000 },
      { name: "Desarrollo ICENIT", value: 490000 }
    ];
    const varExpenses = [
      { name: "Comida / Varios", value: 500000 },
      { name: "Vacuna Isabella", value: 121000 },
      { name: "Manutención Pascuala", value: 340000 },
      { name: "Pañales / Niñera", value: 140000 }
    ];

    const varInserts = [
      ...varIncomes.map(item => ({ user_id: userId, type: 'ingreso_variable', name: item.name, value: item.value })),
      ...varExpenses.map(item => ({ user_id: userId, type: 'egreso_variable', name: item.name, value: item.value }))
    ];
    const { error: varErr } = await supabase.from('ingresos_egresos_fijos').insert(varInserts);
    if (varErr) throw varErr;

    // 6. Seed Historical Flows
    const flowsInserts = HISTORICAL_FLOWS.map((f, index) => {
      // Re-map exact creation date order using order parameter offset to maintain chronological order
      const date = new Date();
      date.setMonth(date.getMonth() - (HISTORICAL_FLOWS.length - 1 - index));
      return {
        user_id: userId,
        month: f.month,
        q: f.q,
        ingresos: f.ingresos,
        egresos: f.egresos,
        balance: f.balance,
        created_at: date.toISOString()
      };
    });
    const { error: flowsErr } = await supabase.from('flujos_historicos').insert(flowsInserts);
    if (flowsErr) throw flowsErr;

    // 7. Seed detailed Transactions for all historical months
    const detailsInserts = [];
    
    HISTORICAL_FLOWS.forEach(f => {
      const monthName = f.month;
      
      if (monthName === "Abr 2026" && MONTH_DETAILS["Abr 2026"]) {
        const abrDetails = MONTH_DETAILS["Abr 2026"];
        abrDetails.ingresos.forEach(item => {
          detailsInserts.push({
            user_id: userId,
            month: "Abr 2026",
            type: "ingreso",
            name: item.name,
            value: item.value,
            paid: item.paid,
            is_variable: !INGRESOS_FIJOS.some(x => item.name.toLowerCase().includes(x.name.split(' (')[0].toLowerCase())),
            due_date: "2026-04-10"
          });
        });
        abrDetails.egresos.forEach(item => {
          detailsInserts.push({
            user_id: userId,
            month: "Abr 2026",
            type: "egreso",
            name: item.name,
            value: item.value,
            paid: item.paid,
            is_variable: !EGRESOS_FIJOS.some(x => item.name.toLowerCase().includes(x.name.split(' (')[0].toLowerCase())),
            due_date: "2026-04-05"
          });
        });
      } else {
        // For other months, seed them with the general fixed incomes and expenses
        INGRESOS_FIJOS.forEach(item => {
          detailsInserts.push({
            user_id: userId,
            month: monthName,
            type: "ingreso",
            name: item.name,
            value: item.value,
            paid: true, // Mark as paid/received for historical months
            is_variable: false,
            due_date: null
          });
        });
        EGRESOS_FIJOS.forEach(item => {
          // Skip the "cuotas_deudas" item because debts are dynamically injected from the deudas table
          if (item.id === "cuotas_deudas") return;
          
          detailsInserts.push({
            user_id: userId,
            month: monthName,
            type: "egreso",
            name: item.name,
            value: item.value,
            paid: true, // Mark as paid for historical months
            is_variable: false,
            due_date: null
          });
        });
      }
    });

    if (detailsInserts.length > 0) {
      const { error: detailsErr } = await supabase.from('detalles_mensuales').insert(detailsInserts);
      if (detailsErr) throw detailsErr;
    }

    console.log("Inicialización de datos por defecto completada con éxito!");
  } catch (err) {
    console.error("Error al inicializar datos por defecto del usuario:", err);
    throw err;
  }
};
