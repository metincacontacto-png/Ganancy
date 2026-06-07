# Especificación de Diseño: Guía de Inicio Rápido y Compresión de Espacios

Este documento detalla la especificación para compactar los espacios en el Dashboard y agregar una Guía de Inicio Rápido (onboarding) interactiva para el usuario.

## 1. Objetivos de Diseño
- **Compresión Visual**: Minimizar los espacios en blanco, paddings, gaps y márgenes para que toda la información crítica del Dashboard se presente en una sola pantalla sin requerir scroll.
- **Onboarding Interactivo**: Facilitar al usuario la comprensión de los primeros pasos que debe dar al entrar al sistema, mostrándole claramente qué áreas debe rellenar primero.

## 2. Ajustes de Espaciado (Compresión)
Modificaremos los estilos CSS globales y locales en `DashboardView.jsx` e `index.css`:
1. **Contenedor General del Dashboard**: Reducir el gap de `32px` a `16px`.
2. **Cuadrículas KPI (`.kpi-grid` en index.css)**:
   - Reducir el gap de `20px` a `14px`.
   - Reducir el margen inferior de `32px` a `16px`.
3. **Tarjetas KPI (`.kpi-card` en index.css)**:
   - Relleno (padding) reducido de `20px` a `12px`.
   - Gap reducido de `16px` a `12px`.
4. **Tarjetas de Saldo y Patrimonio**:
   - Altura mínima reducida de `120px` a `96px`.
   - Relleno reducido de `24px` a `16px`.
   - Gap reducido de `20px` a `14px`.
5. **Secciones de Flujo (Fijo, Variable, Capital)**:
   - Reducir margen inferior de la sección de `24px` a `12px`.
   - Reducir margen del título de `12px` a `8px`.

## 3. Guía de Inicio Rápido (Onboarding)
Agregaremos un panel "Guía de Inicio Rápido" en la parte superior del Dashboard:
- En planes comerciales, se presentará en una cuadrícula de 3 columnas junto a la "Importación de Estados Financieros" y el "Escáner IA de Boletas".
- En planes personales, se presentará en una columna única centrada en la parte superior.

### Pasos Dinámicos de Onboarding:
- **Paso 1: Llenar Ingresos y Egresos**:
  - *Detección*: `ingresosFijosTotal > 0 || egresosFijosTotal > 0 || avgVarIncome > 0 || avgVarExpense > 0`
  - *Acción*: Botón "Llenar" redirige a `onNavigate("flujo")`.
- **Paso 2: Registrar Activos Físicos**:
  - *Detección*: `assetsTotal > 0`
  - *Acción*: Botón "Agregar" redirige a `onNavigate("activos_pasivos")`.
- **Paso 3: Añadir Deudas o Créditos**:
  - *Detección*: `liabilitiesTotal > 0`
  - *Acción*: Botón "Añadir" redirige a `onNavigate("deudas")`.

Cada paso mostrará un check verde si se cumple la condición de datos en el sistema, o un botón para ir directamente al módulo correspondiente. Un indicador de progreso en porcentaje (`0%`, `33%`, `67%`, `100%`) mostrará el avance total de configuración del sistema.
