# 🏗️ Golden Tower ERP

Sistema de gestión empresarial (ERP) para Golden Tower. Monorepo unificado con frontend en Next.js, backend en NestJS (desplegado como Firebase Cloud Functions) y base de datos en Firestore.

---

## 🏛️ Arquitectura

```
GoldenTower/
├── apps/
│   ├── web/          # Frontend — Next.js 16 + Tailwind CSS
│   └── api/          # Backend  — NestJS → Firebase Cloud Functions
├── packages/
│   └── shared/       # Tipos y esquemas Zod compartidos
├── firebase.json     # Configuración del deploy a Firebase
└── turbo.json        # Configuración del monorepo (TurboRepo)
```

### Infraestructura de Producción

| Componente | Plataforma | URL |
|---|---|---|
| **Frontend** | Vercel | `https://tu-proyecto.vercel.app` |
| **Backend API** | Firebase Cloud Functions | `https://api-ht5pvvxzha-uc.a.run.app` |
| **Base de Datos** | Firestore (Firebase) | `gestion-de-proyectos-39ecc` |
| **Autenticación** | Firebase Auth | `gestion-de-proyectos-39ecc` |

---

## 🚀 Desarrollo Local

### Pre-requisitos
- Node.js >= 20
- npm >= 11

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/jkas93/GoldenTower.git
cd GoldenTower

# 2. Instalar dependencias del monorepo completo
npm install

# 3. Configurar variables de entorno del backend
cp apps/api/.env.example apps/api/.env
# → Edita apps/api/.env con tus credenciales de Firebase

# 4. Configurar variables de entorno del frontend
cp apps/web/.env.example apps/web/.env.local
# → Edita apps/web/.env.local con tus credenciales de Firebase
```

### Levantar el servidor

```bash
# Levanta frontend (puerto 3000) y backend (puerto 4001) simultáneamente
npm run dev

# Si hay conflicto de puertos (procesos colgados), usa:
npm run dev:clean
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4001

---

## 🌐 Deploy

### Frontend → Vercel (automático)
Conecta el repo en [vercel.com](https://vercel.com). Vercel detecta el `vercel.json` en `apps/web/` y hace deploy automático en cada push a `main`.

**Variables de entorno necesarias en Vercel:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_API_URL=https://api-ht5pvvxzha-uc.a.run.app
```

### Backend → Firebase (automático vía GitHub Actions)
El workflow `.github/workflows/deploy-firebase.yml` se activa automáticamente cuando hay cambios en `apps/api/` o `packages/shared/` en la rama `main`.

**Secrets necesarios en GitHub** (`Settings → Secrets → Actions`):
```
FIREBASE_TOKEN          → Token de Firebase CLI (firebase login:ci)
ADMIN_PROJECT_ID        → ID del proyecto de Firebase
ADMIN_CLIENT_EMAIL      → Email del Service Account
ADMIN_PRIVATE_KEY       → Llave privada del Service Account
FRONTEND_URL            → URL del frontend en producción
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS  → Config de correo
```

### Deploy manual del backend
```bash
firebase deploy --only functions --project gestion-de-proyectos-39ecc
```

---

## 📦 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta frontend y backend en modo desarrollo |
| `npm run dev:clean` | Mata puertos ocupados y levanta el entorno |
| `npm run build` | Compila todos los paquetes para producción |
| `npm run lint` | Ejecuta ESLint en todo el monorepo |

---

## 🔐 Seguridad

- **Nunca** subas al repositorio: `.env`, `.env.local`, `firebase-service-account.json`
- Las credenciales de producción van en **GitHub Secrets** (para CI/CD) y en el **panel de Vercel** (para el frontend)
- Los archivos sensibles están cubiertos por `.gitignore`
