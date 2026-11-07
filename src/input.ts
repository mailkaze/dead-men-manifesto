// Entrada: teclado, joystick táctil flotante y botones A/B (B arrastrado hacia arriba fija la carrera).
// a y b valen false, true (teclado o ratón) o el identificador del toque que los mantiene.
export const inp = {
  jx: 0, jy: 0,
  a: false as boolean | number,
  b: false as boolean | number,
  aPress: false,
  runLock: false,
};
export const keys: Record<string, number> = {};

const GAMEKEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyZ', 'KeyX', 'ShiftLeft', 'ShiftRight'];
const A_KEYS = ['Space', 'KeyJ', 'KeyZ'];
const B_KEYS = ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyK'];

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const pad = $('pad'), base = $('joyBase'), knob = $('joyKnob'), bA = $('btnA'), bB = $('btnB');
const lblA = $('lblA'), lblB = $('lblB'), scn = $('scn'), btnInv = $('btnInv');

let sceneButton = () => {};
export function onSceneButton(cb: () => void) { sceneButton = cb; }
let inventoryButton = () => {};
export function onInventoryButton(cb: () => void) { inventoryButton = cb; }
export function setSceneButtonLabel(text: string) { scn.textContent = text; }

let lastLabelA = lblA.textContent;
export function setLabelA(text: string) {
  if (text !== lastLabelA) { lastLabelA = text; lblA.textContent = text; }
}

function setBtn() {
  bA.classList.toggle('on', inp.a !== false);
  bB.classList.toggle('on', inp.b !== false);
  bB.classList.toggle('lock', inp.runLock);
  lblB.textContent = inp.runLock ? 'Correr fijo' : 'Correr';
}

function toggleLock(on: boolean) {
  inp.runLock = on;
  if (navigator.vibrate) navigator.vibrate(on ? [10, 40, 10] : 8);
  setBtn();
}

addEventListener('keydown', e => {
  if (GAMEKEYS.includes(e.code)) e.preventDefault();
  if (e.code === 'KeyR' && !e.repeat) toggleLock(!inp.runLock);
  if (e.code === 'KeyI' && !e.repeat) inventoryButton();
  keys[e.code] = 1;
  if (A_KEYS.includes(e.code)) { if (!inp.a) inp.aPress = true; inp.a = true; }
  if (B_KEYS.includes(e.code)) inp.b = true;
  setBtn();
});
addEventListener('keyup', e => {
  keys[e.code] = 0;
  if (A_KEYS.includes(e.code)) inp.a = false;
  if (B_KEYS.includes(e.code)) inp.b = false;
  setBtn();
});

// ---------- joystick flotante ----------
const R = 50;
let joyId: number | null = null, jox = 0, joy0 = 0;
let bTouch: { id: number | 'm'; y: number } | null = null;

function place(x: number, y: number, dx: number, dy: number) {
  base.style.left = x + 'px'; base.style.top = y + 'px';
  knob.style.left = (x + dx) + 'px'; knob.style.top = (y + dy) + 'px';
}
function restJoy() {
  const r = pad.getBoundingClientRect();
  jox = Math.min(110, r.width * 0.25); joy0 = r.height - 110;
  place(jox, joy0, 0, 0);
  base.style.opacity = '.35'; knob.style.opacity = '.35';
}
function near(el: HTMLElement, t: Touch) {
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  return Math.hypot(t.clientX - cx, t.clientY - cy) < r.width * 0.75;
}
function inEl(el: HTMLElement, tc: Touch) {
  const r = el.getBoundingClientRect();
  return tc.clientX >= r.left - 6 && tc.clientX <= r.right + 6 && tc.clientY >= r.top - 6 && tc.clientY <= r.bottom + 6;
}

scn.addEventListener('mousedown', () => sceneButton());
btnInv.addEventListener('mousedown', () => inventoryButton());

pad.addEventListener('touchstart', e => {
  e.preventDefault();
  const pr = pad.getBoundingClientRect();
  for (const tc of e.changedTouches) {
    if (inEl(scn, tc)) { sceneButton(); continue; }
    if (inEl(btnInv, tc)) { inventoryButton(); continue; }
    if (near(bA, tc)) {
      if (inp.a === false) inp.aPress = true;
      inp.a = tc.identifier;
      if (navigator.vibrate) navigator.vibrate(8);
    } else if (near(bB, tc)) {
      if (inp.runLock) { toggleLock(false); inp.b = false; }
      else { inp.b = tc.identifier; bTouch = { id: tc.identifier, y: tc.clientY }; }
    } else if (tc.clientX - pr.left < pr.width * 0.55 && joyId === null) {
      joyId = tc.identifier; jox = tc.clientX - pr.left; joy0 = tc.clientY - pr.top;
      place(jox, joy0, 0, 0);
      base.style.opacity = '1'; knob.style.opacity = '.9';
    }
  }
  setBtn();
}, { passive: false });

pad.addEventListener('touchmove', e => {
  e.preventDefault();
  const pr = pad.getBoundingClientRect();
  for (const tc of e.changedTouches) {
    if (bTouch && tc.identifier === bTouch.id && bTouch.y - tc.clientY > 35) { bTouch = null; toggleLock(true); }
    if (tc.identifier === joyId) {
      let dx = tc.clientX - pr.left - jox, dy = tc.clientY - pr.top - joy0;
      const d = Math.hypot(dx, dy);
      // Si el dedo se aleja, la base lo sigue a medias.
      if (d > R) {
        jox += dx * (1 - R / d) * 0.5; joy0 += dy * (1 - R / d) * 0.5;
        dx = tc.clientX - pr.left - jox; dy = tc.clientY - pr.top - joy0;
        const d2 = Math.hypot(dx, dy);
        if (d2 > R) { dx *= R / d2; dy *= R / d2; }
      }
      place(jox, joy0, dx, dy);
      const m = Math.hypot(dx, dy);
      inp.jx = m > 10 ? dx / R : 0; inp.jy = m > 10 ? dy / R : 0;
    }
  }
}, { passive: false });

function touchEnd(e: TouchEvent) {
  for (const tc of e.changedTouches) {
    if (tc.identifier === joyId) { joyId = null; inp.jx = inp.jy = 0; restJoy(); }
    if (inp.a === tc.identifier) inp.a = false;
    if (inp.b === tc.identifier) inp.b = false;
    if (bTouch && bTouch.id === tc.identifier) bTouch = null;
  }
  setBtn();
}
pad.addEventListener('touchend', touchEnd);
pad.addEventListener('touchcancel', touchEnd);

// Ratón en escritorio para los botones.
bA.addEventListener('mousedown', () => { inp.aPress = true; inp.a = true; setBtn(); });
bB.addEventListener('mousedown', e => {
  if (inp.runLock) { toggleLock(false); return; }
  inp.b = true; bTouch = { id: 'm', y: e.clientY }; setBtn();
});
addEventListener('mousemove', e => {
  if (bTouch && bTouch.id === 'm' && bTouch.y - e.clientY > 35) { bTouch = null; toggleLock(true); }
});
addEventListener('mouseup', () => { inp.a = false; inp.b = false; bTouch = null; setBtn(); });

addEventListener('resize', restJoy);
restJoy();
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  $('hint').textContent = 'Teclado: WASD o flechas · Espacio o J dispara/examina · Shift o K corre · R fija correr · I mochila';
}
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; inp.a = false; inp.b = false; setBtn(); });
$('screen').addEventListener('mousedown', () => window.focus());
