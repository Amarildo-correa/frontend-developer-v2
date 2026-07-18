// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  // Servido por HTTP (JSON Server) para que o sprite externo (`<use href>`) e os
  // recursos de src/ resolvam — o que não acontece sob file:// (origin null /
  // CORS). JSON Server também expõe a API mock de db.json (/posts, /comments).
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:5177/public/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
  },
  use: {
    baseURL: 'http://localhost:5177',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-tablet',
      use: { ...devices['Galaxy Tab S4'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'webkit-tablet',
      use: { ...devices['iPad (gen 11)'] },
    },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 16'] },
    },
  ],
});
