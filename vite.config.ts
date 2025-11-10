import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs-extra';
import type { PluginOption } from 'vite';

// Function to copy the PDF.js worker to the public directory
function copyPdfWorker(): PluginOption {
  return {
    name: 'copy-pdf-worker',
    buildStart() {
      try {
        const workerSrc = path.resolve(
          __dirname,
          'node_modules/pdfjs-dist/build/pdf.worker.min.js'
        );
        const workerDest = path.resolve(
          __dirname,
          'public/pdf.worker.min.js'
        );
        
        // Skip if file already exists and source exists
        if (fs.existsSync(workerSrc)) {
          console.log('Copying PDF.js worker to public directory');
          fs.copySync(workerSrc, workerDest);
        } else {
          console.warn('PDF.js worker source file not found:', workerSrc);
        }
        return Promise.resolve();
      } catch (err) {
        console.error('Error copying PDF.js worker:', err);
        return Promise.resolve();
      }
    }
  };
}

// Plugin to add WebContainer headers for production
function webContainerHeaders(): PluginOption {
  return {
    name: 'webcontainer-headers',
    generateBundle() {
      // Create _headers file for Netlify
      const netlifyHeaders = `/*
  Cross-Origin-Embedder-Policy: credentialless
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: cross-origin`;
      
      // Create vercel.json for Vercel
      const vercelConfig = {
        headers: [
          {
            source: "/(.*)",
            headers: [
              {
                key: "Cross-Origin-Embedder-Policy",
                value: "credentialless"
              },
              {
                key: "Cross-Origin-Opener-Policy", 
                value: "same-origin"
              },
              {
                key: "Cross-Origin-Resource-Policy",
                value: "cross-origin"
              }
            ]
          }
        ]
      };

      this.emitFile({
        type: 'asset',
        fileName: '_headers',
        source: netlifyHeaders
      });

      this.emitFile({
        type: 'asset',
        fileName: 'vercel.json',
        source: JSON.stringify(vercelConfig, null, 2)
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyPdfWorker(),
    webContainerHeaders()
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: process.env.ELECTRON_START_URL ? '/' : './',
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core dependencies
          vendor: ['react', 'react-dom'],

          // Heavy editor - only load when needed
          monaco: ['@monaco-editor/react', 'monaco-editor'],

          // PDF processing - lazy load
          pdfjs: ['pdfjs-dist'],

          // 3D graphics - lazy load
          three: ['three'],

          // Diagram rendering - lazy load
          mermaid: ['mermaid'],

          // Chart libraries - lazy load
          charts: ['chart.js', 'react-chartjs-2'],

          // LangChain and AI - only load when needed
          langchain: ['langchain', '@langchain/core'],

          // ReactFlow for agent builder
          reactflow: ['reactflow'],

          // Animation libraries
          animations: ['gsap', 'framer-motion'],

          // Markdown and rich text
          markdown: ['react-markdown', 'remark-gfm', 'rehype-raw', 'rehype-sanitize'],

          // UI component libraries
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs'],

          // Icons
          icons: ['lucide-react'],

          // Code splitting by route/page
          'route-agents': [/AgentBuilder/, /AgentStudio/, /AgentManager/, /AgentRunner/],
          'route-notebooks': [/Notebooks/, /NotebookCanvas/],
          'route-imagegen': [/ImageGen/, /Gallery/],
          'route-clara': [/ClaraAssistant/, /clara_assistant/],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
  },
});
