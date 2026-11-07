import { expect, test } from '@playwright/test';

test('los textos se dibujan a la resolución real de la pantalla para que se lean nítidos', async ({ page }) => {
  await page.goto('/?state=new-game');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'room');
  const sizes = await page.evaluate(() => ['txt', 'cap'].map(id => {
    const c = document.getElementById(id) as HTMLCanvasElement;
    return { id, width: c.width, expected: Math.round(c.getBoundingClientRect().width * Math.min(3, devicePixelRatio)) };
  }));
  for (const s of sizes) expect(s.width, s.id).toBe(s.expected);
  await page.waitForTimeout(2500);
  await page.locator('#wrap').screenshot({ path: 'screenshots/dialogue-text.png' });
});
