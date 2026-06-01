import React, { useState } from 'react';
import { 
  Sparkles, Save, RotateCcw, Eye, ArrowLeft, Settings, 
  Layers, CreditCard, HelpCircle, FileText, ChevronDown, ChevronUp,
  Plus, Trash2, Edit3, Image
} from 'lucide-react';
import LandingPageView from './LandingPageView';
import { LANDING_PAGE_DEFAULTS } from '../data/landingPageDefaults';

export default function LandingEditorView({ landingPageData, onSave, onReset }) {
  const [data, setData] = useState(() => {
    return JSON.parse(JSON.stringify(landingPageData || LANDING_PAGE_DEFAULTS));
  });

  const [activeTab, setActiveTab] = useState("hero"); // hero, features, pricing, faqs, footer
  const [activePlanIdx, setActivePlanIdx] = useState(0); // currently editing plan index

  // Icon options available for selection in dropdowns
  const iconOptions = [
    "Layers", "Sparkles", "ShieldCheck", "LineChart", "User", 
    "TrendingUp", "Briefcase", "Cpu", "HelpCircle", "FileText", 
    "Lock", "PieChart", "Activity", "DollarSign", "Globe", "Heart"
  ];

  // Forms changes handlers
  const updateHeroField = (field, value) => {
    setData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value
      }
    }));
  };

  const updateHeaderField = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateFeature = (index, field, value) => {
    setData(prev => {
      const updated = [...prev.features];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, features: updated };
    });
  };

  const updatePlan = (index, field, value) => {
    setData(prev => {
      const updated = [...prev.plans];
      if (field === 'features') {
        // value is comma-separated text string
        const list = value.split('\n').map(f => f.trim()).filter(Boolean);
        updated[index] = { ...updated[index], features: list };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, plans: updated };
    });
  };

  const updateFaq = (index, field, value) => {
    setData(prev => {
      const updated = [...prev.faqs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, faqs: updated };
    });
  };

  const addFaq = () => {
    setData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { q: "Nueva Pregunta", a: "Escribe la respuesta aquí." }]
    }));
  };

  const deleteFaq = (index) => {
    setData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, idx) => idx !== index)
    }));
  };

  const updateFooterField = (field, value) => {
    setData(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        [field]: value
      }
    }));
  };

  const handleImageUpload = (file, targetSection, targetField, maxWidth = 1024, maxHeight = 768) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        // Calculate dimensions to maintain aspect ratio within maxWidth/maxHeight
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        
        setData(prev => {
          if (targetSection === 'logoUrl') {
            return {
              ...prev,
              logoUrl: compressedBase64
            };
          } else {
            return {
              ...prev,
              [targetSection]: {
                ...prev[targetSection],
                [targetField]: compressedBase64
              }
            };
          }
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave(data);
    alert("¡Los cambios en la Landing Page se han publicado con éxito!");
  };

  const handleReset = () => {
    if (confirm("¿Estás seguro de que deseas restablecer la Landing Page al diseño original de GANANCY? Se perderán las personalizaciones actuales.")) {
      setData(JSON.parse(JSON.stringify(LANDING_PAGE_DEFAULTS)));
      onReset();
      alert("Diseño restablecido a valores por defecto.");
    }
  };

  return (
    <div className="landing-editor-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* HEADER CONTROL BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '16px 24px',
        backdropFilter: 'blur(var(--blur))',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '8px', borderRadius: '10px' }}>
            <Settings size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Consola de Administración de Landing</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Diseña y edita todo el sitio web de GANANCY de manera minimalista y fresca.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <RotateCcw size={16} /> Restablecer Plantilla
          </button>
          
          <button 
            onClick={handleSave}
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Save size={16} /> Publicar Cambios
          </button>
        </div>
      </div>

      {/* DUAL PANE EDITOR GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 1fr) 1.2fr',
        gap: '24px',
        alignItems: 'stretch',
        flex: 1
      }}>
        
        {/* LEFT COLUMN: CONTROL FORMS PANEL */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: 'calc(100vh - 220px)',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          
          {/* NAVIGATION ACCORDION CONTROLS */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(0,0,0,0.15)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'hero', label: '🚀 Hero', icon: Sparkles },
              { id: 'features', label: '✨ Ventajas', icon: Layers },
              { id: 'pricing', label: '💳 Planes', icon: CreditCard },
              { id: 'faqs', label: '❓ FAQs', icon: HelpCircle },
              { id: 'footer', label: '📝 Footer', icon: FileText }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    minWidth: '70px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <TabIcon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* EDITING FORM SECTION */}
          <div className="card glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', overflow: 'visible' }}>
            
            {/* 1. HERO SECTION FORM */}
            {activeTab === 'hero' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0, color: 'var(--accent)' }}>Editar Sección de Presentación (Hero)</h4>
                
                {/* LOGO UPLOADER SECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '8px' }}>
                  <h5 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Logo e Identidad de la Marca</h5>
                  
                  {/* Logo Preview on Dark Navbar Background */}
                  {(data.logoUrl || data.hero.logoUrl) && (
                    <div style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                      <img src={data.logoUrl || data.hero.logoUrl} alt="Logo" style={{ height: '24px', width: 'auto', display: 'block' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={data.logoUrl || data.hero.logoUrl || "/ganancy_logo_light.png"}
                      onChange={e => {
                        const val = e.target.value;
                        setData(prev => ({ ...prev, logoUrl: val }));
                      }}
                      placeholder="/ganancy_logo_light.png"
                      style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-input)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                    <label style={{
                      background: 'var(--accent)',
                      color: 'white',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background 0.2s'
                    }}>
                      <Image size={16} /> Subir Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => handleImageUpload(e.target.files[0], 'logoUrl', null, 512, 128)} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Recomendado usar un logo en blanco o con transparencia para contrastar con la barra azul del menú.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Eslogan Superior (Badge)</label>
                  <input
                    type="text"
                    value={data.hero.badge}
                    onChange={e => updateHeroField('badge', e.target.value)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-input)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Título Principal (H1)</label>
                  <textarea
                    rows="3"
                    value={data.hero.title}
                    onChange={e => updateHeroField('title', e.target.value)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-input)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Descripción / Párrafo del Hero</label>
                  <textarea
                    rows="4"
                    value={data.hero.desc}
                    onChange={e => updateHeroField('desc', e.target.value)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-input)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', lineHeight: '1.4', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Botón Principal (CTA)</label>
                    <input
                      type="text"
                      value={data.hero.ctaPrimary}
                      onChange={e => updateHeroField('ctaPrimary', e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-input)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Botón Secundario</label>
                    <input
                      type="text"
                      value={data.hero.ctaSecondary}
                      onChange={e => updateHeroField('ctaSecondary', e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-input)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Imagen Destacada (Concepto)</label>
                  
                  {/* Image Preview */}
                  {data.hero.imageUrl && (
                    <div style={{ marginBottom: '6px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '110px', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={data.hero.imageUrl} alt="Hero Concept Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={data.hero.imageUrl}
                      onChange={e => updateHeroField('imageUrl', e.target.value)}
                      style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-input)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'monospace' }}
                    />
                    <label style={{
                      background: 'var(--accent)',
                      color: 'white',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background 0.2s'
                    }}>
                      <Image size={16} /> Subir Foto
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => handleImageUpload(e.target.files[0], 'hero', 'imageUrl', 1024, 768)} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Recomendado subir un pantallazo o concepto de 1024x768px. Se comprimirá para optimizar la velocidad.</span>
                </div>
              </div>
            )}

            {/* 2. FEATURES SECTION FORM */}
            {activeTab === 'features' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0, color: 'var(--accent)' }}>Editar Títulos y Tarjetas de Ventajas</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Título de la Sección</label>
                    <input
                      type="text"
                      value={data.featuresHeader.title}
                      onChange={e => updateHeaderField('featuresHeader', 'title', e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Subtítulo / Bajada</label>
                    <input
                      type="text"
                      value={data.featuresHeader.subtitle}
                      onChange={e => updateHeaderField('featuresHeader', 'subtitle', e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Configuración de las 4 Ventajas Core:</span>
                
                {data.features.map((feat, idx) => (
                  <div key={feat.id} style={{
                    background: 'rgba(0,0,0,0.15)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent)' }}>Ventaja #{idx + 1}</span>
                      
                      {/* Icon selector dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Icono:</span>
                        <select
                          value={feat.iconName}
                          onChange={e => updateFeature(idx, 'iconName', e.target.value)}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', outline: 'none', cursor: 'pointer' }}
                        >
                          {iconOptions.map(ico => (
                            <option key={ico} value={ico}>{ico}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Título de la Ventaja</label>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={e => updateFeature(idx, 'title', e.target.value)}
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Descripción Corta</label>
                      <textarea
                        rows="2"
                        value={feat.desc}
                        onChange={e => updateFeature(idx, 'desc', e.target.value)}
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. PRICING PLANS FORM */}
            {activeTab === 'pricing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0, color: 'var(--accent)' }}>Editar Títulos y Tarifas de Suscripciones</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Título Sección de Precios</label>
                    <input
                      type="text"
                      value={data.pricingHeader.title}
                      onChange={e => updateHeaderField('pricingHeader', 'title', e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Subtítulo / Desc</label>
                    <input
                      type="text"
                      value={data.pricingHeader.subtitle}
                      onChange={e => updateHeaderField('pricingHeader', 'subtitle', e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

                {/* Plan select selector buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Seleccionar Plan a Modificar</label>
                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {data.plans.map((pl, idx) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setActivePlanIdx(idx)}
                        style={{
                          flexShrink: 0,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: activePlanIdx === idx ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                          background: activePlanIdx === idx ? 'var(--accent-light)' : 'transparent',
                          color: activePlanIdx === idx ? 'var(--accent)' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {pl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Plan Fields Form Editor */}
                {data.plans[activePlanIdx] && (
                  <div style={{
                    background: 'rgba(0,0,0,0.15)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>Editando: {data.plans[activePlanIdx].name}</span>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={data.plans[activePlanIdx].popular}
                          onChange={e => updatePlan(activePlanIdx, 'popular', e.target.checked)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        ¿Plan Destacado?
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Nombre del Plan</label>
                        <input
                          type="text"
                          value={data.plans[activePlanIdx].name}
                          onChange={e => updatePlan(activePlanIdx, 'name', e.target.value)}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Tag / Badge</label>
                        <input
                          type="text"
                          value={data.plans[activePlanIdx].tag || ""}
                          onChange={e => updatePlan(activePlanIdx, 'tag', e.target.value)}
                          placeholder="Ninguno"
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Precio Mensual ($ CLP)</label>
                        <input
                          type="number"
                          value={data.plans[activePlanIdx].price !== null ? data.plans[activePlanIdx].price : ""}
                          onChange={e => updatePlan(activePlanIdx, 'price', e.target.value === "" ? null : Number(e.target.value))}
                          placeholder="A Medida (Cotizar)"
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Periodo cobro</label>
                        <input
                          type="text"
                          value={data.plans[activePlanIdx].period}
                          onChange={e => updatePlan(activePlanIdx, 'period', e.target.value)}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Color Destacado</label>
                        <input
                          type="text"
                          value={data.plans[activePlanIdx].color || ""}
                          onChange={e => updatePlan(activePlanIdx, 'color', e.target.value)}
                          placeholder="#38bdf8"
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', outline: 'none', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Icono Lucide</label>
                        <select
                          value={data.plans[activePlanIdx].iconName || "User"}
                          onChange={e => updatePlan(activePlanIdx, 'iconName', e.target.value)}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                        >
                          {iconOptions.map(ico => (
                            <option key={ico} value={ico}>{ico}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Descripción del Plan</label>
                      <textarea
                        rows="2"
                        value={data.plans[activePlanIdx].desc}
                        onChange={e => updatePlan(activePlanIdx, 'desc', e.target.value)}
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Viñetas de Funcionalidades (Puntos)</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>1 punto por fila</span>
                      </label>
                      <textarea
                        rows="5"
                        value={(data.plans[activePlanIdx].features || []).join('\n')}
                        onChange={e => updatePlan(activePlanIdx, 'features', e.target.value)}
                        placeholder="Ej:&#10;Funcionalidad A&#10;Funcionalidad B"
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. FAQS SECTION FORM */}
            {activeTab === 'faqs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--accent)' }}>Editar Preguntas Frecuentes</h4>
                  <button
                    type="button"
                    onClick={addFaq}
                    style={{
                      background: 'rgba(52, 199, 89, 0.1)',
                      color: 'var(--success)',
                      border: '1px solid rgba(52, 199, 89, 0.2)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} /> Agregar FAQ
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Título de la Sección</label>
                    <input
                      type="text"
                      value={data.faqsHeader.title}
                      onChange={e => updateHeaderField('faqsHeader', 'title', e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Subtítulo / Desc</label>
                    <input
                      type="text"
                      value={data.faqsHeader.subtitle}
                      onChange={e => updateHeaderField('faqsHeader', 'subtitle', e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                  {data.faqs.map((faq, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(0,0,0,0.15)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative'
                    }}>
                      <button
                        type="button"
                        onClick={() => deleteFaq(idx)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Eliminar FAQ"
                      >
                        <Trash2 size={14} />
                      </button>

                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>Pregunta #{idx + 1}</span>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Pregunta</label>
                        <input
                          type="text"
                          value={faq.q}
                          onChange={e => updateFaq(idx, 'q', e.target.value)}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', paddingRight: '36px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Respuesta</label>
                        <textarea
                          rows="3"
                          value={faq.a}
                          onChange={e => updateFaq(idx, 'a', e.target.value)}
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' }}
                        />
                      </div>
                    </div>
                  ))}

                  {data.faqs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                      No tienes preguntas frecuentes guardadas. ¡Crea una haciendo clic arriba!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. FOOTER SECTION FORM */}
            {activeTab === 'footer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: 0, color: 'var(--accent)' }}>Editar Sección del Footer (Pie de Página)</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Descripción / Texto de la Marca</label>
                  <textarea
                    rows="3"
                    value={data.footer.brandText}
                    onChange={e => updateFooterField('brandText', e.target.value)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', lineHeight: '1.4', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Copyright / Leyes e Instituciones</label>
                  <textarea
                    rows="3"
                    value={data.footer.copyright}
                    onChange={e => updateFooterField('copyright', e.target.value)}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', lineHeight: '1.4', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: SCALED WEB DEVICE LIVE PREVIEW (WOW FEATURE) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: 'calc(100vh - 220px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '12.5px',
            color: 'var(--text-primary)',
            fontWeight: 500
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} color="var(--accent)" />
              Vista Previa en Vivo (Modo Dispositivo)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
              Escala: 65% (Filtro Adaptado)
            </span>
          </div>

          {/* Browser frame container */}
          <div style={{
            flex: 1,
            background: '#090d16',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            {/* Safari/Chrome Browser Top bar mockup */}
            <div style={{
              height: '36px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: '12px',
              flexShrink: 0
            }}>
              {/* Window control dots */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56', display: 'block' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e', display: 'block' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f', display: 'block' }}></span>
              </div>
              {/* Fake address bar */}
              <div style={{
                flex: 1,
                maxWidth: '300px',
                height: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                margin: '0 auto'
              }}>
                ganancy.cl
              </div>
            </div>

            {/* Scrollable scaled landing page canvas */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              position: 'relative'
            }}>
              
              {/* Scale canvas wrapper utilizing CSS transform to perfectly preview at 65% scale */}
              <div style={{
                width: '153.84%', // 100 / 0.65 to let it render standard desktop width inside scaled wrapper
                height: '153.84%',
                transform: 'scale(0.65)',
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
              }}>
                <LandingPageView 
                  onEnterLogin={() => alert("Simulando redirección a login en producción.")} 
                  landingPageData={data} 
                />
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
