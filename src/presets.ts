import type { GameState } from './state';

// Estados con nombre para abrir una escena concreta: /?state=<nombre>
export const PRESETS = {
  'new-game': { scene: 'room', flags: {} },
  room: { scene: 'room', flags: { introSeen: true } },
  // En la calle Jessica ya lleva la tarjeta de identificación.
  street: { scene: 'street', x: 34, y: 146, dir: 'right', flags: { introSeen: true }, items: ['idCard'] },
  'street-genetech': { scene: 'street', x: 441, y: 132, dir: 'up', flags: { introSeen: true }, items: ['idCard'] },
  field: { scene: 'field', flags: { introSeen: true } },
} satisfies Record<string, GameState>;
