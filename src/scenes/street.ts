import buildingsData from '../../assets/street/buildings.json';
import vehiclesData from '../../assets/vehicles/vehicles.json';
import groundUrl from '../../assets/street/ground.png';
import skylineUrl from '../../assets/street/skyline.png';
import { showCaption } from '../caption';
import { V, ctx, loadImage, mk, world } from '../core';
import { t, type TextKey } from '../i18n';
import { pl } from '../player';
import { bulletPoly, walkPoly, type Hotspot, type Scene } from './scene';

// Calle con desplazamiento lateral infinito: edificios en bucle, ciudad de fondo con parallax y tráfico.

// Los JSON del pipeline de arte apuntan a sus imágenes con "__ASSET:ruta.png__".
const URLS = import.meta.glob<string>(['/assets/street/*.png', '/assets/vehicles/*.png'], { eager: true, query: '?url', import: 'default' });
function assetUrl(token: string): string {
  const url = URLS['/' + token.replace(/^__ASSET:|__$/g, '')];
  if (!url) throw new Error(`Imagen no encontrada: ${token}`);
  return url;
}

const GW = 191, GH = 106, GY = V - GH, GAP = 24; // suelo repetible
const SKYW = 305, SKYH = 124;                      // ciudad de fondo

interface Building { w: number; h: number; door: number; t: string; x: number; img: HTMLImageElement }
interface Vehicle {
  w: number; h: number; wb: number; r: number;
  wheels: { x: number; y: number; w: number; h: number }[];
  fw: number; fh: number; speed: number[]; exhaust: boolean;
  body: HTMLCanvasElement; strip: HTMLCanvasElement; // ya con el tinte de la calle
}
interface Car { l: number; x: number; k: Vehicle; v: number; cur: number; d: number; seed: number; pt: number }

// Dos carriles con sentidos opuestos.
const LANES = [{ y: GY + 77, dir: -1 }, { y: GY + 105, dir: 1 }];

// Información del año que aparece al pasar hacia la derecha por cada punto, una vez por partida
// (flag streetInfo1, streetInfo2...). Separados lo que se tarda en leer cada uno andando.
const INFO: { x: number; key: TextKey }[] = [
  { x: 70, key: 'street.info.1' },
  { x: 540, key: 'street.info.2' },
  { x: 920, key: 'street.info.3' },
  { x: 1530, key: 'street.info.4' },
];

function flipped(img: HTMLImageElement): HTMLCanvasElement {
  const c = mk(img.width, img.height), x = c.getContext('2d')!;
  x.translate(img.width, 0); x.scale(-1, 1); x.drawImage(img, 0, 0);
  return c;
}

function tinted(img: HTMLImageElement): HTMLCanvasElement {
  const c = mk(img.width, img.height), x = c.getContext('2d')!;
  x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, img.width, img.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = Math.min(255, d[i] * .92 + 8); d[i + 1] = d[i + 1] * .82; d[i + 2] = d[i + 2] * .8; }
  x.putImageData(id, 0, 0);
  return c;
}

export async function load(): Promise<Scene> {
  const [ground, sky, buildingImgs, vehicles] = await Promise.all([
    loadImage(groundUrl),
    loadImage(skylineUrl),
    Promise.all(buildingsData.map(b => loadImage(assetUrl(b.src)))),
    Promise.all(vehiclesData.map(async (v): Promise<Vehicle> => {
      const [body, strip] = await Promise.all([loadImage(assetUrl(v.body)), loadImage(assetUrl(v.strip))]);
      return { ...v, body: tinted(body), strip: tinted(strip) };
    })),
  ]);
  const groundFlip = flipped(ground), skyFlip = flipped(sky);

  let cyc = 0; // longitud del bucle de edificios
  const buildings: Building[] = buildingsData.map((b, i) => {
    const out = { w: b.w, h: b.h, door: b.door, t: b.t, x: cyc + GAP / 2, img: buildingImgs[i] };
    cyc += b.w + GAP;
    return out;
  });

  function drawBg(cx: number) {
    const p = cx * .3, s0 = Math.floor(p / SKYW);
    for (let i = s0; i * SKYW - p < V; i++) ctx.drawImage(i % 2 ? skyFlip : sky, Math.round(i * SKYW - p), GY + 3 - SKYH);
    const g0 = Math.floor(cx / GW);
    for (let i = g0; i * GW - cx < V; i++) ctx.drawImage(i % 2 ? groundFlip : ground, i * GW - cx, GY);
    const k0 = Math.floor((cx - 500) / cyc), k1 = Math.floor((cx + V) / cyc);
    for (let k = Math.max(0, k0); k <= k1; k++) for (const b of buildings) {
      const X = Math.round(k * cyc + b.x - cx);
      if (X > V || X + b.w < 0) continue;
      ctx.drawImage(b.img, X, GY + 3 - b.h);
    }
  }

  function hotspot(x: number, y: number): Hotspot | null {
    const k = Math.floor(x / cyc);
    let best: Hotspot | null = null, bd = 1e9;
    for (let kk = k - 1; kk <= k + 1; kk++) for (const b of buildings) {
      const hx = kk * cyc + b.x + b.door, hy = GY + 12, d = Math.hypot(x - hx, (y - hy) * 1.5);
      if (d < 18 && d < bd) { bd = d; best = { t: [b.t] }; }
    }
    return best;
  }

  let lastX = 0;
  function updateInfo() {
    INFO.forEach((info, i) => {
      const flag = `streetInfo${i + 1}`;
      if (!world.flags[flag] && lastX < info.x && pl.x >= info.x) {
        world.flags[flag] = true;
        showCaption(t(info.key));
      }
    });
    lastX = pl.x;
  }

  // ---------- tráfico ----------
  let cars: Car[] = [], laneT = [1.2, 2.8];

  function update(dt: number) {
    updateInfo();
    const cx = Math.max(0, pl.x - V / 2);
    for (let l = 0; l < 2; l++) {
      laneT[l] -= dt;
      if (laneT[l] > 0) continue;
      laneT[l] = 2.2 + Math.random() * 4.5;
      const v = vehicles[Math.floor(Math.random() * vehicles.length)], L = LANES[l], x = L.dir < 0 ? cx + V + 20 : cx - v.w - 20;
      if (!cars.some(c => c.l === l && (L.dir < 0 ? c.x + c.k.w > x - 60 : c.x < x + v.w + 60))) {
        cars.push({ l, x, k: v, v: v.speed[0] + Math.random() * (v.speed[1] - v.speed[0]), cur: 0, d: 0, seed: Math.random() * 9, pt: 0 });
      }
    }
    for (const c of cars) {
      const L = LANES[c.l];
      let sp = c.v;
      // Frena detrás del coche de delante.
      for (const o of cars) if (o !== c && o.l === c.l) {
        const gap = L.dir > 0 ? o.x - (c.x + c.k.w) : c.x - (o.x + o.k.w);
        if (gap > -5 && gap < 28) sp = Math.min(sp, o.cur || o.v);
      }
      c.cur = sp; c.x += L.dir * sp * dt; c.d += sp * dt;
      if (c.k.exhaust) {
        c.pt -= dt;
        if (c.pt <= 0) {
          c.pt = .12 + Math.random() * .15;
          const rx = L.dir > 0 ? c.x + 3 : c.x + c.k.w - 3;
          world.parts.push({ x: rx, y: L.y - 9, vx: -L.dir * (10 + Math.random() * 10), vy: -6 - Math.random() * 6, g: 0, life: .6, max: .6, col: '#8a8090', sz: 1 });
        }
      }
    }
    cars = cars.filter(c => c.x > cx - c.k.w - 320 && c.x < cx + V + 320);
  }

  function drawFront(cx: number) {
    const order = [...cars].sort((a, b) => a.l - b.l);
    for (const c of order) {
      const v = c.k, L = LANES[c.l], X = Math.round(c.x - cx), Y = L.y - v.wb;
      if (X > V || X + v.w < 0) continue;
      ctx.fillStyle = 'rgba(10,6,14,.38)';
      ctx.fillRect(X + 8, L.y - 3, v.w - 16, 4); ctx.fillRect(X + 14, L.y + 1, v.w - 28, 2);
      // El giro de las ruedas va ligado a la distancia recorrida (12 fotogramas por vuelta).
      const bob = Math.round(Math.sin(c.d * .13 + c.seed) * .6), fr = Math.floor(c.d / v.r / (Math.PI / 6)) % 12;
      ctx.save();
      if (L.dir < 0) { ctx.translate(X + v.w, 0); ctx.scale(-1, 1); } else ctx.translate(X, 0);
      ctx.drawImage(v.body, 0, Y + bob);
      v.wheels.forEach((wd, k) => ctx.drawImage(v.strip, fr * v.fw, k * v.fh, wd.w, wd.h, wd.x, Y + wd.y, wd.w, wd.h));
      ctx.restore();
    }
  }

  return {
    id: 'street', story: true,
    w: Infinity, h: V, oy: 0,
    tint: true, dust: '#c8a8a0', shadow: 'rgba(30,14,30,.35)',
    spawn: [150, GY + 28, 'down'],
    // En la habitación aparece junto a la puerta, mirando hacia dentro.
    exits: [{ x0: -99, x1: 9, y0: 0, y1: 999, dir: 'left', to: 'room', spawn: [155, 146, 'up'] }],
    marks: [[9, GY + 28]],
    drawBg,
    blocked: walkPoly([[4, GY + 9], [1e9, GY + 9], [1e9, GY + 47], [4, GY + 47]]),
    bulletHit: bulletPoly([[-60, GY + 2], [1e9, GY + 2], [1e9, 240], [-60, 240]]),
    hotspot,
    enter() { cars = []; laneT = [1.2, 2.8]; lastX = pl.x; },
    update,
    drawFront,
  };
}
