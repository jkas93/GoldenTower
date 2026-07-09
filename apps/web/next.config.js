/**
 * Next.js Configuration
 * 
 * Configuración optimizada para producción con:
 * - Optimización de imágenes
 * - Compresión y minificación
 * - Headers de seguridad
 * - Bundle analyzer opcional
 * - Optimización de módulos externos
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimización de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Cachear imágenes por 60 días
    minimumCacheTTL: 60 * 60 * 24 * 60,
  },

  // Compilar librerías modernas (mejor tree-shaking)
  transpilePackages: ['@erp/shared'],

  // Comprimir respuestas
  compress: true,

  // Reducir tamaño del bundle
  productionBrowserSourceMaps: false,

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevenir MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Protección clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS Protection (fallback)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Feature policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Experimentales de Next.js 16
  experimental: {
    // Optimización del compilador
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },

  // Ignorar advertencias específicas de linting durante build de producción
  eslint: {
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Poweredb-by header
  poweredByHeader: false,

  // Environment variable defaults
  env: {
    APP_NAME: 'Golden Tower ERP',
    APP_VERSION: '1.0.0',
  },
};

export default nextConfig;
