# RIBANI Web

SPA para el seguimiento familiar de adultos mayores y la administración de
RIBANI. Consume exclusivamente la API REST de `ribani-server`.

React 19, Vite, TypeScript strict, Tailwind, React Router, TanStack Query,
Zustand para sesión, Axios, fetch-event-source y React Leaflet/OpenStreetMap.

## Preparación y ejecución

Usar Node 24 LTS y npm. Desde `ribani-web`:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Copiar `.env.example` solo si no existe `.env`. `VITE_API_URL` es una URL pública
que apunta a NestJS, normalmente `http://localhost:3000`, sin `/api`.
Los secretos de JWT, correo y PostgreSQL permanecen en el backend.

Iniciar el servidor con `npm run start:dev` desde `ribani-server` y comprobar
que `CORS_ORIGINS` permita el origen que muestra Vite.

## Rutas y funcionalidades

- `/login`: registro familiar, login y segundo paso TOTP.
- `/panel/*`: seguimiento, ubicación con SSE/mapa, alertas HTTP, medicamentos,
  horarios/tomas, contactos, dispositivos, familiares y configuración de cuenta.
- `/admin/*`: usuarios, roles/permisos, auditoría y supervisión de relaciones,
  ubicaciones, alertas, medicamentos y contactos.

El dashboard de `/panel` y zonas seguras todavía son pantallas pendientes.
La web aún no conecta SSE de alertas. Los guards de React controlan navegación;
la autorización efectiva siempre se comprueba en NestJS.

## Sesión y datos

Zustand conserva únicamente credenciales y datos de sesión. TanStack Query
conserva los datos de servidor. Terminar una sesión o cambiar de cuenta limpia
las consultas y cierra SSE. Las respuestas y renovaciones tardías de una sesión
anterior se descartan. Renovar tokens de la misma sesión conserva su caché.

Los hooks encapsulan consultas y mutations. Los API services usan
`lib/api-client.ts`. Los imports entre features pasan por su `index.ts`.

## Verificación

```powershell
npm test
npx tsc -b
npm run lint
npm run build
```

Las pruebas de sesión usan `node:test`, `node:module.registerHooks` (verificadas
en Node 22.23.2) y el TypeScript ya instalado. El cargador de `test/` resuelve el alias
`@/` y transpila solo los archivos TypeScript de la aplicación, sin cambiar Vite.
Comprueban aislamiento de caché, refresh, peticiones tardías y cierre de SSE.
No usan credenciales reales ni requieren conectar el backend o Supabase.

Después, comprobar en navegador login/logout, cambio entre dos cuentas,
renovación de sesión, acceso permitido/denegado y reconexión de ubicación.

## Tipos de API

Desde `ribani-server`:

```powershell
npm run openapi:export
```

Después, desde `ribani-web`:

```powershell
npm run api:types
npx tsc -b
```

`api:types` usa la CLI `openapi-typescript@7.13.0` mediante npx y el `openapi.json`
exportado en la carpeta vecina. Si la CLI no está en caché, npx necesitará red.
También sigue disponible el comando indicado en AGENTS.md para generar tipos
contra `http://localhost:3000/api-json` con la API iniciada.

No editar `src/types/api.d.ts` manualmente. Ya se regeneró desde el contrato
actualizado; autenticación, sesión y usuarios/perfil consumen sus schemas.
Falta documentar las respuestas y sustituir tipos HTTP manuales de otros dominios.

## Estado de esta revisión

La sección WhatsApp está disponible en `/panel/whatsapp` y `/admin/whatsapp`:
registro de destinatarios, consentimiento, prueba (cuando se habilite Meta),
historial real y preferencias de recordatorios. Los tipos provienen del OpenAPI
del backend. Alertas muestra conteos reales de envío/entrega/lectura por estado.
La integración externa permanece deshabilitada; ver
[guía del backend](../ribani-server/docs/whatsapp.md).

Verificado con Node 22.23.2 y npm 12.1.0:

- `npm test`: 14 pruebas aprobadas.
- `npm run lint`: sin errores ni advertencias.
- `npm run build`: TypeScript y Vite aprobados; aviso de bundle mayor de 500 kB.
- `npm run api:types`: contrato generado con openapi-typescript 7.13.0.
- `npm run dev`: servidor iniciado y HTTP 200 en `http://localhost:5173/`.

Se corrigió el reinicio de los modales al abrirlos: su contenido se monta de
nuevo, sin setState síncrono en efectos. La comprobación de flujos completos con
cuentas reales en navegador sigue pendiente y debe hacerse antes de desplegar.
