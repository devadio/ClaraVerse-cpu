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
        manualChunks: (id) => {
          // Core dependencies
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }

          // Heavy editor - only load when needed
          if (id.includes('node_modules/@monaco-editor') || id.includes('node_modules/monaco-editor')) {
            return 'monaco';
          }

          // PDF processing - lazy load
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'pdfjs';
          }

          // 3D graphics - lazy load
          if (id.includes('node_modules/three')) {
            return 'three';
          }

          // Diagram rendering - lazy load
          if (id.includes('node_modules/mermaid')) {
            return 'mermaid';
          }

          // Chart libraries - lazy load
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'charts';
          }

          // LangChain and AI - only load when needed
          if (id.includes('node_modules/langchain') || id.includes('node_modules/@langchain')) {
            return 'langchain';
          }

          // ReactFlow for agent builder
          if (id.includes('node_modules/reactflow')) {
            return 'reactflow';
          }

          // Animation libraries
          if (id.includes('node_modules/gsap') || id.includes('node_modules/framer-motion')) {
            return 'animations';
          }

          // Markdown and rich text
          if (id.includes('node_modules/react-markdown') || 
              id.includes('node_modules/remark-gfm') || 
              id.includes('node_modules/rehype-raw') || 
              id.includes('node_modules/rehype-sanitize')) {
            return 'markdown';
          }

          // UI component libraries
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui';
          }

          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // Code splitting by route/page
          if (id.includes('AgentBuilder') || 
              id.includes('AgentStudio') || 
              id.includes('AgentManager') || 
              id.includes('AgentRunner')) {
            return 'route-agents';
          }

          if (id.includes('Notebooks') || id.includes('NotebookCanvas')) {
            return 'route-notebooks';
          }

          if (id.includes('ImageGen') || id.includes('Gallery')) {
            return 'route-imagegen';
          }

          if (id.includes('ClaraAssistant') || id.includes('clara_assistant')) {
            return 'route-clara';
          }
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
