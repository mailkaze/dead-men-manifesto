import portraitUrl from '../assets/ui/portrait_jessica.png';
import { V, ctx, world } from './core';
import { inp } from './input';
import { pl } from './player';
import { LINE_H, beginText, clearText, fitTextLayer, wrap } from './text';

// Diálogos con retrato; el texto va en su propia capa nítida (ver text.ts).
const POR = new Image();
POR.src = portraitUrl;
const tcv = document.getElementById('txt') as HTMLCanvasElement, tcx = tcv.getContext('2d')!;

let dlg: { q: string[]; i: number; n: number } | null = null;
let lastTxt = '';

fitTextLayer(tcv);
addEventListener('resize', () => { if (fitTextLayer(tcv)) lastTxt = ''; });

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

export function dialogueDraw() {
  if (!dlg) {
    if (lastTxt !== '') { clearText(tcx); lastTxt = ''; }
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
  // El texto empieza a la derecha del retrato.
  const x0 = 62, lines = wrap(tcx, s, V - x0 - 7);
  beginText(tcx);
  let shown = vis.length, y = by + 13;
  for (const L of lines) {
    const part = L.slice(0, Math.max(0, shown));
    shown -= L.length + 1;
    const ci = part.indexOf(':');
    let x = x0;
    // El nombre de quien habla, en amarillo.
    if (ci > 0 && L === lines[0]) {
      tcx.fillStyle = '#f2d36a'; tcx.fillText(part.slice(0, ci + 1), x, y);
      x += tcx.measureText(part.slice(0, ci + 1)).width;
      tcx.fillStyle = '#ffffff'; tcx.fillText(part.slice(ci + 1), x, y);
    } else { tcx.fillStyle = '#ffffff'; tcx.fillText(part, x, y); }
    y += LINE_H;
  }
}
