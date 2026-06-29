import React, { useState, useEffect } from 'react';
import { Users, FileText, ShieldAlert, Check, Edit2, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LandingEditorView from './LandingEditorView';

export default function AdminConsoleView({ 
  landingPageData, 
  onSaveLanding, 
  onResetLanding,
  onNavigateBack,
  theme
}) {
  const [activeTab, setActiveTab] = useState("usuarios"); // "usuarios" or "landing"
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all profiles from Supabase
  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*');
      
      if (fetchError) throw fetchError;
      
      setProfiles(data || []);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setError("No se pudieron cargar los perfiles. Asegúrate de configurar las políticas RLS en tu base de datos de Supabase para permitir a los administradores leer los perfiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "usuarios") {
      fetchProfiles();
    }
  }, [activeTab]);

  // Update subscription status for a user
  const handleUpdatePlan = async (userId, newPlan) => {
    setUpdatingUserId(userId);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: newPlan })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update local state
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, subscription_status: newPlan } : p));
    } catch (err) {
      console.error("Error updating user plan:", err);
      alert("No se pudo actualizar el plan del usuario.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Filter profiles based on search
  const filteredProfiles = profiles.filter(p => {
    const name = (p.display_name || "").toLowerCase();
    const email = (p.email || p.id || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const getPlanBadgeStyle = (status) => {
    switch (status) {
      case 'plan_familiar':
        return { bg: 'rgba(255, 149, 0, 0.15)', color: '#ff9500', label: 'Plan Familiar' };
      case 'plan_completo':
        return { bg: 'rgba(10, 132, 255, 0.15)', color: '#0a84ff', label: 'Plan Completo' };
      case 'plan_personal':
        return { bg: 'rgba(52, 199, 89, 0.15)', color: '#34c759', label: 'Plan Personal' };
      case 'trial':
        return { bg: 'rgba(90, 200, 250, 0.15)', color: '#5ac8fa', label: 'Prueba (7 días)' };
      case 'active':
        return { bg: 'rgba(175, 82, 222, 0.15)', color: '#af52de', label: 'Activo' };
      default:
        return { bg: 'rgba(142, 142, 147, 0.15)', color: '#8e8e93', label: status || 'Sin Plan' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Bar with Navigation & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onNavigateBack}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13.5px',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Consola de Super Administrador
            </h2>
            <p className="subtitle" style={{ margin: 0 }}>Gestión de la plataforma, usuarios y planes de suscripción</p>
          </div>
        </div>

        {/* Sub-tabs Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '2px',
          gap: '2px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
        }}>
          <button
            onClick={() => setActiveTab("usuarios")}
            style={{
              background: activeTab === "usuarios" ? 'var(--accent, #0a84ff)' : 'transparent',
              color: activeTab === "usuarios" ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={15} /> Gestión de Usuarios
          </button>
          <button
            onClick={() => setActiveTab("landing")}
            style={{
              background: activeTab === "landing" ? 'var(--accent, #0a84ff)' : 'transparent',
              color: activeTab === "landing" ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={15} /> Editar Landing
          </button>
        </div>
      </div>

      {activeTab === "usuarios" ? (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
            
            <button
              onClick={fetchProfiles}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              🔄 Recargar Lista
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255, 59, 48, 0.1)',
              border: '1px solid rgba(255, 59, 48, 0.2)',
              color: 'var(--danger)',
              padding: '14px 20px',
              borderRadius: '12px',
              fontSize: '13.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              Cargando usuarios registrados...
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              No se encontraron usuarios registrados.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Usuario</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Correo / ID</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Plan Actual</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Asignar Nuevo Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map(p => {
                    const badge = getPlanBadgeStyle(p.subscription_status);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt={p.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                (p.display_name || 'U').substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                              {p.display_name || 'Usuario sin nombre'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                          {p.email || p.id}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color
                          }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <select
                            value={p.subscription_status || 'trial'}
                            disabled={updatingUserId === p.id}
                            onChange={(e) => handleUpdatePlan(p.id, e.target.value)}
                            style={{
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="trial">Prueba de 7 días (Trial)</option>
                            <option value="plan_personal">Plan Personal</option>
                            <option value="plan_completo">Plan Completo (Personal + Negocio)</option>
                            <option value="plan_familiar">Plan Familiar (Multiusuario)</option>
                            <option value="plan_custom">Plan Custom</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <LandingEditorView 
          landingPageData={landingPageData}
          onSave={onSaveLanding}
          onReset={onResetLanding}
        />
      )}
    </div>
  );
}
