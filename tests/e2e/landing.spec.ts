import { expect, test } from '@playwright/test';

test('랜딩 페이지에 PortLink 워드마크와 두 진입 버튼이 보인다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PortLink', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: '포워더로 시작' })).toBeVisible();
  await expect(page.getByRole('link', { name: '차주로 시작' })).toBeVisible();
});
