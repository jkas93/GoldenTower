// =============================================================================
// ecosystem.config.cjs — PM2 Configuration
// Golden Tower ERP — Producción
// Ubicación: /var/www/gestion/ecosystem.config.cjs
// Uso: pm2 start ecosystem.config.cjs
// =============================================================================

module.exports = {
  apps: [
    // ─── BACKEND: NestJS API ──────────────────────────────────────────
    {
      name: 'gestion-api',
      script: 'apps/api/dist/main.js',
      cwd: '/var/www/gestion',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
        // Las variables reales se leen desde apps/api/.env
      },
      // Logs separados para la API
      log_file: '/var/log/pm2/gestion-api.log',
      out_file: '/var/log/pm2/gestion-api-out.log',
      error_file: '/var/log/pm2/gestion-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },

    // ─── FRONTEND: Next.js ────────────────────────────────────────────
    {
      name: 'gestion-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/gestion/apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Las variables reales se leen desde apps/web/.env.production
      },
      // Logs separados para el Web
      log_file: '/var/log/pm2/gestion-web.log',
      out_file: '/var/log/pm2/gestion-web-out.log',
      error_file: '/var/log/pm2/gestion-web-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
