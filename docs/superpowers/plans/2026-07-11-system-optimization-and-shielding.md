# Plan de Optimización de Rendimiento, SEO y Blindaje de Seguridad para Ganancy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimizar el posicionamiento SEO, reducir el bundle size y acelerar el tiempo de carga, ordenar el código modularizando componentes grandes, y blindar la aplicación contra inyecciones XSS y Prototype Pollution en la carga de archivos.

**Architecture:** 
1. **SEO & Metadata:** Modificar `index.html` con etiquetas Open Graph y JSON-LD estructurado en español, añadir `robots.txt` y `sitemap.xml`, e implementar un hook `useSEO` para actualizaciones dinámicas en pestañas.
2. **Seguridad y Resiliencia:** Agregar Content Security Policy (CSP) en `index.html`, un validador y escapador seguro para mensajes toast en `FlujoMensualView.jsx` (evitando `dangerouslySetInnerHTML`), desinfectar planillas Excel contra prototype pollution y envolver las vistas críticas con un `ErrorBoundary` de React.
3. **Optimización y Modularización:** Modularizar los componentes de gráficos de Recharts y de procesamiento/subida de planillas Excel en `src/sections/dashboard/`, e implementar `React.lazy` + `Suspense` en `App.jsx` para el cargado diferido de vistas.

**Tech Stack:** React 19, Vite 8, Supabase client, Recharts, xlsx.

---

### Task 1: Estructuración SEO y Metadatos Dinámicos

**Files:**
- Create: `src/hooks/useSEO.js`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Modify: `index.html`

- [ ] **Step 1: Crear hook `useSEO` para control de títulos y metadatos dinámicos**

Create: `src/hooks/useSEO.js`
```javascript
import { useEffect } from 'react';

/**
 * Hook personalizado para actualizar dinámicamente el título y descripción del sitio.
 */
export function useSEO({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} | GANANCY` : 'GANANCY - Planificación Contable y CFO Inteligente';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description || 'Planificación contable avanzada, automatización de flujos de caja y CFO inteligente para optimizar tus finanzas.');
  }, [title, description]);
}
export default useSEO;
```

- [ ] **Step 2: Crear el archivo `robots.txt`**

Create: `public/robots.txt`
```text
User-agent: *
Allow: /

Sitemap: https://ganancy.cl/sitemap.xml
```

- [ ] **Step 3: Crear el archivo `sitemap.xml`**

Create: `public/sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ganancy.cl/</loc>
    <lastmod>2026-07-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 4: Modificar `index.html` para SEO, idioma y CSP**

Modify: `index.html` (Reemplazar etiquetas iniciales)
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/ganancy_logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GANANCY - Planificación Contable y CFO Inteligente</title>
    <meta name="description" content="Planificación contable avanzada, automatización de flujos de caja y CFO inteligente para optimizar tus finanzas personales y empresariales de manera veloz y segura." />
    <meta name="keywords" content="planificacion contable advanced, cfo inteligente, finanzas personales, flujo de caja, control financiero, finanzas chile, contabilidad" />
    <meta name="robots" content="index, follow" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; script-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com;" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://ganancy.cl/" />
    <meta property="og:title" content="GANANCY - Planificación Contable y CFO Inteligente" />
    <meta property="og:description" content="Planificación contable avanzada, automatización de flujos de caja y CFO inteligente para optimizar tus finanzas personales y empresariales de manera veloz y segura." />
    <meta property="og:image" content="https://ganancy.cl/ganancy_concept.png" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://ganancy.cl/" />
    <meta property="twitter:title" content="GANANCY - Planificación Contable y CFO Inteligente" />
    <meta property="twitter:description" content="Planificación contable avanzada, automatización de flujos de caja y CFO inteligente para optimizar tus finanzas personales y empresariales de manera veloz y segura." />
    <meta property="twitter:image" content="https://ganancy.cl/ganancy_concept.png" />

    <!-- Schema.org JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "GANANCY",
      "operatingSystem": "All",
      "applicationCategory": "BusinessApplication",
      "description": "Planificación contable avanzada, automatización de flujos de caja y CFO inteligente para optimizar tus finanzas personales y empresariales.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "CLP"
      }
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useSEO.js public/robots.txt public/sitemap.xml index.html
git commit -m "feat: add robust SEO setup and dynamic metadata hook"
```

---

### Task 2: Blindaje con Error Boundary y CSP en React

**Files:**
- Create: `src/components/ErrorBoundary.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Crear componente de ciclo de vida `ErrorBoundary.jsx`**

Create: `src/components/ErrorBoundary.jsx`
```javascript
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary detectó un fallo crítico:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>Algo salió mal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 0 24px 0' }}>
            La aplicación experimentó un error inesperado, pero tus datos están seguros en la nube.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--accent, #0a84ff)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)'
            }}
          >
            Recargar Aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

- [ ] **Step 2: Envolver el componente principal App en el ErrorBoundary**

Modify: `src/App.jsx`
Envolver el retorno principal del componente `App` con `<ErrorBoundary>...</ErrorBoundary>`.
Importar al inicio del archivo:
```javascript
import ErrorBoundary from './components/ErrorBoundary';
```

- [ ] **Step 3: Commit**
```bash
git add src/components/ErrorBoundary.jsx src/App.jsx
git commit -m "feat: add react error boundary for UI fault resilience"
```

---

### Task 3: Sanitización Toast contra Ataques XSS

**Files:**
- Modify: `src/sections/FlujoMensualView.jsx`

- [ ] **Step 1: Añadir función desinfectora de toasts**

Modify: `src/sections/FlujoMensualView.jsx`
Agregar arriba en el archivo la función `renderFormattedToastMessage` para procesar negritas de forma segura:
```javascript
function renderFormattedToastMessage(message) {
  if (!message) return null;
  
  // Escapar caracteres html inseguros
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Dividir el mensaje buscando bloques de negrita markdown **texto**
  const parts = escaped.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index}>{part}</strong>;
    }
    return part;
  });
}
```

- [ ] **Step 2: Reemplazar el `dangerouslySetInnerHTML` en el toast banner**

Modify: `src/sections/FlujoMensualView.jsx`
Buscar en el render:
```javascript
<div dangerouslySetInnerHTML={{ __html: toastMessage }}></div>
```
Reemplazar con:
```javascript
<div>{renderFormattedToastMessage(toastMessage)}</div>
```

- [ ] **Step 3: Commit**
```bash
git add src/sections/FlujoMensualView.jsx
git commit -m "security: replace dangerouslySetInnerHTML with secure html escaping parser in toasts"
```

---

### Task 4: Modularización y Defensa contra Prototype Pollution

**Files:**
- Create: `src/sections/dashboard/DashboardCharts.jsx`
- Create: `src/sections/dashboard/ExcelUploader.jsx`
- Modify: `src/sections/DashboardView.jsx`

- [ ] **Step 1: Crear el subcomponente modular `DashboardCharts.jsx`**

Create: `src/sections/dashboard/DashboardCharts.jsx`
Mover la visualización del gráfico de barras de `recharts` junto con el tooltip personalizado:
```javascript
import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        fontSize: '12.5px'
      }}>
        <p style={{ fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{payload[0].payload.month}</p>
        <p style={{ margin: '0 0 4px 0', color: 'var(--success)' }}>
          Ingresos: <strong>${Number(payload[0].value).toLocaleString('es-CL')}</strong>
        </p>
        <p style={{ margin: '0 0 4px 0', color: 'var(--danger)' }}>
          Egresos: <strong>${Number(payload[1].value).toLocaleString('es-CL')}</strong>
        </p>
        <p style={{ margin: '0', borderTop: '1px solid var(--border-color)', paddingTop: '4px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Balance: <strong style={{ color: payload[0].payload.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ${payload[0].payload.balance >= 0 ? '+' : ''}{Number(payload[0].payload.balance).toLocaleString('es-CL')}
          </strong>
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ historicalFlowsState }) {
  if (historicalFlowsState.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', textAlign: 'center', gap: '8px', padding: '40px' }}>
        <TrendingUp size={48} color="var(--text-tertiary)" />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>No hay flujos históricos registrados</span>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Los gráficos se generarán automáticamente a medida que completes meses.</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <BarChart data={historicalFlowsState} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
        <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(var(--accent-rgb), 0.03)' }} />
        <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{v}</span>} />
        <Bar dataKey="ingresos" name="Ingresos" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={25} />
        <Bar dataKey="egresos" name="Egresos" fill="var(--danger)" radius={[4, 4, 0, 0]} maxBarSize={25} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Crear el subcomponente modular `ExcelUploader.jsx` con desinfección de Prototype Pollution**

Create: `src/sections/dashboard/ExcelUploader.jsx`
```javascript
import React from 'react';
import * as XLSX from 'xlsx';

// Desinfecta recursivamente cualquier objeto para evitar Prototype Pollution (__proto__, prototype, constructor)
function sanitizeParsedObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeParsedObject);
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizeParsedObject(value);
  }
  return clean;
}

export default function ExcelUploader({ onFileLoaded, onError }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const binaryData = evt.target.result;
        const workbook = XLSX.read(binaryData, { type: 'binary' });
        
        const data = {};
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          // Sanitización estricta de prototype
          data[sheetName] = sanitizeParsedObject(rawRows);
        });
        
        onFileLoaded(data, workbook.SheetNames);
      } catch (err) {
        console.error("Error leyendo planilla:", err);
        onError("No se pudo parsear el archivo Excel. Asegúrese de que es un archivo .xlsx o .xls válido.");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <input 
      type="file" 
      accept=".xlsx,.xls" 
      onChange={handleFileChange}
      style={{ display: 'none' }}
      id="excel-file-input"
    />
  );
}
```

- [ ] **Step 3: Modificar `DashboardView.jsx` para importar y usar los nuevos componentes modularizados**

Modify: `src/sections/DashboardView.jsx`
*   Importar `DashboardCharts` y `ExcelUploader` en la cabecera.
*   Reemplazar la llamada inline de Recharts con `<DashboardCharts historicalFlowsState={historicalFlowsState} />`.
*   Reemplazar el cargador de archivos nativo con el nuevo `ExcelUploader`.
*   Añadir el enlace para descargar la plantilla modelo de Excel (`/ganancy_plantilla_modelo.xlsx`) al costado del texto informativo de subida.
*   Asegurar que se reduzca la complejidad del archivo principal eliminando imports innecesarios de `recharts`.

- [ ] **Step 4: Commit**
```bash
git add src/sections/dashboard/DashboardCharts.jsx src/sections/dashboard/ExcelUploader.jsx src/sections/DashboardView.jsx
git commit -m "refactor: modularize charts and excel uploader in dashboard, implement prototype sanitization and template download"
```

---

### Task 5: Reducción del Tamaño de Bundle con Lazy Loading

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Convertir las importaciones de vistas estáticas en dinámicas (Lazy Loading)**

Modify: `src/App.jsx`
Cambiar importaciones directas de secciones por llamadas dinámicas con `React.lazy()`:
```javascript
import React, { useState, useEffect, lazy, Suspense } from 'react';
// Quitar importaciones directas anteriores de vistas...

const DashboardView = lazy(() => import('./sections/DashboardView'));
const ActivosPasivosView = lazy(() => import('./sections/ActivosPasivosView'));
const FlujoMensualView = lazy(() => import('./sections/FlujoMensualView'));
const DeudasView = lazy(() => import('./sections/DeudasView'));
const ProyeccionView = lazy(() => import('./sections/ProyeccionView'));
const SubscriptionView = lazy(() => import('./sections/SubscriptionView'));
const LandingEditorView = lazy(() => import('./sections/LandingEditorView'));
```

- [ ] **Step 2: Envolver el render de las pestañas en `<Suspense>`**

Modify: `src/App.jsx`
En el lugar donde se renderizan las vistas basadas en `activeTab`, envolver con:
```javascript
<Suspense fallback={
  <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
    <Loader className="spinner" size={32} style={{ animation: 'spin 1s linear infinite' }} />
  </div>
}>
  {/* Render de las vistas activas */}
</Suspense>
```

- [ ] **Step 3: Commit**
```bash
git add src/App.jsx
git commit -m "perf: split app bundle using React lazy loading and Suspense for tab sections"
```
