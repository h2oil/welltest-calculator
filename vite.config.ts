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
  },
  build: {
    rollupOptions: {
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
          // Charts and visualization
          if (id.includes('recharts')) {
            return 'charts';
          }
          // UI components
          if (id.includes('Flare2DViewer') || id.includes('ProcessFlowDiagram')) {
            return 'ui-components';
          }
          // Default chunk for other modules
          return undefined;
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
}));
