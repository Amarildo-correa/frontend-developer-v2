import { test, expect } from "@playwright/test";

// Servido por HTTP (ver webServer no playwright.config.cjs); baseURL cuida do host.
const APP_URL = "/public/index.html";
const SHOTS = "C:\\Users\\amari\\AppData\\Local\\Temp\\claude\\c--projetos-repositorys-root-frontend-developer\\5e6441ee-5262-4ad3-aff6-015c456b1562\\scratchpad";

test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
});

// Nenhuma página do app pode rolar horizontalmente (regra do design system).
async function expectNoHorizontalScroll(page) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "scroll horizontal indevido").toBeLessThanOrEqual(1);
}

test("carrega a página de entrada com o container #app", async ({ page }, testInfo) => {
    await expect(page).toHaveTitle("Frontend Developer");
    await expect(page.locator("#app")).toBeAttached();
    await expectNoHorizontalScroll(page);

    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-01-app.png`, fullPage: false });

    // TODO: à medida que views forem montadas em #app (ver scripts.js), adicionar
    // aqui asserções específicas — presença de elementos, navegação, estados.
});
