#!/bin/bash
# =============================================================================
# deploy.sh — Golden Tower ERP
# Script de deploy y actualización en el servidor
# Ejecutar desde: /var/www/gestion
# Uso: bash deploy.sh
# =============================================================================

set -e  # Detener si hay algún error

PROJECT_DIR="/var/www/gestion"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo ""
echo "========================================================"
echo "  🚀 Deploy Golden Tower ERP — $TIMESTAMP"
echo "========================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "❌ Error: No se encontró package.json en $PROJECT_DIR"
  echo "   Asegúrate de ejecutar este script desde /var/www/gestion"
  exit 1
fi

cd "$PROJECT_DIR"

# --- 1. Verificar archivos .env ---
echo "🔑 [1/5] Verificando archivos .env..."

if [ ! -f "apps/api/.env" ]; then
  echo "   ⚠️  ADVERTENCIA: No existe apps/api/.env"
  echo "   → Cópialo desde produccion/env-templates/api.env.production y rellénalo"
  echo ""
fi

if [ ! -f "apps/web/.env.production" ]; then
  echo "   ⚠️  ADVERTENCIA: No existe apps/web/.env.production"
  echo "   → Cópialo desde produccion/env-templates/web.env.production"
  echo ""
fi

echo "   ✅ Verificación de .env completada"

# --- 2. Instalar dependencias ---
echo "📦 [2/5] Instalando dependencias del monorepo..."
npm install --frozen-lockfile
echo "   ✅ Dependencias instaladas"

# --- 3. Compilar el proyecto completo ---
echo "🔨 [3/5] Compilando proyecto (API + Web)..."
npm run build
echo "   ✅ Compilación exitosa"

# --- 4. Gestionar PM2 ---
echo "⚙️  [4/5] Gestionando servicios PM2..."

# Verificar si PM2 ya tiene los procesos corriendo
if pm2 list | grep -q "gestion-api\|gestion-web"; then
  echo "   → Servicios existentes detectados. Reiniciando..."
  pm2 restart ecosystem.config.cjs --update-env
else
  echo "   → Primera vez. Iniciando servicios..."
  pm2 start ecosystem.config.cjs
fi

pm2 save
echo "   ✅ Servicios PM2 actualizados"

# --- 5. Verificación rápida ---
echo "🩺 [5/5] Verificando estado de los servicios..."
sleep 3  # Esperar a que arranquen

echo ""
pm2 list

echo ""
echo "   🔍 Probando health check de la API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/health || echo "000")

if [ "$API_STATUS" = "200" ]; then
  echo "   ✅ API respondiendo correctamente (HTTP $API_STATUS)"
else
  echo "   ⚠️  API no responde aún (HTTP $API_STATUS) — puede necesitar unos segundos más"
  echo "   → Ejecuta: pm2 logs gestion-api --lines 30"
fi

echo ""
echo "========================================================"
echo "  ✅ Deploy completado: $TIMESTAMP"
echo ""
echo "  URLs del proyecto:"
echo "   🌐 Frontend: https://golden.simplemarketing.website"
echo "   🔌 API:      https://api.golden.simplemarketing.website"
echo ""
echo "  Comandos útiles:"
echo "   pm2 logs          → Ver logs en tiempo real"
echo "   pm2 list          → Estado de servicios"
echo "   pm2 monit         → Monitor visual"
echo "========================================================"
echo ""
