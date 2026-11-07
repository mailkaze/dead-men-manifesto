import type { SceneId } from '../state';
import type { Scene } from './scene';

// Cada escena es un módulo aparte: su código e imágenes solo se descargan cuando hacen falta.
const LOADERS: Record<SceneId, () => Promise<{ load(): Promise<Scene> }>> = {
  room: () => import('./room'),
  street: () => import('./street'),
  field: () => import('./field'),
};

const pending = new Map<SceneId, Promise<Scene>>();
const loaded = new Map<SceneId, Scene>();
const failed = new Set<SceneId>();

// Descarga la escena una sola vez; las llamadas siguientes reutilizan la misma promesa.
export function loadScene(id: SceneId): Promise<Scene> {
  let p = pending.get(id);
  if (!p) {
    failed.delete(id);
    p = LOADERS[id]()
      .then(m => m.load())
      .then(s => { loaded.set(id, s); return s; }, err => {
        // Se olvida el intento para poder reintentar la próxima vez.
        pending.delete(id);
        failed.add(id);
        console.error(`No se pudo cargar la escena "${id}":`, err);
        throw err;
      });
    pending.set(id, p);
  }
  return p;
}

export function sceneStatus(id: SceneId): 'ready' | 'loading' | 'failed' {
  return loaded.has(id) ? 'ready' : failed.has(id) ? 'failed' : 'loading';
}

export function getScene(id: SceneId): Scene {
  const s = loaded.get(id);
  if (!s) throw new Error(`La escena "${id}" todavía no está cargada`);
  return s;
}

// Precarga en segundo plano las escenas a las que se puede salir desde esta.
export function prefetchNeighbors(scene: Scene) {
  for (const e of scene.exits) loadScene(e.to).catch(() => {});
}
