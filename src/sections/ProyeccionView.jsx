import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, HelpCircle, ShieldAlert, CheckCircle, Info, Zap } from 'lucide-react';
import { formatCLP, HISTORICAL_FLOWS } from '../data/financialData';

export default function ProyeccionView({ debtsState, assetsTotal, baseIngresos = 0, baseEgresos = 0, currentUser }) {
  const isPersonalPlan = currentUser?.subscription_status === 'plan_personal';
  const [extraIncome, setExtraIncome] = useState(0);

  // Formatting helper
  const formatMoney = (val) => formatCLP ? formatCLP(val) : '$' + Math.round(val).toLocaleString('es-CL');

  // Calculate dynamic liabilities total
  const liabilitiesTotal = debtsState.reduce((sum, d) => {
    if (d.completed) return sum;
    const paidCount = (d.cuotas || []).filter(Boolean).length;
    if (d.cuotasTotales === 0) return sum + d.total;
    if (d.cuotasTotales === 1) return sum + (paidCount === 1 ? 0 : d.total);
    return sum + Math.round(d.total * (1 - paidCount / d.cuotasTotales));
  }, 0);

  const patrimonioNeto = assetsTotal - liabilitiesTotal;
  
  // Calculate dynamic adjusted monthly balance based on slider
  const adjustedIngresos = baseIngresos + extraIncome;
  const monthlyBalance = adjustedIngresos - baseEgresos;

  // 1. Calculate cumulative historical flow
  let cumulative = 0;
  const historicalCumulativeData = HISTORICAL_FLOWS.map(item => {
    cumulative += item.balance;
    return {
      name: item.month,
      historico: cumulative,
      proyeccion: null
    };
  });

  const lastHistoricalCumulative = historicalCumulativeData[historicalCumulativeData.length - 1].historico;

  // 2. Generate future projections for the next 12 months (Jul 2026 to Jun 2027)
  const futureMonths = [
    "Jul 2026", "Ago 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dic 2026",
    "Ene 2027", "Feb 2027", "Mar 2027", "Abr 2027", "May 2027", "Jun 2027"
  ];

  let futureCumulative = lastHistoricalCumulative;
  const projectionData = futureMonths.map((month, index) => {
    futureCumulative += monthlyBalance;
    return {
      name: month,
      historico: null,
      proyeccion: futureCumulative
    };
  });

  // Combine historical and projection data for the chart
  const chartData = [
    ...historicalCumulativeData,
    {
      name: "Jun 2026",
      historico: lastHistoricalCumulative,
      proyeccion: lastHistoricalCumulative
    },
    ...projectionData
  ];

  // 3. Calculate Simulation Metrics
  let monthsToEquilibrium = "N/A";
  if (lastHistoricalCumulative >= 0) {
    monthsToEquilibrium = "0 meses";
  } else if (monthlyBalance > 0) {
    const monthsFloat = Math.abs(lastHistoricalCumulative) / monthlyBalance;
    monthsToEquilibrium = `${monthsFloat.toFixed(1)} meses`;
  }

  const annualSurplus = monthlyBalance * 12;

  // 4. Alerts and recommendations engine (dynamic)
  const getAlerts = () => {
    const alerts = [];

    // Alerta Patrimonio Neto (Solo para Plan Completo/Empresa)
    if (!isPersonalPlan) {
      if (patrimonioNeto < 0) {
        alerts.push({
          id: "alert_patrimonio",
          type: "danger",
          title: "Patrimonio Neto Negativo",
          desc: `Las deudas superan a los activos en ${formatMoney(Math.abs(patrimonioNeto))}. Es urgente aumentar los ingresos mensuales o reestructurar pasivos.`
        });
      } else {
        alerts.push({
          id: "alert_patrimonio",
          type: "success",
          title: "Patrimonio Neto Favorable",
          desc: `Tienes un patrimonio neto positivo de ${formatMoney(patrimonioNeto)}. Sigue reduciendo pasivos para consolidar el capital.`
        });
      }
    }

    // Alerta meses con ingreso $0 (histórico)
    alerts.push({
      id: "alert_cero_ingresos",
      type: "warning",
      title: isPersonalPlan ? "Fondo de Emergencia Recomendado" : "Riesgo de Fluctuación (Ingresos $0)",
      desc: isPersonalPlan ? 
        "Se recomienda construir y mantener un fondo de emergencia equivalente a 3 meses de tus egresos fijos para amortiguar cualquier imprevisto financiero personal." : 
        "Marzo 2026 y Junio 2026 registraron $0 ingresos. Se recomienda crear un fondo de reserva operacional equivalente a 3 meses de egresos fijos ($11.7M)."
    });

    // Alerta deudas prepago disponibles (dynamic)
    const consumoBE = debtsState.find(d => d.id === "credito_be");
    if (consumoBE && !consumoBE.completed && consumoBE.prepago > 0) {
      alerts.push({
        id: "alert_prepago_be",
        type: "info",
        title: "Oportunidad de Prepago BE",
        desc: `Puedes prepagar el Crédito Consumo BE por ${formatMoney(consumoBE.prepago)} (deuda original ${formatMoney(consumoBE.total)}), liberando de inmediato $119.000 mensuales.`
      });
    }

    // Alerta de liberación de cuota de iPhone 16
    const iphoneDeuda = debtsState.find(d => d.id === "iphone16");
    if (iphoneDeuda && !iphoneDeuda.completed) {
      alerts.push({
        id: "alert_iphone",
        type: "success",
        title: "Liberación de Cuota iPhone 16",
        desc: `En octubre de 2026 finaliza el pago del iPhone 16, lo que liberará automáticamente $74.741 mensuales de tus egresos fijos.`
      });
    }

    // Alerta sobre la proyección actual
    if (monthlyBalance < 0) {
      alerts.push({
        id: "alert_deficitaria",
        type: "danger",
        title: "Proyección Mensual Deficitaria",
        desc: `Con los ingresos actuales, gastas ${formatMoney(Math.abs(monthlyBalance))} más de lo que ingresas cada mes. Desplaza el slider de ingreso extra para simular el equilibrio.`
      });
    } else if (monthlyBalance === 0) {
      alerts.push({
        id: "alert_punto_equilibrio",
        type: "warning",
        title: "Punto de Equilibrio Exacto",
        desc: "El balance neto mensual es $0. No hay margen para imprevistos o ahorro."
      });
    } else {
      alerts.push({
        id: "alert_superavit",
        type: "success",
        title: "Proyección con Superávit",
        desc: `El nuevo flujo neto mensual de ${formatMoney(monthlyBalance)} permitirá saldar el saldo acumulado negativo y generar excedentes.`
      });
    }

    return alerts;
  };

  const activeAlerts = getAlerts();

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p0 = payload[0];
      const p1 = payload[1];
      const value = p0?.value !== undefined ? p0.value : p1?.value;
      const payloadData = p0?.payload || p1?.payload || {};
      const isProj = payloadData.proyeccion !== null && payloadData.historico === null;
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'none'
        }}>
          <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>
            {payloadData.name || ''}
          </p>
          <p style={{ fontSize: '12px', color: isProj ? 'var(--accent)' : 'var(--success)' }}>
            {isProj ? 'Caja Proyectada: ' : 'Caja Histórica: '} 
            <strong>{formatMoney(value || 0)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 2-Column layout: Simulator & Alerts */}
      <div className="projection-layout">
        
        {/* Left Column: Interactive Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div className="card simulator-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <TrendingUp size={22} color="var(--accent)" />
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                {isPersonalPlan ? "Simulador de Presupuesto y Capacidad de Ahorro" : "Simulador de Flujo y Equilibrio"}
              </h3>
            </div>
            
            <p className="subtitle">
              {isPersonalPlan ? 
                "Modifica tus ingresos mensuales estimados para visualizar cómo impacta en tu capacidad de ahorro futuro y acumulación de capital personal." : 
                "Modifica los ingresos mensuales estimados para visualizar cómo impacta en el tiempo necesario para recuperar el déficit acumulado de la empresa (-$5.4M en Jun 2026)."
              }
            </p>

            <div className="slider-group">
              <div className="slider-header">
                <span>Ingreso Extra Mensual Proyectado</span>
                <strong style={{ color: 'var(--accent)', fontSize: '18px' }}>
                  {extraIncome > 0 ? `+ ${formatMoney(extraIncome)}` : '$0'}
                </strong>
              </div>
              <input
                type="range"
                min="0"
                max="5000000"
                step="50000"
                value={extraIncome}
                onChange={(e) => setExtraIncome(Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                <span>$0</span>
                <span>$2.5M</span>
                <span>$5.0M</span>
              </div>
            </div>

            {/* Simulation Results metrics */}
            <div className="metrics-row">
              <div className="metric-box">
                <label>Balance Proyectado</label>
                <span className={monthlyBalance >= 0 ? "num-positive" : "num-negative"}>
                  {formatMoney(monthlyBalance)}/mes
                </span>
              </div>
              
              <div className="metric-box">
                <label>Meses para Equilibrio</label>
                <span style={{ color: monthsToEquilibrium.includes('N/A') ? 'var(--danger)' : 'var(--success)' }}>
                  {monthsToEquilibrium}
                </span>
              </div>
              
              <div className="metric-box">
                <label>Excedente Anual</label>
                <span className={annualSurplus >= 0 ? "num-positive" : "num-negative"}>
                  {formatMoney(annualSurplus)}/año
                </span>
              </div>
            </div>
          </div>

          {/* Area Chart: Historical vs Projected */}
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Caja Acumulada: Histórico vs Proyección</h3>
            <p className="subtitle" style={{ marginBottom: '16px' }}>
              La línea continua muestra el saldo acumulado histórico; la línea punteada proyecta el comportamiento futuro.
            </p>
            
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorHistorico" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorProyeccion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-secondary)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Historical Area */}
                  <Area
                    type="monotone"
                    dataKey="historico"
                    stroke="var(--success)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHistorico)"
                  />
                  
                  {/* Projected Area */}
                  <Area
                    type="monotone"
                    dataKey="proyeccion"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorProyeccion)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Alerts Engine Block */}
        <div className="card alert-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sparkles size={20} color="var(--warning)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Alertas & Recomendaciones</h3>
          </div>
          <p className="subtitle">
            Análisis financiero automatizado basado en el estado actual de deudas, activos y simulación de ingresos.
          </p>

          <div className="alert-list">
            {activeAlerts.map((alert) => {
              let Icon = Info;
              if (alert.type === "danger") Icon = ShieldAlert;
              if (alert.type === "warning") Icon = Zap;
              if (alert.type === "success") Icon = CheckCircle;

              return (
                <div key={alert.id} className={`alert-item ${alert.type}`}>
                  <div className="alert-icon">
                    <Icon size={18} />
                  </div>
                  <div className="alert-text">
                    <h4>{alert.title}</h4>
                    <p>{alert.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
