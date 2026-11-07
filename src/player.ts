import { ctx, drawShadow, world } from './core';
import { JESSICA, SPR, type AnimState } from './sprites';
import type { Dir } from './state';

// Jessica: estado, elección de fotograma, disparo, coleta y dibujo.
interface Muzzle { x: number; y: number; vx: number; vy: number; t: number }

export const pl = {
  x: 150, y: 126, dir: 'down' as Dir,
  walkT: 0, lastStep: -1, shootT: 0, cd: 0,
  running: false, moving: false,
  muz: null as Muzzle | null,
};

// Muelle amortiguado de la coleta.
const tail = { s: 0, v: 0 };

export function curFrame() {
  const dk = pl.dir === 'down' ? 'd' : pl.dir === 'up' ? 'u' : 'r';
  let st: AnimState = pl.moving ? (pl.running ? 'run' : 'walk') : 'idle';
  if (pl.shootT > 0) st = ('s' + st) as AnimState;
  const list = JESSICA.anims[dk][st];
  const i = st === 'idle' ? Math.floor(world.t * 1.6) : st === 'sidle' ? 0 : Math.floor(pl.walkT);
  const n = list[((i % list.length) + list.length) % list.length];
  return { n, f: JESSICA.frames[n] };
}

export function shoot() {
  tail.v -= 12; pl.shootT = .28; pl.cd = .3; world.shake = .08;
  const { f } = curFrame();
  const L = pl.dir === 'left';
  const mx = f.muz ? f.muz[0] : f.ax, my = f.muz ? f.muz[1] : 20;
  const wx = L ? pl.x + f.ax - mx : pl.x - f.ax + mx, wy = pl.y - f.ay + my;
  const vx = pl.dir === 'right' ? 1 : L ? -1 : 0, vy = pl.dir === 'down' ? 1 : pl.dir === 'up' ? -1 : 0;
  world.bullets.push({ x: wx, y: wy, h: pl.y - wy, vx: vx * 240, vy: vy * 240, life: .8 });
  pl.muz = { x: wx, y: wy, vx, vy, t: .06 };
  // Casquillo expulsado que rebota en el suelo.
  const ex = vx ? wx - vx * 9 : wx + (Math.random() < .5 ? -4 : 4);
  world.parts.push({ x: ex, y: wy - 2, vx: (vx ? -vx : (ex < wx ? -1 : 1)) * (20 + Math.random() * 20), vy: -55, g: 260, life: .6, max: .6, col: '#e0b848', sz: 1, floor: pl.y - 1 });
  if (navigator.vibrate) navigator.vibrate(12);
}

export function updateTail(dt: number) {
  const side = pl.dir === 'left' || pl.dir === 'right';
  let tg = pl.moving ? (pl.running ? 2.6 : 1.7) * Math.sin(pl.walkT * Math.PI / 2) : 0.8 * Math.sin(world.t * 2.2);
  if (pl.moving && side && !pl.running) tg -= 0.9;
  tail.v += ((tg - tail.s) * 70 - tail.v * 9) * dt;
  tail.s += tail.v * dt;
  tail.s = Math.max(-3.4, Math.min(3.4, tail.s));
}

const RECOIL: Record<Dir, [number, number]> = { right: [-1, 0], left: [1, 0], down: [0, -1], up: [0, 1] };

export function drawPlayer(cx: number, cy: number, tint: boolean, shadow: string, bubble: boolean) {
  drawShadow(pl.x, pl.y, 18, cx, cy, shadow);
  const { n, f } = curFrame();
  const [rx, ry] = pl.shootT > .2 ? RECOIL[pl.dir] : [0, 0];
  const S = SPR[n], ti = tint ? 1 : 0, lv = Math.max(-3, Math.min(3, Math.round(tail.s))), L = pl.dir === 'left', W = f.w + 6;
  const X = Math.round(pl.x - (L ? f.w - f.ax : f.ax) - cx + rx) - 3, Y = Math.round(pl.y - f.ay - cy + ry) - 3;
  // Al correr la coleta ondea con el viento; si no, cuelga del muelle.
  const TL = S.tail ? ((pl.moving && pl.running) ? S.wave![Math.floor(world.t * 15) % 6][ti] : S.tail[lv][ti]) : null;
  const lay = TL ? (n[0] === 'u' ? [S.body[ti], TL] : [TL, S.body[ti]]) : [S.body[ti]];
  for (const img of lay) {
    if (L) { ctx.save(); ctx.translate(X + W, Y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
    else ctx.drawImage(img, X, Y);
  }
  // Bocadillo "!" cuando hay algo que examinar.
  if (bubble && Math.floor(world.t * 2.5) % 2 === 0) {
    const bx = Math.round(pl.x - cx) - 3, by = Y + 3 - 11;
    ctx.fillStyle = '#1e161e'; ctx.fillRect(bx, by, 7, 10);
    ctx.fillStyle = '#f4f0e6'; ctx.fillRect(bx + 1, by + 1, 5, 8);
    ctx.fillStyle = '#b9473c'; ctx.fillRect(bx + 3, by + 2, 1, 4); ctx.fillRect(bx + 3, by + 7, 1, 1);
  }
}
