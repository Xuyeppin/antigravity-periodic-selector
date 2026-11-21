// Zero-dependency loopback CDP runtime injector for Antigravity Periodic Model Selector.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);

export function defaultProfileDir() {
  if (process.env.AG_PERIODIC_PROFILE) return process.env.AG_PERIODIC_PROFILE;
  if (process.platform === 'win32') {
    return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'Antigravity');
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Antigravity');
  }
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'Antigravity');
}

export function defaultDataDir() {
  if (process.platform === 'win32') {
    return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'AntigravityPeriodicSelector');
  }
  return join(homedir(), '.local', 'share', 'antigravity-periodic-selector');
}

function validTarget(target, port) {
  try {
    const page = new URL(target.url);
    const ws = new URL(target.webSocketDebuggerUrl);
    return target.type === 'page'
      && ['http:', 'https:'].includes(page.protocol)
      && LOOPBACK.has(page.hostname)
      && ws.protocol === 'ws:'
      && LOOPBACK.has(ws.hostname)
      && Number(ws.port) === port;
  } catch {
    return false;
  }
}

function jsonGet(port, path) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method: 'GET' }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        body += chunk;
        if (body.length > 1048576) req.destroy(new Error('Discovery response too large'));
      });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) throw new Error('Renderer discovery unavailable');
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(2000, () => req.destroy(new Error('Renderer discovery timeout')));
    req.end();
  });
}

export async function discoverTargets(profile = defaultProfileDir()) {
  const text = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
  if (text.length > 1024) throw new Error('Invalid DevToolsActivePort file');
  const port = Number(text.split(/\r?\n/)[0]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid renderer port');
  const targets = await jsonGet(port, '/json/list');
  if (!Array.isArray(targets)) throw new Error('Invalid renderer target list');
  return targets.filter(target => validTarget(target, port));
}

class CdpConnection {
  constructor(url, { timeout = 5000, onClose = () => {}, onEvent = () => {} } = {}) {
    this.url = url;
    this.timeout = timeout;
    this.onClose = onClose;
    this.onEvent = onEvent;
    this.pending = new Map();
    this.nextId = 0;
    this.closed = false;
  }
  async open() {
    if (!globalThis.WebSocket) throw new Error('Node runtime has no built-in WebSocket');
    this.ws = new globalThis.WebSocket(this.url);
    this.ws.addEventListener('message', event => {
      try {
        if (typeof event.data !== 'string' || event.data.length > 2097152) return;
        const msg = JSON.parse(event.data);
        if (msg.id) {
          const item = this.pending.get(msg.id);
          if (!item) return;
          this.pending.delete(msg.id);
          clearTimeout(item.timer);
          if (msg.error) item.reject(new Error('CDP error: ' + msg.error.code));
          else item.resolve(msg.result || {});
        } else if (msg.method) {
          this.onEvent(msg.method, msg.params || {});
        }
      } catch {}
    });
    this.ws.addEventListener('close', () => this.disconnect());
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.close(); reject(new Error('CDP connect timeout')); }, this.timeout);
      this.ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.ws.addEventListener('error', () => { clearTimeout(timer); this.close(); reject(new Error('CDP connect failed')); }, { once: true });
    });
    return this;
  }
  command(method, params = {}) {
    if (this.closed || this.ws?.readyState !== 1) return Promise.reject(new Error('CDP disconnected'));
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout')); }, this.timeout);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(err);
      }
    });
  }
  disconnect() {
    if (this.closed) return;
    this.closed = true;
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error('CDP disconnected'));
    }
    this.pending.clear();
    this.onClose();
  }
  close() {
    this.disconnect();
    try { this.ws?.close(); } catch {}
  }
}

export function buildInjectedSource(elementsCjs, widgetCjs) {
  const extract = src => {
    const prefix = 'module.exports = ';
    const idx = src.indexOf(prefix);
    if (idx < 0) throw new Error('Unexpected module format');
    return src.slice(idx + prefix.length).trim().replace(/;$/, '');
  };
  const version = createHash('sha256').update(elementsCjs + widgetCjs).digest('hex');
  return `
    (function(){
      if (window !== window.top) return;
      if (window.__agPeriodicVersion !== ${JSON.stringify(version)}) {
        try { window.__agPeriodicDispose?.(); } catch {}
        window.__agPeriodicVersion = ${JSON.stringify(version)};
        window.__agPeriodicElementsFactory = (${extract(elementsCjs)});
      }
      if (!window.__agPeriodicElementsFactory) {
        window.__agPeriodicElementsFactory = (${extract(elementsCjs)});
      }
      (${extract(widgetCjs)})();
    })();
  `;
}

export class PeriodicRuntimeUi {
  constructor({ source, profile = defaultProfileDir(), dataDir = defaultDataDir(), enabled = () => true, interval = 3000, onHostAction = null }) {
    this.source = source;
    this.profile = profile;
    this.dataDir = dataDir;
    this.enabled = enabled;
    this.interval = interval;
    this.onHostAction = onHostAction;
    this.sessions = new Map();
    this.running = false;
    this.busy = false;
    this.stopping = false;
    this.health = { state: 'waiting', message: 'Waiting for Antigravity renderer', windows: 0, checkedAt: new Date().toISOString() };
  }

  async setHealth(state, message) {
    this.health = {
      state,
      message,
      windows: this.sessions.size,
      ...(this.lastMenuSchema ? { menuSchema: this.lastMenuSchema } : {}),
      checkedAt: new Date().toISOString(),
    };
    try {
      await mkdir(this.dataDir, { recursive: true });
      await writeFile(join(this.dataDir, 'integration-state.json'), JSON.stringify(this.health, null, 2));
    } catch {}
  }

  async attach(target) {
    const conn = new CdpConnection(target.webSocketDebuggerUrl, {
      onEvent: (method, params) => {
        if (method !== 'Runtime.bindingCalled' || params.name !== '__agPeriodicHostAction' || !this.onHostAction) return;
        void (async () => {
          let reqPayload = null;
          try { reqPayload = JSON.parse(params.payload || '{}'); } catch { return; }
          let reply;
          try {
            reply = await this.onHostAction(reqPayload, conn);
          } catch (err) {
            reply = { ok: false, error: err?.message || 'Host action failed' };
          }
          const envelope = { id: reqPayload?.id, ...(reply && typeof reply === 'object' ? reply : { ok: true }) };
          try {
            if (!conn.closed) {
              await conn.command('Runtime.evaluate', {
                expression: `window.__agPeriodicHostReply?.(${JSON.stringify(envelope)})`,
              });
            }
          } catch {}
        })();
      },
    });
    conn.origin = new URL(target.url).origin;
    try {
      await conn.open();
      await conn.command('Page.enable');
      if (this.onHostAction) {
        await conn.command('Runtime.enable');
        await conn.command('Runtime.addBinding', { name: '__agPeriodicHostAction' });
      }
      const guarded = `if (location.origin === ${JSON.stringify(conn.origin)}) { ${this.source} }`;
      conn.scriptId = (await conn.command('Page.addScriptToEvaluateOnNewDocument', { source: guarded })).identifier;
      const res = await conn.command('Runtime.evaluate', { expression: guarded });
      if (res.exceptionDetails) throw new Error('Widget init error');
      return conn;
    } catch (err) {
      try { if (conn.scriptId) await conn.command('Page.removeScriptToEvaluateOnNewDocument', { identifier: conn.scriptId }); } catch {}
      conn.close();
      throw err;
    }
  }

  async updateSource(newSource, postUpdateNotice = null) {
    this.source = newSource;
    for (const conn of this.sessions.values()) {
      if (conn.closed) continue;
      try {
        if (conn.scriptId) {
          await conn.command('Page.removeScriptToEvaluateOnNewDocument', { identifier: conn.scriptId }).catch(() => {});
        }
        const guarded = `if (location.origin === ${JSON.stringify(conn.origin)}) { ${this.source} }`;
        conn.scriptId = (await conn.command('Page.addScriptToEvaluateOnNewDocument', { source: guarded })).identifier;
        const preamble = postUpdateNotice
          ? `window.__agPeriodicPostUpdate = ${JSON.stringify(postUpdateNotice)};\n`
          : '';
        await conn.command('Runtime.evaluate', { expression: `${preamble}${guarded}` });
      } catch {}
    }
  }

  async detach(conn) {
    try { if (conn.scriptId) await conn.command('Page.removeScriptToEvaluateOnNewDocument', { identifier: conn.scriptId }); } catch {}
    try { await conn.command('Runtime.evaluate', { expression: 'window.__agPeriodicDispose?.()' }); } catch {}
    conn.close();
  }

  async detachAll() {
    for (const conn of this.sessions.values()) await this.detach(conn);
    this.sessions.clear();
  }

  async tick() {
    if (this.busy || this.stopping) return;
    this.busy = true;
    try {
      if (!this.enabled()) {
        await this.detachAll();
        await this.setHealth('disabled', 'Periodic Model Selector is disabled');
        return;
      }
      const targets = await discoverTargets(this.profile);
      const active = new Set(targets.map(t => t.webSocketDebuggerUrl));
      for (const [url, conn] of this.sessions) {
        if (!active.has(url) || conn.closed) {
          await this.detach(conn);
          this.sessions.delete(url);
        }
      }
      for (const target of targets) {
        if (!this.sessions.has(target.webSocketDebuggerUrl)) {
          this.sessions.set(target.webSocketDebuggerUrl, await this.attach(target));
        }
      }
      if (this.sessions.size > 0) {
        let menuSchema = null;
        for (const conn of this.sessions.values()) {
          try {
            const ev = await conn.command('Runtime.evaluate', {
              expression: 'window.__agPeriodicSchema ? JSON.stringify(window.__agPeriodicSchema) : null',
              returnByValue: true,
            });
            if (typeof ev?.result?.value === 'string') {
              menuSchema = JSON.parse(ev.result.value);
              break;
            }
          } catch {}
        }
        this.lastMenuSchema = menuSchema;
        await this.setHealth('mounted', 'Periodic Model Selector attached to Antigravity composer');
      } else {
        await this.setHealth('waiting', 'No active Antigravity page target found');
      }
    } catch (err) {
      if (err?.code === 'ENOENT') {
        await this.setHealth('reconnecting', 'Antigravity 2.33+ requires --remote-debugging-port=0 --remote-debugging-address=127.0.0.1');
      } else {
        await this.setHealth('reconnecting', err?.message || 'Reconnecting to Antigravity renderer');
      }
    } finally {
      this.busy = false;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.stopping = false;
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.interval);
    this.timer.unref?.();
  }

  async stop() {
    this.stopping = true;
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    await this.detachAll();
  }
}
