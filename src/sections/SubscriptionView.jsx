import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  CreditCard, Check, ShieldCheck, AlertCircle, X, Loader, 
  Sparkles, Briefcase, Building, Lock, CheckCircle2, ChevronRight,
  User, Users, TrendingUp, LineChart, Cpu, Camera
} from 'lucide-react';
import { formatCLP } from '../data/financialData';

export default function SubscriptionView({ currentUser, onUpdateSubscription, onUpdateProfile, onNavigateBack, initialSubTab = "perfil" }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // "perfil" o "plan"
  
  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const [editName, setEditName] = useState(currentUser?.displayName || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [selectedPlan, setSelectedPlan] = useState(null); // { id, name, price }
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY && 
    !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
    !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY');
  
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
      id: "plan_completo",
      name: "Plan Único (Personal + Negocio)",
      price: 9990,
      originalPrice: 24990,
      icon: Briefcase,
      color: "#0a84ff",
      target: "Todo en Uno",
      desc: "La solución total para separar de verdad tu vida de tu negocio. Controla tu caja, IA y auditoría tributaria en vivo.",
      features: [
        "Control de ingresos y egresos personales",
        "Gestión de deudas y cuotas individuales",
        "Bloqueo absoluto de vistas de Negocio",
        "Separación Contable 1-Click (Vistas Negocio/Personal)",
        "Vista Consolidada Unificada en Tiempo Real",
        "📷 Escáner Inteligente OCR de boletas y facturas",
        "Visor Tributario y almacenamiento para el SII",
        "Gestor de Activos y Categorías con drag-and-drop",
        "Asesor Contable y CFO Inteligente IA de Élite completo",
        "Simulador de punto de equilibrio y márgenes"
      ],
      popular: true
    },
    {
      id: "plan_familiar",
      name: "Plan Familiar (Multi-Perfil)",
      price: 14990,
      originalPrice: 29990,
      icon: Users,
      color: "#ff9500",
      target: "Parejas y Familias",
      desc: "Administra las finanzas de tu hogar de forma colaborativa. Crea perfiles independientes para cada miembro y visualiza el presupuesto familiar consolidado.",
      features: [
        "Todo lo del Plan Único",
        "👥 Hasta 4 perfiles familiares independientes",
        "🔄 Switcher rápido de perfiles en la cabecera",
        "📊 Vista consolidada familiar en tiempo real",
        "🔒 Privacidad y separación de cuentas entre miembros"
      ],
      popular: false
    },
    {
      id: "plan_custom",
      name: "Plan Corporativo (A Medida)",
      price: null,
      originalPrice: null,
      icon: Cpu,
      color: "#a78bfa",
      target: "PYMEs consolidadas y corporativos",
      desc: "Solución a medida para empresas que buscan automatización total, múltiples roles y reportabilidad premium.",
      features: [
        "Todo lo del Plan Único",
        "🔌 Conectores API automáticos con bancos y SII",
        "👥 Cuentas multi-usuario (Administrador, Contador)",
        "👔 Consultoría CFO directa de nuestro equipo financiero",
        "📞 Canal de soporte prioritario VIP 24/7"
      ]
    }
  ];


  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSavingProfile(true);
    setProfileError("");
    setProfileSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        ctx.drawImage(img, 0, 0, 128, 128);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        if (onUpdateProfile) {
          onUpdateProfile({ photoURL: compressedBase64 })
            .then(() => {
              setIsSavingProfile(false);
              setProfileSuccess(true);
              setTimeout(() => setProfileSuccess(false), 2000);
            })
            .catch(err => {
              console.error(err);
              setIsSavingProfile(false);
              setProfileError("Error al guardar la foto en la base de datos.");
            });
        } else {
          setIsSavingProfile(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileError("El nombre no puede estar vacío.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      if (onUpdateProfile) {
        await onUpdateProfile({ displayName: editName.trim() });
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setProfileError("Error al guardar el nombre en la base de datos.");
    } finally {
      setIsSavingProfile(false);
    }
  };

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
    setPromoCode("");
    setIsFlipped(false);
    setIsProcessing(false);
    setProcessingStep(0);
    setPaymentSuccess(false);
    setErrorMessage("");
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const isMasterKey = promoCode.trim().toUpperCase() === "GANANCY-MASTER-2026" || promoCode.trim().toUpperCase() === "METINCA-MASTER-2026";

    if (isMasterKey) {
      setIsProcessing(true);
      setProcessingStep(1); // Connecting

      // Simulate verification of Master Key
      setTimeout(() => {
        setProcessingStep(2); // Validating master key
        setTimeout(() => {
          setProcessingStep(3); // Upgrading account status
          setTimeout(async () => {
            try {
              if (currentUser && currentUser.provider === 'supabase') {
                const { error } = await supabase
                  .from('profiles')
                  .update({ 
                    subscription_status: selectedPlan.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', currentUser.id);

                if (error) throw error;
              }
              
              setProcessingStep(4);
              setPaymentSuccess(true);
              setIsProcessing(false);

              setTimeout(() => {
                if (onUpdateSubscription) {
                  onUpdateSubscription(selectedPlan.id);
                }
                setCheckoutOpen(false);
              }, 2500);
            } catch (err) {
              console.error("Error al actualizar la suscripción con clave maestra:", err);
              setErrorMessage("Clave maestra válida, pero hubo un error al sincronizar con la nube.");
              setIsProcessing(false);
            }
          }, 1500);
        }, 1200);
      }, 1000);
      return;
    }

    // Block mock card payments in production / Supabase-connected environments
    if (isSupabaseConfigured || import.meta.env.PROD) {
      setErrorMessage("Los pagos automatizados con tarjeta de crédito están temporalmente en mantenimiento. Para activar tu plan, ingresa una Clave Maestra válida o realiza una transferencia bancaria contactando a contacto@ganancy.cl.");
      return;
    }

    // Local / Demo mock credit card flow
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      setErrorMessage("Por favor, completa todos los datos de la tarjeta o ingresa una Clave Maestra válida.");
      return;
    }

    setIsProcessing(true);
    setProcessingStep(1); // Connecting

    // Step 1: Connecting (1s)
    setTimeout(() => {
      setProcessingStep(2); // Validating card details
      
      // Step 2: Validating card (1.2s)
      setTimeout(() => {
        setProcessingStep(3); // Saving credentials & Securing db
        
        setTimeout(async () => {
          try {
            if (currentUser && currentUser.provider === 'supabase') {
              const { error } = await supabase
                .from('profiles')
                .update({ 
                  subscription_status: selectedPlan.id,
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
                onUpdateSubscription(selectedPlan.id);
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
      {/* Tab Switcher Segmented Control */}
      <div style={{ 
        display: 'inline-flex', 
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '3px',
        gap: '4px',
        margin: '0 auto 48px auto',
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'relative',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
      }}>
        <button 
          onClick={() => setActiveSubTab("perfil")}
          style={{
            background: activeSubTab === "perfil" ? 'var(--accent, #0a84ff)' : 'transparent',
            color: activeSubTab === "perfil" ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === "perfil" ? '0 4px 10px rgba(10, 132, 255, 0.25)' : 'none'
          }}
        >
          <User size={15} /> Mi Perfil
        </button>
        <button 
          onClick={() => setActiveSubTab("plan")}
          style={{
            background: activeSubTab === "plan" ? 'var(--accent, #0a84ff)' : 'transparent',
            color: activeSubTab === "plan" ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === "plan" ? '0 4px 10px rgba(10, 132, 255, 0.25)' : 'none'
          }}
        >
          <ShieldCheck size={15} /> Mi Plan de Suscripción
        </button>
      </div>

      {activeSubTab === "perfil" ? (
        /* ========================================================
            TAB 1: USER PROFILE MANAGEMENT (NEW FUNCTIONALITY)
           ======================================================== */
        <div className="card glass-panel animate-fade-in" style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: '40px 32px',
          borderRadius: '24px',
          background: 'var(--bg-secondary, #1e293b)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Header Info with Photo Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            
            {/* Interactive Photo Avatar */}
            <div style={{ position: 'relative', width: '108px', height: '108px', marginBottom: '18px' }}>
              <div style={{
                width: '108px',
                height: '108px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--accent, #0a84ff) 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                position: 'relative'
              }}>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.avatarInitials
                )}
              </div>
              
              {/* Photo Input Badge */}
              <label 
                htmlFor="profile-photo-upload" 
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: 'var(--accent, #0a84ff)',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                  transition: 'transform 0.2s',
                  border: '2px solid var(--bg-secondary, #1e293b)'
                }}
                title="Subir Foto de Perfil"
                className="photo-upload-badge"
              >
                <Camera size={14} />
              </label>
              <input 
                type="file" 
                id="profile-photo-upload" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                style={{ display: 'none' }} 
                disabled={isSavingProfile}
              />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{currentUser.displayName}</h3>
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary, #94a3b8)' }}>{currentUser.email}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleNameSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nombre de Pantalla
              </label>
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{
                  background: 'var(--bg-primary, #0f172a)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  color: 'var(--text-primary, #f8fafc)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14.5px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Nombre Completo"
                disabled={isSavingProfile}
              />
            </div>

            {/* Read-Only Meta Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>Plan Actual</span>
                <span style={{ fontSize: '13.5px', color: 'var(--accent, #0a84ff)', fontWeight: 700 }}>
                  {currentUser.subscription_status === 'plan_personal' 
                    ? 'Plan Personal (Legacy)' 
                    : currentUser.subscription_status === 'plan_completo' 
                    ? 'Plan Único (Personal + Negocio)' 
                    : currentUser.subscription_status === 'trial' 
                    ? 'Periodo de Prueba' 
                    : 'Demo Local'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>Servidor Cloud</span>
                <span style={{ fontSize: '13.5px', color: 'var(--text-secondary, #94a3b8)', fontWeight: 500 }}>
                  {currentUser.provider === 'supabase' ? 'Supabase Secure' : 'Local Sandbox'}
                </span>
              </div>
            </div>

            {profileError && (
              <div style={{ color: 'var(--error, #ff453a)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> {profileError}
              </div>
            )}

            {profileSuccess && (
              <div style={{ color: 'var(--success, #34c759)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> ¡Perfil guardado con éxito!
              </div>
            )}

            <button 
              type="submit"
              disabled={isSavingProfile}
              style={{
                background: 'linear-gradient(135deg, var(--accent, #0a84ff) 0%, #0056b3 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '12px',
                fontSize: '14.5px',
                fontWeight: '600',
                cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                opacity: isSavingProfile ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px',
                boxShadow: '0 4px 12px rgba(10, 132, 255, 0.2)'
              }}
            >
              {isSavingProfile ? (
                <>
                  <Loader size={16} className="spin-icon" /> Guardando cambios...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </form>
        </div>
      ) : (
        /* ========================================================
            TAB 2: ORIGINAL SUBSCRIPTION PLANS & CHECKOUT
           ======================================================== */
        <>
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
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      letterSpacing: '0.05em'
                    }}>
                      Recomendado
                    </div>
                  )}

                  {/* Plan Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
                    {plan.originalPrice && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', textDecoration: 'line-through', fontWeight: '500' }}>
                          {formatMoney(plan.originalPrice)}
                        </span>
                        <span style={{ 
                          fontSize: '9px', 
                          background: 'rgba(52, 199, 89, 0.15)', 
                          color: 'var(--success)', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em'
                        }}>
                          Lanzamiento
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {formatMoney(plan.price)}
                      </span>
                      {plan.price !== null && (
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>/ mensual</span>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 24px 0', flexShrink: 0 }}>
                    {plan.desc}
                  </p>

                  <div style={{ borderBottom: '1px solid var(--border-color)', margin: '0 0 24px 0' }}></div>

                  {/* Features List */}
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: '0 0 32px 0', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '14px',
                    flex: 1
                  }}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        <Check size={16} color={plan.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Checkout Trigger Button */}
                  <button 
                    onClick={() => openCheckout(plan)}
                    disabled={currentUser?.subscription_status === plan.id}
                    style={{
                      background: currentUser?.subscription_status === plan.id 
                        ? 'transparent' 
                        : plan.popular 
                        ? 'linear-gradient(135deg, var(--accent) 0%, #0056b3 100%)' 
                        : 'var(--bg-primary)',
                      border: currentUser?.subscription_status === plan.id 
                        ? '2px solid var(--border-color)' 
                        : plan.popular 
                        ? 'none' 
                        : '1px solid var(--border-color)',
                      color: currentUser?.subscription_status === plan.id ? 'var(--text-tertiary)' : '#ffffff',
                      padding: '14px 24px',
                      borderRadius: '14px',
                      fontSize: '14.5px',
                      fontWeight: '600',
                      cursor: currentUser?.subscription_status === plan.id ? 'default' : 'pointer',
                      width: '100%',
                      transition: 'all 0.2s',
                      boxShadow: plan.popular && currentUser?.subscription_status !== plan.id ? '0 8px 20px rgba(var(--accent-rgb), 0.25)' : 'none',
                      marginTop: 'auto'
                    }}
                  >
                    {currentUser?.subscription_status === plan.id 
                      ? 'Plan Activo' 
                      : plan.price === null 
                      ? 'Contactar Ventas' 
                      : 'Suscribirme'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Security details info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px 24px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <ShieldCheck size={20} color="var(--success)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Tus datos bancarios y financieros están encriptados de extremo a extremo en la nube bajo los estándares de seguridad de Stripe y Webpay.
            </div>
          </div>
        </>
      )}

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
                  {/* Cupón o Clave Maestra */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Cupón o Clave Maestra de Activación</label>
                    <input
                      type="text"
                      placeholder="Escribe tu Clave Maestra para activar gratis"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      onFocus={() => setIsFlipped(false)}
                      style={{
                        background: 'var(--bg-primary, #0f172a)',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                        color: 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        letterSpacing: '0.05em'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Nombre del Titular</label>
                    <input
                      type="text"
                      placeholder="Ej: Daniel Repetto"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      required={!promoCode.trim()}
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
                      required={!promoCode.trim()}
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
                        required={!promoCode.trim()}
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
                        required={!promoCode.trim()}
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
