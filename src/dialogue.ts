import portraitUrl from '../assets/ui/portrait_jessica.png';
import { V, ctx, mk, world } from './core';
import { inp } from './input';
import { pl } from './player';

// Diálogos con retrato. El texto se dibuja en una capa al doble de resolución
// y se umbraliza para que se vea pixelado.
const POR = new Image();
POR.src = portraitUrl;
const tcv = document.getElementById('txt') as HTMLCanvasElement, tcx = tcv.getContext('2d')!;
const tmp = mk(448, 448), tmx = tmp.getContext('2d', { willReadFrequently: true })!;

let dlg: { q: string[]; i: number; n: number } | null = null;
let lastTxt = '';

export function say(q: string[]) { dlg = { q, i: 0, n: 0 }; }
export function isTalking() { return dlg !== null; }

// Devuelve true mientras haya un diálogo abierto (el juego se pausa).
export function dialogueUpdate(dt: number): boolean {
  if (!dlg) return false;
  const s = dlg.q[dlg.i];
  dlg.n += dt * 36;
  if (inp.aPress) {
    inp.aPress = false;
    if (dlg.n < s.length) dlg.n = s.length;
    else {
      dlg.i++; dlg.n = 0;
      if (dlg.i >= dlg.q.length) { dlg = null; pl.cd = .3; }
    }
  }
  return true;
}

function wrap(s: string, maxW: number) {
  const words = s.split(' '), lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const tst = cur ? cur + ' ' + w : w;
    if (tmx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function dialogueDraw() {
  if (!dlg) {
    if (lastTxt !== '') { tcx.clearRect(0, 0, 448, 448); lastTxt = ''; }
    return;
  }
  const by = V - 51;
  ctx.fillStyle = '#55505e'; ctx.fillRect(1, by, V - 2, 50);
  ctx.fillStyle = '#f4f0e6'; ctx.fillRect(2, by + 1, V - 4, 48);
  ctx.fillStyle = '#0f1d66'; ctx.fillRect(3, by + 2, V - 6, 46);
  ctx.fillStyle = '#0a1450'; ctx.fillRect(3, by + 45, V - 6, 3);
  if (POR.complete) {
    const bob = Math.floor(world.t * 1.3) % 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, V, by + 48); ctx.clip();
    ctx.drawImage(POR, 4, by + 48 - POR.height + bob + 1);
    ctx.restore();
  }
  const s = dlg.q[dlg.i], vis = s.slice(0, Math.floor(dlg.n)), done = dlg.n >= s.length;
  // Flecha de "continuar" parpadeando.
  if (done && Math.floor(world.t * 3) % 2) {
    ctx.fillStyle = '#f4f0e6';
    ctx.fillRect(V - 12, by + 41, 5, 1); ctx.fillRect(V - 11, by + 42, 3, 1); ctx.fillRect(V - 10, by + 43, 1, 1);
  }
  const key = dlg.i + '|' + vis;
  if (key === lastTxt) return;
  lastTxt = key;
  tmx.clearRect(0, 0, 448, 448);
  tmx.font = 'bold 15px ui-monospace,Menlo,Consolas,monospace';
  tmx.textBaseline = 'alphabetic';
  const x0 = 124, lines = wrap(s, 2 * V - x0 - 14);
  let shown = vis.length, y = (by + 2) * 2 + 22;
  for (const L of lines) {
    const part = L.slice(0, Math.max(0, shown));
    shown -= L.length + 1;
    const ci = part.indexOf(':');
    let x = x0;
    // El nombre de quien habla, en amarillo.
    if (ci > 0 && L === lines[0]) {
      tmx.fillStyle = '#f2d36a'; tmx.fillText(part.slice(0, ci + 1), x, y);
      x += tmx.measureText(part.slice(0, ci + 1)).width;
      tmx.fillStyle = '#ffffff'; tmx.fillText(part.slice(ci + 1), x, y);
    } else { tmx.fillStyle = '#ffffff'; tmx.fillText(part, x, y); }
    y += 19;
  }
  const id = tmx.getImageData(0, 0, 448, 448), d = id.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 95 ? 255 : 0;
  tcx.clearRect(0, 0, 448, 448);
  tcx.putImageData(id, 0, 0);
}
