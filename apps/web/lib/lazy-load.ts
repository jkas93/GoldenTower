/**
 * Lazy Loading Utilities
 * 
 * Ayuda para importar componentes pesados solo cuando son necesarios.
 * Reduce el bundle size inicial y mejora el performance de carga.
 * 
 * Uso:
 *   const HeavyChart = lazyLoad(() => import('@/components/HeavyChart'));
 *   
 *   // En componente:
 *   <Suspense fallback={<Skeleton />}>
 *     <HeavyChart />
 *   </Suspense>
 */

import { lazy, ComponentType } from 'react';

/**
 * Wrapper para lazy() con retry automático en caso de fallo.
 * Útil para manejar errores de carga de chunks después de deploys.
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  maxRetries = 3,
): ReturnType<typeof lazy<T>> {
  return lazy(async () => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        // Wait progressively longer between retries
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * (attempt + 1)),
          );
        } else {
          // On final failure, prompt user to refresh
          if (typeof window !== 'undefined') {
            const shouldReload = window.confirm(
              'Error al cargar componente. ¿Deseas recargar la página?',
            );
            if (shouldReload) {
              window.location.reload();
            }
          }
          throw error;
        }
      }
    }
    throw new Error('Failed to load component after retries');
  });
}

/**
 * Preload de un componente lazy para mejorar UX.
 * Llama esto cuando sepas que el usuario está a punto de usar el componente.
 * 
 * Ejemplo: Preload en hover, antes del click
 */
export function preload(
  importFn: () => Promise<{ default: ComponentType<any> }>,
): void {
  importFn().catch(() => {
    // Silently fail - it's just a preload
  });
}
