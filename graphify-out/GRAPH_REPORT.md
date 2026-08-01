# Graph Report - .  (2026-07-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 158 nodes · 229 edges · 15 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4461353d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- devDependencies
- dependencies
- formatCLP
- test_debts.js
- LandingPageView.jsx
- manifest.json
- package.json
- DashboardView.jsx
- generate_template.js
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `formatCLP()` - 15 edges
2. `react` - 8 edges
3. `App()` - 8 edges
4. `HISTORICAL_FLOWS` - 7 edges
5. `ErrorBoundary` - 6 edges
6. `initializeDefaultUserData()` - 6 edges
7. `supabase` - 6 edges
8. `FlujoMensualView()` - 6 edges
9. `scripts` - 5 edges
10. `parseMonthYear()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `App()` --references--> `react`  [EXTRACTED]
  src/App.jsx → package.json
- `DashboardView()` --references--> `react`  [EXTRACTED]
  src/sections/DashboardView.jsx → package.json
- `LandingPageView()` --references--> `react`  [EXTRACTED]
  src/sections/LandingPageView.jsx → package.json
- `ExcelUploader()` --references--> `xlsx`  [EXTRACTED]
  src/sections/dashboard/ExcelUploader.jsx → package.json
- `DeudasView()` --references--> `react`  [EXTRACTED]
  src/sections/DeudasView.jsx → package.json

## Import Cycles
- None detected.

## Communities (15 total, 0 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.11
Nodes (20): ActivosPasivosView, adjustDebtsPaidInstallments(), AdminConsoleView, App(), DashboardView, DeudasView, FlujoMensualView, formatMoney() (+12 more)

### Community 1 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+11 more)

### Community 2 - "dependencies"
Cohesion: 0.12
Nodes (17): heic2any, lucide-react, dependencies, heic2any, lucide-react, react-dom, react-is, recharts (+9 more)

### Community 3 - "formatCLP"
Cohesion: 0.23
Nodes (11): react, react, formatCLP(), ActivosPasivosView(), DeudasView(), FlujoMensualView(), getQuarterInfo(), parseMonthYear() (+3 more)

### Community 4 - "test_debts.js"
Cohesion: 0.18
Nodes (14): assert, debtsState, getMonthDistance(), getStartMonth(), monthlyDetailsState, parseMonthYear(), pato_Jun, runSimulation() (+6 more)

### Community 5 - "LandingPageView.jsx"
Cohesion: 0.21
Nodes (6): LANDING_PAGE_DEFAULTS, supabase, LandingEditorView(), LandingPageView(), STEPS, LoginView()

### Community 6 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, scope, short_name (+2 more)

### Community 7 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 8 - "DashboardView.jsx"
Cohesion: 0.31
Nodes (5): compressImage(), DashboardCharts(), ExcelUploader(), sanitizeParsedObject(), DashboardView()

### Community 9 - "generate_template.js"
Cohesion: 0.40
Nodes (4): wb, ws_activos, ws_deudas, ws_flujos

### Community 10 - ".mcp.json"
Cohesion: 0.50
Nodes (3): paddle-docs, paddle-live, paddle-sandbox

## Knowledge Gaps
- **61 isolated node(s):** `paddle-sandbox`, `paddle-live`, `paddle-docs`, `name`, `private` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `formatCLP`, `package.json`?**
  _High betweenness centrality (0.305) - this node is a cross-community bridge._
- **Why does `react` connect `formatCLP` to `App.jsx`, `DashboardView.jsx`, `dependencies`, `LandingPageView.jsx`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **What connects `paddle-sandbox`, `paddle-live`, `paddle-docs` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._