import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, ShieldAlert, Edit2, Trash2, Plus, X, Percent, Calendar, Info } from 'lucide-react';
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

  // Documents Helper Functions
  const parseAssetName = (rawName) => {
    if (!rawName) return { name: "", documents: [] };
    const parts = rawName.split(" ||| ");
    const name = parts[0];
    let documents = [];
    // Search for the part that represents the JSON array of documents
    const jsonPart = parts.find(p => p.trim().startsWith('[') && p.trim().endsWith(']'));
    if (jsonPart) {
      try {
        documents = JSON.parse(jsonPart);
      } catch (e) {
        console.error("Error parsing asset documents:", e);
      }
    }
    return { name, documents };
  };

  const handleViewDocument = (doc) => {
    try {
      const newTab = window.open();
      if (!newTab) {
        alert("El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.");
        return;
      }
      newTab.document.title = doc.name;
      newTab.document.write(`
        <html>
          <head>
            <title>${doc.name}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: #000; height: 100vh; overflow: hidden; }
              iframe, img { max-width: 100%; max-height: 100%; border: none; }
            </style>
          </head>
          <body>
            ${doc.type.startsWith('image/') 
              ? `<img src="${doc.data}" alt="${doc.name}" style="max-width:90%; max-height:90%; object-fit:contain; box-shadow:0 8px 30px rgba(0,0,0,0.5); border-radius:8px;" />`
              : `<iframe src="${doc.data}" width="100%" height="100%"></iframe>`
            }
          </body>
        </html>
      `);
      newTab.document.close();
    } catch (e) {
      console.error("Error opening document:", e);
      alert("No se pudo abrir el documento.");
    }
  };

  const handleDownloadDocument = (doc) => {
    try {
      const link = document.createElement('a');
      link.href = doc.data;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error downloading document:", e);
      alert("No se pudo descargar el documento.");
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
  const [assetFormDocuments, setAssetFormDocuments] = useState([]);

  // File Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      // If it's an image, compress it on the client side!
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set maximum dimensions for the compressed image
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Export as JPEG with 0.7 quality (very high compression with good quality)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            // Estimate size in bytes
            const stringLength = compressedBase64.length - 'data:image/jpeg;base64,'.length;
            const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.562489633434383;

            // Generate clean name with .jpg extension
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

            const docObj = {
              name: cleanName,
              type: 'image/jpeg',
              size: Math.round(sizeInBytes),
              data: compressedBase64
            };
            setAssetFormDocuments(prev => [...prev, docObj]);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        // For non-images (like PDFs), keep the 800KB limit check
        if (file.size > 800 * 1024) {
          alert(`El archivo "${file.name}" supera el límite de 800KB. Por favor, sube un archivo más pequeño.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const docObj = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result // Base64 string
          };
          setAssetFormDocuments(prev => [...prev, docObj]);
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = "";
  };

  const handleRemoveDocument = (index) => {
    setAssetFormDocuments(prev => prev.filter((_, i) => i !== index));
  };

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
  const [debtFormFechaInicio, setDebtFormFechaInicio] = useState("");
  const [debtFormDetails, setDebtFormDetails] = useState("");
  const [debtFormContext, setDebtFormContext] = useState("empresa");

  // Auto-calculate Cuota Mensual when relevant values change
  useEffect(() => {
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

  // Auto-calculate Cuotas Pagadas and Next Due Date based on Fecha de Inicio
  useEffect(() => {
    if (debtModalMode !== "add" || !debtFormFechaInicio || debtFormTipo !== "fija") return;
    
    const startDate = new Date(debtFormFechaInicio + "T00:00:00");
    if (isNaN(startDate.getTime())) return;
    
    const today = new Date();
    
    // Calculate elapsed months
    let elapsedMonths = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
    
    // Clamp between 0 and totalCuotas
    const totalCuotas = Number(debtFormCuotasTotales || 12);
    if (elapsedMonths < 0) elapsedMonths = 0;
    if (elapsedMonths > totalCuotas) elapsedMonths = totalCuotas;
    
    setDebtFormCuotaActual(String(elapsedMonths));
    
    // Calculate next due date: startDate + elapsedMonths
    const nextDate = new Date(startDate);
    nextDate.setMonth(startDate.getMonth() + elapsedMonths);
    
    // Format nextDate as YYYY-MM-DD
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    setDebtFormFechaVencimiento(`${yyyy}-${mm}-${dd}`);
  }, [debtFormFechaInicio, debtFormTipo, debtFormCuotasTotales, debtModalMode]);

  // Asset CRUD Actions
  const openAddAsset = (catId) => {
    setActiveAssetCatId(catId);
    setAssetModalMode("add");
    setEditingAssetIndex(null);
    setAssetFormName("");
    setAssetFormValue("");
    setAssetFormContext(currentContext === 'personal' ? 'personal' : 'empresa');
    setAssetFormDocuments([]);
    setAssetModalOpen(true);
  };

  const openEditAsset = (catId, index, item) => {
    setActiveAssetCatId(catId);
    setAssetModalMode("edit");
    setEditingAssetIndex(index);
    const { name, documents } = parseAssetName(item.name);
    setAssetFormName(name);
    setAssetFormValue(item.value);
    setAssetFormDocuments(documents || []);
    setAssetModalOpen(true);
  };

  const handleAssetSubmit = (e) => {
    e.preventDefault();
    if (!assetFormName.trim() || !assetFormValue) return;

    const value = Math.round(Number(assetFormValue));
    const serializedName = assetFormName.trim() + (assetFormDocuments.length > 0 ? " ||| " + JSON.stringify(assetFormDocuments) : "");

    if (assetModalMode === "add") {
      addAsset(activeAssetCatId, serializedName, value, assetFormContext);
    } else {
      editAsset(activeAssetCatId, editingAssetIndex, serializedName, value);
    }
    setAssetModalOpen(false);
  };

  const handleAssetDelete = (catId, index, name) => {
    const { name: cleanName } = parseAssetName(name);
    if (window.confirm(`¿Estás seguro de que deseas eliminar el activo "${cleanName}"?`)) {
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

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
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

          {/* Info Box explaining Activos */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              background: 'var(--success-light)',
              color: 'var(--success)',
              borderRadius: '50%',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Info size={16} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                ¿Qué debes agregar en Activos?
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Los activos son todos los bienes, recursos o derechos de tu propiedad que tienen un valor económico. Por ejemplo: saldos en cuentas bancarias, efectivo, propiedades, vehículos, equipos tecnológicos (computadores, teléfonos), fondos de inversión, acciones o el inventario de tu negocio.
              </p>
            </div>
          </div>

          {assetsState.categories.map(category => {
            const isOpen = openCategories[category.id];
            
            // Clean suffix tags for display
            const getCleanName = (rawName) => {
              if (!rawName) return "";
              const { name } = parseAssetName(rawName);
              return name.replace(' [Personal]', '').replace(' [Empresa]', '');
            };

            const renderContextBadge = (rawName) => {
              if (!rawName) return null;
              const { name } = parseAssetName(rawName);
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
                    Empresa
                  </span>
                );
              }
              return null;
            };

            return (
              <div key={category.id} style={{ marginBottom: '16px' }}>
                <div 
                  className="accordion-header"
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '16px 20px',
                    borderRadius: isOpen ? '16px 16px 0 0' : '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
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
                        {category.items.map((item, idx) => {
                          const { documents } = parseAssetName(item.name);
                          return (
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
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div>
                                    {getCleanName(item.name)}
                                    {renderContextBadge(item.name)}
                                  </div>
                                  {documents && documents.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                      {documents.map((doc, docIdx) => (
                                        <span key={docIdx} style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          background: 'var(--accent-light)',
                                          color: 'var(--accent)',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          fontSize: '11px',
                                          fontWeight: 500
                                        }}>
                                          <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {doc.name}
                                          </span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleViewDocument(doc); }}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontWeight: 700, fontSize: '10px' }}
                                            title="Visualizar"
                                          >
                                            Ver
                                          </button>
                                          <span style={{ opacity: 0.5 }}>|</span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc); }}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontWeight: 700, fontSize: '10px' }}
                                            title="Descargar"
                                          >
                                            Bajar
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
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
                          );
                        })}
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '16px 0 0 0' }}>
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
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
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

              {/* Document Upload and Management */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Documentos / Anexos</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="asset-document-upload"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                />
                <label
                  htmlFor="asset-document-upload"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px dashed var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    fontWeight: 500
                  }}
                >
                  <Plus size={14} /> Subir Documentos (Máx. 800KB)
                </label>

                {assetFormDocuments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                    {assetFormDocuments.map((doc, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-primary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }} title={doc.name}>
                          {doc.name}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleViewDocument(doc)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '2px' }}
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '2px' }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                  placeholder="Ej: Crédito Hipotecario"
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

              {/* Debt Type Selector (Fija vs Pago Único) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tipo de Deuda</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="debt_type_activospasivos"
                      value="fija"
                      checked={debtFormTipo === "fija"}
                      onChange={() => setDebtFormTipo("fija")}
                    />
                    Amortizable en Cuotas
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="debt_type_activospasivos"
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

    </div>
  );
}
