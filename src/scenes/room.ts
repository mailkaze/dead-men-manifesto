import roomUrl from '../../assets/scenes/room.png';
import { ctx, loadImage, world, type Poly } from '../core';
import { say } from '../dialogue';
import { t } from '../i18n';
import { giveItem, hasItem } from '../inventory';
import { bulletPoly, nearestHotspot, walkPoly, type Hotspot, type HotspotArea, type Scene } from './scene';

// Habitación de Jessica: fondo fijo (imagen de Gemini ÷ 5), 6 objetos y salida por abajo a la calle.
const WALK: Poly = [[62, 106], [103, 106], [114, 101], [156, 97], [204, 102], [219, 113], [262, 124], [266, 130], [246, 150], [62, 150]];
const BULLETS: Poly = [[20, 104], [100, 90], [160, 84], [200, 92], [275, 118], [275, 153], [0, 153], [0, 124]];
const HOTSPOTS: HotspotArea[] = [
  { x: 70, y: 110, r: 14, t: ['JESSICA: La ciudad se ve tranquila desde aquí. Demasiado tranquila.'] },
  { x: 64, y: 132, r: 12, t: ['JESSICA: Mi baúl de servicio. Todavía no me atrevo a abrirlo.'] },
  { x: 97, y: 109, r: 10, t: ['JESSICA: La mochila lleva días preparada. Por si acaso.'] },
  { x: 138, y: 101, r: 17, t: ['JESSICA: La pistola a medio limpiar y mi cuaderno de notas...', 'JESSICA: Las fechas siguen sin cuadrar. Es como si alguien hubiera cambiado el pasado.'] },
  { x: 196, y: 106, r: 14, t: ['JESSICA: Otra noche sin dormir. No puedo dejar de pensar en esa máquina.'] },
  { x: 236, y: 121, r: 15, t: ['JESSICA: Cincuenta repeticiones más y quizá consiga dejar la mente en blanco.'] },
];
// En el escritorio está la tarjeta de identificación hasta que Jessica la coge.
const DESK = HOTSPOTS[3];
const TAKE_CARD: Hotspot = { t: [], use: () => giveItem('idCard') };

export async function load(): Promise<Scene> {
  const img = await loadImage(roomUrl);
  return {
    id: 'room', story: true,
    w: 275, h: 153, oy: 30,
    tint: true, dust: '#9a7a5c', shadow: 'rgba(20,8,10,.4)',
    spawn: [150, 126, 'down'],
    // En la calle aparece junto a la puerta, en la acera (y = suelo + 28).
    // Sin la tarjeta no sale.
    exits: [{
      x0: 62, x1: 246, y0: 147, y1: 999, dir: 'down', to: 'street', spawn: [34, 146, 'right'],
      locked: () => hasItem('idCard') ? null : [t('room.exit.forgot')],
    }],
    marks: [[155, 156]],
    drawBg: (cx, cy) => ctx.drawImage(img, -cx, -cy),
    blocked: walkPoly(WALK),
    bulletHit: bulletPoly(BULLETS),
    hotspot: (x, y) => {
      const h = nearestHotspot(HOTSPOTS, x, y);
      return h === DESK && !hasItem('idCard') ? TAKE_CARD : h;
    },
    enter() {
      if (world.flags.introSeen) return;
      world.flags.introSeen = true;
      say([t('room.intro.1'), t('room.intro.2'), t('room.intro.3')]);
    },
  };
}
