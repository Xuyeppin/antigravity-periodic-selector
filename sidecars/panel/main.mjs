import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { PeriodicRuntimeUi, buildInjectedSource } from '../../compat/runtime-ui.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const PLUGIN_CONFIG = join(homedir(), '.gemini', 'config', 'config.json');

const elementsCjs = readFileSync(join(ROOT, 'compat', 'elements.cjs'), 'utf8');
const widgetCjs = readFileSync(join(ROOT, 'compat', 'periodic-widget.cjs'), 'utf8');
const panelHtml = readFileSync(join(HERE, 'index.html'), 'utf8');

function isPluginEnabled() {
  try {
    const raw = readFileSync(PLUGIN_CONFIG, 'utf8').replace(/^\uFEFF/, '');
    const cfg = JSON.parse(raw);
    if (cfg?.plugins?.['antigravity-periodic-selector']?.enabled === false) return false;
  } catch {}
  return true;
}

const runtime = new PeriodicRuntimeUi({
  source: buildInjectedSource(elementsCjs, widgetCjs),
  enabled: isPluginEnabled,
});

const port = Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || process.env.AG_PERIODIC_PORT || 17892);
const elementsBrowserModule = (() => {
  const prefix = 'module.exports = ';
  const idx = elementsCjs.indexOf(prefix);
  return `window.__agPeriodicElementsFactory = (${elementsCjs.slice(idx + prefix.length).trim().replace(/;$/, '')});`;
})();

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
      version: '1.0.0',
      enabled: isPluginEnabled(),
      integration: runtime.health,
    }));
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
