# Diseño de Optimización, Rendimiento, SEO y Blindaje de Seguridad para Ganancy

Este documento detalla el plan de diseño para estructurar, acelerar, asegurar ("antivirus") y posicionar para motores de búsqueda (SEO) la aplicación Ganancy.

---

## 1. Objetivos del Sistema

1.  **Modularización y Limpieza (Orden):** Reducir el tamaño de `App.jsx` (~3.8k líneas) y `DashboardView.jsx` (~3.5k líneas) separando responsabilidades en subcomponentes lógicos y reutilizables.
    *   Proporcionar una plantilla Excel de ejemplo en `/ganancy_plantilla_modelo.xlsx` para descarga directa desde el frontend, facilitando la subida correcta de activos, deudas e ingresos/egresos.
2.  **Seguridad Integral (Blindaje):**
    *   Prevenir inyección de código (XSS) eliminando el uso inseguro de `dangerouslySetInnerHTML` en notificaciones (*toasts*).
    *   Definir una Política de Seguridad de Contenido (**CSP**) en `index.html` para bloquear la ejecución de scripts no autorizados.
    *   Sanitizar el procesamiento de planillas Excel de `xlsx` contra ataques de Prototype Pollution.
    *   Implementar un **Error Boundary** de React para atrapar y silenciar fallos no controlados del frontend, impidiendo la "pantalla en blanco".
    *   Verificar que las consultas de Supabase utilicen autenticación robusta vinculada al `user_id` del usuario activo.
3.  **Rendimiento y Velocidad (Velocidad):**
    *   Implementar división de código (*Code Splitting*) con `React.lazy` y `<Suspense>` para diferir la carga de las vistas de pestañas no visibles de inmediato.
    *   Configurar optimizaciones de bundling en Vite.
4.  **Posicionamiento en Buscadores (SEO):**
    *   Establecer el idioma principal del documento en español (`<html lang="es">`).
    *   Agregar metaetiquetas semánticas, etiquetas Open Graph (para previsualizaciones ricas en WhatsApp, Twitter, etc.) y estructuración JSON-LD en `index.html`.
    *   Crear archivos `robots.txt` y `sitemap.xml` de control en el directorio público.
    *   Crear un hook React `useSEO` para cambiar dinámicamente el título y descripción del navegador al cambiar de sección o estado.

---

## 2. Arquitectura de Cambios Propuestos

### 2.1. Reorganización del Código (Orden)

Para resolver el tamaño masivo de los archivos lógicos, extraeremos subcomponentes dedicados desde `App.jsx` y `DashboardView.jsx`:

1.  **`src/components/ErrorBoundary.jsx` [NUEVO]:** Componente de clase React para atrapar fallos del ciclo de vida y renderizar una UI elegante de error en lugar de bloquear el navegador.
2.  **`src/components/SEO.jsx` o hook `src/hooks/useSEO.js` [NUEVO]:** Para la gestión dinámica de metadatos.
3.  **Extracciones de `DashboardView.jsx`:**
    *   `src/sections/dashboard/DashboardCharts.jsx` [NUEVO]: Extraer el bloque que renderiza los gráficos de ingresos/egresos usando `recharts` para liberar ~500 líneas de código de presentación.
    *   `src/sections/dashboard/ExcelUploader.jsx` [NUEVO]: Extraer el subcomponente que maneja la lógica de subida y procesamiento del archivo de Excel (incluyendo la sanitización de Prototype Pollution) para aislar el peso de la librería `xlsx`.
    *   `public/ganancy_plantilla_modelo.xlsx` [NUEVO]: Archivo de plantilla Excel pre-generado con hojas dedicadas para "Activos", "Deudas" y "Flujos" respetando la nomenclatura del analizador sintáctico de la app. Ofrecer un botón "Descargar Plantilla Excel" al costado del botón de carga de planilla.

### 2.2. Blindaje de Seguridad ("Antivirus")

#### Prevención de XSS en Notificaciones
En `FlujoMensualView.jsx`, el texto de las notificaciones se renderiza usando `dangerouslySetInnerHTML` porque el sistema formatea elementos en negrita (`**texto**`).
**Solución:** Implementar un formateador seguro que analice y reemplace marcas de negrita simples (`**...**`) usando texto plano y elementos `<strong>` nativos de React, escapando cualquier otra etiqueta HTML.

#### Content Security Policy (CSP)
Agregar un tag `<meta http-equiv="Content-Security-Policy">` en `index.html` que restrinja las conexiones únicamente a orígenes seguros y aprobados:
*   `default-src 'self'`
*   `connect-src 'self' https://*.supabase.co wss://*.supabase.co` (para consultas a base de datos y suscripciones en tiempo real)
*   `script-src 'self' 'unsafe-inline'` (necesario para la ejecución inicial de Vite en el lado del cliente)
*   `img-src 'self' data: blob:` (para logos e imágenes subidas)
*   `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` (para fuentes y estilos)

#### Prevención de Prototype Pollution (Excel)
En `DashboardView.jsx`, al usar `XLSX.utils.sheet_to_json`, desinfectaremos el objeto JSON resultante para eliminar cualquier propiedad que apunte a `__proto__`, `constructor` o `prototype`.

```javascript
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
```

### 2.3. Rendimiento (Velocidad)

Implementaremos *code splitting* a nivel de enrutamiento de pestañas en `App.jsx`.
En lugar de importar estáticamente todas las vistas al inicio del bundle de entrada:

```javascript
const DashboardView = React.lazy(() => import('./sections/DashboardView'));
const ActivosPasivosView = React.lazy(() => import('./sections/ActivosPasivosView'));
const FlujoMensualView = React.lazy(() => import('./sections/FlujoMensualView'));
const DeudasView = React.lazy(() => import('./sections/DeudasView'));
const ProyeccionView = React.lazy(() => import('./sections/ProyeccionView'));
const SubscriptionView = React.lazy(() => import('./sections/SubscriptionView'));
const LandingEditorView = React.lazy(() => import('./sections/LandingEditorView'));
```

Se envolverán en `<React.Suspense fallback={<LoaderView />}>` al renderizarse. Esto reducirá el tamaño del archivo Javascript inicial cargado por el cliente de ~700KB a menos de ~150KB.

### 2.4. Optimización de SEO

#### Actualización en `index.html`
*   Cambiar `<html lang="en">` a `<html lang="es">`.
*   Agregar etiquetas `<meta name="description">` enfocadas en palabras clave como "Planificación contable", "CFO Inteligente", "Finanzas personales y corporativas".
*   Agregar Open Graph: `og:title`, `og:description`, `og:image`, `og:url`, `og:type="website"`.
*   Agregar Twitter Cards: `twitter:card="summary_large_image"`, `twitter:title`, `twitter:description`.
*   Agregar datos estructurados en formato JSON-LD:
    ```html
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "GANANCY",
      "operatingSystem": "All",
      "applicationCategory": "BusinessApplication",
      "description": "Planificación contable avanzada, automatización de flujos de caja y CFO inteligente para optimizar tus finanzas.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "CLP"
      }
    }
    </script>
    ```

#### Gestión Dinámica (hook `useSEO`)
Un hook personalizado que actualice la información del documento en tiempo de ejecución:
```javascript
import { useEffect } from 'react';

export function useSEO({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} | GANANCY` : 'GANANCY - Planificación Contable';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description || 'Planificación contable y control inteligente.');
  }, [title, description]);
}
```

---

## 3. Plan de Verificación

### Pruebas Automatizadas
1.  **Análisis de Vulnerabilidades:** Ejecutar `npm audit` para confirmar la mitigación de vulnerabilidades de `vite`.
2.  **Linting de Estilo y Código:** Ejecutar `npm run lint` para garantizar que la modularización no introduzca errores sintácticos o referencias rotas.
3.  **Build en Producción:** Ejecutar `npm run build` para validar que el Code Splitting funciona y genera los fragmentos (*chunks*) de JS y CSS de forma correcta.

### Pruebas Manuales
1.  **SEO Audit:** Ejecutar Lighthouse en la pestaña de desarrollo para evaluar la puntuación de SEO (objetivo: > 95%).
2.  **Pruebas de XSS:** Intentar ingresar una transacción con nombre `<script>alert("hack")</script>` o `<img src=x onerror=alert(1)>` y validar que el toast la renderice como texto plano y no se ejecute el script.
3.  **Carga de Excel:** Validar que la subida de un archivo Excel de ejemplo siga cargando los activos y deudas sin interrupciones.
