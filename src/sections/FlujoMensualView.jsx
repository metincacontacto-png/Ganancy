import React, { useState } from 'react';
import { Calendar, X, Plus, Trash2, Edit2, Bell, Check, Send, Paperclip, FileText } from 'lucide-react';
import { formatCLP } from '../data/financialData';

export default function FlujoMensualView({ 
  historicalFlowsState, 
  monthlyDetailsState, 
  updateMonthlyTransaction,
  currentContext,
  addHistoricalMonth,
  toggleCuota
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

  const uniqueQuarters = React.useMemo(() => {
    const quarters = historicalFlowsState.map(item => item.q);
    const unique = [];
    quarters.forEach(q => {
      if (q && !unique.includes(q)) {
        unique.push(q);
      }
    });
    
    // Ordenar trimestres cronológicamente (ej: "Q4 2025" vs "Q1 2026")
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
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);

  // Sub-modal states for adding/editing transaction inside details sheet
  const [addMonthModalOpen, setAddMonthModalOpen] = useState(false);
  const [newMonthSelect, setNewMonthSelect] = useState("Ene");
  const [newYearSelect, setNewYearSelect] = useState(new Date().getFullYear());

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

  const [transModalOpen, setTransModalOpen] = useState(false);
  const [transModalType, setTransModalType] = useState("ingresos"); // "ingresos" or "egresos"
  const [transModalMode, setTransModalMode] = useState("add"); // "add" or "edit"
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
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

  // Details sheet CRUD triggers
  const handleOpenAdd = (type, isVariable = true) => {
    setTransModalType(type);
    setTransModalMode("add");
    setEditingIndex(null);
    setEditingId(null);
    setFormName("");
    setFormValue("");
    setFormIsVariable(isVariable);
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
    setEditingId(item.id || null);
    
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
        id: editingId,
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

  const handleTransDelete = (type, index, name, id) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${name}"?`)) {
      updateMonthlyTransaction(selectedMonthDetail, type, "delete", { id, index });
    }
  };

  const handleTogglePaid = (type, index, id) => {
    const list = currentDetails[type] || [];
    const item = list[index];
    if (item && item.isDebtLink) {
      if (toggleCuota) {
        const cuotaIdx = item.cuotaIndex !== undefined ? item.cuotaIndex : 0;
        toggleCuota(item.debtId, cuotaIdx);
      }
      return;
    }
    updateMonthlyTransaction(selectedMonthDetail, type, "toggle", { id, index });
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

  const incomesWithIdx = currentDetails ? (currentDetails.ingresos || []).map((item, idx) => ({ ...item, originalIndex: idx })) : [];
  const expensesWithIdx = currentDetails ? (currentDetails.egresos || []).map((item, idx) => ({ ...item, originalIndex: idx })) : [];

  const ingresosFijos = incomesWithIdx.filter(item => !item.isVariable);
  const ingresosVariables = incomesWithIdx.filter(item => item.isVariable);

  const egresosFijos = expensesWithIdx.filter(item => !item.isVariable);
  const egresosVariables = expensesWithIdx.filter(item => item.isVariable);

  const totalIngresosFijos = ingresosFijos.reduce((sum, item) => sum + item.value, 0);
  const totalEgresosFijos = egresosFijos.reduce((sum, item) => sum + item.value, 0);
  const totalIngresosVariables = ingresosVariables.reduce((sum, item) => sum + item.value, 0);
  const totalEgresosVariables = egresosVariables.reduce((sum, item) => sum + item.value, 0);

  const renderTransactionTable = (items, type, montoLabel, emptyMessage) => {
    return (
      <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border-color)' }}>
              <th style={{ width: '28px', padding: '8px 4px' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Concepto</th>
              <th style={{ textAlign: 'right', padding: '8px', width: '110px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{montoLabel}</th>
              <th style={{ width: '90px', textAlign: 'center', padding: '8px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isExpense = type === "egresos";
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', height: '48px' }}>
                  {/* Checkbox column */}
                  <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <span
                      onClick={() => handleTogglePaid(type, item.originalIndex, item.id)}
                      style={{
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: item.paid ? '1px solid var(--success)' : '1px solid var(--text-secondary)',
                        background: item.paid ? 'var(--success)' : 'transparent',
                        color: item.paid ? 'white' : 'transparent',
                        transition: 'all 0.15s'
                      }}
                      title={item.paid ? "Marcar como Pendiente" : "Marcar como Pagado"}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  </td>
                  
                  {/* Concepto column */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontWeight: 500, 
                          color: 'var(--text-primary)', 
                          textDecoration: item.paid ? 'line-through' : 'none',
                          opacity: item.paid ? 0.6 : 1,
                          fontSize: '13px'
                        }}>
                          {getCleanName(item.name)}
                        </span>
                        {renderContextBadge(item.name)}
                        
                        {/* If it's real/receipt we show a badge */}
                        {item.receiptUrl && (
                          <span style={{
                            background: 'rgba(52, 199, 89, 0.1)',
                            color: 'var(--success)',
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }} title="Gasto Real / Boleta cargada en el mes">
                            Real / Boleta
                          </span>
                        )}
                        
                        {/* If it's a debt link, we show a badge */}
                        {item.isDebtLink && (
                          <span style={{
                            background: 'rgba(10, 132, 255, 0.1)',
                            color: 'var(--accent)',
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}>
                            Deuda
                          </span>
                        )}
                      </div>
                      
                      {/* Due date and other details */}
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={10} />
                        {isExpense ? 'Vence' : 'Cobro'}: {item.dueDate || 'Sin fecha'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Monto column */}
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right', 
                    fontWeight: 600, 
                    verticalAlign: 'middle',
                    fontSize: '13px',
                    textDecoration: item.paid ? 'line-through' : 'none',
                    opacity: item.paid ? 0.6 : 1
                  }} className={isExpense ? "num-negative" : "num-positive"}>
                    {formatMoney(item.value)}
                  </td>
                  
                  {/* Actions column */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                      {item.receiptUrl && (
                        <button 
                          onClick={() => handleViewReceipt(item.receiptUrl, item.name)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} 
                          title="Ver Boleta de Respaldo Tributario (SII)"
                        >
                          <Paperclip size={12} />
                        </button>
                      )}
                      
                      {!item.isDebtLink && !item.paid && !item.reminderEnabled && (
                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={() => {
                              setActiveReminderIdx(activeReminderIdx === item.originalIndex && activeReminderType === type ? null : item.originalIndex);
                              setActiveReminderType(type);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--warning)', cursor: 'pointer', padding: '2px', display: 'flex' }} 
                            title="Programar recordatorio rápido"
                          >
                            <Bell size={11} />
                          </button>
                          
                          {activeReminderIdx === item.originalIndex && activeReminderType === type && (
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
                      
                      {item.reminderEnabled && (
                        <span 
                          style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', cursor: 'pointer' }}
                          title={`Alerta de correo configurada para: ${item.reminderEmail}`}
                        >
                          <Send size={10} />
                        </span>
                      )}
                      
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
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {items.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px 0', fontSize: '12px' }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--border-color)', padding: '4px', borderRadius: '10px', gap: '2px', flexWrap: 'wrap' }}>
            {uniqueQuarters.map(q => {
              const formatQuarterLabel = (quarterStr) => {
                if (!quarterStr) return "";
                const parts = quarterStr.split(' ');
                if (parts.length === 2) {
                  const qNum = parts[0].replace('Q', '');
                  return `Trimestre ${qNum} ${parts[1]}`;
                }
                return quarterStr;
              };
              return (
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
              );
            })}
          </div>
          <button
            onClick={() => setAddMonthModalOpen(true)}
            style={{
              background: 'rgba(var(--accent-rgb), 0.1)',
              border: '1px solid rgba(var(--accent-rgb), 0.3)',
              color: 'var(--accent)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            title="Añadir nuevo periodo contable"
          >
            <Plus size={14} /> Añadir Mes
          </button>
        </div>
      </div>

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

      {/* Modal / Sheet de Detalle de Mes (DIRECT CRUD & Reminders) */}
      {selectedMonthDetail && currentDetails && currentMonthFlow && (
        <div className="modal-overlay" onClick={() => setSelectedMonthDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1150px', width: '95%' }}>
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
            <div className="modal-balance-grid">
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

            {/* Grid Columns for Incomes / Expenses - 4 Panels (2x2 Grid) */}
            <div className="operational-grid-2x2">
              {/* Left: Ingresos Fijos */}
              <div 
                className="card" 
                style={{ 
                  padding: '20px 0', 
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ padding: '0 20px 12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                      Ingresos Fijos
                    </h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Detalle de flujos recurrentes mensuales</p>
                  </div>
                  <button 
                    onClick={() => handleOpenAdd("ingresos", false)} 
                    style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                {renderTransactionTable(ingresosFijos, "ingresos", "Monto Mensual", "No hay ingresos fijos registrados.")}
                <div style={{ padding: '12px 20px 0 20px', borderTop: '2.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Ingresos Fijos</span>
                  <span style={{ fontSize: '15px', fontWeight: 700 }} className="num-positive">{formatMoney(totalIngresosFijos)}</span>
                </div>
              </div>

              {/* Right: Egresos Fijos */}
              <div 
                className="card" 
                style={{ 
                  padding: '20px 0', 
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ padding: '0 20px 12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                      Egresos Fijos
                    </h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Detalle de costos recurrentes</p>
                  </div>
                  <button 
                    onClick={() => handleOpenAdd("egresos", false)} 
                    style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                {renderTransactionTable(egresosFijos, "egresos", "Monto Mensual", "No hay egresos fijos registrados.")}
                <div style={{ padding: '12px 20px 0 20px', borderTop: '2.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Egresos Fijos</span>
                  <span style={{ fontSize: '15px', fontWeight: 700 }} className="num-negative">{formatMoney(totalEgresosFijos)}</span>
                </div>
              </div>

              {/* Bottom Left: Ingresos Variables */}
              <div 
                className="card" 
                style={{ 
                  padding: '20px 0', 
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ padding: '0 20px 12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                      Ingresos Variables
                    </h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Detalle de flujos variables de ingresos</p>
                  </div>
                  <button 
                    onClick={() => handleOpenAdd("ingresos", true)} 
                    style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                {renderTransactionTable(ingresosVariables, "ingresos", "Monto Estimado", "No hay ingresos variables registrados.")}
                <div style={{ padding: '12px 20px 0 20px', borderTop: '2.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Est. Ingresos Var.</span>
                  <span style={{ fontSize: '15px', fontWeight: 700 }} className="num-positive">{formatMoney(totalIngresosVariables)}</span>
                </div>
              </div>

              {/* Bottom Right: Egresos Variables */}
              <div 
                className="card" 
                style={{ 
                  padding: '20px 0', 
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ padding: '0 20px 12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                      Egresos Variables
                    </h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Detalle de egresos variables</p>
                  </div>
                  <button 
                    onClick={() => handleOpenAdd("egresos", true)} 
                    style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                {renderTransactionTable(egresosVariables, "egresos", "Monto Estimado", "No hay egresos variables registrados.")}
                <div style={{ padding: '12px 20px 0 20px', borderTop: '2.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Est. Egresos Var.</span>
                  <span style={{ fontSize: '15px', fontWeight: 700 }} className="num-negative">{formatMoney(totalEgresosVariables)}</span>
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

    </div>
  );
}
