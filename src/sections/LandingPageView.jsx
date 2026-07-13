import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LANDING_PAGE_DEFAULTS } from '../data/landingPageDefaults';
import { ContactContent } from './LegalContent';
import '../landing.css';

function Reveal({ children, className = '', as: Tag = 'div', delay = 0, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`gy-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const PLAN_FEATURE_ICON_RULES = [
  [/escáner|ocr/i, 'Camera'],
  [/flujo|vista consolidada/i, 'BarChart3'],
  [/deudas|tarjetas/i, 'CreditCard'],
  [/asesor|cfo/i, 'Bot'],
  [/visor tributario/i, 'Package'],
  [/gestor de activos/i, 'Wrench'],
  [/perfiles familiares/i, 'Users'],
  [/switcher/i, 'RefreshCw'],
  [/privacidad/i, 'Lock']
];

const getPlanFeatureIcon = (text) => {
  const match = PLAN_FEATURE_ICON_RULES.find(([pattern]) => pattern.test(text));
  return match ? match[1] : null;
};

const STEPS = [
  {
    num: '01',
    iconName: 'ScanLine',
    title: 'Registra en segundos',
    desc: 'Escanea una boleta con la IA o importa tu cartola y Excel. Ganancy hace el trabajo pesado por ti.'
  },
  {
    num: '02',
    iconName: 'Layers',
    title: 'Ganancy lo organiza',
    desc: 'Separa automáticamente lo personal de lo del negocio, calcula IVA y categoriza cada movimiento.'
  },
  {
    num: '03',
    iconName: 'LineChart',
    title: 'Decide con datos reales',
    desc: 'Consulta a tu CFO con IA, revisa tu flujo proyectado y toma decisiones antes de que el dinero se vaya.'
  }
];

export default function LandingPageView({ onEnterLogin, landingPageData }) {
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeLegalModal, setActiveLegalModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // PWA Install Prompt States
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  React.useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isIosDevice && !isStandalone) {
      setShowInstallBtn(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIosTip(!showIosTip);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('El usuario aceptó instalar la PWA');
      }
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    });
  };

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

  const getIcon = (name, size = 20, color = 'currentColor', extraProps = {}) => {
    const IconComponent = Icons[name] || Icons.HelpCircle;
    return <IconComponent size={size} color={color} {...extraProps} />;
  };

  const formatMoney = (val) => {
    if (val === null) return 'Cotizar';
    return 'US$' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0
    }).format(val);
  };

  const closeMenuAnd = (fn) => (...args) => {
    setMenuOpen(false);
    if (fn) fn(...args);
  };

  const bentoSpan = (idx) => ([0, 5].includes(idx) ? '' : 'gy-span-1');

  const bentoVariant = (idx) => {
    if (idx === 0) return 'gy-bento-featured-blue';
    if (idx === 5) return 'gy-bento-featured-dark';
    if (idx === 2) return 'gy-bento-featured-amber';
    return '';
  };

  const bentoIconColor = (idx) => {
    if (idx === 2) return 'var(--gy-ink)';
    if (idx === 0 || idx === 5) return '#fff';
    return 'var(--gy-blue)';
  };

  // Envuelve una frase dentro de un texto en <em> serif itálica para el
  // acento editorial del hero. Si la frase no aparece (ej. copy editado
  // desde el admin), devuelve el texto plano sin romper nada.
  const emphasize = (text, phrase) => {
    if (!text || !phrase) return text;
    const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <em className="gy-em">{text.slice(idx, idx + phrase.length)}</em>
        {text.slice(idx + phrase.length)}
      </>
    );
  };

  return (
    <div className="gy-landing">
      {/* HEADER */}
      <header className={`gy-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="gy-container gy-header-row">
          <img src={logoUrl || (scrolled ? '/ganancy_logo_light.png' : '/ganancy_logo_dark.png')} alt="GANANCY" className="gy-logo" />

          <div className="gy-header-right">
            <nav className="gy-nav">
              <a href="#features" className="gy-nav-link">Características</a>
              <a href="#pricing" className="gy-nav-link">Planes de Precios</a>
              <a href="#faqs" className="gy-nav-link">Preguntas Frecuentes</a>
            </nav>

            {showInstallBtn && (
              <div style={{ position: 'relative' }}>
                <button onClick={handleInstallClick} className="gy-btn gy-btn-md gy-btn-ghost-dark gy-install-btn">
                  <Icons.Download size={14} />
                  <span className="gy-install-text">Instalar App</span>
                </button>

                {showIosTip && (
                  <div className="gy-modal" style={{ position: 'absolute', top: '48px', right: 0, width: '260px', maxHeight: 'none', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px' }}>Instalar en iPhone</strong>
                      <button onClick={() => setShowIosTip(false)} className="gy-modal-close" style={{ position: 'static', width: '24px', height: '24px' }}>
                        <Icons.X size={13} />
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', lineHeight: '1.4', color: 'var(--gy-text-soft)' }}>
                      1. Presiona el botón de <strong>Compartir</strong> <Icons.Share2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> en Safari.<br />
                      2. Selecciona <strong>&quot;Añadir a la pantalla de inicio&quot;</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button onClick={onEnterLogin} className="gy-btn gy-btn-md gy-btn-dark-pill gy-header-desktop-cta">
              <span>Acceso Cliente</span>
              {getIcon('ArrowRight', 14)}
            </button>

            <button
              className="gy-menu-toggle"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <Icons.X size={18} /> : <Icons.Menu size={18} />}
            </button>
          </div>
        </div>

        <div className={`gy-mobile-panel ${menuOpen ? 'is-open' : ''}`}>
          <a href="#features" onClick={closeMenuAnd()}>Características</a>
          <a href="#pricing" onClick={closeMenuAnd()}>Planes de Precios</a>
          <a href="#faqs" onClick={closeMenuAnd()}>Preguntas Frecuentes</a>
          <button onClick={closeMenuAnd(onEnterLogin)} style={{ color: '#6fb4ff', fontWeight: 700 }}>
            Acceso Cliente
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="gy-hero">
        <div className="gy-aurora" />
        <div className="gy-sheen" />
        <div className="gy-hero-scrim" />
        <div className="gy-noise" />

        <div className="gy-hero-inner">
          {hero.badge && (
            <div className="gy-badge">
              {getIcon('Sparkles', 13, 'var(--gy-amber-light)')}
              <span>{hero.badge}</span>
            </div>
          )}

          <h1>{emphasize(hero.title, 'bajo control')}</h1>

          <p className="gy-hero-desc">{hero.desc}</p>

          <div className="gy-hero-actions">
            <button onClick={onEnterLogin} className="gy-btn gy-btn-lg gy-btn-primary">
              <span>{hero.ctaPrimary}</span>
              {getIcon('ArrowRight', 18)}
            </button>
            <a href="#pricing" className="gy-btn gy-btn-lg gy-btn-secondary">
              {hero.ctaSecondary}
            </a>
          </div>

          <div className="gy-trust-strip">
            <span>{getIcon('ShieldCheck', 14)} Datos encriptados</span>
            <span>{getIcon('RefreshCw', 13)} Cancela cuando quieras</span>
            <span>{getIcon('MapPin', 13)} Hecho para PYMEs y personas de todo el mundo</span>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="gy-steps-section">
        <div className="gy-container">
          <div className="gy-steps-grid">
            {STEPS.map((step, idx) => (
              <Reveal key={step.num} delay={idx * 90} className="gy-step-card" as="div">
                <div className="gy-step-icon">{getIcon(step.iconName, 24)}</div>
                <div className="gy-step-num">PASO {step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — BENTO */}
      <section id="features" className="gy-section gy-section-alt">
        <div className="gy-container">
          <Reveal className="gy-section-head">
            <span className="gy-eyebrow">{getIcon('Sparkles', 12, 'var(--gy-amber)')} Características</span>
            <h2>{featuresHeader.title}</h2>
            <p>{featuresHeader.subtitle}</p>
          </Reveal>

          <div className="gy-bento">
            {features.map((feat, idx) => (
              <Reveal
                key={feat.id}
                delay={(idx % 3) * 80}
                className={`gy-bento-card ${bentoSpan(idx)} ${bentoVariant(idx)}`}
                as="div"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
                }}
              >
                <div className="gy-bento-icon">{getIcon(feat.iconName, 21, bentoIconColor(idx))}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
                <button onClick={onEnterLogin} className="gy-bento-link">
                  Probar ahora {getIcon('ArrowRight', 14)}
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="gy-section gy-section-tight">
        <div className="gy-container">
          <Reveal className="gy-section-head">
            <span className="gy-eyebrow">{getIcon('Sparkles', 12, 'var(--gy-amber)')} Por qué existe Ganancy</span>
            <h2>Mezclar tus finanzas te puede salir caro</h2>
            <p>El SII cataloga los gastos mezclados como retiro encubierto. Ganancy separa todo desde el primer clic.</p>
          </Reveal>

          <div className="gy-split">
            <Reveal className="gy-split-card gy-bad">
              <div className="gy-split-icon">{getIcon('AlertTriangle', 22)}</div>
              <span className="gy-split-tag">Sin separar tus finanzas</span>
              <h3>El desorden que preocupa al SII</h3>
              <p>Pagar la mercadería del negocio con tu cuenta personal, o el súper de tu casa con la cuenta de la empresa, se cataloga como retiro encubierto o gasto rechazado.</p>
              <ul className="gy-split-list">
                <li><span className="gy-split-check">{getIcon('X', 14)}</span> Multas y créditos de IVA perdidos</li>
                <li><span className="gy-split-check">{getIcon('X', 14)}</span> Boletas sueltas y difíciles de auditar</li>
                <li><span className="gy-split-check">{getIcon('X', 14)}</span> Todo mezclado en hojas de cálculo</li>
              </ul>
            </Reveal>

            <Reveal delay={100} className="gy-split-card gy-good">
              <div className="gy-split-icon">{getIcon('ShieldCheck', 22)}</div>
              <span className="gy-split-tag">Con Ganancy</span>
              <h3>Control absoluto, a un click</h3>
              <p>Aísla tus cuentas contables al instante, respalda cada boleta para una fiscalización y consulta tu CFO con IA antes de tomar una decisión.</p>
              <ul className="gy-split-list">
                <li><span className="gy-split-check">{getIcon('CheckCircle2', 14)}</span> Aislamiento contable 1-click</li>
                <li><span className="gy-split-check">{getIcon('CheckCircle2', 14)}</span> Boletas respaldadas y listas para el SII</li>
                <li><span className="gy-split-check">{getIcon('CheckCircle2', 14)}</span> IA que calcula RUT, montos e IVA por ti</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="gy-section gy-section-alt">
        <div className="gy-container">
          <Reveal className="gy-section-head">
            <span className="gy-eyebrow">{getIcon('Sparkles', 12, 'var(--gy-amber)')} Precios</span>
            <h2>{pricingHeader.title}</h2>
            <p>{pricingHeader.subtitle}</p>
          </Reveal>

          <div className="gy-pricing-grid">
            {plans.map((plan, idx) => (
              <Reveal key={plan.id} delay={idx * 100} className={`gy-plan-card ${plan.popular ? 'gy-popular' : ''}`}>
                {plan.tag && <div className="gy-plan-tag">{plan.tag}</div>}

                <div className="gy-plan-head">
                  <div className="gy-plan-icon">{getIcon(plan.iconName || 'User', 19)}</div>
                  <h3>{plan.name}</h3>
                </div>

                <div>
                  {plan.originalPrice && (
                    <div className="gy-price-row" style={{ marginBottom: '2px' }}>
                      <span className="gy-price-old">{formatMoney(plan.originalPrice)}</span>
                      <span className="gy-price-badge">Lanzamiento</span>
                    </div>
                  )}
                  <div className="gy-price-row">
                    <span className="gy-price-now">{formatMoney(plan.price)}</span>
                    {plan.price !== null && <span className="gy-price-period">/ {plan.period}</span>}
                  </div>
                </div>

                <p className="gy-plan-desc">{plan.desc}</p>

                <div className="gy-plan-divider" />

                <ul className="gy-plan-features">
                  {(plan.features || []).map((feat, i) => {
                    const featIcon = getPlanFeatureIcon(feat);
                    return (
                      <li key={i}>
                        <span className="gy-plan-check">{getIcon('Check', 15, 'var(--gy-amber)')}</span>
                        {featIcon && (
                          <span className="gy-plan-feat-icon">{getIcon(featIcon, 14, 'var(--gy-amber)')}</span>
                        )}
                        <span>{feat}</span>
                      </li>
                    );
                  })}
                </ul>

                <button onClick={onEnterLogin} className={`gy-btn ${plan.popular ? 'gy-btn-primary' : 'gy-btn-secondary'}`} style={{ width: '100%', marginTop: '4px' }}>
                  {plan.price === null ? 'Contactar Ventas' : 'Suscribirme al Plan'}
                </button>
              </Reveal>
            ))}
          </div>

          <div className="gy-guarantee-row">
            {getIcon('ShieldCheck', 16, 'var(--gy-blue)')}
            Garantía de devolución de 14 días · Cancela cuando quieras, sin contratos forzosos
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section id="faqs" className="gy-section">
        <div className="gy-container">
          <Reveal className="gy-section-head">
            <span className="gy-eyebrow">{getIcon('Sparkles', 12, 'var(--gy-amber)')} Dudas frecuentes</span>
            <h2>{faqsHeader.title}</h2>
            <p>{faqsHeader.subtitle}</p>
          </Reveal>

          <div className="gy-faq-list">
            {faqs.map((faq, index) => (
              <Reveal key={index} delay={index * 60} className={`gy-faq-item ${activeFaq === index ? 'is-open' : ''}`}>
                <button
                  className="gy-faq-trigger"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  aria-expanded={activeFaq === index}
                >
                  <h4>{faq.q}</h4>
                  {getIcon('ChevronDown', 18)}
                </button>
                <div className="gy-faq-answer-wrap">
                  <div className="gy-faq-answer-inner">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="gy-final-cta">
        <div className="gy-aurora" style={{ opacity: 0.7 }} />
        <div className="gy-sheen" />
        <div className="gy-container">
          <h2>Tu dinero, finalmente <em className="gy-em">bajo control</em></h2>
          <p>Prueba Ganancy gratis y separa tus finanzas personales de tu negocio hoy mismo.</p>
          <div className="gy-hero-actions">
            <button onClick={onEnterLogin} className="gy-btn gy-btn-lg gy-btn-primary">
              <span>{hero.ctaPrimary}</span>
              {getIcon('ArrowRight', 18)}
            </button>
            <a href="#pricing" className="gy-btn gy-btn-lg gy-btn-ghost-dark">
              {hero.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="gy-footer">
        <div className="gy-container gy-footer-inner">
          <div className="gy-footer-brand">{footer.brandText}</div>
          <div className="gy-footer-copy">{footer.copyright}</div>
          <div className="gy-footer-links">
            <a href="/terminos">Términos de Servicio</a>
            <a href="/privacidad">Política de Privacidad</a>
            <a href="/reembolsos">Política de Reembolsos</a>
            <button onClick={() => setActiveLegalModal('contact')}>Contacto y Soporte</button>
          </div>
        </div>
      </footer>

      {/* LEGAL MODALS */}
      {activeLegalModal && (
        <div className="gy-modal-overlay" onClick={() => setActiveLegalModal(null)}>
          <div className="gy-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveLegalModal(null)} className="gy-modal-close">
              <Icons.X size={16} />
            </button>

            <h3>Contacto y Soporte</h3>

            <div className="gy-modal-body">
              <ContactContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
