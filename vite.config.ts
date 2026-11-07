import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el build funciona en cualquier hosting estático, también en subcarpetas.
  base: './',
  server: { port: 5173, strictPort: true },
});
