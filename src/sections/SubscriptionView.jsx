import React, { useState } from 'react';
import { initializePaddle } from '@paddle/paddle-js';
import { supabase } from '../lib/supabaseClient';
import {
  Check, ShieldCheck, AlertCircle, X, Loader,
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

  // Clave Maestra (bypass administrativo, no relacionado a Paddle)
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Paddle Checkout
  const [paddleInstance, setPaddleInstance] = useState(null);
  const [paddleSyncing, setPaddleSyncing] = useState(false);
  const [paddleSyncTimedOut, setPaddleSyncTimedOut] = useState(false);

  React.useEffect(() => {
    const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
    const environment = import.meta.env.VITE_PADDLE_ENV;
    if (!clientToken || !environment) return;

    initializePaddle({
      token: clientToken,
      environment,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          setCheckoutOpen(true);
          setPaymentSuccess(false);
          setPaddleSyncTimedOut(false);
          setPaddleSyncing(true);
        }
      },
    }).then((p) => p && setPaddleInstance(p));
  }, []);

  // Espera a que el webhook de Paddle sincronice profiles.subscription_status
  // vía Realtime, en vez de asumir éxito inmediato desde el redirect del checkout.
  React.useEffect(() => {
    if (!paddleSyncing || !currentUser?.id || !selectedPlan) return;

    const timeoutId = setTimeout(() => setPaddleSyncTimedOut(true), 30000);

    const channel = supabase
      .channel(`profile-subscription-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`,
        },
        (payload) => {
          if (payload.new?.subscription_status === selectedPlan.id) {
            clearTimeout(timeoutId);
            setPaddleSyncing(false);
            setPaymentSuccess(true);
            if (onUpdateSubscription) onUpdateSubscription(selectedPlan.id);
            setTimeout(() => setCheckoutOpen(false), 2500);
          }
        },
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [paddleSyncing, currentUser?.id, selectedPlan, onUpdateSubscription]);

  const formatMoney = (val) => val === null ? "Cotizar" : (formatCLP ? formatCLP(val) : '$' + Math.round(val).toLocaleString('es-CL'));
  const plans = [
    {
      id: "plan_completo",
      name: "Plan Único (Personal + Negocio)",
      price: 9990,
      originalPrice: 24990,
      paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_ID_PLAN_COMPLETO,
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
      paddlePriceId: import.meta.env.VITE_PADDLE_PRICE_ID_PLAN_FAMILIAR,
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

  const openCheckout = (plan) => {
    if (plan.price === null) {
      alert(`💼 ¡Gracias por tu interés en el Plan Corporativo! Un asesor de cuentas de GANANCY se pondrá en contacto al correo "${currentUser?.email || 'asociado'}" dentro de las próximas 2 horas para diseñar tu integración contable a medida.`);
      return;
    }
    setSelectedPlan(plan);
    setCheckoutOpen(true);
    setPromoCode("");
    setIsProcessing(false);
    setProcessingStep(0);
    setPaymentSuccess(false);
    setPaddleSyncing(false);
    setPaddleSyncTimedOut(false);
    setErrorMessage("");
  };

  const handlePaddleCheckout = (plan) => {
    if (!paddleInstance || !plan.paddlePriceId) {
      setErrorMessage("El pago con Paddle no está disponible en este momento. Contacta a contacto@ganancy.cl.");
      return;
    }
    setCheckoutOpen(false);
    paddleInstance.Checkout.open({
      items: [{ priceId: plan.paddlePriceId, quantity: 1 }],
      customer: { email: currentUser.email },
      customData: { user_id: currentUser.id },
      settings: { variant: "one-page" },
    });
  };

  // Bypass administrativo (no relacionado a Paddle) — activa un plan sin pago
  // real mediante una clave maestra. El pago real vive en handlePaddleCheckout.
  const handleMasterKeySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const isMasterKey = promoCode.trim().toUpperCase() === "GANANCY-MASTER-2026" || promoCode.trim().toUpperCase() === "METINCA-MASTER-2026";

    if (!isMasterKey) {
      setErrorMessage("Clave Maestra inválida. Para pagar con tarjeta, usa el botón \"Pagar con Paddle\".");
      return;
    }

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
          {currentUser?.paddle_status === 'past_due' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 18px',
              marginBottom: '24px',
              background: 'rgba(255, 159, 10, 0.1)',
              border: '1px solid rgba(255, 159, 10, 0.25)',
              borderRadius: '14px',
              color: '#ff9f0a',
              fontSize: '13px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>Hubo un problema con tu último pago. Estamos reintentando el cobro automáticamente — no necesitas hacer nada, pero si persiste revisa tu método de pago.</span>
            </div>
          )}

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
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
                  Tu plan <strong>{selectedPlan.name}</strong> ya está activo.
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
            ) : paddleSyncing ? (
              /* Step: PADDLE SYNC — esperando confirmación del webhook vía Realtime */
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
                  Activando tu plan...
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                  {paddleSyncTimedOut
                    ? "Tu pago ya fue exitoso — esto puede tardar un minuto más en reflejarse. Podés cerrar esta ventana, tu plan se activará solo."
                    : "Tu pago se está procesando con Paddle. Esto suele tardar solo unos segundos."}
                </p>
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
              /* Step: ELEGIR MÉTODO DE ACTIVACIÓN */
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} color="var(--accent)" />
                    Pago Seguro / Checkout
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Estás suscribiéndote al <strong>{selectedPlan.name}</strong> ({formatMoney(selectedPlan.price)}/mes aprox.).
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

                <button
                  type="button"
                  onClick={() => handlePaddleCheckout(selectedPlan)}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, #0056b3 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14.5px',
                    fontWeight: '600',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(10, 132, 255, 0.2)'
                  }}
                >
                  <Lock size={16} /> Pagar con Paddle
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>o</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>

                {/* Clave Maestra: bypass administrativo, no relacionado a Paddle */}
                <form onSubmit={handleMasterKeySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Clave Maestra de Activación</label>
                  <input
                    type="text"
                    placeholder="Escribe tu Clave Maestra para activar gratis"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
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
                  <button
                    type="submit"
                    disabled={!promoCode.trim()}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '10px',
                      borderRadius: '10px',
                      cursor: promoCode.trim() ? 'pointer' : 'default',
                      opacity: promoCode.trim() ? 1 : 0.5,
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    Activar con Clave Maestra
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
