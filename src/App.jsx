import React, { useState, useEffect } from 'react';
import { Sun, Moon, LayoutDashboard, Database, Calendar, CreditCard, TrendingUp, RotateCcw, Loader, ShieldCheck, Sparkles, Settings, User } from 'lucide-react';
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
    if (saved) return JSON.parse(saved);
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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

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
  const [landingPageData, setLandingPageData] = useState(() => {
    const saved = localStorage.getItem('landing_page_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hero && parsed.hero.title === "Detén la mezcla de dinero que frena el crecimiento de tu negocio") {
          parsed.hero.title = "Ganancy Organiza y controla tus finanzas.";
          localStorage.setItem('landing_page_data', JSON.stringify(parsed));
        }
        return parsed;
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

  // Reactive filters based on Context Switcher
  const filterByActiveContext = React.useCallback((list) => {
    if (currentContext === 'empresa') {
      return list.filter(item => !item.name.includes('[Personal]'));
    } else if (currentContext === 'personal') {
      return list.filter(item => item.name.includes('[Personal]'));
    }
    return list;
  }, [currentContext]);

  const tagWithActiveContext = React.useCallback((name, explicitContext) => {
    if (name.includes('[Personal]') || name.includes('[Empresa]')) return name;
    const targetCtx = explicitContext || currentContext;
    const contextSuffix = targetCtx === 'personal' ? ' [Personal]' : ' [Empresa]';
    return name + contextSuffix;
  }, [currentContext]);

  // Apply context filters to fixed and variable list states
  const filteredIngresosFijos = React.useMemo(() => filterByActiveContext(ingresosFijosState), [ingresosFijosState, filterByActiveContext]);
  const filteredEgresosFijos = React.useMemo(() => filterByActiveContext(egresosFijosState), [egresosFijosState, filterByActiveContext]);
  const filteredIngresosVariables = React.useMemo(() => filterByActiveContext(ingresosVariablesState), [ingresosVariablesState, filterByActiveContext]);
  const filteredEgresosVariables = React.useMemo(() => filterByActiveContext(egresosVariablesState), [egresosVariablesState, filterByActiveContext]);

  const filteredMonthlyDetails = React.useMemo(() => {
    const res = {};
    Object.keys(monthlyDetailsState).forEach(month => {
      const monthObj = monthlyDetailsState[month] || { ingresos: [], egresos: [] };
      res[month] = {
        ingresos: filterByActiveContext(monthObj.ingresos || []),
        egresos: filterByActiveContext(monthObj.egresos || [])
      };
    });
    return res;
  }, [monthlyDetailsState, filterByActiveContext]);

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
            setDebtsState(dbData.debtsState);
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
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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
          setDebtsState(dbData.debtsState);
          setIngresosFijosState(dbData.ingresosFijosState);
          setEgresosFijosState(dbData.egresosFijosState);
          setIngresosVariablesState(dbData.ingresosVariablesState);
          setEgresosVariablesState(dbData.egresosVariablesState);
          setHistoricalFlowsState(dbData.historicalFlowsState);
          setMonthlyDetailsState(dbData.monthlyDetailsState);
        } else {
          // Local demo reset
          setAssetsState(ACTIVOS_DATA);
          setDebtsState(PASIVOS_DATA.map(d => {
            const cuotas = Array.from({ length: d.cuotasTotales }, (_, i) => d.completed || i < d.cuotaActual);
            const tipo = d.cuotasTotales === 1 ? "pago_unico" : "fija";
            return { ...d, totalOriginal: d.total, interes: 0, total: d.total, tipo, cuotas, fechaVencimiento: "" };
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
            details: debtData.details || "",
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
        details: debtData.details || "",
        tipo,
        fechaVencimiento: debtData.fechaVencimiento || "",
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
    const currentDebtObj = debtsState.find(d => d.id === id);
    if (currentDebtObj) {
      if (currentDebtObj.cuotasTotales !== debtData.cuotasTotales || currentDebtObj.cuotaActual !== debtData.cuotaActual) {
        newCuotas = Array.from({ length: debtData.cuotasTotales }, (_, i) => i < debtData.cuotaActual);
      } else {
        newCuotas = currentDebtObj.cuotas;
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
            details: debtData.details || "",
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
        if (d.id === id) {
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
            details: debtData.details || "",
            tipo,
            fechaVencimiento: debtData.fechaVencimiento || "",
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
    const current = debtsState.find(d => d.id === debtId);
    if (!current) return;

    const newCuotas = [...current.cuotas];
    newCuotas[cuotaIndex] = !newCuotas[cuotaIndex];
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
        if (d.id === debtId) {
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

  // ==========================================
  // CRUD Actions: Monthly Details
  // ==========================================
  const updateMonthlyTransaction = async (month, type, action, data) => {
    const monthObject = monthlyDetailsState[month] || { ingresos: [], egresos: [] };
    const list = [...(monthObject[type] || [])];
    const item = list[data.index];

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
        alert("Ocurrió un error al guardar la transacción en la nube.");
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
        updatedList = updatedList.map((it, idx) => idx === data.index ? {
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
        updatedList = updatedList.filter((_, idx) => idx !== data.index);
      } else if (action === "toggle") {
        updatedList = updatedList.map((it, idx) => idx === data.index ? { ...it, paid: !it.paid } : it);
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
                onClick={() => setActiveTab("suscripcion")}
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
          />
        );
      case "editor_landing":
        return (
          <LandingEditorView 
            landingPageData={landingPageData} 
            onSave={(newData) => {
              setLandingPageData(newData);
              localStorage.setItem('landing_page_data', JSON.stringify(newData));
            }}
            onReset={() => {
              setLandingPageData(LANDING_PAGE_DEFAULTS);
              localStorage.removeItem('landing_page_data');
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

        {/* Global Context Switcher (WOW feature: Personal vs Business differentiation) */}
        {currentUser?.subscription_status !== 'plan_personal' ? (
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '2px',
            gap: '2px',
            alignSelf: 'center',
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
            alignSelf: 'center',
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
              Estás usando tu **Periodo de Prueba de 14 días**. ¡Prueba todas las funcionalidades y el Asesor CFO con IA!
            </span>
          </div>
          <button 
            onClick={() => setActiveTab("suscripcion")}
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
                <Database size={16} /> Activos / Pasivos
              </button>
            </li>
          )}
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
              className={activeTab === "deudas" ? "active" : ""} 
              onClick={() => setActiveTab("deudas")}
            >
              <CreditCard size={16} /> Deudas
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
              onClick={() => setActiveTab("suscripcion")}
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
