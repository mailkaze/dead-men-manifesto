# Dead Men Manifesto

Aventura de exploración con estética pixel art de la época Game Boy Color (al estilo Pokémon / Zelda), pensada para jugarse en el navegador del móvil en vertical: pantalla cuadrada arriba y controles abajo.

La historia parece lineal, pero en cierto momento permite **viajar en el tiempo**, lo que abre nuevas posibilidades y **varios finales**. El interés del juego está en su historia y en descubrir sus secretos. Objetivo a largo plazo: un mundo 3D que también parezca pixel art y sorprenda cuando la cámara gira.

## Estado actual: demo jugable

- **Jessica Hammer**, la protagonista, en chibi de 31×57 px:
  - camina, corre y dispara en 4 direcciones, también disparando mientras camina o corre;
  - la coleta se balancea, se agita con el viento al correr y da un latigazo con el retroceso del disparo.
- **Diálogos** con retrato (sin estilo chibi) y texto que aparece letra a letra.
- **Habitación de Jessica:** fondo fijo, suelo caminable, 6 objetos para examinar y salida por abajo.
- **Calle:** desplazamiento lateral infinito, con 5 edificios en bucle, ciudad de fondo con parallax y salida por la izquierda hacia la habitación.
- **Tráfico aleatorio** en los dos sentidos con 4 vehículos, cada uno con ruedas que giran.
- **Campo de pruebas** con cajas destructibles, para probar el movimiento y el disparo.

## Cómo jugar

Requisitos: Node 20.19+ (o 22.12+).

```bash
npm install
npm run dev        # y abre http://localhost:5173
```

### Abrir una escena en un estado concreto

Añade `?state=<nombre>` a la URL. Los estados con nombre están en [`src/presets.ts`](src/presets.ts):

| Estado | Qué abre |
|---|---|
| `new-game` (por defecto) | Habitación, con el diálogo de introducción |
| `room` | Habitación, sin introducción |
| `street` | Calle, junto a la puerta de casa |
| `street-genetech` | Calle, frente a la puerta de Gene-Tech |
| `field` | Campo de pruebas |

Cualquier estado se puede ajustar con `scene`, `x`, `y`, `dir` (`down`, `up`, `left`, `right`) y `flags` (lista separada por comas: `nombre` vale `true`; `nombre=valor` admite números, `true`/`false` o texto). Por ejemplo, `/?state=street&x=600&flags=metBoss,day=2`. Si `scene` cambia de escena, la posición del estado base se descarta.

### Probar en el móvil

1. Ejecuta `npm run dev` en el ordenador. Muestra la URL de red (`http://192.168.x.x:5173/`) y un QR para abrirla.
2. Abre esa URL en el móvil, conectado a la misma wifi. La primera vez, macOS puede pedir permiso para que Node acepte conexiones entrantes.
3. Con el juego abierto en el móvil, envía cualquier estado desde el ordenador:

   ```bash
   curl 'http://localhost:5173/__dev/goto?state=street-genetech'
   ```

   Admite los mismos ajustes que la URL. Todos los dispositivos conectados saltan a ese estado, y al guardar un cambio de código la página se recarga en ese mismo estado.

El servidor de desarrollo es visible para toda la red local: úsalo solo en redes de confianza.

| Acción | Móvil | Teclado |
|---|---|---|
| Moverse | Joystick flotante (mitad izquierda) | WASD / flechas |
| Disparar / examinar / continuar | A | Espacio o J |
| Correr | Mantén B | Shift o K |
| Correr fijo | Arrastra B hacia arriba (tócalo otra vez para soltar) | R |

## Estructura

```
index.html              ← página y estilos; carga src/main.ts
src/
  main.ts               ← arranque desde la URL, bucle, cambio de escena, cámara y dibujado
  state.ts, presets.ts  ← estado de partida (escena, posición, flags) y estados con nombre
  core.ts               ← lienzo, estado del mundo, partículas, polígonos
  input.ts              ← teclado, joystick y botones
  sprites.ts, player.ts ← fotogramas de Jessica, coleta, disparo
  dialogue.ts           ← diálogos con retrato
  scenes/               ← una escena por módulo (room, street, field) y su registro
e2e/                    ← pruebas de Playwright (móvil emulado)
assets/
  sprites/jessica.json  ← todos los fotogramas de Jessica (paleta + filas de píxeles + capa de coleta)
  ui/portrait_jessica.png
  scenes/room.png
  street/               ← edificios, buildings.json, suelo, ciudad de fondo
  vehicles/             ← carrocerías, tiras de ruedas (12 giros) y vehicles.json
  source/               ← imágenes originales de Gemini (entrada del pipeline)
tools/art/              ← pipeline de arte (ver abajo)
```

## Construir y probar

```bash
npm run build      # typecheck + build en dist/ (sirve en cualquier hosting estático)
npm test           # pruebas unitarias (Vitest)
npm run test:e2e   # pruebas en navegador (Playwright); capturas de cada estado en screenshots/
```

La primera vez, `npx playwright install chromium` descarga el navegador de las pruebas.

Cada escena es un módulo aparte: al arrancar solo se descarga el motor, Jessica y la escena actual. Las escenas vecinas, las que hay detrás de cada salida, se precargan en segundo plano, y el fundido a negro espera si alguna aún no ha llegado.

## Pipeline de arte (de imágenes de Gemini a pixel art del juego)

Gemini imita el pixel art, pero sus "píxeles" son bloques irregulares. Todas las herramientas siguen el mismo principio:

1. **Recuperar la cuadrícula:** se toma la mediana del centro de cada celda a la escala elegida.
2. **Quitar el fondo:** relleno por inundación desde los bordes y eliminación de las marcas de agua.
3. **Paleta fija o cuantizada:** sin tramado.
4. **Retocar a mano** donde haga falta: ojos, brazos, pistola.

Requisitos: Python 3 con `Pillow`, `numpy` y `scipy`.

| Script | Qué hace |
|---|---|
| `tools/art/build_jessica.py` | Genera `jessica.json` a partir de `data/raw_frames.json` (poses extraídas y retocadas). Anima las piernas por piezas, usa dos zancadas reales para correr y separa la coleta en una capa. |
| `tools/art/extract.py`, `pal.py` | Extracción de poses desde las hojas de Gemini y la paleta de 20 colores de Jessica. |
| `tools/art/process_portrait.py` | Retrato del diálogo (52×66). |
| `tools/art/process_room.py` | Habitación a escala ×5 (275×153). |
| `tools/art/process_street.py` | Edificios igualados por la altura de su puerta (64 px), suelo repetible y ciudad de fondo. |
| `tools/art/process_vehicles.py` | Vehículos de perfil: escala real, sin sombra y 12 fotogramas de giro por rueda, rotados en alta resolución. |
| `tools/art/view.py`, `zoomset.py` | Vistas ampliadas con cuadrícula para revisar y retocar. |

Cada script se ejecuta con `python3 tools/art/<script>.py`; con `npm run dev` levantado, el juego se recarga solo. Todos reproducen exactamente los recursos actuales. Los JSON que generan apuntan a sus imágenes con marcadores `__ASSET:ruta.png__`, que el código de cada escena convierte en la URL final.

### Escalas de referencia
- Pantalla: **224×224** px internos, escalados sin suavizado.
- Jessica: **57 px** de alto. Puertas: **64 px**. SUV: **161 px** de largo.
- Habitación: imagen de Gemini ÷ 5. Calle: el suelo ÷ 7,2 y los edificios según su puerta.

### Cómo pedir imágenes a Gemini para que sirvan
- Fondo liso, sin sombra ni suelo, y con la misma imagen de referencia para mantener la coherencia.
- Personajes: una pose por dirección y situación; la animación se hace por piezas.
- Vehículos: de perfil, mirando a la derecha y con las ruedas enteras.

## Arquitectura

- **Escenas (`src/scenes/`):** cada módulo exporta `load()`, que descarga sus imágenes y devuelve un objeto `Scene` (ver [`scene.ts`](src/scenes/scene.ts)): `drawBg`, zona caminable (`blocked`), choque de balas (`bulletHit`), puntos para examinar (`hotspot`), salidas (`exits`, con fundido a negro), flechas de salida (`marks`), tinte de luz y, opcionalmente, `enter`, `update`, `drawables` y `drawFront`. Para añadir una escena: crea el módulo, regístralo en [`scenes/index.ts`](src/scenes/index.ts) y añade su id a `SceneId` en [`state.ts`](src/state.ts).
- **Estado de partida:** `world.flags` guarda lo que ha pasado (por ejemplo `introSeen`); el estado inicial sale de la URL.
- **Jugador:** `curFrame()` elige el fotograma según dirección y estado (idle / walk / run, con o sin disparo). La izquierda es la derecha reflejada.
- **Coleta:** capa separada con muelle amortiguado (balanceo) y 6 fases de onda (viento al correr).
- **Balas con altura:** la colisión usa la posición en el suelo (`y + h`), no la de pantalla.
- **Diálogos:** el texto se dibuja en una capa al doble de resolución y se umbraliza para que se vea pixelado.
- **Tráfico:** dos carriles con sentidos opuestos; cada coche frena detrás del de delante y el giro de las ruedas va ligado a la distancia recorrida.

## Próximos pasos

- Sistema de historia: guion, variables, viajes en el tiempo y varios finales.
- El mundo 3D con cámara giratoria de la idea original.
- Más personajes y NPCs con el mismo pipeline, y retratos con varias expresiones.
- Sonido chiptune y guardado de partida.

## Créditos

Arte base generado con Gemini por el autor y convertido a pixel art de juego con las herramientas de `tools/art/`.
