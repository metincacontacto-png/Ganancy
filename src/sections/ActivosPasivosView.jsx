import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, ShieldAlert, Edit2, Trash2, Plus, X, Percent, Calendar } from 'lucide-react';
import { formatCLP } from '../data/financialData';

export default function ActivosPasivosView({ 
  debtsState, 
  assetsState, 
  addAsset, 
  editAsset, 
  deleteAsset,
  addDebt,
  editDebt,
  deleteDebt,
  currentContext = 'consolidado',
  addAssetCategory
}) {
  // Calculate dynamic liabilities total (outstanding balance of active debts)
  const liabilitiesTotal = debtsState.reduce((sum, d) => {
    if (d.completed) return sum;
    const paidCount = (d.cuotas || []).filter(Boolean).length;
    if (d.cuotasTotales === 0) return sum + d.total;
    if (d.cuotasTotales === 1) return sum + (paidCount === 1 ? 0 : d.total);
    return sum + Math.round(d.total * (1 - paidCount / d.cuotasTotales));
  }, 0);

  const assetsTotal = assetsState.total;
  const patrimonioNeto = assetsTotal - liabilitiesTotal;

  // Format Helper
  const formatMoney = (val) => formatCLP ? formatCLP(val) : '$' + Math.round(val).toLocaleString('es-CL');

  // Accordion State
  const [openCategories, setOpenCategories] = useState({
    equipos: true,
    audiovisual: false,
    iluminacion: false,
    muebles: false,
    otros: false
  });

  const toggleCategory = (catId) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Drag and Drop States for Assets
  const [draggedAsset, setDraggedAsset] = useState(null);
  const [sourceCatId, setSourceCatId] = useState(null);
  const [sourceIndex, setSourceIndex] = useState(null);
  const [dragOverCatId, setDragOverCatId] = useState(null);

  const handleDragStart = (e, item, catId, index) => {
    setDraggedAsset(item);
    setSourceCatId(catId);
    setSourceIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, targetCatId) => {
    e.preventDefault();
    if (!draggedAsset || !sourceCatId) return;
    if (sourceCatId !== targetCatId) {
      setDragOverCatId(targetCatId);
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragLeave = () => {
    setDragOverCatId(null);
  };

  const handleDrop = async (e, targetCatId) => {
    e.preventDefault();
    setDragOverCatId(null);

    if (!draggedAsset || !sourceCatId || sourceIndex === null) return;
    if (sourceCatId === targetCatId) return;

    const name = draggedAsset.name;
    const cleanName = name.replace(' [Personal]', '').replace(' [Empresa]', '');
    const context = name.includes('[Personal]') ? 'personal' : 'empresa';
    const value = draggedAsset.value;

    // 1. Delete from source
    if (deleteAsset) {
      await deleteAsset(sourceCatId, sourceIndex);
    }

    // 2. Add to target
    if (addAsset) {
      await addAsset(targetCatId, cleanName, value, context);
    }

    setDraggedAsset(null);
    setSourceCatId(null);
    setSourceIndex(null);
  };

  const handleCreateCategory = () => {
    const name = prompt("Nombre de la nueva categoría de activos (ej: Vehículos, Terrenos, etc.):");
    if (!name) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      alert("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (addAssetCategory) {
      addAssetCategory(trimmed);
    }
  };

  // Asset Modal States
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetModalMode, setAssetModalMode] = useState("add"); // "add" or "edit"
  const [activeAssetCatId, setActiveAssetCatId] = useState("");
  const [editingAssetIndex, setEditingAssetIndex] = useState(null);
  const [assetFormName, setAssetFormName] = useState("");
  const [assetFormValue, setAssetFormValue] = useState("");
  const [assetFormContext, setAssetFormContext] = useState("empresa");

  // Debt Modal States
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
  const [debtFormDetails, setDebtFormDetails] = useState("");
  const [debtFormContext, setDebtFormContext] = useState("empresa");

  // Asset CRUD Actions
  const openAddAsset = (catId) => {
    setActiveAssetCatId(catId);
    setAssetModalMode("add");
    setEditingAssetIndex(null);
    setAssetFormName("");
    setAssetFormValue("");
    setAssetFormContext(currentContext === 'personal' ? 'personal' : 'empresa');
    setAssetModalOpen(true);
  };

  const openEditAsset = (catId, index, item) => {
    setActiveAssetCatId(catId);
    setAssetModalMode("edit");
    setEditingAssetIndex(index);
    setAssetFormName(item.name);
    setAssetFormValue(item.value);
    setAssetModalOpen(true);
  };

  const handleAssetSubmit = (e) => {
    e.preventDefault();
    if (!assetFormName.trim() || !assetFormValue) return;

    const value = Math.round(Number(assetFormValue));
    if (assetModalMode === "add") {
      addAsset(activeAssetCatId, assetFormName, value, assetFormContext);
    } else {
      editAsset(activeAssetCatId, editingAssetIndex, assetFormName, value);
    }
    setAssetModalOpen(false);
  };

  const handleAssetDelete = (catId, index, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el activo "${name}"?`)) {
      deleteAsset(catId, index);
    }
  };

  // Debt CRUD Actions
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
    setDebtFormDetails(debt.details || "");
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

  const handleToggleSinglePayment = (debt) => {
    // Single payment toggler
    const newCuotaActual = debt.cuotaActual === 1 ? 0 : 1;
    const debtData = {
      name: debt.name,
      totalOriginal: debt.totalOriginal !== undefined ? debt.totalOriginal : debt.total,
      interes: debt.interes !== undefined ? debt.interes : 0,
      tipo: "pago_unico",
      cuotaActual: newCuotaActual,
      cuotasTotales: 1,
      montoMensual: 0,
      prepago: debt.prepago,
      fechaVencimiento: debt.fechaVencimiento,
      details: debt.details
    };
    editDebt(debt.id, debtData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Tres Cajas Hero */}
      <div className="hero-container">
        <div className="card hero-box positive">
          <div className="label">Activos Totales</div>
          <div className="value">{formatMoney(assetsTotal)}</div>
          <div className="details">Recursos, equipos e inventario</div>
        </div>

        <div className="card hero-box negative">
          <div className="label">Pasivos Totales</div>
          <div className="value">{formatMoney(liabilitiesTotal)}</div>
          <div className="details">Obligaciones y deudas vigentes</div>
        </div>

        <div className={`card hero-box ${patrimonioNeto >= 0 ? 'positive' : 'negative'}`}>
          <div className="label">Patrimonio Neto</div>
          <div className="value" style={{ 
            color: patrimonioNeto >= 0 ? 'var(--success)' : 'var(--danger)',
            background: 'none',
            WebkitTextFillColor: 'initial' 
          }}>
            {formatMoney(patrimonioNeto)}
          </div>
          <div className="details">Balance general (Activos - Pasivos)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: Activos Colapsables */}
        <div>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Inventario de Activos</h2>
            <button 
              onClick={handleCreateCategory}
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Nueva Categoría
            </button>
          </div>

          {assetsState.categories.map(category => {
            const isOpen = openCategories[category.id];
            
            // Clean suffix tags for display
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

            return (
              <div 
                key={category.id} 
                className="accordion"
                onDragOver={(e) => handleDragOver(e, category.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category.id)}
                style={{
                  border: dragOverCatId === category.id ? '2px dashed var(--accent)' : undefined,
                  backgroundColor: dragOverCatId === category.id ? 'rgba(var(--accent-rgb), 0.05)' : undefined,
                  transform: dragOverCatId === category.id ? 'scale(1.01) translateY(-2px)' : undefined,
                  boxShadow: dragOverCatId === category.id ? '0 8px 30px rgba(var(--accent-rgb), 0.15)' : undefined,
                  transition: 'all 0.25s ease',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}
              >
                <div 
                  className="accordion-header" 
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="accordion-title">
                    <span style={{ 
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: 'var(--success)'
                    }}></span>
                    <span>{category.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{formatMoney(category.total)}</span>
                    {isOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                  </div>
                </div>
                
                {isOpen && (
                  <div className="accordion-content" style={{ padding: '0 0 16px 0' }}>
                    <table style={{ marginTop: '8px' }}>
                      <thead>
                        <tr>
                          <th>Detalle</th>
                          <th style={{ textAlign: 'right' }}>Valor estimado</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((item, idx) => (
                          <tr 
                            key={item.id || idx}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item, category.id, idx)}
                            onDragEnd={() => {
                              setDraggedAsset(null);
                              setSourceCatId(null);
                              setSourceIndex(null);
                            }}
                            style={{
                              cursor: draggedAsset?.id === item.id ? 'grabbing' : 'grab',
                              opacity: draggedAsset?.id === item.id ? 0.4 : 1,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <td>{getCleanName(item.name)}{renderContextBadge(item.name)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatMoney(item.value)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button onClick={() => openEditAsset(category.id, idx, item)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleAssetDelete(category.id, idx, item.name)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '12px 24px 0 24px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => openAddAsset(category.id)}
                        style={{
                          background: 'var(--success-light)',
                          border: 'none',
                          color: 'var(--success)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={12} /> Agregar Activo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Pasivos List */}
        <div>
          <div className="section-header">
            <h2>Registro de Pasivos y Deudas</h2>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {debtsState.map(debt => {
              const paidCount = (debt.cuotas || []).filter(Boolean).length;
              const isSingle = debt.tipo === "pago_unico";
              
              const progressPercent = debt.cuotasTotales > 0 
                ? (paidCount / debt.cuotasTotales) * 100 
                : (debt.completed ? 100 : 0);
              
              const remainingValue = debt.completed ? 0 : Math.round(debt.total * (1 - paidCount / debt.cuotasTotales));

              return (
                <div key={debt.id} className="card" style={{ padding: '20px', borderLeft: isSingle ? '4px solid var(--warning)' : '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{debt.name}</h3>
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
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {debt.details}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {debt.completed ? (
                        <span className="badge success">
                          <CheckCircle size={12} /> Pagado
                        </span>
                      ) : (
                        <span className="badge warning">
                          <Clock size={12} /> Pendiente
                        </span>
                      )}
                      
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => openEditDebt(debt)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Editar Deuda">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDebtDelete(debt.id, debt.name)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} title="Eliminar Deuda">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '14px 0', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>
                        {isSingle ? 'Interés' : 'Cuota mensual'}
                      </span>
                      <strong style={{ fontSize: '14px' }}>
                        {isSingle ? `${debt.interes || 0}%` : (debt.montoMensual > 0 ? formatMoney(debt.montoMensual) : 'N/A')}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Saldo restante</span>
                      <strong style={{ fontSize: '14px' }} className={remainingValue > 0 ? "num-negative" : "num-neutral"}>
                        {formatMoney(remainingValue)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Monto total (+ int)</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {formatMoney(debt.total)}
                      </strong>
                    </div>
                  </div>

                  {/* Payment date for one-off debts */}
                  {isSingle && debt.fechaVencimiento && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      <Calendar size={13} />
                      <span>Fecha acordada de pago: <strong>{debt.fechaVencimiento}</strong></span>
                    </div>
                  )}

                  {/* Installment Progress */}
                  {!isSingle && debt.cuotasTotales > 1 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span>Progreso de cuotas</span>
                        <span>{paidCount} de {debt.cuotasTotales} ({Math.round(progressPercent)}%)</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progressPercent}%`, backgroundColor: debt.completed ? 'var(--success)' : 'var(--accent)' }}></div>
                      </div>
                    </div>
                  )}

                  {/* Direct Payment Action for One-Off Debts (as requested in Page 5) */}
                  {isSingle && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleToggleSinglePayment(debt)}
                        style={{
                          background: debt.completed ? 'var(--border-color)' : 'var(--success)',
                          color: debt.completed ? 'var(--text-primary)' : 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <CheckCircle size={12} />
                        <span>{debt.completed ? 'Marcar como Pendiente' : 'Definir como PAGADA'}</span>
                      </button>
                    </div>
                  )}

                  {/* Prepago */}
                  {debt.prepago > 0 && !debt.completed && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '8px 12px', 
                      background: 'rgba(var(--accent-rgb), 0.05)', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      border: '1px solid rgba(var(--accent-rgb), 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <ShieldAlert size={14} color="var(--accent)" />
                      <span>
                        Prepago disponible: <strong>{formatMoney(debt.prepago)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Asset Form Modal */}
      {assetModalOpen && (
        <div className="modal-overlay" onClick={() => setAssetModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="close-btn" onClick={() => setAssetModalOpen(false)}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {assetModalMode === "add" ? "Agregar Activo" : "Editar Activo"}
            </h3>

            <form onSubmit={handleAssetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Detalle / Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: MacBook Pro M1"
                  value={assetFormName}
                  onChange={e => setAssetFormName(e.target.value)}
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
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Valor estimado ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 1500000"
                  value={assetFormValue}
                  onChange={e => setAssetFormValue(e.target.value)}
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

              {currentContext === 'consolidado' && assetModalMode === 'add' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Destino del Activo</label>
                  <select
                    value={assetFormContext}
                    onChange={e => setAssetFormContext(e.target.value)}
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
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

      {/* Debt Form Modal (Page 1 & 3 & 5 Requirements) */}
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
                    outline: 'none'
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
                      outline: 'none'
                    }}
                  >
                    <option value="empresa">🏢 Empresa / Negocio</option>
                    <option value="personal">🏠 Personal</option>
                  </select>
                </div>
              )}

              {/* Debt Type Selector (Fija vs Pago Único) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tipo de Deuda</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="debt_type"
                      value="fija"
                      checked={debtFormTipo === "fija"}
                      onChange={() => setDebtFormTipo("fija")}
                    />
                    Amortizable en Cuotas
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="debt_type"
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

              {/* Original & Interest Inputs (as requested in Page 1) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Monto Original de la Deuda ($)</label>
                  <input
                    type="number"
                    placeholder="Monto base"
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
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Intereses (%)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      placeholder="0"
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
                        width: '100%'
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--text-secondary)' }}>%</span>
                  </div>
                </div>
              </div>

              {/* Cuotas Inputs (Only visible for Fija) */}
              {debtFormTipo === "fija" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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
                        padding: '10px 10px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

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
                        padding: '10px 10px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
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
                        padding: '10px 10px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Payment Date input (Only visible for Pago Único) */}
              {debtFormTipo === "pago_unico" && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                        fontFamily: 'inherit'
                      }}
                    />
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
                        outline: 'none'
                      }}
                    >
                      <option value="0">Pendiente (No pagado)</option>
                      <option value="1">Saldado (Pagado)</option>
                    </select>
                  </div>
                </div>
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
                      outline: 'none'
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
                    resize: 'none'
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

    </div>
  );
}
