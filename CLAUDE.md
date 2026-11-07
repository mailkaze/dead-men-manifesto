# Dead Men Manifesto: notas para Claude

- Idioma: habla con el usuario en **español**.
- **Nunca edites `index.html`**: es un archivo generado. Edita `src/game.html` o `assets/` y ejecuta `python3 tools/build.py`.
- El juego es canvas 2D sin dependencias, con resolución interna de 224×224 escalada sin suavizado y pensado para móvil en vertical. Mantén la fluidez en dispositivos modestos.
- Arte nuevo del usuario (imágenes de Gemini): guarda el original en `assets/source/`, procésalo con un script de `tools/art/` siguiendo el mismo método (recuperar la cuadrícula con mediana, quitar el fondo, paleta) y respeta las escalas del README (Jessica 57 px, puertas 64 px).
- Respeta fielmente los diseños del usuario. No inventes un diseño propio si te ha dado una referencia.
- Antes de dar algo por terminado, ábrelo en un navegador sin interfaz (Playwright), revisa los errores de consola y mira capturas de los estados afectados.
- Los textos de diálogo que no ha escrito el usuario son provisionales; dilo cuando los añadas.
