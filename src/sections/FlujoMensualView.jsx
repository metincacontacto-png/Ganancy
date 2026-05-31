import React, { useState } from 'react';
import { Calendar, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, DollarSign, X, Plus, Trash2, Edit2, Bell, Check, Send, Paperclip, FileText } from 'lucide-react';
import { formatCLP } from '../data/financialData';

export default function FlujoMensualView({ 
  historicalFlowsState, 
  monthlyDetailsState, 
  updateMonthlyTransaction,
  currentContext
}) {
  const getCleanName = (name) => {
    if (!name) return "";
    return name.replace(' [Personal]', '').replace(' [Empresa]', '');
  };

  const renderContextBadge = (name) => {
    if (!name) return null;
    if (currentContext !== 'consolidado') return null; // Only show context tags in consolidated view
    if (name.includes('[Personal]')) {
      return (
        <span style={{
          background: 'rgba(251, 113, 133, 0.1)',
          color: '#fb7185',
          fontSize: '9px',
          fontWeight: 700,
          padding: '2px 5px',
          borderRadius: '4px',
          marginLeft: '6px',
          display: 'inline-flex',
          alignItems: 'center',
          verticalAlign: 'middle'
        }}>
          Personal
        </span>
      );
    }
    if (name.includes('[Empresa]')) {
      return (
        <span style={{
          background: 'rgba(56, 189, 248, 0.1)',
          color: '#38bdf8',
          fontSize: '9px',
          fontWeight: 700,
          padding: '2px 5px',
          borderRadius: '4px',
          marginLeft: '6px',
          display: 'inline-flex',
          alignItems: 'center',
          verticalAlign: 'middle'
        }}>
          Negocio
        </span>
      );
    }
    return null;
  };

  const [selectedTrimestre, setSelectedTrimestre] = useState("Q2 2026");
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);

  // Sub-modal states for adding/editing transaction inside details sheet
  const [transModalOpen, setTransModalOpen] = useState(false);
  const [transModalType, setTransModalType] = useState("ingresos"); // "ingresos" or "egresos"
  const [transModalMode, setTransModalMode] = useState("add"); // "add" or "edit"
  const [editingIndex, setEditingIndex] = useState(null);
  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formIsVariable, setFormIsVariable] = useState(true);
  const [formPaid, setFormPaid] = useState(false);
  const [formDueDate, setFormDueDate] = useState("");
  const [formContext, setFormContext] = useState("empresa");
  
  // New reminder configuration states
  const [formReminderEnabled, setFormReminderEnabled] = useState(false);
  const [formReminderEmail, setFormReminderEmail] = useState("");
  const [formReminderTime, setFormReminderTime] = useState("3_days_before");

  // Reminder Toast Simulator State
  const [toastMessage, setToastMessage] = useState(null);
  const [activeReminderIdx, setActiveReminderIdx] = useState(null); // track which item is configuring reminders
  const [activeReminderType, setActiveReminderType] = useState(""); // "ingresos" or "egresos"

  // SII Receipt Visor States
  const [viewReceiptUrl, setViewReceiptUrl] = useState("");
  const [viewReceiptName, setViewReceiptName] = useState("");

  const handleViewReceipt = (url, name) => {
    setViewReceiptUrl(url);
    setViewReceiptName(name);
  };

  // Format Helper
  const formatMoney = (val) => formatCLP ? formatCLP(val) : '$' + Math.round(val).toLocaleString('es-CL');

  // Filter months by quarter
  const filteredMonths = historicalFlowsState.filter(item => item.q === selectedTrimestre);

  // Details sheet CRUD triggers
  const handleOpenAdd = (type) => {
    setTransModalType(type);
    setTransModalMode("add");
    setEditingIndex(null);
    setFormName("");
    setFormValue("");
    setFormIsVariable(true);
    setFormPaid(false);
    setFormDueDate("");
    setFormReminderEnabled(false);
    setFormReminderEmail("");
    setFormReminderTime("3_days_before");
    setFormContext(currentContext === 'personal' ? 'personal' : 'empresa');
    setTransModalOpen(true);
  };

  const handleOpenEdit = (type, index, item) => {
    setTransModalType(type);
    setTransModalMode("edit");
    setEditingIndex(index);
    
    const hasPersonalTag = item.name.includes('[Personal]');
    const cleanName = item.name.replace(' [Personal]', '').replace(' [Empresa]', '');
    setFormName(cleanName);
    setFormContext(hasPersonalTag ? 'personal' : 'empresa');

    setFormValue(item.value);
    setFormIsVariable(item.isVariable !== undefined ? item.isVariable : true);
    setFormPaid(item.paid);
    setFormDueDate(item.dueDate || "");
    setFormReminderEnabled(item.reminderEnabled || false);
    setFormReminderEmail(item.reminderEmail || "");
    setFormReminderTime(item.reminderTime || "3_days_before");
    setTransModalOpen(true);
  };

  const handleTransSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formValue) return;

    const value = Math.round(Number(formValue));

    if (transModalMode === "add") {
      updateMonthlyTransaction(selectedMonthDetail, transModalType, "add", {
        name: formName,
        value,
        isVariable: formIsVariable,
        paid: formPaid,
        dueDate: formDueDate,
        reminderEnabled: formReminderEnabled,
        reminderEmail: formReminderEmail,
        reminderTime: formReminderTime,
        context: formContext
      });
    } else {
      updateMonthlyTransaction(selectedMonthDetail, transModalType, "edit", {
        index: editingIndex,
        item: {
          name: formName,
          value,
          isVariable: formIsVariable,
          paid: formPaid,
          dueDate: formDueDate,
          reminderEnabled: formReminderEnabled,
          reminderEmail: formReminderEmail,
          reminderTime: formReminderTime,
          context: formContext
        }
      });
    }

    setTransModalOpen(false);
  };

  const handleTransDelete = (type, index, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${name}"?`)) {
      updateMonthlyTransaction(selectedMonthDetail, type, "delete", { index });
    }
  };

  const handleTogglePaid = (type, index) => {
    updateMonthlyTransaction(selectedMonthDetail, type, "toggle", { index });
  };

  // Reminder Scheduling Simulation
  const triggerReminderToast = (transName, method, dueDate, optionLabel) => {
    const dateStr = dueDate ? ` el ${dueDate}` : ' en su vencimiento';
    setToastMessage(`🔔 Recordatorio programado con éxito: Se enviará una notificación por **${method}** para la transacción **"${transName}"** ${optionLabel}${dateStr}.`);
    setActiveReminderIdx(null); // Close popover

    // Auto clear toast after 5 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const currentDetails = selectedMonthDetail ? (monthlyDetailsState[selectedMonthDetail] || { ingresos: [], egresos: [] }) : null;
  const currentMonthFlow = selectedMonthDetail ? historicalFlowsState.find(m => m.month === selectedMonthDetail) : null;

  // Totals calculations inside the modal
  const totalIngresosMes = currentDetails ? currentDetails.ingresos.reduce((sum, item) => sum + item.value, 0) : 0;
  const totalEgresosMes = currentDetails ? currentDetails.egresos.reduce((sum, item) => sum + item.value, 0) : 0;
  const balanceNetoMes = totalIngresosMes - totalEgresosMes;

  const ingresosRecibidos = currentDetails ? currentDetails.ingresos.filter(item => item.paid).reduce((sum, item) => sum + item.value, 0) : 0;
  const egresosPagados = currentDetails ? currentDetails.egresos.filter(item => item.paid).reduce((sum, item) => sum + item.value, 0) : 0;
  const balanceCajaActual = ingresosRecibidos - egresosPagados;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Toast Notification Simulator (Absolute Top Banner) */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 132, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 2000,
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '90%',
          animation: 'slideDown 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)'
        }}>
          <Bell size={18} style={{ animation: 'bounce 1s infinite' }} />
          <div dangerouslySetInnerHTML={{ __html: toastMessage }}></div>
          <button 
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Selector de Trimestre & Header */}
      <div className="section-header">
        <div>
          <h2>Flujo de Caja Mensual</h2>
          <p className="subtitle">Historial de transacciones consolidado por periodos trimestrales</p>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--border-color)', padding: '4px', borderRadius: '10px', gap: '2px' }}>
          {["Q4 2025", "Q1 2026", "Q2 2026"].map(q => (
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
              {q === "Q4 2025" ? "Trimestre 4 2025" : q === "Q1 2026" ? "Trimestre 1 2026" : "Trimestre 2 2026"}
            </button>
          ))}
        </div>
      </div>

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

      {/* Modal / Sheet de Detalle de Mes (DIRECT CRUD & Reminders) */}
      {selectedMonthDetail && currentDetails && currentMonthFlow && (
        <div className="modal-overlay" onClick={() => setSelectedMonthDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <button className="close-btn" onClick={() => setSelectedMonthDetail(null)}>
              <X size={16} />
            </button>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={22} color="var(--accent)" />
                <h3 style={{ fontSize: '22px', fontWeight: 600 }}>Desglose Operacional — {selectedMonthDetail}</h3>
              </div>
              <p className="subtitle" style={{ marginTop: '4px' }}>
                Registra, edita o elimina movimientos mensuales. Tilda los cheques correspondientes para marcar ingresos recibidos o egresos pagados.
              </p>
            </div>

            {/* Quick Balance Header inside Modal */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '16px', 
              marginBottom: '24px'
            }}>
              {/* Row 1: Planned Totals */}
              <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 500 }}>Ingresos Totales (Mes)</span>
                <strong style={{ fontSize: '16px', color: 'var(--success)' }}>{formatMoney(totalIngresosMes)}</strong>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 500 }}>Egresos Totales (Mes)</span>
                <strong style={{ fontSize: '16px', color: 'var(--danger)' }}>{formatMoney(totalEgresosMes)}</strong>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 500 }}>Balance Neto Proyectado</span>
                <strong style={{ fontSize: '16px' }} className={balanceNetoMes >= 0 ? "num-positive" : "num-negative"}>
                  {balanceNetoMes >= 0 ? '+' : ''}{formatMoney(balanceNetoMes)}
                </strong>
              </div>

              {/* Row 2: Actual / Paid to Date Totals */}
              <div style={{ padding: '12px 16px', background: 'rgba(52, 199, 89, 0.05)', border: '1px solid rgba(52, 199, 89, 0.12)', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--success)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Ingresos Recibidos (a la fecha)</span>
                <strong style={{ fontSize: '16px', color: 'var(--success)' }}>{formatMoney(ingresosRecibidos)}</strong>
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(255, 59, 48, 0.05)', border: '1px solid rgba(255, 59, 48, 0.12)', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--danger)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Egresos Pagados (a la fecha)</span>
                <strong style={{ fontSize: '16px', color: 'var(--danger)' }}>{formatMoney(egresosPagados)}</strong>
              </div>
              <div style={{ 
                padding: '12px 16px', 
                background: balanceCajaActual >= 0 ? 'rgba(52, 199, 89, 0.05)' : 'rgba(255, 59, 48, 0.05)', 
                border: balanceCajaActual >= 0 ? '1px solid rgba(52, 199, 89, 0.12)' : '1px solid rgba(255, 59, 48, 0.12)', 
                borderRadius: '12px', 
                textAlign: 'center' 
              }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-primary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Caja Real a la fecha</span>
                <strong style={{ fontSize: '16px' }} className={balanceCajaActual >= 0 ? "num-positive" : "num-negative"}>
                  {balanceCajaActual >= 0 ? '+' : ''}{formatMoney(balanceCajaActual)}
                </strong>
              </div>
            </div>

            {/* Grid Columns for Incomes / Expenses */}
            <div className="month-detail-grid">
              
              {/* Income Column */}
              <div>
                <div className="detail-column-title" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowUpRight size={18} color="var(--success)" />
                    <span>Ingresos Percibidos</span>
                  </div>
                  <button 
                    onClick={() => handleOpenAdd("ingresos")}
                    style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 600 }}
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                
                <div className="detail-item-list" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {currentDetails.ingresos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>Sin ingresos registrados.</div>
                  ) : (
                    currentDetails.ingresos.map((item, idx) => (
                      <div key={idx} className="detail-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            {/* Paid Badge Status */}
                            <div style={{ marginTop: '2px' }}>
                              <span 
                                onClick={() => handleTogglePaid("ingresos", idx)}
                                style={{
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  background: item.paid ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 159, 10, 0.1)',
                                  color: item.paid ? 'var(--success)' : 'var(--warning)',
                                  border: item.paid ? '1px solid rgba(52, 199, 89, 0.2)' : '1px solid rgba(255, 159, 10, 0.2)',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Haz clic para cambiar el estado de pago"
                              >
                                {item.paid ? <Check size={11} /> : null}
                                {item.paid ? "Pagado" : "Pendiente"}
                              </span>
                            </div>
                            
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: item.paid ? 'line-through' : 'none' }}>{getCleanName(item.name)}</span>
                                {renderContextBadge(item.name)}
                                <span style={{ 
                                  fontSize: '9px', 
                                  padding: '1px 4px', 
                                  borderRadius: '3px',
                                  background: item.isVariable ? 'rgba(255, 159, 10, 0.08)' : 'rgba(10, 132, 255, 0.08)',
                                  color: item.isVariable ? 'var(--warning)' : 'var(--accent)'
                                }}>
                                  {item.isVariable ? 'Var' : 'Fijo'}
                                </span>

                                {item.reminderEnabled && (
                                  <span 
                                    style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', cursor: 'pointer' }}
                                    title={`Alerta de correo configurada para: ${item.reminderEmail} (${item.reminderTime === 'same_day' ? 'el mismo día' : item.reminderTime === '1_day_before' ? '1 día antes' : item.reminderTime === '3_days_before' ? '3 días antes' : item.reminderTime === '5_days_before' ? '5 días antes' : 'mañana'})`}
                                  >
                                    <Send size={10} style={{ marginLeft: '4px' }} />
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <Calendar size={11} />
                                Cobro: {item.dueDate || 'Sin fecha'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <strong style={{ fontSize: '14px', textDecoration: item.paid ? 'line-through' : 'none' }}>{formatMoney(item.value)}</strong>
                            
                            {/* Row Actions */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                               {item.receiptUrl && (
                                 <button 
                                   onClick={() => handleViewReceipt(item.receiptUrl, item.name)} 
                                   style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} 
                                   title="Ver Documento de Respaldo Tributario (SII)"
                                 >
                                   <Paperclip size={12} />
                                 </button>
                               )}
                              <button onClick={() => handleOpenEdit("ingresos", idx, item)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }} title="Editar">
                                <Edit2 size={11} />
                              </button>
                              <button onClick={() => handleTransDelete("ingresos", idx, item.name)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }} title="Eliminar">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Expense Column */}
              <div>
                <div className="detail-column-title" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowDownRight size={18} color="var(--danger)" />
                    <span>Gastos & Egresos</span>
                  </div>
                  <button 
                    onClick={() => handleOpenAdd("egresos")}
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 600 }}
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                
                <div className="detail-item-list" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {currentDetails.egresos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>Sin gastos registrados.</div>
                  ) : (
                    currentDetails.egresos.map((item, idx) => (
                      <div key={idx} className="detail-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            {/* Paid Badge Status */}
                            <div style={{ marginTop: '2px' }}>
                              <span 
                                onClick={() => handleTogglePaid("egresos", idx)}
                                style={{
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  background: item.paid ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 159, 10, 0.1)',
                                  color: item.paid ? 'var(--success)' : 'var(--warning)',
                                  border: item.paid ? '1px solid rgba(52, 199, 89, 0.2)' : '1px solid rgba(255, 159, 10, 0.2)',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Haz clic para cambiar el estado de pago"
                              >
                                {item.paid ? <Check size={11} /> : null}
                                {item.paid ? "Pagado" : "Pendiente"}
                              </span>
                            </div>
                            
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: item.paid ? 'line-through' : 'none' }}>{getCleanName(item.name)}</span>
                                {renderContextBadge(item.name)}
                                <span style={{ 
                                  fontSize: '9px', 
                                  padding: '1px 4px', 
                                  borderRadius: '3px',
                                  background: item.isVariable ? 'rgba(255, 159, 10, 0.08)' : 'rgba(10, 132, 255, 0.08)',
                                  color: item.isVariable ? 'var(--warning)' : 'var(--accent)'
                                }}>
                                  {item.isVariable ? 'Var' : 'Fijo'}
                                </span>

                                {item.reminderEnabled && (
                                  <span 
                                    style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', cursor: 'pointer' }}
                                    title={`Alerta de correo configurada para: ${item.reminderEmail} (${item.reminderTime === 'same_day' ? 'el mismo día' : item.reminderTime === '1_day_before' ? '1 día antes' : item.reminderTime === '3_days_before' ? '3 días antes' : item.reminderTime === '5_days_before' ? '5 días antes' : 'mañana'})`}
                                  >
                                    <Send size={10} style={{ marginLeft: '4px' }} />
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <Calendar size={11} />
                                Vence: {item.dueDate || 'Sin fecha'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <strong style={{ fontSize: '14px', textDecoration: item.paid ? 'line-through' : 'none' }}>{formatMoney(item.value)}</strong>
                            
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              
                              {/* Notification/Reminder Trigger (as requested in Page 6) */}
                              {!item.paid && !item.reminderEnabled && (
                                <div style={{ position: 'relative' }}>
                                  <button 
                                    onClick={() => {
                                      setActiveReminderIdx(activeReminderIdx === idx && activeReminderType === "egresos" ? null : idx);
                                      setActiveReminderType("egresos");
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--warning)', cursor: 'pointer', padding: '2px', display: 'flex' }} 
                                    title="Programar recordatorio rápido"
                                  >
                                    <Bell size={11} />
                                  </button>
                                  
                                  {/* Custom Popover for Reminder options */}
                                  {activeReminderIdx === idx && activeReminderType === "egresos" && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '22px',
                                      right: '0',
                                      background: 'var(--bg-secondary)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '8px',
                                      boxShadow: 'var(--shadow-lg)',
                                      zIndex: 10,
                                      width: '180px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      padding: '4px'
                                    }}>
                                      <button 
                                        onClick={() => triggerReminderToast(item.name, "WhatsApp", item.dueDate, "(3 días antes)")}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', padding: '8px 10px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                      >
                                        WhatsApp 3 días antes
                                      </button>
                                      <button 
                                        onClick={() => triggerReminderToast(item.name, "Correo", item.dueDate, "(Inicio de mes)")}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', padding: '8px 10px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                      >
                                        Correo inicio de mes
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                               {item.receiptUrl && (
                                 <button 
                                   onClick={() => handleViewReceipt(item.receiptUrl, item.name)} 
                                   style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} 
                                   title="Ver Boleta de Respaldo Tributario (SII)"
                                 >
                                   <Paperclip size={12} />
                                 </button>
                               )}

                              <button onClick={() => handleOpenEdit("egresos", idx, item)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }} title="Editar">
                                <Edit2 size={11} />
                              </button>
                              <button onClick={() => handleTransDelete("egresos", idx, item.name)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }} title="Eliminar">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Transaction Add/Edit Sub-Modal */}
      {transModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setTransModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="close-btn" onClick={() => setTransModalOpen(false)}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {transModalMode === "add" ? "Agregar" : "Editar"} {transModalType === "ingresos" ? "Ingreso" : "Egreso"}
            </h3>

            <form onSubmit={handleTransSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Detalle / Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Honorarios o Freelance"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Monto ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 350000"
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  required
                  min="0"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tipo de Movimiento</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="trans_type"
                      checked={formIsVariable}
                      onChange={() => setFormIsVariable(true)}
                    />
                    Variable / Imprevisto
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="trans_type"
                      checked={!formIsVariable}
                      onChange={() => setFormIsVariable(false)}
                    />
                    Fijo / Recurrente
                  </label>
                </div>
              </div>

              {/* Context Selector inside FlujoMensual Transaction Add/Edit Modal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Destino Financiero</label>
                <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.1)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '12.5px',
                    padding: '6px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: formContext === 'empresa' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: formContext === 'empresa' ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name="trans_context"
                      checked={formContext === 'empresa'}
                      onChange={() => setFormContext('empresa')}
                      style={{ display: 'none' }}
                    />
                    🏢 Negocio
                  </label>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '12.5px',
                    padding: '6px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: formContext === 'personal' ? 'rgba(251, 113, 133, 0.15)' : 'transparent',
                    color: formContext === 'personal' ? '#fb7185' : 'var(--text-secondary)',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="radio"
                      name="trans_context"
                      checked={formContext === 'personal'}
                      onChange={() => setFormContext('personal')}
                      style={{ display: 'none' }}
                    />
                    🏠 Personal
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fecha Pactada de Pago/Cobro</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={e => setFormDueDate(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="form_paid"
                  checked={formPaid}
                  onChange={e => setFormPaid(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="form_paid" style={{ fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  ¿Ya está cobrado/pagado?
                </label>
              </div>

              {/* Email Reminder Activation & Setup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="form_reminder_enabled"
                  checked={formReminderEnabled}
                  onChange={e => setFormReminderEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="form_reminder_enabled" style={{ fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Activar recordatorio por correo
                </label>
              </div>

              {formReminderEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Correo de destino</label>
                    <input
                      type="email"
                      placeholder="nombre@ejemplo.com"
                      value={formReminderEmail}
                      onChange={e => setFormReminderEmail(e.target.value)}
                      required={formReminderEnabled}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Cuándo notificar</label>
                    <select
                      value={formReminderTime}
                      onChange={e => setFormReminderTime(e.target.value)}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="tomorrow">Mañana</option>
                      <option value="same_day">El mismo día del vencimiento</option>
                      <option value="1_day_before">1 día antes</option>
                      <option value="3_days_before">3 días antes</option>
                      <option value="5_days_before">5 días antes</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setTransModalOpen(false)}
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

      {/* ==========================================
          SII DOCUMENT VISOR OVERLAY (TAX COMPLIANCE)
         ========================================== */}
      {viewReceiptUrl && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewReceiptUrl("")}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '640px', 
              width: '90%', 
              background: 'var(--bg-secondary, #1e293b)', 
              borderRadius: '20px', 
              padding: '24px', 
              position: 'relative',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button 
              className="close-btn" 
              onClick={() => setViewReceiptUrl("")}
              style={{ top: '16px', right: '16px' }}
            >
              <X size={16} />
            </button>

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip size={18} color="var(--success)" />
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Visor de Respaldo Tributario (SII)</h3>
            </div>

            <p className="subtitle" style={{ marginBottom: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Documento digital asociado a: <strong>{viewReceiptName}</strong>. Este archivo sirve como comprobante ante fiscalizaciones del Servicio de Impuestos Internos.
            </p>

            {/* Document Frame / Container */}
            <div style={{ 
              width: '100%', 
              height: '380px', 
              backgroundColor: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {viewReceiptUrl.startsWith("data:") || viewReceiptUrl.startsWith("blob:") ? (
                <img 
                  src={viewReceiptUrl} 
                  alt={viewReceiptName} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                /* Fallback if it is a mock string URL or PDF path */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                  <FileText size={48} color="var(--text-tertiary)" />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>Respaldo Tributario Digital Encriptado</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', maxWidth: '320px' }}>Archivo oficial registrado en Supabase Storage para auditorías del SII.</span>
                  <a 
                    href={viewReceiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '8px',
                      textDecoration: 'none'
                    }}
                  >
                    Ver archivo original
                  </a>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyItems: 'flex-end', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setViewReceiptUrl("")}
                style={{ 
                  background: 'var(--border-color)', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Cerrar Visor
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
