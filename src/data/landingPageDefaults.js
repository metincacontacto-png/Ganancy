// Default Template Data for GANANCY Landing Page
export const LANDING_PAGE_DEFAULTS = {
  hero: {
    badge: "Nueva Tecnología de Aislamiento Fiscal SII",
    title: "Detén la mezcla de dinero que frena el crecimiento de tu negocio",
    desc: "Separar de forma estricta tus finanzas personales de las de tu empresa es vital para evitar multas del SII. GANANCY (un producto de GANIMIDES) te entrega control absoluto: aísla tus cuentas contables a un click, procesa boletas con IA y planifica con un CFO virtual de élite.",
    ctaPrimary: "Probar Demo Gratis",
    ctaSecondary: "Ver Planes",
    imageUrl: "/ganancy_concept.png"
  },
  featuresHeader: {
    title: "Una estructura financiera diseñada para crecer",
    subtitle: "Evita el desorden tributario y la mezcla de gastos del fundador con los del negocio"
  },
  features: [
    {
      id: "feat_1",
      title: "Aislamiento Contable 1-Click",
      desc: "Alterna instantáneamente entre tus finanzas personales y las de la empresa. Ideal para mantener contabilidades completamente independientes.",
      iconName: "Layers"
    },
    {
      id: "feat_2",
      title: "Escáner IA de Boletas y Facturas",
      desc: "Sube tus tickets de gastos y deja que nuestra IA extraiga el RUT, el emisor, los montos y el desglose de IVA (19%) en segundos.",
      iconName: "Sparkles"
    },
    {
      id: "feat_3",
      title: "Respaldo Tributario SII",
      desc: "Almacena digitalmente cada boleta física linkeada al gasto. Visualiza tus documentos en un visor a pantalla completa para auditorías del SII.",
      iconName: "ShieldCheck"
    },
    {
      id: "feat_4",
      title: "Planificación CFO IA de Élite",
      desc: "Chatea con un consultor financiero inteligente que analiza tu balance, deudas y calcula puntos de equilibrio y escenarios con total precisión.",
      iconName: "LineChart"
    }
  ],
  pricingHeader: {
    title: "Planes de Suscripción Flexibles",
    subtitle: "Desde finanzas personales básicas hasta soluciones corporativas hechas a medida"
  },
  plans: [
    {
      id: "plan_persona",
      name: "Plan Persona",
      price: 3990,
      period: "mes",
      iconName: "User",
      color: "#38bdf8",
      desc: "Ideal para individuos y profesionales independientes que buscan ordenar su presupuesto familiar.",
      features: [
        "Control de gastos e ingresos personales",
        "Recordatorios de vencimiento simples",
        "Dashboard con gráficos de presupuesto",
        "Soporte por correo electrónico",
        "1 cuenta de usuario"
      ],
      popular: false,
      tag: "Finanzas Personales"
    },
    {
      id: "plan_emprendedor",
      name: "Plan Emprendedor",
      price: 9990,
      period: "mes",
      iconName: "TrendingUp",
      color: "#fb7185",
      desc: "Perfecto para freelancers y fundadores iniciales que manejan su caja de forma consolidada.",
      features: [
        "Vista Consolidada (Todo en Uno)",
        "Seguimiento de Activos y Deudas básico",
        "Planificador financiero e IA CFO simple",
        "Recordatorios automatizados en la nube",
        "Dashboard interactivo unificado"
      ],
      popular: false,
      tag: "Consolidado"
    },
    {
      id: "plan_micro",
      name: "Plan Micro Empresa",
      price: 24990,
      period: "mes",
      iconName: "Briefcase",
      color: "#fbbf24",
      desc: "Diseñado para pequeños negocios que necesitan separar obligatoriamente sus cuentas personales.",
      features: [
        "Aislamiento Contable Absoluto (1-Click)",
        "Escáner Inteligente de Boletas (IA)",
        "Visor Tributario de Respaldo para el SII",
        "Consolidador contable mensual",
        "Reportabilidad automatizada"
      ],
      popular: true,
      tag: "Más Recomendado"
    },
    {
      id: "plan_mediana",
      name: "Plan Mediana Empresa",
      price: 49900,
      period: "mes",
      iconName: "LineChart",
      color: "#10b981",
      desc: "Para empresas consolidadas que requieren proyecciones avanzadas y CFO de élite con IA.",
      features: [
        "Todo lo del Plan Micro Empresa",
        "Asesor Financiero CFO IA de Élite completo",
        "Simulador de puntos de equilibrio y márgenes",
        "Proyecciones de flujo de caja automatizadas",
        "Visor y exportación masiva para SII"
      ],
      popular: false,
      tag: "CFO Estratégico"
    },
    {
      id: "plan_gran_empresa",
      name: "Gran Empresa",
      price: null,
      period: "a medida",
      iconName: "Cpu",
      color: "#a78bfa",
      desc: "Solución hecha a medida para corporativos que buscan integración total y reportabilidad premium.",
      features: [
        "Conectores API personalizados",
        "Modelación financiera CFO a medida",
        "Múltiples cuentas y roles de usuario",
        "Ejecutivo de cuentas dedicado 24/7",
        "Acuerdo de nivel de servicio (SLA) garantizado"
      ],
      popular: false,
      tag: "Enterprise"
    }
  ],
  faqsHeader: {
    title: "Preguntas Frecuentes",
    subtitle: "Entiende por qué separar tus finanzas es vital para la salud tributaria de tu empresa"
  },
  faqs: [
    {
      q: "¿Por qué es peligroso mezclar finanzas personales con las de la empresa en Chile?",
      a: "Mezclar cuentas (ej: pagar la mercadería del negocio con tu cuenta personal, o comprar el supermercado de tu casa a nombre de la empresa) es catalogado como 'retiro encubierto' o 'gasto rechazado' por el SII. Esto puede generar multas severas, rechazo de créditos de IVA y serios dolores de cabeza durante una fiscalización."
    },
    {
      q: "¿Cómo funciona el Aislamiento Contable en 1-Click?",
      a: "Nuestra plataforma te permite ingresar tus transacciones y etiquetarlas al instante como 'Negocio' o 'Personal'. Con el selector superior de contexto, puedes aislar por completo tus balances de empresa para presentárselos a tu contador o al SII, o bien activar la 'Vista Consolidada'."
    },
    {
      q: "¿El Escáner IA y Visor SII cumplen con la normativa fiscal?",
      a: "Sí. Cada boleta o factura que subes al Escáner es analizada por nuestra IA para extraer montos, RUT y desglose de IVA de forma automática. Luego, el archivo físico queda respaldado y linkeado en el visor tributario en la nube para demostrar que los gastos están debidamente justificados ante el SII."
    },
    {
      q: "¿Cómo puedo cambiar de plan de suscripción en el futuro?",
      a: "Puedes subir de categoría, bajar de plan o cancelar tu suscripción en cualquier momento y de forma inmediata desde la pestaña 'Mi Suscripción' en tu panel de control, sin contratos forzosos ni cargos ocultos."
    }
  ],
  footer: {
    brandText: "GANANCY es un producto de GANIMIDES — El software de control de caja y auditoría contable definitivo para PYMEs chilenas.",
    copyright: "© 2026 GANIMIDES. Todos los derechos reservados. Cumple con la normativa tributaria del Servicio de Impuestos Internos (SII)."
  }
};
