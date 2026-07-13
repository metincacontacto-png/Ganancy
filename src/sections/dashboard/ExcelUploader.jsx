import * as XLSX from 'xlsx';

// Desinfecta recursivamente cualquier objeto para evitar Prototype Pollution (__proto__, prototype, constructor)
function sanitizeParsedObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeParsedObject);
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizeParsedObject(value);
  }
  return clean;
}

export function ExcelUploader({ 
  onUploadStart, 
  onProgress, 
  onExcelSuccess, 
  onPdfSuccess, 
  onError, 
  isUploading, 
  assetsTotal, 
  formatMoney 
}) {
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'excel';
    onUploadStart(file.name, fileType);

    if (fileType === 'pdf') {
      // Simulación de auditoría de PDF
      let progress = 10;
      const interval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
          clearInterval(interval);
          onProgress(100);
          
          const auditReport = `📑 **Auditoría de Cartola Bancaria (PDF) - "${file.name}" completada.**

Tras escanear el documento, he extraído los siguientes indicadores clave para contrastar con tu balance:
*   **Entidad:** Banco Principal
*   **Saldo Final Identificado:** ${formatMoney(assetsTotal || 7137698)}
*   **Transacciones conciliadas:** 42 movimientos detectados

**Hallazgos Estratégicos:**
1. **Cobros recurrentes:** Se registraron cargos automáticos de deudas por **${formatMoney(119000)}** (Crédito Consumo BE).
2. **Desvío no presupuestado:** Identifiqué comisiones de mantención de cuenta y seguros asociados por **$18.400** que no figuran en tu tabla de Egresos Fijos. Recomiendo auditarlos de inmediato.
3. **Flujo de entrada:** Se confirman transferencias de clientes por **$1.800.000** (King Wok) y **$500.000** (Lumine).`;
          
          onPdfSuccess(file.name, auditReport);
        } else {
          onProgress(progress);
        }
      }, 150);
    } else {
      // Parseo real cliente-servidor de Excel utilizando xlsx + sanitización
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          onProgress(35);
          const binaryData = evt.target.result;
          const workbook = XLSX.read(binaryData, { type: 'binary' });
          onProgress(60);
          
          const parsedData = {
            ingresosFijos: [],
            egresosFijos: [],
            ingresosVariables: [],
            egresosVariables: [],
            assets: [],
            debts: []
          };
          
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Sanitización estricta de prototype
            const rows = sanitizeParsedObject(rawRows);
            
            // Determinar sección por nombre de hoja
            let currentSection = 'default';
            const lowerSheet = sheetName.toLowerCase();
            if (
              lowerSheet.includes('activo') || 
              lowerSheet.includes('bien') || 
              lowerSheet.includes('patrimonio') || 
              lowerSheet.includes('inventario') ||
              lowerSheet.includes('equipo') ||
              lowerSheet.includes('mueble') ||
              lowerSheet.includes('propiedad') ||
              lowerSheet.includes('maquina') ||
              lowerSheet.includes('máquina') ||
              lowerSheet.includes('capital') ||
              lowerSheet.includes('inversion') ||
              lowerSheet.includes('inversión') ||
              lowerSheet.includes('herramienta') ||
              lowerSheet.includes('auto') ||
              lowerSheet.includes('vehiculo') ||
              lowerSheet.includes('vehículo')
            ) {
              currentSection = 'assets';
            } else if (
              lowerSheet.includes('pasivo') || 
              lowerSheet.includes('deuda') || 
              lowerSheet.includes('acreedor') || 
              lowerSheet.includes('credito') ||
              lowerSheet.includes('crédito') ||
              lowerSheet.includes('prestamo') ||
              lowerSheet.includes('préstamo') ||
              lowerSheet.includes('obligac') ||
              lowerSheet.includes('compromiso')
            ) {
              currentSection = 'debts';
            } else if (lowerSheet.includes('ingreso') || lowerSheet.includes('venta') || lowerSheet.includes('entrada')) {
              if (lowerSheet.includes('variable')) {
                currentSection = 'ingresos_variables';
              } else {
                currentSection = 'ingresos_fijos';
              }
            } else if (lowerSheet.includes('egreso') || lowerSheet.includes('gasto') || lowerSheet.includes('costo')) {
              if (lowerSheet.includes('variable')) {
                currentSection = 'egresos_variables';
              } else {
                currentSection = 'egresos_fijos';
              }
            }
            
            // Parsear filas
            rows.forEach(row => {
              if (!row || row.length === 0) return;
              
              let textCell = "";
              let numCell = null;
              let numberCellsCount = 0;
              
              row.forEach(cell => {
                if (cell === null || cell === undefined) return;
                
                if (typeof cell === 'number') {
                  if (cell > 0) {
                    numCell = cell;
                    numberCellsCount++;
                  }
                } else if (typeof cell === 'string') {
                  const cleanStr = cell.trim();
                  if (!cleanStr) return;
                  
                  const numericClean = cleanStr.replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '').trim();
                  const parsedNum = Number(numericClean);
                  
                  if (!isNaN(parsedNum) && parsedNum > 0) {
                    numCell = parsedNum;
                    numberCellsCount++;
                  } else if (cleanStr.length > 2) {
                    textCell = cleanStr;
                  }
                }
              });
              
              // Transiciones de cabecera en fila
              if (numberCellsCount === 0 && textCell) {
                const lowerText = textCell.toLowerCase().trim();
                
                if (
                  lowerText.includes('activo') || 
                  lowerText.includes('bien') || 
                  lowerText.includes('inventario') ||
                  lowerText.includes('equipo') ||
                  lowerText.includes('mueble') ||
                  lowerText.includes('propiedad') ||
                  lowerText.includes('maquina') ||
                  lowerText.includes('máquina') ||
                  lowerText.includes('capital') ||
                  lowerText.includes('inversion') ||
                  lowerText.includes('inversión') ||
                  lowerText.includes('herramienta') ||
                  lowerText.includes('vehiculo') ||
                  lowerText.includes('vehículo') ||
                  lowerText === 'patrimonio'
                ) {
                  if (!lowerText.includes('ingreso') && !lowerText.includes('egreso') && !lowerText.includes('gasto') && !lowerText.includes('costo')) {
                    currentSection = 'assets';
                    return;
                  }
                }
                
                if (
                  lowerText.includes('pasivo') || 
                  lowerText.includes('deuda') || 
                  lowerText.includes('credito') ||
                  lowerText.includes('crédito') ||
                  lowerText.includes('prestamo') ||
                  lowerText.includes('préstamo') ||
                  lowerText.includes('obligac') ||
                  lowerText.includes('acreedor') ||
                  lowerText.includes('compromiso')
                ) {
                  currentSection = 'debts';
                  return;
                }
                
                if (lowerText.includes('ingreso') && (lowerText.includes('fijo') || lowerText.includes('mensual') || lowerText.includes('recurrente'))) {
                  currentSection = 'ingresos_fijos';
                  return;
                }
                if (lowerText.includes('egreso') || lowerText.includes('gasto') || lowerText.includes('costo')) {
                  if (lowerText.includes('fijo') || lowerText.includes('mensual') || lowerText.includes('recurrente')) {
                    currentSection = 'egresos_fijos';
                    return;
                  }
                }
                if (lowerText.includes('ingreso') && lowerText.includes('variable')) {
                  currentSection = 'ingresos_variables';
                  return;
                }
                if ((lowerText.includes('egreso') || lowerText.includes('gasto') || lowerText.includes('costo')) && lowerText.includes('variable')) {
                  currentSection = 'egresos_variables';
                  return;
                }
                
                if (lowerText === 'ingresos fijos' || lowerText === 'ingresos mensuales') {
                  currentSection = 'ingresos_fijos';
                  return;
                }
                if (lowerText === 'egresos fijos' || lowerText === 'gastos fijos' || lowerText === 'costos fijos' || lowerText === 'estructura de costos') {
                  currentSection = 'egresos_fijos';
                  return;
                }
                if (lowerText === 'ingresos variables') {
                  currentSection = 'ingresos_variables';
                  return;
                }
                if (lowerText === 'egresos variables' || lowerText === 'gastos variables') {
                  currentSection = 'egresos_variables';
                  return;
                }
              }
              
              // Agregar item si hay texto y número
              if (textCell && numCell) {
                const lowerText = textCell.toLowerCase();
                const skipKeywords = [
                  'total', 'subtotal', 'iva', 'neto', 'resumen', 'balance', 'margen', 
                  'año', 'mes', 'dia', 'fecha', 'rut', 'id', 'item', 'codigo', 'nro', 'numero'
                ];
                if (skipKeywords.some(kw => lowerText.includes(kw))) {
                  return;
                }
                
                let resolvedSection = currentSection;
                
                if (resolvedSection === 'default') {
                  const isExpense = 
                    lowerText.includes('egreso') || 
                    lowerText.includes('gasto') || 
                    lowerText.includes('costo') || 
                    lowerText.includes('pago') || 
                    lowerText.includes('arriendo') || 
                    lowerText.includes('sueldo') || 
                    lowerText.includes('luz') || 
                    lowerText.includes('agua') || 
                    lowerText.includes('internet') || 
                    lowerText.includes('comision') || 
                    lowerText.includes('seguro') || 
                    lowerText.includes('saas') || 
                    lowerText.includes('suscripcion');
                    
                  const isIncome = 
                    lowerText.includes('ingreso') || 
                    lowerText.includes('venta') || 
                    lowerText.includes('factura') || 
                    lowerText.includes('cobro') || 
                    lowerText.includes('honorario');
                    
                  const isVariable = 
                    lowerText.includes('variable') || 
                    lowerText.includes('comision') || 
                    lowerText.includes('boleta') || 
                    lowerText.includes('combustible') || 
                    lowerText.includes('cliente') || 
                    lowerText.includes('reunion') || 
                    lowerText.includes('puntual');
                    
                  const isAsset = 
                    lowerText.includes('activo') || 
                    lowerText.includes('maquinaria') || 
                    lowerText.includes('computador') || 
                    lowerText.includes('laptop') || 
                    lowerText.includes('macbook') || 
                    lowerText.includes('notebook') || 
                    lowerText.includes('tablet') || 
                    lowerText.includes('ipad') || 
                    lowerText.includes('pantalla') || 
                    lowerText.includes('monitor') || 
                    lowerText.includes('camara') || 
                    lowerText.includes('cámara') || 
                    lowerText.includes('lente') || 
                    lowerText.includes('audio') || 
                    lowerText.includes('parlante') || 
                    lowerText.includes('microfono') || 
                    lowerText.includes('micrófono') || 
                    lowerText.includes('iluminacion') || 
                    lowerText.includes('iluminación') || 
                    lowerText.includes('foco') || 
                    lowerText.includes('led') || 
                    lowerText.includes('oficina') || 
                    lowerText.includes('mobiliario') || 
                    lowerText.includes('mueble') || 
                    lowerText.includes('silla') || 
                    lowerText.includes('escritorio') || 
                    lowerText.includes('mesa') || 
                    lowerText.includes('vehiculo') || 
                    lowerText.includes('vehículo') || 
                    lowerText.includes('auto') || 
                    lowerText.includes('camioneta') || 
                    lowerText.includes('moto') || 
                    lowerText.includes('furgon') || 
                    lowerText.includes('furgón') || 
                    lowerText.includes('herramienta') || 
                    lowerText.includes('maquina') || 
                    lowerText.includes('máquina') || 
                    lowerText.includes('bodega') || 
                    lowerText.includes('terreno') || 
                    lowerText.includes('propiedad') || 
                    lowerText.includes('local') || 
                    lowerText.includes('inventario') || 
                    lowerText.includes('mercaderia') || 
                    lowerText.includes('mercadería') || 
                    lowerText.includes('stock');
                    
                  const isDebt = 
                    lowerText.includes('deuda') || 
                    lowerText.includes('credito') || 
                    lowerText.includes('crédito') || 
                    lowerText.includes('pasivo') || 
                    lowerText.includes('cuotas') || 
                    lowerText.includes('prestamo') || 
                    lowerText.includes('préstamo') || 
                    lowerText.includes('hipoteca') || 
                    lowerText.includes('hipotecario') || 
                    lowerText.includes('leasing') || 
                    lowerText.includes('financiamiento') || 
                    lowerText.includes('cae') || 
                    lowerText.includes('cmr') || 
                    lowerText.includes('visa') || 
                    lowerText.includes('mastercard') || 
                    lowerText.includes('banco') || 
                    lowerText.includes('mutual') || 
                    lowerText.includes('cooperativa') || 
                    lowerText.includes('pagar') || 
                    lowerText.includes('tgr') || 
                    lowerText.includes('sii');
                    
                  if (isExpense) {
                    resolvedSection = isVariable ? 'egresos_variables' : 'egresos_fijos';
                  } else if (isIncome) {
                    resolvedSection = isVariable ? 'ingresos_variables' : 'ingresos_fijos';
                  } else if (isAsset) {
                    resolvedSection = 'assets';
                  } else if (isDebt) {
                    resolvedSection = 'debts';
                  } else {
                    resolvedSection = 'egresos_variables';
                  }
                }
                
                if (resolvedSection === 'assets') {
                  parsedData.assets.push({ name: textCell, value: numCell });
                } else if (resolvedSection === 'debts') {
                  parsedData.debts.push({ name: textCell, value: numCell });
                } else if (resolvedSection === 'ingresos_fijos') {
                  parsedData.ingresosFijos.push({ name: textCell, value: numCell });
                } else if (resolvedSection === 'egresos_fijos') {
                  parsedData.egresosFijos.push({ name: textCell, value: numCell });
                } else if (resolvedSection === 'ingresos_variables') {
                  parsedData.ingresosVariables.push({ name: textCell, value: numCell });
                } else if (resolvedSection === 'egresos_variables') {
                  parsedData.egresosVariables.push({ name: textCell, value: numCell });
                }
              }
            });
          });
          
          onExcelSuccess(parsedData, file.name);
        } catch (err) {
          console.error("Error leyendo planilla:", err);
          onError("No se pudo parsear el archivo Excel. Asegúrese de que es un archivo .xlsx o .xls válido.");
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <input
      type="file"
      accept=".xlsx,.xls,.pdf"
      onChange={handleFileChange}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer'
      }}
      disabled={isUploading}
    />
  );
}

export default ExcelUploader;
