// Zero-dependency GitHub release checker & atomic self-updater for Antigravity Periodic Model Selector.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { buildInjectedSource } from './runtime-ui.mjs';

export const GITHUB_REPO = 'Xuyeppin/antigravity-periodic-selector';
export const UPDATE_FILES = Object.freeze([
  'plugin.json',
  'assets/logo.svg',
  'compat/elements.cjs',
  'compat/periodic-widget.cjs',
  'compat/runtime-ui.mjs',
  'compat/updater.mjs',
  'sidecars/panel/sidecar.json',
  'sidecars/panel/main.mjs',
  'sidecars/panel/index.html',
]);

export function parseSemver(ver) {
  const clean = String(ver || '').trim().replace(/^v/i, '').split('-')[0];
  const parts = clean.split('.').map(n => Number.parseInt(n, 10));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
    Number.isFinite(parts[2]) ? parts[2] : 0,
  ];
}

export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  }
  return 0;
}

export function formatTag(ver) {
  const [maj, min, patch] = parseSemver(ver);
  return patch > 0 ? `v${maj}.${min}.${patch}` : `v${maj}.${min}`;
}

export function getInstalledVersion(rootDir) {
  try {
    const raw = readFileSync(join(rootDir, 'plugin.json'), 'utf8').replace(/^\uFEFF/, '');
    const pkg = JSON.parse(raw);
    return String(pkg.version || '1.0.0').trim();
  } catch {
    return '1.0.0';
  }
}

async function fetchText(url, { headers = {}, timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'antigravity-periodic-selector-updater',
        ...headers,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextWithRetry(url, opts, retries = 1) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchText(url, opts);
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise(r => setTimeout(r, 400));
    }
  }
  throw lastErr;
}

export async function checkForUpdate(rootDir) {
  const currentVersion = getInstalledVersion(rootDir);
  const currentTag = formatTag(currentVersion);
  const releaseFallbackUrl = `https://github.com/${GITHUB_REPO}/releases`;

  // 1. Primary: GitHub Releases API (latest published release)
  try {
    const raw = await fetchText(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      timeoutMs: 10000,
    });
    const rel = JSON.parse(raw);
    const tag = String(rel.tag_name || '').trim();
    if (tag) {
      const latestVersion = tag.replace(/^v/i, '');
      return {
        ok: true,
        source: 'release',
        currentVersion,
        currentTag,
        latestVersion,
        latestTag: tag.startsWith('v') ? tag : formatTag(latestVersion),
        ref: tag,
        hasUpdate: compareSemver(latestVersion, currentVersion) > 0,
        releaseUrl: rel.html_url || releaseFallbackUrl,
        checkedAt: new Date().toISOString(),
      };
    }
  } catch {
    // Fall through to raw plugin.json fallback (immune to GitHub API 60/hr rate limit)
  }

  // 2. Fallback: raw main/plugin.json
  try {
    const raw = await fetchText(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/plugin.json`, {
      timeoutMs: 10000,
    });
    const pkg = JSON.parse(raw.replace(/^\uFEFF/, ''));
    const latestVersion = String(pkg.version || '').trim();
    if (!latestVersion) throw new Error('Invalid remote plugin.json');
    return {
      ok: true,
      source: 'main',
      currentVersion,
      currentTag,
      latestVersion,
      latestTag: formatTag(latestVersion),
      ref: 'main',
      hasUpdate: compareSemver(latestVersion, currentVersion) > 0,
      releaseUrl: releaseFallbackUrl,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      currentVersion,
      currentTag,
      error: err?.name === 'AbortError' ? 'Timeout connecting to GitHub' : (err?.message || 'GitHub unreachable'),
      checkedAt: new Date().toISOString(),
    };
  }
}

let updateInFlight = null;

export function applyUpdate(rootDir, opts = {}) {
  if (updateInFlight) return updateInFlight;
  updateInFlight = runApplyUpdate(rootDir, opts).finally(() => {
    updateInFlight = null;
  });
  return updateInFlight;
}

async function runApplyUpdate(rootDir, { force = false } = {}) {
  const check = await checkForUpdate(rootDir);
  if (!check.ok) {
    return {
      ok: false,
      updated: false,
      currentVersion: check.currentVersion,
      currentTag: check.currentTag,
      error: check.error,
    };
  }

  if (!force && !check.hasUpdate) {
    return {
      ok: true,
      updated: false,
      alreadyLatest: true,
      currentVersion: check.currentVersion,
      currentTag: check.currentTag,
      latestVersion: check.latestVersion,
      latestTag: check.latestTag,
      releaseUrl: check.releaseUrl,
    };
  }

  const ref = force ? 'main' : (check.ref || 'main');
  const downloaded = new Map();

  // Download all allowlisted files in parallel before touching disk
  try {
    await Promise.all(UPDATE_FILES.map(async relPath => {
      const primaryUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${encodeURIComponent(ref)}/${relPath}`;
      try {
        const content = await fetchTextWithRetry(primaryUrl, { timeoutMs: 15000 }, 1);
        downloaded.set(relPath, content);
      } catch (err) {
        if (ref !== 'main' && err?.status === 404) {
          const fallbackUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${relPath}`;
          const content = await fetchTextWithRetry(fallbackUrl, { timeoutMs: 15000 }, 1);
          downloaded.set(relPath, content);
        } else {
          throw new Error(`${relPath}: ${err?.message || 'download failed'}`);
        }
      }
    }));
  } catch (err) {
    return {
      ok: false,
      updated: false,
      currentVersion: check.currentVersion,
      currentTag: check.currentTag,
      error: err?.message || 'Download failed',
    };
  }

  // Strict pre-write integrity & syntax validation
  let newPluginMeta;
  try {
    newPluginMeta = JSON.parse(downloaded.get('plugin.json').replace(/^\uFEFF/, ''));
    if (newPluginMeta.name !== 'antigravity-periodic-selector' || typeof newPluginMeta.version !== 'string') {
      throw new Error('Unexpected plugin.json manifest');
    }
    JSON.parse(downloaded.get('sidecars/panel/sidecar.json').replace(/^\uFEFF/, ''));
    const testBundle = buildInjectedSource(
      downloaded.get('compat/elements.cjs'),
      downloaded.get('compat/periodic-widget.cjs'),
    );
    // Validate syntax without executing
    new Function(testBundle);
  } catch (err) {
    return {
      ok: false,
      updated: false,
      currentVersion: check.currentVersion,
      currentTag: check.currentTag,
      error: 'Validation failed: ' + (err?.message || 'invalid bundle'),
    };
  }

  // Detect whether sidecar host code changed (needs Antigravity restart for host process, though UI hot-reloads immediately!)
  let sidecarChanged = false;
  try {
    const oldMain = await readFile(join(rootDir, 'sidecars/panel/main.mjs'), 'utf8');
    const oldRuntime = await readFile(join(rootDir, 'compat/runtime-ui.mjs'), 'utf8');
    sidecarChanged = oldMain !== downloaded.get('sidecars/panel/main.mjs')
      || oldRuntime !== downloaded.get('compat/runtime-ui.mjs');
  } catch {}

  // Write validated files inside rootDir (strictly confined to resolved rootDir)
  const resolvedRoot = resolve(rootDir);
  for (const relPath of UPDATE_FILES) {
    const dst = resolve(resolvedRoot, relPath);
    if (!dst.startsWith(resolvedRoot)) {
      return { ok: false, updated: false, error: 'Refused unsafe path' };
    }
    await mkdir(dirname(dst), { recursive: true });
    await writeFile(dst, downloaded.get(relPath), 'utf8');
  }

  const newVersion = String(newPluginMeta.version).trim();
  const newTag = formatTag(newVersion);

  return {
    ok: true,
    updated: true,
    previousVersion: check.currentVersion,
    version: newVersion,
    tag: newTag,
    sidecarChanged,
    elementsCjs: downloaded.get('compat/elements.cjs'),
    widgetCjs: downloaded.get('compat/periodic-widget.cjs'),
    panelHtml: downloaded.get('sidecars/panel/index.html'),
  };
}
