import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      // Polyfill Buffer for browser environment
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Enable esbuild polyfills for node globals
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true, // Enable Buffer polyfill
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    target: 'esnext',
    sourcemap: false,
  },
});
