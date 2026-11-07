import { V } from './core';

// Capas de texto (#txt, #cap) a la resolución real de la pantalla y con la fuente del sistema,
// para que se lean nítidas. Se dibuja en unidades del juego (224 de ancho) y la capa escala.
export const FONT_SIZE = 8;
export const LINE_H = 10;
const FONT = `600 ${FONT_SIZE}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
const MAX_DPR = 3;

// Ajusta la capa a su tamaño en pantalla. Devuelve true si ha cambiado (y por tanto se ha borrado).
export function fitTextLayer(c: HTMLCanvasElement): boolean {
  const w = Math.round(c.getBoundingClientRect().width * Math.min(MAX_DPR, devicePixelRatio || 1));
  if (!w || c.width === w) return false;
  c.width = c.height = w;
  return true;
}

export function clearText(x: CanvasRenderingContext2D) {
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, x.canvas.width, x.canvas.height);
}

// Limpia la capa y la deja lista para dibujar en unidades del juego.
export function beginText(x: CanvasRenderingContext2D) {
  clearText(x);
  const k = x.canvas.width / V;
  x.setTransform(k, 0, 0, k, 0, 0);
  x.font = FONT;
  x.textBaseline = 'alphabetic';
}

export function wrap(x: CanvasRenderingContext2D, s: string, maxW: number): string[] {
  x.font = FONT;
  const words = s.split(' '), lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const tst = cur ? cur + ' ' + w : w;
    if (x.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst;
  }
  if (cur) lines.push(cur);
  return lines;
}
