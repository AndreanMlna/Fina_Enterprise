import React from 'react';

/**
 * Enterprise Lazy Loading with Automatic Stale Chunk Invalidation Recovery.
 * 
 * Problem:
 * Ketika aplikasi di-deploy ulang ke hosting produksi (misal: Vercel), hash bundel Vite berubah
 * (contoh: CockpitView-ByjtqUg2.js digantikan CockpitView-DB43VIxf.js).
 * Pengguna yang sedang membuka tab lama akan memicu TypeError:
 * "Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of text/html"
 * 
 * Solution:
 * lazyWithRetry mendeteksi kegagalan fetch modul script kadaluarsa dan secara otomatis
 * melakukan hard-refresh browser satu kali ke server untuk mengambil index.html terbaru.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  moduleName: string = 'module'
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const storageKey = `fina_stale_chunk_retry_${moduleName}`;
    const hasAlreadyRetried = sessionStorage.getItem(storageKey);

    try {
      const component = await factory();
      sessionStorage.removeItem(storageKey);
      return component;
    } catch (error: any) {
      console.warn(`[lazyWithRetry] Gagal memuat chunk modul "${moduleName}":`, error);

      const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
      const isChunkLoadError =
        errorMessage.includes('failed to fetch dynamically imported module') ||
        errorMessage.includes('strict mime type checking') ||
        errorMessage.includes('text/html') ||
        errorMessage.includes('importing a module script failed') ||
        errorMessage.includes('loading chunk') ||
        error?.name === 'ChunkLoadError' ||
        error?.name === 'TypeError';

      if (isChunkLoadError && !hasAlreadyRetried) {
        sessionStorage.setItem(storageKey, 'true');
        console.info(`[lazyWithRetry] Terdeteksi perbedaan hash deploy untuk "${moduleName}". Menyinkronkan aset terbaru...`);
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return new Promise(() => {}); // Jangan teruskan error, biarkan reload berjalan
      }

      sessionStorage.removeItem(storageKey);
      throw error;
    }
  });
}
