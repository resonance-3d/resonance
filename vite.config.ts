import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  define: { CESIUM_BASE_URL: JSON.stringify('/cesium/') },
  plugins: [viteStaticCopy({ targets: ['Workers', 'ThirdParty', 'Assets', 'Widgets'].map(name => ({
    src: `node_modules/cesium/Build/Cesium/${name}`, dest: 'cesium', rename: { stripBase: 4 },
  })) })],
  server: { proxy: { '/ws': { target: 'ws://127.0.0.1:8787', ws: true }, '/api': 'http://127.0.0.1:8787' } },
  build: { chunkSizeWarningLimit: 1600, rollupOptions: { input: { main: 'index.html', photogrammetry: 'photogrammetry.html' }, output: { manualChunks: (id: string) => /node_modules\/(?:@cesium|cesium)\//.test(id) ? 'cesium' : undefined } } },
});
