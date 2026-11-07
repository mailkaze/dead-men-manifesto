import { renderUnicodeCompact } from 'uqr';
import { defineConfig, type Plugin } from 'vite';

// Herramientas para probar en el móvil durante el desarrollo:
// - imprime un QR con la URL de red al arrancar;
// - GET /__dev/goto?state=<nombre>&... hace que todos los dispositivos con el juego abierto salten a ese estado.
function devTools(): Plugin {
  return {
    name: 'dmm-dev-tools',
    apply: 'serve',
    configureServer(server) {
      const printUrls = server.printUrls.bind(server);
      server.printUrls = () => {
        printUrls();
        const url = server.resolvedUrls?.network[0];
        if (url) console.log(`\n  Escanea con el móvil (misma wifi):\n\n${renderUnicodeCompact(url)}\n`);
      };

      server.middlewares.use('/__dev/goto', (req, res) => {
        // Sin @types/node la petición no trae `url` tipada.
        const { url = '/' } = req as { url?: string };
        const query = new URL(url, 'http://localhost').searchParams.toString();
        server.ws.send('dmm:goto', { query });
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(`Estado enviado a ${server.ws.clients.size} dispositivo(s): ?${query}\n`);
      });
    },
  };
}

export default defineConfig({
  // Rutas relativas: el build funciona en cualquier hosting estático, también en subcarpetas.
  base: './',
  // host: accesible desde otros dispositivos de la red local; puerto fijo para que la URL no cambie.
  server: { host: true, port: 5173, strictPort: true },
  plugins: [devTools()],
});
