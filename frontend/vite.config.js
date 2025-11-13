import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      "@app": path.resolve(__dirname, "src/app"),
      "@providers": path.resolve(__dirname, "src/app/providers"),
      "@store": path.resolve(__dirname, "src/app/store"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@components": path.resolve(__dirname, "src/components"),
      "@constants": path.resolve(__dirname, "src/constants"),
      "@domain": path.resolve(__dirname, "src/domain"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@services": path.resolve(__dirname, "src/services"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React vendor chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Firebase chunk
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Stripe chunk
          'stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          // DnD libraries
          'dnd': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            '@dnd-kit/modifiers',
            'react-dnd',
            'react-dnd-html5-backend'
          ],
          // UI libraries
          'ui': ['react-hot-toast', 'react-modal', 'react-burger-menu'],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2015',
    // Minify with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Increase chunk size warning limit (we're optimizing it)
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'happy-dom', // Switch from jsdom to happy-dom (faster and more reliable)
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/__tests__/**',
      ],
    },
  },
});
