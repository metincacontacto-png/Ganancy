import React, { useState, useEffect } from 'react';
import { Sun, Moon, LayoutDashboard, Database, Calendar, CreditCard, TrendingUp, RotateCcw, Loader, ShieldCheck, Sparkles, Settings, User, Mail, X } from 'lucide-react';
import { PASIVOS_DATA, ACTIVOS_DATA, INGRESOS_FIJOS, EGRESOS_FIJOS, HISTORICAL_FLOWS, MONTH_DETAILS } from './data/financialData';
import DashboardView from './sections/DashboardView';
import ActivosPasivosView from './sections/ActivosPasivosView';
import FlujoMensualView from './sections/FlujoMensualView';
import DeudasView from './sections/DeudasView';
import ProyeccionView from './sections/ProyeccionView';
import LoginView from './sections/LoginView';
import SubscriptionView from './sections/SubscriptionView';
import LandingPageView from './sections/LandingPageView';
import LandingEditorView from './sections/LandingEditorView';
import { LANDING_PAGE_DEFAULTS } from './data/landingPageDefaults';

import { supabase } from './lib/supabaseClient';
import { fetchAllUserData, initializeDefaultUserData } from './lib/financialService';

// Helper to automatically mark past installments as paid based on elapsed months since start date
function adjustDebtsPaidInstallments(debts) {
  if (!Array.isArray(debts)) return [];
  const today = new Date();
  return debts.map(debt => {
    if (debt.tipo !== 'fija' || !debt.fechaInicio || !debt.cuotasTotales || debt.cuotasTotales <= 1) {
      return debt;
    }
    const startDate = new Date(debt.fechaInicio + "T00:00:00");
    if (isNaN(startDate.getTime())) return debt;

    // Calculate elapsed months since start date
    let elapsedMonths = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
    if (elapsedMonths < 0) elapsedMonths = 0;
    if (elapsedMonths > debt.cuotasTotales) elapsedMonths = debt.cuotasTotales;

    // Build the new cuotas array
    const cuotasArray = Array.isArray(debt.cuotas) ? debt.cuotas : [];
    const newCuotas = [...cuotasArray];
    while (newCuotas.length < debt.cuotasTotales) {
      newCuotas.push(false);
    }

    // Automatically mark all past installments as paid (true)
    let changed = false;
    for (let i = 0; i < elapsedMonths; i++) {
      if (!newCuotas[i]) {
        newCuotas[i] = true;
        changed = true;
      }
    }

    const paidCount = newCuotas.filter(Boolean).length;
    const completed = paidCount === debt.cuotasTotales;

    if (changed || debt.cuotaActual !== paidCount || debt.completed !== completed) {
      return {
        ...debt,
        cuotas: newCuotas,
        cuotaActual: paidCount,
        completed
      };
    }
    return debt;
  });
}

export default function App() {
  // 1. Assets State (Categorized + Total)
  const [assetsState, setAssetsState] = useState(() => {
    const saved = localStorage.getItem('assets_data');
    if (saved) return JSON.parse(saved);
    // Start at empty ($0) by default for a clean slate. Users can load demo template anytime!
    return { total: 0, categories: ACTIVOS_DATA.categories.map(c => ({ ...c, total: 0, items: [] })) };
  });

  // 2. Debts State with Interest and Categories (fija vs pago_unico)
  const [debtsState, setDebtsState] = useState(() => {
    const saved = localStorage.getItem('debts_data');
    if (saved) return adjustDebtsPaidInstallments(JSON.parse(saved));
    return []; // Empty by default for new real users
  });

  // 3. Recurring Incomes State
  const [ingresosFijosState, setIngresosFijosState] = useState(() => {
    const saved = localStorage.getItem('ingresos_fijos');
    if (saved) return JSON.parse(saved);
    return []; // Empty by default
  });

  // 4. Recurring Expenses State
  const [egresosFijosState, setEgresosFijosState] = useState(() => {
    const saved = localStorage.getItem('egresos_fijos');
    if (saved) return JSON.parse(saved);
    return []; // Empty by default
  });

  // Recurring Variables Incomes State
  const [ingresosVariablesState, setIngresosVariablesState] = useState(() => {
    const saved = localStorage.getItem('ingresos_variables');
    if (saved) return JSON.parse(saved);
    return []; // Empty by default
  });

  // Recurring Variables Expenses State
  const [egresosVariablesState, setEgresosVariablesState] = useState(() => {
    const saved = localStorage.getItem('egresos_variables');
    if (saved) return JSON.parse(saved);
    return []; // Empty by default
  });

  // 5. Historical Monthly Flows State (Dynamic)
  const [historicalFlowsState, setHistoricalFlowsState] = useState(() => {
    const saved = localStorage.getItem('historical_flows');
    if (saved) return JSON.parse(saved);
    return []; // Empty by default
  });

  // 6. Monthly Detailed Transactions State (Dynamic)
  const [monthlyDetailsState, setMonthlyDetailsState] = useState(() => {
    const saved = localStorage.getItem('monthly_details');
    if (saved) return JSON.parse(saved);
    return {}; // Empty by default
  });

  // 7. Navigation Tab & Theme
  const [activeTab, setActiveTab] = useState("dashboard");
  const [subscriptionSubTab, setSubscriptionSubTab] = useState("perfil");
  const [footerModalType, setFooterModalType] = useState(null); // 'faqs', 'privacidad', 'terminos', 'soporte'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  // Profile modals and dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showManageProfilesModal, setShowManageProfilesModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 8. User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && (u.email === 'contacto@ganancy.cl' || u.email === 'metincacontacto@gmail.com')) {
          u.subscription_status = 'plan_completo';
        }
        return u;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 9. SaaS Database Loading State
  const [isDataLoading, setIsDataLoading] = useState(false);

  // 10. Public Landing / Context states
  const [showLogin, setShowLogin] = useState(false);
  const [currentContext, setCurrentContext] = useState('consolidado'); // 'consolidado', 'empresa', 'personal'
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('family_profiles');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Principal (Tú)', color: '#0a84ff' }];
  });
  const [activeProfileId, setActiveProfileId] = useState(() => {
    const saved = localStorage.getItem('active_profile_id');
    return saved || 'default';
  });

  useEffect(() => {
    localStorage.setItem('family_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('active_profile_id', activeProfileId);
  }, [activeProfileId]);

  const [pendingMigration, setPendingMigration] = useState(null); // { previousMonth, newMonth, items: [...] }
  const [migrationActions, setMigrationActions] = useState({});
  const migrateLandingData = (data) => {
    if (!data) return LANDING_PAGE_DEFAULTS;
    let modified = false;
    
    // Check if plan_personal exists to migrate
    if (data.plans && data.plans.some(p => p.id === 'plan_personal')) {
      data.plans = data.plans.filter(p => p.id !== 'plan_personal');
      
      // Update plan_completo features and name
      const completoIdx = data.plans.findIndex(p => p.id === 'plan_completo');
      if (completoIdx !== -1) {
        data.plans[completoIdx].name = "Plan Único (Personal + Negocio)";
        data.plans[completoIdx].tag = "Más Recomendado";
        
        const newFeatures = [
          "Control de ingresos y egresos personales",
          "Gestión de deudas y cuotas individuales",
          "Bloqueo absoluto de vistas de Negocio"
        ];
        
        let currentFeats = data.plans[completoIdx].features || [];
        // Remove restrictions since they are no longer applicable
        currentFeats = currentFeats.filter(f => !f.includes('🚫'));
        
        data.plans[completoIdx].features = [
          ...newFeatures,
          ...currentFeats.filter(f => !newFeatures.includes(f))
        ];
      }
      modified = true;
    }

    if (data.hero && data.hero.title === "Detén la mezcla de dinero que frena el crecimiento de tu negocio") {
      data.hero.title = "Ganancy Organiza y controla tus finanzas.";
      modified = true;
    }

    if (modified) {
      try {
        localStorage.setItem('landing_page_data', JSON.stringify(data));
      } catch (e) {
        console.error("Error al guardar localmente los datos migrados:", e);
      }
    }
    return data;
  };

  const [landingPageData, setLandingPageData] = useState(() => {
    const saved = localStorage.getItem('landing_page_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return migrateLandingData(parsed);
      } catch (e) {
        return LANDING_PAGE_DEFAULTS;
      }
    }
    return LANDING_PAGE_DEFAULTS;
  });

  // 11. Supabase Config Detection and Global OAuth Listener
  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY && 
    !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
    !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY');

  // Load landing config from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const fetchLandingConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('landing_config')
          .select('data')
          .eq('id', 'default')
          .maybeSingle();
        if (data && data.data) {
          setLandingPageData(migrateLandingData(data.data));
        }
      } catch (err) {
        console.warn("No se pudo obtener la configuración de la landing desde Supabase:", err);
      }
    };
    fetchLandingConfig();
  }, [isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const handleAuthUser = async (supabaseUser) => {
      if (!supabaseUser) return;
      
      let profile = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        if (!profileError && profileData) {
          profile = profileData;
        }
      } catch (err) {
        console.warn("No se pudo obtener el perfil de la base de datos:", err);
      }

      const email = supabaseUser.email;
      const fallbackName = supabaseUser.user_metadata?.display_name || email?.split('@')[0] || 'Usuario';
      
      const user = {
        id: supabaseUser.id,
        email: email,
        displayName: profile?.display_name || fallbackName,
        avatarInitials: profile?.avatar_initials || fallbackName.substring(0, 2).toUpperCase(),
        photoURL: profile?.avatar_url || null,
        subscription_status: profile?.subscription_status || 'trial',
        provider: 'supabase'
      };

      setCurrentUser(user);
    };

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthUser(session.user);
      }
    });

    // Listen to session changes (OAuth login, signouts, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        handleAuthUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  // Handle /super-admin routing
  useEffect(() => {
    const handleUrlCheck = () => {
      const isSuperAdmin = window.location.pathname === '/super-admin' || window.location.hash === '#/super-admin';
      if (isSuperAdmin) {
        if (!currentUser) {
          setShowLogin(true);
        } else if (currentUser.email === 'contacto@ganancy.cl' || currentUser.email === 'metincacontacto@gmail.com') {
          setActiveTab("editor_landing");
        }
      }
    };

    handleUrlCheck();
    window.addEventListener('hashchange', handleUrlCheck);
    return () => window.removeEventListener('hashchange', handleUrlCheck);
  }, [currentUser]);

  const getProfileIdFromName = (name) => {
    if (!name) return 'default';
    if (name.includes(' ||| ')) {
      const parts = name.split(' ||| ');
      const meta = parts[1];
      if (meta.startsWith('profile:')) {
        return meta.substring(8);
      }
    }
    return 'default';
  };

  // Reactive filters based on Context Switcher
  const filterByActiveContext = React.useCallback((list) => {
    if (!list) return [];
    if (currentContext === 'empresa') {
      return list.filter(item => !item.name.includes('[Personal]'));
    } else if (currentContext === 'personal') {
      const personalItems = list.filter(item => item.name.includes('[Personal]'));
      if (activeProfileId === 'family_consolidated') {
        return personalItems;
      }
      return personalItems.filter(item => {
        const itemProfileId = getProfileIdFromName(item.name);
        return itemProfileId === activeProfileId;
      });
    }
    return list;
  }, [currentContext, activeProfileId]);

  const tagWithActiveContext = React.useCallback((name, explicitContext) => {
    if (!name) return "";
    const targetCtx = explicitContext || currentContext;
    
    const parts = name.split(' ||| ');
    let baseName = parts[0];
    
    if (baseName.includes('[Personal]') || baseName.includes('[Empresa]')) {
      return name;
    }

    const contextSuffix = targetCtx === 'personal' ? ' [Personal]' : ' [Empresa]';
    const newParts = [baseName + contextSuffix];
    
    let hasProfile = false;
    for (let i = 1; i < parts.length; i++) {
      newParts.push(parts[i]);
      if (parts[i].startsWith('profile:')) {
        hasProfile = true;
      }
    }
    
    if (targetCtx === 'personal' && !hasProfile) {
      const profileIdToUse = activeProfileId === 'family_consolidated' ? 'default' : activeProfileId;
      newParts.push(`profile:${profileIdToUse}`);
    }
    
    return newParts.join(' ||| ');
  }, [currentContext, activeProfileId]);

  // Apply context filters to fixed and variable list states
  const filteredIngresosFijos = React.useMemo(() => filterByActiveContext(ingresosFijosState), [ingresosFijosState, filterByActiveContext]);
  const filteredEgresosFijos = React.useMemo(() => filterByActiveContext(egresosFijosState), [egresosFijosState, filterByActiveContext]);
  const filteredIngresosVariables = React.useMemo(() => filterByActiveContext(ingresosVariablesState), [ingresosVariablesState, filterByActiveContext]);
  const filteredEgresosVariables = React.useMemo(() => filterByActiveContext(egresosVariablesState), [egresosVariablesState, filterByActiveContext]);

  const parseMonthYear = React.useCallback((str) => {
    if (!str) return new Date();
    const parts = str.split(' ');
    const abbr = parts[0];
    const yr = parseInt(parts[1], 10);
    const monthMap = {
      "Ene": 0, "Feb": 1, "Mar": 2, "Abr": 3, "May": 4, "Jun": 5,
      "Jul": 6, "Ago": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dic": 11,
      "Mayo": 4
    };
    return new Date(yr, monthMap[abbr] !== undefined ? monthMap[abbr] : 0, 1);
  }, []);

  const getMonthDistance = React.useCallback((startMonth, endMonth) => {
    const start = parseMonthYear(startMonth);
    const end = parseMonthYear(endMonth);
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }, [parseMonthYear]);

  const getStartMonth = React.useCallback((debt) => {
    if (debt.startMonth) return debt.startMonth;
    const match = debt.details && debt.details.match(/\[StartMonth:\s*([^\]\s]+)\s*(\d+)\]/);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
    const baseMonth = "May 2026";
    const date = parseMonthYear(baseMonth);
    const cuotaAct = debt.cuotaActual || 0;
    date.setMonth(date.getMonth() - cuotaAct);
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }, [parseMonthYear]);

  const filteredMonthlyDetails = React.useMemo(() => {
    const res = {};
    const exclusions = {}; // month -> Set of excluded IDs
    
    // 1. Copiar los detalles existentes y detectar exclusiones
    Object.keys(monthlyDetailsState).forEach(month => {
      const monthObj = monthlyDetailsState[month] || { ingresos: [], egresos: [] };
      exclusions[month] = new Set();
      
      const cleanIngresos = [];
      const cleanEgresos = [];
      
      (monthObj.ingresos || []).forEach(it => {
        if (it.name && it.name.startsWith('__EXCLUDED__')) {
          const excludedId = it.name.replace('__EXCLUDED__', '');
          exclusions[month].add(excludedId);
        } else {
          cleanIngresos.push(it);
        }
      });
      
      (monthObj.egresos || []).forEach(it => {
        if (it.name && it.name.startsWith('__EXCLUDED__')) {
          const excludedId = it.name.replace('__EXCLUDED__', '');
          exclusions[month].add(excludedId);
        } else {
          cleanEgresos.push(it);
        }
      });
      
      res[month] = {
        ingresos: cleanIngresos,
        egresos: cleanEgresos
      };
    });
    
    // Obtener los meses ordenados cronológicamente
    const sortedMonths = Object.keys(res).sort((a, b) => parseMonthYear(a) - parseMonthYear(b));
    if (sortedMonths.length === 0) return res;

    // Estructuras para acumular montos impagos de deudas en cuotas
    const accumulatedUnpaid = {}; // debtId -> count of unpaid installments
    
    // 2. Procesar mes a mes cronológicamente para inyectar deudas de cuotas y arrastrar saldos
    sortedMonths.forEach(month => {
      debtsState.forEach(debt => {
        const suffix = debt.context === 'personal' ? ' [Personal]' : ' [Empresa]';
        const taggedName = debt.name.includes('[Personal]') || debt.name.includes('[Empresa]') 
          ? debt.name 
          : debt.name + suffix;

        // Caso A: Deudas con Cuotas (fija)
        if (debt.tipo === "fija" || (debt.cuotasTotales && debt.cuotasTotales > 1)) {
          const startMonth = getStartMonth(debt);
          const index_M = getMonthDistance(startMonth, month);
          
          if (index_M >= 0 && index_M < debt.cuotasTotales) {
            const virtualId = `debt_virtual_${debt.id}_${index_M}`;
            if (exclusions[month] && exclusions[month].has(virtualId)) {
              return;
            }
            const isCurrentPaid = debt.cuotas && debt.cuotas[index_M];
            const prevUnpaidCount = accumulatedUnpaid[debt.id] || 0;
            
            if (isCurrentPaid) {
              // Si la cuota de este mes está pagada, se agrega con su valor normal
              res[month].egresos.push({
                id: `debt_virtual_${debt.id}_${index_M}`,
                name: taggedName,
                value: debt.montoMensual || 0,
                paid: true,
                isVariable: false,
                dueDate: "",
                isDebtLink: true,
                cuotaIndex: index_M,
                debtId: debt.id
              });
            } else {
              // Si no está pagada, el monto se suma al acumulado
              const totalUnpaidCountForThisMonth = prevUnpaidCount + 1;
              const totalValueDue = (debt.montoMensual || 0) * totalUnpaidCountForThisMonth;
              
              const labelNote = prevUnpaidCount > 0 
                ? ` (Incluye ${prevUnpaidCount} cuota${prevUnpaidCount > 1 ? 's' : ''} anterior${prevUnpaidCount > 1 ? 'es' : ''} impaga${prevUnpaidCount > 1 ? 's' : ''})` 
                : "";

              res[month].egresos.push({
                id: `debt_virtual_${debt.id}_${index_M}`,
                name: taggedName + labelNote,
                value: totalValueDue,
                paid: false,
                isVariable: false,
                dueDate: "",
                isDebtLink: true,
                cuotaIndex: index_M,
                debtId: debt.id,
                unpaidCount: totalUnpaidCountForThisMonth
              });
              
              // Arrastrar el saldo impago para el siguiente mes
              accumulatedUnpaid[debt.id] = totalUnpaidCountForThisMonth;
            }
          }
        }
        
        // Caso B: Pago Único (one-off)
        if (debt.tipo === "pago_unico" && debt.fechaVencimiento) {
          const date = new Date(debt.fechaVencimiento + "T00:00:00");
          if (!isNaN(date.getTime())) {
            const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const debtMonth = `${months[date.getMonth()]} ${date.getFullYear()}`;
            
            if (debtMonth === month) {
              const virtualId = `debt_virtual_${debt.id}`;
              if (exclusions[month] && exclusions[month].has(virtualId)) {
                return;
              }
              res[month].egresos.push({
                id: virtualId,
                name: taggedName,
                value: debt.total || 0,
                paid: debt.completed,
                isVariable: true,
                dueDate: debt.fechaVencimiento,
                isDebtLink: true,
                debtId: debt.id
              });
            }
          }
        }
      });
    });

    // 3. Aplicar filtro de contexto activo
    const filteredRes = {};
    Object.keys(res).forEach(month => {
      filteredRes[month] = {
        ingresos: filterByActiveContext(res[month].ingresos),
        egresos: filterByActiveContext(res[month].egresos)
      };
    });
    
    return filteredRes;
  }, [monthlyDetailsState, debtsState, filterByActiveContext, parseMonthYear, getMonthDistance, getStartMonth]);

  const filteredHistoricalFlows = React.useMemo(() => {
    return historicalFlowsState.map(flow => {
      const monthDetails = filteredMonthlyDetails[flow.month] || { ingresos: [], egresos: [] };
      const totalIng = monthDetails.ingresos.reduce((sum, item) => sum + item.value, 0);
      const totalEgr = monthDetails.egresos.reduce((sum, item) => sum + item.value, 0);
      return {
        ...flow,
        ingresos: totalIng,
        egresos: totalEgr,
        balance: totalIng - totalEgr
      };
    });
  }, [historicalFlowsState, filteredMonthlyDetails]);

  // Apply context filters to assetsState
  const filteredAssetsState = React.useMemo(() => {
    const categories = assetsState.categories.map(cat => {
      const filteredItems = filterByActiveContext(cat.items);
      const catTotal = filteredItems.reduce((sum, item) => sum + item.value, 0);
      return {
        ...cat,
        items: filteredItems,
        total: catTotal
      };
    });
    const total = categories.reduce((sum, cat) => sum + cat.total, 0);
    return { total, categories };
  }, [assetsState, filterByActiveContext]);

  // Apply context filters to debtsState
  const filteredDebtsState = React.useMemo(() => {
    return filterByActiveContext(debtsState);
  }, [debtsState, filterByActiveContext]);

  // Sync Supabase Database if authenticated via Supabase
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.provider === 'supabase') {
      const syncCloudData = async () => {
        setIsDataLoading(true);
        try {
          // Fetch full database blocks first
          const dbData = await fetchAllUserData(currentUser.id);

          // Check if there is any financial data populated in the cloud
          const hasCloudData = 
            (dbData.assetsState.categories.some(c => c.items.length > 0)) ||
            (dbData.debtsState.length > 0) ||
            (dbData.ingresosFijosState.length > 0) ||
            (dbData.egresosFijosState.length > 0) ||
            (dbData.ingresosVariablesState.length > 0) ||
            (dbData.egresosVariablesState.length > 0) ||
            (dbData.historicalFlowsState.length > 0) ||
            (Object.keys(dbData.monthlyDetailsState).some(m => 
              dbData.monthlyDetailsState[m].ingresos.length > 0 || 
              dbData.monthlyDetailsState[m].egresos.length > 0
            ));

          if (!hasCloudData) {
            // NEW USER IN CLOUD: As requested, the system starts completely at $0!
            // No automatic default seeding is triggered.
            console.log("Nuevo usuario en la nube. Iniciando sistema limpio en $0.");
            
            // Set empty initial state to bypass mock templates
            setAssetsState({ total: 0, categories: ACTIVOS_DATA.categories.map(c => ({ ...c, total: 0, items: [] })) });
            setDebtsState([]);
            setIngresosFijosState([]);
            setEgresosFijosState([]);
            setIngresosVariablesState([]);
            setEgresosVariablesState([]);
            setHistoricalFlowsState([]);
            setMonthlyDetailsState({});
          } else {
            // Existing user: Load all database states
            setAssetsState(dbData.assetsState);
            setDebtsState(adjustDebtsPaidInstallments(dbData.debtsState));
            setIngresosFijosState(dbData.ingresosFijosState);
            setEgresosFijosState(dbData.egresosFijosState);
            setIngresosVariablesState(dbData.ingresosVariablesState);
            setEgresosVariablesState(dbData.egresosVariablesState);
            setHistoricalFlowsState(dbData.historicalFlowsState);
            setMonthlyDetailsState(dbData.monthlyDetailsState);
          }
        } catch (err) {
          console.error("Error sincronizando base de datos Supabase:", err);
          alert("Error al cargar los datos financieros de la nube. Utilizando modo local temporalmente.");
        } finally {
          setIsDataLoading(false);
        }
      };

      syncCloudData();
    }
  }, [currentUser]);

  // Local Storage Sync Effects (Only run for Demo/Local Users)
  useEffect(() => {
    if (currentUser?.provider !== 'supabase') {
      localStorage.setItem('assets_data', JSON.stringify(assetsState));
    }
  }, [assetsState, currentUser]);

  useEffect(() => {
    if (currentUser?.provider !== 'supabase') {
      localStorage.setItem('debts_data', JSON.stringify(debtsState));
    }
  }, [debtsState, currentUser]);

  useEffect(() => {
    if (currentUser?.provider !== 'supabase') {
      localStorage.setItem('ingresos_fijos', JSON.stringify(ingresosFijosState));
    }
  }, [ingresosFijosState, currentUser]);

  useEffect(() => {
    if (currentUser?.provider !== 'supabase') {
      localStorage.setItem('egresos_fijos', JSON.stringify(egresosFijosState));
    }
  }, [egresosFijosState, currentUser]);

  useEffect(() => {
    if (currentUser?.provider !== 'supabase') {
      localStorage.setItem('ingresos_variables', JSON.stringify(ingresosVariablesState));
    }
  }, [ingresosVariablesState, currentUser]);

  useEffect(() => {
    if (currentUser?.provider !== 'supabase') {
      localStorage.setItem('egresos_variables', JSON.stringify(egresosVariablesState));
    }
  }, [egresosVariablesState, currentUser]);

  useEffect(() => {
    if (currentUser?.provider !== 'supabase') {
      localStorage.setItem('historical_flows', JSON.stringify(historicalFlowsState));
    }
  }, [historicalFlowsState, currentUser]);

  useEffect(() => {
    if (currentUser?.provider !== 'supabase') {
      localStorage.setItem('monthly_details', JSON.stringify(monthlyDetailsState));
    }
  }, [monthlyDetailsState, currentUser]);

  useEffect(() => {
    const activeTheme = currentUser ? theme : 'light';
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('theme', theme);
  }, [theme, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email;
      if (email === 'contacto@ganancy.cl' || email === 'metincacontacto@gmail.com') {
        if (currentUser.subscription_status !== 'plan_completo') {
          const updated = { ...currentUser, subscription_status: 'plan_completo' };
          setCurrentUser(updated);
          localStorage.setItem('currentUser', JSON.stringify(updated));
          return;
        }
      }
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Lock context to personal if user is on the Personal plan
  useEffect(() => {
    if (currentUser?.subscription_status === 'plan_personal') {
      setCurrentContext('personal');
    }
  }, [currentUser]);

  // Self-healing migration: Ensure all fixed debts have stable [StartMonth: ...] metadata pinned
  useEffect(() => {
    if (debtsState.length === 0) return;

    let changed = false;
    const updatedDebts = debtsState.map(debt => {
      const isFixed = debt.tipo === 'fija' || (debt.cuotasTotales && debt.cuotasTotales > 1);
      const hasStartMonth = debt.details && debt.details.includes('[StartMonth:');

      if (isFixed && !hasStartMonth) {
        const baseMonth = "May 2026";
        const date = parseMonthYear(baseMonth);
        const cuotaAct = debt.cuotaActual || 0;
        date.setMonth(date.getMonth() - cuotaAct);
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const calculatedStartMonth = `${months[date.getMonth()]} ${date.getFullYear()}`;

        const updatedDetails = (debt.details || "").trim() + `\n[StartMonth: ${calculatedStartMonth}]`;
        changed = true;

        // If logged in, update database in background
        if (currentUser && currentUser.provider === 'supabase') {
          supabase
            .from('deudas')
            .update({ details: updatedDetails })
            .eq('id', debt.id)
            .then(({ error }) => {
              if (error) console.error("Error patching debt details in background:", error);
            });
        }

        return {
          ...debt,
          details: updatedDetails
        };
      }
      return debt;
    });

    if (changed) {
      setDebtsState(updatedDebts);
    }
  }, [debtsState, currentUser, parseMonthYear]);

  // Automatic month creation and pending items migration detection
  useEffect(() => {
    if (isDataLoading) return;
    if (!historicalFlowsState || historicalFlowsState.length === 0) return;

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const currentMonthLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;

    // Check if the current month exists in historicalFlowsState
    const currentMonthExists = historicalFlowsState.some(f => f.month === currentMonthLabel);

    if (!currentMonthExists) {
      const parseMonthYearLocal = (str) => {
        if (!str) return new Date(0);
        const parts = str.split(' ');
        const abbr = parts[0];
        const yr = parseInt(parts[1], 10);
        const monthMap = {
          "Ene": 0, "Feb": 1, "Mar": 2, "Abr": 3, "May": 4, "Jun": 5,
          "Jul": 6, "Ago": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dic": 11
        };
        return new Date(yr, monthMap[abbr] !== undefined ? monthMap[abbr] : 0, 1);
      };

      const sortedFlows = [...historicalFlowsState].sort((a, b) => parseMonthYearLocal(b.month) - parseMonthYearLocal(a.month));
      const previousMonthLabel = sortedFlows[0]?.month;

      const autoCreateMonth = async () => {
        // We import all active fixed incomes/expenses
        const selectedIncomes = ingresosFijosState || [];
        const selectedExpenses = egresosFijosState || [];
        
        await addHistoricalMonth(currentMonthLabel, selectedIncomes, selectedExpenses);

        // Check if previous month has any unpaid/unreceived items
        if (previousMonthLabel && monthlyDetailsState[previousMonthLabel]) {
          const prevDetails = monthlyDetailsState[previousMonthLabel];
          const unpaidIncomes = (prevDetails.ingresos || []).filter(it => !it.paid && !it.name.startsWith('__EXCLUDED__'));
          const unpaidExpenses = (prevDetails.egresos || []).filter(it => !it.paid && !it.name.startsWith('__EXCLUDED__'));

          if (unpaidIncomes.length > 0 || unpaidExpenses.length > 0) {
            setPendingMigration({
              previousMonth: previousMonthLabel,
              newMonth: currentMonthLabel,
              items: [
                ...unpaidIncomes.map(it => ({ ...it, type: 'ingresos' })),
                ...unpaidExpenses.map(it => ({ ...it, type: 'egresos' }))
              ]
            });
          }
        }
      };

      autoCreateMonth();
    }
  }, [isDataLoading, historicalFlowsState, monthlyDetailsState, ingresosFijosState, egresosFijosState]);

  // Initialize migration actions when pendingMigration is populated
  useEffect(() => {
    if (pendingMigration) {
      const initialActions = {};
      pendingMigration.items.forEach(item => {
        initialActions[item.id] = 'move';
      });
      setMigrationActions(initialActions);
    }
  }, [pendingMigration]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
      }
    }
    setCurrentUser(null);
  };

  const handleUpdateSubscriptionStatus = (newStatus) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, subscription_status: newStatus };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateProfile = async (updatedFields) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    });

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const updatePayload = {};
        if (updatedFields.displayName !== undefined) {
          updatePayload.display_name = updatedFields.displayName;
          updatePayload.avatar_initials = updatedFields.displayName.substring(0, 2).toUpperCase();
        }
        if (updatedFields.photoURL !== undefined) {
          updatePayload.avatar_url = updatedFields.photoURL;
        }
        updatePayload.updated_at = new Date().toISOString();

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', currentUser.id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al actualizar perfil en Supabase:", err);
      }
    }
  };

  // Helper: Reset to original values (Only local)
  const resetToDefaults = () => {
    if (window.confirm("¿Estás seguro de que deseas restablecer todos los datos locales a sus valores originales? Se perderán los cambios guardados.")) {
      localStorage.removeItem('assets_data');
      localStorage.removeItem('debts_data');
      localStorage.removeItem('ingresos_fijos');
      localStorage.removeItem('egresos_fijos');
      localStorage.removeItem('ingresos_variables');
      localStorage.removeItem('egresos_variables');
      localStorage.removeItem('historical_flows');
      localStorage.removeItem('monthly_details');
      
      setAssetsState(ACTIVOS_DATA);
      setDebtsState(PASIVOS_DATA.map(d => {
        const cuotas = Array.from({ length: d.cuotasTotales }, (_, i) => d.completed || i < d.cuotaActual);
        const tipo = d.cuotasTotales === 1 ? "pago_unico" : "fija";
        return {
          ...d,
          totalOriginal: d.total,
          interes: 0,
          total: d.total,
          tipo,
          cuotas,
          fechaVencimiento: d.id === "deuda_pato" ? "2026-06-15" : d.id === "tgr_nathy" ? "2026-07-20" : ""
        };
      }));
      setIngresosFijosState(INGRESOS_FIJOS);
      setEgresosFijosState(EGRESOS_FIJOS);
      setIngresosVariablesState([
        { id: "var_inc_1", name: "Servicios Motoemotion", value: 400000 },
        { id: "var_inc_2", name: "Servicios Pancho Papas", value: 350000 },
        { id: "var_inc_3", name: "Desarrollo ICENIT", value: 490000 }
      ]);
      setEgresosVariablesState([
        { id: "var_exp_1", name: "Comida / Varios", value: 500000 },
        { id: "var_exp_2", name: "Vacuna Isabella", value: 121000 },
        { id: "var_exp_3", name: "Manutención Pascuala", value: 340000 },
        { id: "var_exp_4", name: "Pañales / Niñera", value: 140000 }
      ]);
      setHistoricalFlowsState(HISTORICAL_FLOWS);
      
      const details = {};
      HISTORICAL_FLOWS.forEach(m => {
        if (m.month === "Abr 2026") {
          details[m.month] = {
            ingresos: MONTH_DETAILS["Abr 2026"].ingresos.map(item => ({ ...item, isVariable: false, dueDate: "2026-04-10" })),
            egresos: MONTH_DETAILS["Abr 2026"].egresos.map(item => ({ ...item, isVariable: false, dueDate: "2026-04-05" }))
          };
        } else {
          details[m.month] = { ingresos: [], egresos: [] };
        }
      });
      setMonthlyDetailsState(details);
      
      alert("Los datos locales se han restablecido correctamente.");
    }
  };

  // Helper: Manual Seeding of Demo Template Data
  const handleLoadDemoData = async () => {
    if (!currentUser) return;
    if (window.confirm("¿Deseas cargar la plantilla de demostración de GANANCY? Esto reemplazará todos tus datos actuales de la nube.")) {
      setIsDataLoading(true);
      try {
        if (currentUser.provider === 'supabase') {
          // Clear current tables first to avoid unique constraints conflicts
          await supabase.from('activos').delete().eq('user_id', currentUser.id);
          await supabase.from('deudas').delete().eq('user_id', currentUser.id);
          await supabase.from('ingresos_egresos_fijos').delete().eq('user_id', currentUser.id);
          await supabase.from('flujos_historicos').delete().eq('user_id', currentUser.id);
          await supabase.from('detalles_mensuales').delete().eq('user_id', currentUser.id);

          await initializeDefaultUserData(currentUser.id);
          const dbData = await fetchAllUserData(currentUser.id);
          
          setAssetsState(dbData.assetsState);
          setDebtsState(adjustDebtsPaidInstallments(dbData.debtsState));
          setIngresosFijosState(dbData.ingresosFijosState);
          setEgresosFijosState(dbData.egresosFijosState);
          setIngresosVariablesState(dbData.ingresosVariablesState);
          setEgresosVariablesState(dbData.egresosVariablesState);
          setHistoricalFlowsState(dbData.historicalFlowsState);
          setMonthlyDetailsState(dbData.monthlyDetailsState);
        } else {
          // Local demo reset
          setAssetsState(ACTIVOS_DATA);
          setDebtsState(adjustDebtsPaidInstallments(PASIVOS_DATA.map(d => {
            const cuotas = Array.from({ length: d.cuotasTotales }, (_, i) => d.completed || i < d.cuotaActual);
            const tipo = d.cuotasTotales === 1 ? "pago_unico" : "fija";
            return { ...d, totalOriginal: d.total, interes: 0, total: d.total, tipo, cuotas, fechaVencimiento: "" };
          })));
          setIngresosFijosState(INGRESOS_FIJOS);
          setEgresosFijosState(EGRESOS_FIJOS);
          setIngresosVariablesState([
            { id: "var_inc_1", name: "Servicios Motoemotion", value: 400000 },
            { id: "var_inc_2", name: "Servicios Pancho Papas", value: 350000 },
            { id: "var_inc_3", name: "Desarrollo ICENIT", value: 490000 }
          ]);
          setEgresosVariablesState([
            { id: "var_exp_1", name: "Comida / Varios", value: 500000 },
            { id: "var_exp_2", name: "Vacuna Isabella", value: 121000 },
            { id: "var_exp_3", name: "Manutención Pascuala", value: 340000 },
            { id: "var_exp_4", name: "Pañales / Niñera", value: 140000 }
          ]);
          setHistoricalFlowsState(HISTORICAL_FLOWS);
          
          const details = {};
          HISTORICAL_FLOWS.forEach(m => {
            if (m.month === "Abr 2026") {
              details[m.month] = {
                ingresos: MONTH_DETAILS["Abr 2026"].ingresos.map((item, idx) => ({ ...item, id: `tx_demo_inc_${idx}`, isVariable: false, dueDate: "2026-04-10" })),
                egresos: MONTH_DETAILS["Abr 2026"].egresos.map((item, idx) => ({ ...item, id: `tx_demo_exp_${idx}`, isVariable: false, dueDate: "2026-04-05" }))
              };
            } else {
              details[m.month] = { ingresos: [], egresos: [] };
            }
          });
          setMonthlyDetailsState(details);
        }
        alert("¡Plantilla de demostración cargada con éxito!");
      } catch (err) {
        console.error("Error al sembrar datos demo:", err);
        alert("Hubo un error al sembrar los datos.");
      } finally {
        setIsDataLoading(false);
      }
    }
  };

  // Helper: Wipe everything out and return to clean slate of $0
  const handleClearAllData = async () => {
    if (window.confirm("⚠️ ¿Estás completamente seguro de que deseas vaciar tu balance y volver a $0? Esto eliminará todos tus activos, deudas y flujos de forma permanente.")) {
      setIsDataLoading(true);
      try {
        if (currentUser && currentUser.provider === 'supabase') {
          await supabase.from('activos').delete().eq('user_id', currentUser.id);
          await supabase.from('deudas').delete().eq('user_id', currentUser.id);
          await supabase.from('ingresos_egresos_fijos').delete().eq('user_id', currentUser.id);
          await supabase.from('flujos_historicos').delete().eq('user_id', currentUser.id);
          await supabase.from('detalles_mensuales').delete().eq('user_id', currentUser.id);
        }
        
        // Wipe local React states
        setAssetsState({ total: 0, categories: ACTIVOS_DATA.categories.map(c => ({ ...c, total: 0, items: [] })) });
        setDebtsState([]);
        setIngresosFijosState([]);
        setEgresosFijosState([]);
        setIngresosVariablesState([]);
        setEgresosVariablesState([]);
        setHistoricalFlowsState([]);
        setMonthlyDetailsState({});
        
        alert("¡Todos tus datos financieros han sido restablecidos a $0!");
      } catch (err) {
        console.error("Error al vaciar datos:", err);
        alert("Ocurrió un error al intentar vaciar la base de datos.");
      } finally {
        setIsDataLoading(false);
      }
    }
  };

  // ==========================================
  // CRUD Actions: Assets
  // ==========================================
  const addAssetCategory = (name) => {
    const id = name.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, '_') // sanitize
      .replace(/_+/g, '_');
    
    // Check if category already exists
    if (assetsState.categories.some(cat => cat.id === id)) {
      alert("La categoría ya existe.");
      return;
    }

    setAssetsState(prev => {
      const newCat = {
        id,
        name,
        total: 0,
        items: []
      };
      const updatedCategories = [...prev.categories, newCat];
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const addAsset = async (catId, name, value, explicitContext) => {
    const taggedName = tagWithActiveContext(name, explicitContext);
    let newId = "asset_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('activos')
          .insert({
            user_id: currentUser.id,
            category_id: catId,
            category_name: assetsState.categories.find(c => c.id === catId)?.name || 'Otros',
            name: taggedName,
            value
          })
          .select()
          .single();

        if (error) throw error;
        newId = data.id;
      } catch (err) {
        console.error("Error al guardar activo en la nube:", err);
        alert("No se pudo guardar el activo en la base de datos.");
        return;
      }
    }

    setAssetsState(prev => {
      const updatedCategories = prev.categories.map(cat => {
        if (cat.id === catId) {
          const items = [...cat.items, { id: newId, name: taggedName, value }];
          const total = items.reduce((sum, item) => sum + item.value, 0);
          return { ...cat, items, total };
        }
        return cat;
      });
      const total = updatedCategories.reduce((sum, cat) => sum + cat.total, 0);
      return { total, categories: updatedCategories };
    });
  };

  const editAsset = async (catId, index, name, value) => {
    const cat = assetsState.categories.find(c => c.id === catId);
    const item = cat?.items[index];

    if (currentUser && currentUser.provider === 'supabase' && item && item.id) {
      try {
        const { error } = await supabase
          .from('activos')
          .update({ name, value })
          .eq('id', item.id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al editar activo en la nube:", err);
        alert("No se pudo actualizar el activo en la base de datos.");
        return;
      }
    }

    setAssetsState(prev => {
      const updatedCategories = prev.categories.map(cat => {
        if (cat.id === catId) {
          const items = cat.items.map((it, idx) => idx === index ? { ...it, name, value } : it);
          const total = items.reduce((sum, it) => sum + it.value, 0);
          return { ...cat, items, total };
        }
        return cat;
      });
      const total = updatedCategories.reduce((sum, cat) => sum + cat.total, 0);
      return { total, categories: updatedCategories };
    });
  };

  const deleteAsset = async (catId, index) => {
    const cat = assetsState.categories.find(c => c.id === catId);
    const item = cat?.items[index];

    if (currentUser && currentUser.provider === 'supabase' && item && item.id) {
      try {
        const { error } = await supabase
          .from('activos')
          .delete()
          .eq('id', item.id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al eliminar activo en la nube:", err);
        alert("No se pudo eliminar el activo de la base de datos.");
        return;
      }
    }

    setAssetsState(prev => {
      const updatedCategories = prev.categories.map(cat => {
        if (cat.id === catId) {
          const items = cat.items.filter((_, idx) => idx !== index);
          const total = items.reduce((sum, it) => sum + it.value, 0);
          return { ...cat, items, total };
        }
        return cat;
      });
      const total = updatedCategories.reduce((sum, cat) => sum + cat.total, 0);
      return { total, categories: updatedCategories };
    });
  };

  // ==========================================
  // CRUD Actions: Liabilities
  // ==========================================
  const addDebt = async (debtData) => {
    const taggedName = tagWithActiveContext(debtData.name, debtData.context);
    let newId = "debt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const cuotas = Array.from({ length: debtData.cuotasTotales }, (_, i) => i < debtData.cuotaActual);
    const totalOriginal = debtData.totalOriginal;
    const interes = debtData.interes || 0;
    const total = totalOriginal * (1 + interes / 100);
    const tipo = debtData.tipo || (debtData.cuotasTotales === 1 ? "pago_unico" : "fija");

    // Automatically append [StartMonth: ...] and [StartDate: ...] metadata to details
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    let startMonthLabel;
    if (debtData.fechaInicio) {
      const startDate = new Date(debtData.fechaInicio + "T00:00:00");
      startMonthLabel = `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
    } else {
      const now = new Date();
      startMonthLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;
    }
    let detailsWithMeta = (debtData.details || "").trim();
    detailsWithMeta += `\n[StartMonth: ${startMonthLabel}]`;
    if (debtData.fechaInicio) {
      detailsWithMeta += `\n[StartDate: ${debtData.fechaInicio}]`;
    }

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('deudas')
          .insert({
            user_id: currentUser.id,
            name: taggedName,
            total_original: totalOriginal,
            interes,
            total,
            cuota_actual: debtData.cuotaActual,
            cuotas_totales: debtData.cuotasTotales,
            monto_mensual: debtData.montoMensual,
            prepago: debtData.prepago,
            completed: debtData.cuotaActual === debtData.cuotasTotales,
            details: detailsWithMeta,
            tipo,
            fecha_vencimiento: debtData.fechaVencimiento || null,
            cuotas
          })
          .select()
          .single();

        if (error) throw error;
        newId = data.id;
      } catch (err) {
        console.error("Error al guardar deuda en la nube:", err);
        alert("No se pudo guardar la deuda en la base de datos.");
        return;
      }
    }

    setDebtsState(prev => {
      const newDebt = {
        id: newId,
        name: taggedName,
        totalOriginal,
        interes,
        total,
        cuotaActual: debtData.cuotaActual,
        cuotasTotales: debtData.cuotasTotales,
        montoMensual: debtData.montoMensual,
        prepago: debtData.prepago,
        completed: debtData.cuotaActual === debtData.cuotasTotales,
        details: detailsWithMeta,
        tipo,
        fechaVencimiento: debtData.fechaVencimiento || "",
        fechaInicio: debtData.fechaInicio || "",
        cuotas
      };
      return [...prev, newDebt];
    });
  };

  const editDebt = async (id, debtData) => {
    const totalOriginal = debtData.totalOriginal;
    const interes = debtData.interes || 0;
    const total = totalOriginal * (1 + interes / 100);
    const tipo = debtData.tipo || (debtData.cuotasTotales === 1 ? "pago_unico" : "fija");

    let newCuotas = undefined;
    const currentDebtObj = debtsState.find(d => String(d.id) === String(id));
    if (currentDebtObj) {
      if (currentDebtObj.cuotasTotales !== debtData.cuotasTotales || currentDebtObj.cuotaActual !== debtData.cuotaActual) {
        newCuotas = Array.from({ length: debtData.cuotasTotales }, (_, i) => i < debtData.cuotaActual);
      } else {
        newCuotas = currentDebtObj.cuotas;
      }
    }

    // Preserve or update [StartMonth: ...] and [StartDate: ...] metadata
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    let finalDetails = (debtData.details || "").trim();
    
    let startMonthLabel;
    if (debtData.fechaInicio) {
      const startDate = new Date(debtData.fechaInicio + "T00:00:00");
      startMonthLabel = `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
      finalDetails += `\n[StartMonth: ${startMonthLabel}]`;
      finalDetails += `\n[StartDate: ${debtData.fechaInicio}]`;
    } else {
      const existingMeta = currentDebtObj && currentDebtObj.details && currentDebtObj.details.match(/\[StartMonth:\s*[^\]]+\s*\d+\]/);
      if (existingMeta) {
        finalDetails += "\n" + existingMeta[0];
      } else {
        const now = new Date();
        startMonthLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;
        finalDetails += `\n[StartMonth: ${startMonthLabel}]`;
      }
      
      const existingStartDateMeta = currentDebtObj && currentDebtObj.details && currentDebtObj.details.match(/\[StartDate:\s*[^\]]+\s*\]/);
      if (existingStartDateMeta) {
        finalDetails += "\n" + existingStartDateMeta[0];
      }
    }

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('deudas')
          .update({
            name: debtData.name,
            total_original: totalOriginal,
            interes,
            total,
            cuota_actual: debtData.cuotaActual,
            cuotas_totales: debtData.cuotasTotales,
            monto_mensual: debtData.montoMensual,
            prepago: debtData.prepago,
            completed: debtData.cuotaActual === debtData.cuotasTotales,
            details: finalDetails,
            tipo,
            fecha_vencimiento: debtData.fechaVencimiento || null,
            cuotas: newCuotas
          })
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al actualizar deuda en la nube:", err);
        alert("No se pudo actualizar la deuda en la base de datos.");
        return;
      }
    }

    setDebtsState(prev => {
      return prev.map(d => {
        if (String(d.id) === String(id)) {
          return {
            ...d,
            name: debtData.name,
            totalOriginal,
            interes,
            total,
            cuotaActual: debtData.cuotaActual,
            cuotasTotales: debtData.cuotasTotales,
            montoMensual: debtData.montoMensual,
            prepago: debtData.prepago,
            completed: debtData.cuotaActual === debtData.cuotasTotales,
            details: finalDetails,
            tipo,
            fechaVencimiento: debtData.fechaVencimiento || "",
            fechaInicio: debtData.fechaInicio || "",
            cuotas: newCuotas
          };
        }
        return d;
      });
    });
  };

  const deleteDebt = async (id) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('deudas')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al borrar deuda en la nube:", err);
        alert("No se pudo eliminar la deuda de la base de datos.");
        return;
      }
    }
    setDebtsState(prev => prev.filter(d => String(d.id) !== String(id)));
  };

  const toggleCuota = async (debtId, cuotaIndex) => {
    const current = debtsState.find(d => String(d.id) === String(debtId));
    if (!current) return;

    // Safety: ensure cuotas is a valid array of length at least cuotasTotales
    const cuotasArray = Array.isArray(current.cuotas) ? current.cuotas : [];
    const newCuotas = [...cuotasArray];
    while (newCuotas.length < current.cuotasTotales) {
      newCuotas.push(false);
    }

    const newVal = !newCuotas[cuotaIndex];
    newCuotas[cuotaIndex] = newVal;

    if (newVal) {
      // Check if there are preceding unpaid cuotas
      let hasPrecedingUnpaid = false;
      for (let i = 0; i < cuotaIndex; i++) {
        if (!newCuotas[i]) {
          hasPrecedingUnpaid = true;
          break;
        }
      }

      if (hasPrecedingUnpaid) {
        const confirmMsg = `¿Deseas marcar también todas las cuotas anteriores pendientes como pagadas?\n\n- Presiona 'Aceptar' para marcar esta cuota y todas las anteriores.\n- Presiona 'Cancelar' para marcar ÚNICAMENTE esta cuota.`;
        const markPreceding = window.confirm(confirmMsg);
        
        if (markPreceding) {
          // Mark all preceding unpaid cuotas as paid
          for (let i = 0; i < cuotaIndex; i++) {
            newCuotas[i] = true;
          }
        }
      }
    }

    const paidCount = newCuotas.filter(Boolean).length;
    const completed = paidCount === current.cuotasTotales;

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('deudas')
          .update({
            cuotas: newCuotas,
            cuota_actual: paidCount,
            completed
          })
          .eq('id', debtId);

        if (error) throw error;
      } catch (err) {
        console.error("Error al alternar estado de cuota:", err);
        alert("No se pudo actualizar la cuota en la base de datos.");
        return;
      }
    }

    setDebtsState(prevDebts => {
      return prevDebts.map(d => {
        if (String(d.id) === String(debtId)) {
          return {
            ...d,
            cuotas: newCuotas,
            cuotaActual: paidCount,
            completed: completed
          };
        }
        return d;
      });
    });
  };

  // ==========================================
  // CRUD Actions: Fixed Incomes
  // ==========================================
  const addIncome = async (name, value, explicitContext) => {
    let newId = "inc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const taggedName = tagWithActiveContext(name, explicitContext);

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('ingresos_egresos_fijos')
          .insert({ user_id: currentUser.id, type: 'ingreso_fijo', name: taggedName, value })
          .select()
          .single();

        if (error) throw error;
        newId = data.id;
      } catch (err) {
        console.error("Error al guardar ingreso fijo:", err);
        alert("No se pudo guardar el ingreso en la base de datos.");
        return;
      }
    }
    setIngresosFijosState(prev => [...prev, { id: newId, name: taggedName, value }]);
  };

  const editIncome = async (id, name, value) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('ingresos_egresos_fijos')
          .update({ name, value })
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al editar ingreso fijo:", err);
        alert("No se pudo actualizar el ingreso.");
        return;
      }
    }
    setIngresosFijosState(prev => prev.map(item => item.id === id ? { ...item, name, value } : item));
  };

  const deleteIncome = async (id) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('ingresos_egresos_fijos')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al eliminar ingreso fijo:", err);
        alert("No se pudo eliminar el ingreso.");
        return;
      }
    }
    setIngresosFijosState(prev => prev.filter(item => String(item.id) !== String(id)));
  };

  // ==========================================
  // CRUD Actions: Fixed Expenses
  // ==========================================
  const addExpense = async (name, value, explicitContext) => {
    let newId = "exp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const taggedName = tagWithActiveContext(name, explicitContext);

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('ingresos_egresos_fijos')
          .insert({ user_id: currentUser.id, type: 'egreso_fijo', name: taggedName, value })
          .select()
          .single();

        if (error) throw error;
        newId = data.id;
      } catch (err) {
        console.error("Error al guardar egreso fijo:", err);
        alert("No se pudo guardar el egreso.");
        return;
      }
    }
    setEgresosFijosState(prev => [...prev, { id: newId, name: taggedName, value }]);
  };

  const editExpense = async (id, name, value) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('ingresos_egresos_fijos')
          .update({ name, value })
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al editar egreso fijo:", err);
        alert("No se pudo actualizar el egreso.");
        return;
      }
    }
    setEgresosFijosState(prev => prev.map(item => item.id === id ? { ...item, name, value } : item));
  };

  const deleteExpense = async (id) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('ingresos_egresos_fijos')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al eliminar egreso fijo:", err);
        alert("No se pudo eliminar el egreso.");
        return;
      }
    }
    setEgresosFijosState(prev => prev.filter(item => String(item.id) !== String(id)));
  };

  // ==========================================
  // CRUD Actions: Variable Incomes
  // ==========================================
  const addVariableIncome = async (name, value, explicitContext) => {
    let newId = "var_inc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const taggedName = tagWithActiveContext(name, explicitContext);

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('ingresos_egresos_fijos')
          .insert({ user_id: currentUser.id, type: 'ingreso_variable', name: taggedName, value })
          .select()
          .single();

        if (error) throw error;
        newId = data.id;
      } catch (err) {
        console.error("Error al guardar ingreso variable:", err);
        alert("No se pudo guardar el ingreso variable.");
        return;
      }
    }
    setIngresosVariablesState(prev => [...prev, { id: newId, name: taggedName, value }]);
  };

  const editVariableIncome = async (id, name, value) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('ingresos_egresos_fijos')
          .update({ name, value })
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al editar ingreso variable:", err);
        alert("No se pudo actualizar el ingreso.");
        return;
      }
    }
    setIngresosVariablesState(prev => prev.map(item => item.id === id ? { ...item, name, value } : item));
  };

  const deleteVariableIncome = async (id) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('ingresos_egresos_fijos')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al eliminar ingreso variable:", err);
        alert("No se pudo eliminar el ingreso.");
        return;
      }
    }
    setIngresosVariablesState(prev => prev.filter(item => String(item.id) !== String(id)));
  };

  // ==========================================
  // CRUD Actions: Variable Expenses
  // ==========================================
  const addVariableExpense = async (name, value, explicitContext) => {
    let newId = "var_exp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const taggedName = tagWithActiveContext(name, explicitContext);

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('ingresos_egresos_fijos')
          .insert({ user_id: currentUser.id, type: 'egreso_variable', name: taggedName, value })
          .select()
          .single();

        if (error) throw error;
        newId = data.id;
      } catch (err) {
        console.error("Error al guardar egreso variable:", err);
        alert("No se pudo guardar el egreso variable.");
        return;
      }
    }
    setEgresosVariablesState(prev => [...prev, { id: newId, name: taggedName, value }]);
  };

  const editVariableExpense = async (id, name, value) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('ingresos_egresos_fijos')
          .update({ name, value })
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al editar egreso variable:", err);
        alert("No se pudo actualizar el egreso.");
        return;
      }
    }
    setEgresosVariablesState(prev => prev.map(item => item.id === id ? { ...item, name, value } : item));
  };

  const deleteVariableExpense = async (id) => {
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('ingresos_egresos_fijos')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error("Error al eliminar egreso variable:", err);
        alert("No se pudo eliminar el egreso.");
        return;
      }
    }
    setEgresosVariablesState(prev => prev.filter(item => String(item.id) !== String(id)));
  };

  const handleProcessMigration = async (actions) => {
    if (!pendingMigration) return;

    const previousMonth = pendingMigration.previousMonth;
    const newMonth = pendingMigration.newMonth;

    for (const item of pendingMigration.items) {
      const action = actions[item.id] || 'ignore';

      if (action === 'mark_paid') {
        await updateMonthlyTransaction(previousMonth, item.type, 'edit', {
          id: item.id,
          item: {
            ...item,
            paid: true
          }
        });
      } else if (action === 'move') {
        const cleanName = item.name.replace(' [Personal]', '').replace(' [Empresa]', '');
        
        await updateMonthlyTransaction(newMonth, item.type, 'add', {
          name: `${cleanName} (Traspaso)`,
          value: item.value,
          paid: false,
          isVariable: true,
          dueDate: item.dueDate || "",
          context: item.name.includes('[Personal]') ? 'personal' : 'empresa'
        });
      }
    }

    setPendingMigration(null);
  };

  const addHistoricalMonth = async (monthName, selectedIncomes = [], selectedExpenses = []) => {
    if (!monthName) return false;
    
    // Parsear el trimestre desde el mes (ej: "Jul 2026" -> "Q3 2026")
    const parts = monthName.split(' ');
    const monthAbbr = parts[0];
    const year = parts[1];
    
    let q = "Q1 " + year;
    if (["Abr", "May", "Jun"].includes(monthAbbr)) {
      q = "Q2 " + year;
    } else if (["Jul", "Ago", "Sep"].includes(monthAbbr)) {
      q = "Q3 " + year;
    } else if (["Oct", "Nov", "Dic"].includes(monthAbbr)) {
      q = "Q4 " + year;
    }
    
    const totalIncomesCopied = selectedIncomes.reduce((sum, it) => sum + it.value, 0);
    const totalExpensesCopied = selectedExpenses.reduce((sum, it) => sum + it.value, 0);

    const newFlow = {
      month: monthName,
      q,
      ingresos: totalIncomesCopied,
      egresos: totalExpensesCopied,
      balance: totalIncomesCopied - totalExpensesCopied
    };

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error } = await supabase
          .from('flujos_historicos')
          .insert({
            user_id: currentUser.id,
            month: monthName,
            q,
            ingresos: totalIncomesCopied,
            egresos: totalExpensesCopied,
            balance: totalIncomesCopied - totalExpensesCopied
          });
        if (error) throw error;
      } catch (err) {
        console.error("Error al insertar mes en Supabase:", err);
        alert("No se pudo agregar el mes en la base de datos.");
        return false;
      }
    }

    // Inyectar ítems seleccionados en Supabase si está conectado
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const txsToInsert = [];
        selectedIncomes.forEach(item => {
          txsToInsert.push({
            user_id: currentUser.id,
            month: monthName,
            type: 'ingreso',
            name: item.name,
            value: item.value,
            paid: false,
            is_variable: false,
            due_date: null
          });
        });
        selectedExpenses.forEach(item => {
          txsToInsert.push({
            user_id: currentUser.id,
            month: monthName,
            type: 'egreso',
            name: item.name,
            value: item.value,
            paid: false,
            is_variable: false,
            due_date: null
          });
        });

        if (txsToInsert.length > 0) {
          const { error: txsErr } = await supabase
            .from('detalles_mensuales')
            .insert(txsToInsert);
          if (txsErr) throw txsErr;
        }
      } catch (err) {
        console.error("Error al pre-poblar transacciones fijas en Supabase:", err);
      }
    }

    const parseMonthYear = (str) => {
      const p = str.split(' ');
      const abbr = p[0];
      const yr = parseInt(p[1], 10);
      const monthMap = {
        "Ene": 0, "Feb": 1, "Mar": 2, "Abr": 3, "May": 4, "Jun": 5,
        "Jul": 6, "Ago": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dic": 11
      };
      return new Date(yr, monthMap[abbr] || 0);
    };

    setHistoricalFlowsState(prev => {
      if (prev.some(f => f.month === monthName)) return prev;
      const updated = [...prev, newFlow];
      return updated.sort((a, b) => parseMonthYear(a.month) - parseMonthYear(b.month));
    });

    setMonthlyDetailsState(prev => {
      if (prev[monthName]) return prev;
      
      const incomes = selectedIncomes.map(item => ({
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        name: item.name,
        value: item.value,
        paid: false,
        isVariable: false,
        dueDate: "",
        reminderEnabled: false,
        reminderEmail: "",
        reminderTime: "3_days_before"
      }));

      const expenses = selectedExpenses.map(item => ({
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        name: item.name,
        value: item.value,
        paid: false,
        isVariable: false,
        dueDate: "",
        reminderEnabled: false,
        reminderEmail: "",
        reminderTime: "3_days_before"
      }));

      return {
        ...prev,
        [monthName]: { ingresos: incomes, egresos: expenses }
      };
    });

    return true;
  };

  const deleteHistoricalMonth = async (monthName) => {
    if (!monthName) return false;
    
    if (currentUser && currentUser.provider === 'supabase') {
      try {
        const { error: flowErr } = await supabase
          .from('flujos_historicos')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('month', monthName);
        if (flowErr) throw flowErr;

        const { error: txsErr } = await supabase
          .from('detalles_mensuales')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('month', monthName);
        if (txsErr) throw txsErr;
      } catch (err) {
        console.error("Error al eliminar mes y transacciones en Supabase:", err);
        alert("No se pudo eliminar el mes en la base de datos.");
        return false;
      }
    }

    setHistoricalFlowsState(prev => prev.filter(f => f.month !== monthName));
    setMonthlyDetailsState(prev => {
      const copy = { ...prev };
      delete copy[monthName];
      return copy;
    });

    return true;
  };

  // ==========================================
  // CRUD Actions: Monthly Details
  // ==========================================
  const updateMonthlyTransaction = async (month, type, action, data) => {
    // Interceptar deudas virtuales para eliminarlas/editarlas mediante exclusiones y sobreescrituras
    if (action !== "add" && data.id && String(data.id).startsWith("debt_virtual_")) {
      if (action === "delete") {
        const exclusionName = `__EXCLUDED__${data.id}`;
        
        if (currentUser && currentUser.provider === 'supabase') {
          try {
            await supabase
              .from('detalles_mensuales')
              .insert({
                user_id: currentUser.id,
                month,
                type: type === 'ingresos' ? 'ingreso' : 'egreso',
                name: exclusionName,
                value: 0,
                paid: false,
                is_variable: false,
                due_date: null
              });
          } catch (err) {
            console.error("Error al guardar exclusión de deuda en Supabase:", err);
          }
        }
        
        setMonthlyDetailsState(prevDetails => {
          const monthObj = prevDetails[month] || { ingresos: [], egresos: [] };
          const updatedList = [...(monthObj[type] || [])];
          updatedList.push({
            id: "ex_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            name: exclusionName,
            value: 0,
            paid: false,
            isVariable: false,
            dueDate: ""
          });
          return {
            ...prevDetails,
            [month]: {
              ...monthObj,
              [type]: updatedList
            }
          };
        });
        return;
      }
      
      if (action === "edit") {
        const exclusionName = `__EXCLUDED__${data.id}`;
        const taggedName = tagWithActiveContext(data.item.name, data.item.context);
        
        if (currentUser && currentUser.provider === 'supabase') {
          try {
            await supabase
              .from('detalles_mensuales')
              .insert([
                {
                  user_id: currentUser.id,
                  month,
                  type: type === 'ingresos' ? 'ingreso' : 'egreso',
                  name: exclusionName,
                  value: 0,
                  paid: false,
                  is_variable: false,
                  due_date: null
                },
                {
                  user_id: currentUser.id,
                  month,
                  type: type === 'ingresos' ? 'ingreso' : 'egreso',
                  name: taggedName,
                  value: data.item.value,
                  paid: data.item.paid !== undefined ? data.item.paid : false,
                  is_variable: data.item.isVariable,
                  due_date: data.item.dueDate || null,
                  reminder_enabled: data.item.reminderEnabled || false,
                  reminder_email: data.item.reminderEmail || "",
                  reminder_time: data.item.reminderTime || "3_days_before"
                }
              ]);
          } catch (err) {
            console.error("Error al editar deuda virtual en Supabase:", err);
          }
        }
        
        setMonthlyDetailsState(prevDetails => {
          const monthObj = prevDetails[month] || { ingresos: [], egresos: [] };
          const updatedList = [...(monthObj[type] || [])];
          
          updatedList.push({
            id: "ex_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            name: exclusionName,
            value: 0,
            paid: false,
            isVariable: false,
            dueDate: ""
          });
          
          updatedList.push({
            id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            name: taggedName,
            value: data.item.value,
            paid: data.item.paid !== undefined ? data.item.paid : false,
            isVariable: data.item.isVariable,
            dueDate: data.item.dueDate || "",
            reminderEnabled: data.item.reminderEnabled || false,
            reminderEmail: data.item.reminderEmail || "",
            reminderTime: data.item.reminderTime || "3_days_before"
          });
          
          return {
            ...prevDetails,
            [month]: {
              ...monthObj,
              [type]: updatedList
            }
          };
        });
        return;
      }
    }

    const monthObject = monthlyDetailsState[month] || { ingresos: [], egresos: [] };
    const list = [...(monthObject[type] || [])];
    
    let rawIndex = -1;
    if (action !== "add" && data.id) {
      rawIndex = list.findIndex(it => String(it.id) === String(data.id));
    }
    if (rawIndex === -1 && action !== "add" && data.index !== undefined) {
      const filteredList = filterByActiveContext(list);
      const targetItem = filteredList[data.index];
      if (targetItem) {
        rawIndex = list.findIndex(it => it === targetItem || (it.id && it.id === targetItem.id));
      }
    }
    if (rawIndex === -1 && action !== "add") {
      rawIndex = data.index;
    }
    
    const item = list[rawIndex];

    let newId = "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    if (currentUser && currentUser.provider === 'supabase') {
      try {
        if (action === "add") {
          const taggedName = tagWithActiveContext(data.name, data.context);
          const { data: res, error } = await supabase
            .from('detalles_mensuales')
            .insert({
              user_id: currentUser.id,
              month,
              type: type === 'ingresos' ? 'ingreso' : 'egreso',
              name: taggedName,
              value: data.value,
              paid: data.paid !== undefined ? data.paid : false,
              is_variable: data.isVariable !== undefined ? data.isVariable : true,
              due_date: data.dueDate || null,
              reminder_enabled: data.reminderEnabled || false,
              reminder_email: data.reminderEmail || "",
              reminder_time: data.reminderTime || "3_days_before",
              receipt_url: data.receiptUrl || null
            })
            .select()
            .single();

          if (error) throw error;
          newId = res.id;
        } else if (action === "edit" && item && item.id) {
          const taggedName = tagWithActiveContext(data.item.name, data.item.context);
          const { error } = await supabase
            .from('detalles_mensuales')
            .update({
              name: taggedName,
              value: data.item.value,
              paid: data.item.paid !== undefined ? data.item.paid : item.paid,
              is_variable: data.item.isVariable,
              due_date: data.item.dueDate || null,
              reminder_enabled: data.item.reminderEnabled || false,
              reminder_email: data.item.reminderEmail || "",
              reminder_time: data.item.reminderTime || "3_days_before"
            })
            .eq('id', item.id);

          if (error) throw error;
        } else if (action === "delete" && item && item.id) {
          const { error } = await supabase
            .from('detalles_mensuales')
            .delete()
            .eq('id', item.id);

          if (error) throw error;
        } else if (action === "toggle" && item && item.id) {
          const { error } = await supabase
            .from('detalles_mensuales')
            .update({ paid: !item.paid })
            .eq('id', item.id);

          if (error) throw error;
        }
      } catch (err) {
        console.error("Error al modificar transacción en detalles_mensuales:", err);
        alert(`Ocurrió un error al guardar la transacción en la nube: ${err.message || err.details || err}`);
        return;
      }
    }

    setMonthlyDetailsState(prevDetails => {
      const monthObj = prevDetails[month] || { ingresos: [], egresos: [] };
      let updatedList = [...(monthObj[type] || [])];

      if (action === "add") {
        const taggedName = tagWithActiveContext(data.name, data.context);
        updatedList.push({
          id: newId,
          name: taggedName,
          value: data.value,
          paid: data.paid !== undefined ? data.paid : false,
          isVariable: data.isVariable !== undefined ? data.isVariable : true,
          dueDate: data.dueDate || "",
          reminderEnabled: data.reminderEnabled || false,
          reminderEmail: data.reminderEmail || "",
          reminderTime: data.reminderTime || "3_days_before",
          receiptUrl: data.receiptUrl || ""
        });
      } else if (action === "edit") {
        const taggedName = tagWithActiveContext(data.item.name, data.item.context);
        updatedList = updatedList.map((it, idx) => idx === rawIndex ? {
          ...it,
          name: taggedName,
          value: data.item.value,
          isVariable: data.item.isVariable,
          paid: data.item.paid !== undefined ? data.item.paid : it.paid,
          dueDate: data.item.dueDate || "",
          reminderEnabled: data.item.reminderEnabled || false,
          reminderEmail: data.item.reminderEmail || "",
          reminderTime: data.item.reminderTime || "3_days_before"
        } : it);
      } else if (action === "delete") {
        updatedList = updatedList.filter((_, idx) => idx !== rawIndex);
      } else if (action === "toggle") {
        updatedList = updatedList.map((it, idx) => idx === rawIndex ? { ...it, paid: !it.paid } : it);
      }

      const updatedMonthDetails = {
        ...monthObj,
        [type]: updatedList
      };

      const newDetails = {
        ...prevDetails,
        [month]: updatedMonthDetails
      };

      // Recalculate historical flows total for that month immediately
      setHistoricalFlowsState(prevFlows => {
        return prevFlows.map(f => {
          if (f.month === month) {
            const totalIngresos = updatedMonthDetails.ingresos.reduce((sum, it) => sum + it.value, 0);
            const totalEgresos = updatedMonthDetails.egresos.reduce((sum, it) => sum + it.value, 0);
            const balance = totalIngresos - totalEgresos;

            // Update flows historically in Supabase in background
            if (currentUser && currentUser.provider === 'supabase') {
              supabase
                .from('flujos_historicos')
                .update({ ingresos: totalIngresos, egresos: totalEgresos, balance })
                .eq('user_id', currentUser.id)
                .eq('month', month)
                .then(({ error: flowsErr }) => {
                  if (flowsErr) console.error("Error al actualizar balance histórico en la nube:", flowsErr);
                });
            }

            return { ...f, ingresos: totalIngresos, egresos: totalEgresos, balance };
          }
          return f;
        });
      });

      return newDetails;
    });
  };

  // Navigation & Scroll Anchor Handler
  const handleNavigate = (tab, anchorId) => {
    if (tab === "suscripcion") {
      setSubscriptionSubTab("plan");
    }
    setActiveTab(tab);
    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Render active section
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView 
            currentUser={currentUser}
            debtsState={filteredDebtsState} 
            assetsTotal={filteredAssetsState.total}
            ingresosFijosState={filteredIngresosFijos}
            egresosFijosState={filteredEgresosFijos}
            addIncome={addIncome}
            editIncome={editIncome}
            deleteIncome={deleteIncome}
            addExpense={addExpense}
            editExpense={editExpense}
            deleteExpense={deleteExpense}
            monthlyDetailsState={filteredMonthlyDetails}
            ingresosVariablesState={filteredIngresosVariables}
            egresosVariablesState={filteredEgresosVariables}
            addVariableIncome={addVariableIncome}
            editVariableIncome={editVariableIncome}
            deleteVariableIncome={deleteVariableIncome}
            addVariableExpense={addVariableExpense}
            editVariableExpense={editVariableExpense}
            deleteVariableExpense={deleteVariableExpense}
            onNavigate={handleNavigate}
            loadDemoData={handleLoadDemoData}
            clearAllData={handleClearAllData}
            historicalFlowsState={filteredHistoricalFlows}
            updateMonthlyTransaction={updateMonthlyTransaction}
            currentContext={currentContext}
            addAsset={addAsset}
            addDebt={addDebt}
            addHistoricalMonth={addHistoricalMonth}
          />
        );
      case "activos_pasivos":
        if (currentUser?.subscription_status === 'plan_personal') {
          return (
            <div style={{ 
              padding: '60px 24px', 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              maxWidth: '600px',
              margin: '40px auto'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>🔒 Sección Exclusiva del Plan Completo</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                La gestión detallada de Activos no está disponible en el Plan Personal. 
                Actualiza tu cuenta para habilitar el Inventario de Activos Productivos y Pasivos Comerciales con reclasificación drag-and-drop.
              </p>
              <button 
                onClick={() => {
                  setSubscriptionSubTab("plan");
                  setActiveTab("suscripcion");
                }}
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, #0056b3 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Ver Planes de Suscripción
              </button>
            </div>
          );
        }
        return (
          <ActivosPasivosView 
            debtsState={filteredDebtsState} 
            assetsState={filteredAssetsState}
            addAsset={addAsset}
            editAsset={editAsset}
            deleteAsset={deleteAsset}
            addDebt={addDebt}
            editDebt={editDebt}
            deleteDebt={deleteDebt}
            currentContext={currentContext}
            addAssetCategory={addAssetCategory}
          />
        );
      case "flujo":
        return (
          <FlujoMensualView 
            historicalFlowsState={filteredHistoricalFlows}
            monthlyDetailsState={filteredMonthlyDetails}
            updateMonthlyTransaction={updateMonthlyTransaction}
            currentContext={currentContext}
            addHistoricalMonth={addHistoricalMonth}
            deleteHistoricalMonth={deleteHistoricalMonth}
            ingresosFijosState={filteredIngresosFijos}
            egresosFijosState={filteredEgresosFijos}
            toggleCuota={toggleCuota}
            addIncome={addIncome}
            editIncome={editIncome}
            deleteIncome={deleteIncome}
            addExpense={addExpense}
            editExpense={editExpense}
            deleteExpense={deleteExpense}
          />
        );
      case "deudas":
        return (
          <DeudasView 
            debtsState={filteredDebtsState} 
            toggleCuota={toggleCuota} 
            addDebt={addDebt}
            editDebt={editDebt}
            deleteDebt={deleteDebt}
            currentContext={currentContext}
          />
        );
      case "proyeccion":
        return (
          <ProyeccionView 
            debtsState={filteredDebtsState} 
            assetsTotal={filteredAssetsState.total}
            ingresosFijosState={filteredIngresosFijos}
            egresosFijosState={filteredEgresosFijos}
            historicalFlowsState={filteredHistoricalFlows}
            currentUser={currentUser}
          />
        );
      case "suscripcion":
        return (
          <SubscriptionView 
            currentUser={currentUser} 
            onUpdateSubscription={handleUpdateSubscriptionStatus} 
            onUpdateProfile={handleUpdateProfile}
            onNavigateBack={() => setActiveTab("dashboard")}
            initialSubTab={subscriptionSubTab}
          />
        );
      case "editor_landing":
        return (
          <LandingEditorView 
            landingPageData={landingPageData} 
            onSave={async (newData) => {
              setLandingPageData(newData);
              localStorage.setItem('landing_page_data', JSON.stringify(newData));
              if (isSupabaseConfigured) {
                try {
                  const { error } = await supabase
                    .from('landing_config')
                    .upsert({ id: 'default', data: newData });
                  if (error) console.error("Error al persistir la landing en Supabase:", error);
                } catch (e) {
                  console.error("Excepción al persistir la landing:", e);
                }
              }
            }}
            onReset={async () => {
              setLandingPageData(LANDING_PAGE_DEFAULTS);
              localStorage.removeItem('landing_page_data');
              if (isSupabaseConfigured) {
                try {
                  const { error } = await supabase
                    .from('landing_config')
                    .upsert({ id: 'default', data: LANDING_PAGE_DEFAULTS });
                  if (error) console.error("Error al resetear la landing en Supabase:", error);
                } catch (e) {
                  console.error("Excepción al resetear la landing:", e);
                }
              }
            }}
          />
        );
      default:
        return <DashboardView debtsState={filteredDebtsState} assetsTotal={filteredAssetsState.total} />;
    }
  };

  // Render Auth Loader Screen
  if (isDataLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-app, #0f172a)',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <Loader className="spin-icon" size={48} style={{ color: 'var(--accent, #3b82f6)', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>Sincronizando datos en la nube...</h3>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #94a3b8)' }}>Cargando tu información financiera segura</p>
      </div>
    );
  }

  if (!currentUser) {
    if (showLogin) {
      return <LoginView onLogin={setCurrentUser} onBack={() => setShowLogin(false)} />;
    }
    return <LandingPageView onEnterLogin={() => setShowLogin(true)} landingPageData={landingPageData} />;
  }

  // Paywall check: If not 'active', not 'trial', and doesn't match custom plans, lock user out
  const isSubscribed = currentUser.subscription_status === 'active' || 
                       currentUser.subscription_status === 'trial' || 
                       currentUser.subscription_status?.startsWith('plan_');

  if (!isSubscribed) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header */}
        <header>
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img 
              src={theme === 'dark' ? '/ganancy_logo_light.png' : '/ganancy_logo_dark.png'} 
              alt="GANANCY" 
              style={{ height: '36px', width: 'auto', display: 'block' }} 
            />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Dashboard Financiero</h1>
              <div className="subtitle" style={{ fontSize: '11px', margin: 0, color: 'var(--text-secondary)' }}>GANANCY — Control de Activos, Pasivos y Proyecciones</div>
            </div>
          </div>

          <div className="header-controls">
            <div className="user-profile-pill">
              <div className="user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.avatarInitials
                )}
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser.displayName}</span>
                <span className="user-email">{currentUser.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="logout-btn"
                title="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
            {/* Theme Toggle Button */}
            <button onClick={toggleTheme} className="theme-btn" title="Alternar Modo Oscuro/Claro">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SubscriptionView 
            currentUser={currentUser} 
            onUpdateSubscription={handleUpdateSubscriptionStatus} 
            onUpdateProfile={handleUpdateProfile}
          />
        </main>

        <footer style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 0', 
          borderTop: '1px solid var(--border-color)', 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          marginTop: 'auto',
          textAlign: 'center'
        }}>
          <span>&copy; {new Date().getFullYear()} GANIMIDES. Todos los derechos reservados. Diseñado bajo estándares Apple.</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header (Cleaned up: No Reset button) */}
      <header>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={theme === 'dark' ? '/ganancy_logo_light.png' : '/ganancy_logo_dark.png'} 
            alt="GANANCY" 
            style={{ height: '36px', width: 'auto', display: 'block' }} 
          />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Dashboard Financiero</h1>
            <div className="subtitle" style={{ fontSize: '11px', margin: 0, color: 'var(--text-secondary)' }}>GANANCY — Control de Activos, Pasivos y Proyecciones</div>
          </div>
        </div>

        {/* Global Context Switcher & Profile Switcher (WOW feature) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', alignSelf: 'center' }}>
          {currentUser?.subscription_status !== 'plan_personal' ? (
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '2px',
              gap: '2px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
            }}>
              {[
                { id: 'empresa', label: '🏢 Negocio', desc: 'Muestra solo ingresos/egresos del negocio' },
                { id: 'personal', label: '🏠 Personal', desc: 'Muestra solo tus gastos personales familiares' },
                { id: 'consolidado', label: '📊 Vista Consolidada', desc: 'Integra y sobrepone ambos flujos en tiempo real' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setCurrentContext(opt.id)}
                  title={opt.desc}
                  style={{
                    background: currentContext === opt.id ? 'var(--accent, #0a84ff)' : 'transparent',
                    color: currentContext === opt.id ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: currentContext === opt.id ? '0 4px 10px rgba(10, 132, 255, 0.25)' : 'none'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              🏠 Vista Personal Activa
            </div>
          )}

          {/* Profile Switcher Pill (Only visible in Personal context) */}
          {currentContext === 'personal' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  const hasFamilyPlan = currentUser?.subscription_status === 'plan_familiar' || currentUser?.subscription_status === 'plan_custom';
                  if (hasFamilyPlan) {
                    setProfileDropdownOpen(!profileDropdownOpen);
                  } else {
                    setShowUpgradeModal(true);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '6px 14px',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {activeProfileId === 'family_consolidated' ? (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff9500, #ff5e00)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }}>
                    👥
                  </div>
                ) : (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: profiles.find(p => p.id === activeProfileId)?.color || '#0a84ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }}>
                    {(profiles.find(p => p.id === activeProfileId)?.name || 'P').substring(0, 1).toUpperCase()}
                  </div>
                )}
                <span>
                  {activeProfileId === 'family_consolidated' 
                    ? 'Familia (Consolidado)' 
                    : (profiles.find(p => p.id === activeProfileId)?.name || 'Principal')}
                </span>
                {!(currentUser?.subscription_status === 'plan_familiar' || currentUser?.subscription_status === 'plan_custom') ? (
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>🔒</span>
                ) : (
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
                )}
              </button>

              {profileDropdownOpen && (
                <>
                  <div 
                    onClick={() => setProfileDropdownOpen(false)} 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: theme === 'dark' ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    width: '220px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <div style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Perfiles Familiares
                    </div>
                    
                    {profiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProfileId(p.id);
                          setProfileDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          background: activeProfileId === p.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          width: '100%',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: p.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#ffffff',
                          fontWeight: 'bold'
                        }}>
                          {p.name.substring(0, 1).toUpperCase()}
                        </div>
                        <span style={{ flex: 1, fontWeight: activeProfileId === p.id ? 600 : 400 }}>{p.name}</span>
                        {activeProfileId === p.id && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>✓</span>}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        setActiveProfileId('family_consolidated');
                        setProfileDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        background: activeProfileId === 'family_consolidated' ? 'rgba(255,255,255,0.06)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff9500, #ff5e00)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#ffffff',
                        fontWeight: 'bold'
                      }}>
                        👥
                      </div>
                      <span style={{ flex: 1, fontWeight: activeProfileId === 'family_consolidated' ? 600 : 400 }}>Vista Consolidada</span>
                      {activeProfileId === 'family_consolidated' && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>✓</span>}
                    </button>

                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setProfileDropdownOpen(false);
                      }}
                      disabled={profiles.length >= 4}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: profiles.length >= 4 ? 'var(--text-secondary)' : 'var(--text-primary)',
                        fontSize: '12.5px',
                        textAlign: 'left',
                        cursor: profiles.length >= 4 ? 'not-allowed' : 'pointer',
                        width: '100%',
                        opacity: profiles.length >= 4 ? 0.5 : 1
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>➕</span>
                      <span>Agregar Perfil ({profiles.length}/4)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowManageProfilesModal(true);
                        setProfileDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '12.5px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>⚙️</span>
                      <span>Gestionar Perfiles</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="header-controls">
          {currentUser && (
            <div className="user-profile-pill">
              <div className="user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.avatarInitials
                )}
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser.displayName}</span>
                <span className="user-email">{currentUser.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="logout-btn"
                title="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button onClick={toggleTheme} className="theme-btn" title="Alternar Modo Oscuro/Claro">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Trial Alert Banner */}
      {currentUser.subscription_status === 'trial' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.1) 0%, rgba(10, 132, 255, 0.03) 100%)',
          border: '1px solid rgba(10, 132, 255, 0.2)',
          padding: '12px 24px',
          borderRadius: '16px',
          margin: '0 24px 24px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="var(--accent)" />
            <span style={{ fontSize: '13.5px', color: '#cbd5e1', fontWeight: 500 }}>
              Estás usando tu **Periodo de Prueba de 7 días**. ¡Prueba todas las funcionalidades y el Asesor CFO con IA!
            </span>
          </div>
          <button 
            onClick={() => {
              setSubscriptionSubTab("plan");
              setActiveTab("suscripcion");
            }}
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(10, 132, 255, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            Actualizar a Plan Pro
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <ul className="nav-tabs">
          <li>
            <button 
              className={activeTab === "dashboard" ? "active" : ""} 
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
          </li>
          {currentUser?.subscription_status !== 'plan_personal' && (
            <li>
              <button 
                className={activeTab === "activos_pasivos" ? "active" : ""} 
                onClick={() => setActiveTab("activos_pasivos")}
              >
                <Database size={16} /> Activos
              </button>
            </li>
          )}
          <li>
            <button 
              className={activeTab === "deudas" ? "active" : ""} 
              onClick={() => setActiveTab("deudas")}
            >
              <CreditCard size={16} /> Deudas / Pasivos
            </button>
          </li>
          <li>
            <button 
              className={activeTab === "flujo" ? "active" : ""} 
              onClick={() => setActiveTab("flujo")}
            >
              <Calendar size={16} /> Flujo Mensual
            </button>
          </li>
          <li>
            <button 
              className={activeTab === "proyeccion" ? "active" : ""} 
              onClick={() => setActiveTab("proyeccion")}
            >
              <TrendingUp size={16} /> Proyecciones
            </button>
          </li>
          <li>
            <button 
              className={activeTab === "suscripcion" ? "active" : ""} 
              onClick={() => {
                setSubscriptionSubTab("perfil");
                setActiveTab("suscripcion");
              }}
            >
              <User size={16} /> Mi Cuenta
            </button>
          </li>
          {currentUser && (currentUser.email === 'contacto@ganancy.cl' || currentUser.email === 'metincacontacto@gmail.com') && (
            <li>
              <button 
                className={activeTab === "editor_landing" ? "active" : ""} 
                onClick={() => setActiveTab("editor_landing")}
              >
                <Settings size={16} /> Editar Landing
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Active Section Content */}
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {renderContent()}
      </main>

      {/* Footer */}
      {/* Footer */}
      <footer style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '32px 24px', 
        borderTop: '1px solid var(--border-color)', 
        fontSize: '12px', 
        color: 'var(--text-secondary)',
        marginTop: 'auto',
        textAlign: 'center',
        background: 'var(--bg-secondary, rgba(0,0,0,0.02))'
      }}>
        {/* Navigation Links */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '20px', 
          flexWrap: 'wrap',
          fontWeight: 500
        }}>
          <button 
            onClick={() => {
              setSubscriptionSubTab("plan");
              setActiveTab("suscripcion");
            }} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'color 0.2s' }}
          >
            Suscripciones
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button 
            onClick={() => setFooterModalType("faqs")} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'color 0.2s' }}
          >
            Preguntas Frecuentes
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button 
            onClick={() => setFooterModalType("privacidad")} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'color 0.2s' }}
          >
            Políticas de Privacidad
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button 
            onClick={() => setFooterModalType("terminos")} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'color 0.2s' }}
          >
            Términos y Condiciones
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button 
            onClick={() => setFooterModalType("soporte")} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'color 0.2s' }}
          >
            Servicio Técnico
          </button>
        </div>

        {/* Social Media Links */}
        <div style={{ display: 'flex', gap: '16px', margin: '4px 0' }}>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} title="Instagram">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} title="Facebook">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} title="Twitter / X">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
          <a href="mailto:soporte@ganancy.cl" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }} title="Email de Soporte"><Mail size={18} /></a>
        </div>

        <div>
          <span>&copy; {new Date().getFullYear()} GANIMIDES. Todos los derechos reservados. Diseñado bajo estándares Apple.</span>
        </div>
      </footer>

      {/* Footer Modals */}
      {footerModalType && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setFooterModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <button className="close-btn" onClick={() => setFooterModalType(null)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
            
            {footerModalType === 'faqs' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  ❓ Preguntas Frecuentes (FAQ)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>¿Qué es GANANCY?</strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Es una plataforma premium de control y proyección financiera diseñada para ordenar tus finanzas personales y de negocio en un solo lugar de manera simple y visual.
                    </span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>¿Cómo se calculan las proyecciones?</strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      GANANCY analiza tus ingresos y egresos fijos registrados, sumados a las cuotas de deudas activas y proyecciones de meses futuros, para simular y proyectar tu flujo de caja neto.
                    </span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>¿Mis datos están seguros?</strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Sí, la seguridad es nuestra prioridad. Usamos Supabase con encriptación SSL y políticas de seguridad avanzadas para proteger toda tu información financiera.
                    </span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>¿Cómo puedo cancelar mi suscripción?</strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Puedes gestionar o cancelar tu suscripción en cualquier momento desde la sección de "Suscripciones" en el menú lateral o contactando directamente a soporte técnico.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {footerModalType === 'privacidad' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  🛡️ Políticas de Privacidad
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <p>
                    En GANANCY, tu privacidad es de suma importancia. Los datos financieros y personales recopilados se utilizan únicamente para proveer las funcionalidades de la aplicación.
                  </p>
                  <p>
                    <strong>¿Qué información recopilamos?</strong><br />
                    - Información de cuenta: Tu correo electrónico, nombre de perfil y foto (si inicias sesión con Google).<br />
                    - Datos financieros: Activos, pasivos, deudas y presupuestos mensuales que ingreses de manera voluntaria.
                  </p>
                  <p>
                    <strong>Compromiso de No Divulgación:</strong><br />
                    No vendemos, alquilamos ni compartimos tus datos personales o financieros con ninguna empresa, anunciante o tercero bajo ninguna circunstancia.
                  </p>
                  <p>
                    Tienes derecho a exportar tu información o eliminar de forma permanente tu cuenta y todos los datos asociados desde la pestaña "Mi Cuenta".
                  </p>
                </div>
              </div>
            )}

            {footerModalType === 'terminos' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  📄 Términos y Condiciones de Uso
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <p>
                    Al acceder y utilizar GANANCY, aceptas cumplir con los presentes términos y condiciones de servicio.
                  </p>
                  <p>
                    <strong>Responsabilidad del Usuario:</strong><br />
                    La plataforma es una herramienta de orden y proyección financiera de carácter puramente informativo. GANANCY no ofrece asesoría de inversión, contable o tributaria profesional. El usuario es responsable exclusivo de sus decisiones financieras.
                  </p>
                  <p>
                    <strong>Licencia de Uso:</strong><br />
                    Se te otorga una licencia de uso personal, no transferible y revocable para acceder a la aplicación bajo el plan de suscripción contratado.
                  </p>
                  <p>
                    Nos reservamos el derecho de modificar o actualizar estos términos en cualquier momento con el fin de adaptarlos a mejoras del servicio.
                  </p>
                </div>
              </div>
            )}

            {footerModalType === 'soporte' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  🛠️ Contacto de Servicio Técnico
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <p>
                    ¿Tienes algún problema técnico, duda o sugerencia? Nuestro equipo está listo para ayudarte a resolver cualquier inconveniente.
                  </p>
                  
                  <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>📧</span>
                      <span><strong>Email de Soporte:</strong> <a href="mailto:soporte@ganancy.cl" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>soporte@ganancy.cl</a></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>💬</span>
                      <span><strong>WhatsApp Técnico:</strong> <a href="https://wa.me/56912345678" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>+56 9 1234 5678</a></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>⏰</span>
                      <span><strong>Horario de Atención:</strong> Lunes a Viernes de 09:00 a 18:00 hrs.</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    * El tiempo promedio de respuesta para consultas por correo electrónico es de menos de 24 horas hábiles.
                  </p>
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setFooterModalType(null)}
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Traspaso de Pendientes */}
      {pendingMigration && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <RefreshCw size={24} color="var(--accent)" className="animate-spin-slow" />
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>🔄 Traspaso de Pendientes a {pendingMigration.newMonth}</h3>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              El mes de <strong>{pendingMigration.newMonth}</strong> ha comenzado y se ha creado automáticamente. 
              Detectamos que en <strong>{pendingMigration.previousMonth}</strong> quedaron los siguientes movimientos sin registrar como cobrados o pagados. 
              ¿Cómo deseas gestionarlos?
            </p>

            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              paddingRight: '4px',
              marginBottom: '20px',
              maxHeight: '45vh'
            }}>
              {pendingMigration.items.map(item => {
                const isIncome = item.type === 'ingresos';
                const cleanName = item.name.replace(' [Personal]', '').replace(' [Empresa]', '');
                const isPersonal = item.name.includes('[Personal]');
                
                return (
                  <div key={item.id} style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          fontSize: '18px', 
                          background: isIncome ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                          color: isIncome ? 'var(--success)' : 'var(--danger)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isIncome ? '💰' : '💸'}
                        </span>
                        <div>
                          <strong style={{ fontSize: '14.5px', display: 'block', color: 'var(--text-primary)' }}>
                            {cleanName}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {isPersonal ? '🏠 Personal' : '🏢 Negocio'} • {isIncome ? 'Ingreso' : 'Egreso'}
                          </span>
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 700, 
                        color: isIncome ? 'var(--success)' : 'var(--danger)' 
                      }}>
                        {formatMoney(item.value)}
                      </span>
                    </div>

                    {/* Action Selector */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '8px',
                      background: 'var(--bg-secondary)',
                      padding: '4px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {[
                        { id: 'mark_paid', label: isIncome ? 'Recibido' : 'Pagado', desc: `Marcar como listo en ${pendingMigration.previousMonth}`, color: 'var(--success)' },
                        { id: 'move', label: 'Traspasar', desc: `Mover a ${pendingMigration.newMonth} como pendiente`, color: 'var(--accent)' },
                        { id: 'ignore', label: 'Mantener', desc: `Dejar pendiente en ${pendingMigration.previousMonth}`, color: 'var(--text-secondary)' }
                      ].map(act => {
                        const isSelected = (migrationActions[item.id] || 'move') === act.id;
                        return (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setMigrationActions(prev => ({ ...prev, [item.id]: act.id }))}
                            title={act.desc}
                            style={{
                              border: 'none',
                              background: isSelected ? act.color : 'transparent',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                              padding: '8px 6px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'center'
                            }}
                          >
                            {act.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setPendingMigration(null)}
                style={{ 
                  flex: 1, 
                  background: 'var(--border-color)', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: 600 
                }}
              >
                Omitir por ahora
              </button>
              <button
                type="button"
                onClick={() => handleProcessMigration(migrationActions)}
                style={{ 
                  flex: 2, 
                  background: 'var(--accent)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.2)'
                }}
              >
                Procesar Movimientos seleccionados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          PROFILE MODALS (Plan Familiar)
          --------------------------------------------------------------------- */}
      {showProfileModal && (
        <CreateProfileModal 
          onClose={() => setShowProfileModal(false)}
          onSave={(name, color) => {
            const newId = 'profile_' + Date.now();
            setProfiles(prev => [...prev, { id: newId, name, color }]);
            setActiveProfileId(newId);
            setShowProfileModal(false);
          }}
        />
      )}

      {showManageProfilesModal && (
        <ManageProfilesModal 
          profiles={profiles}
          onClose={() => setShowManageProfilesModal(false)}
          onUpdate={(updatedProfiles) => {
            setProfiles(updatedProfiles);
            if (!updatedProfiles.some(p => p.id === activeProfileId) && activeProfileId !== 'family_consolidated') {
              setActiveProfileId('default');
            }
          }}
          activeProfileId={activeProfileId}
        />
      )}

      {showUpgradeModal && (
        <UpgradePlanModal 
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            setSubscriptionSubTab("plan");
            setActiveTab("suscripcion");
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// HELPER COMPONENTS FOR FAMILY PLAN PROFILES
// ---------------------------------------------------------------------

function CreateProfileModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#0a84ff");
  const colors = ["#0a84ff", "#5856d6", "#ff9500", "#34c759", "#ff2d55"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), selectedColor);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '24px', position: 'relative', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', marginTop: 0 }}>
          👥 Agregar Miembro Familiar
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
          Crea un nuevo perfil para organizar de forma independiente los ingresos, egresos y deudas de tu familia.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nombre</label>
            <input 
              type="text" 
              placeholder="Ej: Mamá, Pareja, Hijo 1" 
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Color Identificador</label>
            <div style={{ display: 'flex', gap: '12px', padding: '4px 0' }}>
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: selectedColor === c ? '3px solid #ffffff' : 'none',
                    cursor: 'pointer',
                    transform: selectedColor === c ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedColor === c ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                flex: 1,
                background: 'var(--accent, #0a84ff)',
                border: 'none',
                color: '#ffffff',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: !name.trim() ? 0.5 : 1
              }}
            >
              Crear Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageProfilesModal({ profiles, onClose, onUpdate, activeProfileId }) {
  const [localProfiles, setLocalProfiles] = useState(profiles);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleSaveName = (id) => {
    if (!editName.trim()) return;
    const updated = localProfiles.map(p => p.id === id ? { ...p, name: editName.trim() } : p);
    setLocalProfiles(updated);
    onUpdate(updated);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (id === 'default') return;
    if (confirm("¿Estás seguro de que deseas eliminar este perfil? Los elementos financieros asociados se mantendrán pero no se mostrarán en su perfil.")) {
      const updated = localProfiles.filter(p => p.id !== id);
      setLocalProfiles(updated);
      onUpdate(updated);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%', padding: '24px', position: 'relative', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', marginTop: 0 }}>
          ⚙️ Gestionar Perfiles Familiares
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
          Edita o elimina los miembros de tu grupo familiar. El perfil Principal (Tú) no se puede eliminar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
          {localProfiles.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: p.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: '#ffffff',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {p.name.substring(0, 1).toUpperCase()}
              </div>

              {editingId === p.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--accent)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                  autoFocus
                  onBlur={() => handleSaveName(p.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName(p.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {p.name} {p.id === 'default' && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>(Tú)</span>}
                </span>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                {editingId === p.id ? (
                  <button
                    onClick={() => handleSaveName(p.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    Guardar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Editar
                  </button>
                )}

                {p.id !== 'default' && (
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error, #ff453a)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: 'var(--accent, #0a84ff)',
            border: 'none',
            color: '#ffffff',
            padding: '10px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Listo
        </button>
      </div>
    </div>
  );
}

function UpgradePlanModal({ onClose, onUpgrade }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '28px', position: 'relative', background: 'var(--bg-primary)', borderRadius: '18px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255, 149, 0, 0.1)',
          color: '#ff9500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          margin: '0 auto 16px auto'
        }}>
          👥
        </div>
        <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', marginTop: 0 }}>
          Desbloquea el Plan Familiar
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
          La gestión multi-perfil y la vista consolidada familiar son exclusivas del **Plan Familiar**. 
          Actualiza tu cuenta para habilitar hasta 4 perfiles y ordenar las finanzas de todo tu hogar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onUpgrade}
            style={{
              background: 'linear-gradient(135deg, #ff9500 0%, #ff5e00 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 149, 0, 0.25)'
            }}
          >
            Ver Planes de Suscripción
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Tal vez más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
