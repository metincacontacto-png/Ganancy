import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { LANDING_PAGE_DEFAULTS } from '../data/landingPageDefaults';

export default function LandingPageView({ onEnterLogin, landingPageData }) {
  const [activeFaq, setActiveFaq] = useState(null);

  // Safely merge custom landing data with original defaults
  const data = {
    hero: { ...LANDING_PAGE_DEFAULTS.hero, ...(landingPageData?.hero || {}) },
    featuresHeader: { ...LANDING_PAGE_DEFAULTS.featuresHeader, ...(landingPageData?.featuresHeader || {}) },
    features: landingPageData?.features || LANDING_PAGE_DEFAULTS.features,
    pricingHeader: { ...LANDING_PAGE_DEFAULTS.pricingHeader, ...(landingPageData?.pricingHeader || {}) },
    plans: landingPageData?.plans || LANDING_PAGE_DEFAULTS.plans,
    faqsHeader: { ...LANDING_PAGE_DEFAULTS.faqsHeader, ...(landingPageData?.faqsHeader || {}) },
    faqs: landingPageData?.faqs || LANDING_PAGE_DEFAULTS.faqs,
    footer: { ...LANDING_PAGE_DEFAULTS.footer, ...(landingPageData?.footer || {}) },
  };

  const { hero, featuresHeader, features, pricingHeader, plans, faqsHeader, faqs, footer } = data;

  const getIcon = (name, size = 20, color = "currentColor", extraProps = {}) => {
    const IconComponent = Icons[name] || Icons.HelpCircle;
    return <IconComponent size={size} color={color} {...extraProps} />;
  };

  const formatMoney = (val) => {
    if (val === null) return "Cotizar";
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div style={{
      background: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background glowing gradients */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(10, 132, 255, 0.08) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* STICKY HEADER */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/ganancy_logo_light.png" 
              alt="GANANCY" 
              style={{ height: '32px', width: 'auto', display: 'block' }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <a href="#features" className="landing-nav-link">Características</a>
              <a href="#pricing" className="landing-nav-link">Planes de Precios</a>
              <a href="#faqs" className="landing-nav-link">Preguntas Frecuentes</a>
            </nav>

            <button 
              onClick={onEnterLogin}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Acceso Cliente
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '90px 24px 60px 24px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        {hero.badge && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(10, 132, 255, 0.1)',
            border: '1px solid rgba(10, 132, 255, 0.2)',
            color: '#38bdf8',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            {getIcon("Sparkles", 14, "#38bdf8")}
            <span>{hero.badge}</span>
          </div>
        )}

        <h1 style={{
          fontSize: '48px',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1.5px',
          marginBottom: '20px',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {hero.title}
        </h1>

        <p style={{
          fontSize: '17px',
          color: '#94a3b8',
          lineHeight: '1.6',
          maxWidth: '680px',
          margin: '0 auto 36px auto'
        }}>
          {hero.desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button 
            onClick={onEnterLogin}
            style={{
              background: 'linear-gradient(135deg, #0a84ff 0%, #0056b3 100%)',
              color: '#fff',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(10, 132, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s'
            }}
          >
            <span>{hero.ctaPrimary}</span>
            {getIcon("ArrowRight", 18)}
          </button>

          <a 
            href="#pricing"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {hero.ctaSecondary}
          </a>
        </div>

        {/* Preview concept image (WOW factor) */}
        {hero.imageUrl && (
          <div style={{
            marginTop: '60px',
            position: 'relative',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'transform 0.4s ease, box-shadow 0.4s ease',
            cursor: 'pointer'
          }}
          className="hero-image-container"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
            e.currentTarget.style.boxShadow = '0 30px 60px -10px rgba(10, 132, 255, 0.15), 0 25px 50px -12px rgba(0,0,0,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
          }}
          onClick={onEnterLogin}
          >
            <img 
              src={hero.imageUrl} 
              alt="GANANCY Dashboard Financiero" 
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '16px',
                display: 'block',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
              }}
            />
          </div>
        )}
      </section>

      {/* CORE DIFFERENTIATOR FEATURES */}
      <section id="features" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px' }}>{featuresHeader.title}</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px' }}>{featuresHeader.subtitle}</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {features.map((feat) => (
            <div key={feat.id} className="card glass-panel" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '24px',
              transition: 'all 0.3s'
            }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                {getIcon(feat.iconName, 20, "#38bdf8")}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 10px 0' }}>{feat.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PLANS */}
      <section id="pricing" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px' }}>{pricingHeader.title}</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px' }}>{pricingHeader.subtitle}</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          alignItems: 'stretch'
        }}>
          {plans.map((plan) => (
            <div 
              key={plan.id}
              style={{
                background: plan.popular 
                  ? 'linear-gradient(135deg, rgba(10, 132, 255, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)' 
                  : 'rgba(15, 23, 42, 0.6)',
                border: plan.popular ? '2px solid #0a84ff' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s',
                boxShadow: plan.popular ? '0 15px 35px rgba(10, 132, 255, 0.15)' : 'none'
              }}
            >
              {/* Popular Tag */}
              {plan.tag && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: plan.popular ? '#0a84ff' : 'rgba(255, 255, 255, 0.08)',
                  color: plan.popular ? '#fff' : '#cbd5e1',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  letterSpacing: '0.5px'
                }}>
                  {plan.tag}
                </div>
              )}

              {/* Plan header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <div style={{
                  background: `rgba(${plan.color === '#0a84ff' ? '10, 132, 255' : '255, 255, 255'}, 0.08)`,
                  color: plan.color || '#fff',
                  padding: '8px',
                  borderRadius: '10px'
                }}>
                  {getIcon(plan.iconName || "User", 20, plan.color || '#fff')}
                </div>
                <h3 style={{ fontSize: '16.5px', fontWeight: 700, margin: 0 }}>{plan.name}</h3>
              </div>

              {/* Price block */}
              <div>
                <span style={{ fontSize: '26px', fontWeight: 800 }}>{formatMoney(plan.price)}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>/ {plan.period}</span>
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', margin: 0, minHeight: '42px' }}>
                {plan.desc}
              </p>

              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', margin: '4px 0' }}></div>

              {/* Features list */}
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flexGrow: 1
              }}>
                {(plan.features || []).map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                    {getIcon("CheckCircle2", 13, plan.color || '#38bdf8', { style: { marginTop: '2px', flexShrink: 0 } })}
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={onEnterLogin}
                style={{
                  background: plan.popular ? 'linear-gradient(135deg, #0a84ff 0%, #0056b3 100%)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: plan.popular ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s',
                  boxShadow: plan.popular ? '0 4px 12px rgba(10, 132, 255, 0.2)' : 'none',
                  marginTop: '8px'
                }}
              >
                {plan.price === null ? "Contactar Ventas" : "Suscribirme al Plan"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faqs" style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '60px 24px 100px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px' }}>{faqsHeader.title}</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>{faqsHeader.subtitle}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="glass-panel"
              style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#f8fafc' }}>{faq.q}</h4>
                {getIcon("ChevronDown", 18, "#94a3b8", {
                  style: {
                    transform: activeFaq === index ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    flexShrink: 0
                  }
                })}
              </div>
              
              {activeFaq === index && (
                <p style={{ 
                  margin: '12px 0 0 0', 
                  fontSize: '13px', 
                  color: '#94a3b8', 
                  lineHeight: '1.6',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '12px'
                }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#090d16',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '32px 24px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '12px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong>{footer.brandText}</strong>
          </div>
          <div>
            {footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
