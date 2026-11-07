# Dead Men Manifesto: notas para Claude

- Idioma: habla con el usuario en **español**.
- El código está en `src/` (TypeScript + Vite, canvas 2D sin librerías en tiempo de ejecución). `index.html` es la entrada de Vite; `npm run build` genera `dist/`.
- Resolución interna de 224×224 escalada sin suavizado y pensada para móvil en vertical. Mantén la fluidez en dispositivos modestos.
- Cada escena es un módulo de `src/scenes/` que se descarga al necesitarla. No importes una escena desde otra, porque se juntarían sus descargas.
- Para probar una escena en un estado concreto, añade o reutiliza un estado con nombre en `src/presets.ts` (o usa los ajustes de URL: `scene`, `x`, `y`, `dir`, `flags`).
- Cuando el usuario pida probar algo en el móvil: asegúrate de que `npm run dev` está corriendo (en segundo plano) y envía el estado con `curl 'http://localhost:5173/__dev/goto?state=<nombre>'`. La respuesta dice a cuántos dispositivos ha llegado; si es 0, dale la URL de red que imprime el servidor al arrancar.
- Arte nuevo del usuario (imágenes de Gemini): guarda el original en `assets/source/`, procésalo con un script de `tools/art/` siguiendo el mismo método (recuperar la cuadrícula con mediana, quitar el fondo, paleta) y respeta las escalas del README (Jessica 57 px, puertas 64 px).
- Respeta fielmente los diseños del usuario. No inventes un diseño propio si te ha dado una referencia.
- Antes de dar algo por terminado, ábrelo en un navegador sin interfaz (Playwright), revisa los errores de consola y mira capturas de los estados afectados: `npm run typecheck && npm test && npm run test:e2e` deja una captura de cada estado con nombre en `screenshots/`.
- Los textos de diálogo que no ha escrito el usuario son provisionales; dilo cuando los añadas.
- El juego podrá estar en español e inglés: los textos visibles van en `src/i18n/es.ts` por clave y se usan con `t('clave')`, nunca escritos en el código de las escenas. Los textos de la demo aún no siguen esta regla; se migrarán al sustituirlos.
