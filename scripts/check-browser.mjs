import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
await mkdir('artifacts', { recursive: true });
let server;
let browser;

try {
  try {
    await fetch(baseUrl);
  } catch {
    server = spawn(
      process.execPath,
      ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
      { stdio: 'pipe', windowsHide: true },
    );
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        await fetch(baseUrl);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    if (process.platform !== 'win32') throw error;
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  if (process.argv.includes('--references')) {
    for (const [name, url] of [
      ['pterodactyl', 'https://pterodactyl.io'],
      ['euphoria', 'https://euphoriadevelopment.uk'],
    ]) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1800);
        await page.screenshot({ path: `artifacts/reference-${name}.png`, fullPage: true });
        console.log(
          JSON.stringify({
            reference: name,
            title: await page.title(),
            headings: await page.locator('h1').allTextContents(),
          }),
        );
      } catch (error) {
        console.log(`Reference ${name}: ${error.message}`);
      }
    }
  }

  await page.goto(baseUrl);
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByRole('heading', { name: 'Aquadactyl', exact: true, level: 1 }),
  ).toBeVisible();
  await page.locator('.addons-grid').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator('img')
        .evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)),
    )
    .toBe(true);
  await page.locator('.addon-image').evaluateAll(async (images) => {
    await Promise.all(images.map((image) => image.decode()));
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/desktop-home.png', fullPage: true });
  await page.screenshot({ path: 'artifacts/desktop-first-fold.png' });

  await page.getByLabel('Demo console command').fill('list');
  await page.getByRole('button', { name: 'Send demo command' }).click();
  await expect(page.getByLabel('Demo server output')).toContainText('players online: Rep');
  await page.getByLabel('Demo console command').fill('say Hello Aquadactyl');
  await page.getByRole('button', { name: 'Send demo command' }).click();
  await expect(page.getByLabel('Demo server output')).toContainText('[Server]: Hello Aquadactyl');
  await page.getByRole('button', { name: 'Stop demo server' }).click();
  await expect(page.locator('.server-status')).toHaveText('Offline');
  await expect(page.getByLabel('Demo console command')).toBeDisabled();
  await page.getByRole('button', { name: 'Start demo server', exact: true }).click();
  await expect(page.locator('.server-status')).toHaveText('Running', { timeout: 5000 });
  await page.getByRole('button', { name: 'Restart demo server' }).click();
  await page.getByRole('button', { name: 'Stop demo server' }).click();
  await page.waitForTimeout(1600);
  await expect(page.locator('.server-status')).toHaveText('Offline');
  await page.getByRole('button', { name: 'Start demo server', exact: true }).click();
  await expect(page.locator('.server-status')).toHaveText('Running', { timeout: 5000 });

  await page.getByRole('tab', { name: 'Files', exact: true }).click();
  await page.getByRole('button', { name: 'plugins Directory' }).click();
  await expect(page.locator('.file-path')).toContainText('/plugins');
  await page.locator('.file-path').click();
  await page.getByRole('button', { name: 'server.properties 1.2 KiB' }).click();
  await expect(page.locator('.demo-file-content')).toContainText('server-port=25565');
  await page.getByRole('tab', { name: 'Backups', exact: true }).click();
  await page.getByRole('button', { name: 'Create backup' }).click();
  await expect(page.locator('.backup-row')).toHaveCount(2, { timeout: 5000 });
  await page.getByRole('tab', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Server name', { exact: true }).fill('euphoria-community');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'euphoria-community' })).toBeVisible();
  await page.getByRole('tab', { name: 'Console', exact: true }).click();
  await page.getByRole('tab', { name: 'Console', exact: true }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Files', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('tab', { name: 'Console', exact: true }).click();

  await page.getByRole('tab', { name: 'Update', exact: true }).click();
  await expect(page.locator('.installation-code')).toContainText('EuphoriaTheme/aquadactyl');
  await page.getByRole('button', { name: 'Copy update your panel commands' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(copied.includes('scripts/panel-update.sh vRELEASE_TAG EuphoriaTheme/aquadactyl'));
  await page.getByRole('tab', { name: 'Extensions', exact: true }).click();
  await expect(page.locator('.installation-code')).toContainText('sudo blueprint -i myextension');
  await expect(page.getByRole('button', { name: 'Copy install an extension commands' })).toHaveText(
    'Copy',
  );
  await page.getByRole('tab', { name: 'Install', exact: true }).click();
  await page.getByRole('tab', { name: 'Install', exact: true }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Update', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('tab', { name: 'Install', exact: true }).click();
  await page.getByText('Do I need to install Blueprint separately?', { exact: true }).click();
  await expect(page.locator('details[open]')).toContainText('beta-2026-08');

  const accessibility = [];
  for (const [route, heading] of [
    ['/', 'Aquadactyl'],
    ['/docs', 'Install Aquadactyl'],
    ['/docs/updating', 'Update your panel'],
    ['/docs/blueprint', 'Blueprint integration'],
  ]) {
    await page.goto(`${baseUrl}${route}`);
    await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    accessibility.push({
      route,
      violations: results.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        description: item.description,
        nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    });
  }
  await page.goto(`${baseUrl}/docs`);
  await page.screenshot({ path: 'artifacts/desktop-docs.png', fullPage: true });

  const layouts = [];
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/docs', '/docs/updating', '/docs/blueprint']) {
      await page.goto(`${baseUrl}${route}`);
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      layouts.push({ route, ...dimensions });
      assert.ok(
        dimensions.scrollWidth <= width + 1,
        `Horizontal overflow on ${route} at ${width}px: ${dimensions.scrollWidth}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'Documentation' })
    .click();
  await expect(page.getByRole('heading', { name: 'Install Aquadactyl', level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
  await page.screenshot({ path: 'artifacts/mobile-docs.png', fullPage: true });
  await page.goto(baseUrl);
  await page.screenshot({ path: 'artifacts/mobile-home.png', fullPage: true });
  await page.screenshot({ path: 'artifacts/mobile-first-fold.png' });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  const mobileAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  accessibility.push({
    route: '/ (mobile)',
    violations: mobileAccessibility.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      description: item.description,
      nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
  });
  await page.goto(`${baseUrl}/missing-page`);
  await expect(page.getByRole('heading', { name: 'This page isn’t here.' })).toBeVisible();

  const violations = accessibility.flatMap((item) =>
    item.violations.map((violation) => ({ route: item.route, ...violation })),
  );
  await writeFile(
    'artifacts/browser-results.json',
    JSON.stringify({ errors, layouts, accessibility }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        runtimeErrors: errors,
        accessibilityViolations: violations,
        responsiveChecks: layouts.length,
        screenshots: 'artifacts/',
      },
      null,
      2,
    ),
  );
  assert.equal(errors.length, 0, 'Browser runtime errors');
  assert.equal(violations.length, 0, 'Accessibility violations');
  console.log(
    'Browser checks passed: interactive demo, documentation, clipboard, responsive layouts, mobile navigation, and accessibility.',
  );
} finally {
  await browser?.close();
  server?.kill();
}
