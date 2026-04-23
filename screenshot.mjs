import puppeteer from '/Users/tomlekkerkerker/Sites/he-tangata-contracting/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const screenshotsDir = join(__dirname, 'temporary screenshots');
if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });

const existing = readdirSync(screenshotsDir);
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const nextNum = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${nextNum}-${label}.png` : `screenshot-${nextNum}.png`;
const filepath = join(screenshotsDir, filename);

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Scroll to trigger intersection observers, then return to top
  await page.evaluate(async () => {
    const height = document.body.scrollHeight;
    for (let y = 0; y < height; y += 300) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 400));
  });

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved to ${filepath}`);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
