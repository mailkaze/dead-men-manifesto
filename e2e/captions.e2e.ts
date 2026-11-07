import { expect, test } from '@playwright/test';

test('al andar por la calle aparece información sin pausar el juego', async ({ page }) => {
  await page.goto('/?state=street');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'street');
  await page.keyboard.down('ArrowRight');
  await expect(page.locator('#cap')).toHaveAttribute('data-text', /^Año 3141\./);
  // No es un diálogo: A sigue disparando y Jessica sigue andando hasta el siguiente texto.
  await expect(page.locator('#lblA')).toHaveText('Disparar');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/street-caption.png' });
  await expect(page.locator('#cap')).not.toHaveAttribute('data-text', /^Año 3141\./, { timeout: 15000 });
  await expect(page.locator('#cap')).toHaveAttribute('data-text', /\S/);
  await page.keyboard.up('ArrowRight');
});

test('un texto ya visto no se repite', async ({ page }) => {
  await page.goto('/?state=street&flags=streetInfo1');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1500);
  await expect(page.locator('#cap')).not.toHaveAttribute('data-text', /^Año 3141\./);
  await page.keyboard.up('ArrowRight');
});
