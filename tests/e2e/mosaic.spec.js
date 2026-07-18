import { test, expect } from "@playwright/test";

// Servido por HTTP (ver webServer no playwright.config.cjs) para que o sprite
// externo `<use href>` resolva — sob file:// os ícones ficam em branco.
const APP_URL = "/index.html";
const SHOTS = "test-results/screenshots";

test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => document.fonts.ready);
});

/** Coleta o estado geométrico da moldura .app e dos elementos-chave. */
async function readLayout(page) {
    return page.evaluate(() => {
        const app = document.getElementById("app");
        const appRect = app.getBoundingClientRect();
        const brand = document.querySelector(".brand");
        const menuBtn = document.querySelector(".header .btn");
        // --row é clamp()+vw: getComputedStyle devolve o texto literal, não o
        // px resolvido. Medimos o valor real a partir de um elemento que usa
        // var(--row) como largura direta (o botão de menu).
        const row = menuBtn.getBoundingClientRect().width;
        const avatar = document.querySelector(".avatar-md");
        const avatarCell = document.querySelector(".post-avatar");
        const postTime = document.querySelector(".post-time");
        const navBtns = [...document.querySelectorAll(".nav-btn")].map((el) => el.getBoundingClientRect());
        const title = document.querySelector(".post-title");
        const body = document.querySelector(".post-body");
        return {
            viewportWidth: window.innerWidth,
            appWidth: appRect.width,
            row,
            brand: brand.getBoundingClientRect(),
            menuBtn: menuBtn.getBoundingClientRect(),
            avatar: avatar.getBoundingClientRect(),
            avatarCell: avatarCell.getBoundingClientRect(),
            postTime: postTime.getBoundingClientRect(),
            navBtns: navBtns.map((r) => ({ width: r.width, height: r.height })),
            titleH: title.getBoundingClientRect().height,
            bodyH: body.getBoundingClientRect().height,
            docOverflow: document.documentElement.scrollWidth - window.innerWidth,
        };
    });
}

const isSquare = (r) => Math.abs(r.width - r.height) <= 1.5;

test("a moldura .app nunca ultrapassa --app-max-width (cartão centralizado, não full-bleed)", async ({ page }, testInfo) => {
    const l = await readLayout(page);
    expect(l.appWidth, `app mais largo que a viewport (${l.appWidth} > ${l.viewportWidth})`).toBeLessThanOrEqual(l.viewportWidth + 1);
    // 430px é o teto declarado em --app-max-width.
    expect(l.appWidth, "app ultrapassou --app-max-width (430px)").toBeLessThanOrEqual(430.5);
    console.log(`[${testInfo.project.name}] viewport=${l.viewportWidth} appWidth=${l.appWidth.toFixed(1)} row=${l.row.toFixed(2)}`);
});

test("as bordas verticais entre seções empilhadas ficam alinhadas, sem kink", async ({ page }) => {
    // .btn (header) e .post-time (post-header) ocupam a mesma coluna (6ª) do
    // ÚNICO grid de .app (ver styles.css: .header/.post-header/.bottom-nav
    // são display:contents, seus filhos são itens diretos desse grid) — a
    // borda vertical entre coluna 5 e 6 deve continuar reta ao descer de uma
    // linha para a outra, sem gap nem sobreposição. Como é o MESMO grid (uma
    // única distribuição de 1fr), a tolerância é 0, não uma aproximação.
    const rects = await page.evaluate(() => {
        const btn = document.querySelector(".header .btn").getBoundingClientRect();
        const postTime = document.querySelector(".post-time").getBoundingClientRect();
        return {
            btnLeft: btn.left,
            btnRight: btn.right,
            btnBottom: btn.bottom,
            postTimeLeft: postTime.left,
            postTimeRight: postTime.right,
            postTimeTop: postTime.top,
        };
    });
    expect(rects.btnLeft, "borda esquerda desalinhada entre header e post-header").toBe(rects.postTimeLeft);
    expect(rects.btnRight, "borda direita desalinhada entre header e post-header").toBe(rects.postTimeRight);
    expect(rects.btnBottom, "gap/sobreposição vertical entre header e post-header").toBe(rects.postTimeTop);
});

test("todo elemento de um único módulo (logo/menu/avatar/ícones do rodapé) é um quadrado", async ({ page }) => {
    const l = await readLayout(page);
    expect(isSquare(l.brand), `logo não é quadrado (${l.brand.width}x${l.brand.height})`).toBe(true);
    expect(isSquare(l.menuBtn), `menu não é quadrado (${l.menuBtn.width}x${l.menuBtn.height})`).toBe(true);
    expect(isSquare(l.avatar), `avatar não é quadrado (${l.avatar.width}x${l.avatar.height})`).toBe(true);
    expect(isSquare(l.postTime), `post-time não é quadrado (${l.postTime.width}x${l.postTime.height})`).toBe(true);
    expect(l.navBtns.length, "esperado 6 botões no rodapé").toBe(6);
    for (const [i, btn] of l.navBtns.entries()) {
        expect(isSquare(btn), `nav-btn[${i}] não é quadrado (${btn.width}x${btn.height})`).toBe(true);
    }
});

test("logo e botão de menu têm lado == --row (módulo do header)", async ({ page }) => {
    const l = await readLayout(page);
    expect(Math.abs(l.brand.width - l.row), "logo não bate com --row").toBeLessThanOrEqual(1.5);
    expect(Math.abs(l.menuBtn.width - l.row), "menu não bate com --row").toBeLessThanOrEqual(1.5);
});

test("as 6 células do rodapé têm a mesma largura entre si (módulos idênticos)", async ({ page }) => {
    const l = await readLayout(page);
    const widths = l.navBtns.map((b) => b.width);
    const min = Math.min(...widths);
    const max = Math.max(...widths);
    expect(max - min, "células do rodapé com larguras diferentes").toBeLessThanOrEqual(1);
});

test("módulos do rodapé têm o MESMO tamanho dos módulos do header/post-header", async ({ page }) => {
    // Reclamação original: nav-btn (bottom-nav) ficava maior que menuBtn/
    // avatar/post-time porque cada seção calculava seu próprio módulo com
    // uma fórmula diferente. Agora todas são a mesma coluna do mesmo grid.
    // Tolerância = 1/64px (0.015625): quando a largura do .app não é
    // divisível por 6, o 1fr distribui a sobra em quanta de 1/64px entre
    // colunas DIFERENTES — benigno e documentado no DESIGN.md (as bordas
    // continuam contíguas; isso é travado com tolerância 0 no teste de kink).
    const SUBPIXEL = 1 / 64 + 0.001;
    const l = await readLayout(page);
    const navBtnW = l.navBtns[0].width;
    expect(Math.abs(navBtnW - l.brand.width), `nav-btn (${navBtnW}) ≠ logo (${l.brand.width})`).toBeLessThanOrEqual(SUBPIXEL);
    expect(Math.abs(navBtnW - l.menuBtn.width), `nav-btn (${navBtnW}) ≠ menu (${l.menuBtn.width})`).toBeLessThanOrEqual(SUBPIXEL);
    expect(Math.abs(navBtnW - l.avatarCell.width), `nav-btn (${navBtnW}) ≠ célula do avatar (${l.avatarCell.width})`).toBeLessThanOrEqual(SUBPIXEL);
    expect(Math.abs(navBtnW - l.postTime.width), `nav-btn (${navBtnW}) ≠ post-time (${l.postTime.width})`).toBeLessThanOrEqual(SUBPIXEL);
});

test("não há scroll horizontal em nenhum viewport", async ({ page }) => {
    const l = await readLayout(page);
    expect(l.docOverflow, "scroll horizontal indevido").toBeLessThanOrEqual(1);
});

test("título e descrição têm altura mínima de 1 módulo (--row)", async ({ page }) => {
    const l = await readLayout(page);
    expect(l.titleH, "título menor que --row").toBeGreaterThanOrEqual(l.row - 1);
    expect(l.bodyH, "descrição menor que --row").toBeGreaterThanOrEqual(l.row - 1);
});

test("ícones do sprite renderizam (não ficam em branco)", async ({ page }) => {
    // <use href="…sprite.svg#id"> externo só resolve servido; sob file:// dá 0×0.
    const bboxes = await page.evaluate(() =>
        [...document.querySelectorAll("svg.icon")].map((s) => {
            try {
                const b = s.getBBox();
                return b.width * b.height;
            } catch {
                return 0;
            }
        })
    );
    expect(bboxes.length, "nenhum ícone encontrado").toBeGreaterThan(0);
    for (const area of bboxes) {
        expect(area, "ícone com bbox 0 (sprite não resolveu)").toBeGreaterThan(0);
    }
});

test("captura de tela do layout mosaico", async ({ page }, testInfo) => {
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-mosaic.png`, fullPage: true });
});
