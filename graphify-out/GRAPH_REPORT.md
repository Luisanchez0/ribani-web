# Graph Report - ribani-web  (2026-10-09)

## Corpus Check
- Corpus is ~24,786 words - fits in a single context window. You may not need a graph.

## Summary
- 340 nodes · 610 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.87)
- Token cost: 14,500 input · 3,200 output

## Community Hubs (Navigation)
- Auth Guards and Routing
- HTTP Session and Environment
- Project Tooling Config
- UI Alerts and Buttons
- UI Cards Tables Icons
- Architecture Conventions Docs
- Usuarios Feature API Layer
- TypeScript App Compiler Options
- TypeScript Node Compiler Options
- Runtime Dependencies
- Dev Dependencies
- App Providers and Query Client
- OpenAPI Generated Types
- TSConfig Project References

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 20 edges
2. `react` - 17 edges
3. `AppRouter()` - 17 edges
4. `LoginPage()` - 16 edges
5. `useAuthStore` - 15 edges
6. `compilerOptions` - 15 edges
7. `UsuariosPage()` - 14 edges
8. `Button()` - 11 edges
9. `UsuarioFormularioModal()` - 10 edges
10. `react-router-dom` - 9 edges

## Surprising Connections (you probably didn't know these)
- `RIBANI Shield Checkmark Logo` --references--> `RIBANI Web App`  [INFERRED]
  public/favicon.svg → AGENTS.md
- `Hyperlegible Typography Choice (Accessibility-Oriented)` --semantically_similar_to--> `Frontend Design Principles (agents copy)`  [INFERRED] [semantically similar]
  index.html → .agents/skills/frontend-design/SKILL.md
- `Frontend Design Principles (.claude copy)` --semantically_similar_to--> `Frontend Design Principles (agents copy)`  [INFERRED] [semantically similar]
  .claude/skills/frontend-design/SKILL.md → .agents/skills/frontend-design/SKILL.md
- `Frontend Design Principles (skills/ copy)` --semantically_similar_to--> `Frontend Design Principles (agents copy)`  [INFERRED] [semantically similar]
  skills/frontend-design/SKILL.md → .agents/skills/frontend-design/SKILL.md
- `Apache 2.0 License (.claude copy)` --semantically_similar_to--> `Apache 2.0 License (agents copy)`  [INFERRED] [semantically similar]
  .claude/skills/frontend-design/LICENSE.txt → .agents/skills/frontend-design/LICENSE.txt

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **RIBANI Stack Conventions** — agents_md_server_state_rule, agents_md_auth_store_rule, agents_md_api_client_rule, agents_md_sse_realtime_rule, agents_md_openapi_types_rule [EXTRACTED 0.90]

## Communities (14 total, 1 thin omitted)

### Community 0 - "Auth Guards and Routing"
Cohesion: 0.07
Nodes (22): react-router-dom, RequireAuth(), RequireRole(), RequireRoleProps, ROL_ADMINISTRADOR, AppRouter(), Shell(), ItemNavegacion (+14 more)

### Community 1 - "HTTP Session and Environment"
Cohesion: 0.09
Nodes (28): axios, @microsoft/fetch-event-source, zustand, Topbar(), TopbarProps, env, authApi, destinoDesdeEstado() (+20 more)

### Community 2 - "Project Tooling Config"
Cohesion: 0.07
Nodes (30): name, private, scripts, build, dev, lint, preview, type (+22 more)

### Community 3 - "UI Alerts and Buttons"
Cohesion: 0.10
Nodes (25): Alert(), AlertProps, AlertVariant, variantes, Button(), ButtonProps, ButtonSize, ButtonVariant (+17 more)

### Community 4 - "UI Cards Tables Icons"
Cohesion: 0.10
Nodes (20): react, Table(), Td(), Th(), BadgeEstado(), BadgeProps, UsuariosTabla(), UsuariosTablaProps (+12 more)

### Community 5 - "Architecture Conventions Docs"
Cohesion: 0.09
Nodes (23): All HTTP Through Central API Client, Session State Confined to Zustand Auth Store, Feature-Based Modular Architecture, Cross-Feature Imports Only Via index.ts, Frontend/Backend Responsibility Split, JWT Role-Based Routing, API Types Generated From OpenAPI (api.d.ts), ribani-server (NestJS + Prisma Backend) (+15 more)

### Community 6 - "Usuarios Feature API Layer"
Cohesion: 0.21
Nodes (15): usuariosApi, useActivarUsuario(), useActualizarUsuario(), useCrearUsuario(), useEliminarUsuario(), clavesUsuarios, useRoles(), useUsuarios() (+7 more)

### Community 7 - "TypeScript App Compiler Options"
Cohesion: 0.09
Nodes (21): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+13 more)

### Community 8 - "TypeScript Node Compiler Options"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Runtime Dependencies"
Cohesion: 0.14
Nodes (14): dependencies, axios, leaflet, @microsoft/fetch-event-source, react, react-dom, react-leaflet, react-native-svg (+6 more)

### Community 10 - "Dev Dependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/leaflet, @types/node (+6 more)

### Community 11 - "App Providers and Query Client"
Cohesion: 0.31
Nodes (5): react-dom, @tanstack/react-query, App(), AppProviders(), queryClient

### Community 12 - "OpenAPI Generated Types"
Cohesion: 0.33
Nodes (5): components, $defs, operations, paths, webhooks

## Knowledge Gaps
- **21 isolated node(s):** `leaflet`, `react-leaflet`, `react-native-svg`, `tailwindcss`, `@types/leaflet` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 160 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `UI Cards Tables Icons` to `Auth Guards and Routing`, `Project Tooling Config`, `UI Alerts and Buttons`, `Usuarios Feature API Layer`, `App Providers and Query Client`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **What connects `leaflet`, `react-leaflet`, `react-native-svg` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Guards and Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.07199032062915911 - nodes in this community are weakly interconnected._
- **Why does `react-router-dom` connect `Auth Guards and Routing` to `HTTP Session and Environment`, `Project Tooling Config`, `App Providers and Query Client`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `HTTP Session and Environment` be split into smaller, more focused modules?**
  _Cohesion score 0.08562367864693446 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Runtime Dependencies` to `Project Tooling Config`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `Project Tooling Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._