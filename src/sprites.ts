import jessicaData from '../assets/sprites/jessica.json';
import { mk } from './core';

// Composición de los fotogramas de Jessica: cuerpo y coleta en capas, normal y con tinte de luz.
interface TailData { rows: string[]; mode: 'x' | 'y'; px: number; py: number; len: number }
export interface FrameData {
  w: number; h: number; ax: number; ay: number;
  muz: [number, number] | null;
  rows: string[];
  tail?: TailData | null;
}
export type AnimState = 'idle' | 'walk' | 'run' | 'sidle' | 'swalk' | 'srun';
interface JessicaData {
  pal: Record<string, string>;
  frames: Record<string, FrameData>;
  anims: Record<'d' | 'u' | 'r', Record<AnimState, string[]>>;
}

export const JESSICA = jessicaData as unknown as JessicaData;

// [normal, con tinte]
type Pair = [HTMLCanvasElement, HTMLCanvasElement];
export interface FrameSprites { body: Pair; tail?: Record<number, Pair>; wave?: Pair[] }

const PALRGB: Record<string, [number, number, number]> = {};
for (const [k, c] of Object.entries(JESSICA.pal)) {
  PALRGB[k] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

type Px = [number, number, string];

function paint(w: number, h: number, px: Px[], tint: boolean): HTMLCanvasElement {
  const c = mk(w, h), x = c.getContext('2d')!, id = x.createImageData(w, h), d = id.data;
  for (const [X, Y, ch] of px) {
    if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
    let [r, g, b] = PALRGB[ch];
    if (tint) { r = Math.min(255, r * .9 + 6); g = g * .78; b = b * .7; }
    const i = (Y * w + X) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  return c;
}

const pair = (W: number, H: number, px: Px[]): Pair => [paint(W, H, px, false), paint(W, H, px, true)];

function pixels(rows: string[], ox: number, oy: number): Px[] {
  const out: Px[] = [];
  rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') out.push([i + ox, y + oy, r[i]]); });
  return out;
}

export const SPR: Record<string, FrameSprites> = {};
for (const [n, f] of Object.entries(JESSICA.frames)) {
  const W = f.w + 6, H = f.h + 6;
  const o: FrameSprites = { body: pair(W, H, pixels(f.rows, 3, 3)) };
  if (f.tail) {
    const T = f.tail, tp = pixels(T.rows, 0, 0);
    // Desplaza cada píxel de la coleta según su distancia a la raíz.
    const shifted = (shift: (dist: number, w: number) => number) => tp.map(([x, y, c]): Px => {
      const dist = T.mode === 'x' ? (y - T.py) : (T.px - x), w = Math.max(0, Math.min(1, dist / T.len)), s = shift(dist, w);
      return T.mode === 'x' ? [x + s + 3, y + 3, c] : [x + 3, y + s + 3, c];
    });
    o.tail = {};
    for (let L = -3; L <= 3; L++) o.tail[L] = pair(W, H, shifted((_, w) => Math.round(L * Math.pow(w, 1.1))));
    o.wave = [];
    for (let p = 0; p < 6; p++) {
      const ph = 2 * Math.PI * p / 6, A = T.mode === 'y' ? 2.6 : 2.2, K = 2 * Math.PI / 14;
      o.wave.push(pair(W, H, shifted((dist, w) => Math.round(A * Math.pow(w, .8) * Math.sin(ph - dist * K)))));
    }
  }
  SPR[n] = o;
}
