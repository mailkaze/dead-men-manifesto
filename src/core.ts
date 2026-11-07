import type { Flags } from './state';

// Núcleo compartido: lienzo, resolución interna y estado mutable del mundo.
export const V = 224;
export const cv = document.getElementById('screen') as HTMLCanvasElement;
export const ctx = cv.getContext('2d')!;
ctx.imageSmoothingEnabled = false;

export type Point = readonly [number, number];
export type Poly = readonly Point[];

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  g: number; life: number; max: number; col: string; sz: number;
  floor?: number;
}

// h: altura sobre el suelo; la colisión usa la posición en el suelo (y + h).
export interface Bullet { x: number; y: number; h: number; vx: number; vy: number; life: number }

export const world = {
  t: 0,
  shake: 0,
  bullets: [] as Bullet[],
  parts: [] as Particle[],
  flags: {} as Flags,
};

export function mk(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

export function puff(x: number, y: number, n: number, col: string, sp = 20, life = .35, g = 0, sz = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, v = sp * (.3 + Math.random());
    world.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (g ? 30 : 0), g, life, max: life, col, sz });
  }
}

export function inPoly(x: number, y: number, P: Poly): boolean {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export function drawShadow(x: number, y: number, w: number, cx: number, cy: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - w / 2 - cx), Math.round(y - cy - 1), w, 2);
  ctx.fillRect(Math.round(x - w / 2 + 2 - cx), Math.round(y - cy - 2), w - 4, 4);
}
