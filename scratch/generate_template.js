import * as XLSX from 'xlsx';
import * as fs from 'fs';

console.log("Generando plantilla de Excel Ganancy...");

const wb = XLSX.utils.book_new();

// Hoja 1: Activos
const ws_activos = XLSX.utils.aoa_to_sheet([
  ["Categoría: Activos", ""],
  ["Detalle del Activo / Bien", "Valor (CLP)"],
  ["Notebook Lenovo ThinkPad", 850000],
  ["Cámara Sony Alpha 7 IV", 2100000],
  ["Escritorio Ergonómico de Madera", 250000],
  ["Foco LED Aputure 120D", 680000],
  ["Vehículo Utilitario de Despacho", 12000000]
]);
XLSX.utils.book_append_sheet(wb, ws_activos, "Activos");

// Hoja 2: Deudas
const ws_deudas = XLSX.utils.aoa_to_sheet([
  ["Categoría: Deudas / Pasivos", ""],
  ["Detalle de la Deuda / Acreedor", "Monto Total Pendiente (CLP)"],
  ["Crédito de Consumo Banco BCI", 5400000],
  ["Deuda Proveedor de Insumos Nathy", 1200000],
  ["Préstamo de Capital de Trabajo", 3500000]
]);
XLSX.utils.book_append_sheet(wb, ws_deudas, "Deudas");

// Hoja 3: Flujos Mensuales (Fijos y Variables)
const ws_flujos = XLSX.utils.aoa_to_sheet([
  ["Detalle del Flujo Financiero", "Monto Mensual (CLP)"],
  ["", ""],
  ["INGRESOS FIJOS", ""],
  ["Sueldo Mensual Principal", 1800000],
  ["Servicios de Consultoría Fija", 650000],
  ["", ""],
  ["EGRESOS FIJOS", ""],
  ["Arriendo Oficina Comercial", 550000],
  ["Suscripción SaaS Contable", 35000],
  ["Pago Luz y Agua Promedio", 60000],
  ["Internet Fibra Óptica", 28000],
  ["", ""],
  ["INGRESOS VARIABLES", ""],
  ["Desarrollo Web Proyecto Cliente A", 900000],
  ["Comisión por Venta de Equipos", 150000],
  ["", ""],
  ["EGRESOS VARIABLES", ""],
  ["Servicio Técnico de Computadores", 120000],
  ["Combustible Vehículo de Despacho", 180000],
  ["Almuerzo y Varios Oficina", 95000]
]);
XLSX.utils.book_append_sheet(wb, ws_flujos, "Flujos");

// Guardar
XLSX.writeFile(wb, "public/ganancy_plantilla_modelo.xlsx");

console.log("Plantilla generada con éxito en public/ganancy_plantilla_modelo.xlsx");
