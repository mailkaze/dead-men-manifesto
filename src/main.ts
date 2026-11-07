import { V, ctx, puff, world } from './core';
import { dialogueDraw, dialogueUpdate, isTalking, say } from './dialogue';
import { inp, keys, onSceneButton, setLabelA, setSceneButtonLabel } from './input';
import { drawPlayer, pl, shoot, updateTail } from './player';
import { PRESETS } from './presets';
import { getScene, loadScene, prefetchNeighbors, sceneStatus } from './scenes';
import type { Drawable, Scene, Spawn } from './scenes/scene';
import { stateFromQuery, type SceneId } from './state';

let scene!: Scene;
let lastStory: SceneId = 'room';
let fade: { t: number; to: SceneId; spawn: Spawn; done: boolean } | null = null;

function setScene(s: Scene, spawn: Spawn = s.spawn) {
  scene = s;
  world.bullets = []; world.parts = []; pl.shootT = 0;
  if (s.story) lastStory = s.id;
  [pl.x, pl.y, pl.dir] = spawn;
  document.body.dataset.scene = s.id;
  setSceneButtonLabel(s.story ? 'Ir al campo de pruebas ▸' : '◂ Volver a la historia');
  s.enter?.();
  prefetchNeighbors(s);
}

// Fundido a negro; si la escena destino aún no ha llegado, la pantalla espera en negro.
function startFade(to: SceneId, spawn: Spawn) {
  fade = { t: 0, to, spawn, done: false };
  pl.cd = .4;
  loadScene(to).catch(() => {});
}

onSceneButton(() => {
  loadScene(scene.story ? 'field' : lastStory).then(s => setScene(s), () => {});
});

// ---------- update ----------
function update(dt: number) {
  world.t += dt;
  if (fade) {
    fade.t += dt;
    if (!fade.done && fade.t >= .3) {
      const status = sceneStatus(fade.to);
      if (status === 'loading') fade.t = .3;
      else {
        fade.done = true;
        // Si la descarga falla, el fundido vuelve a la escena actual.
        if (status === 'ready') setScene(getScene(fade.to), fade.spawn);
      }
    }
    if (fade.t >= .62) fade = null;
    inp.aPress = false;
    return;
  }
  if (dialogueUpdate(dt)) {
    pl.moving = false;
    for (const p of world.parts) p.life -= dt;
    world.parts = world.parts.filter(p => p.life > 0);
    return;
  }

  let mx = inp.jx, my = inp.jy;
  const kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  const ky = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
  if (kx || ky) { mx = kx; my = ky; }
  const m = Math.min(1, Math.hypot(mx, my));
  if (pl.cd > 0) pl.cd -= dt;
  if (pl.shootT > 0) pl.shootT -= dt;

  // A examina si hay algo cerca; si no, dispara.
  const hs = scene.hotspot(pl.x, pl.y);
  if (inp.aPress && hs && pl.shootT <= 0) { inp.aPress = false; inp.a = false; say(hs.t); return; }
  if ((inp.aPress || inp.a !== false) && pl.cd <= 0 && !hs) shoot();
  inp.aPress = false;

  const moving = m > 0.15;
  if (moving && pl.shootT <= 0.02) {
    if (Math.abs(mx) > Math.abs(my) * 1.1) pl.dir = mx > 0 ? 'right' : 'left';
    else pl.dir = my > 0 ? 'down' : 'up';
  }
  const run = inp.b !== false || inp.runLock;
  if (moving) {
    const sp = (run ? 125 : 73) * Math.max(.55, m) * (pl.shootT > 0 ? .85 : 1), n = Math.hypot(mx, my) || 1;
    const dx = mx / n * sp * dt, dy = my / n * sp * dt;
    if (!scene.blocked(pl.x + dx, pl.y)) pl.x += dx;
    if (!scene.blocked(pl.x, pl.y + dy)) pl.y += dy;
    pl.walkT += dt * (run ? 17 : 11);
    const fi = Math.floor(pl.walkT) % 4;
    // Polvo en cada pisada.
    if (fi !== pl.lastStep) {
      pl.lastStep = fi;
      if (fi === 0 || fi === 2) puff(pl.x + (fi ? 3 : -3), pl.y - 1, run ? 5 : 2, scene.dust, run ? 18 : 10, .3);
    }
  } else { pl.walkT = 0; pl.lastStep = -1; }
  pl.moving = moving;
  pl.running = run;

  if (moving) for (const e of scene.exits) {
    const pushing = e.dir === 'down' ? my > .3 : e.dir === 'up' ? my < -.3 : e.dir === 'left' ? mx < -.3 : mx > .3;
    if (pl.x >= e.x0 && pl.x <= e.x1 && pl.y >= e.y0 && pl.y <= e.y1 && pushing) { startFade(e.to, e.spawn); break; }
  }
  updateTail(dt);

  for (const b of world.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    scene.bulletHit(b, b.y + b.h);
    // Impacto (life exactamente 0): chispa; si caduca, desaparece sin más.
    if (b.life <= 0 && b.life > -1) {
      if (b.life > -.001) puff(b.x, b.y, 3, '#e8e0c0', 15, .2);
      b.life = -2;
    }
  }
  world.bullets = world.bullets.filter(b => b.life > 0);
  scene.update?.(dt);
  for (const p of world.parts) {
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.floor && p.y > p.floor) { p.y = p.floor; p.vy *= -.35; p.vx *= .5; }
    p.life -= dt;
  }
  world.parts = world.parts.filter(p => p.life > 0);
  if (world.shake > 0) world.shake -= dt;
  if (pl.muz) pl.muz.t -= dt;
}

// ---------- draw ----------
function drawExitMarks(cx: number, cy: number) {
  if (Math.floor(world.t * 2.5) % 2 !== 0) return;
  for (const [mx, my] of scene.marks) {
    if (Math.hypot(pl.x - mx, pl.y - my) >= 45) continue;
    const X = mx - cx - 3, Y = my - cy - 2, dr = scene.exits[0].dir;
    ctx.fillStyle = '#f4e8c8';
    for (let k = 0; k < 4; k++) {
      if (dr === 'down') ctx.fillRect(X + k, Y + k, 7 - 2 * k, 1);
      else if (dr === 'up') ctx.fillRect(X + k, Y + 3 - k, 7 - 2 * k, 1);
      else if (dr === 'left') ctx.fillRect(X + 3 - k, Y - 1 + k, 1, 7 - 2 * k);
      else ctx.fillRect(X + k, Y - 1 + k, 1, 7 - 2 * k);
    }
  }
}

function draw() {
  const SC = scene;
  // Cámara: centrada si la escena es más pequeña que la pantalla; si no, sigue a Jessica.
  let cx = SC.w <= V ? -Math.round((V - SC.w) / 2) : Math.round(Math.min(SC.w - V, Math.max(0, pl.x - V / 2)));
  let cy = SC.h <= V ? -SC.oy : Math.round(Math.min(SC.h - V, Math.max(0, pl.y - 30 - V / 2)));
  if (world.shake > 0) { cx += Math.random() < .5 ? -1 : 1; cy += Math.random() < .5 ? -1 : 1; }

  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, V, V);
  SC.drawBg(cx, cy);
  drawExitMarks(cx, cy);

  const bubble = !isTalking() && SC.hotspot(pl.x, pl.y) !== null;
  const items: Drawable[] = [...(SC.drawables?.() ?? []), { y: pl.y, draw: (x, y) => drawPlayer(x, y, SC.tint, SC.shadow, bubble) }];
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw(cx, cy);
  SC.drawFront?.(cx);

  for (const b of world.bullets) {
    const x = Math.round(b.x - cx), y = Math.round(b.y - cy);
    ctx.fillStyle = '#fff6c0'; ctx.fillRect(x, y, b.vx ? 3 : 1, b.vx ? 1 : 3);
    ctx.fillStyle = '#f0a040'; ctx.fillRect(x - Math.sign(b.vx) * 2, y - Math.sign(b.vy) * 2, 1, 1);
  }
  for (const p of world.parts) {
    ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
    ctx.fillStyle = p.col;
    const s = p.sz * (p.g ? 1 : (1 + (1 - p.life / p.max) * 2)) | 0;
    ctx.fillRect(Math.round(p.x - cx - s / 2), Math.round(p.y - cy - s / 2), s, s);
  }
  ctx.globalAlpha = 1;
  if (pl.muz && pl.muz.t > 0) {
    const m = pl.muz, x = Math.round(m.x - cx), y = Math.round(m.y - cy);
    ctx.fillStyle = '#fff8d0'; ctx.fillRect(x - 1, y - 1, 3, 3);
    ctx.fillStyle = '#ffd040';
    ctx.fillRect(x + m.vx * 3 - 1, y + m.vy * 3 - 1, 3, 3); ctx.fillRect(x + m.vx * 5, y + m.vy * 5, 1, 1);
    ctx.fillRect(x - 1 + (m.vy ? -2 : 0), y - 1 + (m.vx ? -2 : 0), 1, 1); ctx.fillRect(x + 1 + (m.vy ? 2 : 0), y + 1 + (m.vx ? 2 : 0), 1, 1);
  }
  if (fade) {
    const a = fade.t < .3 ? fade.t / .3 : Math.max(0, 1 - (fade.t - .3) / .3);
    ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, V, V); ctx.globalAlpha = 1;
  }
}

// ---------- arranque ----------
let last = 0;
function loop(now: number) {
  const talking = isTalking();
  setLabelA(talking ? 'Continuar' : scene.hotspot(pl.x, pl.y) ? 'Examinar' : 'Disparar');
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000));
  last = now;
  update(dt); draw(); dialogueDraw();
  requestAnimationFrame(loop);
}

// El estado inicial sale de la URL: ?state=<nombre> más ajustes opcionales (ver src/state.ts).
async function boot() {
  const { state, warnings } = stateFromQuery(location.search, PRESETS);
  for (const w of warnings) console.warn(w);
  world.flags = { ...state.flags };
  const s = await loadScene(state.scene);
  setScene(s, [state.x ?? s.spawn[0], state.y ?? s.spawn[1], state.dir ?? s.spawn[2]]);
  last = performance.now();
  requestAnimationFrame(loop);
}
boot().catch(err => console.error('No se pudo arrancar el juego:', err));

// Solo en desarrollo: el servidor puede mandar a todos los dispositivos conectados a un estado (ver vite.config.ts).
if (import.meta.hot) {
  import.meta.hot.on('dmm:goto', ({ query }: { query: string }) => {
    // Solo cambia la query: así la página nunca sale de este servidor.
    location.search = query;
  });
}
