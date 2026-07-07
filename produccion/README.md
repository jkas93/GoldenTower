# 🚀 Guía de Deploy — Vercel (Frontend) + Railway (API)
**Frontend:** `golden.simplemarketing.website` → Vercel  
**API:** subdominio en Railway (o `api.golden.simplemarketing.website`)

---

## ANTES DE EMPEZAR: Configura el repositorio en GitHub

El proyecto debe estar en: `https://github.com/jkas93/golden`

Desde tu PC, ejecuta en PowerShell:
```powershell
cd "c:\Users\GOLDEN TOWER\webs\gestion"

# Cambiar el remote al nuevo repositorio
git remote set-url origin https://github.com/jkas93/golden.git

# Primer push (puede pedir tus credenciales de GitHub)
git push -u origin main
```

---

## PARTE 1 — Railway (API NestJS)

### Paso 1: Crear el proyecto en Railway

1. Entra a [railway.com](https://railway.com) y haz clic en **"New Project"**
2. Elige **"Deploy from GitHub repo"**
3. Selecciona el repositorio `jkas93/golden`
4. Railway detectará el `railway.json` automáticamente ✅

### Paso 2: Configurar las Variables de Entorno en Railway

En tu proyecto Railway → **Variables** → añade una por una:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4001` |
| `FIREBASE_PROJECT_ID` | (tu proyecto Firebase) |
| `FIREBASE_CLIENT_EMAIL` | (tu service account email) |
| `FIREBASE_PRIVATE_KEY` | (tu clave privada completa) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | (tu email Gmail) |
| `SMTP_PASS` | (contraseña de aplicación Gmail) |
| `FRONTEND_URL` | `https://golden.simplemarketing.website` |

> Ver plantilla en `env-templates/api.env.production` para detalles de cada variable.

### Paso 3: Activar dominio personalizado en Railway (opcional)

En Railway → tu servicio → **Settings → Networking → Custom Domain**:
- Añade: `api.golden.simplemarketing.website`
- Railway te dará un registro CNAME que debes añadir en el DNS de Hostinger

O puedes usar la URL por defecto que Railway genera (tipo `golden-api.up.railway.app`).

---

## PARTE 2 — Vercel (Frontend Next.js)

### Paso 1: Importar el proyecto en Vercel

1. Entra a [vercel.com](https://vercel.com) → **"Add New Project"**
2. Elige **"Import Git Repository"**
3. Selecciona `jkas93/golden`
4. El `vercel.json` ya configura todo automáticamente ✅
5. Haz clic en **"Deploy"**

### Paso 2: Configurar Variables de Entorno en Vercel

En Vercel → tu proyecto → **Settings → Environment Variables** → añade:

| Variable | Valor | Environment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL de tu API en Railway (ej. `https://golden-api.up.railway.app`) | Production |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (tu clave Firebase) | Production |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | (tu dominio Firebase) | Production |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (tu project ID) | Production |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | (tu storage bucket) | Production |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (tu sender ID) | Production |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (tu app ID) | Production |

> ⚠️ En `NEXT_PUBLIC_API_URL` pon la URL que Railway te asignó ANTES de hacer el redeploy de Vercel.

### Paso 3: Conectar dominio personalizado en Vercel

En Vercel → tu proyecto → **Settings → Domains**:
- Añade: `golden.simplemarketing.website`
- Vercel te dará los registros DNS que debes añadir en Hostinger → hPanel → DNS Zone

---

## Deploy de actualizaciones futuras

Una vez configurado, **cualquier `git push` a la rama `main`** disparará automáticamente:
- Un nuevo build en **Vercel** (Frontend)
- Un nuevo deploy en **Railway** (API)

```powershell
# Flujo normal de trabajo
git add .
git commit -m "descripción del cambio"
git push origin main
# Listo! Vercel y Railway lo despliegan solos ✅
```

---

## Verificación

Después del primer deploy, verifica:

```bash
# API Health Check
curl https://TU-URL-RAILWAY.up.railway.app/health
# Esperado: {"status":"ok"}
```

Y abre `https://golden.simplemarketing.website` en el navegador.
