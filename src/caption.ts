import { V, ctx } from './core';
import { FONT_SIZE, LINE_H, beginText, fitTextLayer, wrap } from './text';

// Textos informativos que aparecen arriba sin pausar el juego y se desvanecen solos.
// Si llegan varios seguidos, esperan en cola.
const cap = document.getElementById('cap') as HTMLCanvasElement, ccx = cap.getContext('2d')!;
const FADE_IN = .4, FADE_OUT = .6, PAD = 6;

const queue: string[] = [];
let cur: { text: string; t: number; dur: number; h: number } | null = null;
let opacity = -1;

fitTextLayer(cap);
addEventListener('resize', () => { if (fitTextLayer(cap) && cur) render(cur.text); });

export function showCaption(text: string) { queue.push(text); }

export function clearCaptions() {
  queue.length = 0;
  end();
}

function end() {
  cur = null;
  cap.removeAttribute('data-text');
  setOpacity(0);
}

// Dibuja el texto en su capa y devuelve la altura de la franja (en unidades del juego).
function render(text: string): number {
  const lines = wrap(ccx, text, V - PAD * 2);
  beginText(ccx);
  ccx.fillStyle = '#f4f0e6';
  lines.forEach((l, i) => ccx.fillText(l, PAD, PAD + FONT_SIZE + i * LINE_H));
  return PAD * 2 + FONT_SIZE + (lines.length - 1) * LINE_H + 2;
}

function start(text: string) {
  // Tiempo de lectura proporcional a la longitud del texto.
  cur = { text, t: 0, dur: FADE_IN + 2.2 + text.length * .045 + FADE_OUT, h: render(text) };
  cap.dataset.text = text;
}

export function captionUpdate(dt: number) {
  if (!cur && queue.length) start(queue.shift()!);
  if (!cur) return;
  cur.t += dt;
  if (cur.t >= cur.dur) end();
}

function setOpacity(a: number) {
  const v = Math.round(a * 20) / 20; // evita tocar el estilo en cada fotograma
  if (v !== opacity) { opacity = v; cap.style.opacity = String(v); }
}

// Franja oscura en el lienzo del juego; el texto va en su propia capa (#cap).
export function captionDraw() {
  if (!cur) return;
  const a = Math.max(0, Math.min(1, cur.t / FADE_IN, (cur.dur - cur.t) / FADE_OUT));
  setOpacity(a);
  ctx.globalAlpha = a * .75;
  ctx.fillStyle = '#0a0814';
  ctx.fillRect(0, 0, V, cur.h);
  ctx.globalAlpha = 1;
}
