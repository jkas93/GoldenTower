#!/bin/bash
# =============================================================================
# setup-servidor.sh — Golden Tower ERP
# Preparación inicial del VPS de Hostinger (Ubuntu 22.04)
# Ejecutar como root: bash setup-servidor.sh
# =============================================================================

set -e  # Detener si hay algún error

echo ""
echo "========================================================"
echo "  🚀 Configurando servidor para Golden Tower ERP"
echo "========================================================"
echo ""

# --- 1. Actualizar paquetes del sistema ---
echo "📦 [1/7] Actualizando paquetes del sistema..."
apt update && apt upgrade -y

# --- 2. Instalar herramientas esenciales ---
echo "🔧 [2/7] Instalando herramientas esenciales..."
apt install -y git curl wget unzip nginx ufw certbot python3-certbot-nginx

# --- 3. Instalar Node.js 20 LTS (via NodeSource) ---
echo "🟢 [3/7] Instalando Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "   ✅ Node.js: $(node -v)"
echo "   ✅ npm: $(npm -v)"

# --- 4. Instalar PM2 globalmente ---
echo "⚙️  [4/7] Instalando PM2..."
npm install -g pm2
echo "   ✅ PM2: $(pm2 -v)"

# --- 5. Configurar Firewall (UFW) ---
echo "🔒 [5/7] Configurando Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "   ✅ Firewall activado (SSH + HTTP/HTTPS permitidos)"

# --- 6. Habilitar y arrancar Nginx ---
echo "🌐 [6/7] Configurando Nginx..."
systemctl enable nginx
systemctl start nginx
echo "   ✅ Nginx iniciado"

# --- 7. Crear directorio para el proyecto ---
echo "📁 [7/7] Creando directorio del proyecto..."
mkdir -p /var/www/gestion
echo "   ✅ Directorio creado: /var/www/gestion"

echo ""
echo "========================================================"
echo "  ✅ Servidor listo para el deploy"
echo ""
echo "  Resumen:"
echo "   • Node.js $(node -v) instalado"
echo "   • PM2 $(pm2 -v) instalado"
echo "   • Nginx instalado y corriendo"
echo "   • Certbot instalado (para HTTPS)"
echo "   • Firewall activo (SSH + HTTP/HTTPS)"
echo ""
echo "  Siguiente paso: clonar el proyecto en /var/www/gestion"
echo "========================================================"
echo ""
