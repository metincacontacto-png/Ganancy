import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { LANDING_PAGE_DEFAULTS } from '../data/landingPageDefaults';

export default function LandingPageView({ onEnterLogin, landingPageData }) {
  const [activeFaq, setActiveFaq] = useState(null);

  // Safely merge custom landing data with original defaults
  const data = {
    logoUrl: landingPageData?.logoUrl || LANDING_PAGE_DEFAULTS.logoUrl || null,
    hero: { ...LANDING_PAGE_DEFAULTS.hero, ...(landingPageData?.hero || {}) },
    featuresHeader: { ...LANDING_PAGE_DEFAULTS.featuresHeader, ...(landingPageData?.featuresHeader || {}) },
    features: landingPageData?.features || LANDING_PAGE_DEFAULTS.features,
    pricingHeader: { ...LANDING_PAGE_DEFAULTS.pricingHeader, ...(landingPageData?.pricingHeader || {}) },
    plans: landingPageData?.plans || LANDING_PAGE_DEFAULTS.plans,
    faqsHeader: { ...LANDING_PAGE_DEFAULTS.faqsHeader, ...(landingPageData?.faqsHeader || {}) },
    faqs: landingPageData?.faqs || LANDING_PAGE_DEFAULTS.faqs,
    footer: { ...LANDING_PAGE_DEFAULTS.footer, ...(landingPageData?.footer || {}) },
  };

  const { logoUrl, hero, featuresHeader, features, pricingHeader, plans, faqsHeader, faqs, footer } = data;

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

  const isVideoUrl = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase().trim();
    return (
      lowerUrl.endsWith('.mp4') || 
      lowerUrl.endsWith('.webm') || 
      lowerUrl.endsWith('.ogg') ||
      lowerUrl.includes('youtube.com') ||
      lowerUrl.includes('youtu.be') ||
      lowerUrl.includes('vimeo.com')
    );
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        try {
          const urlParams = new URLSearchParams(new URL(url).search);
          videoId = urlParams.get('v') || '';
        } catch (e) {
          const splitWatch = url.split('v=');
          if (splitWatch[1]) videoId = splitWatch[1].split('&')[0];
        }
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        return url;
      }
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';
      return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1`;
    }
    return url;
  };

  return (
    <div style={{
      background: '#ffffff',
      color: '#1d1d1f',
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
        background: 'radial-gradient(circle, rgba(0, 113, 227, 0.04) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.02) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* STICKY HEADER */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(15, 23, 42, 0.95)', // Clean, solid premium dark blue as requested
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
              src={logoUrl || "/ganancy_logo_light.png"} 
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
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
            background: 'rgba(0, 113, 227, 0.08)',
            border: '1px solid rgba(0, 113, 227, 0.15)',
            color: '#0071e3',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            {getIcon("Sparkles", 14, "#0071e3")}
            <span>{hero.badge}</span>
          </div>
        )}

        <h1 style={{
          fontSize: '48px',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1.5px',
          marginBottom: '20px',
          color: '#1d1d1f'
        }}>
          {hero.title}
        </h1>

        <p style={{
          fontSize: '17px',
          color: '#515154',
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
              background: 'linear-gradient(135deg, #0071e3 0%, #0056b3 100%)',
              color: '#fff',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0, 113, 227, 0.25)',
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
              background: '#f5f5f7',
              color: '#0071e3',
              border: '1px solid rgba(0, 0, 0, 0.06)',
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
            border: '1px solid rgba(0, 0, 0, 0.08)',
            background: '#ffffff',
            padding: '12px',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
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
            e.currentTarget.style.boxShadow = '0 30px 65px rgba(0, 113, 227, 0.1), 0 20px 45px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.08)';
          }}
          onClick={onEnterLogin}
          >
            {isVideoUrl(hero.imageUrl) ? (
              hero.imageUrl.includes('youtube.com') || hero.imageUrl.includes('youtu.be') || hero.imageUrl.includes('vimeo.com') ? (
                <iframe
                  src={getEmbedUrl(hero.imageUrl)}
                  title="Video de presentación de GANANCY"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: '16px',
                    display: 'block',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
                  }}
                />
              ) : (
                <video
                  src={hero.imageUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '16px',
                    display: 'block',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
                  }}
                />
              )
            ) : (
              <img 
                src={hero.imageUrl} 
                alt="GANANCY Dashboard Financiero" 
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '16px',
                  display: 'block',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
                }}
              />
            )}
          </div>
        )}
      </section>

      {/* CORE DIFFERENTIATOR FEATURES */}
      <section id="features" style={{
        background: '#f5f5f7',
        borderTop: '1px solid rgba(0, 0, 0, 0.04)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        padding: '80px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px', color: '#1d1d1f' }}>{featuresHeader.title}</h2>
            <p style={{ color: '#86868b', fontSize: '15px' }}>{featuresHeader.subtitle}</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {features.map((feat) => (
              <div key={feat.id} className="card glass-panel" style={{
                background: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  background: 'rgba(0, 113, 227, 0.08)',
                  color: '#0071e3',
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  {getIcon(feat.iconName, 20, "#0071e3")}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 10px 0', color: '#1d1d1f' }}>{feat.title}</h3>
                <p style={{ color: '#515154', fontSize: '13px', lineHeight: '1.5', margin: 0, flexGrow: 1 }}>
                  {feat.desc}
                </p>
                <div style={{ marginTop: '16px' }}>
                  <button 
                    onClick={onEnterLogin}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0071e3',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 0.75}
                    onMouseLeave={(e) => e.target.style.opacity = 1}
                  >
                    Probar ahora &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section id="pricing" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px', color: '#1d1d1f' }}>{pricingHeader.title}</h2>
          <p style={{ color: '#86868b', fontSize: '15px' }}>{pricingHeader.subtitle}</p>
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
                  ? 'linear-gradient(135deg, rgba(0, 113, 227, 0.03) 0%, #ffffff 100%)' 
                  : '#ffffff',
                border: plan.popular ? '2px solid #0071e3' : '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s',
                boxShadow: plan.popular ? '0 20px 40px rgba(0, 113, 227, 0.08)' : '0 10px 30px rgba(0, 0, 0, 0.03)'
              }}
            >
              {/* Popular Tag */}
              {plan.tag && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: plan.popular ? '#0071e3' : 'rgba(0,0,0,0.05)',
                  color: plan.popular ? '#fff' : '#515154',
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
                  background: `rgba(${plan.popular ? '0, 113, 227' : '0, 0, 0'}, 0.06)`,
                  color: plan.popular ? '#0071e3' : '#1d1d1f',
                  padding: '8px',
                  borderRadius: '10px'
                }}>
                  {getIcon(plan.iconName || "User", 20, plan.popular ? '#0071e3' : '#1d1d1f')}
                </div>
                <h3 style={{ fontSize: '16.5px', fontWeight: 700, margin: 0, color: '#1d1d1f' }}>{plan.name}</h3>
              </div>

              {/* Price block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {plan.originalPrice && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', color: '#86868b', textDecoration: 'line-through', fontWeight: '500' }}>
                      {formatMoney(plan.originalPrice)}
                    </span>
                    <span style={{ 
                      fontSize: '8.5px', 
                      background: 'rgba(52, 199, 89, 0.15)', 
                      color: '#1a7f37', 
                      padding: '1px 5px', 
                      borderRadius: '4px', 
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      Lanzamiento
                    </span>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#1d1d1f' }}>{formatMoney(plan.price)}</span>
                  {plan.price !== null && (
                    <span style={{ fontSize: '11px', color: '#86868b', marginLeft: '4px' }}>/ {plan.period}</span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#515154', lineHeight: '1.4', margin: 0, minHeight: '42px' }}>
                {plan.desc}
              </p>

              <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)', margin: '4px 0' }}></div>

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
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', color: '#424245' }}>
                    {getIcon("CheckCircle2", 13, plan.popular ? '#0071e3' : '#1d1d1f', { style: { marginTop: '2px', flexShrink: 0 } })}
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={onEnterLogin}
                style={{
                  background: plan.popular ? 'linear-gradient(135deg, #0071e3 0%, #0056b3 100%)' : '#f5f5f7',
                  color: plan.popular ? '#fff' : '#0071e3',
                  border: plan.popular ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s',
                  boxShadow: plan.popular ? '0 4px 12px rgba(0, 113, 227, 0.2)' : 'none',
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
        background: '#f5f5f7',
        borderTop: '1px solid rgba(0, 0, 0, 0.04)',
        padding: '80px 24px 100px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px', color: '#1d1d1f' }}>{faqsHeader.title}</h2>
            <p style={{ color: '#86868b', fontSize: '14px' }}>{faqsHeader.subtitle}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="glass-panel"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#1d1d1f' }}>{faq.q}</h4>
                  {getIcon("ChevronDown", 18, "#86868b", {
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
                    color: '#515154', 
                    lineHeight: '1.6',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    paddingTop: '12px'
                  }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#f5f5f7',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '32px 24px',
        textAlign: 'center',
        color: '#86868b',
        fontSize: '12px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong style={{ color: '#1d1d1f' }}>{footer.brandText}</strong>
          </div>
          <div>
            {footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
