import { expect, test, type Page } from '@playwright/test';
import { PRESETS } from '../src/presets';

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}

const scene = (page: Page) => page.locator('body');

// Cada estado con nombre abre su escena sin errores y deja una captura en screenshots/.
for (const [name, preset] of Object.entries(PRESETS)) {
  test(`abre el estado "${name}" sin errores`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/?state=${name}`);
    await expect(scene(page)).toHaveAttribute('data-scene', preset.scene);
    await page.waitForTimeout(700);
    await page.locator('#wrap').screenshot({ path: `screenshots/${name}.png` });
    expect(errors).toEqual([]);
  });
}

test('la partida nueva empieza con el diálogo de introducción', async ({ page }) => {
  await page.goto('/?state=new-game');
  await expect(page.locator('#lblA')).toHaveText('Continuar');
});

test('la posición del estado se aplica: frente a Gene-Tech se puede examinar', async ({ page }) => {
  await page.goto('/?state=street-genetech');
  await expect(page.locator('#lblA')).toHaveText('Examinar');
});

test('salir de la habitación por abajo lleva a la calle', async ({ page }) => {
  await page.goto('/?state=room&x=150&y=146');
  await expect(scene(page)).toHaveAttribute('data-scene', 'room');
  await page.keyboard.down('ArrowDown');
  await expect(scene(page)).toHaveAttribute('data-scene', 'street');
  await page.keyboard.up('ArrowDown');
});

test('el botón de escena va al campo de pruebas y vuelve a la calle sin quedarse atascada', async ({ page }) => {
  await page.goto('/?state=street&flags=fieldIntroSeen');
  await expect(scene(page)).toHaveAttribute('data-scene', 'street');
  await page.locator('#scn').tap({ force: true });
  await expect(scene(page)).toHaveAttribute('data-scene', 'field');
  await page.locator('#scn').tap({ force: true });
  await expect(scene(page)).toHaveAttribute('data-scene', 'street');
  // Desde el punto de aparición por defecto, correr a la izquierda llega a la salida de la habitación.
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('ArrowLeft');
  await expect(scene(page)).toHaveAttribute('data-scene', 'room', { timeout: 5000 });
});
