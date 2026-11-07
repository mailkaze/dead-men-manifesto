import type { GameState } from './state';

// Estados con nombre para abrir una escena concreta: /?state=<nombre>
export const PRESETS = {
  'new-game': { scene: 'room', flags: {} },
  room: { scene: 'room', flags: { introSeen: true } },
  street: { scene: 'street', x: 34, y: 146, dir: 'right', flags: { introSeen: true } },
  'street-genetech': { scene: 'street', x: 441, y: 132, dir: 'up', flags: { introSeen: true } },
  field: { scene: 'field', flags: { introSeen: true } },
} satisfies Record<string, GameState>;
