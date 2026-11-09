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

## PWA: instalación y uso sin conexión

El build genera `manifest.webmanifest`, `sw.js` e iconos de RIBANI. El service
worker se registra en producción; `npm run dev` no instala la caché offline.
Para verificarlo localmente:

```powershell
npm run build
npm run preview
```

El build necesita `VITE_API_URL` con HTTPS, como en producción. Abrir el origen
`localhost` indicado por preview, visitar la aplicación con conexión y esperar
a que el service worker se active antes de probar offline. Para instalar:

- Chrome/Edge compatibles: opción «Instalar RIBANI» en el navegador.
- iPhone/iPad: compartir la página en Safari y elegir «Agregar a inicio».
- Producción: servir la web y API por HTTPS y conservar el fallback SPA.
  Una IP de la red local por HTTP no sustituye a `localhost` para estas pruebas.

La PWA inicia en `/panel` y conserva los guards existentes. El service worker
guarda únicamente archivos estáticos locales. No almacena respuestas de API,
SSE, mapas ni fuentes externas, y no encola operaciones para enviarlas después.
Tras una primera visita online, la interfaz puede abrir sin conexión en `/`,
`/login`, `/panel/*` y `/admin/*`; consultar datos, autenticar y guardar cambios
sigue necesitando la API. Los datos que permanezcan en memoria no son actuales.

Un aviso global informa cuando el navegador detecta desconexión, incluso durante
la restauración de sesión, y desaparece al recuperar la red. `navigator.onLine`
indica conectividad del dispositivo: no confirma que el backend esté disponible.
Los errores HTTP siguen gestionándose mediante los flujos existentes.

Las versiones nuevas del service worker esperan a que se cierren las ventanas
de la aplicación para activarse, evitando recargar un formulario en curso.
nginx sirve los archivos de registro, service worker y manifiesto con `no-cache`
y responde 404 si faltan. El escudo original de `public/favicon.svg` se reutiliza
en los iconos; para regenerarlos en Windows:

```powershell
./scripts/generate-pwa-icons.ps1
```

Comprobación en DevTools: Application → Manifest y Service workers; después,
Network → Offline y recargar una ruta profunda. Verificar que aparece «Sin
conexión», que la interfaz abre desde caché y que Cache Storage contiene solo
archivos estáticos. Al volver a Online, comprobar que el aviso desaparece.

## Contenedor

`Dockerfile` construye el SPA y lo sirve con nginx (`docker/nginx.conf`):
fallback a `index.html` para React Router, caché inmutable en `/assets` y
`no-cache` en el HTML.

`VITE_API_URL` se incrusta en el bundle al construir, así que se pasa como
argumento y debe ser HTTPS (el build falla si no lo es):

```bash
docker build -t ribani-web --build-arg VITE_API_URL=https://api.tudominio.com .
docker run --rm -p 8081:80 ribani-web   # http://localhost:8081
```

En el servidor se despliega junto al backend con `ribani-server/deploy/vps`; ver
[despliegue en VPS](../ribani-server/docs/despliegue-vps.md).

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
