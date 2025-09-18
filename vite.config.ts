import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          // Core calculation engines
          if (id.includes('well-calculations') || id.includes('flow-assurance-engine') || id.includes('unit-conversions')) {
            return 'calculation-engine';
          }
          // Three.js and 3D components
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-js';
          }
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          // Charts and visualization - split recharts into smaller chunks
          if (id.includes('recharts')) {
            if (id.includes('recharts/lib')) {
              return 'recharts-core';
            }
            return 'charts';
          }
          // PDF utilities - split jspdf and html2canvas
          if (id.includes('jspdf')) {
            return 'jspdf';
          }
          if (id.includes('html2canvas')) {
            return 'html2canvas';
          }
          // Large UI components
          if (id.includes('Flare2DViewer') || id.includes('ProcessFlowDiagram')) {
            return 'ui-components';
          }
          // OpenProsper calculator modules
          if (id.includes('open-prosper') || id.includes('OpenProsperCalculator')) {
            return 'open-prosper';
          }
          // Split large vendor libraries
          if (id.includes('node_modules')) {
            // Keep React and React-DOM together to avoid internals error
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils';
            }
            // Other vendor libraries
            return 'vendor';
          }
          // Default chunk for other modules
          return undefined;
        }
      }
    },
    chunkSizeWarningLimit: 500,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2
      },
      mangle: {
        safari10: true
      }
    },
    sourcemap: false,
    reportCompressedSize: true
  }
}));
