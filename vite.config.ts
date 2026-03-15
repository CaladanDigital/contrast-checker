import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        'blog-ada': resolve(__dirname, 'blog/ada-web-accessibility-lawsuits/index.html'),
        'blog-disability': resolve(__dirname, 'blog/disability-stats-inclusive-design/index.html'),
        'blog-wcag': resolve(__dirname, 'blog/wcag-color-contrast-explained/index.html'),
        'blog-gov': resolve(__dirname, 'blog/government-website-accessibility-deadlines/index.html'),
        'blog-fail': resolve(__dirname, 'blog/websites-fail-accessibility-color-contrast-tool/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
