import { ctx, drawShadow, mk, puff, world } from '../core';
import { say } from '../dialogue';
import type { Drawable, Scene } from './scene';

// Campo de pruebas: mapa de césped de 480×480 con árboles, rocas y cajas destructibles.
const MAPW = 480, MAPH = 480;
const SHADOW = '#6e9e46';

// Sprite de píxeles generado por código, con contorno automático.
type SetPx = (x: number, y: number, c: string) => void;
function pix(w: number, h: number, fn: (s: SetPx) => void, out = '#1e161e'): HTMLCanvasElement {
  const a: (string | null)[] = new Array(w * h).fill(null);
  fn((x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = c; });
  const c = mk(w, h), x = c.getContext('2d')!;
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const v = a[y * w + i];
    if (v) { x.fillStyle = v; x.fillRect(i, y, 1, 1); }
    else if (out && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const X = i + dx, Y = y + dy;
      return X >= 0 && Y >= 0 && X < w && Y < h && a[Y * w + X];
    })) { x.fillStyle = out; x.fillRect(i, y, 1, 1); }
  }
  return c;
}

const TREE = pix(52, 64, s => {
  for (let y = 42; y < 62; y++) for (let x = 22; x < 30; x++) s(x, y, x < 24 ? '#6a4630' : x > 27 ? '#3e2a20' : '#563a28');
  const blob = (cx: number, cy: number, r: number) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) {
      const l = (-x - y) / r;
      s(cx + x, cy + y, l > 0.7 ? '#8cc45a' : l > -0.1 ? '#4f8a3a' : ((cx + x + cy + y) % 2 ? '#2f5a2c' : '#3a6a30'));
    }
  };
  blob(26, 36, 15); blob(15, 27, 13); blob(37, 26, 13); blob(26, 16, 14);
});
const CRATE = pix(16, 16, s => {
  for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) {
    let c = (y % 5 === 0) ? '#8a5a30' : '#c08850';
    if (x === 1 || x === 14 || y === 1 || y === 14) c = '#9a6a3a';
    if (Math.abs(x - y) < 1 || Math.abs(x - (15 - y)) < 1) c = '#7a4c28';
    s(x, y, c);
  }
});
const CRATE_FLASH = pix(16, 16, s => { for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) s(x, y, '#fff8e8'); });
const ROCK = pix(14, 10, s => {
  for (let y = 1; y < 9; y++) for (let x = 1; x < 13; x++) {
    const dx = (x - 6.5) / 6, dy = (y - 5) / 4;
    if (dx * dx + dy * dy <= 1) s(x, y, dy < -0.3 && dx < 0.2 ? '#c8c4b8' : dy > 0.4 ? '#6e6a64' : '#9c968c');
  }
});

// Cuatro baldosas de césped; la cuarta lleva una flor.
const FLOW = ['#f0e070', '#f4f0e8', '#e88a9a'];
const TILES = [0, 1, 2, 3].map(v => {
  const c = mk(16, 16), x = c.getContext('2d')!;
  x.fillStyle = '#8cbc58'; x.fillRect(0, 0, 16, 16);
  let r = v * 97 + 13;
  const rnd = () => (r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 6; i++) { const X = rnd() * 15 | 0, Y = rnd() * 14 | 0; x.fillStyle = '#6e9e46'; x.fillRect(X, Y, 1, 2); x.fillRect(X + 1, Y + 1, 1, 1); }
  for (let i = 0; i < 3; i++) { x.fillStyle = '#a8d070'; x.fillRect(rnd() * 15 | 0, rnd() * 15 | 0, 1, 1); }
  if (v === 3) {
    const X = 4 + (rnd() * 8 | 0), Y = 4 + (rnd() * 8 | 0);
    x.fillStyle = FLOW[(rnd() * 3) | 0];
    x.fillRect(X, Y, 1, 1); x.fillRect(X - 1, Y, 1, 1); x.fillRect(X + 1, Y, 1, 1); x.fillRect(X, Y - 1, 1, 1);
    x.fillStyle = '#e8a030'; x.fillRect(X, Y, 1, 1);
  }
  return c;
});
function tileAt(tx: number, ty: number) {
  const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  return h % 7 === 0 ? 3 : h % 3;
}

const trees = [[60, 80], [130, 60], [300, 90], [380, 150], [90, 300], [420, 380], [250, 420], [40, 420], [200, 40], [440, 60]].map(([x, y]) => ({ x, y }));
const rocks = [[150, 160], [330, 330], [100, 220], [400, 260]].map(([x, y]) => ({ x, y }));
const crates = [[280, 220], [300, 236], [200, 300], [180, 180]].map(([x, y]) => ({ x, y, hp: 3, flash: 0, shake: 0, broken: false, resp: 0 }));

function solids(): [number, number, number, number][] {
  const r: [number, number, number, number][] = [];
  for (const tr of trees) r.push([tr.x - 6, tr.y - 5, 12, 6]);
  for (const c of crates) if (!c.broken) r.push([c.x - 8, c.y - 6, 16, 6]);
  for (const k of rocks) r.push([k.x - 6, k.y - 4, 12, 4]);
  return r;
}

export async function load(): Promise<Scene> {
  return {
    id: 'field', story: false,
    w: MAPW, h: MAPH, oy: 0,
    tint: false, dust: '#d8d0a8', shadow: SHADOW,
    spawn: [240, 260, 'down'],
    exits: [],
    marks: [],
    drawBg(cx, cy) {
      const t0x = Math.floor(cx / 16), t0y = Math.floor(cy / 16);
      for (let ty = t0y; ty <= t0y + 15; ty++) for (let tx = t0x; tx <= t0x + 15; tx++) ctx.drawImage(TILES[tileAt(tx, ty)], tx * 16 - cx, ty * 16 - cy);
    },
    blocked(x, y) {
      for (const [rx, ry, rw, rh] of solids()) if (x + 4 > rx && x - 4 < rx + rw && y > ry && y - 3 < ry + rh) return true;
      return x < 8 || y < 16 || x > MAPW - 8 || y > MAPH - 2;
    },
    bulletHit(b, gy) {
      for (const c of crates) if (!c.broken && b.x > c.x - 8 && b.x < c.x + 8 && gy > c.y - 10 && gy < c.y + 3) {
        b.life = 0; c.hp--; c.flash = .08; c.shake = .15;
        puff(b.x, b.y, 5, '#ffe9a0', 35, .2);
        if (c.hp <= 0) {
          if (!world.flags.emptyCrateSeen) {
            world.flags.emptyCrateSeen = true;
            setTimeout(() => say(['JESSICA: Vacía... Alguien se llevó lo que había dentro antes que yo.']), 500);
          }
          c.broken = true; c.resp = 3; world.shake = .15;
          puff(c.x, c.y - 8, 14, '#c08850', 60, .7, 1, 2);
          puff(c.x, c.y - 8, 8, '#7a4c28', 45, .6, 1, 1);
        }
      }
      for (const tr of trees) if (Math.abs(b.x - tr.x) < 7 && gy > tr.y - 7 && gy < tr.y + 2) {
        b.life = 0; puff(b.x, b.y, 6, '#8cc45a', 30, .4, 1);
      }
    },
    hotspot: () => null,
    drawables(): Drawable[] {
      return [
        ...trees.map(e => ({ y: e.y, draw(cx: number, cy: number) { drawShadow(e.x, e.y, 30, cx, cy, SHADOW); ctx.drawImage(TREE, Math.round(e.x - 26 - cx), Math.round(e.y - 62 - cy)); } })),
        ...rocks.map(e => ({ y: e.y, draw(cx: number, cy: number) { ctx.drawImage(ROCK, Math.round(e.x - 7 - cx), Math.round(e.y - 9 - cy)); } })),
        ...crates.filter(c => !c.broken).map(e => ({ y: e.y, draw(cx: number, cy: number) {
          drawShadow(e.x, e.y, 14, cx, cy, SHADOW);
          const ox = e.shake > 0 ? (Math.random() < .5 ? -1 : 1) : 0;
          ctx.drawImage(e.flash > 0 ? CRATE_FLASH : CRATE, Math.round(e.x - 8 - cx + ox), Math.round(e.y - 16 - cy));
        } })),
      ];
    },
    enter() {
      if (world.flags.fieldIntroSeen) return;
      world.flags.fieldIntroSeen = true;
      say(['JESSICA: Campo de pruebas. Esas cajas no deberían estar aquí... Voy a revisarlas.']);
    },
    update(dt) {
      // Las cajas rotas reaparecen a los 3 segundos.
      for (const c of crates) {
        if (c.flash > 0) c.flash -= dt;
        if (c.shake > 0) c.shake -= dt;
        if (c.broken) {
          c.resp -= dt;
          if (c.resp <= 0) { c.broken = false; c.hp = 3; puff(c.x, c.y - 8, 8, '#ffffff', 20, .3); }
        }
      }
    },
  };
}
