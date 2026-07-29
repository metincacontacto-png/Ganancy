import React, { useState } from 'react';
import { Calendar, X, Plus, Trash2, Edit2, Bell, Check, Send, Paperclip, FileText } from 'lucide-react';
import { formatCLP } from '../data/financialData';

function renderFormattedToastMessage(message) {
  if (!message) return null;
  // Escapar caracteres html inseguros para evitar inyección XSS
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Dividir buscando bloques de negritas markdown **texto**
  const parts = escaped.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index}>{part}</strong>;
    }
    return part;
  });
}

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

const getQuarterInfo = (monthStr, startMonthStr) => {
  const date = parseMonthYear(monthStr);
  const startDate = parseMonthYear(startMonthStr);
  
  const diffMonths = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
  
  const qIndex = Math.floor(diffMonths / 3);
  
  const qStartMonth = new Date(startDate.getFullYear(), startDate.getMonth() + qIndex * 3, 1);
  const qEndMonth = new Date(startDate.getFullYear(), startDate.getMonth() + qIndex * 3 + 2, 1);
  
  const monthNamesAbbr = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  const startLabel = `${monthNamesAbbr[qStartMonth.getMonth()]} ${String(qStartMonth.getFullYear()).slice(-2)}`;
  const endLabel = `${monthNamesAbbr[qEndMonth.getMonth()]} ${String(qEndMonth.getFullYear()).slice(-2)}`;
  
  const qNumber = qIndex >= 0 ? qIndex + 1 : qIndex;
  const id = `Q_${qIndex}`;
  const label = `Trimestre ${qNumber} (${startLabel} - ${endLabel})`;
  
  return { id, label, qIndex };
};

export default function FlujoMensualView({ 
  historicalFlowsState, 
  monthlyDetailsState, 
  updateMonthlyTransaction,
  currentContext,
  addHistoricalMonth,
  toggleCuota,
  ingresosFijosState = [],
  egresosFijosState = [],
  deleteHistoricalMonth,
  addIncome,
  editIncome,
  deleteIncome,
  addExpense,
  editExpense,
  deleteExpense
}) {
  const getCleanName = (name) => {
    if (!name) return "";
    const parts = name.split(' ||| ');
    return parts[0].replace(' [Personal]', '').replace(' [Empresa]', '');
  };

  const parseFixedStartMonth = (fullName) => {
    if (!fullName) return null;
    const parts = fullName.split(' ||| ');
    return parts[1] || null;
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

  // Accounting start date states
  const [accountingStartDate, setAccountingStartDate] = useState(() => {
    const localVal = localStorage.getItem('accountingStartDate');
    if (localVal) return localVal;
    
    // Default to the earliest month in historicalFlowsState
    if (historicalFlowsState && historicalFlowsState.length > 0) {
      const sorted = [...historicalFlowsState].sort((a, b) => {
        return parseMonthYear(a.month) - parseMonthYear(b.month);
      });
      return sorted[0].month;
    }
    
    const monthNamesAbbr = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    return `${monthNamesAbbr[now.getMonth()]} ${now.getFullYear()}`;
  });

  const [isChangingStartDate, setIsChangingStartDate] = useState(false);
  const [tempStartMonth, setTempStartMonth] = useState("Jun");
  const [tempStartYear, setTempStartYear] = useState(new Date().getFullYear());

  const handleSaveStartDate = () => {
    const newDateStr = `${tempStartMonth} ${tempStartYear}`;
    localStorage.setItem('accountingStartDate', newDateStr);
    setAccountingStartDate(newDateStr);
    setIsChangingStartDate(false);
    
    // Re-evaluate quarters and select the latest
    const newFlows = historicalFlowsState.map(item => {
      const qInfo = getQuarterInfo(item.month, newDateStr);
      return { ...item, q: qInfo.id, qLabel: qInfo.label };
    });
    if (newFlows.length > 0) {
      const sorted = [...newFlows].sort((a, b) => {
        const indexA = parseInt(a.q.replace('Q_', ''), 10);
        const indexB = parseInt(b.q.replace('Q_', ''), 10);
        return indexA - indexB;
      });
      setSelectedTrimestre(sorted[sorted.length - 1].q);
    }
  };

  // Compute custom quarters and map
  const { processedFlows, uniqueQuarters, quartersMap } = React.useMemo(() => {
    const processed = historicalFlowsState.map(item => {
      const qInfo = getQuarterInfo(item.month, accountingStartDate);
      return {
        ...item,
        q: qInfo.id,
        qLabel: qInfo.label
      };
    });

    const qMap = {};
    processed.forEach(item => {
      if (item.q && !qMap[item.q]) {
        qMap[item.q] = item.qLabel;
      }
    });

    const unique = Object.keys(qMap).sort((a, b) => {
      const indexA = parseInt(a.replace('Q_', ''), 10);
      const indexB = parseInt(b.replace('Q_', ''), 10);
      return indexA - indexB;
    });

    return { processedFlows: processed, uniqueQuarters: unique, quartersMap: qMap };
  }, [historicalFlowsState, accountingStartDate]);

  const [selectedTrimestre, setSelectedTrimestre] = useState(() => {
    if (historicalFlowsState && historicalFlowsState.length > 0) {
      const latestMonth = historicalFlowsState[historicalFlowsState.length - 1].month;
      const localVal = localStorage.getItem('accountingStartDate');
      let startMonth = localVal;
      if (!startMonth) {
        const sorted = [...historicalFlowsState].sort((a, b) => {
          return parseMonthYear(a.month) - parseMonthYear(b.month);
        });
        startMonth = sorted[0].month;
      }
      return getQuarterInfo(latestMonth, startMonth).id;
    }
    return "Q_0";
  });
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("resumen");

  // Fixed Template States
  const [fixedTemplatesOpen, setFixedTemplatesOpen] = useState(false);
  const [fixedModalOpen, setFixedModalOpen] = useState(false);
  const [fixedModalType, setFixedModalType] = useState("ingresos"); // "ingresos" | "egresos"
  const [fixedModalMode, setFixedModalMode] = useState("add"); // "add" | "edit"
  const [fixedEditingItem, setFixedEditingItem] = useState(null);
  const [fixedFormName, setFixedFormName] = useState("");
  const [fixedFormValue, setFixedFormValue] = useState("");
  const [fixedFormContext, setFixedFormContext] = useState("empresa");
  const [fixedLimitStartDate, setFixedLimitStartDate] = useState(false);
  const [fixedStartMonthSelect, setFixedStartMonthSelect] = useState("Ene");
  const [fixedStartYearSelect, setFixedStartYearSelect] = useState(new Date().getFullYear());

  const handleOpenFixedModal = (type, mode, item = null) => {
    setFixedModalType(type);
    setFixedModalMode(mode);
    setFixedEditingItem(item);
    if (item) {
      const hasPersonalTag = item.name.includes('[Personal]');
      const parts = item.name.split(' ||| ');
      const cleanName = parts[0].replace(' [Personal]', '').replace(' [Empresa]', '');
      setFixedFormName(cleanName);
      setFixedFormValue(item.value);
      setFixedFormContext(hasPersonalTag ? 'personal' : 'empresa');
      
      if (parts[1]) {
        const dateParts = parts[1].split(' ');
        setFixedLimitStartDate(true);
        setFixedStartMonthSelect(dateParts[0]);
        setFixedStartYearSelect(Number(dateParts[1]));
      } else {
        setFixedLimitStartDate(false);
        setFixedStartMonthSelect("Ene");
        setFixedStartYearSelect(new Date().getFullYear());
      }
    } else {
      setFixedFormName("");
      setFixedFormValue("");
      setFixedFormContext(currentContext === 'personal' ? 'personal' : 'empresa');
      setFixedLimitStartDate(false);
      setFixedStartMonthSelect("Ene");
      setFixedStartYearSelect(new Date().getFullYear());
    }
    setFixedModalOpen(true);
  };

  const handleFixedSubmit = async (e) => {
    e.preventDefault();
    if (!fixedFormName.trim() || !fixedFormValue) return;

    const value = Math.round(Number(fixedFormValue));
    const nameWithContext = fixedFormContext === 'personal' ? `${fixedFormName} [Personal]` : `${fixedFormName} [Empresa]`;
    const finalName = fixedLimitStartDate ? `${nameWithContext} ||| ${fixedStartMonthSelect} ${fixedStartYearSelect}` : nameWithContext;

    if (fixedModalType === 'ingresos') {
      if (fixedModalMode === 'add') {
        if (addIncome) await addIncome(finalName, value);
      } else {
        if (editIncome && fixedEditingItem) await editIncome(fixedEditingItem.id, finalName, value);
      }
    } else {
      if (fixedModalMode === 'add') {
        if (addExpense) await addExpense(finalName, value);
      } else {
        if (editExpense && fixedEditingItem) await editExpense(fixedEditingItem.id, finalName, value);
      }
    }
    setFixedModalOpen(false);
  };

  const handleConfirmDeleteFixed = async (type, id, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${getCleanName(name)}" de la plantilla de flujos fijos generales?`)) {
      if (type === 'ingresos') {
        if (deleteIncome) await deleteIncome(id);
      } else {
        if (deleteExpense) await deleteExpense(id);
      }
    }
  };

  // Sub-modal states for adding/editing transaction inside details sheet
  const [addMonthModalOpen, setAddMonthModalOpen] = useState(false);
  const [newMonthSelect, setNewMonthSelect] = useState("Ene");
  const [newYearSelect, setNewYearSelect] = useState(new Date().getFullYear());

  const [addIncomesOption, setAddIncomesOption] = useState("all"); // "all", "edit", "none"
  const [addExpensesOption, setAddExpensesOption] = useState("all"); // "all", "edit", "none"
  const [selectedIncomesCheck, setSelectedIncomesCheck] = useState({});
  const [selectedExpensesCheck, setSelectedExpensesCheck] = useState({});

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

  const handleAddMonthSubmit = async (e) => {
    e.preventDefault();
    const monthName = `${newMonthSelect} ${newYearSelect}`;
    
    if (historicalFlowsState.some(f => f.month === monthName)) {
      alert("El periodo seleccionado ya existe en el registro.");
      return;
    }
    
    // Filter by start date
    const activeIncomes = ingresosFijosState.filter(item => {
      const startMonth = parseFixedStartMonth(item.name);
      if (!startMonth) return true;
      return parseMonthYear(monthName) >= parseMonthYear(startMonth);
    });

    let incomesToPass = [];
    if (addIncomesOption === "all") {
      incomesToPass = activeIncomes;
    } else if (addIncomesOption === "edit") {
      incomesToPass = activeIncomes.filter(item => !!selectedIncomesCheck[item.id]);
    }

    const activeExpenses = egresosFijosState.filter(item => {
      const startMonth = parseFixedStartMonth(item.name);
      if (!startMonth) return true;
      return parseMonthYear(monthName) >= parseMonthYear(startMonth);
    });

    let expensesToPass = [];
    if (addExpensesOption === "all") {
      expensesToPass = activeExpenses;
    } else if (addExpensesOption === "edit") {
      expensesToPass = activeExpenses.filter(item => !!selectedExpensesCheck[item.id]);
    }

    const success = await addHistoricalMonth(monthName, incomesToPass, expensesToPass);
    if (success) {
      const targetQ = getQuarterInfo(monthName, accountingStartDate).id;
      setSelectedTrimestre(targetQ);
      setAddMonthModalOpen(false);
    }
  };

  const handleDeleteMonth = async (monthName) => {
    if (window.confirm(`¿Estás completamente seguro de que deseas eliminar el periodo contable "${monthName}"? Se borrarán de forma permanente todas las transacciones asociadas a este mes.`)) {
      if (deleteHistoricalMonth) {
        const success = await deleteHistoricalMonth(monthName);
        if (success) {
          setSelectedMonthDetail(null);
        }
      }
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

  // Totales de la plantilla fija general
  const totalIngresosFijosGeneral = (ingresosFijosState || []).reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const totalEgresosFijosGeneral = (egresosFijosState || []).reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const balanceFijoGeneral = totalIngresosFijosGeneral - totalEgresosFijosGeneral;
  
  // Filter months by quarter
  const filteredMonths = processedFlows.filter(item => item.q === selectedTrimestre);

  // Sort months chronologically descending (newest first)
  const sortedFilteredMonths = React.useMemo(() => {
    const parseMonthYearLocal = (str) => {
      const p = str.split(' ');
      const abbr = p[0];
      const yr = parseInt(p[1], 10);
      const monthMap = {
        "Ene": 0, "Feb": 1, "Mar": 2, "Abr": 3, "May": 4, "Jun": 5,
        "Jul": 6, "Ago": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dic": 11
      };
      return new Date(yr, monthMap[abbr] || 0);
    };
    return [...filteredMonths].sort((a, b) => parseMonthYearLocal(b.month) - parseMonthYearLocal(a.month));
  }, [filteredMonths]);

  const latestMonth = sortedFilteredMonths[0];
  const otherMonths = sortedFilteredMonths.slice(1);

  // Modals for adding/editing transactions inside the month details
  const [transList, setTransList] = useState([]);
  
  const handleOpenMonthDetail = (monthName) => {
    setSelectedMonthDetail(monthName);
  };

  const handleCloseMonthDetail = () => {
    setSelectedMonthDetail(null);
  };

  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderMethod, setReminderMethod] = useState("email"); // "email" | "whatsapp"
  const [reminderDaysBefore, setReminderDaysBefore] = useState("3"); // "1" | "3" | "7" | "custom"
  const [reminderCustomDate, setReminderCustomDate] = useState("");

  const handleSaveReminder = (transName, transType, originalIndex) => {
    const method = reminderMethod === "email" ? "Correo electrónico" : "WhatsApp";
    let optionLabel = "";
    let dueDate = null;

    if (currentMonthFlow) {
      // Find the transaction due date
      const monthDetails = monthlyDetailsState[selectedMonthDetail] || { ingresos: [], egresos: [] };
      const transList = transType === "ingresos" ? monthDetails.ingresos : monthDetails.egresos;
      const transItem = transList[originalIndex];
      if (transItem && transItem.dueDate) {
        dueDate = transItem.dueDate;
      }
    }

    if (reminderDaysBefore === "custom") {
      optionLabel = `el ${reminderCustomDate}`;
    } else {
      optionLabel = `${reminderDaysBefore} días antes`;
    }

    const dateStr = dueDate ? ` el ${dueDate}` : ' en su vencimiento';
    setToastMessage(`🔔 Recordatorio programado con éxito: Se enviará una notificación por **${method}** para la transacción **"${transName}"** ${optionLabel}${dateStr}.`);
    setActiveReminderIdx(null); // Close popover

    // Auto clear toast after 5 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const currentDetails = selectedMonthDetail ? (monthlyDetailsState[selectedMonthDetail] || { ingresos: [], egresos: [] }) : null;
  const currentMonthFlow = selectedMonthDetail ? processedFlows.find(m => m.month === selectedMonthDetail) : null;

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
    const cleanName = item.name.split(' ||| ')[0].replace(' [Personal]', '').replace(' [Empresa]', '');
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

  // Totals calculations inside the modal
  const totalIngresosMes = currentDetails ? currentDetails.ingresos.reduce((sum, item) => sum + item.value, 0) : 0;
  const totalEgresosMes = currentDetails ? currentDetails.egresos.reduce((sum, item) => sum + item.value, 0) : 0;
  const balanceNetoMes = totalIngresosMes - totalEgresosMes;

  const ingresosRecibidos = currentDetails ? currentDetails.ingresos.filter(item => item.paid).reduce((sum, item) => sum + item.value, 0) : 0;
  const egresosPagados = currentDetails ? currentDetails.egresos.filter(item => item.paid).reduce((sum, item) => sum + item.value, 0) : 0;
  const balanceCajaActual = ingresosRecibidos - egresosPagados;

  const ingresosPorRecibir = totalIngresosMes - ingresosRecibidos;
  const egresosPorPagar = totalEgresosMes - egresosPagados;
  const balancePendiente = ingresosPorRecibir - egresosPorPagar;

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
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border-color)' }}>
              <th style={{ width: '32px', padding: '8px 4px' }}></th>
              <th style={{ textAlign: 'left', padding: '8px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Concepto</th>
              <th style={{ textAlign: 'right', padding: '8px', width: '120px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{montoLabel}</th>
              <th style={{ width: '100px', textAlign: 'center', padding: '8px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isExpense = type === "egresos";
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', height: '54px' }}>
                  {/* Checkbox column */}
                  <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <span
                      onClick={() => handleTogglePaid(type, item.originalIndex, item.id)}
                      style={{
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: item.paid ? '1px solid var(--success)' : '1px solid var(--text-secondary)',
                        background: item.paid ? 'var(--success)' : 'transparent',
                        color: item.paid ? 'white' : 'transparent',
                        transition: 'all 0.15s'
                      }}
                      title={item.paid ? "Marcar como Pendiente" : "Marcar como Pagado"}
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </td>
                  
                  {/* Concepto column */}
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontWeight: 600, 
                          color: 'var(--text-primary)', 
                          textDecoration: item.paid ? 'line-through' : 'none',
                          opacity: item.paid ? 0.6 : 1,
                          fontSize: '15px'
                        }}>
                          {getCleanName(item.name)}
                        </span>
                        {renderContextBadge(item.name)}
                        
                        {/* If it's real/receipt we show a badge */}
                        {item.receiptUrl && (
                          <span style={{
                            background: 'rgba(52, 199, 89, 0.1)',
                            color: 'var(--success)',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
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
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}>
                            Deuda
                          </span>
                        )}

                        {item.paid && (
                          <span style={{
                            background: 'rgba(52, 199, 89, 0.1)',
                            color: 'var(--success)',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}>
                            {type === 'ingresos' ? 'Cobrado' : 'Pagado'}
                          </span>
                        )}
                      </div>
                      
                      {/* Due date and other details */}
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {isExpense ? 'Vence' : 'Cobro'}: {item.dueDate || 'Sin fecha'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Monto column */}
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right', 
                    fontWeight: 700, 
                    verticalAlign: 'middle',
                    fontSize: '15px',
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
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} 
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleTransDelete(type, item.originalIndex, item.name, item.id)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} 
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
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
          <div>{renderFormattedToastMessage(toastMessage)}</div>
          <button 
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Selector de Trimestre & Header */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Flujo de Caja Mensual</h2>
          <p className="subtitle" style={{ margin: '4px 0 0 0' }}>Historial de transacciones consolidado por periodos trimestrales</p>
          
          {isChangingStartDate ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '10px'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inicio:</span>
              <select
                value={tempStartMonth}
                onChange={e => setTempStartMonth(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={tempStartYear}
                onChange={e => setTempStartYear(Number(e.target.value))}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={handleSaveStartDate}
                style={{
                  background: 'var(--success)',
                  color: 'white',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Guardar
              </button>
              <button
                onClick={() => setIsChangingStartDate(false)}
                style={{
                  background: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '10px',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              borderRadius: '8px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <Calendar size={14} style={{ color: 'var(--accent)', marginRight: '6px' }} />
                Inicio del libro:&nbsp;<strong>{accountingStartDate}</strong>
              </span>
              <button
                onClick={() => {
                  const parts = accountingStartDate.split(' ');
                  setTempStartMonth(parts[0]);
                  setTempStartYear(Number(parts[1]));
                  setIsChangingStartDate(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '2px 4px',
                  fontSize: '11.5px'
                }}
              >
                Cambiar
              </button>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--border-color)', padding: '4px', borderRadius: '10px', gap: '2px', flexWrap: 'wrap' }}>
            {uniqueQuarters.map(q => {
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
                  {quartersMap[q]}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleOpenAddMonth}
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

      {/* Sección de Plantilla de Flujos Fijos (Collapsible) */}
      <div className="card glass-panel" style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '12px' }} onClick={() => setFixedTemplatesOpen(!fixedTemplatesOpen)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Calendar size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Plantilla de Ingresos y Egresos Fijos Generales
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              (Se auto-copian al crear nuevos meses en el libro)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Fijo:</span>
              <span style={{ fontSize: '12.5px', color: 'var(--success)', fontWeight: 600 }}>
                {formatMoney(totalIngresosFijosGeneral)}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/</span>
              <span style={{ fontSize: '12.5px', color: 'var(--danger)', fontWeight: 600 }}>
                {formatMoney(totalEgresosFijosGeneral)}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: balanceFijoGeneral >= 0 ? 'var(--success)' : 'var(--danger)',
                background: balanceFijoGeneral >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: '4px'
              }}>
                {balanceFijoGeneral >= 0 ? '+' : ''}{formatMoney(balanceFijoGeneral)}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
              {fixedTemplatesOpen ? 'Ocultar' : 'Configurar'}
            </span>
          </div>
        </div>

        {fixedTemplatesOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            {/* Column 1: Ingresos Fijos */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>Ingresos Fijos Generales</h4>
                <button
                  type="button"
                  onClick={() => handleOpenFixedModal('ingresos', 'add')}
                  style={{
                    background: 'var(--success-light)',
                    color: 'var(--success)',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={10} /> Agregar
                </button>
              </div>
              {ingresosFijosState.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '10px 0' }}>No hay ingresos fijos registrados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ingresosFijosState.map((item, idx) => (
                    <div key={item.id || idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-primary)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        {getCleanName(item.name)}
                        {renderContextBadge(item.name)}
                        {parseFixedStartMonth(item.name) && (
                          <span style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            fontWeight: 500,
                            marginLeft: '4px'
                          }}>
                            Desde {parseFixedStartMonth(item.name)}
                          </span>
                        )}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatMoney(item.value)}</span>
                        <button type="button" onClick={() => handleOpenFixedModal('ingresos', 'edit', item)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}><Edit2 size={11} /></button>
                        <button type="button" onClick={() => handleConfirmDeleteFixed('ingresos', item.id, item.name)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-primary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    borderTop: '2px solid var(--success)',
                    marginTop: '6px'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Ingresos</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--success)' }}>{formatMoney(totalIngresosFijosGeneral)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Egresos Fijos */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--danger)', fontWeight: 600 }}>Egresos Fijos Generales</h4>
                <button
                  type="button"
                  onClick={() => handleOpenFixedModal('egresos', 'add')}
                  style={{
                    background: 'var(--danger-light)',
                    color: 'var(--danger)',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={10} /> Agregar
                </button>
              </div>
              {egresosFijosState.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '10px 0' }}>No hay egresos fijos registrados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {egresosFijosState.map((item, idx) => (
                    <div key={item.id || idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-primary)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        {getCleanName(item.name)}
                        {renderContextBadge(item.name)}
                        {parseFixedStartMonth(item.name) && (
                          <span style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            fontWeight: 500,
                            marginLeft: '4px'
                          }}>
                            Desde {parseFixedStartMonth(item.name)}
                          </span>
                        )}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatMoney(item.value)}</span>
                        <button type="button" onClick={() => handleOpenFixedModal('egresos', 'edit', item)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}><Edit2 size={11} /></button>
                        <button type="button" onClick={() => handleConfirmDeleteFixed('egresos', item.id, item.name)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-primary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    borderTop: '2px solid var(--danger)',
                    marginTop: '6px'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Egresos</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(totalEgresosFijosGeneral)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMonth(latestMonth.month);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', transition: 'opacity 0.2s' }}
                  title="Eliminar este periodo contable por completo"
                >
                  <Trash2 size={18} />
                </button>
                <span className={`badge ${isNegative ? 'danger' : 'success'}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                  {isNegative ? 'Deficit' : 'Superávit'}
                </span>
              </div>
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

            <div className="main-month-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginRight: '8px' }}>Balance del Mes:</span>
                <strong style={{ fontSize: '20px' }} className={isNegative ? "num-negative" : "num-positive"}>
                  {isNegative ? '' : '+'}{formatMoney(latestMonth.balance)}
                </strong>
              </div>
              <button 
                onClick={() => { setSelectedMonthDetail(latestMonth.month); setActiveModalTab("resumen"); }}
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
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {otherMonths.map(item => {
              const isNegative = item.balance < 0;
              return (
                <div 
                  key={item.month} 
                  className="card" 
                  onClick={() => { setSelectedMonthDetail(item.month); setActiveModalTab("resumen"); }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMonth(item.month);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', transition: 'opacity 0.2s' }}
                        title="Eliminar este periodo contable por completo"
                      >
                        <Trash2 size={14} />
                      </button>
                      <span className={`badge ${isNegative ? 'danger' : 'success'}`}>
                        {isNegative ? 'Deficit' : 'Superávit'}
                      </span>
                    </div>
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
          <div className="modal-content modal-sidebar-layout" onClick={e => e.stopPropagation()} style={{ maxWidth: '1750px', width: '99%' }}>
            
            {/* Sidebar Navigation */}
            <div className="modal-sidebar">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={22} color="var(--accent)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{selectedMonthDetail}</h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>Desglose Operacional</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <button 
                  onClick={() => setActiveModalTab("resumen")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeModalTab === "resumen" ? 'var(--accent-light)' : 'transparent',
                    color: activeModalTab === "resumen" ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: activeModalTab === "resumen" ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>📊</span> Resumen General
                </button>

                <button 
                  onClick={() => setActiveModalTab("ingresos_fijos")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeModalTab === "ingresos_fijos" ? 'var(--accent-light)' : 'transparent',
                    color: activeModalTab === "ingresos_fijos" ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: activeModalTab === "ingresos_fijos" ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px' }}>💰</span> Ingresos Fijos
                  </div>
                  <span style={{ fontSize: '12px', backgroundColor: 'var(--border-color)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-primary)' }}>
                    {ingresosFijos.length}
                  </span>
                </button>

                <button 
                  onClick={() => setActiveModalTab("egresos_fijos")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeModalTab === "egresos_fijos" ? 'var(--accent-light)' : 'transparent',
                    color: activeModalTab === "egresos_fijos" ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: activeModalTab === "egresos_fijos" ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px' }}>💸</span> Egresos Fijos
                  </div>
                  <span style={{ fontSize: '12px', backgroundColor: 'var(--border-color)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-primary)' }}>
                    {egresosFijos.length}
                  </span>
                </button>

                <button 
                  onClick={() => setActiveModalTab("ingresos_variables")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeModalTab === "ingresos_variables" ? 'var(--accent-light)' : 'transparent',
                    color: activeModalTab === "ingresos_variables" ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: activeModalTab === "ingresos_variables" ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px' }}>📈</span> Ingresos Variables
                  </div>
                  <span style={{ fontSize: '12px', backgroundColor: 'var(--border-color)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-primary)' }}>
                    {ingresosVariables.length}
                  </span>
                </button>

                <button 
                  onClick={() => setActiveModalTab("egresos_variables")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeModalTab === "egresos_variables" ? 'var(--accent-light)' : 'transparent',
                    color: activeModalTab === "egresos_variables" ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: activeModalTab === "egresos_variables" ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px' }}>📉</span> Egresos Variables
                  </div>
                  <span style={{ fontSize: '12px', backgroundColor: 'var(--border-color)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-primary)' }}>
                    {egresosVariables.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Content Body Area */}
            <div className="modal-body-content">
              <button className="close-btn" onClick={() => setSelectedMonthDetail(null)}>
                <X size={18} />
              </button>

              {activeModalTab === "resumen" && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Resumen General de Caja</h3>
                    <p className="subtitle" style={{ marginTop: '6px', fontSize: '14px' }}>
                      Resumen consolidado de saldos proyectados, recibidos y por pagar para el mes de {selectedMonthDetail}.
                    </p>
                  </div>

                  <div className="modal-balance-grid" style={{ marginBottom: '16px' }}>
                    {/* Row 1: Planned Totals */}
                    <div style={{ padding: '14px 18px', background: 'var(--bg-primary)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Ingresos Totales (Mes)</span>
                      <strong style={{ fontSize: '20px', color: 'var(--success)', display: 'block', marginTop: '4px' }}>{formatMoney(totalIngresosMes)}</strong>
                    </div>
                    <div style={{ padding: '14px 18px', background: 'var(--bg-primary)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Egresos Totales (Mes)</span>
                      <strong style={{ fontSize: '20px', color: 'var(--danger)', display: 'block', marginTop: '4px' }}>{formatMoney(totalEgresosMes)}</strong>
                    </div>
                    <div style={{ padding: '14px 18px', background: 'var(--bg-primary)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Balance Neto Proyectado</span>
                      <strong style={{ fontSize: '20px', display: 'block', marginTop: '4px' }} className={balanceNetoMes >= 0 ? "num-positive" : "num-negative"}>
                        {balanceNetoMes >= 0 ? '+' : ''}{formatMoney(balanceNetoMes)}
                      </strong>
                    </div>

                    {/* Row 2: Actual / Paid to Date Totals */}
                    <div style={{ padding: '14px 18px', background: 'rgba(52, 199, 89, 0.05)', border: '1px solid rgba(52, 199, 89, 0.12)', borderRadius: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--success)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Ingresos Recibidos (a la fecha)</span>
                      <strong style={{ fontSize: '20px', color: 'var(--success)', display: 'block', marginTop: '4px' }}>{formatMoney(ingresosRecibidos)}</strong>
                    </div>
                    <div style={{ padding: '14px 18px', background: 'rgba(255, 59, 48, 0.05)', border: '1px solid rgba(255, 59, 48, 0.12)', borderRadius: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--danger)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Egresos Pagados (a la fecha)</span>
                      <strong style={{ fontSize: '20px', color: 'var(--danger)', display: 'block', marginTop: '4px' }}>{formatMoney(egresosPagados)}</strong>
                    </div>
                    <div style={{ 
                      padding: '14px 18px', 
                      background: balanceCajaActual >= 0 ? 'rgba(52, 199, 89, 0.05)' : 'rgba(255, 59, 48, 0.05)', 
                      border: balanceCajaActual >= 0 ? '1px solid rgba(52, 199, 89, 0.12)' : '1px solid rgba(255, 59, 48, 0.12)', 
                      borderRadius: '12px', 
                      textAlign: 'center' 
                    }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Caja Real a la fecha</span>
                      <strong style={{ fontSize: '20px', display: 'block', marginTop: '4px' }} className={balanceCajaActual >= 0 ? "num-positive" : "num-negative"}>
                        {balanceCajaActual >= 0 ? '+' : ''}{formatMoney(balanceCajaActual)}
                      </strong>
                    </div>

                    {/* Row 3: Pending Totals */}
                    <div style={{ padding: '14px 18px', background: 'rgba(10, 132, 255, 0.05)', border: '1px solid rgba(10, 132, 255, 0.15)', borderRadius: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--accent)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Ingresos por Recibir (Pendiente)</span>
                      <strong style={{ fontSize: '20px', color: 'var(--accent)', display: 'block', marginTop: '4px' }}>{formatMoney(ingresosPorRecibir)}</strong>
                    </div>
                    <div style={{ padding: '14px 18px', background: 'rgba(255, 149, 0, 0.05)', border: '1px solid rgba(255, 149, 0, 0.15)', borderRadius: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--warning)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Egresos por Pagar (Pendiente)</span>
                      <strong style={{ fontSize: '20px', color: 'var(--warning)', display: 'block', marginTop: '4px' }}>{formatMoney(egresosPorPagar)}</strong>
                    </div>
                    <div style={{ 
                      padding: '14px 18px', 
                      background: balancePendiente >= 0 ? 'rgba(52, 199, 89, 0.05)' : 'rgba(255, 59, 48, 0.05)', 
                      border: balancePendiente >= 0 ? '1px solid rgba(52, 199, 89, 0.12)' : '1px solid rgba(255, 59, 48, 0.12)', 
                      borderRadius: '12px', 
                      textAlign: 'center' 
                    }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Balance de Pendientes</span>
                      <strong style={{ fontSize: '20px', display: 'block', marginTop: '4px' }} className={balancePendiente >= 0 ? "num-positive" : "num-negative"}>
                        {balancePendiente >= 0 ? '+' : ''}{formatMoney(balancePendiente)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === "ingresos_fijos" && (
                <div className="card" style={{ padding: '24px 0 16px 0', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ padding: '0 24px 14px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Ingresos Fijos</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Detalle de flujos recurrentes mensuales</p>
                    </div>
                    <button onClick={() => handleOpenAdd("ingresos", false)} style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                  {renderTransactionTable(ingresosFijos, "ingresos", "Monto Mensual", "No hay ingresos fijos registrados.")}
                  <div style={{ padding: '14px 24px 0 24px', borderTop: '2.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Ingresos Fijos</span>
                    <span style={{ fontSize: '18px', fontWeight: 700 }} className="num-positive">{formatMoney(totalIngresosFijos)}</span>
                  </div>
                </div>
              )}

              {activeModalTab === "egresos_fijos" && (
                <div className="card" style={{ padding: '24px 0 16px 0', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ padding: '0 24px 14px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Egresos Fijos</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Detalle de costos recurrentes</p>
                    </div>
                    <button onClick={() => handleOpenAdd("egresos", false)} style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                  {renderTransactionTable(egresosFijos, "egresos", "Monto Mensual", "No hay egresos fijos registrados.")}
                  <div style={{ padding: '14px 24px 0 24px', borderTop: '2.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Egresos Fijos</span>
                    <span style={{ fontSize: '18px', fontWeight: 700 }} className="num-negative">{formatMoney(totalEgresosFijos)}</span>
                  </div>
                </div>
              )}

              {activeModalTab === "ingresos_variables" && (
                <div className="card" style={{ padding: '24px 0 16px 0', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ padding: '0 24px 14px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Ingresos Variables</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Detalle de flujos variables de ingresos</p>
                    </div>
                    <button onClick={() => handleOpenAdd("ingresos", true)} style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                  {renderTransactionTable(ingresosVariables, "ingresos", "Monto Estimado", "No hay ingresos variables registrados.")}
                  <div style={{ padding: '14px 24px 0 24px', borderTop: '2.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Est. Ingresos Var.</span>
                    <span style={{ fontSize: '18px', fontWeight: 700 }} className="num-positive">{formatMoney(totalIngresosVariables)}</span>
                  </div>
                </div>
              )}

              {activeModalTab === "egresos_variables" && (
                <div className="card" style={{ padding: '24px 0 16px 0', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ padding: '0 24px 14px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Egresos Variables</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Detalle de egresos variables</p>
                    </div>
                    <button onClick={() => handleOpenAdd("egresos", true)} style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                  {renderTransactionTable(egresosVariables, "egresos", "Monto Estimado", "No hay egresos variables registrados.")}
                  <div style={{ padding: '14px 24px 0 24px', borderTop: '2.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Est. Egresos Var.</span>
                    <span style={{ fontSize: '18px', fontWeight: 700 }} className="num-negative">{formatMoney(totalEgresosVariables)}</span>
                  </div>
                </div>
              )}
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', padding: '24px' }}>
            <button className="close-btn" onClick={() => setAddMonthModalOpen(false)}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Agregar Periodo Contable</h3>

            <form onSubmit={handleAddMonthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mes</label>
                  <select
                    value={newMonthSelect}
                    onChange={e => setNewMonthSelect(e.target.value)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer', width: '100%' }}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Año</label>
                  <select
                    value={newYearSelect}
                    onChange={e => setNewYearSelect(Number(e.target.value))}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer', width: '100%' }}
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ingresos Fijos option */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Ingresos Fijos a Incluir</label>
                <select
                  value={addIncomesOption}
                  onChange={e => setAddIncomesOption(e.target.value)}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="all">Todos los ingresos fijos registrados</option>
                  <option value="edit">Seleccionar/Editar listado...</option>
                  <option value="none">Ninguno (Empezar en blanco)</option>
                </select>

                {addIncomesOption === "edit" && (
                  <div style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '10px', 
                    maxHeight: '130px', 
                    overflowY: 'auto', 
                    marginTop: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {ingresosFijosState.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No hay ingresos fijos registrados.</span>
                    ) : (
                      ingresosFijosState.map(item => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="checkbox"
                            checked={!!selectedIncomesCheck[item.id]}
                            onChange={(e) => setSelectedIncomesCheck(prev => ({ ...prev, [item.id]: e.target.checked }))}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{getCleanName(item.name)} ({formatMoney(item.value)})</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Egresos Fijos option */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Egresos Fijos a Incluir</label>
                <select
                  value={addExpensesOption}
                  onChange={e => setAddExpensesOption(e.target.value)}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="all">Todos los egresos fijos registrados</option>
                  <option value="edit">Seleccionar/Editar listado...</option>
                  <option value="none">Ninguno (Empezar en blanco)</option>
                </select>

                {addExpensesOption === "edit" && (
                  <div style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '10px', 
                    maxHeight: '130px', 
                    overflowY: 'auto', 
                    marginTop: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {egresosFijosState.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No hay egresos fijos registrados.</span>
                    ) : (
                      egresosFijosState.map(item => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="checkbox"
                            checked={!!selectedExpensesCheck[item.id]}
                            onChange={(e) => setSelectedExpensesCheck(prev => ({ ...prev, [item.id]: e.target.checked }))}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{getCleanName(item.name)} ({formatMoney(item.value)})</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
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
      {/* Modal para Agregar/Editar Flujo Fijo General */}
      {fixedModalOpen && (
        <div className="modal-overlay" onClick={() => setFixedModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="close-btn" onClick={() => setFixedModalOpen(false)}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {fixedModalMode === "add" 
                ? `Agregar ${fixedModalType === 'ingresos' ? 'Ingreso' : 'Egreso'} Fijo General`
                : `Editar ${fixedModalType === 'ingresos' ? 'Ingreso' : 'Egreso'} Fijo General`
              }
            </h3>

            <form onSubmit={handleFixedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nombre / Concepto</label>
                <input
                  type="text"
                  placeholder="Ej: Arriendo Oficina, Suscripción SaaS..."
                  value={fixedFormName}
                  onChange={e => setFixedFormName(e.target.value)}
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
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Monto Fijo Mensual</label>
                <input
                  type="number"
                  placeholder="Ej: 500000"
                  value={fixedFormValue}
                  onChange={e => setFixedFormValue(e.target.value)}
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

              {currentContext === 'consolidado' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Contexto</label>
                  <select
                    value={fixedFormContext}
                    onChange={e => setFixedFormContext(e.target.value)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="empresa">🏢 Empresa / Negocio</option>
                    <option value="personal">🏠 Personal</option>
                  </select>
                </div>
              )}

              {/* Start Date Configuration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={fixedLimitStartDate}
                    onChange={e => setFixedLimitStartDate(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ display: 'block' }}>Activar desde un mes específico</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400, display: 'block', marginTop: '2px' }}>
                      (Si está desactivado, se aplicará a todos los meses históricos y futuros)
                    </span>
                  </div>
                </label>
                
                {fixedLimitStartDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Aplicar desde:</span>
                    <select
                      value={fixedStartMonthSelect}
                      onChange={e => setFixedStartMonthSelect(e.target.value)}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        outline: 'none'
                      }}
                    >
                      {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={fixedStartYearSelect}
                      onChange={e => setFixedStartYearSelect(Number(e.target.value))}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        outline: 'none'
                      }}
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setFixedModalOpen(false)}
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

    </div>
  );
}
