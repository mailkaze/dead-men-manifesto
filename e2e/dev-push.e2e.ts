import { expect, test } from '@playwright/test';

test('el servidor de desarrollo envía un estado a los dispositivos conectados', async ({ page, request }) => {
  const connected = page.waitForEvent('console', m => m.text().includes('[vite] connected'));
  await page.goto('/?state=room');
  await connected;
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'room');

  const res = await request.get('/__dev/goto?state=street-genetech&flags=met');
  expect(res.ok()).toBe(true);
  expect(await res.text()).toMatch(/^Estado enviado a [1-9]\d* dispositivo\(s\): \?state=street-genetech&flags=met\n$/);

  await expect(page).toHaveURL(/\/\?state=street-genetech&flags=met$/);
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'street');
  await expect(page.locator('#lblA')).toHaveText('Examinar');
});

test('un estado enviado no saca la página de este servidor', async ({ page, request, baseURL }) => {
  const connected = page.waitForEvent('console', m => m.text().includes('[vite] connected'));
  await page.goto(`${baseURL}//evil.example/?state=room`);
  await connected;
  await request.get('/__dev/goto?state=street');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'street');
  expect(new URL(page.url()).host).toBe(new URL(baseURL!).host);
});
