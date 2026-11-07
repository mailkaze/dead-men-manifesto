import { expect, test, type Page } from '@playwright/test';

const CARD = 'Tarjeta de identificación para el Laboratorio Militar de Ciencias Avanzadas';
const scene = (page: Page) => page.locator('body');

// Avanza el diálogo abierto hasta cerrarlo (dos pulsaciones por frase: completar y pasar).
async function closeDialogue(page: Page) {
  for (let i = 0; i < 8 && await page.locator('#txt').getAttribute('data-text'); i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
  }
  await expect(page.locator('#txt')).not.toHaveAttribute('data-text');
}

test('sin la tarjeta, Jessica no sale de la habitación', async ({ page }) => {
  await page.goto('/?state=room&x=150&y=146');
  await expect(scene(page)).toHaveAttribute('data-scene', 'room');
  await page.keyboard.down('ArrowDown');
  await expect(page.locator('#txt')).toHaveAttribute('data-text', 'JESSICA: Creo que se me olvida algo...');
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(400);
  await expect(scene(page)).toHaveAttribute('data-scene', 'room');
});

test('la mochila empieza vacía y se abre con su botón', async ({ page }) => {
  await page.goto('/?state=room');
  await expect(page.locator('#inv')).toBeHidden();
  await page.locator('#btnInv').tap({ force: true });
  await expect(page.locator('#inv')).toBeVisible();
  await expect(page.locator('#invList')).toHaveText('La mochila está vacía.');
  await page.locator('#invClose').tap();
  await expect(page.locator('#inv')).toBeHidden();
});

test('coge la tarjeta del escritorio, la lleva en la mochila y puede salir a la calle', async ({ page }) => {
  await page.goto('/?state=room&x=138&y=101&dir=up');
  await expect(page.locator('#lblA')).toHaveText('Examinar');
  await page.keyboard.press('Space');
  await expect(page.locator('#txt')).toHaveAttribute('data-text', `Has conseguido la ${CARD}.`);
  await page.waitForTimeout(300);
  await page.locator('#wrap').screenshot({ path: 'screenshots/item-obtained.png' });
  await closeDialogue(page);

  await page.keyboard.press('KeyI');
  await expect(page.locator('#inv')).toBeVisible();
  await expect(page.locator('#invList')).toHaveText(CARD);
  await page.locator('#wrap').screenshot({ path: 'screenshots/inventory.png' });
  await page.keyboard.press('KeyI');
  await expect(page.locator('#inv')).toBeHidden();

  // La tarjeta ya no está en el escritorio: al examinarlo no se consigue otra vez.
  await page.keyboard.press('Space');
  await expect(page.locator('#txt')).not.toHaveAttribute('data-text', `Has conseguido la ${CARD}.`);
  await closeDialogue(page);

  await page.goto('/?state=room&x=150&y=146&items=idCard');
  await page.keyboard.down('ArrowDown');
  await expect(scene(page)).toHaveAttribute('data-scene', 'street');
  await page.keyboard.up('ArrowDown');
});
