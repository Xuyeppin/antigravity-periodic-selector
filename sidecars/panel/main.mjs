import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { PeriodicRuntimeUi, buildInjectedSource } from '../../compat/runtime-ui.mjs';
import { checkForUpdate, applyUpdate, getInstalledVersion } from '../../compat/updater.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const PLUGIN_CONFIG = join(homedir(), '.gemini', 'config', 'config.json');

let elementsCjs = readFileSync(join(ROOT, 'compat', 'elements.cjs'), 'utf8');
let widgetCjs = readFileSync(join(ROOT, 'compat', 'periodic-widget.cjs'), 'utf8');
let panelHtml = readFileSync(join(HERE, 'index.html'), 'utf8');

function toElementsBrowserModule(src) {
  const prefix = 'module.exports = ';
  const idx = src.indexOf(prefix);
  return `window.__agPeriodicElementsFactory = (${src.slice(idx + prefix.length).trim().replace(/;$/, '')});`;
}

let elementsBrowserModule = toElementsBrowserModule(elementsCjs);

function isPluginEnabled() {
  try {
    const raw = readFileSync(PLUGIN_CONFIG, 'utf8').replace(/^\uFEFF/, '');
    const cfg = JSON.parse(raw);
    if (cfg?.plugins?.['antigravity-periodic-selector']?.enabled === false) return false;
  } catch {}
  return true;
}

async function performApplyUpdate({ force = false } = {}) {
  const result = await applyUpdate(ROOT, { force });
  if (result.ok && result.updated) {
    elementsCjs = result.elementsCjs;
    widgetCjs = result.widgetCjs;
    panelHtml = result.panelHtml;
    elementsBrowserModule = toElementsBrowserModule(elementsCjs);
    const nextSource = buildInjectedSource(elementsCjs, widgetCjs);
    // Hot-reload after a brief delay so the caller receives the reply first before dispose runs
    const notice = {
      version: result.version,
      tag: result.tag,
      sidecarChanged: Boolean(result.sidecarChanged),
    };
    setTimeout(() => {
      void runtime.updateSource(nextSource, notice);
    }, 120);
  }
  return {
    ok: result.ok,
    updated: Boolean(result.updated),
    alreadyLatest: Boolean(result.alreadyLatest),
    version: result.version || result.currentVersion,
    tag: result.tag || result.currentTag,
    latestVersion: result.latestVersion || result.version,
    latestTag: result.latestTag || result.tag,
    sidecarChanged: Boolean(result.sidecarChanged),
    error: result.error || null,
  };
}

async function handleHostAction(payload) {
  const action = String(payload?.action || '');
  if (action === 'check-update') {
    return await checkForUpdate(ROOT);
  }
  if (action === 'apply-update') {
    return await performApplyUpdate({ force: Boolean(payload?.force) });
  }
  return { ok: false, error: 'Unknown action' };
}

const runtime = new PeriodicRuntimeUi({
  source: buildInjectedSource(elementsCjs, widgetCjs),
  enabled: isPluginEnabled,
  onHostAction: handleHostAction,
});

const port = Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || process.env.AG_PERIODIC_PORT || 17892);

const server = createServer((req, res) => {
  const host = req.headers.host || `127.0.0.1:${port}`;
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) {
    res.writeHead(403);
    res.end();
    return;
  }
  const url = new URL(req.url || '/', `http://${host}`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      plugin: 'antigravity-periodic-selector',
      version: getInstalledVersion(ROOT),
      enabled: isPluginEnabled(),
      integration: runtime.health,
    }));
    return;
  }
  if (url.pathname === '/api/check-update') {
    void checkForUpdate(ROOT).then(data => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err?.message || 'Check failed' }));
    });
    return;
  }
  if (url.pathname === '/api/apply-update' && req.method === 'POST') {
    const origin = req.headers.origin;
    if (origin && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Forbidden origin' }));
      return;
    }
    if (req.headers['x-ag-periodic-action'] !== '1') {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Missing action header' }));
      return;
    }
    const force = url.searchParams.get('force') === '1';
    void performApplyUpdate({ force }).then(data => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err?.message || 'Update failed' }));
    });
    return;
  }
  if (url.pathname === '/elements.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(elementsBrowserModule);
    return;
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(panelHtml);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(port, '127.0.0.1', () => {
  if (!process.env.ANTIGRAVITY_SIDECAR_WEB_PORT) {
    console.log(`Periodic Model Selector preview: http://127.0.0.1:${port}`);
  }
});

runtime.start();

async function shutdown() {
  const timer = setTimeout(() => process.exit(0), 2000);
  timer.unref?.();
  await runtime.stop();
  server.close(() => process.exit(0));
}

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.once(sig, () => void shutdown());
}
