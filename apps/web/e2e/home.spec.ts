import { expect, test } from "@playwright/test";

test("home page presents the Muslim Ayat foundation", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Muslim Ayat/);
  await expect(page.getByRole("heading", { name: "Welcome to your Quran experience" })).toBeVisible();
  await expect(page.getByText("No account required. Start reading immediately.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the Quran" })).toHaveAttribute("href", "/quran");
  await expect(page.getByText("Want to personalize your experience?")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  await expect(page.getByRole("link", { name: "Continue reading as guest" })).toHaveAttribute("href", "/quran");
});

test("PWA manifest exposes the required install icons", async ({ page }) => {
  await page.goto("/");
  const response = await page.request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }),
      expect.objectContaining({
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        purpose: "maskable",
      }),
    ]),
  );

  const dimensions = await page.evaluate(async () => {
    return Promise.all(["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-512-maskable.png"].map(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return { src, width: image.naturalWidth, height: image.naturalHeight };
    }));
  });
  expect(dimensions).toEqual([
    { src: "/icons/icon-192.png", width: 192, height: 192 },
    { src: "/icons/icon-512.png", width: 512, height: 512 },
    { src: "/icons/icon-512-maskable.png", width: 512, height: 512 },
  ]);
});

test("reader remains navigable at mobile width with visible keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/surah/2");

  await expect(page.getByRole("heading", { name: "Al-Baqarah" })).toBeVisible();
  await expect(page.getByLabel("Jump to ayah")).toBeVisible();
  await expect(page.getByLabel("Reciter")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.keyboard.press("Tab");
  const focusedOutline = await page.evaluate(() => {
    const activeElement = document.activeElement;
    return activeElement ? getComputedStyle(activeElement).outlineStyle : "none";
  });
  expect(focusedOutline).not.toBe("none");
});

test("reader lists surahs and guides users to future resources", async ({ page }) => {
  await page.goto("/quran");

  await expect(page.getByRole("heading", { name: "The Quran" })).toBeVisible();
  await expect(page.locator('a[href="/surah/1"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Study resources and future additions" })).toBeVisible();
  await page.getByText("Sources and rights information", { exact: true }).click();
  const sourceRecords = page.getByRole("link", { name: "View source record" }).locator("xpath=..");
  await expect(sourceRecords).toHaveCount(13);
  await expect(sourceRecords.first()).toContainText("QUL Uthmani Simple");
  await expect(sourceRecords.first()).toContainText("License metadata: not recorded");
  await sourceRecords
    .first()
    .getByText("Rights review for QUL Uthmani Simple: Unreviewed; permissions unresolved")
    .click();
  await expect(sourceRecords.first()).toContainText("Public display: Unknown");
  await expect(sourceRecords.first()).toContainText("No rights evidence recorded.");
  await expect(sourceRecords.first()).toContainText("Technical source integrity");
  await expect(sourceRecords.first()).toContainText("not rights or permissions");
  await expect(sourceRecords.nth(3)).toContainText("resource 70");
  await expect(sourceRecords.nth(4)).toContainText("resource 592");
  await expect(sourceRecords.nth(4)).toContainText("Naveed Ahmad");
  await expect(sourceRecords.nth(4)).toContainText("rights remain unknown");
  await expect(sourceRecords.nth(5)).toContainText("resource ID and original rights holder not independently verified");
  await expect(sourceRecords.nth(6)).toContainText("resource 92");
  await expect(sourceRecords.nth(7)).toContainText("AlQuran Cloud CDN provider terms");
  await expect(sourceRecords.nth(8)).toContainText("recording and performance");
});

test("surah reader displays Arabic, translation, and transliteration", async ({ page }) => {
  await page.goto("/surah/1");

  await expect(page.getByRole("heading", { name: "Al-Fātiĥah" })).toBeVisible();
  await expect(page.getByText("In the name of Allāh, the Entirely Merciful, the Especially Merciful.")).toBeVisible();
  await expect(page.getByText("Bismil laahir Rahmaanir Raheem")).toBeVisible();
  await expect(page.getByLabel("Jump to ayah")).toBeVisible();
});

test("account routes keep signed-out personal data private", async ({ page }) => {
  await page.goto("/account");

  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
  if (await page.getByText("Account features are not configured.").count()) {
    await expect(page.getByText("Account features are not configured.")).toBeVisible();
    await page.goto("/bookmarks");
    await expect(page.getByText("Configure the public Supabase URL and publishable key")).toBeVisible();
    await page.goto("/sign-in");
    await expect(page.getByText("Account features are unavailable until")).toBeVisible();
  } else {
    await expect(page.getByText("Sign in to manage your private profile and reading data.")).toBeVisible();
    await page.getByRole("link", { name: "Sign in with a provider" }).click();
    await expect(page.getByRole("heading", { name: "Sign in with a provider" })).toBeVisible();
    const providerButtons = page.getByRole("button", { name: /^Continue with / });
    await expect(providerButtons).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Microsoft" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Facebook" })).toBeVisible();
  }
});

test("shows the supplied QUL Surah header image in Mushaf mode", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "muslim-ayat-reader-preferences-v1",
      JSON.stringify({
        readingMode: "mushaf",
        translationId: "saheeh-international",
        showTransliteration: true,
        arabicFontSize: "comfortable",
      }),
    );
  });
  await page.goto("/surah/2");

  await expect(page.getByRole("heading", { name: "Al-Baqarah" })).toBeVisible();
  const headerImage = page.locator('img[src="/surah-headers/surah-002.svg"]');
  await expect(headerImage).toBeVisible();
  await expect
    .poll(() => headerImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
});

test("streams selected recitation with repeat, speed, and ayah navigation controls", async ({ page, context }) => {
  await page.goto("/surah/2");
  const player = page.getByRole("region", { name: "Ayah recitation" });
  if (await page.getByText("Recitation streaming is disabled for this deployment.").count()) {
    await expect(page.getByText("Recitation streaming is disabled for this deployment.")).toBeVisible();
    return;
  }

  await expect(player.getByLabel("Reciter")).toHaveValue("ar.alafasy");
  const audio = player.locator("audio");
  await expect(audio).toHaveAttribute(
    "src",
    "https://cdn.islamic.network/quran/audio/128/ar.alafasy/8.mp3",
  );
  await player.getByLabel("Reciter").selectOption("ar.husary");
  await expect(audio).toHaveAttribute(
    "src",
    "https://cdn.islamic.network/quran/audio/128/ar.husary/8.mp3",
  );
  await player.getByLabel("Playback speed").selectOption("1.5");
  await player.getByLabel("Repeat ayah").check();
  await player.getByRole("button", { name: "Next ayah" }).click();
  await expect(audio).toHaveAttribute(
    "src",
    "https://cdn.islamic.network/quran/audio/128/ar.husary/9.mp3",
  );

  await context.setOffline(true);
  await expect(player.getByText("Audio streaming needs an internet connection and is not available offline.")).toBeVisible();
  await context.setOffline(false);
});

test("loads attributed tafsir and leaves missing word glosses blank", async ({ page }) => {
  await page.goto("/surah/2");
  await page.getByLabel("Jump to ayah").selectOption("181");
  const ayah = page.locator("#ayah-181");
  await ayah.getByRole("button", { name: /Tafsir and word-by-word study/ }).click();
  const studyPanel = page.locator("#study-2-181");

  await expect(studyPanel.getByRole("heading", { name: "Tafsir · Abridged Explanation of the Quran" })).toBeVisible();
  await expect(studyPanel.getByRole("heading", { name: "English word-by-word glosses" })).toBeVisible();
  await expect(studyPanel.getByText("No gloss in source").first()).toBeVisible();
  await studyPanel
    .getByText("Rights review for Abridged Explanation of the Quran tafsir: Unreviewed; permissions unresolved")
    .click();
  await expect(studyPanel.getByText("Public display: Unknown").first()).toBeVisible();
  await expect(studyPanel.getByText("No rights evidence recorded.").first()).toBeVisible();
  await expect(studyPanel.getByRole("link", { name: "Source record" }).first()).toHaveAttribute(
    "href",
    "https://qul.tarteel.ai/resources/tafsir",
  );
});

test("search finds companion text and links to the matching ayah", async ({ page }) => {
  await page.goto("/search?q=Bismil%20laahir");

  await expect(page.getByRole("heading", { name: "Search the Quran" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Al-Fātiĥah · Ayah 1" })).toHaveAttribute(
    "href",
    "/surah/1#ayah-1",
  );
});

test("reading preferences persist and control the reader", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Mushaf-style page").check();
  await page.getByLabel("Show English transliteration").uncheck();
  await page.getByLabel("Translation", { exact: true }).selectOption("none");
  await page.reload();

  await expect(page.getByLabel("Mushaf-style page")).toBeChecked();
  await expect(page.getByLabel("Show English transliteration")).not.toBeChecked();
  await expect(page.getByLabel("Translation", { exact: true })).toHaveValue("none");
  await page.getByRole("button", { name: "Sync preferences across devices" }).click();
  await expect(page.getByText("Sign in to save the personal features enabled on this deployment across devices.")).toBeVisible();
  await page.getByRole("button", { name: "Continue reading as guest" }).click();
  await expect(page.getByText("Sign in to save the personal features enabled on this deployment across devices.")).toHaveCount(0);

  await page.goto("/surah/1");
  await expect(page.locator('[data-reading-mode="mushaf"]')).toBeVisible();
  await expect(page.locator('img[src*="/surah-headers/"]')).toHaveCount(0);
  await expect(page.getByText("Bismil laahir Rahmaanir Raheem")).toHaveCount(0);
  await expect(
    page.getByText("In the name of Allāh, the Entirely Merciful, the Especially Merciful."),
  ).toHaveCount(0);
});

test("guest reading works offline and personal saves ask for sign-in without blocking reading", async ({ page, context }) => {
  await page.goto("/surah/1");
  await expect(page.getByRole("heading", { name: "Al-Fātiĥah" })).toBeVisible();
  const publicStudyResponse = await page.request.get("/api/study/2/181");
  expect(publicStudyResponse.ok()).toBe(true);

  await page.waitForFunction(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("muslim-ayat-offline-v1");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const record = await new Promise<{ content?: { ayahs?: unknown[] } } | undefined>((resolve, reject) => {
      const request = database.transaction("publicQuran").objectStore("publicQuran").get("surah:1");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return Boolean(record?.content?.ayahs?.length);
  });

  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Al-Fātiĥah" })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Save bookmark" }).click();
  await expect(page.getByText("Sign in to save the personal features enabled on this deployment across devices.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  await page.getByRole("button", { name: "Continue reading as guest" }).click();
  await expect(page.getByText("Sign in to save the personal features enabled on this deployment across devices.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove bookmark" })).toHaveCount(0);
  const personalRecordCounts = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("muslim-ayat-offline-v1");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const counts = await Promise.all(["bookmarks", "notes", "progress", "outbox"].map((storeName) =>
      new Promise<number>((resolve, reject) => {
        const request = database.transaction(storeName).objectStore(storeName).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
    ));
    database.close();
    return counts;
  });
  expect(personalRecordCounts).toEqual([0, 0, 0, 0]);
  await page.goto("/surah/1");
  await expect(page.getByRole("heading", { name: "Al-Fātiĥah" })).toBeVisible();
  await expect(page.getByText("Bismil laahir Rahmaanir Raheem")).toBeVisible();
  await context.setOffline(false);
});

test("registers the service worker and precaches the public offline shell", async ({ page }) => {
  await page.goto("/");

  await page.waitForFunction(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const appRegistration = registrations.find((registration) =>
      registration.installing?.scriptURL.endsWith("/sw.js") ||
      registration.waiting?.scriptURL.endsWith("/sw.js") ||
      registration.active?.scriptURL.endsWith("/sw.js"),
    );
    if (!appRegistration) return false;

    const cache = await caches.open("muslim-ayat-public-v2");
    const requests = await cache.keys();
    return requests.some((request) => new URL(request.url).pathname === "/offline.html");
  });

  await page.waitForFunction(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.some((registration) => registration.active?.scriptURL.endsWith("/sw.js"));
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith("/sw.js"));

  await page.goto("/quran");
  const publicCachedPaths = await page.evaluate(async () => {
    const cache = await caches.open("muslim-ayat-public-v2");
    return (await cache.keys()).map((request) => new URL(request.url).pathname.replace(/\/$/u, ""));
  });
  expect(publicCachedPaths).toContain("/quran");
  expect(publicCachedPaths).toContain("/surah/1");
  await page.goto("/account");
  const cachedPaths = await page.evaluate(async () => {
    const cache = await caches.open("muslim-ayat-public-v2");
    return (await cache.keys()).map((request) => new URL(request.url).pathname.replace(/\/$/u, ""));
  });
  expect(cachedPaths).toContain("/quran");
  expect(cachedPaths).toContain("/surah/1");
  expect(cachedPaths).not.toContain("/account");
});