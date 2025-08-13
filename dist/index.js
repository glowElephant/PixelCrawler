/* global document, window */
const fs = require('fs/promises');
const path = require('path');
const { URL } = require('url');
const pLimit = require('p-limit').default;
const puppeteer = require('puppeteer');

function log(level, module, msg) {
  const time = new Date().toISOString();
  console[level === 'error' ? 'error' : 'log'](`${time} [${level.toUpperCase()}] [${module}] ${msg}`);
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function slugFromUrl(u, sanitizeNames = true) {
  const url = new URL(u);
  const host = sanitizeNames ? sanitize(url.hostname) : url.hostname;
  const rawPath = url.pathname === '/' ? 'root' : url.pathname.replace(/\//g, '_');
  const pathSlug = sanitizeNames ? sanitize(rawPath) : rawPath;
  const fileRaw = url.pathname === '/' ? 'index' : url.pathname.split('/').filter(Boolean).join('_');
  const fileSlug = sanitizeNames ? sanitize(fileRaw) : fileRaw;
  return { dir: `${host}__${pathSlug}`, file: fileSlug };
}

async function autoScroll(page, step, interval) {
  await page.evaluate(async ({ step, interval }) => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const timer = setInterval(() => {
        const { scrollHeight } = document.body;
        window.scrollBy(0, step);
        totalHeight += step;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });
  }, { step, interval });
}

async function processUrl(browser, url, opts) {
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await page.setViewport({ width: opts.viewportWidth, height: opts.viewportHeight });
  if (opts.userAgent) await page.setUserAgent(opts.userAgent);
  if (opts.lang) await page.setExtraHTTPHeaders({ 'Accept-Language': opts.lang });

  if (opts.cookiesPath) {
    try {
      const cookies = JSON.parse(await fs.readFile(opts.cookiesPath, 'utf8'));
      await page.setCookie(...cookies);
    } catch (e) {
      log('warn', 'cookie', `쿠키 로드 실패: ${e.message}`);
    }
  }

  const { dir, file } = slugFromUrl(url, opts.sanitizeFileNames);
  const outDir = path.join(opts.outDir, dir);
  await fs.mkdir(outDir, { recursive: true });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: opts.timeout });
    await autoScroll(page, opts.scrollStep, opts.scrollInterval);
    if (opts.waitAfterLoad) await page.waitForTimeout(opts.waitAfterLoad);

    if (opts.mhtml) {
      const { data } = await client.send('Page.captureSnapshot', { format: 'mhtml' });
      await fs.writeFile(path.join(outDir, `${file}.mhtml`), data);
    }
    if (opts.png) {
      await page.screenshot({ path: path.join(outDir, `${file}.png`), fullPage: true });
    }
    if (opts.pdf) {
      await page.emulateMediaType('screen');
      await page.pdf({
        path: path.join(outDir, `${file}.pdf`),
        format: opts.pdfFormat,
        margin: { top: opts.pdfMargin, bottom: opts.pdfMargin, left: opts.pdfMargin, right: opts.pdfMargin },
        printBackground: true
      });
    }
    log('info', 'snapshot', `완료: ${url}`);
    return { url, success: true };
  } catch (e) {
    log('error', 'snapshot', `실패: ${url} - ${e.message}`);
    return { url, success: false, error: e };
  } finally {
    await page.close();
  }
}

async function snapshot(urls, options) {
  const outDir = options.out || `snapshot-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}`;
  const opts = {
    outDir,
    mhtml: options.mhtml !== false,
    png: options.png !== false,
    pdf: options.pdf !== false,
    viewportWidth: parseInt(options.viewport.split('x')[0], 10),
    viewportHeight: parseInt(options.viewport.split('x')[1], 10),
    userAgent: options.userAgent,
    lang: options.lang,
    timeout: parseInt(options.timeout, 10),
    waitAfterLoad: parseInt(options.waitAfterLoad, 10),
    scrollStep: parseInt(options.scrollStep, 10),
    scrollInterval: parseInt(options.scrollInterval, 10),
    pdfFormat: options.pdfFormat,
    pdfMargin: options.pdfMargin,
    cookiesPath: options.cookies,
    sanitizeFileNames: options.sanitizeFileNames !== 'false'
  };

  await fs.mkdir(outDir, { recursive: true });
  log('info', 'setup', `출력 디렉터리: ${outDir}`);

  const browser = await puppeteer.launch({ headless: 'new', args: options.proxy ? [`--proxy-server=${options.proxy}`] : [] });
  const limit = pLimit(parseInt(options.concurrency, 10));
  const results = await Promise.all(urls.map(url => limit(() => processUrl(browser, url, opts))));
  await browser.close();

  const successes = results.filter(r => r.success).length;
  if (successes === urls.length) return 0;
  if (successes === 0) return 1;
  return 2;
}

module.exports = { snapshot };
