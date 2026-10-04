# AGENTS.md — ribani-web

Instrucciones para agentes de IA (y humanos) que trabajen en este repo. Léelas antes de tocar código.

---

## Qué es

`ribani-web` es la aplicación web de RIBANI para el seguimiento de adultos mayores.

Incluye funcionalidades como:

- ubicación en tiempo real
- alertas
- zonas seguras
- medicamentos
- contactos
- dispositivos
- administración de usuarios
- roles
- auditoría

Es **una sola SPA** con rutas separadas por contexto/rol:

```text
/panel/* → vista familiar / seguimiento diario
/admin/* → administración del sistema
```

El rol viene incluido en el JWT.

El frontend utiliza el rol para determinar qué rutas y vistas puede mostrar, pero **la autorización real siempre corresponde al backend**.

El backend es `ribani-server`, construido con NestJS + Prisma.

El frontend nunca accede directamente a Prisma, PostgreSQL o Supabase.

---

# Stack fijo (no negociable)

No agregues dependencias alternativas sin discutirlo.

| Necesidad | Elección |
| --- | --- |
| Build/dev | Vite + TypeScript strict + React 19 |
| Estilos | Tailwind CSS |
| Rutas | `react-router-dom` |
| Estado de servidor | `@tanstack/react-query` |
| Estado de sesión | `zustand` (SOLO `stores/auth-store.ts`) |
| HTTP | `axios` |
| SSE | `@microsoft/fetch-event-source` |
| Mapa | `react-leaflet` + OpenStreetMap |
| Tipos de API | `openapi-typescript` |
| Package manager | npm |
| Linter | ESLint |

No introducir Redux, SWR, otro cliente HTTP, otro router o otra librería de mapas sin una decisión arquitectónica explícita.

---

# Comandos

```bash
npm run dev
npm run build
npm run lint
npx tsc -b
```

Generar tipos de API:

```bash
npx openapi-typescript http://localhost:3000/api-json -o src/types/api.d.ts
```

Package manager obligatorio: `npm`.

---

# Arquitectura

La aplicación utiliza una:

> Feature-Based Modular Architecture

con separación clara de responsabilidades.

```text
UI
 ↓
Feature
 ↓
Hook
 ↓
API Service
 ↓
API Client
 ↓
NestJS
 ↓
Prisma
 ↓
PostgreSQL / Supabase
```

Responsabilidades:

```text
React
    → presentación e interacción

Features
    → funcionalidad de dominio

Hooks
    → integración entre UI y estado/API

API services
    → comunicación HTTP tipada

TanStack Query
    → estado y cache del servidor

Zustand
    → únicamente sesión

NestJS
    → lógica de negocio y autorización

Prisma
    → acceso a datos

PostgreSQL / Supabase
    → persistencia
```

Ninguna capa debe asumir responsabilidades de otra.

---

# Estructura

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   └── guards/
│       ├── require-auth.tsx
│       └── require-role.tsx
│
├── components/
│   ├── ui/
│   └── layout/
│
├── features/
│   ├── auth/
│   ├── panel/
│   ├── ubicaciones/
│   ├── alertas/
│   ├── zonas-seguras/
│   ├── medicamentos/
│   ├── contactos/
│   ├── dispositivos/
│   ├── usuarios/
│   ├── roles/
│   └── auditoria/
│
├── lib/
│   ├── api-client.ts
│   ├── sse.ts
│   ├── query-client.ts
│   └── format.ts
│
├── stores/
│   └── auth-store.ts
│
├── types/
│   └── api.d.ts
│
├── config/
│   └── env.ts
│
├── main.tsx
└── index.css
```

---

# Anatomía de una feature

Toda feature nueva debe seguir esta estructura:

```text
features/alertas/
├── api/
│   └── alertas.api.ts
├── hooks/
│   └── use-alertas.ts
├── components/
│   └── alerta-card.tsx
├── pages/
│   └── alerta-page.tsx
└── index.ts
```

Puede agregar carpetas internas cuando la complejidad lo justifique:

```text
features/medicamentos/
├── api/
├── hooks/
├── components/
├── pages/
├── schemas/
├── utils/
├── types.ts
└── index.ts
```

No crear carpetas únicamente por seguir una plantilla si no son necesarias.

---

# Frontera entre features

## Regla de oro

Una feature solo puede importar funcionalidades públicas de otra feature a través de su `index.ts`.

Correcto:

```ts
import { useMedicamentos } from '@/features/medicamentos'
```

Incorrecto:

```ts
import { useMedicamentos } from '@/features/medicamentos/hooks/use-medicamentos'
```

También es incorrecto:

```ts
import { medicamentosApi } from '@/features/medicamentos/api/medicamentos.api'
```

desde otra feature.

El `index.ts` define explícitamente la API pública del módulo.

---

# API y OpenAPI

Los tipos de la API deben provenir exclusivamente de:

```text
src/types/api.d.ts
```

Este archivo es generado mediante:

```bash
npx openapi-typescript http://localhost:3000/api-json -o src/types/api.d.ts
```

## Nunca editar `api.d.ts` manualmente.

Si falta un tipo:

1. Revisar el contrato OpenAPI.
2. Verificar que el backend exponga correctamente el esquema.
3. Regenerar `api.d.ts`.
4. No crear un tipo duplicado manualmente.

---

# No inventar la API

Los agentes NO deben inventar:

- endpoints
- métodos HTTP
- nombres de propiedades
- DTOs
- respuestas
- códigos de error
- parámetros
- entidades
- relaciones

Si el frontend necesita una operación que no existe en el contrato:

- no crear un endpoint ficticio
- no simular permanentemente la respuesta
- no modificar el contrato unilateralmente

Se debe identificar el cambio necesario para `ribani-server`.

---

# API Client

Todo HTTP debe pasar por:

```text
lib/api-client.ts
```

El cliente Axios se encarga de:

- `baseURL`
- headers
- `Authorization`
- Bearer token
- refresh cuando corresponda
- manejo de errores HTTP comunes
- configuración global de Axios

Los componentes nunca utilizan Axios directamente.

Flujo:

```text
component
 ↓
hook
 ↓
feature/api
 ↓
api-client
 ↓
NestJS
```

Axios solo debe utilizarse en:

```text
lib/api-client.ts
features/*/api/*
```

---

# Estado del servidor

Todos los datos provenientes del backend deben gestionarse mediante:

```text
@tanstack/react-query
```

No copiar datos del backend a Zustand.

No duplicar el cache de React Query en `useState`.

No duplicar el cache de React Query en otro store.

---

# Query keys

Las query keys deben ser consistentes y estables.

Ejemplo:

```ts
['usuarios']
['usuarios', userId]
['medicamentos']
['medicamentos', medicationId]
['alertas']
['ubicaciones', adultoId]
```

Cuando una mutation modifica datos existentes, invalidar las queries correspondientes.

---

# Mutations

Las operaciones `POST`, `PUT`, `PATCH` y `DELETE` deben manejarse mediante `useMutation`.

Las mutations deben manejar:

- loading
- success
- error
- invalidación correspondiente

---

# Estado global

Zustand está reservado exclusivamente para:

```text
stores/auth-store.ts
```

Debe contener únicamente información relacionada con la sesión:

```text
token
usuario
rol
estado de autenticación
```

No utilizar Zustand para:

- usuarios
- medicamentos
- alertas
- ubicaciones
- contactos
- dispositivos

Esos datos pertenecen a TanStack Query.

---

# Estado local

Utilizar estado local para UI:

- modales
- formularios
- tabs
- filtros temporales
- dropdowns
- sidebar abierto/cerrado

No convertir estados locales simples en estado global.

---

# Autenticación

El flujo de autenticación debe pasar por:

```text
features/auth
 ↓
auth API
 ↓
api-client
 ↓
NestJS
 ↓
auth-store
```

La sesión se mantiene únicamente mediante:

```text
stores/auth-store.ts
```

---

# JWT y autorización

El frontend puede utilizar el rol del JWT para:

- mostrar/ocultar navegación
- proteger rutas
- seleccionar vistas
- mejorar UX

Pero:

> El JWT y los guards del frontend NO constituyen una frontera de seguridad.

El backend debe validar:

- autenticación
- autorización
- rol
- permisos
- acceso al recurso

Nunca asumir que porque una ruta está protegida en React el recurso está protegido.

---

# Guards

Los guards de rutas están en:

```text
src/app/guards/
```

Ejemplos:

```text
RequireAuth
RequireRole
```

Las rutas protegidas deben utilizar estos guards.

No hacer comprobaciones de rol dispersas en componentes que deberían estar protegidos por routing.

---

# Rutas

Las rutas se definen exclusivamente en:

```text
src/app/router.tsx
```

Segmentos principales:

```text
/panel/*
/admin/*
```

Ejemplo conceptual:

```text
/login

/panel
/panel/ubicaciones
/panel/alertas
/panel/medicamentos
/panel/contactos
/panel/dispositivos
/panel/zonas-seguras

/admin
/admin/usuarios
/admin/roles
/admin/auditoria
```

Toda página nueva debe registrarse en el router.

---

# Panel familiar

`/panel/*` corresponde a las funcionalidades utilizadas para el seguimiento diario del adulto mayor.

Puede incluir:

- dashboard
- ubicaciones
- alertas
- zonas seguras
- medicamentos
- contactos
- dispositivos

No colocar funcionalidades administrativas exclusivamente dentro del panel familiar.

---

# Panel administrativo

`/admin/*` corresponde a administración.

Puede incluir:

- usuarios
- roles
- auditoría

Las funcionalidades administrativas deben estar protegidas por los roles correspondientes.

---

# SSE / tiempo real

El tiempo real se implementa exclusivamente mediante:

```text
@microsoft/fetch-event-source
```

y:

```text
lib/sse.ts
```

Nunca utilizar `EventSource` nativo.

Nunca colocar tokens de autenticación en query strings.

El token debe enviarse mediante:

```http
Authorization: Bearer <token>
```

El acceso SSE debe pasar por:

```text
feature hook
 ↓
lib/sse.ts
 ↓
NestJS
```

El hook debe:

- encapsular la conexión
- limpiar la conexión al desmontar
- evitar conexiones duplicadas
- manejar reconexión según corresponda

---

# Features que utilizan SSE

Principalmente:

```text
features/ubicaciones/
features/alertas/
```

Ejemplo:

```text
features/ubicaciones/
├── api/
├── hooks/
│   └── use-ubicaciones-stream.ts
├── components/
├── pages/
└── index.ts
```

---

# Mapas

El mapa utiliza:

```text
react-leaflet
+
OpenStreetMap
```

No utilizar Google Maps para la funcionalidad estándar de ubicación.

No introducir API keys de mapas si no son necesarias.

Las coordenadas deben validarse antes de renderizar marcadores.

No asumir que siempre existe una coordenada válida.

---

# Ubicación en tiempo real

La funcionalidad de ubicación debe distinguir:

```text
última ubicación conocida
```

de:

```text
ubicación recibida en tiempo real
```

No presentar una ubicación antigua como si fuera necesariamente actual.

Cuando sea relevante, mostrar:

```text
Última actualización: ...
```

---

# Alertas

Las alertas pueden utilizar SSE para actualización en tiempo real.

El frontend debe distinguir los estados definidos por el contrato de la API.

Las acciones como atender o resolver deben ejecutarse mediante mutations contra el backend.

No inventar estados.

---

# Formularios

Para formularios complejos utilizar:

```text
React Hook Form
```

La validación debe respetar el contrato del backend.

Nunca confiar exclusivamente en validación frontend.

---

# UI compartida

Los componentes visuales reutilizables van en:

```text
components/ui/
```

Ejemplos:

```text
Button
Input
Select
Card
Badge
Modal
Dialog
Table
Spinner
Alert
Pagination
```

Si un componente contiene lógica específica de una feature, debe pertenecer a esa feature.

---

# Layout

Los elementos globales de navegación van en:

```text
components/layout/
```

Ejemplos:

```text
Shell
Sidebar
Topbar
```

No duplicar el sidebar o topbar dentro de cada página.

---

# Tailwind CSS

Los estilos deben utilizar Tailwind CSS.

Evitar crear CSS personalizado cuando Tailwind resuelva correctamente la necesidad.

No introducir otra librería de componentes visuales sin aprobación.

Mantener consistencia en:

- spacing
- typography
- responsive behavior
- estados hover/focus/disabled
- formularios
- tablas
- tarjetas
- navegación

---

# Responsive Design

La aplicación debe funcionar correctamente en:

- desktop
- tablet
- mobile

No asumir que el panel solo será utilizado en escritorio.

La navegación debe adaptarse a pantallas pequeñas.

Los mapas y tablas deben contemplar espacios reducidos.

---

# Accesibilidad

Los componentes interactivos deben ser accesibles.

Utilizar elementos semánticos apropiados.

No utilizar:

```html
<div onClick={...}>
```

como sustituto de un botón.

Los inputs deben tener labels apropiados.

Los elementos interactivos deben poder utilizarse mediante teclado.

Los estados de loading, error, success y disabled deben ser comprensibles.

No depender únicamente del color para comunicar estados importantes.

---

# Manejo de errores

Casos principales:

```text
400 → datos inválidos
401 → no autenticado
403 → sin permisos
404 → recurso no encontrado
409 → conflicto
422 → validación
500 → error interno
```

No mostrar errores técnicos directamente al usuario.

Evitar:

```text
AxiosError
Request failed with status code 500
```

Preferir mensajes comprensibles.

---

# Loading states

Toda consulta que pueda tardar debe tener un estado de carga.

Ejemplos:

- Skeleton
- Spinner
- Loading state
- Disabled button

No mostrar una pantalla vacía mientras se espera una petición.

---

# Empty states

Cuando una consulta devuelve cero resultados, mostrar un estado vacío apropiado.

No confundir:

```text
loading
```

con:

```text
empty
```

ni:

```text
error
```

con:

```text
empty
```

---

# Seguridad

Nunca almacenar en el frontend:

- passwords
- secrets
- claves privadas
- credenciales de base de datos
- Supabase service role key
- JWT secret

Las variables `VITE_*` deben considerarse públicas.

Nunca confiar en el frontend para autorización.

Nunca colocar tokens en:

- URL
- query string
- logs
- mensajes de error

Evitar registrar información sensible en consola.

---

# Variables de entorno

La única salida permitida para variables de entorno es:

```text
src/config/env.ts
```

Fuera de ese archivo está prohibido utilizar directamente:

```ts
import.meta.env.VITE_API_URL
```

Debe utilizarse:

```ts
import { env } from '@/config/env'
```

Ejemplo:

```env
VITE_API_URL=http://localhost:3000/api
```

El archivo `.env` nunca se commitea.

Debe mantenerse:

```text
.env.example
```

sin secretos.

---

# Convenciones de nombres

Archivos:

```text
kebab-case
```

Ejemplos:

```text
alertas.api.ts
use-alertas.ts
alerta-card.tsx
use-ubicaciones-stream.ts
```

Componentes:

```text
PascalCase
```

Ejemplo:

```tsx
AlertaCard
UserTable
MedicamentoForm
```

Hooks:

```text
use-*
```

---

# Idioma

Usar español para:

- nombres de features de dominio
- rutas de dominio
- textos de UI
- conceptos propios de RIBANI

Usar inglés para:

- conceptos técnicos genéricos
- helpers
- infraestructura
- nombres de librerías
- patrones técnicos

Ejemplo:

```text
features/medicamentos/
features/alertas/
features/ubicaciones/
```

pero:

```text
api-client.ts
query-client.ts
```

---

# Imports

Utilizar el alias:

```text
@/
```

que apunta a:

```text
src/
```

Preferir:

```ts
import { Button } from '@/components/ui/button'
```

sobre rutas relativas excesivamente largas.

Dentro de una misma feature se permiten imports relativos cuando mejoren la claridad.

---

# TypeScript

TypeScript debe mantenerse en modo strict.

No utilizar `any` salvo una excepción técnica explícitamente justificada.

No silenciar errores mediante:

```ts
@ts-ignore
```

sin una razón documentada.

Evitar:

```ts
as any
```

para ocultar problemas de tipado.

---

# Código muerto

No entregar:

- `console.log` innecesarios
- TODO sin justificación
- FIXME sin justificación
- código comentado muerto
- imports sin usar
- componentes demo

No conservar el contenido demo de Vite una vez que comience la implementación real.

---

# Dependencias

Antes de instalar una dependencia:

1. Verificar si ya existe una solución dentro del stack.
2. Verificar `package.json`.
3. Evitar duplicar librerías.
4. Evaluar si realmente es necesaria.
5. Mantener la dependencia limitada al problema que resuelve.

No instalar automáticamente una librería para cada necesidad pequeña.

---

# Cambios en backend

Este repositorio corresponde exclusivamente a:

```text
ribani-web
```

No modificar automáticamente:

```text
ribani-server
ribani-mobile
```

Si una funcionalidad requiere cambios en NestJS:

1. Identificar el endpoint o contrato necesario.
2. Documentar el cambio requerido.
3. No inventar una implementación temporal como solución definitiva.
4. Coordinar el cambio con el backend.
5. Regenerar `api.d.ts` cuando el contrato cambie.

---

# Cambios en el contrato API

Cuando cambie la API:

```text
NestJS
   ↓
OpenAPI
   ↓
api.d.ts
   ↓
Frontend
```

Orden recomendado:

1. Cambiar backend.
2. Levantar backend.
3. Verificar `/api-json`.
4. Regenerar `src/types/api.d.ts`.
5. Corregir errores de TypeScript.
6. Ejecutar lint.
7. Ejecutar build.
8. Probar comportamiento real.

Nunca editar manualmente `api.d.ts` para hacer desaparecer errores.

---

# Flujo de trabajo de un agente

Antes de modificar código:

1. Leer `AGENTS.md`.
2. Revisar la estructura existente.
3. Revisar `package.json`.
4. Revisar el contrato API disponible.
5. Buscar implementaciones existentes antes de crear nuevas.
6. Identificar la feature correspondiente.
7. Determinar si se necesita modificación del backend.

Después:

1. Implementar el cambio mínimo necesario.
2. Mantener la arquitectura.
3. Reutilizar componentes existentes.
4. Reutilizar hooks y servicios existentes.
5. Ejecutar typecheck.
6. Ejecutar lint.
7. Ejecutar build cuando corresponda.
8. Probar el flujo real si se modificó autenticación, routing, guards, SSE, API o estado del servidor.

---

# No sobreingeniería

No introducir abstracciones innecesarias.

No crear factories, managers, repositories, services, providers o wrappers solo porque podrían ser útiles.

Crear una abstracción cuando:

- existe duplicación real
- existe una responsabilidad clara
- mejora la mantenibilidad
- evita acoplamiento
- existe una necesidad concreta

La arquitectura debe ser modular, pero no innecesariamente compleja.

---

# Antes de crear una nueva feature

Comprobar:

1. ¿Ya existe una feature relacionada?
2. ¿El backend tiene el dominio correspondiente?
3. ¿Existe el endpoint?
4. ¿Existe en OpenAPI?
5. ¿Los tipos ya están generados?
6. ¿Existe un componente reutilizable?
7. ¿Existe un hook similar?
8. ¿Existe un API service relacionado?

No crear duplicados.

---

# Criterios de aceptación

Una tarea no está terminada solamente porque "funciona".

Debe cumplir:

```text
[ ] Arquitectura respetada
[ ] Feature correcta
[ ] API existente y tipada
[ ] Sin any innecesarios
[ ] Sin Axios fuera de las ubicaciones permitidas
[ ] Sin datos del servidor en Zustand
[ ] Sin importaciones internas entre features
[ ] Rutas protegidas correctamente
[ ] Loading state
[ ] Error state
[ ] Empty state cuando corresponda
[ ] Responsive
[ ] Accesibilidad básica
[ ] Typecheck correcto
[ ] ESLint correcto
[ ] Build correcto cuando corresponda
```

---

# Comandos de validación

Antes de terminar:

```bash
npx tsc -b
```

Debe terminar sin errores.

Después:

```bash
npm run lint
```

Debe terminar sin errores.

Cuando corresponda:

```bash
npm run build
```

Debe completar correctamente.

Si se modificó una funcionalidad de runtime:

```bash
npm run dev
```

y probar el flujo real.

---

# Verificación de funcionalidades críticas

## Autenticación

```text
[ ] Login
[ ] Logout
[ ] Token
[ ] Refresh
[ ] 401
[ ] Redirección al login
[ ] Guard de autenticación
```

## Autorización

```text
[ ] RequireAuth
[ ] RequireRole
[ ] /panel
[ ] /admin
[ ] acceso permitido
[ ] acceso denegado
```

## SSE

```text
[ ] Authorization
[ ] conexión
[ ] recepción de eventos
[ ] reconexión
[ ] cleanup
[ ] no hay conexiones duplicadas
[ ] no hay token en URL
```

## Consultas

```text
[ ] loading
[ ] success
[ ] error
[ ] empty
[ ] cache
[ ] invalidación después de mutation
```

---

# Estado actual del repositorio

El repositorio contiene actualmente el template base de Vite.

El `AGENTS.md` describe la arquitectura objetivo.

Al trabajar en este repositorio:

1. Instalar las dependencias del stack antes de utilizarlas.
2. Crear la estructura definida en este documento.
3. Reemplazar el demo inicial de Vite.
4. No mantener el demo junto con la aplicación real.
5. Configurar Tailwind antes de comenzar a utilizar sus clases.
6. Configurar el alias `@/` en `vite.config.ts` y TypeScript antes de utilizarlo.
7. Configurar el API client antes de crear features que consuman backend.
8. Generar `api.d.ts` antes de implementar integraciones reales con la API.

---

# Orden recomendado de implementación

```text
1. Dependencias
       ↓
2. TypeScript strict
       ↓
3. ESLint
       ↓
4. Tailwind CSS
       ↓
5. Alias @/
       ↓
6. Configuración env
       ↓
7. API Client
       ↓
8. Query Client
       ↓
9. Auth Store
       ↓
10. React Router
       ↓
11. Guards
       ↓
12. Layout
       ↓
13. Login
       ↓
14. Autenticación real
       ↓
15. Panel
       ↓
16. Admin
       ↓
17. Features de dominio
       ↓
18. SSE
       ↓
19. Mapa
```

No implementar todos los módulos de dominio simultáneamente.

Primero establecer correctamente la infraestructura.

---

# Regla final

La regla fundamental de `ribani-web` es:

```text
React
  ↓
Features
  ↓
Hooks
  ↓
TanStack Query
  ↓
API Services
  ↓
Axios API Client
  ↓
NestJS
  ↓
Prisma
  ↓
PostgreSQL / Supabase
```

Y para tiempo real:

```text
React
  ↓
Feature Hook
  ↓
lib/sse.ts
  ↓
fetch-event-source
  ↓
NestJS SSE
```

La aplicación web:

- presenta información
- gestiona interacción
- consume la API
- administra la sesión
- muestra estados y errores
- recibe eventos en tiempo real

El backend:

- autentica
- autoriza
- valida
- ejecuta lógica de negocio
- accede a la base de datos
- controla permisos
- expone la API

**Nunca mover lógica de negocio del backend al frontend únicamente para evitar implementar correctamente el backend.**

**Nunca romper las fronteras de las features para ahorrar unas líneas de código.**

**Nunca inventar contratos de API que no existen.**
