import { inPoly, puff, type Bullet, type Point, type Poly } from '../core';
import type { Dir, SceneId } from '../state';

export type Spawn = readonly [number, number, Dir];
// Al examinar: si hay `use`, se ejecuta en lugar de decir `t`.
export interface Hotspot { t: string[]; use?: () => void }
export interface Exit {
  x0: number; x1: number; y0: number; y1: number; dir: Dir; to: SceneId; spawn: Spawn;
  locked?: () => string[] | null; // frases que se dicen si la salida está cerrada; null si está abierta
}
// Algo que se dibuja ordenado por su y en el suelo, junto a Jessica.
export interface Drawable { y: number; draw(cx: number, cy: number): void }

// Contrato de una escena. Cada escena vive en su propio módulo y se descarga al necesitarla.
export interface Scene {
  id: SceneId;
  story: boolean; // false en el campo de pruebas
  w: number; h: number; oy: number; // tamaño para la cámara; oy centra en vertical las escenas bajas
  tint: boolean; dust: string; shadow: string;
  spawn: Spawn;
  exits: Exit[];
  marks: Point[]; // flechas de salida
  drawBg(cx: number, cy: number): void;
  blocked(x: number, y: number): boolean;
  bulletHit(b: Bullet, gy: number): void; // pone b.life = 0 si la bala choca
  hotspot(x: number, y: number): Hotspot | null;
  drawables?(): Drawable[];
  enter?(): void;
  update?(dt: number): void;
  drawFront?(cx: number): void; // por delante de Jessica
}

// Zona caminable por polígono: se comprueban los dos pies y un punto por detrás.
export function walkPoly(P: Poly) {
  return (x: number, y: number) => !(inPoly(x - 4, y, P) && inPoly(x + 4, y, P) && inPoly(x, y - 2, P));
}

export function bulletPoly(P: Poly) {
  return (b: Bullet, gy: number) => {
    if (!inPoly(b.x, gy, P)) { b.life = 0; puff(b.x, b.y, 4, '#e8d0a0', 18, .25); }
  };
}

export interface HotspotArea extends Hotspot { x: number; y: number; r: number }

export function nearestHotspot(list: HotspotArea[], x: number, y: number): Hotspot | null {
  let best: Hotspot | null = null, bd = 1e9;
  for (const h of list) {
    const d = Math.hypot(x - h.x, y - h.y);
    if (d < h.r && d < bd) { bd = d; best = h; }
  }
  return best;
}
