// Estado de partida que se puede describir en una URL: escena, posición, dirección y flags.
export type SceneId = 'room' | 'street' | 'field';
export type Dir = 'down' | 'up' | 'left' | 'right';
export type FlagValue = boolean | number | string;
export type Flags = Record<string, FlagValue>;

export interface GameState {
  scene: SceneId;
  x?: number;
  y?: number;
  dir?: Dir;
  flags: Flags;
  items?: string[]; // inventario de Jessica (ids de src/items.ts)
}

export const SCENE_IDS: readonly SceneId[] = ['room', 'street', 'field'];
const DIRS: readonly Dir[] = ['down', 'up', 'left', 'right'];
export const DEFAULT_STATE = 'new-game';

function toNumber(raw: string): number | null {
  const n = Number(raw);
  return raw.trim() !== '' && Number.isFinite(n) ? n : null;
}

function toFlagValue(raw: string): FlagValue {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return toNumber(raw) ?? raw;
}

// Lee ?state=<nombre> y los ajustes opcionales scene, x, y, dir, flags (a,b=2,c=texto) e items (a,b).
export function stateFromQuery(
  search: string,
  presets: Readonly<Record<string, GameState>>,
): { state: GameState; warnings: string[] } {
  const q = new URLSearchParams(search);
  const warnings: string[] = [];

  let name = q.get('state') ?? DEFAULT_STATE;
  if (!Object.hasOwn(presets, name)) {
    warnings.push(`Estado desconocido: "${name}". Se usa "${DEFAULT_STATE}".`);
    name = DEFAULT_STATE;
  }
  const base = presets[name];
  const state: GameState = { ...base, flags: { ...base.flags } };
  if (base.items) state.items = [...base.items];

  const scene = q.get('scene');
  if (scene !== null) {
    if (!SCENE_IDS.includes(scene as SceneId)) warnings.push(`Escena desconocida: "${scene}".`);
    else if (scene !== state.scene) {
      // La posición del estado base no tiene sentido en otra escena.
      state.scene = scene as SceneId;
      delete state.x;
      delete state.y;
      delete state.dir;
    }
  }

  for (const key of ['x', 'y'] as const) {
    const raw = q.get(key);
    if (raw === null) continue;
    const n = toNumber(raw);
    if (n === null) warnings.push(`Valor no numérico para ${key}: "${raw}".`);
    else state[key] = n;
  }

  const dir = q.get('dir');
  if (dir !== null) {
    if (DIRS.includes(dir as Dir)) state.dir = dir as Dir;
    else warnings.push(`Dirección desconocida: "${dir}".`);
  }

  for (const part of (q.get('flags') ?? '').split(',')) {
    const [key, ...rest] = part.split('=');
    if (!key.trim()) continue;
    state.flags[key.trim()] = rest.length ? toFlagValue(rest.join('=')) : true;
  }

  const items = (q.get('items') ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (items.length) state.items = [...new Set([...(state.items ?? []), ...items])];

  return { state, warnings };
}
