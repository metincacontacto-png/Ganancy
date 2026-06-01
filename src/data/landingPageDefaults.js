// Default Template Data for GANANCY Landing Page
export const LANDING_PAGE_DEFAULTS = {
  hero: {
    badge: "Nueva Tecnología de Aislamiento Fiscal SII",
    title: "Ganancy Organiza y controla tus finanzas.",
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
      id: "plan_personal",
      name: "Plan Personal",
      price: 3990,
      originalPrice: 7990,
      period: "mes",
      iconName: "User",
      color: "#38bdf8",
      desc: "Ideal para ordenar tu presupuesto familiar y deudas individuales de forma sencilla y 100% privada.",
      features: [
        "Control de ingresos y egresos personales",
        "Gestión de deudas y cuotas individuales",
        "Bloqueo absoluto de vistas de Negocio",
        "🚫 Sin escáner IA de boletas ni almacenamiento",
        "🚫 Sin inventario de Activos Productivos",
        "1 cuenta de usuario / Soporte por email"
      ],
      popular: false,
      tag: "Finanzas Personales"
    },
    {
      id: "plan_completo",
      name: "Plan Completo (Empresa + Personal)",
      price: 9990,
      originalPrice: 24990,
      period: "mes",
      iconName: "Briefcase",
      color: "#fb7185",
      desc: "La solución total para separar de verdad tu vida de tu negocio. Controla tu caja, IA y auditoría tributaria en vivo.",
      features: [
        "Separación Contable 1-Click (Vistas Negocio/Personal)",
        "Vista Consolidada Unificada en Tiempo Real",
        "📷 Escáner Inteligente OCR de boletas y facturas",
        "📦 Visor Tributario y almacenamiento para el SII",
        "🛠️ Gestor de Activos y Categorías con drag-and-drop",
        "🤖 Asesor Contable y CFO Inteligente IA de Élite completo",
        "Simulador de punto de equilibrio y márgenes"
      ],
      popular: true,
      tag: "Más Recomendado"
    },
    {
      id: "plan_custom",
      name: "Plan Corporativo (A Medida)",
      price: null,
      originalPrice: null,
      period: "a medida",
      iconName: "Cpu",
      color: "#a78bfa",
      desc: "Solución a medida para empresas que buscan automatización total, múltiples roles y reportabilidad premium.",
      features: [
        "Todo lo del Plan Completo",
        "🔌 Conectores API automáticos con bancos y SII",
        "👥 Cuentas multi-usuario (Administrador, Contador)",
        "👔 Consultoría CFO directa de nuestro equipo financiero",
        "📞 Canal de soporte prioritario VIP 24/7"
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
