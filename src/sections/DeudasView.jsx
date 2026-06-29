import React, { useState } from 'react';
import { CreditCard, Calendar, RefreshCw, CheckSquare, ShieldAlert, Sparkles, Edit2, Trash2, Plus, X } from 'lucide-react';
import { formatCLP } from '../data/financialData';

export default function DeudasView({ 
  debtsState, 
  toggleCuota,
  addDebt,
  editDebt,
  deleteDebt,
  currentContext = 'consolidado'
}) {
  const cuotasDebts = debtsState.filter(d => d.cuotasTotales > 1);

  const [activeTrackerId, setActiveTrackerId] = useState(() => {
    return cuotasDebts.length > 0 ? cuotasDebts[0].id : "";
  });

  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "completed"
  const [sortBy, setSortBy] = useState("status"); // "status" | "name" | "remaining_desc" | "total_desc"

  // Helper to calculate remaining value
  const getRemainingValue = (debt) => {
    if (debt.completed) return 0;
    const paidCount = (debt.cuotas || []).filter(Boolean).length;
    if (debt.cuotasTotales === 0) return debt.total;
    if (debt.cuotasTotales === 1) return paidCount === 1 ? 0 : debt.total;
    return Math.round(debt.total * (1 - paidCount / debt.cuotasTotales));
  };

  const getDueStatus = (dueDateStr, completed) => {
    if (completed || !dueDateStr) return null;
    
    // Parse as YYYY-MM-DD in local time
    const [year, month, day] = dueDateStr.split('-').map(Number);
    // Note: JS Date month is 0-indexed. Assume due by end of day.
    const dueDateObj = new Date(year, month - 1, day, 23, 59, 59);
    const now = new Date();
    
    const diffTime = dueDateObj.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    
    if (diffHours < 0) {
      return { status: 'overdue', label: 'Vencido', color: 'var(--danger)' };
    } else if (diffHours <= 48) {
      return { status: 'due_soon', label: 'Vence pronto (< 48h)', color: 'var(--warning)' };
    }
    return null;
  };

  // Filtering and sorting logic
  const filteredDebts = debtsState.filter(d => {
    if (statusFilter === "active") return !d.completed;
    if (statusFilter === "completed") return d.completed;
    return true;
  });

  const sortedDebts = [...filteredDebts].sort((a, b) => {
    if (sortBy === "status") {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return b.total - a.total;
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "remaining_desc") {
      return getRemainingValue(b) - getRemainingValue(a);
    }
    if (sortBy === "total_desc") {
      return b.total - a.total;
    }
    return 0;
  });

  // Debt Form Modal States
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [debtModalMode, setDebtModalMode] = useState("add"); // "add" or "edit"
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [debtFormName, setDebtFormName] = useState("");
  const [debtFormTipo, setDebtFormTipo] = useState("fija"); // "fija" or "pago_unico"
  const [debtFormTotalOriginal, setDebtFormTotalOriginal] = useState("");
  const [debtFormInteres, setDebtFormInteres] = useState("0");
  const [debtFormCuotaActual, setDebtFormCuotaActual] = useState("");
  const [debtFormCuotasTotales, setDebtFormCuotasTotales] = useState("");
  const [debtFormMontoMensual, setDebtFormMontoMensual] = useState("");
  const [debtFormPrepago, setDebtFormPrepago] = useState("");
  const [debtFormFechaVencimiento, setDebtFormFechaVencimiento] = useState("");
  const [debtFormFechaInicio, setDebtFormFechaInicio] = useState("");
  const [debtFormDetails, setDebtFormDetails] = useState("");
  const [debtFormContext, setDebtFormContext] = useState("empresa");

  // Scheduling month modal states
  const [schedulingDebt, setSchedulingDebt] = useState(null);
  const [scheduleMonth, setScheduleMonth] = useState("Ene");
  const [scheduleYear, setScheduleYear] = useState(new Date().getFullYear());

  // Auto-calculate Cuota Mensual when relevant values change
  React.useEffect(() => {
    if (debtFormTipo === "fija") {
      const original = Number(debtFormTotalOriginal || 0);
      const interest = Number(debtFormInteres || 0);
      const cuotas = Number(debtFormCuotasTotales || 0);
      if (original > 0 && cuotas > 0) {
        const totalVal = original * (1 + interest / 100);
        const calculatedCuota = Math.round(totalVal / cuotas);
        setDebtFormMontoMensual(String(calculatedCuota));
      }
    }
  }, [debtFormTotalOriginal, debtFormInteres, debtFormCuotasTotales, debtFormTipo]);

  // Formatting helper
  const formatMoney = (val) => formatCLP ? formatCLP(val) : '$' + Math.round(val).toLocaleString('es-CL');

  // Verify active tracker exists
  const activeTrackerDebt = debtsState.find(d => d.id === activeTrackerId) || cuotasDebts[0];

  const upcomingOverdueDebts = debtsState.filter(d => {
    const dueStatus = getDueStatus(d.fechaVencimiento, d.completed);
    return dueStatus !== null;
  });



  // Calculate table footers (only for active/vigente debts, as requested)
  const totalCuotaMensual = debtsState.reduce((sum, d) => {
    if (d.completed) return sum;
    return sum + (d.montoMensual || 0);
  }, 0);

  const totalSaldoRestante = debtsState.reduce((sum, d) => {
    if (d.completed) return sum;
    return sum + getRemainingValue(d);
  }, 0);

  const totalMontoOriginal = debtsState.reduce((sum, d) => {
    if (d.completed) return sum;
    return sum + d.total;
  }, 0);

  // CRUD triggers
  const openAddDebt = () => {
    setDebtModalMode("add");
    setEditingDebtId(null);
    setDebtFormName("");
    setDebtFormTipo("fija");
    setDebtFormTotalOriginal("");
    setDebtFormInteres("0");
    setDebtFormCuotaActual("0");
    setDebtFormCuotasTotales("12");
    setDebtFormMontoMensual("0");
    setDebtFormPrepago("0");
    setDebtFormFechaVencimiento("");
    setDebtFormFechaInicio("");
    setDebtFormDetails("");
    setDebtFormContext(currentContext === 'personal' ? 'personal' : 'empresa');
    setDebtModalOpen(true);
  };

  const openEditDebt = (debt) => {
    setDebtModalMode("edit");
    setEditingDebtId(debt.id);
    setDebtFormName(debt.name);
    setDebtFormTipo(debt.tipo || (debt.cuotasTotales === 1 ? "pago_unico" : "fija"));
    setDebtFormTotalOriginal(debt.totalOriginal !== undefined ? debt.totalOriginal : debt.total);
    setDebtFormInteres(debt.interes !== undefined ? debt.interes : 0);
    setDebtFormCuotaActual(debt.cuotaActual);
    setDebtFormCuotasTotales(debt.cuotasTotales);
    setDebtFormMontoMensual(debt.montoMensual);
    setDebtFormPrepago(debt.prepago);
    setDebtFormFechaVencimiento(debt.fechaVencimiento || "");
    setDebtFormFechaInicio(debt.fechaInicio || "");
    setDebtFormDetails((debt.details || "")
      .replace(/\n?\[StartMonth:\s*[^\]]+\]/g, "")
      .replace(/\n?\[StartDate:\s*[^\]]+\]/g, "")
    );
    setDebtModalOpen(true);
  };

  const handleDebtSubmit = (e) => {
    e.preventDefault();
    if (!debtFormName.trim() || !debtFormTotalOriginal) return;

    const originalVal = Math.round(Number(debtFormTotalOriginal));
    const interestVal = Number(debtFormInteres || 0);

    const isSingle = debtFormTipo === "pago_unico";
    const cuotasTotalesVal = isSingle ? 1 : Math.max(2, Number(debtFormCuotasTotales));
    const cuotaActualVal = isSingle ? Math.min(1, Math.max(0, Number(debtFormCuotaActual))) : Math.min(cuotasTotalesVal, Math.max(0, Number(debtFormCuotaActual)));

    const debtData = {
      name: debtFormName,
      totalOriginal: originalVal,
      interes: interestVal,
      tipo: debtFormTipo,
      cuotaActual: cuotaActualVal,
      cuotasTotales: cuotasTotalesVal,
      montoMensual: isSingle ? 0 : Math.round(Number(debtFormMontoMensual || 0)),
      prepago: Math.round(Number(debtFormPrepago || 0)),
      fechaVencimiento: debtFormFechaVencimiento,
      fechaInicio: debtFormFechaInicio,
      details: debtFormDetails,
      context: debtFormContext
    };

    if (debtModalMode === "add") {
      addDebt(debtData);
    } else {
      editDebt(editingDebtId, debtData);
    }
    setDebtModalOpen(false);
  };

  const handleDebtDelete = (id, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la deuda "${name}"?`)) {
      deleteDebt(id);
    }
  };

  const handleOpenScheduleMonthModal = (debt) => {
    setSchedulingDebt(debt);
    if (debt.fechaVencimiento) {
      const date = new Date(debt.fechaVencimiento + "T00:00:00");
      if (!isNaN(date.getTime())) {
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        setScheduleMonth(months[date.getMonth()]);
        setScheduleYear(date.getFullYear());
        return;
      }
    }
    // Default to current month/year
    const now = new Date();
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    setScheduleMonth(months[now.getMonth()]);
    setScheduleYear(now.getFullYear());
  };

  const handleSaveSchedule = () => {
    if (!schedulingDebt) return;
    const monthMap = {
      "Ene": "01", "Feb": "02", "Mar": "03", "Abr": "04", "May": "05", "Jun": "06",
      "Jul": "07", "Ago": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dic": "12"
    };
    const dateStr = `${scheduleYear}-${monthMap[scheduleMonth]}-01`;
    
    editDebt(schedulingDebt.id, {
      ...schedulingDebt,
      fechaVencimiento: dateStr
    });
    
    setSchedulingDebt(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Expiration warning banner */}
      {upcomingOverdueDebts.length > 0 && (
        <div style={{
          background: 'rgba(255, 69, 58, 0.08)',
          border: '1px solid rgba(255, 69, 58, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            background: 'var(--danger)',
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0
          }}>
            <ShieldAlert size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', marginTop: 0 }}>
              Recordatorio de Vencimientos de Pago
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Tienes {upcomingOverdueDebts.length} {upcomingOverdueDebts.length === 1 ? 'deuda' : 'deudas'} con vencimiento inminente (menos de 48 horas) o atrasado:
              <strong style={{ marginLeft: '6px', color: 'var(--text-primary)' }}>
                {upcomingOverdueDebts.map(d => `${d.name} (${formatMoney(d.tipo === 'pago_unico' ? d.total : d.montoMensual)})`).join(', ')}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Overview View of All Debts */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Resumen General de Deudas</h3>
            <p className="subtitle">Listado consolidado de obligaciones financieras y cuotas vigentes</p>
          </div>
          <button 
            onClick={openAddDebt}
            style={{
              background: 'var(--accent-light)',
              border: 'none',
              color: 'var(--accent)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} /> Registrar Deuda
          </button>
        </div>

        {/* Filter and Sort Toolbar */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '16px', 
          marginBottom: '20px', 
          background: 'var(--bg-primary)', 
          padding: '12px 16px', 
          borderRadius: '10px', 
          border: '1px solid var(--border-color)', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Filtrar Estado:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todos los pasivos</option>
              <option value="active">Solo Activos (Pendientes)</option>
              <option value="completed">Solo Saldados (Pagados)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="status">Vigentes primero</option>
              <option value="name">Nombre (A-Z)</option>
              <option value="remaining_desc">Saldo restante (Mayor a menor)</option>
              <option value="total_desc">Monto total (Mayor a menor)</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Deuda / Acreedor</th>
                <th>Tipo</th>
                <th>Progreso Cuotas</th>
                <th style={{ textAlign: 'right' }}>Interés</th>
                <th style={{ textAlign: 'right' }}>Cuota Mensual</th>
                <th style={{ textAlign: 'right' }}>Saldo Restante</th>
                <th style={{ textAlign: 'right' }}>Monto Total</th>
                <th>Estado</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedDebts.map(debt => {
                const paidCount = (debt.cuotas || []).filter(Boolean).length;
                const isSingle = debt.tipo === "pago_unico";
                const progressPercent = debt.cuotasTotales > 0 
                  ? (paidCount / debt.cuotasTotales) * 100 
                  : (debt.completed ? 100 : 0);
                const remaining = getRemainingValue(debt);

                return (
                  <tr key={debt.id} className={activeTrackerDebt?.id === debt.id ? "highlight-row" : ""}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{debt.name}</span>
                        {debt.fechaVencimiento && (
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            {isSingle ? 'Vence: ' : 'Próxima cuota vence: '}
                            {debt.fechaVencimiento}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        background: isSingle ? 'rgba(255, 159, 10, 0.1)' : 'rgba(10, 132, 255, 0.1)',
                        color: isSingle ? 'var(--warning)' : 'var(--accent)',
                        fontWeight: 600
                      }}>
                        {isSingle ? 'Pago Único' : 'Cuotas'}
                      </span>
                    </td>
                    <td style={{ width: '180px' }}>
                      {!isSingle && debt.cuotasTotales > 1 ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                            <span>{paidCount}/{debt.cuotasTotales} cuotas</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                          <div className="progress-bar-container" style={{ margin: 0, height: '4px' }}>
                            <div className="progress-bar" style={{ width: `${progressPercent}%`, backgroundColor: debt.completed ? 'var(--success)' : 'var(--accent)' }}></div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span>{debt.completed ? 'Pagado (1/1)' : 'Pendiente (0/1)'}</span>
                          {!debt.completed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {debt.fechaVencimiento 
                                  ? `Mes: ${(() => {
                                      const date = new Date(debt.fechaVencimiento + "T00:00:00");
                                      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                                      return isNaN(date.getTime()) ? debt.fechaVencimiento : `${months[date.getMonth()]} ${date.getFullYear()}`;
                                    })()}`
                                  : 'Sin programar'
                                }
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenScheduleMonthModal(debt);
                                }} 
                                style={{
                                  background: 'rgba(var(--accent-rgb, 10, 132, 255), 0.1)',
                                  border: 'none',
                                  color: 'var(--accent)',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {debt.fechaVencimiento ? 'Cambiar' : 'Programar pago'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {debt.interes || 0}%
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {debt.montoMensual > 0 ? formatMoney(debt.montoMensual) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className={remaining > 0 ? "num-negative" : "num-neutral"}>
                      {formatMoney(remaining)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatMoney(debt.total)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span className={`badge ${debt.completed ? 'success' : 'warning'}`}>
                          {debt.completed ? 'Saldado' : 'Activo'}
                        </span>
                        {(() => {
                          const dueStatus = getDueStatus(debt.fechaVencimiento, debt.completed);
                          if (dueStatus) {
                            return (
                              <span style={{ 
                                fontSize: '9px', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                background: dueStatus.status === 'overdue' ? 'rgba(255, 69, 58, 0.15)' : 'rgba(255, 159, 10, 0.15)',
                                color: dueStatus.color,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <ShieldAlert size={10} /> {dueStatus.label}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => openEditDebt(debt)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Editar">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDebtDelete(debt.id, debt.name)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} title="Eliminar">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals Footer Row (as requested in Page 1) */}
            <tfoot>
              <tr style={{ background: 'var(--border-color)', fontWeight: 600, borderTop: '2px solid var(--text-secondary)' }}>
                <td colSpan="4" style={{ padding: '14px 16px' }}>Total Vigente (Activas)</td>
                <td style={{ textAlign: 'right', fontSize: '14px' }} className="num-negative">{formatMoney(totalCuotaMensual)}</td>
                <td style={{ textAlign: 'right', fontSize: '14px' }} className="num-negative">{formatMoney(totalSaldoRestante)}</td>
                <td style={{ textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>{formatMoney(totalMontoOriginal)}</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Sub-vistas visual trackers */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Visualizador de Cuotas Interactivo</h3>
            <p className="subtitle">Haz clic en cada celda para alternar el estado de pago de la cuota (Verde = Pagado, Rojo = Pendiente)</p>
          </div>

          {cuotasDebts.length > 0 && (
            <div style={{ display: 'flex', background: 'var(--border-color)', padding: '4px', borderRadius: '10px', gap: '2px', flexWrap: 'wrap' }}>
              {cuotasDebts.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTrackerId(tab.id)}
                  style={{
                    border: 'none',
                    background: (activeTrackerDebt?.id === tab.id) ? 'var(--bg-secondary)' : 'transparent',
                    color: (activeTrackerDebt?.id === tab.id) ? 'var(--text-primary)' : 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: (activeTrackerDebt?.id === tab.id) ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.name.length > 18 ? `${tab.name.substring(0, 15)}...` : tab.name} ({tab.cuotasTotales})
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTrackerDebt ? (
          <div className="cuota-grid-container" style={{ margin: 0 }}>
            <div className="cuota-grid-header">
              <div>
                <strong style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--accent)" />
                  {activeTrackerDebt.name}
                </strong>
                <span className="subtitle" style={{ display: 'block', marginTop: '2px' }}>
                  {(activeTrackerDebt.details || "").replace(/\n?\[StartMonth:\s*[^\]]+\]/g, "")}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Pagadas: </span>
                  <strong style={{ color: 'var(--success)' }}>
                    {(activeTrackerDebt.cuotas || []).filter(Boolean).length} / {activeTrackerDebt.cuotasTotales}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Saldo Proyectado: </span>
                  <strong style={{ color: 'var(--danger)' }}>
                    {formatMoney(getRemainingValue(activeTrackerDebt))}
                  </strong>
                </div>
              </div>
            </div>
 
            {/* Grid display */}
            <div className="cuota-grid">
              {(activeTrackerDebt.cuotas || []).map((isPaid, index) => (
                <div
                  key={index}
                  onClick={() => toggleCuota(activeTrackerDebt.id, index)}
                  className={`cuota-cell ${isPaid ? 'paid' : 'pending'}`}
                  title={`Cuota ${index + 1}: ${activeTrackerDebt.montoMensual > 0 ? formatMoney(activeTrackerDebt.montoMensual) : 'Pago único'} - ${isPaid ? 'Pagada' : 'Pendiente'}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)' }}></span>
                <span>Verde = Pagado / Al día</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: 'var(--danger)' }}></span>
                <span>Rojo = Pendiente / Futuro</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderRadius: '12px' }}>
            No hay deudas con cuotas registradas para visualizar el tracker.
          </div>
        )}
      </div>

      {/* Debt Form Modal */}
      {debtModalOpen && (
        <div className="modal-overlay" onClick={() => setDebtModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="close-btn" onClick={() => setDebtModalOpen(false)}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {debtModalMode === "add" ? "Registrar Nueva Deuda" : "Editar Registro de Deuda"}
            </h3>

            <form onSubmit={handleDebtSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nombre de la Deuda / Acreedor</label>
                <input
                  type="text"
                  placeholder="Ej: Crédito Banco de Chile"
                  value={debtFormName}
                  onChange={e => setDebtFormName(e.target.value)}
                  required
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {currentContext === 'consolidado' && debtModalMode === 'add' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Destino de la Deuda</label>
                  <select
                    value={debtFormContext}
                    onChange={e => setDebtFormContext(e.target.value)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="empresa">🏢 Empresa / Negocio</option>
                    <option value="personal">🏠 Personal</option>
                  </select>
                </div>
              )}

              {/* Debt Type Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tipo de Deuda</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="debt_type_deudasview"
                      value="fija"
                      checked={debtFormTipo === "fija"}
                      onChange={() => setDebtFormTipo("fija")}
                    />
                    Amortizable en Cuotas
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="debt_type_deudasview"
                      value="pago_unico"
                      checked={debtFormTipo === "pago_unico"}
                      onChange={() => {
                        setDebtFormTipo("pago_unico");
                        setDebtFormMontoMensual("0");
                        setDebtFormCuotasTotales("1");
                      }}
                    />
                    Pago Único (One-off)
                  </label>
                </div>
              </div>

              {/* Original & Interest Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Monto Original de la Deuda ($)</label>
                  <input
                    type="number"
                    value={debtFormTotalOriginal}
                    onChange={e => setDebtFormTotalOriginal(e.target.value)}
                    required
                    min="1"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Intereses (%)</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="number"
                      value={debtFormInteres}
                      onChange={e => setDebtFormInteres(e.target.value)}
                      min="0"
                      max="200"
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '10px 24px 10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--text-secondary)' }}>%</span>
                  </div>
                </div>
              </div>

              {debtFormTotalOriginal && (() => {
                const projectedTotal = Math.round(Number(debtFormTotalOriginal || 0) * (1 + Number(debtFormInteres || 0) / 100));
                return (
                  <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-secondary)', 
                    background: 'var(--bg-primary)', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    border: '1px dashed var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Monto Total con Intereses:</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                      {formatMoney(projectedTotal)}
                    </strong>
                  </div>
                );
              })()}

              {/* Installment parameters (Only visible for Fija) */}
              {debtFormTipo === "fija" && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Cuota Mensual ($)</label>
                    <input
                      type="number"
                      value={debtFormMontoMensual}
                      onChange={e => setDebtFormMontoMensual(e.target.value)}
                      min="0"
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Cuotas</label>
                      <input
                        type="number"
                        value={debtFormCuotasTotales}
                        onChange={e => setDebtFormCuotasTotales(e.target.value)}
                        required
                        min="2"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Cuotas Pagadas</label>
                      <input
                        type="number"
                        value={debtFormCuotaActual}
                        onChange={e => setDebtFormCuotaActual(e.target.value)}
                        required
                        min="0"
                        max={debtFormCuotasTotales}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fecha de Inicio</label>
                      <input
                        type="date"
                        value={debtFormFechaInicio}
                        onChange={e => setDebtFormFechaInicio(e.target.value)}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fecha de Vencimiento de Próxima Cuota</label>
                      <input
                        type="date"
                        value={debtFormFechaVencimiento}
                        onChange={e => setDebtFormFechaVencimiento(e.target.value)}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Payment Date input (Only visible for Pago Único) */}
              {debtFormTipo === "pago_unico" && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fecha de Inicio</label>
                      <input
                        type="date"
                        value={debtFormFechaInicio}
                        onChange={e => setDebtFormFechaInicio(e.target.value)}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fecha Pactada de Pago</label>
                      <input
                        type="date"
                        value={debtFormFechaVencimiento}
                        onChange={e => setDebtFormFechaVencimiento(e.target.value)}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>¿Ya fue saldado?</label>
                    <select
                      value={debtFormCuotaActual}
                      onChange={e => setDebtFormCuotaActual(e.target.value)}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="0">Pendiente (No pagado)</option>
                      <option value="1">Saldado (Pagado)</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Monto de Prepago Disponible (0 si no aplica)</label>
                  <input
                    type="number"
                    value={debtFormPrepago}
                    onChange={e => setDebtFormPrepago(e.target.value)}
                    min="0"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Detalles / Notas de la deuda</label>
                <textarea
                  placeholder="Detalles sobre las cuotas, plazos o intereses..."
                  value={debtFormDetails}
                  onChange={e => setDebtFormDetails(e.target.value)}
                  rows="2"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setDebtModalOpen(false)}
                  style={{ flex: 1, background: 'var(--border-color)', border: 'none', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: 'var(--accent)', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scheduling Month Modal */}
      {schedulingDebt && (
        <div className="modal-overlay" onClick={() => setSchedulingDebt(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '320px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              Programar Mes de Pago
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Selecciona el mes en el que se realizará el pago único para <strong>{schedulingDebt.name}</strong>:
            </p>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <select
                value={scheduleMonth}
                onChange={e => setScheduleMonth(e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              
              <select
                value={scheduleYear}
                onChange={e => setScheduleYear(Number(e.target.value))}
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSchedulingDebt(null)}
                style={{ flex: 1, background: 'var(--border-color)', border: 'none', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                style={{ flex: 1, background: 'var(--accent)', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
