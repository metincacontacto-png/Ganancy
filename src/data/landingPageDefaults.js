// Default Template Data for GANANCY Landing Page
export const LANDING_PAGE_DEFAULTS = {
  hero: {
    badge: "Dashboard Financiero · Negocio + Personal",
    title: "Tu dinero, finalmente bajo control con Ganancy",
    desc: "Ganancy es la plataforma que te permite ver, entender y decidir sobre tus finanzas — personales y de tu negocio — en un solo lugar, sin hojas de cálculo ni desorden.",
    ctaPrimary: "Probar Demo Gratis",
    ctaSecondary: "Ver Planes",
    imageUrl: "/ganancy_concept.png"
  },
  featuresHeader: {
    title: "Todo lo que necesitas para tomar mejores decisiones",
    subtitle: "Desde registrar una boleta hasta proyectar tu flujo, Ganancy lo hace simple."
  },
  features: [
    {
      id: "feat_1",
      title: "Dashboard en tiempo real",
      desc: "Ve tus activos, pasivos, ingresos y egresos actualizados en un solo panel.",
      iconName: "LayoutDashboard"
    },
    {
      id: "feat_2",
      title: "Escáner IA de boletas",
      desc: "Sube una foto de tu boleta o factura y la IA la registra automáticamente.",
      iconName: "ScanLine"
    },
    {
      id: "feat_3",
      title: "Flujo mensual y proyecciones",
      desc: "Anticipa cuánto tendrás disponible el próximo mes antes de gastar.",
      iconName: "TrendingUp"
    },
    {
      id: "feat_4",
      title: "Importa tus Excel y PDF",
      desc: "Sube tus estados financieros o cartola bancaria y Ganancy los procesa.",
      iconName: "FileSpreadsheet"
    },
    {
      id: "feat_5",
      title: "Control de deudas",
      desc: "Registra cuotas, tasas e instituciones. Sabe exactamente cuánto debes y a quién.",
      iconName: "CreditCard"
    },
    {
      id: "feat_6",
      title: "Negocio y personal separados",
      desc: "Mantén tus finanzas laborales y personales en vistas distintas pero conectadas.",
      iconName: "Layers"
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
      price: 7,
      originalPrice: 14,
      period: "mes",
      iconName: "User",
      color: "#0071e3",
      desc: "Controla tus gastos, ingresos y deudas personales con IA. Ideal si todavía no necesitas separar tu negocio.",
      features: [
        "Dashboard financiero personal en tiempo real",
        "Escáner IA de boletas y facturas",
        "Flujo mensual y proyecciones de gasto",
        "Control de deudas y tarjetas",
        "Asesor IA básico de finanzas personales"
      ]
    },
    {
      id: "plan_completo",
      name: "Plan Completo (Empresa + Personal)",
      price: 10,
      originalPrice: 25,
      period: "mes",
      iconName: "Briefcase",
      color: "#0a84ff",
      desc: "La solución total para separar de verdad tu vida de tu negocio. Controla tu caja, IA y auditoría tributaria en vivo.",
      features: [
        "Separación Contable 1-Click (Vistas Negocio/Personal)",
        "Vista Consolidada Unificada en Tiempo Real",
        "Escáner Inteligente OCR de boletas y facturas",
        "Visor Tributario y almacenamiento para el SII",
        "Gestor de Activos y Categorías con drag-and-drop",
        "Asesor Contable y CFO Inteligente IA de Élite completo",
        "Simulador de punto de equilibrio y márgenes"
      ],
      popular: true,
      tag: "Más Recomendado"
    },
    {
      id: "plan_familiar",
      name: "Plan Familiar (Multi-Perfil)",
      price: 15,
      originalPrice: 30,
      period: "mes",
      iconName: "Users",
      color: "#ff9500",
      desc: "Administra las finanzas de tu hogar de forma colaborativa. Crea perfiles independientes para cada miembro y visualiza el presupuesto familiar consolidado.",
      features: [
        "Todo lo del Plan Único",
        "Hasta 4 perfiles familiares independientes",
        "Switcher rápido de perfiles en la cabecera",
        "Vista consolidada familiar en tiempo real",
        "Privacidad y separación de cuentas entre miembros"
      ],
      popular: false,
      tag: "Parejas y Familias"
    }
  ],
  faqsHeader: {
    title: "Preguntas Frecuentes",
    subtitle: "Entiende por qué separar tus finanzas es vital para la salud tributaria de tu empresa"
  },
  faqs: [
    {
      q: "¿Por qué es peligroso mezclar finanzas personales con las de la empresa?",
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
    brandText: "GANANCY es un producto de GANIMIDES — El software de control de caja y auditoría contable definitivo para PYMEs.",
    copyright: "© 2026 GANIMIDES. Todos los derechos reservados. Cumple con la normativa tributaria del Servicio de Impuestos Internos (SII)."
  }
};
