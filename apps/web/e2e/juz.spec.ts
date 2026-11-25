import { expect, test } from "@playwright/test";

test("guest can browse the public Juz index and open a Juz at its first ayah", async ({ page }) => {
  await page.goto("/quran");
  await page.getByRole("link", { name: "Browse by Juz" }).click();

  await expect(page).toHaveURL(/\/juz$/u);
  await expect(page.getByRole("heading", { name: "Browse by Juz" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Juz reading divisions" }).getByRole("listitem")).toHaveCount(30);
  await expect(page.getByText("Licensing for these boundary references has not been independently verified.")).toBeVisible();

  await page.getByRole("link", { name: "Read Juz 2, starting at Al-Baqarah 2:142" }).click();

  await expect(page).toHaveURL(/\/surah\/2#ayah-142$/u);
  await expect(page.getByLabel("Jump to ayah")).toHaveValue("142");
  await expect(page.locator("#ayah-142")).toBeInViewport();
});

test("Juz navigation remains usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/juz");

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Read Juz 30, starting at An-Naba 78:1" }).click();

  await expect(page).toHaveURL(/\/surah\/78#ayah-1$/u);
  await expect(page.getByLabel("Jump to ayah")).toHaveValue("1");
});