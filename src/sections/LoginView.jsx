import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader, CheckCircle, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LoginView({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // OAuth simulated states
  const [oauthProvider, setOauthProvider] = useState(null); // 'google' or 'facebook'
  const [oauthStep, setOauthStep] = useState(0); // 0: closed, 1: connecting, 2: authenticating, 3: success

  // Check if Supabase has real config or placeholder values
  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY && 
    !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
    !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY');

  // Quick fill helper for Demo
  const handleQuickFill = () => {
    setEmail('contacto@ganancy.cl');
    setPassword('ganancy2026');
    setDisplayName('Admin Ganancy');
    setError('');
    setSuccessMessage('');
  };

  // Credentials Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!password) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (isSignUp && !displayName.trim()) {
      setError('Por favor, ingresa tu nombre completo.');
      return;
    }

    setIsLoading(true);

    // --- FALLBACK MOCK LOGIN (DEMO MODE) ---
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setIsLoading(false);
        const name = isSignUp ? displayName : email.split('@')[0];
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        
        if (isSignUp) {
          setSuccessMessage('¡Cuenta demo creada con éxito! Ya puedes iniciar sesión.');
          setIsSignUp(false);
          setPassword('');
          return;
        }

        const user = {
          email,
          displayName: (email === 'contacto@ganancy.cl' || email === 'metincacontacto@gmail.com') ? 'Admin Ganancy' : formattedName,
          avatarInitials: (email === 'contacto@ganancy.cl' || email === 'metincacontacto@gmail.com') ? 'GY' : formattedName.substring(0, 2).toUpperCase(),
          photoURL: null,
          subscription_status: (email === 'contacto@ganancy.cl' || email === 'metincacontacto@gmail.com') ? 'plan_completo' : 'trial',
          provider: 'local_demo'
        };

        onLogin(user);
      }, 1200);
      return;
    }

    // --- REAL SUPABASE AUTH ---
    try {
      if (isSignUp) {
        // REGISTER USER IN SUPABASE
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              avatar_initials: displayName.substring(0, 2).toUpperCase()
            }
          }
        });

        if (signUpError) throw signUpError;

        // If email confirmation is enabled, session won't be active immediately
        if (data.user && !data.session) {
          setSuccessMessage('¡Registro exitoso! Por favor verifica tu correo para activar tu cuenta.');
          setIsSignUp(false);
          setPassword('');
        } else if (data.session) {
          // If email confirmation is disabled, log them in directly
          const profileName = displayName || email.split('@')[0];
          const user = {
            id: data.user.id,
            email: data.user.email,
            displayName: profileName,
            avatarInitials: profileName.substring(0, 2).toUpperCase(),
            photoURL: null,
            subscription_status: 'trial',
            provider: 'supabase'
          };
          onLogin(user);
        }
      } else {
        // LOGIN USER IN SUPABASE
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        // Fetch custom user profile from public.profiles table
        let profile = null;
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (!profileError && profileData) {
            profile = profileData;
          }
        } catch (err) {
          console.warn("No se pudo obtener el perfil de la base de datos:", err);
        }

        const fallbackName = data.user.user_metadata?.display_name || email.split('@')[0];
        const user = {
          id: data.user.id,
          email: data.user.email,
          displayName: profile?.display_name || fallbackName,
          avatarInitials: profile?.avatar_initials || fallbackName.substring(0, 2).toUpperCase(),
          photoURL: profile?.avatar_url || null,
          subscription_status: profile?.subscription_status || 'trial',
          provider: 'supabase'
        };

        onLogin(user);
      }
    } catch (err) {
      console.error("Error de autenticación:", err);
      setError(err.message || 'Ocurrió un error inesperado al intentar iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth Simulation Flow (Keep as visually WOWing premium mockup, or link to real OAuth if set up)
  const startOauthFlow = (provider) => {
    if (isSupabaseConfigured) {
      setError("El inicio de sesión rápido con Google/Facebook está deshabilitado en el entorno de producción. Por favor, usa tu correo electrónico y contraseña.");
      return;
    }
    setOauthProvider(provider);
    setOauthStep(1); // Connecting...
  };

  useEffect(() => {
    if (oauthStep === 1) {
      const timer = setTimeout(() => setOauthStep(2), 700);
      return () => clearTimeout(timer);
    } else if (oauthStep === 2) {
      const timer = setTimeout(() => setOauthStep(3), 800);
      return () => clearTimeout(timer);
    } else if (oauthStep === 3) {
      const timer = setTimeout(() => {
        const emailMock = oauthProvider === 'google' ? 'user.google@ganancy.cl' : 'user.fb@ganancy.cl';
        const nameMock = oauthProvider === 'google' ? 'Google User' : 'Facebook User';
        const initials = oauthProvider === 'google' ? 'G' : 'F';
        
        const user = {
          email: emailMock,
          displayName: nameMock,
          avatarInitials: initials,
          provider: `${oauthProvider}_demo`,
          photoURL: null
        };
        
        onLogin(user);
        setOauthProvider(null);
        setOauthStep(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [oauthStep, oauthProvider, onLogin]);

  return (
    <div className="login-wrapper">
      <div className="login-background-elements">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="login-card glass-panel">
        {onBack && (
          <button 
            type="button" 
            onClick={onBack}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
              padding: 0,
              transition: 'color 0.2s'
            }}
          >
            ← Volver al Inicio
          </button>
        )}
        <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="/ganancy_logo_light.png" 
            alt="GANANCY" 
            style={{ height: '36px', width: 'auto', display: 'block', marginBottom: '12px' }} 
          />
          <p className="login-subtitle">Dashboard Financiero — Un producto de GANIMIDES</p>
        </div>

        {/* Warning Banner if Supabase is not configured yet */}
        {!isSupabaseConfigured && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgb(245, 158, 11)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '12px',
            color: 'rgb(245, 158, 11)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontWeight: 'bold' }}>⚠️ Modo Demo Activo (Supabase no configurado)</span>
            <span>La base de datos y cuentas reales no están conectadas. Para activarlas, edita el archivo `.env` con tus credenciales de Supabase.</span>
          </div>
        )}

        {error && (
          <div className="login-error-alert">
            <span className="error-message">{error}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgb(16, 185, 129)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            color: 'rgb(16, 185, 129)',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <div className="input-group">
              <label htmlFor="displayName">Nombre Completo</label>
              <div className="input-field-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="displayName"
                  type="text"
                  placeholder="Tu Nombre Completo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-field-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="nombre@ganancy.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label htmlFor="password">Contraseña</label>
            </div>
            <div className="input-field-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
            style={{
              background: isSignUp ? 'var(--success, #34c759)' : 'var(--accent, #0071e3)',
              color: '#ffffff',
              marginTop: '12px'
            }}
          >
            {isLoading ? (
              <span className="spinner-flex">
                <Loader size={18} className="spin-icon" /> Procesando...
              </span>
            ) : (
              isSignUp ? 'Crear Cuenta Real' : 'Iniciar Sesión'
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <span>{isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta aún?'} </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccessMessage('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '0'
            }}
          >
            {isSignUp ? 'Inicia Sesión aquí' : 'Regístrate aquí'}
          </button>
        </div>

        {!isSupabaseConfigured && !isSignUp && (
          <div className="demo-credentials-prompt" onClick={handleQuickFill}>
            <span>💡 ¿Probar Demo? Haz clic aquí para autocompletar.</span>
            <div className="credentials-chip">contacto@ganancy.cl / ganancy2026</div>
          </div>
        )}

        {!isSupabaseConfigured && (
          <>
            <div className="divider-container">
              <div className="divider-line"></div>
              <span className="divider-text">o continuar con</span>
              <div className="divider-line"></div>
            </div>

            <div className="social-login-grid">
              <button
                type="button"
                className="social-btn google-btn"
                onClick={() => startOauthFlow('google')}
                disabled={isLoading || oauthStep > 0}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              
              <button
                type="button"
                className="social-btn facebook-btn"
                onClick={() => startOauthFlow('facebook')}
                disabled={isLoading || oauthStep > 0}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>
          </>
        )}
      </div>

      {/* Simulated OAuth Overlay Modal */}
      {oauthStep > 0 && oauthProvider && (
        <div className="oauth-overlay">
          <div className="oauth-modal glass-panel animate-fade-in">
            {oauthStep === 1 && (
              <div className="oauth-step-content">
                <Loader className="spin-icon oauth-spinner" size={48} />
                <h3>Conectando con {oauthProvider === 'google' ? 'Google' : 'Facebook'}...</h3>
                <p>Estableciendo canal de autenticación seguro</p>
              </div>
            )}
            {oauthStep === 2 && (
              <div className="oauth-step-content">
                <Loader className="spin-icon oauth-spinner" size={48} style={{ color: 'var(--accent)' }} />
                <h3>Verificando Credenciales...</h3>
                <p>Recuperando perfil de usuario de {oauthProvider === 'google' ? 'Google' : 'Facebook'}</p>
              </div>
            )}
            {oauthStep === 3 && (
              <div className="oauth-step-content">
                <CheckCircle className="success-pulse" size={48} style={{ color: 'var(--success)' }} />
                <h3>¡Autenticación Exitosa!</h3>
                <p>Redirigiendo a tu dashboard financiero...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
