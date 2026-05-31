// Financial Data for GANANCY (Ganimides)

export const ACTIVOS_DATA = {
  total: 7137698,
  categories: [
    {
      id: "equipos",
      name: "Equipos tecnológicos",
      total: 5583017,
      items: [
        { name: "MacBook Pro M1", value: 2500000 },
        { name: "iPhone 14 Pro", value: 900000 },
        { name: "iPhone 16 Pro", value: 1200000 },
        { name: "TV Samsung 50\"", value: 250000 },
        { name: "LG Monitor", value: 250000 },
        { name: "Ploter", value: 250000 },
        { name: "Impresora EPSON", value: 170000 },
        { name: "Tarjeta memoria", value: 63017 }
      ]
    },
    {
      id: "audiovisual",
      name: "Audiovisual",
      total: 613000,
      items: [
        { name: "Monitores audio", value: 300000 },
        { name: "Interface sonido", value: 150000 },
        { name: "Micrófono", value: 73000 },
        { name: "Ginbald", value: 90000 }
      ]
    },
    {
      id: "iluminacion",
      name: "Iluminación",
      total: 280000,
      items: [
        { name: "Caja de luz", value: 63000 },
        { name: "Porta fondos", value: 50000 },
        { name: "Croma", value: 25000 },
        { name: "Base giratoria", value: 20000 },
        { name: "Sopaypilla reflectante", value: 12000 },
        { name: "Difusor de luz x2", value: 110000 }
      ]
    },
    {
      id: "muebles",
      name: "Muebles",
      total: 300000,
      items: [
        { name: "Escritorios de madera", value: 300000 }
      ]
    },
    {
      id: "otros",
      name: "Otros",
      total: 361681,
      items: [
        { name: "Plancha de estampado", value: 250000 },
        { name: "Mochila Tenba", value: 111681 }
      ]
    }
  ]
};

export const PASIVOS_DATA = [
  {
    id: "credito_be",
    name: "Crédito consumo BE",
    total: 5234023,
    cuotaActual: 22,
    cuotasTotales: 66,
    montoMensual: 119000,
    prepago: 4324899,
    completed: false,
    details: "Crédito de consumo en Banco Estado. Cuota mensual de $119.000."
  },
  {
    id: "isapre_gesmed",
    name: "Isapre Gesmed",
    total: 3282502,
    cuotaActual: 8,
    cuotasTotales: 8,
    montoMensual: 410313,
    prepago: 0,
    completed: true,
    details: "Deuda saldada en 8 cheques de $410.313. Estado: Completado."
  },
  {
    id: "tgr_iva",
    name: "TGR IVA postergado",
    total: 3781735,
    cuotaActual: 3,
    cuotasTotales: 18,
    montoMensual: 222455,
    prepago: 0,
    completed: false,
    details: "Impuesto al valor agregado postergado con Tesorería General de la República. Cuotas hasta marzo 2027."
  },
  {
    id: "deuda_felipe",
    name: "Deuda cotizaciones (Cheques Felipe)",
    total: 2500000,
    cuotaActual: 5,
    cuotasTotales: 25,
    montoMensual: 100000,
    prepago: 0,
    completed: false,
    details: "Deuda de cotizaciones previsionales en 25 cuotas mensuales mediante cheques."
  },
  {
    id: "credito_los_andes",
    name: "Crédito Caja Los Andes",
    total: 2160000,
    cuotaActual: 16,
    cuotasTotales: 16,
    montoMensual: 0, // Completado
    prepago: 1606614,
    completed: true,
    details: "Crédito social Caja Los Andes. Estado: Completado."
  },
  {
    id: "tdc_chile",
    name: "TDC Banco de Chile",
    total: 1243000,
    cuotaActual: 13,
    cuotasTotales: 36,
    montoMensual: 58000,
    prepago: 0,
    completed: false,
    details: "Deuda tarjeta de crédito Banco de Chile. Cuota mensual de $58.000."
  },
  {
    id: "iphone16",
    name: "Financiamiento iPhone 16",
    total: 723000,
    cuotaActual: 6,
    cuotasTotales: 18,
    montoMensual: 74741,
    prepago: 0,
    completed: false,
    details: "Financiamiento de equipo telefónico. Cuotas terminan en octubre de 2026."
  },
  {
    id: "tdc_fanny",
    name: "TDC Fanny (Nevera + Isapre)",
    total: 522048,
    cuotaActual: 0, // No se especifican cuotas exactas, pero sí monto mensual
    cuotasTotales: 10, // Estimado (~522048 / 53635)
    montoMensual: 53635,
    prepago: 0,
    completed: false,
    details: "Deuda tarjeta Fanny. Cubre compra de refrigerador y pago de previsión."
  },
  {
    id: "deuda_pato",
    name: "Deuda Pato",
    total: 625000,
    cuotaActual: 0,
    cuotasTotales: 1, // Pago único pendiente
    montoMensual: 0, // Pendiente sin cuotas fijas
    prepago: 0,
    completed: false,
    details: "Deuda pendiente de pago a Patricio."
  },
  {
    id: "tgr_nathy",
    name: "TGR Nathy F22",
    total: 270234,
    cuotaActual: 0,
    cuotasTotales: 1, // Pago único pendiente
    montoMensual: 0, // Pendiente de pago único
    prepago: 0,
    completed: false,
    details: "Deuda del Formulario 22 (Operación Renta) de Nathalia con la TGR."
  }
];

export const INGRESOS_FIJOS = [
  { id: "fee_lumine", name: "Fee RRSS Lumine (Chile + Costa Rica)", value: 1000000 },
  { id: "fee_king_wok", name: "Fee RRSS King Wok", value: 1800000 },
  { id: "sueldo_nathy", name: "Sueldo Nathy (Equalitas)", value: 840000 },
  { id: "faes", name: "FAES", value: 150000 }
];

export const EGRESOS_FIJOS = [
  { id: "sueldos_giovanni_nathy", name: "Sueldos Giovanni + Nathalia", value: 1800654 },
  { id: "cuotas_deudas", name: "Cuotas deudas (créditos + isapre + TDC)", value: 865447 },
  { id: "arriendo", name: "Arriendo", value: 630000 },
  { id: "gastos_comunes", name: "Gastos comunes", value: 200000 },
  { id: "servicios", name: "Servicios (Luz, Agua, Gas)", value: 100000 },
  { id: "internet_bs", name: "Internet + BS", value: 52000 },
  { id: "iphone_cuota", name: "iPhone cuota", value: 74741 },
  { id: "adobe", name: "Adobe Creative Cloud", value: 39000 },
  { id: "notion", name: "Notion Premium", value: 23018 },
  { id: "chatgpt", name: "ChatGPT Plus", value: 20000 },
  { id: "freepik", name: "Freepik", value: 18467 },
  { id: "gamma", name: "Gamma App", value: 9550 },
  { id: "capcut", name: "Capcut Pro", value: 8000 },
  { id: "canva", name: "Canva Pro", value: 7900 },
  { id: "bencina", name: "Bencina / Combustible", value: 50000 }
];

export const HISTORICAL_FLOWS = [
  { month: "Oct 2025", q: "Q4 2025", ingresos: 6130000, egresos: 3872020, balance: 2257980 },
  { month: "Nov 2025", q: "Q4 2025", ingresos: 8683628, egresos: 3125596, balance: 5558032 },
  { month: "Dic 2025", q: "Q4 2025", ingresos: 6815349, egresos: 8562971, balance: -1747622 },
  { month: "Ene 2026", q: "Q1 2026", ingresos: 4590000, egresos: 4267888, balance: 322112 },
  { month: "Feb 2026", q: "Q1 2026", ingresos: 1070000, egresos: 4101403, balance: -3031403 },
  { month: "Mar 2026", q: "Q1 2026", ingresos: 0, egresos: 3520143, balance: -3520143 },
  { month: "Abr 2026", q: "Q2 2026", ingresos: 4530000, egresos: 4565384, balance: -35384 },
  { month: "May 2026", q: "Q2 2026", ingresos: 2840000, egresos: 5267924, balance: -2427924 },
  { month: "Jun 2026", q: "Q2 2026", ingresos: 0, egresos: 2797681, balance: -2797681 }
];

export const MONTH_DETAILS = {
  "Abr 2026": {
    ingresos: [
      { name: "King Wok/Tsugumi", value: 800000, paid: true },
      { name: "Motoemotion", value: 400000, paid: true },
      { name: "Sueldo Nathy", value: 840000, paid: true },
      { name: "Lumine", value: 500000, paid: false },
      { name: "Pancho Papas", value: 350000, paid: false },
      { name: "ICENIT", value: 490000, paid: false },
      { name: "Licencia", value: 1000000, paid: false },
      { name: "Juzgado", value: 150000, paid: false }
    ],
    egresos: [
      { name: "Arriendo", value: 639000, paid: true },
      { name: "Cheque ISAPRE", value: 410313, paid: true },
      { name: "Créditos TDC Nathy", value: 519036, paid: true },
      { name: "Entel iPhone", value: 125000, paid: true },
      { name: "Contadora", value: 50000, paid: true },
      { name: "TDC Fanny", value: 24512, paid: true },
      { name: "Comida/Varios", value: 500000, paid: true },
      { name: "Vacuna Isabella", value: 121000, paid: true },
      { name: "Manutención Pascuala", value: 340000, paid: false },
      { name: "IVA TGR", value: 222455, paid: false },
      { name: "Gastos comunes", value: 312756, paid: false },
      { name: "Pañales/Niñera", value: 140000, paid: false },
      { name: "Adobe", value: 32378, paid: false },
      { name: "Servicios", value: 73630, paid: false }
    ]
  }
};

export const formatCLP = (value) => {
  return '$' + Math.round(value).toLocaleString('es-CL');
};

