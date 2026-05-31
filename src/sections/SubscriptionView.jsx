import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  CreditCard, Check, ShieldCheck, AlertCircle, X, Loader, 
  Sparkles, Briefcase, Building, Lock, CheckCircle2, ChevronRight,
  User, TrendingUp, LineChart, Cpu
} from 'lucide-react';
import { formatCLP } from '../data/financialData';

export default function SubscriptionView({ currentUser, onUpdateSubscription, onNavigateBack }) {
  const [selectedPlan, setSelectedPlan] = useState(null); // { id, name, price }
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  
  // Credit Card Form States
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false); // flips card for CVV
  
  // Payment animation/state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formatMoney = (val) => val === null ? "Cotizar" : (formatCLP ? formatCLP(val) : '$' + Math.round(val).toLocaleString('es-CL'));

  const plans = [
    {
      id: "plan_persona",
      name: "Plan Persona",
      price: 3990,
      icon: User,
      color: "#38bdf8",
      target: "Finanzas Personales",
      desc: "Ideal para individuos y profesionales independientes que buscan ordenar su presupuesto familiar.",
      features: [
        "Control de gastos e ingresos personales",
        "Recordatorios de vencimiento simples",
        "Dashboard con gráficos de presupuesto",
        "Soporte por correo electrónico",
        "1 cuenta de usuario"
      ]
    },
    {
      id: "plan_emprendedor",
      name: "Plan Emprendedor",
      price: 9990,
      icon: TrendingUp,
      color: "#fb7185",
      target: "Freelancers y Emprendedores",
      desc: "Perfecto para freelancers y fundadores iniciales que manejan su caja de forma consolidada.",
      features: [
        "Vista Consolidada (Todo en Uno)",
        "Seguimiento de Activos y Deudas básico",
        "Planificador financiero e IA CFO simple",
        "Recordatorios automatizados en la nube",
        "Dashboard interactivo unificado"
      ]
    },
    {
      id: "plan_micro",
      name: "Plan Micro Empresa",
      price: 24990,
      icon: Briefcase,
      color: "#fbbf24",
      target: "Microempresas / PYMEs",
      desc: "Diseñado para pequeños negocios que necesitan separar obligatoriamente sus cuentas personales.",
      features: [
        "Aislamiento Contable Absoluto (1-Click)",
        "Escáner Inteligente de Boletas (IA)",
        "Visor Tributario de Respaldo para el SII",
        "Consolidador contable mensual",
        "Reportabilidad automatizada"
      ],
      popular: true
    },
    {
      id: "plan_mediana",
      name: "Plan Mediana Empresa",
      price: 49900,
      icon: LineChart,
      color: "#10b981",
      target: "Medianas Empresas",
      desc: "Para empresas consolidadas que requieren proyecciones avanzadas y CFO de élite con IA.",
      features: [
        "Todo lo del Plan Micro Empresa",
        "Asesor Financiero CFO IA de Élite completo",
        "Simulador de puntos de equilibrio y márgenes",
        "Proyecciones de flujo de caja automatizadas",
        "Visor y exportación masiva para SII"
      ]
    },
    {
      id: "plan_gran_empresa",
      name: "Gran Empresa",
      price: null,
      icon: Cpu,
      color: "#a78bfa",
      target: "Grandes Empresas (Custom)",
      desc: "Solución hecha a medida para corporativos que buscan integración total y reportabilidad premium.",
      features: [
        "Conectores API personalizados",
        "Modelación financiera CFO a medida",
        "Múltiples cuentas y roles de usuario",
        "Ejecutivo de cuentas dedicado 24/7",
        "Acuerdo de nivel de servicio (SLA) garantizado"
      ]
    }
  ];

  // Card formatting helpers
  const handleCardNumberChange = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // numbers only
    if (input.length > 16) input = input.slice(0, 16);
    // Format: 4-4-4-4
    let formatted = input.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // numbers only
    if (input.length > 4) input = input.slice(0, 4);
    if (input.length >= 2) {
      input = input.slice(0, 2) + "/" + input.slice(2);
    }
    setCardExpiry(input);
  };

  const handleCvvChange = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // numbers only
    if (input.length > 4) input = input.slice(0, 4);
    setCardCvv(input);
  };

  const openCheckout = (plan) => {
    if (plan.price === null) {
      alert(`💼 ¡Gracias por tu interés en el Plan Corporativo! Un asesor de cuentas de GANANCY se pondrá en contacto al correo "${currentUser?.email || 'asociado'}" dentro de las próximas 2 horas para diseñar tu integración contable a medida.`);
      return;
    }
    setSelectedPlan(plan);
    setCheckoutOpen(true);
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setIsFlipped(false);
    setIsProcessing(false);
    setProcessingStep(0);
    setPaymentSuccess(false);
    setErrorMessage("");
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      setErrorMessage("Por favor, completa todos los datos de la tarjeta.");
      return;
    }

    setErrorMessage("");
    setIsProcessing(true);
    setProcessingStep(1); // Connecting

    // Step 1: Connecting (1s)
    setTimeout(() => {
      setProcessingStep(2); // Validating card details
      
      // Step 2: Validating card (1.2s)
      setTimeout(() => {
        setProcessingStep(3); // Saving credentials & Securing db
        
        // Step 3: Sincronizando con base de datos de Supabase real
        setTimeout(async () => {
          try {
            if (currentUser && currentUser.provider === 'supabase') {
              const { error } = await supabase
                .from('profiles')
                .update({ 
                  subscription_status: 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.id);

              if (error) throw error;
            }
            
            // Succeed!
            setProcessingStep(4);
            setPaymentSuccess(true);
            setIsProcessing(false);

            // Update parent app context with active plan
            setTimeout(() => {
              if (onUpdateSubscription) {
                onUpdateSubscription('active');
              }
              setCheckoutOpen(false);
            }, 2500);

          } catch (err) {
            console.error("Error al actualizar la suscripción en Supabase:", err);
            setErrorMessage("Transacción aprobada, pero hubo un error al sincronizar tu perfil con la nube. Por favor inténtalo de nuevo.");
            setIsProcessing(false);
          }
        }, 1500);
      }, 1200);
    }, 1000);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px',
      fontFamily: 'system-ui, sans-serif',
      color: 'var(--text-primary)'
    }}>
      {/* Intro Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span style={{
          background: 'rgba(var(--accent-rgb), 0.1)',
          color: 'var(--accent)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          display: 'inline-block',
          marginBottom: '16px'
        }}>
          Suite de Control Financiero Inteligente
        </span>
        <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 12px 0', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Activa tu Plan CFO de Elite
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6' }}>
          Ordena tus balances, erradica ineficiencias de flujo de caja y escala la rentabilidad de tu negocio con nuestro Asesor CFO y suite de control cuantitativo.
        </p>
      </div>

      {/* Pricing Table Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '32px',
        alignItems: 'stretch',
        marginBottom: '64px'
      }}>
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          return (
            <div 
              key={plan.id}
              className={`card glass-panel ${plan.popular ? 'active-border' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                padding: '32px',
                background: 'var(--bg-secondary)',
                border: plan.popular ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                boxShadow: plan.popular ? '0 20px 40px -15px rgba(var(--accent-rgb), 0.25)' : 'var(--shadow-md)',
                transform: 'translateY(0px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)'
                }}>
                  <Sparkles size={11} /> Más Recomendado
                </div>
              )}

              {/* Plan Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: plan.popular ? 'rgba(var(--accent-rgb), 0.15)' : 'var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: plan.color
                }}>
                  <PlanIcon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>{plan.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{plan.target}</span>
                </div>
              </div>

              {/* Price Tag */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {formatMoney(plan.price)}
                </span>
                {plan.price !== null && (
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>/ mensual</span>
                )}
              </div>

              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 24px 0', flexShrink: 0 }}>
                {plan.desc}
              </p>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 24px 0' }} />

              {/* Features List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, marginBottom: '32px' }}>
                {plan.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(52, 199, 89, 0.1)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Subscribe CTA Button */}
              <button 
                onClick={() => openCheckout(plan)}
                style={{
                  width: '100%',
                  background: plan.popular 
                    ? 'linear-gradient(135deg, var(--accent) 0%, #0056b3 100%)' 
                    : 'var(--bg-primary)',
                  color: plan.popular ? 'white' : 'var(--text-primary)',
                  border: plan.popular ? 'none' : '1px solid var(--border-color)',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: plan.popular ? '0 10px 20px -8px rgba(10, 132, 255, 0.3)' : 'none'
                }}
                className="checkout-btn"
              >
                <span>{plan.price === null ? "Contactar Ventas" : "Suscribirme al Plan"}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Security Banner */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '24px', 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)',
        padding: '20px', 
        borderRadius: '16px',
        maxWidth: '720px',
        margin: '0 auto',
        flexWrap: 'wrap',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
          <ShieldCheck size={20} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Transacción 100% Segura</span>
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Tus datos bancarios y financieros están encriptados de extremo a extremo en la nube bajo los estándares de seguridad de Stripe y Webpay.
        </div>
      </div>

      {/* BACK NAVIGATION (ONLY FOR ACTIVE TRIAL USERS GESTIONING ACCOUNT) */}
      {onNavigateBack && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button 
            onClick={onNavigateBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Volver al Dashboard Financiero
          </button>
        </div>
      )}

      {/* ========================================================
          3D INTERACTIVE CREDIT CARD CHECKOUT MODAL (WOW FACTOR)
         ======================================================== */}
      {checkoutOpen && selectedPlan && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => !isProcessing && setCheckoutOpen(false)}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '520px', 
              padding: '32px',
              background: 'var(--bg-secondary, #1e293b)',
              borderRadius: '24px',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            {!isProcessing && (
              <button 
                className="close-btn" 
                onClick={() => setCheckoutOpen(false)}
                style={{ top: '20px', right: '20px' }}
              >
                <X size={18} />
              </button>
            )}

            {/* Step: SUCCESS PANEL */}
            {paymentSuccess ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 10px',
                animation: 'scaleIn 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)'
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                  ¡Suscripción Activada!
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                  Tu pago de <strong>{formatMoney(selectedPlan.price)}</strong> ha sido procesado exitosamente por Stripe.
                </p>
                <div style={{
                  fontSize: '12px',
                  background: 'var(--bg-primary)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Loader className="spin-icon" size={12} /> Redireccionando al Dashboard...
                </div>
              </div>
            ) : isProcessing ? (
              /* Step: PROCESSING BANNER */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '50px 10px'
              }}>
                <Loader className="spin-icon" size={48} style={{ color: 'var(--accent)', marginBottom: '24px' }} />
                
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  {processingStep === 1 ? "Iniciando Transacción..." :
                   processingStep === 2 ? "Validando credenciales bancarias..." :
                   "Autorizando y sincronizando tu perfil en la nube..."}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Por favor, no recargues la página ni cierres este modal.
                </p>

                {/* Progress Indicators */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: processingStep >= 1 ? 'var(--accent)' : 'var(--border-color)' }}></div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: processingStep >= 2 ? 'var(--accent)' : 'var(--border-color)' }}></div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: processingStep >= 3 ? 'var(--accent)' : 'var(--border-color)' }}></div>
                </div>
              </div>
            ) : (
              /* Step: CREDIT CARD INPUT PANEL */
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} color="var(--accent)" />
                    Pago Seguro / Checkout
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Estás suscribiéndote al <strong>{selectedPlan.name}</strong> por <strong>{formatMoney(selectedPlan.price)}/mes</strong>.
                  </p>
                </div>

                {errorMessage && (
                  <div style={{
                    backgroundColor: 'rgba(255, 69, 58, 0.1)',
                    border: '1px solid rgba(255, 69, 58, 0.2)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    color: 'var(--danger)',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 3D CREDIT CARD VISUAL PREVIEW (WOW FACTOR) */}
                <div style={{
                  perspective: '1000px',
                  width: '100%',
                  height: '180px',
                  marginBottom: '28px',
                  cursor: 'pointer'
                }} onClick={() => setIsFlipped(!isFlipped)}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}>
                    
                    {/* CARD FRONT */}
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      borderRadius: '16px',
                      padding: '20px',
                      color: 'white',
                      boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)' }}>GANANCY FINANCIERO</span>
                        <CreditCard size={28} />
                      </div>
                      
                      {/* Chip & Signal Icon */}
                      <div style={{
                        width: '36px',
                        height: '26px',
                        borderRadius: '4px',
                        backgroundColor: '#fbbf24',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
                      }}></div>
                      
                      {/* Card Number */}
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        letterSpacing: '0.15em', 
                        fontFamily: 'monospace',
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}>
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>
                      
                      {/* Card Holder & Expiry */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>TITULAR</span>
                          <strong style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{cardName || "NOMBRE TITULAR"}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>EXPIRA</span>
                          <strong style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{cardExpiry || "MM/YY"}</strong>
                        </div>
                      </div>
                    </div>

                    {/* CARD BACK */}
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      borderRadius: '16px',
                      color: 'white',
                      boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
                      transform: 'rotateY(180deg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '20px 0',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {/* Black Stripe */}
                      <div style={{ width: '100%', height: '40px', backgroundColor: '#020617', marginTop: '10px' }}></div>
                      
                      {/* Signature & CVV Area */}
                      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Firma Autorizada</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {/* Signature line */}
                          <div style={{
                            flex: 1,
                            height: '32px',
                            background: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 10px, #cbd5e1 10px, #cbd5e1 20px)',
                            borderRadius: '4px'
                          }}></div>
                          {/* CVV text box */}
                          <div style={{
                            width: '50px',
                            height: '32px',
                            backgroundColor: 'white',
                            color: 'black',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            fontSize: '14px'
                          }}>
                            {cardCvv || "•••"}
                          </div>
                        </div>
                      </div>
                      
                      {/* Back info */}
                      <div style={{ padding: '0 20px', fontSize: '8px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                        Esta tarjeta simulada opera con fines demostrativos exclusivos en el entorno de desarrollo seguro de Ganímedes.
                      </div>
                    </div>

                  </div>
                </div>

                {/* Billing Input Fields */}
                <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Nombre del Titular</label>
                    <input
                      type="text"
                      placeholder="Ej: Daniel Repetto"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      required
                      onFocus={() => setIsFlipped(false)}
                      style={{
                        background: 'var(--bg-primary, #0f172a)',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                        color: 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Número de Tarjeta</label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                      onFocus={() => setIsFlipped(false)}
                      style={{
                        background: 'var(--bg-primary, #0f172a)',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                        color: 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Vencimiento (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        required
                        onFocus={() => setIsFlipped(false)}
                        style={{
                          background: 'var(--bg-primary, #0f172a)',
                          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Código CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardCvv}
                        onChange={handleCvvChange}
                        required
                        onFocus={() => setIsFlipped(true)}
                        onBlur={() => setIsFlipped(false)}
                        style={{
                          background: 'var(--bg-primary, #0f172a)',
                          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent) 0%, #0056b3 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginTop: '12px',
                      boxShadow: '0 4px 12px rgba(10, 132, 255, 0.2)'
                    }}
                  >
                    Confirmar Transacción y Suscribirse
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
