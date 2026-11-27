// Self-contained main-world UI for Antigravity Periodic Model Selector (v1.4).
// - Periodic Basin HUD in the natural valley (cols 4-11, rows 1-2) for instant side-by-side comparison
// - Scientific atomic mass & electron configuration badges in the Element Spotlight plaque
// - Integrated 2-tier Spotlight + Gliding Circular White Thumb Slider:
//   - Element-matched colors with seamless flowing gradient at the highest effort tier
//   - Smooth spring expand/collapse from the model selector button, dark/light toggle, keyboard ← → nudge
//   - Zero-flicker in-place DOM updates & stays open until clicking outside
module.exports = function installAgPeriodicSelector() {
  if (window.__agPeriodicInstalled) return;
  if (!document.documentElement) {
    document.addEventListener('DOMContentLoaded', installAgPeriodicSelector, { once: true });
    return;
  }
  if (!window.__agPeriodicElementsFactory) return;

  window.__agPeriodicInstalled = true;
  const E = window.__agPeriodicElementsFactory();

  const HOST_ID = 'ag-periodic-selector-host';
  const HIDE_STYLE_ID = 'ag-periodic-hide-native-menus';
  const WIDGET_VERSION = 'v1.4';
  const GITHUB_RELEASES_URL = 'https://github.com/Xuyeppin/antigravity-periodic-selector/releases/latest';

  const CATEGORY_TINT = {
    nonmetal:   '#60A5FA',
    noble:      '#A78BFA',
    alkali:     '#F87171',
    alkaline:   '#FBBF24',
    metalloid:  '#2DD4BF',
    halogen:    '#38BDF8',
    transition: '#94A3B8',
    post:       '#34D399',
    lanthanide: '#F472B6',
    actinide:   '#FB7185',
  };

  // Scientific atomic mass & electron shell configuration for key & common elements
  const ATOMIC_SCIENCE = {
    1:  { mass: '1.008',  shell: '1s¹',             shells: '1' },
    2:  { mass: '4.003',  shell: '1s²',             shells: '2' },
    6:  { mass: '12.011', shell: '[He] 2s² 2p²',    shells: '2·4' },
    7:  { mass: '14.007', shell: '[He] 2s² 2p³',    shells: '2·5' },
    8:  { mass: '15.999', shell: '[He] 2s² 2p⁴',    shells: '2·6' },
    10: { mass: '20.180', shell: '[He] 2s² 2p⁶',    shells: '2·8' },
    14: { mass: '28.085', shell: '[Ne] 3s² 3p²',    shells: '2·8·4' },
    18: { mass: '39.948', shell: '[Ne] 3s² 3p⁶',    shells: '2·8·8' },
    26: { mass: '55.845', shell: '[Ar] 3d⁶ 4s²',    shells: '2·8·14·2' },
    36: { mass: '83.798', shell: '[Ar] 3d¹⁰ 4s² 4p⁶', shells: '2·8·18·8' },
    54: { mass: '131.29', shell: '[Kr] 4d¹⁰ 5s² 5p⁶', shells: '2·8·18·18·8' },
  };

  // Blue for below-High effort tiers; Blue-Purple gradient for High and above!
  const EFFORT_PALETTE = {
    none: {
      color: '#64748B', bg: '#64748B', glow: 'rgba(100, 116, 139, 0.28)',
      zh: '关闭', en: 'Off',
      zhHint: '直接输出，不进行额外思维链推演', enHint: 'Direct response without extended thinking',
    },
    minimal: {
      color: '#4F7DF3', bg: '#4F7DF3', glow: 'rgba(79, 125, 243, 0.35)',
      zh: '极简', en: 'Min',
      zhHint: '超低延迟，适合简单指令与快速补全', enHint: 'Ultra-low latency for quick completions',
    },
    low: {
      color: '#4F7DF3', bg: '#4F7DF3', glow: 'rgba(79, 125, 243, 0.38)',
      zh: '低', en: 'Low',
      zhHint: '轻快响应，适合日常问答与快速代码修改', enHint: 'Fast response for everyday Q&A and edits',
    },
    medium: {
      color: '#4F7DF3', bg: '#4F7DF3', glow: 'rgba(79, 125, 243, 0.42)',
      zh: '中', en: 'Med',
      zhHint: '均衡推理深度与生成速度，推荐日常主力使用', enHint: 'Balanced reasoning depth and velocity',
    },
    high: {
      color: '#6D5DFB',
      bg: 'linear-gradient(90deg, #4F7DF3 0%, #7C4DFF 100%)',
      glow: 'rgba(124, 77, 255, 0.45)',
      zh: '高', en: 'High',
      zhHint: '深度多步推演，适合复杂编码、调试与逻辑分析', enHint: 'Deep multi-step reasoning for complex coding',
    },
    xhigh: {
      color: '#8B5CF6',
      bg: 'linear-gradient(90deg, #4F7DF3 0%, #7C3AED 52%, #A855F7 100%)',
      glow: 'rgba(139, 92, 246, 0.50)',
      zh: '极高', en: 'XHigh',
      zhHint: '高强度长程思考，适合跨文件重构与架构设计', enHint: 'Intensive long-horizon reasoning & architecture',
    },
    extra: {
      color: '#8B5CF6',
      bg: 'linear-gradient(90deg, #4F7DF3 0%, #7C3AED 52%, #A855F7 100%)',
      glow: 'rgba(139, 92, 246, 0.50)',
      zh: '极高', en: 'Extra',
      zhHint: '高强度长程思考，适合跨文件重构与架构设计', enHint: 'Intensive long-horizon reasoning & architecture',
    },
    max: {
      color: '#9333EA',
      bg: 'linear-gradient(90deg, #4F7DF3 0%, #7C3AED 45%, #C026D3 100%)',
      glow: 'rgba(147, 51, 234, 0.54)',
      zh: '最高', en: 'Max',
      zhHint: '最大思考预算，面向高难度算法与科研级推演', enHint: 'Maximum thinking budget for frontier problems',
    },
  };
  const FALLBACK_COLORS = ['#4F7DF3', '#4F7DF3', '#7C4DFF', '#8B5CF6', '#9333EA'];

  const localGet = (k, fallback) => {
    try { const v = localStorage.getItem(k); return v === null ? fallback : v; } catch { return fallback; }
  };
  const localSet = (k, v) => {
    try { localStorage.setItem(k, String(v)); } catch {}
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function loadEffortMap() {
    try {
      const raw = localGet('ag-periodic-effort-map', '');
      if (!raw) return new Map();
      const obj = JSON.parse(raw);
      return new Map(Object.entries(obj || {}));
    } catch {
      return new Map();
    }
  }

  function saveEffortMap(map) {
    try {
      const obj = {};
      for (const [k, v] of map.entries()) {
        if (k && v) obj[k] = v;
      }
      localSet('ag-periodic-effort-map', JSON.stringify(obj));
    } catch {}
  }

  let state = {
    open: false,
    closing: false,
    closeTimer: null,
    busy: false,
    lang: localGet('ag-periodic-lang', 'zh'),
    themeMode: localGet('ag-periodic-theme', 'auto'), // 'auto' | 'light' | 'dark'
    fullTable: localGet('ag-periodic-full', '0') === '1',
    models: [],
    effortsByBase: new Map(),
    lastEffortByBase: loadEffortMap(),
    selectedElementNum: null,
    hoveredElementNum: null,
    activeTrigger: null,
    currentLabel: '',
    bypassUntil: 0,
    selectionSeq: 0,
    openSessionId: 0,
    applyDebounceTimer: null,
    pendingDebounceJob: null,
    pendingApply: null,
    optimisticEffort: null,
    nativeOpTail: Promise.resolve(),
  };

  function normBaseKey(modelBase) {
    return E.cleanLabel(modelBase || '').toLowerCase();
  }

  function rememberModelEffort(modelBase, effortKey, elementNum = null) {
    if (!effortKey) return;
    const parsedEl = elementNum || E.parseModelInfo(modelBase || '').element?.number || null;
    const k1 = normBaseKey(modelBase);
    if (k1) state.lastEffortByBase.set(k1, effortKey);
    if (parsedEl) state.lastEffortByBase.set(`el:${parsedEl}`, effortKey);
    saveEffortMap(state.lastEffortByBase);

    if (modelBase && state.effortsByBase.has(modelBase)) {
      const prev = state.effortsByBase.get(modelBase) || [];
      if (prev.some(o => o.key === effortKey)) {
        state.effortsByBase.set(modelBase, prev.map(o => ({ ...o, checked: o.key === effortKey })));
      }
    }
    for (const m of state.models) {
      if ((k1 && m.modelBase.toLowerCase() === k1) || (parsedEl && m.element?.number === parsedEl)) {
        m.effort = effortKey;
      }
    }
  }

  function getRememberedEffort(modelBase, elementNum = null) {
    const parsedEl = elementNum || E.parseModelInfo(modelBase || '').element?.number || null;
    if (parsedEl && state.lastEffortByBase.has(`el:${parsedEl}`)) {
      return state.lastEffortByBase.get(`el:${parsedEl}`);
    }
    const k1 = normBaseKey(modelBase);
    if (k1 && state.lastEffortByBase.has(k1)) {
      return state.lastEffortByBase.get(k1);
    }
    return null;
  }

  function rememberEffortFromLabel(label) {
    if (!label) return;
    const info = E.parseModelInfo(label);
    if (!info.effort) return;
    if (info.element) {
      const matched = state.models.find(m => m.element?.number === info.element.number);
      rememberModelEffort(matched ? matched.modelBase : '', info.effort, info.element.number);
    } else if (info.isGoogle) {
      const matched = state.models.find(m => label.toLowerCase().startsWith(m.modelBase.toLowerCase()));
      if (matched) rememberModelEffort(matched.modelBase, info.effort, null);
    }
  }

  function isUserSelectionPending() {
    return Boolean(state.applyDebounceTimer || state.pendingApply || state.busy);
  }

  function cancelPendingDebounce() {
    if (state.applyDebounceTimer) {
      clearTimeout(state.applyDebounceTimer);
      state.applyDebounceTimer = null;
    }
    state.pendingDebounceJob = null;
  }

  function serializeNativeOp(fn) {
    const run = state.nativeOpTail.then(fn, fn);
    state.nativeOpTail = run.then(() => undefined, () => undefined);
    return run;
  }

  const I18N = {
    zh: {
      title: 'Gemini 元素周期表',
      subtitle: '点击元素切换模型 · 下方滑钮或 ← → 方向键调节思考程度',
      compact: '4 周期',
      full: '全表 118',
      themeDark: '🌙 深色',
      themeLight: '☀️ 浅色',
      nativeList: '原生列表 ↗',
      basinTitle: 'GEMINI 4 元素矩阵',
      otherGoogle: '其他 Gemini / 编排模型',
      otherNonGoogle: '其他模型 (切换后恢复原生列表)',
      effortTitle: '思考程度',
      currentBadge: '当前使用',
      availableBadge: '可用',
      disabledBadge: '当前不可用',
      unavailableBadge: '暂未上线',
      noModels: '未识别到元素模型，点击右上角「原生列表」查看完整菜单。',
      tip: '点击外部空白处或按 Esc 关闭 · ← → 键可微调思考程度',
      updateIdle: '↻ 一键更新',
      updateChecking: '↻ 检查中...',
      updateUpdating: '↻ 更新中...',
      updateAvailable: '⬇ 更新至',
      updateLatest: '✓ 已是最新',
      updateDone: '✓ 已更新至',
      updateFailed: '⚠ 更新失败',
      updateNoSidecar: '请先通过插件安装启动以启用一键更新',
      updateTooltip: '点击从 GitHub 检查并一键更新（按住 Shift 点击强制覆盖同步）',
    },
    en: {
      title: 'Gemini Periodic Table',
      subtitle: 'Click an element to switch · Drag slider or press ← → to adjust effort',
      compact: '4 Periods',
      full: 'All 118',
      themeDark: '🌙 Dark',
      themeLight: '☀️ Light',
      nativeList: 'Native List ↗',
      basinTitle: 'GEMINI 4 ELEMENT MATRIX',
      otherGoogle: 'Other Gemini / Orchestrator Models',
      otherNonGoogle: 'Other Models (Switches to Native)',
      effortTitle: 'Thinking Effort',
      currentBadge: 'Active',
      availableBadge: 'Available',
      disabledBadge: 'Quota / Unavailable',
      unavailableBadge: 'Not Released',
      noModels: 'No element models detected. Click "Native List" to view the full menu.',
      tip: 'Click outside or press Esc to close · Use ← → keys to nudge effort',
      updateIdle: '↻ Update',
      updateChecking: '↻ Checking...',
      updateUpdating: '↻ Updating...',
      updateAvailable: '⬇ Update to',
      updateLatest: '✓ Up to date',
      updateDone: '✓ Updated to',
      updateFailed: '⚠ Failed',
      updateNoSidecar: 'Plugin sidecar required for one-click update',
      updateTooltip: 'Click to check & update from GitHub (Shift+click to force sync)',
    },
  };
  const t = key => (I18N[state.lang] || I18N.zh)[key] || key;

  const hostPending = new Map();
  let hostReqSeq = 0;
  window.__agPeriodicHostReply = reply => {
    if (!reply || !reply.id) return;
    const item = hostPending.get(reply.id);
    if (!item) return;
    hostPending.delete(reply.id);
    clearTimeout(item.timer);
    item.resolve(reply);
  };

  function callHostAction(action, extra = {}, timeoutMs = 25000) {
    if (typeof window.__agPeriodicHostAction !== 'function') {
      return Promise.resolve({ ok: false, noSidecar: true, error: t('updateNoSidecar') });
    }
    return new Promise(resolve => {
      const id = `req_${++hostReqSeq}_${Date.now()}`;
      const timer = setTimeout(() => {
        hostPending.delete(id);
        resolve({ ok: false, error: 'Timeout' });
      }, timeoutMs);
      hostPending.set(id, { resolve, timer });
      try {
        window.__agPeriodicHostAction(JSON.stringify({ id, action, ...extra }));
      } catch (err) {
        clearTimeout(timer);
        hostPending.delete(id);
        resolve({ ok: false, error: err?.message || 'Host call failed' });
      }
    });
  }

  let updateResetTimer = null;
  const postUpdateInfo = window.__agPeriodicPostUpdate || null;
  if (postUpdateInfo) {
    try { delete window.__agPeriodicPostUpdate; } catch {}
  }
  const updateState = postUpdateInfo
    ? { status: 'updated', latestTag: postUpdateInfo.tag || WIDGET_VERSION, error: '' }
    : { status: 'idle', latestTag: '', error: '' };

  function getUpdateButtonView() {
    const st = updateState.status;
    if (st === 'checking') return { text: t('updateChecking'), cls: 'is-busy', disabled: true, title: t('updateTooltip') };
    if (st === 'updating') return { text: t('updateUpdating'), cls: 'is-busy', disabled: true, title: t('updateTooltip') };
    if (st === 'available') return { text: `${t('updateAvailable')} ${updateState.latestTag}`, cls: 'has-update', disabled: false, title: t('updateTooltip') };
    if (st === 'latest') return { text: t('updateLatest'), cls: 'is-ok', disabled: false, title: t('updateTooltip') };
    if (st === 'updated') return { text: `${t('updateDone')} ${updateState.latestTag || WIDGET_VERSION}`, cls: 'is-ok', disabled: false, title: t('updateTooltip') };
    if (st === 'error') return { text: t('updateFailed'), cls: 'is-err', disabled: false, title: updateState.error || t('updateTooltip') };
    return { text: t('updateIdle'), cls: '', disabled: false, title: t('updateTooltip') };
  }

  function refreshUpdateButton() {
    const btn = shadowRoot?.querySelector('[data-action="update-plugin"]');
    if (!btn) return;
    const view = getUpdateButtonView();
    btn.textContent = view.text;
    btn.disabled = view.disabled;
    btn.title = view.title;
    btn.className = `update-btn ${view.cls}`.trim();
  }

  function scheduleUpdateReset(delayMs = 3600) {
    if (updateResetTimer) clearTimeout(updateResetTimer);
    updateResetTimer = setTimeout(() => {
      updateResetTimer = null;
      if (updateState.status === 'latest' || updateState.status === 'updated' || updateState.status === 'error') {
        updateState.status = 'idle';
        updateState.error = '';
        refreshUpdateButton();
      }
    }, delayMs);
  }

  if (updateState.status === 'updated') {
    scheduleUpdateReset(5000);
  }

  async function checkUpdateInBackground() {
    if (updateState.status !== 'idle') return;
    if (typeof window.__agPeriodicHostAction !== 'function') return;
    const lastCheck = Number(localGet('ag-periodic-last-update-check', '0'));
    if (Date.now() - lastCheck < 30 * 60 * 1000) return;
    localSet('ag-periodic-last-update-check', String(Date.now()));
    const res = await callHostAction('check-update', {}, 12000);
    if (res?.ok && res.hasUpdate && updateState.status === 'idle') {
      updateState.status = 'available';
      updateState.latestTag = res.latestTag || '';
      refreshUpdateButton();
    }
  }

  async function handleOneClickUpdate(force = false) {
    if (updateState.status === 'checking' || updateState.status === 'updating') return;
    if (updateResetTimer) { clearTimeout(updateResetTimer); updateResetTimer = null; }
    if (typeof window.__agPeriodicHostAction !== 'function') {
      updateState.status = 'error';
      updateState.error = t('updateNoSidecar');
      refreshUpdateButton();
      scheduleUpdateReset(4000);
      try { window.open(GITHUB_RELEASES_URL, '_blank', 'noopener'); } catch {}
      return;
    }
    updateState.status = updateState.status === 'available' || force ? 'updating' : 'checking';
    updateState.error = '';
    refreshUpdateButton();

    const res = await callHostAction('apply-update', { force }, 30000);
    if (res?.ok && res.updated) {
      updateState.status = 'updated';
      updateState.latestTag = res.tag || WIDGET_VERSION;
      localSet('ag-periodic-last-update-check', String(Date.now()));
      refreshUpdateButton();
      scheduleUpdateReset(5000);
    } else if (res?.ok && res.alreadyLatest) {
      updateState.status = 'latest';
      updateState.latestTag = res.latestTag || WIDGET_VERSION;
      localSet('ag-periodic-last-update-check', String(Date.now()));
      refreshUpdateButton();
      scheduleUpdateReset(3500);
    } else {
      updateState.status = 'error';
      updateState.error = res?.error || 'GitHub unreachable';
      refreshUpdateButton();
      scheduleUpdateReset(4500);
    }
  }

  function isDarkTheme() {
    if (state.themeMode === 'dark') return true;
    if (state.themeMode === 'light') return false;
    const html = document.documentElement;
    // Respect Obsidian Prism theme attribute if present (works seamlessly standalone when absent)
    const prismTheme = html.getAttribute('data-ag-cs-theme');
    if (prismTheme === 'dark') return true;
    if (prismTheme === 'light') return false;
    if (html.classList.contains('dark') || html.dataset.theme === 'dark') return true;
    if (html.classList.contains('light') || html.dataset.theme === 'light') return false;
    const cs = getComputedStyle(html);
    if (cs.colorScheme === 'light') return false;
    if (cs.colorScheme === 'dark') return true;
    const varBg = cs.getPropertyValue('--background').trim();
    if (/^#([fF]{3}|[fF]{6}|f8|f9|fa|fb|fc|fd|fe)/i.test(varBg)) return false;
    if (/^#(0|1|2)[0-9a-f]{2,5}$/i.test(varBg)) return true;
    const fg = getComputedStyle(document.body || html).color;
    const mf = fg && fg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (mf) {
      const fgLum = (0.299 * Number(mf[1]) + 0.587 * Number(mf[2]) + 0.114 * Number(mf[3])) / 255;
      return fgLum > 0.5;
    }
    return false;
  }

  function detectSurfacePreset(dark) {
    const html = document.documentElement;
    if (!html.hasAttribute('data-ag-cs-style')) return 'default';
    const pal = (html.getAttribute('data-ag-cs-palette') || '').toLowerCase();
    const lightPreset = (html.getAttribute('data-ag-cs-light-preset') || '').toLowerCase();
    if (!pal || pal === 'host') return 'default';
    if (dark) {
      if (pal === 'warm' || pal === 'claude') return 'prism-warm-dark';
      if (pal === 'obsidian') return 'prism-obsidian-dark';
      return 'default';
    }
    if (pal === 'warm' || pal === 'claude' || lightPreset === 'alabaster') return 'prism-warm-light';
    if (pal === 'obsidian') return 'prism-cool-light';
    return 'default';
  }

  function hasBox(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    return rect.width >= 4 && rect.height >= 4;
  }

  function findModelTriggers() {
    const primary = Array.from(document.querySelectorAll('[data-testid="model-selector-trigger"]')).filter(hasBox);
    if (primary.length) return primary;
    return Array.from(document.querySelectorAll(
      'button[role="combobox"][aria-haspopup], button[aria-label^="Select model"], button[aria-label*="模型"]'
    )).filter(el => hasBox(el) && !el.closest('#' + HOST_ID));
  }

  function getTriggerModelText(trigger) {
    if (!trigger) return '';
    // Strip Obsidian Prism decorative glyph / keycap spans if present; standalone uses direct innerText
    if (trigger.querySelector?.('.ag-cs-model-glyph, .ag-pp-mini-keycap')) {
      const clone = trigger.cloneNode(true);
      for (const deco of clone.querySelectorAll('.ag-cs-model-glyph, .ag-pp-mini-keycap')) deco.remove();
      const stripped = E.cleanLabel(clone.textContent || '');
      if (stripped) return stripped;
    }
    const rawInner = E.cleanLabel(trigger.innerText || '');
    if (rawInner && (E.isGoogleModel(rawInner) || isLikelyAiModelLabel(rawInner))) return rawInner;
    return E.cleanLabel(trigger.textContent || trigger.getAttribute('aria-label') || rawInner || '');
  }

  function setNativeMenusHidden(hidden) {
    let style = document.getElementById(HIDE_STYLE_ID);
    if (hidden) {
      if (!style) {
        style = document.createElement('style');
        style.id = HIDE_STYLE_ID;
        style.textContent = `
          [role="menu"], [data-testid="model-selector-panel"], [data-ag-cs-model-overlay="1"] {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: none !important;
            transition-duration: 0s !important;
            animation: none !important;
            animation-duration: 0s !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else if (style) {
      style.remove();
    }
  }

  function isMenuNodeOpen(menuEl, requireBox = true) {
    if (!menuEl || !menuEl.isConnected) return false;
    if (requireBox && !hasBox(menuEl)) return false;
    if (menuEl.hasAttribute('data-closed') || menuEl.hasAttribute('data-ending-style')) return false;
    if (menuEl.hasAttribute('data-base-ui-focusable') && !menuEl.hasAttribute('data-open')) return false;
    return true;
  }

  function findLiveNativePanel() {
    const panels = document.querySelectorAll('[data-testid="model-selector-panel"]');
    for (const panel of panels) {
      if (!panel.isConnected || !hasBox(panel)) continue;
      const parentMenu = panel.closest('[role="menu"]');
      if (parentMenu && !isMenuNodeOpen(parentMenu, true)) continue;
      return panel;
    }
    return null;
  }

  function hasAnyNativeMenuNode() {
    return Boolean(document.querySelector('[data-testid="model-selector-panel"], [role="menu"]'));
  }

  function findLiveNestedMenu(item = null) {
    const nestedMenus = document.querySelectorAll('[role="menu"][data-nested]');
    for (const nested of nestedMenus) {
      // Do not require non-zero bounding box: Obsidian Prism hides [data-nested] with display:none
      // while keeping all live Base UI effort radio nodes mounted and clickable.
      if (!isMenuNodeOpen(nested, false)) continue;
      if (nested.querySelectorAll('[data-testid="model-selector-effort-option"]').length < 1) continue;
      if (item && item.id) {
        const labelledBy = nested.getAttribute('aria-labelledby');
        if (labelledBy && labelledBy !== item.id) continue;
      }
      return nested;
    }
    return null;
  }

  function closeNativeMenuIfOpen() {
    if (findLiveNativePanel() || document.querySelector('[role="menu"][data-open]')) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
    }
  }

  async function closeNativeMenuAndWait(maxWaitMs = 220) {
    for (let escAttempt = 0; escAttempt < 2; escAttempt++) {
      if (!findLiveNativePanel() && !document.querySelector('[role="menu"][data-open]')) break;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
      const deadline = Date.now() + Math.min(120, maxWaitMs);
      while (Date.now() < deadline) {
        await sleep(20);
        if (!findLiveNativePanel() && !document.querySelector('[role="menu"][data-open]')) break;
      }
    }
    // Wait briefly if a dying Base UI portal (data-closed/data-ending-style) is still finishing unmount
    const cleanupDeadline = Date.now() + Math.min(120, maxWaitMs);
    while (Date.now() < cleanupDeadline && hasAnyNativeMenuNode() && !findLiveNativePanel()) {
      await sleep(20);
    }
  }

  function getLiveTrigger() {
    if (state.activeTrigger && state.activeTrigger.isConnected && hasBox(state.activeTrigger)) {
      return state.activeTrigger;
    }
    const found = findModelTriggers()[0] || null;
    if (found) state.activeTrigger = found;
    return found;
  }

  async function ensureNativePanelOpen(waitFirst = false) {
    let panel = findLiveNativePanel();
    if (panel) return panel;
    if (waitFirst) {
      for (let i = 0; i < 10; i++) {
        await sleep(20);
        panel = findLiveNativePanel();
        if (panel) return panel;
      }
    }
    // Wait briefly if a closing Base UI portal is mid-unmount so trig.click() opens cleanly
    for (let i = 0; i < 6 && hasAnyNativeMenuNode() && !findLiveNativePanel(); i++) {
      await sleep(20);
    }
    panel = findLiveNativePanel();
    if (panel) return panel;

    const trig = getLiveTrigger();
    if (!trig) return null;
    state.bypassUntil = Date.now() + 500;
    trig.click();
    for (let i = 0; i < 16; i++) {
      await sleep(25);
      panel = findLiveNativePanel();
      if (panel) return panel;
    }
    return null;
  }

  function isUnavailableModelText(raw) {
    return /(不可用|unavailable|coming\s+soon)/i.test(String(raw || ''));
  }

  function isLikelyAiModelLabel(label) {
    return E.isGoogleModel(label)
      || /\b(orchestrator|claude|anthropic|opus|sonnet|haiku|gpt|openai|o1|o3|o4|codex|deepseek|llama|mistral|qwen|grok)\b/i.test(label);
  }

  function parsePanelModels(panel) {
    if (!panel) return [];
    const items = Array.from(panel.querySelectorAll('[role="menuitem"]'));
    const out = [];
    const seen = new Set();
    for (const item of items) {
      const rawText = E.cleanLabel(item.innerText || item.textContent || '');
      if (!rawText || /查看使用额度|view\s+usage/i.test(rawText)) continue;
      const groupSpan = item.querySelector('[data-testid="model-selector-effort-group"]');
      const modelBase = groupSpan
        ? E.cleanLabel(groupSpan.getAttribute('data-model-base') || groupSpan.innerText || '')
        : rawText.replace(/\s+(NEW|BETA|新|默认|重要提示|不可用|Unavailable).*$/i, '').trim();
      if (!modelBase || seen.has(modelBase.toLowerCase())) continue;
      seen.add(modelBase.toLowerCase());
      const disabled = item.hasAttribute('data-disabled')
        || item.getAttribute('aria-disabled') === 'true'
        || isUnavailableModelText(rawText);
      const hasEffortGroup = Boolean(groupSpan);
      const curEffort = E.extractEffort(rawText);
      const parsed = E.parseModelInfo(modelBase);
      const remembered = getRememberedEffort(modelBase, parsed.element?.number || null);
      out.push({
        ...parsed,
        label: modelBase,
        modelBase,
        rawText,
        effort: remembered || curEffort || parsed.effort,
        disabled,
        hasEffortGroup,
      });
    }
    return out;
  }

  function findMenuItemByBase(panel, modelBase) {
    if (!panel || !modelBase) return null;
    const norm = modelBase.toLowerCase();
    for (const span of panel.querySelectorAll('[data-testid="model-selector-effort-group"]')) {
      const base = E.cleanLabel(span.getAttribute('data-model-base') || span.innerText || '').toLowerCase();
      if (base === norm) return span.closest('[role="menuitem"]');
    }
    for (const item of panel.querySelectorAll('[role="menuitem"]')) {
      const txt = E.cleanLabel(item.innerText || '').toLowerCase();
      if (txt.startsWith(norm)) return item;
    }
    return null;
  }

  function matchesAppliedTarget(label, modelInfo, chosenKey = null) {
    if (!label || !modelInfo) return false;
    const parsed = E.parseModelInfo(label);
    const modelMatches = modelInfo.element
      ? parsed.element?.number === modelInfo.element.number
      : label.toLowerCase().includes(modelInfo.modelBase.toLowerCase());
    if (!modelMatches) return false;
    if (chosenKey) {
      const actualEffort = E.extractEffort(label);
      return actualEffort === chosenKey;
    }
    return true;
  }

  function triggerSubmenuOpen(item) {
    if (!item || !item.isConnected) return;
    try { item.focus({ preventScroll: true }); } catch { try { item.focus(); } catch {} }
    try {
      item.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
      item.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }));
    } catch {}
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, bubbles: true, cancelable: true }));
  }

  async function readSubmenuEfforts(modelBase, existingPanel = null, shouldAbort = null) {
    const panel = (existingPanel && existingPanel.isConnected && findLiveNativePanel() === existingPanel)
      ? existingPanel
      : await ensureNativePanelOpen();
    if (!panel || shouldAbort?.()) return [];
    const item = findMenuItemByBase(panel, modelBase);
    if (!item || item.getAttribute('aria-haspopup') !== 'menu') return [];

    // Fast path: submenu for this exact item is already open and live
    let nested = findLiveNestedMenu(item);
    if (!nested) {
      // If a different item's nested submenu is currently open (e.g. auto-opened by Obsidian Prism),
      // close ONLY that nested submenu so target item is no longer data-base-ui-inert.
      const otherNested = findLiveNestedMenu(null);
      if (otherNested) {
        otherNested.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37, bubbles: true, cancelable: true }));
        await sleep(30);
        if (shouldAbort?.()) return [];
        if (findLiveNestedMenu(null) || item.hasAttribute('data-base-ui-inert')) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
          await sleep(40);
          if (shouldAbort?.()) return [];
        }
      }
      // If Escape also closed parent panel, re-open parent panel cleanly
      let activeItem = item;
      if (!activeItem.isConnected || !findLiveNativePanel()) {
        const reopened = await ensureNativePanelOpen();
        if (!reopened || shouldAbort?.()) return [];
        activeItem = findMenuItemByBase(reopened, modelBase);
        if (!activeItem) return [];
      }

      // Let focus settle 1 frame on X11/Chromium before firing ArrowRight so Base UI tracks activeIndex
      try { activeItem.focus({ preventScroll: true }); } catch { try { activeItem.focus(); } catch {} }
      await sleep(20);
      if (shouldAbort?.()) return [];
      triggerSubmenuOpen(activeItem);

      for (let i = 0; i < 16; i++) {
        await sleep(25);
        if (shouldAbort?.()) return [];
        nested = findLiveNestedMenu(activeItem);
        if (nested) break;
        if (i === 5 || i === 10) {
          try { activeItem.focus({ preventScroll: true }); } catch {}
          await sleep(16);
          if (shouldAbort?.()) return [];
          triggerSubmenuOpen(activeItem);
        }
      }
    }
    if (!nested) return [];

    const options = [];
    for (const optSpan of nested.querySelectorAll('[data-testid="model-selector-effort-option"]')) {
      const key = (optSpan.getAttribute('data-effort') || '').toLowerCase() || E.extractEffort(optSpan.innerText);
      const radio = optSpan.closest('[role="menuitemradio"], [role="menuitem"]');
      const checked = radio ? (radio.getAttribute('aria-checked') === 'true' || radio.hasAttribute('data-checked')) : false;
      const label = E.cleanLabel(optSpan.innerText || optSpan.textContent || key);
      if (key) options.push({ key, label, checked, radio });
    }
    if (options.length) {
      const remembered = getRememberedEffort(modelBase);
      const nativeChecked = options.find(o => o.checked)?.key || null;
      if (!remembered && nativeChecked) {
        rememberModelEffort(modelBase, nativeChecked);
      }
      const effectiveChecked = (remembered && options.some(o => o.key === remembered))
        ? remembered
        : nativeChecked;
      state.effortsByBase.set(
        modelBase,
        options.map(({ key, label, checked }) => ({
          key,
          label,
          checked: effectiveChecked ? key === effectiveChecked : checked,
        })),
      );
    }
    return options;
  }

  let activeDrainPromise = null;

  function scheduleEffortApply(modelInfo, targetEffortKey) {
    if (!modelInfo || modelInfo.disabled) return;
    const seq = ++state.selectionSeq;
    cancelPendingDebounce();
    state.pendingApply = null;
    if (targetEffortKey) {
      rememberModelEffort(modelInfo.modelBase, targetEffortKey, modelInfo.element?.number || null);
    }
    state.optimisticEffort = { modelBase: modelInfo.modelBase, key: targetEffortKey, seq };
    state.pendingDebounceJob = { modelInfo, targetEffortKey, seq };
    // Wait 240ms so the CSS glide animation completes at 120fps on an idle main thread
    // before triggering background React menu synchronization.
    state.applyDebounceTimer = setTimeout(() => {
      const job = state.pendingDebounceJob;
      state.applyDebounceTimer = null;
      state.pendingDebounceJob = null;
      if (job && job.seq === state.selectionSeq) {
        void enqueueApply(job.modelInfo, job.targetEffortKey, job.seq);
      }
    }, 240);
  }

  function enqueueApply(modelInfo, targetEffortKey = null, explicitSeq = null) {
    if (!modelInfo) return Promise.resolve();
    if (modelInfo.disabled) {
      if (state.open && !isUserSelectionPending()) syncActiveStatesInPlace();
      return Promise.resolve();
    }
    const seq = explicitSeq ?? ++state.selectionSeq;
    if (explicitSeq === null) {
      cancelPendingDebounce();
      if (targetEffortKey) {
        state.optimisticEffort = { modelBase: modelInfo.modelBase, key: targetEffortKey, seq };
      } else {
        state.optimisticEffort = null;
      }
    }
    // Latest-wins coalescing: newer rapid selections replace older unstarted jobs instead of being dropped
    state.pendingApply = { modelInfo, targetEffortKey, seq };
    if (!state.busy) {
      state.busy = true;
      activeDrainPromise = drainApplyQueue();
    }
    return activeDrainPromise || Promise.resolve();
  }

  function drainApplyQueue() {
    return serializeNativeOp(async () => {
      let lastProcessedSeq = 0;
      try {
        while (state.pendingApply) {
          const job = state.pendingApply;
          state.pendingApply = null;
          lastProcessedSeq = Math.max(lastProcessedSeq, job.seq);
          if (job.seq !== state.selectionSeq) continue;

          const isSuperseded = () => job.seq !== state.selectionSeq;
          setNativeMenusHidden(true);

          const initialTrig = getLiveTrigger();
          const initialLabel = initialTrig ? getTriggerModelText(initialTrig) : state.currentLabel;
          const desiredEffortKey = job.targetEffortKey
            || (job.modelInfo.hasEffortGroup
              ? (getRememberedEffort(job.modelInfo.modelBase, job.modelInfo.element?.number || null) || job.modelInfo.effort || null)
              : null);
          const alreadyActive = Boolean(
            initialLabel
            && matchesAppliedTarget(initialLabel, job.modelInfo, desiredEffortKey)
            && (!job.modelInfo.hasEffortGroup || state.effortsByBase.has(job.modelInfo.modelBase)),
          );
          if (alreadyActive) {
            state.currentLabel = initialLabel;
            rememberEffortFromLabel(initialLabel);
            if (desiredEffortKey) {
              rememberModelEffort(job.modelInfo.modelBase, desiredEffortKey, job.modelInfo.element?.number || null);
            }
            continue;
          }

          let confirmed = false;
          for (let attempt = 0; attempt < 2 && !confirmed && !isSuperseded(); attempt++) {
            if (attempt > 0) {
              await closeNativeMenuAndWait(200);
              await sleep(40);
              if (isSuperseded()) break;
            }

            const panel = await ensureNativePanelOpen();
            if (!panel || isSuperseded()) continue;

            const trig = getLiveTrigger();
            const beforeLabel = trig ? getTriggerModelText(trig) : state.currentLabel;

            if (job.modelInfo.hasEffortGroup) {
              const options = await readSubmenuEfforts(job.modelInfo.modelBase, panel, isSuperseded);
              if (isSuperseded()) break;
              if (!options.length) continue;

              let chosen = (desiredEffortKey && options.find(o => o.key === desiredEffortKey))
                || options.find(o => o.checked)
                || options.find(o => o.key === 'medium')
                || options[0];
              if (!chosen) chosen = options[0];
              if (!chosen?.radio) continue;

              if (attempt > 0) {
                try { chosen.radio.focus({ preventScroll: true }); } catch {}
                await sleep(16);
              }
              chosen.radio.click();

              // Poll trigger text up to 500ms so slow Linux X11 / React updates are never read stale
              let confirmedLabel = '';
              for (let poll = 0; poll < 20; poll++) {
                await sleep(25);
                if (isSuperseded()) break;
                const latest = trig ? getTriggerModelText(trig) : '';
                if (latest && matchesAppliedTarget(latest, job.modelInfo, chosen.key)) {
                  confirmedLabel = latest;
                  break;
                }
              }

              if (isSuperseded()) break;
              if (confirmedLabel) {
                state.effortsByBase.set(
                  job.modelInfo.modelBase,
                  options.map(o => ({ key: o.key, label: o.label, checked: o.key === chosen.key })),
                );
                rememberModelEffort(job.modelInfo.modelBase, chosen.key, job.modelInfo.element?.number || null);
                state.currentLabel = confirmedLabel;
                confirmed = true;
              } else if (attempt === 1) {
                const fallbackLatest = trig ? getTriggerModelText(trig) : '';
                if (fallbackLatest && fallbackLatest !== beforeLabel) {
                  state.currentLabel = fallbackLatest;
                  rememberEffortFromLabel(fallbackLatest);
                }
              }
            } else {
              const item = findMenuItemByBase(panel, job.modelInfo.modelBase);
              if (!item) continue;
              item.click();

              let confirmedLabel = '';
              for (let poll = 0; poll < 20; poll++) {
                await sleep(25);
                if (isSuperseded()) break;
                const latest = trig ? getTriggerModelText(trig) : '';
                if (latest && (matchesAppliedTarget(latest, job.modelInfo, null) || latest !== beforeLabel)) {
                  confirmedLabel = latest;
                  break;
                }
              }
              if (isSuperseded()) break;
              if (confirmedLabel) {
                state.currentLabel = confirmedLabel;
                confirmed = true;
              } else if (attempt === 1) {
                const fallbackLatest = trig ? getTriggerModelText(trig) : '';
                if (fallbackLatest) state.currentLabel = fallbackLatest;
              }
            }
          }

          if (!state.pendingApply && findLiveNativePanel()) {
            await closeNativeMenuAndWait(180);
          }
        }
      } finally {
        if (state.optimisticEffort && state.optimisticEffort.seq <= lastProcessedSeq && !state.pendingApply && !state.applyDebounceTimer) {
          state.optimisticEffort = null;
        }
        state.busy = false;
        activeDrainPromise = null;
        if (state.pendingApply) {
          state.busy = true;
          activeDrainPromise = drainApplyQueue();
        } else {
          if (!state.open && !state.closing && !state.applyDebounceTimer) {
            setNativeMenusHidden(false);
          }
          if (state.open && !isUserSelectionPending()) {
            syncActiveStatesInPlace();
          }
        }
      }
    });
  }

  function applyModelAndEffort(modelInfo, targetEffortKey = null, explicitSeq = null) {
    return enqueueApply(modelInfo, targetEffortKey, explicitSeq);
  }

  function groupedModels() {
    const byAtomic = new Map();
    const otherGoogle = [];
    const nonGoogle = [];
    for (const m of state.models) {
      if (m.isGoogle) {
        if (m.element) {
          const list = byAtomic.get(m.element.number) || [];
          list.push(m);
          byAtomic.set(m.element.number, list);
        } else if (!m.disabled) {
          otherGoogle.push(m);
        }
      } else if (/^orchestrator\b/i.test(m.label) && !m.disabled) {
        otherGoogle.push(m);
      } else if (isLikelyAiModelLabel(m.label) && !m.disabled) {
        nonGoogle.push(m);
      }
    }
    return { byAtomic, otherGoogle, nonGoogle };
  }

  function getEffortStepsForElement(num, byAtomic) {
    const models = byAtomic.get(num) || [];
    const primary = models[0];
    if (!primary || !primary.hasEffortGroup || primary.disabled) return [];
    const remembered = getRememberedEffort(primary.modelBase, num);
    let cached = state.effortsByBase.get(primary.modelBase) || [];
    if (cached.length < 2) {
      const defaultKeys = num === 10 ? ['low', 'medium', 'high', 'xhigh'] : ['low', 'medium', 'high'];
      const fallbackKey = remembered || primary.effort || 'medium';
      cached = defaultKeys.map(k => ({
        key: k,
        label: EFFORT_PALETTE[k]?.zh || k,
        checked: fallbackKey === k,
      }));
    }
    const elInfo = E.BY_NUMBER.get(num);
    const elAccent = E.GEMINI_ELEMENT_META[num]?.accent || CATEGORY_TINT[elInfo?.category] || '#4F7DF3';
    const isActiveElement = E.parseModelInfo(state.currentLabel).element?.number === num;
    const opt = state.optimisticEffort;
    const hasOptimistic = Boolean(opt && opt.modelBase === primary.modelBase && opt.seq === state.selectionSeq && isUserSelectionPending());
    const curEffort = hasOptimistic
      ? opt.key
      : (isActiveElement
          ? (E.extractEffort(state.currentLabel) || remembered || primary.effort)
          : (remembered || primary.effort));
    const effectiveEffort = (curEffort && cached.some(c => c.key === curEffort))
      ? curEffort
      : (cached.find(c => c.checked)?.key || cached.find(c => c.key === 'medium')?.key || cached[0]?.key);

    // Seamless periodic 200%-width gradient for continuous left-to-right flowing stream at the highest effort level!
    const maxGradientByElement = {
      1:  'linear-gradient(90deg, #38BDF8 0%, #6366F1 25%, #C084FC 50%, #6366F1 75%, #38BDF8 100%)',
      6:  'linear-gradient(90deg, #60A5FA 0%, #8B5CF6 25%, #F472B6 50%, #8B5CF6 75%, #60A5FA 100%)',
      10: 'linear-gradient(90deg, #4F7DF3 0%, #8B5CF6 25%, #EC4899 50%, #8B5CF6 75%, #4F7DF3 100%)',
      18: 'linear-gradient(90deg, #F472B6 0%, #A855F7 25%, #38BDF8 50%, #A855F7 75%, #F472B6 100%)',
    };
    const elGrad = maxGradientByElement[num]
      || `linear-gradient(90deg, ${elAccent} 0%, #8B5CF6 25%, #EC4899 50%, #8B5CF6 75%, ${elAccent} 100%)`;

    // Solid base color always stays underneath (.ef-track-fill background-color),
    // while the top-level gradient (.ef-track-fill::after) cross-fades via opacity (zero flash up or down!).
    const total = cached.length;
    const effortStyleForStep = (key, idx) => {
      const isHighest = idx === total - 1;
      if (key === 'minimal' || key === 'low') {
        const c = `color-mix(in srgb, ${elAccent} 68%, #ffffff)`;
        return { color: c, grad: elGrad, gradOpacity: 0, glow: `color-mix(in srgb, ${elAccent} 34%, transparent)` };
      }
      if (isHighest) {
        return { color: elAccent, grad: elGrad, gradOpacity: 1, glow: `color-mix(in srgb, ${elAccent} 55%, transparent)` };
      }
      if (key === 'high') {
        return { color: elAccent, grad: elGrad, gradOpacity: 0.45, glow: `color-mix(in srgb, ${elAccent} 48%, transparent)` };
      }
      return { color: elAccent, grad: elGrad, gradOpacity: 0, glow: `color-mix(in srgb, ${elAccent} 42%, transparent)` };
    };

    return cached.map((c, idx) => {
      const pal = EFFORT_PALETTE[c.key] || { zh: c.label, en: c.label, zhHint: '', enHint: '' };
      const st = effortStyleForStep(c.key, idx);
      return {
        key: c.key,
        model: primary,
        shortLabel: state.lang === 'zh' ? (pal.zh || c.label) : (pal.en || c.label),
        hint: state.lang === 'zh' ? (pal.zhHint || '') : (pal.enHint || ''),
        color: st.color,
        grad: st.grad,
        gradOpacity: st.gradOpacity,
        glow: st.glow,
        active: effectiveEffort ? c.key === effectiveEffort : Boolean(c.checked),
        apply: () => scheduleEffortApply(primary, c.key),
      };
    });
  }

  let hostEl = null;
  let shadowRoot = null;

  function ensureHost() {
    if (hostEl && hostEl.isConnected) return;
    hostEl = document.createElement('div');
    hostEl.id = HOST_ID;
    hostEl.setAttribute('data-prism-ignore', '1');
    hostEl.style.cssText = 'position:fixed;inset:0;z-index:2147483640;pointer-events:none;visibility:visible;';
    document.body.appendChild(hostEl);
    shadowRoot = hostEl.attachShadow({ mode: 'open' });
  }

  function closePeriodic(openNativeAfter = false, immediate = false) {
    if (state.closeTimer) {
      clearTimeout(state.closeTimer);
      state.closeTimer = null;
    }
    state.openSessionId++;
    if (state.applyDebounceTimer) {
      const pendingJob = state.pendingDebounceJob;
      cancelPendingDebounce();
      if (!openNativeAfter && pendingJob && pendingJob.seq === state.selectionSeq) {
        void enqueueApply(pendingJob.modelInfo, pendingJob.targetEffortKey, pendingJob.seq);
      }
    }
    state.open = false;
    state.selectedElementNum = null;
    state.hoveredElementNum = null;
    stopResizeTracking();
    if (!state.busy && !state.pendingApply) {
      closeNativeMenuIfOpen();
    }

    const finishClose = () => {
      state.closing = false;
      if (!openNativeAfter && !state.busy && !state.pendingApply && !state.applyDebounceTimer) {
        closeNativeMenuIfOpen();
      }
      if (openNativeAfter || (!state.busy && !state.pendingApply && !state.applyDebounceTimer)) {
        setNativeMenusHidden(false);
      }
      if (shadowRoot) shadowRoot.innerHTML = '';
      if (openNativeAfter) {
        state.bypassUntil = Date.now() + 2000;
        const trig = getLiveTrigger();
        if (trig) {
          setTimeout(() => { try { trig.click(); } catch {} }, 30);
        }
      }
    };

    const pop = shadowRoot?.querySelector('.popover');
    if (!immediate && !openNativeAfter && pop) {
      state.closing = true;
      pop.classList.remove('is-open', 'no-anim');
      pop.classList.add('closing');
      state.closeTimer = setTimeout(finishClose, 230);
    } else {
      finishClose();
    }
  }

  function styles(dark, preset = 'default') {
    const palettes = {
      'prism-obsidian-dark': {
        bg: 'linear-gradient(165deg, rgba(19, 20, 25, 0.965) 0%, rgba(11, 12, 16, 0.985) 100%)',
        cardBg: 'rgba(28, 29, 36, 0.78)',
        border: 'rgba(220, 230, 255, 0.12)',
        borderSoft: 'rgba(220, 230, 255, 0.065)',
        fg: '#F4F7FF',
        muted: '#94A3B8',
        dim: 'rgba(148, 163, 184, 0.42)',
        shadow: '0 28px 72px rgba(0, 0, 0, 0.74), inset 0 1px 0 rgba(235, 243, 255, 0.10)',
      },
      'prism-warm-dark': {
        bg: 'linear-gradient(165deg, rgba(25, 23, 20, 0.965) 0%, rgba(16, 15, 13, 0.985) 100%)',
        cardBg: 'rgba(36, 33, 29, 0.78)',
        border: 'rgba(245, 235, 220, 0.13)',
        borderSoft: 'rgba(245, 235, 220, 0.07)',
        fg: '#F6F1EA',
        muted: '#ADA397',
        dim: 'rgba(173, 163, 151, 0.44)',
        shadow: '0 28px 72px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255, 244, 230, 0.085)',
      },
      'prism-cool-light': {
        bg: 'linear-gradient(165deg, rgba(252, 253, 255, 0.98) 0%, rgba(241, 246, 255, 0.99) 100%)',
        cardBg: 'rgba(238, 243, 250, 0.88)',
        border: 'rgba(15, 23, 42, 0.105)',
        borderSoft: 'rgba(15, 23, 42, 0.065)',
        fg: '#0F172A',
        muted: '#475569',
        dim: 'rgba(71, 85, 105, 0.46)',
        shadow: '0 24px 64px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.94)',
      },
      'prism-warm-light': {
        bg: 'linear-gradient(165deg, rgba(253, 251, 247, 0.985) 0%, rgba(245, 242, 234, 0.99) 100%)',
        cardBg: 'rgba(236, 231, 220, 0.74)',
        border: 'rgba(42, 32, 20, 0.12)',
        borderSoft: 'rgba(42, 32, 20, 0.075)',
        fg: '#1F1A14',
        muted: '#6B5F52',
        dim: 'rgba(107, 95, 82, 0.48)',
        shadow: '0 24px 64px rgba(42, 32, 20, 0.14), inset 0 1px 0 rgba(255, 253, 248, 0.94)',
      },
    };
    const p = palettes[preset] || null;
    const bg = p ? p.bg : (dark
      ? 'linear-gradient(165deg, rgba(15, 18, 29, 0.96) 0%, rgba(10, 12, 20, 0.98) 100%)'
      : 'linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 247, 254, 0.99) 100%)');
    const cardBg = p ? p.cardBg : (dark ? 'rgba(26, 31, 48, 0.72)' : 'rgba(241, 245, 253, 0.86)');
    const border = p ? p.border : (dark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.11)');
    const borderSoft = p ? p.borderSoft : (dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.07)');
    const fg = p ? p.fg : (dark ? '#F4F7FF' : '#0F172A');
    const muted = p ? p.muted : (dark ? '#94A3B8' : '#475569');
    const dim = p ? p.dim : (dark ? 'rgba(148, 163, 184, 0.42)' : 'rgba(71, 85, 105, 0.46)');
    const shadow = p ? p.shadow : (dark
      ? '0 28px 72px rgba(0, 0, 0, 0.68), 0 0 0 1px rgba(255,255,255,0.06) inset'
      : '0 24px 64px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(255,255,255,0.88) inset');

    return `
      * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }
      .backdrop {
        position: fixed; inset: 0; pointer-events: auto; background: transparent;
      }
      .popover {
        position: fixed; pointer-events: auto;
        container-type: inline-size;
        width: min(796px, calc(100vw - 24px));
        max-width: calc(100vw - 16px);
        max-height: calc(100vh - 24px);
        overflow-y: auto;
        overflow-x: hidden;
        background: ${bg}; color: ${fg};
        border: 1px solid ${border};
        border-radius: 18px;
        box-shadow: ${shadow};
        backdrop-filter: blur(22px) saturate(145%);
        padding: 15px 17px 13px;
        transform-origin: var(--origin-x, 120px) var(--origin-y, 100%);
        opacity: 0;
        transform: translate3d(0, 12px, 0) scale(0.84);
        transition:
          transform 330ms cubic-bezier(0.2, 1.06, 0.28, 1),
          opacity 210ms cubic-bezier(0.16, 1, 0.3, 1);
        will-change: transform, opacity;
      }
      .popover.is-open {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
      .popover.no-anim {
        transition: none !important;
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
      .popover.closing {
        pointer-events: none;
        opacity: 0;
        transform: translate3d(0, 10px, 0) scale(0.86);
        transition:
          transform 220ms cubic-bezier(0.32, 0, 0.15, 1),
          opacity 180ms cubic-bezier(0.32, 0, 0.2, 1);
      }
      /* Subtle inner cascade for organic depth on open */
      .popover .grid,
      .popover .spotlight {
        opacity: 0;
        transform: translate3d(0, 6px, 0);
        transition:
          transform 320ms cubic-bezier(0.2, 1, 0.3, 1) 25ms,
          opacity 220ms ease 25ms;
      }
      .popover .spotlight {
        transition-delay: 45ms;
      }
      .popover.is-open .grid,
      .popover.is-open .spotlight,
      .popover.no-anim .grid,
      .popover.no-anim .spotlight {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }
      .popover.closing .grid,
      .popover.closing .spotlight {
        opacity: 0;
        transform: translate3d(0, 4px, 0);
        transition: transform 160ms ease, opacity 140ms ease;
      }
      .popover::before {
        content: ''; position: absolute; inset: 0; border-radius: 18px; pointer-events: none;
        background: radial-gradient(560px 170px at 16% 0%, color-mix(in srgb, var(--aura, #4F7DF3) ${dark ? '17%' : '11%'}, transparent), transparent 74%);
        transition: background 220ms ease;
      }
      .header {
        position: relative; z-index: 1;
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        margin-bottom: 11px; flex-wrap: wrap;
      }
      .title-wrap { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .title { font-size: 13.5px; font-weight: 750; letter-spacing: 0.01em; }
      .subtitle { font-size: 11px; color: ${muted}; margin-top: 1px; }
      .actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .seg {
        display: inline-flex; padding: 2px; border-radius: 9px;
        background: ${cardBg}; border: 1px solid ${border};
      }
      .seg-btn {
        border: none; background: transparent; color: ${muted};
        border-radius: 7px; padding: 3px 8px; font-size: 11px; font-weight: 600;
        cursor: pointer; transition: all 120ms ease;
      }
      .seg-btn.active {
        background: ${dark ? 'rgba(255,255,255,0.12)' : '#ffffff'};
        color: ${fg};
        box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      }
      .btn {
        border: 1px solid ${border}; background: ${cardBg}; color: ${fg};
        border-radius: 9px; padding: 4.5px 10px; font-size: 11px; font-weight: 600;
        cursor: pointer; transition: all 120ms ease; white-space: nowrap;
      }
      .btn:hover { border-color: #4F7DF3; background: ${dark ? 'rgba(79,125,243,0.14)' : 'rgba(79,125,243,0.09)'}; }

      .grid {
        position: relative; z-index: 1;
        display: grid; grid-template-columns: repeat(18, minmax(0, 1fr));
        gap: 3.5px; margin-bottom: 12px;
      }
      /* Basin HUD in the natural Periodic Table valley (cols 4-11, rows 1-2) */
      .basin-hud {
        grid-column: 4 / 12;
        grid-row: 1 / 3;
        display: flex; flex-direction: column; justify-content: center; gap: 5px;
        padding: 6px 10px; border-radius: 10px;
        background: ${dark ? 'rgba(22, 27, 42, 0.52)' : 'rgba(241, 245, 253, 0.65)'};
        border: 1px dashed ${border};
      }
      .basin-label {
        font-size: 8.5px; font-weight: 750; letter-spacing: 0.08em; color: ${muted};
        display: flex; align-items: center; justify-content: space-between;
      }
      .basin-chips {
        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px;
      }
      .basin-chip {
        display: flex; align-items: center; justify-content: space-between; gap: 4px;
        padding: 4px 7px; border-radius: 7px; cursor: pointer;
        border: 1px solid color-mix(in srgb, var(--el-accent, #4F7DF3) 42%, ${border});
        background: color-mix(in srgb, var(--el-accent, #4F7DF3) ${dark ? '14%' : '10%'}, ${dark ? 'rgba(15,18,28,0.7)' : '#ffffff'});
        color: ${fg}; font-size: 10.5px; font-weight: 700;
        transition: transform 110ms ease, border-color 110ms ease, box-shadow 110ms ease;
      }
      .basin-chip:hover {
        transform: translateY(-1px);
        border-color: var(--el-accent, #4F7DF3);
      }
      .basin-chip.active {
        border-color: #34D399;
        box-shadow: 0 0 0 1.5px rgba(52, 211, 153, 0.35);
      }
      .basin-chip.disabled-model { opacity: 0.62; border-style: dashed; }
      .bc-sym { font-weight: 850; font-size: 11.5px; }
      .bc-name { font-size: 9.5px; color: ${muted}; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .cell {
        position: relative; aspect-ratio: 1 / 1.1; min-height: 37px;
        border-radius: 7px;
        border: 1px solid color-mix(in srgb, var(--cat-tint, #94A3B8) ${dark ? '14%' : '18%'}, transparent);
        background: color-mix(in srgb, var(--cat-tint, #94A3B8) ${dark ? '5%' : '6%'}, ${dark ? 'rgba(255,255,255,0.015)' : 'rgba(15,23,42,0.015)'});
        color: ${dim};
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 2px 1px; cursor: default; user-select: none;
        transition: transform 130ms cubic-bezier(0.2, 0.9, 0.25, 1), border-color 130ms ease, box-shadow 130ms ease, background 130ms ease;
      }
      .cell.ghost:hover {
        border-color: color-mix(in srgb, var(--cat-tint, #94A3B8) 38%, transparent);
        color: ${muted};
      }
      .cell.available {
        cursor: pointer; color: ${fg};
        background: linear-gradient(155deg,
          color-mix(in srgb, var(--el-accent, #60A5FA) ${dark ? '30%' : '20%'}, ${dark ? '#171C2E' : '#FFFFFF'}) 0%,
          color-mix(in srgb, var(--el-accent, #60A5FA) ${dark ? '14%' : '9%'}, ${dark ? '#121625' : '#F6F9FF'}) 100%);
        border: 1px solid color-mix(in srgb, var(--el-accent, #60A5FA) 68%, transparent);
        box-shadow: 0 2px 10px color-mix(in srgb, var(--el-accent, #60A5FA) ${dark ? '22%' : '14%'}, transparent),
                    0 1px 0 rgba(255,255,255,${dark ? '0.16' : '0.7'}) inset;
      }
      .cell.available.disabled-model { opacity: 0.72; border-style: dashed; }
      .cell.available:hover {
        transform: translateY(-2px) scale(1.07); z-index: 3;
        border-color: var(--el-accent, #60A5FA);
        box-shadow: 0 6px 18px color-mix(in srgb, var(--el-accent, #60A5FA) 38%, transparent),
                    0 1px 0 rgba(255,255,255,0.22) inset;
      }
      .cell.selected {
        transform: translateY(-1px) scale(1.08); z-index: 4;
        border: 1.5px solid var(--el-accent, #60A5FA);
        box-shadow: 0 0 0 2.5px color-mix(in srgb, var(--el-accent, #60A5FA) 38%, transparent),
                    0 8px 22px color-mix(in srgb, var(--el-accent, #60A5FA) 42%, transparent);
      }
      .cell.active::after {
        content: ''; position: absolute; top: 3.5px; right: 3.5px;
        width: 5.5px; height: 5.5px; border-radius: 99px;
        background: #34D399;
        box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.25), 0 0 8px #34D399;
      }
      .cell .num { position: absolute; top: 2px; left: 3.5px; font-size: 7.5px; line-height: 1; opacity: 0.72; font-weight: 700; font-variant-numeric: tabular-nums; }
      .cell .sym { font-size: 13.5px; font-weight: 800; line-height: 1.05; margin-top: 3px; letter-spacing: -0.02em; }
      .cell .name { font-size: 7.5px; line-height: 1.1; opacity: 0.84; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      /* Integrated 2-tier Element Spotlight + Effort Slider Card */
      .spotlight {
        position: relative; z-index: 1;
        display: flex; flex-direction: column; gap: 10px;
        padding: 12px 14px; border-radius: 14px;
        background: ${cardBg};
        border: 1px solid ${border};
        box-shadow: 0 1px 0 rgba(255,255,255,${dark ? '0.06' : '0.85'}) inset;
        margin-bottom: 8px;
      }
      .spot-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .spot-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
      .spot-tile {
        position: relative;
        width: 50px; height: 50px; border-radius: 12px; flex-shrink: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        border: 1.5px solid var(--el-accent, ${border});
        background: linear-gradient(150deg,
          color-mix(in srgb, var(--el-accent, #60A5FA) ${dark ? '28%' : '18%'}, transparent),
          color-mix(in srgb, var(--el-accent, #60A5FA) ${dark ? '10%' : '6%'}, transparent));
        box-shadow: 0 4px 14px color-mix(in srgb, var(--el-accent, #60A5FA) 22%, transparent);
      }
      .spot-tile .t-num { position: absolute; top: 3px; left: 5px; font-size: 8.5px; opacity: 0.78; line-height: 1; font-weight: 750; font-variant-numeric: tabular-nums; }
      .spot-tile .t-sym { font-size: 18px; font-weight: 850; line-height: 1.05; margin-top: 2px; }
      .spot-tile .t-mass { font-size: 7.5px; opacity: 0.68; line-height: 1; margin-top: 1px; font-variant-numeric: tabular-nums; }
      .spot-text { min-width: 0; flex: 1; }
      .spot-title { font-size: 13px; font-weight: 750; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .tag {
        font-size: 10px; font-weight: 650; padding: 1.5px 7.5px; border-radius: 99px;
        background: color-mix(in srgb, var(--el-accent, #60A5FA) 22%, transparent); color: ${fg};
      }
      .tag-shell {
        font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
        font-size: 9.5px; font-weight: 600; padding: 1px 6.5px; border-radius: 6px;
        background: ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'};
        color: ${muted};
      }
      .tag-active { background: rgba(52, 211, 153, 0.22); color: ${dark ? '#6EE7B7' : '#047857'}; }
      .tag-disabled { background: rgba(239, 68, 68, 0.18); color: ${dark ? '#FCA5A5' : '#B91C1C'}; }
      .spot-desc { font-size: 11.2px; color: ${muted}; margin-top: 3px; line-height: 1.38; }

      /* Animated Pill Track with Inner Step Dots + Gliding Pure White Circular Thumb */
      .effort-dock {
        --track-empty: ${dark ? 'rgba(148, 163, 184, 0.22)' : '#E5E7EB'};
        display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
        padding: 9px 14px; border-radius: 11px;
        background: ${dark ? 'rgba(12, 15, 24, 0.65)' : 'rgba(255, 255, 255, 0.90)'};
        border: 1px solid color-mix(in srgb, var(--eff-color, #4F7DF3) 40%, ${border});
        box-shadow: 0 2px 14px color-mix(in srgb, var(--eff-color, #4F7DF3) 10%, transparent);
        transition: border-color 220ms ease, box-shadow 220ms ease;
      }
      .ef-left-wrap { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
      .ef-label-col { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .ef-label { font-size: 11.5px; font-weight: 750; color: ${fg}; }
      @keyframes agEffortFlow {
        0%   { background-position: 200% 50%; }
        100% { background-position: 0% 50%; }
      }
      .ef-badge {
        position: relative; overflow: hidden;
        font-size: 10.5px; font-weight: 750; padding: 2px 10px; border-radius: 99px;
        color: #fff; background-color: var(--eff-color, #4F7DF3);
        box-shadow: 0 2px 8px var(--eff-glow, rgba(79, 125, 243, 0.35));
        transition: background-color 240ms ease, box-shadow 240ms ease;
      }
      .ef-badge::before {
        content: ''; position: absolute; inset: 0; border-radius: 99px;
        background-image: var(--eff-grad, none);
        background-size: 200% 100%;
        animation: agEffortFlow 2.2s linear infinite;
        opacity: var(--eff-grad-opacity, 0);
        transition: opacity 240ms ease;
        pointer-events: none;
      }
      .ef-badge > span { position: relative; z-index: 1; }
      .ef-hint { font-size: 10.5px; color: ${muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ef-slider-col { width: 236px; max-width: 100%; flex: 0 1 236px; display: flex; flex-direction: column; gap: 5px; user-select: none; }
      .ef-track-wrap {
        position: relative; width: 100%; height: 24px;
        display: flex; align-items: center; cursor: pointer; touch-action: none;
      }
      .ef-track-bg {
        position: relative; width: 100%; height: 20px; border-radius: 999px;
        background: var(--track-empty); overflow: hidden;
      }
      .ef-track-fill {
        position: absolute; left: 0; top: 0; bottom: 0;
        width: calc(12px + (100% - 24px) * var(--eff-ratio, 0.5));
        background-color: var(--eff-color, #4F7DF3);
        border-radius: 999px 0 0 999px;
        overflow: hidden;
        transition: width 290ms cubic-bezier(0.22, 1, 0.36, 1), background-color 240ms ease;
        will-change: width;
      }
      .ef-track-fill::after {
        content: ''; position: absolute; inset: 0;
        background-image: var(--eff-grad, none);
        background-size: 200% 100%;
        animation: agEffortFlow 2s linear infinite;
        opacity: var(--eff-grad-opacity, 0);
        transition: opacity 240ms ease;
        pointer-events: none;
      }
      .effort-dock.dragging .ef-track-fill {
        transition: width 45ms linear, background-color 160ms ease;
      }
      .ef-dots {
        position: absolute; left: 12px; right: 12px; top: 50%; transform: translateY(-50%);
        display: flex; justify-content: space-between; align-items: center;
        pointer-events: none; z-index: 2;
      }
      .ef-dot {
        width: 4.5px; height: 4.5px; border-radius: 50%;
        background: ${dark ? 'rgba(148, 163, 184, 0.55)' : 'rgba(148, 163, 184, 0.78)'};
        transition: background 180ms ease, opacity 180ms ease;
      }
      .ef-dot.filled { background: rgba(255, 255, 255, 0.68); }
      .ef-dot.current { opacity: 0; }
      .ef-thumb {
        position: absolute; top: 50%;
        left: calc(12px + (100% - 24px) * var(--eff-ratio, 0.5));
        width: 24px; height: 24px; border-radius: 50%;
        transform: translate3d(-50%, -50%, 0);
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.1);
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.22), 0 0 1px rgba(0, 0, 0, 0.12);
        z-index: 3; pointer-events: none;
        transition: left 290ms cubic-bezier(0.22, 1, 0.36, 1), transform 130ms ease, box-shadow 160ms ease;
        will-change: left, transform;
      }
      .ef-track-wrap:hover .ef-thumb {
        transform: translate3d(-50%, -50%, 0) scale(1.06);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
      }
      .effort-dock.dragging .ef-thumb {
        transition: left 45ms linear, transform 110ms ease, box-shadow 140ms ease;
        transform: translate3d(-50%, -50%, 0) scale(0.98);
      }
      .ef-ticks { display: flex; justify-content: space-between; gap: 2px; padding: 0 2px; }
      .ef-tick {
        border: none; background: transparent; color: ${muted};
        font-size: 10.5px; font-weight: 650; padding: 2px 6px; border-radius: 6px;
        cursor: pointer; transition: all 140ms ease;
      }
      .ef-tick:hover { color: ${fg}; background: ${borderSoft}; }
      .ef-tick.active {
        color: var(--eff-color, #4F7DF3);
        font-weight: 800;
        background: color-mix(in srgb, var(--eff-color, #4F7DF3) 14%, transparent);
      }

      .strip-section {
        position: relative; z-index: 1;
        display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
        padding-top: 7px; border-top: 1px solid ${borderSoft}; margin-top: 5px;
      }
      .strip-title { font-size: 11px; color: ${muted}; font-weight: 650; }
      .strip-pill {
        border: 1px solid ${border}; background: ${cardBg}; color: ${fg};
        border-radius: 8px; padding: 3.5px 10px; font-size: 11px; font-weight: 600;
        cursor: pointer; transition: all 110ms ease;
      }
      .strip-pill:hover { border-color: #4F7DF3; transform: translateY(-1px); }
      .strip-pill.active { border-color: #34D399; background: rgba(52, 211, 153, 0.16); }
      .footer {
        position: relative; z-index: 1;
        display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
        font-size: 10.5px; color: ${muted}; margin-top: 8px;
      }
      .footer-tip { min-width: 0; flex: 1; }
      .footer-right { display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0; }
      .ver-tag { font-variant-numeric: tabular-nums; opacity: 0.85; font-weight: 600; }
      .update-btn {
        border: 1px solid ${border}; background: ${cardBg}; color: ${muted};
        border-radius: 99px; padding: 2px 9px; font-size: 10px; font-weight: 650;
        cursor: pointer; transition: all 140ms ease; white-space: nowrap;
        display: inline-flex; align-items: center; gap: 4px;
      }
      .update-btn:hover:not(:disabled) {
        color: ${fg}; border-color: #4F7DF3;
        background: ${dark ? 'rgba(79,125,243,0.16)' : 'rgba(79,125,243,0.09)'};
      }
      .update-btn:disabled { opacity: 0.7; cursor: wait; }
      .update-btn.has-update {
        color: ${dark ? '#6EE7B7' : '#047857'};
        border-color: rgba(52, 211, 153, 0.55);
        background: rgba(52, 211, 153, ${dark ? '0.16' : '0.13'});
        box-shadow: 0 0 10px rgba(52, 211, 153, 0.22);
      }
      .update-btn.is-ok {
        color: ${dark ? '#6EE7B7' : '#047857'};
        border-color: rgba(52, 211, 153, 0.45);
      }
      .update-btn.is-err {
        color: ${dark ? '#FCA5A5' : '#B91C1C'};
        border-color: rgba(239, 68, 68, 0.45);
      }
      .empty-msg { padding: 10px; text-align: center; font-size: 12px; color: ${muted}; }

      /* Responsive width scaling when Antigravity window or sidebars narrow the chat pane */
      .popover[data-compact-w="1"] { padding: 12px 13px 10px; }
      .popover[data-compact-w="2"] { padding: 10px 10px 9px; border-radius: 14px; }
      @container (max-width: 700px) {
        .header { margin-bottom: 8px; gap: 8px; }
        .grid { gap: 2.5px; margin-bottom: 9px; }
        .cell { min-height: 31px; border-radius: 6px; }
        .cell .num { font-size: 6.5px; left: 2.5px; top: 1.5px; }
        .cell .sym { font-size: 11.5px; margin-top: 2px; }
        .cell .name { font-size: 6.5px; }
        .basin-hud { padding: 4px 7px; gap: 3px; }
        .basin-chip { padding: 3px 5px; font-size: 9.5px; }
        .bc-sym { font-size: 10.5px; }
        .bc-name { display: none; }
        .spotlight { padding: 10px 11px; gap: 8px; }
        .spot-tile { width: 44px; height: 44px; }
        .spot-tile .t-sym { font-size: 16px; }
        .effort-dock { padding: 8px 11px; gap: 10px; }
        .ef-slider-col { width: 204px; flex: 0 1 204px; }
      }
      @container (max-width: 540px) {
        .header { margin-bottom: 7px; }
        .subtitle { display: none; }
        .grid { gap: 2px; margin-bottom: 8px; }
        .cell { min-height: 26px; border-radius: 5px; padding: 1px; }
        .cell .num { display: none; }
        .cell .sym { font-size: 10px; margin-top: 0; }
        .cell .name { display: none; }
        .cell.active::after { width: 4px; height: 4px; top: 2px; right: 2px; }
        .basin-hud { padding: 3px 5px; }
        .basin-label { font-size: 7.5px; }
        .basin-chips { gap: 3px; }
        .basin-chip { padding: 2px 3px; justify-content: center; }
        .bc-sym { font-size: 9.5px; }
        .spot-tile { width: 38px; height: 38px; border-radius: 9px; }
        .spot-tile .t-num, .spot-tile .t-mass { display: none; }
        .spot-tile .t-sym { font-size: 14px; margin-top: 0; }
        .spot-title { font-size: 12px; }
        .spot-desc { font-size: 10.5px; }
        .effort-dock { padding: 7px 10px; gap: 8px; }
        .ef-slider-col { width: 100%; flex: 1 1 100%; }
      }

      /* Responsive vertical tightening when Antigravity window height shrinks */
      .popover[data-compact-h="1"] { padding: 11px 14px 9px; }
      .popover[data-compact-h="1"] .header { margin-bottom: 7px; }
      .popover[data-compact-h="1"] .grid { gap: 2.5px; margin-bottom: 8px; }
      .popover[data-compact-h="1"] .cell { min-height: 30px; }
      .popover[data-compact-h="1"] .cell .sym { font-size: 12px; }
      .popover[data-compact-h="1"] .spotlight { padding: 9px 11px; gap: 7px; margin-bottom: 6px; }
      .popover[data-compact-h="1"] .spot-tile { width: 42px; height: 42px; }
      .popover[data-compact-h="1"] .effort-dock { padding: 7px 11px; }

      .popover[data-compact-h="2"] { padding: 9px 12px 8px; }
      .popover[data-compact-h="2"] .header { margin-bottom: 5px; }
      .popover[data-compact-h="2"] .subtitle { display: none; }
      .popover[data-compact-h="2"] .grid { gap: 2px; margin-bottom: 6px; }
      .popover[data-compact-h="2"] .cell { min-height: 25px; }
      .popover[data-compact-h="2"] .cell .sym { font-size: 10.5px; margin-top: 1px; }
      .popover[data-compact-h="2"] .cell .name { display: none; }
      .popover[data-compact-h="2"] .spotlight { padding: 8px 10px; gap: 6px; margin-bottom: 5px; }
      .popover[data-compact-h="2"] .spot-tile { width: 38px; height: 38px; }
      .popover[data-compact-h="2"] .effort-dock { padding: 6px 10px; }
      .popover[data-compact-h="2"] .footer { margin-top: 5px; }
    `;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function getAvailableHorizontalBounds(trigger) {
    const vw = window.innerWidth;
    const margin = vw < 480 ? 8 : 12;
    let safeLeft = margin;
    let safeRight = vw - margin;

    const trigRect = trigger && trigger.isConnected && hasBox(trigger) ? trigger.getBoundingClientRect() : null;
    const trigCenterX = trigRect ? (trigRect.left + trigRect.width / 2) : (vw / 2);

    // 1. Respect native Electron WebContentsView / browser-hole overlays (they render above all DOM z-index)
    const holes = document.querySelectorAll('[data-browser-hole="true"], [data-wcv-proxy="true"], [data-has-browser-hole="true"], webview');
    for (const h of holes) {
      if (!h.isConnected) continue;
      const r = h.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) continue;
      if (trigCenterX <= r.left + 8) {
        safeRight = Math.min(safeRight, Math.floor(r.left) - 8);
      } else if (trigCenterX >= r.right - 8) {
        safeLeft = Math.max(safeLeft, Math.ceil(r.right) + 8);
      }
    }

    // 2. Respect the chat pane bounds (adapts automatically to both right browser pane AND HTML sidebars)
    let paneLeft = safeLeft;
    let paneRight = safeRight;
    const chatPane = trigger?.closest?.('[data-testid="conversation-view"], [data-testid="overview-panel-host"]');
    if (chatPane && chatPane.isConnected && hasBox(chatPane)) {
      const pr = chatPane.getBoundingClientRect();
      if (pr.width >= 240) {
        paneLeft = Math.max(safeLeft, Math.ceil(pr.left) + 8);
        paneRight = Math.min(safeRight, Math.floor(pr.right) - 8);
      }
    }

    // Prefer fitting completely inside the chat column; if chat column becomes very narrow (<480px),
    // borrow available HTML space to the left while strictly respecting native browser-hole boundaries.
    const paneSpan = Math.max(0, paneRight - paneLeft);
    let minLeft = paneLeft;
    let maxRight = paneRight;
    if (paneSpan < 480 && (paneRight - safeLeft) > paneSpan) {
      minLeft = Math.max(safeLeft, paneRight - 480);
    }
    if (maxRight - minLeft < 260) {
      minLeft = safeLeft;
      maxRight = Math.max(safeLeft + 260, safeRight);
    }
    return { vw, margin, minLeft, maxRight };
  }

  function positionPopover(popoverEl, trigger) {
    if (!popoverEl) return;
    const vh = window.innerHeight;
    const { vw, margin, minLeft, maxRight } = getAvailableHorizontalBounds(trigger);
    const availableW = Math.max(260, maxRight - minLeft);
    const targetWidth = Math.max(260, Math.min(796, availableW));
    popoverEl.style.width = targetWidth + 'px';
    popoverEl.dataset.compactW = targetWidth <= 540 ? '2' : (targetWidth <= 700 ? '1' : '0');

    const pw = targetWidth;
    const rect = trigger && trigger.isConnected && hasBox(trigger) ? trigger.getBoundingClientRect() : null;

    if (!rect) {
      const vx = Math.max(minLeft, Math.round(minLeft + (availableW - pw) / 2));
      const availableH = Math.max(120, vh - margin * 2);
      popoverEl.style.left = vx + 'px';
      popoverEl.style.bottom = margin + 'px';
      popoverEl.style.top = 'auto';
      popoverEl.style.maxHeight = availableH + 'px';
      popoverEl.dataset.compactH = availableH < 430 ? '2' : (availableH < 520 ? '1' : '0');
      popoverEl.style.setProperty('--origin-x', `${Math.round(pw / 2)}px`);
      popoverEl.style.setProperty('--origin-y', '100%');
      return;
    }

    const vx = Math.max(minLeft, Math.min(maxRight - pw, Math.round(rect.left)));
    popoverEl.style.left = vx + 'px';
    const originX = Math.max(24, Math.min(pw - 24, Math.round((rect.left + rect.width / 2) - vx)));

    const spaceAbove = Math.max(0, Math.round(rect.top - margin - 8));
    const spaceBelow = Math.max(0, Math.round(vh - rect.bottom - margin - 8));
    let availableH = Math.max(120, vh - margin * 2);

    if (spaceAbove >= spaceBelow && spaceAbove >= 200) {
      // Anchor bottom edge 8px above the model selector trigger so it NEVER gets cut off at the bottom!
      const bottomOffset = Math.max(margin, Math.round(vh - rect.top + 8));
      availableH = Math.max(120, Math.min(vh - margin * 2, spaceAbove));
      popoverEl.style.bottom = bottomOffset + 'px';
      popoverEl.style.top = 'auto';
      popoverEl.style.maxHeight = availableH + 'px';
      popoverEl.style.setProperty('--origin-x', `${originX}px`);
      popoverEl.style.setProperty('--origin-y', '100%');
    } else if (spaceBelow >= 200) {
      const topOffset = Math.max(margin, Math.round(rect.bottom + 8));
      availableH = Math.max(120, Math.min(vh - margin * 2, spaceBelow));
      popoverEl.style.top = topOffset + 'px';
      popoverEl.style.bottom = 'auto';
      popoverEl.style.maxHeight = availableH + 'px';
      popoverEl.style.setProperty('--origin-x', `${originX}px`);
      popoverEl.style.setProperty('--origin-y', '0%');
    } else {
      // Very short window: pin cleanly inside viewport bounds so nothing clips off-screen
      availableH = Math.max(120, vh - margin * 2);
      popoverEl.style.top = margin + 'px';
      popoverEl.style.bottom = 'auto';
      popoverEl.style.maxHeight = availableH + 'px';
      popoverEl.style.setProperty('--origin-x', `${originX}px`);
      popoverEl.style.setProperty('--origin-y', '50%');
    }

    popoverEl.dataset.compactH = availableH < 430 ? '2' : (availableH < 520 ? '1' : '0');
  }

  let resizeRaf = 0;
  let resizeObserver = null;
  let resizeListenersActive = false;

  function scheduleReposition() {
    if (!state.open || state.closing) return;
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      if (!state.open || state.closing) return;
      const pop = shadowRoot?.querySelector('.popover');
      if (pop) positionPopover(pop, getLiveTrigger());
    });
  }

  function startResizeTracking() {
    if (!resizeListenersActive) {
      resizeListenersActive = true;
      window.addEventListener('resize', scheduleReposition, { passive: true });
      try { window.visualViewport?.addEventListener('resize', scheduleReposition, { passive: true }); } catch {}
    }
    if (typeof ResizeObserver === 'function') {
      try {
        resizeObserver?.disconnect();
        resizeObserver = new ResizeObserver(scheduleReposition);
        const targets = new Set();
        if (document.documentElement) targets.add(document.documentElement);
        const trig = getLiveTrigger();
        if (trig) {
          const chatPane = trig.closest('[data-testid="conversation-view"], [data-testid="overview-panel-host"]');
          const inputBox = trig.closest('[data-testid="agent-input-box"]');
          if (chatPane) targets.add(chatPane);
          if (inputBox) targets.add(inputBox);
          if (trig.parentElement) targets.add(trig.parentElement);
        }
        for (const h of document.querySelectorAll('[data-browser-hole="true"], [data-wcv-proxy="true"]')) {
          if (h.isConnected) targets.add(h);
        }
        for (const el of targets) resizeObserver.observe(el);
      } catch {}
    }
  }

  function stopResizeTracking() {
    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = 0;
    }
    if (resizeListenersActive) {
      resizeListenersActive = false;
      window.removeEventListener('resize', scheduleReposition);
      try { window.visualViewport?.removeEventListener('resize', scheduleReposition); } catch {}
    }
    try { resizeObserver?.disconnect(); } catch {}
    resizeObserver = null;
  }

  function syncActiveStatesInPlace() {
    if (!shadowRoot || !state.open) return;
    const pop = shadowRoot.querySelector('.popover');
    if (!pop) {
      render();
      return;
    }
    const { byAtomic, otherGoogle } = groupedModels();
    const curParsed = E.parseModelInfo(state.currentLabel);
    const activeNum = curParsed.element ? curParsed.element.number : null;

    for (const cell of shadowRoot.querySelectorAll('.cell')) {
      const num = Number(cell.dataset.num);
      cell.classList.toggle('active', num === activeNum);
      cell.classList.toggle('selected', num === state.selectedElementNum);
    }
    for (const chip of shadowRoot.querySelectorAll('.basin-chip')) {
      const num = Number(chip.dataset.basinNum);
      chip.classList.toggle('active', num === activeNum);
    }
    for (const btn of shadowRoot.querySelectorAll('[data-legacy-idx]')) {
      const m = otherGoogle[Number(btn.dataset.legacyIdx)];
      const isCur = Boolean(m && state.currentLabel.toLowerCase().startsWith(m.modelBase.toLowerCase()));
      btn.classList.toggle('active', isCur);
    }
    updateSpotlight(byAtomic, activeNum);
  }

  function updateSpotlight(byAtomic, activeNum) {
    const spot = shadowRoot?.querySelector('.spotlight');
    const pop = shadowRoot?.querySelector('.popover');
    if (!spot) return;

    const focusNum = state.hoveredElementNum || state.selectedElementNum || activeNum || (byAtomic.size ? byAtomic.keys().next().value : 10);
    const focusEl = E.BY_NUMBER.get(focusNum) || E.BY_NUMBER.get(10);
    const focusModels = byAtomic.get(focusEl.number) || [];
    const isDisabledModel = Boolean(focusModels[0]?.disabled);
    const focusMeta = E.GEMINI_ELEMENT_META[focusEl.number];
    const focusAccent = focusMeta?.accent || CATEGORY_TINT[focusEl.category] || '#60A5FA';
    const science = ATOMIC_SCIENCE[focusEl.number];
    const massText = science?.mass || (focusEl.number * 2.02).toFixed(2);
    const shellText = science?.shell || `#${focusEl.number} · P${focusEl.period} G${focusEl.group}`;
    const focusDesc = focusMeta
      ? (state.lang === 'zh' ? focusMeta.zhDesc : focusMeta.enDesc)
      : (focusModels.length ? focusModels.map(m => m.label).join(' · ') : `${focusEl.name} (${focusEl.zh}) · #${focusEl.number}`);
    const focusTag = focusModels.length
      ? (focusMeta ? (state.lang === 'zh' ? focusMeta.zhTag : focusMeta.enTag) : t('availableBadge'))
      : t('unavailableBadge');

    if (pop) pop.style.setProperty('--aura', focusAccent);

    const sliderNum = state.selectedElementNum || activeNum || focusEl.number;
    const steps = sliderNum ? getEffortStepsForElement(sliderNum, byAtomic) : [];
    const sliderElInfo = sliderNum ? E.BY_NUMBER.get(sliderNum) : null;
    const sliderKey = `${sliderNum || 0}:${steps.map(s => s.key).join(',')}:${state.lang}`;

    const topHtml = `
      <div class="spot-left">
        <div class="spot-tile" style="--el-accent:${focusAccent};">
          <span class="t-num">${focusEl.number}</span>
          <span class="t-sym">${focusEl.symbol}</span>
          <span class="t-mass">${escapeHtml(massText)}</span>
        </div>
        <div class="spot-text">
          <div class="spot-title">
            <span>${escapeHtml(focusEl.name)} (${escapeHtml(focusEl.zh)})</span>
            <span class="tag-shell">${escapeHtml(shellText)}</span>
            <span class="tag" style="--el-accent:${focusAccent};">${escapeHtml(focusTag)}</span>
            ${isDisabledModel ? `<span class="tag tag-disabled">${escapeHtml(t('disabledBadge'))}</span>` : ''}
            ${focusEl.number === activeNum ? `<span class="tag tag-active">${escapeHtml(t('currentBadge'))}</span>` : ''}
          </div>
          <div class="spot-desc">${escapeHtml(focusDesc)}</div>
        </div>
      </div>
    `;

    const existingTop = spot.querySelector('.spot-top');
    const existingDock = spot.querySelector('.effort-dock');
    const stepCountKey = `${steps.length}:${state.lang}`;
    if (existingTop && existingDock && spot.dataset.stepCountKey === stepCountKey && steps.length >= 2) {
      existingTop.innerHTML = topHtml;
      let activeIdx = steps.findIndex(s => s.active);
      if (activeIdx < 0) activeIdx = Math.floor(steps.length / 2);
      const labelEl = existingDock.querySelector('.ef-label');
      if (labelEl) {
        labelEl.textContent = sliderElInfo ? `${sliderElInfo.symbol} (${sliderElInfo.zh}) · ${t('effortTitle')}` : t('effortTitle');
      }
      const prevSliderNum = Number(existingDock.dataset.sliderNum || 0);
      const switchedElement = Boolean(sliderNum && sliderNum !== prevSliderNum);
      if (sliderNum) existingDock.dataset.sliderNum = String(sliderNum);
      existingDock.__updateSteps?.(steps, activeIdx, switchedElement);
      return;
    }

    spot.dataset.stepCountKey = stepCountKey;
    let dockHtml = '';
    if (steps.length >= 2) {
      let activeIdx = steps.findIndex(s => s.active);
      if (activeIdx < 0) activeIdx = Math.floor(steps.length / 2);
      const cur = steps[activeIdx];
      const ratio = (activeIdx / (steps.length - 1)).toFixed(4);
      dockHtml = `
        <div class="effort-dock" data-slider-num="${sliderNum || 0}" style="--eff-color:${cur.color};--eff-grad:${cur.grad};--eff-grad-opacity:${cur.gradOpacity};--eff-glow:${cur.glow};--eff-ratio:${ratio};">
          <div class="ef-left-wrap">
            <div class="ef-label-col">
              <span class="ef-label">${escapeHtml(sliderElInfo ? `${sliderElInfo.symbol} (${sliderElInfo.zh}) · ${t('effortTitle')}` : t('effortTitle'))}</span>
              <span class="ef-badge"><span class="ef-badge-text">${escapeHtml(cur.shortLabel)}</span></span>
            </div>
            <div class="ef-hint">${escapeHtml(cur.hint || '')}</div>
          </div>
          <div class="ef-slider-col">
            <div class="ef-track-wrap" role="slider" aria-valuemin="0" aria-valuemax="${steps.length - 1}" aria-valuenow="${activeIdx}">
              <div class="ef-track-bg">
                <div class="ef-track-fill"></div>
              </div>
              <div class="ef-dots">
                ${steps.map((_, idx) => `<span class="ef-dot ${idx < activeIdx ? 'filled' : ''} ${idx === activeIdx ? 'current' : ''}"></span>`).join('')}
              </div>
              <div class="ef-thumb"></div>
            </div>
            <div class="ef-ticks">
              ${steps.map((s, idx) => `<button type="button" class="ef-tick ${idx === activeIdx ? 'active' : ''}" data-step-idx="${idx}">${escapeHtml(s.shortLabel)}</button>`).join('')}
            </div>
          </div>
        </div>
      `;
    }

    spot.innerHTML = `
      <div class="spot-top">${topHtml}</div>
      ${dockHtml}
    `;

    if (steps.length >= 2) {
      const dock = spot.querySelector('.effort-dock');
      const trackWrap = spot.querySelector('.ef-track-wrap');
      const badgeText = spot.querySelector('.ef-badge-text');
      const hintEl = spot.querySelector('.ef-hint');
      const ticks = Array.from(spot.querySelectorAll('.ef-tick'));
      const dots = Array.from(spot.querySelectorAll('.ef-dot'));
      let liveSteps = steps;
      let currentIdx = steps.findIndex(s => s.active);
      if (currentIdx < 0) currentIdx = Math.floor(steps.length / 2);

      const previewStep = (idx, customRatio = null) => {
        const s = liveSteps[idx];
        if (!s || !dock) return;
        currentIdx = idx;
        const ratio = customRatio !== null ? customRatio : (idx / (liveSteps.length - 1));
        dock.style.setProperty('--eff-color', s.color);
        dock.style.setProperty('--eff-grad', s.grad);
        dock.style.setProperty('--eff-grad-opacity', String(s.gradOpacity));
        dock.style.setProperty('--eff-glow', s.glow);
        dock.style.setProperty('--eff-ratio', ratio.toFixed(4));
        if (badgeText) badgeText.textContent = s.shortLabel;
        if (hintEl) hintEl.textContent = s.hint || '';
        ticks.forEach((b, i) => b.classList.toggle('active', i === idx));
        dots.forEach((d, i) => {
          d.classList.toggle('filled', i < idx);
          d.classList.toggle('current', i === idx);
        });
        trackWrap?.setAttribute('aria-valuenow', String(idx));
      };

      const scheduleApply = step => {
        if (!step) return;
        step.apply();
      };

      dock.__updateSteps = (newSteps, newIdx, forceSync = false) => {
        liveSteps = newSteps;
        ticks.forEach((b, i) => {
          if (newSteps[i]) b.textContent = newSteps[i].shortLabel;
        });
        if (!dock.classList.contains('dragging') && (forceSync || !isUserSelectionPending())) {
          previewStep(newIdx);
        }
      };

      dock.__nudge = delta => {
        const next = Math.max(0, Math.min(liveSteps.length - 1, currentIdx + delta));
        if (next === currentIdx) return;
        previewStep(next);
        scheduleApply(liveSteps[next]);
      };

      const ratioFromPointer = clientX => {
        const rect = trackWrap.getBoundingClientRect();
        const usable = Math.max(1, rect.width - 24);
        return Math.max(0, Math.min(1, (clientX - (rect.left + 12)) / usable));
      };

      let dragging = false;
      trackWrap?.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        state.selectionSeq++;
        cancelPendingDebounce();
        state.pendingApply = null;
        dragging = true;
        try { trackWrap.setPointerCapture(ev.pointerId); } catch {}
        const r = ratioFromPointer(ev.clientX);
        const nearest = Math.round(r * (liveSteps.length - 1));
        previewStep(nearest);
      });
      trackWrap?.addEventListener('pointermove', ev => {
        if (!dragging) return;
        dock.classList.add('dragging');
        const r = ratioFromPointer(ev.clientX);
        const nearest = Math.round(r * (liveSteps.length - 1));
        previewStep(nearest, r);
      });
      const finishDrag = ev => {
        if (!dragging) return;
        dragging = false;
        dock.classList.remove('dragging');
        try { trackWrap.releasePointerCapture(ev.pointerId); } catch {}
        const r = ratioFromPointer(ev.clientX);
        const nearest = Math.round(r * (liveSteps.length - 1));
        previewStep(nearest);
        scheduleApply(liveSteps[nearest]);
      };
      trackWrap?.addEventListener('pointerup', finishDrag);
      trackWrap?.addEventListener('pointercancel', finishDrag);
      trackWrap?.addEventListener('lostpointercapture', finishDrag);

      ticks.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          previewStep(idx);
          scheduleApply(liveSteps[idx]);
        });
      });
    }
  }

  function render(skipAnim = false) {
    ensureHost();
    if (!state.open) {
      shadowRoot.innerHTML = '';
      return;
    }

    const dark = isDarkTheme();
    const surfacePreset = detectSurfacePreset(dark);
    const { byAtomic, otherGoogle, nonGoogle } = groupedModels();
    const curParsed = E.parseModelInfo(state.currentLabel);
    const activeNum = curParsed.element ? curParsed.element.number : null;

    const maxPeriod = state.fullTable ? 10 : 4;
    const visibleElements = E.ELEMENTS.filter(el => el.period <= maxPeriod || byAtomic.has(el.number));

    // Basin HUD chips for the Gemini 4 element family inside the Periodic Table valley
    const basinEntries = Array.from(byAtomic.entries()).sort((a, b) => a[0] - b[0]);
    const basinHtml = basinEntries.length ? `
      <div class="basin-hud">
        <div class="basin-label">
          <span>⚛ ${escapeHtml(t('basinTitle'))}</span>
          <span>${basinEntries.length} ELEMENTS</span>
        </div>
        <div class="basin-chips">
          ${basinEntries.map(([num, list]) => {
            const el = E.BY_NUMBER.get(num);
            if (!el) return '';
            const meta = E.GEMINI_ELEMENT_META[num];
            const accent = meta?.accent || '#4F7DF3';
            const isDisabled = Boolean(list[0]?.disabled);
            const isActive = num === activeNum;
            const tagText = meta ? (state.lang === 'zh' ? meta.zhTag : meta.enTag) : el.name;
            return `<button type="button" class="basin-chip ${isActive ? 'active' : ''} ${isDisabled ? 'disabled-model' : ''}" data-basin-num="${num}" style="--el-accent:${accent};">
              <span class="bc-sym">${el.number} ${el.symbol}</span>
              <span class="bc-name">${escapeHtml(tagText)}</span>
            </button>`;
          }).join('')}
        </div>
      </div>
    ` : '';

    const cellsHtml = visibleElements.map(el => {
      const models = byAtomic.get(el.number);
      const available = Boolean(models && models.length);
      const isDisabled = Boolean(models?.[0]?.disabled);
      const isActive = el.number === activeNum;
      const isSelected = el.number === state.selectedElementNum;
      const meta = E.GEMINI_ELEMENT_META[el.number];
      const catTint = CATEGORY_TINT[el.category] || '#94A3B8';
      const accent = meta?.accent || catTint;
      const cls = [
        'cell',
        available ? 'available' : 'ghost',
        isDisabled ? 'disabled-model' : '',
        isActive ? 'active' : '',
        isSelected ? 'selected' : '',
      ].filter(Boolean).join(' ');
      const shortName = state.lang === 'zh' ? el.zh : el.name;
      return `<div class="${cls}" data-num="${el.number}" style="grid-column:${el.group};grid-row:${el.period};--el-accent:${accent};--cat-tint:${catTint};" title="${escapeHtml(`${el.number} ${el.symbol} · ${el.name} (${el.zh})`)}">
        <span class="num">${el.number}</span>
        <span class="sym">${el.symbol}</span>
        <span class="name">${escapeHtml(shortName)}</span>
      </div>`;
    }).join('');

    const legacyHtml = otherGoogle.length ? `
      <div class="strip-section">
        <span class="strip-title">${escapeHtml(t('otherGoogle'))}:</span>
        ${otherGoogle.map((m, i) => {
          const isCur = state.currentLabel.toLowerCase().startsWith(m.modelBase.toLowerCase());
          return `<button class="strip-pill ${isCur ? 'active' : ''}" data-legacy-idx="${i}">${escapeHtml(m.label)}</button>`;
        }).join('')}
      </div>
    ` : '';

    const nonGoogleHtml = nonGoogle.length ? `
      <div class="strip-section">
        <span class="strip-title">${escapeHtml(t('otherNonGoogle'))}:</span>
        ${nonGoogle.map((m, i) => `<button class="strip-pill" data-nongoogle-idx="${i}">${escapeHtml(m.label)}</button>`).join('')}
      </div>
    ` : '';

    shadowRoot.innerHTML = `
      <style>${styles(dark, surfacePreset)}</style>
      <div class="backdrop" data-action="close"></div>
      <div class="popover ${skipAnim ? 'is-open no-anim' : ''}" role="dialog" aria-label="${escapeHtml(t('title'))}">
        <div class="header">
          <div class="title-wrap">
            <div>
              <div class="title">${escapeHtml(t('title'))}</div>
              <div class="subtitle">${escapeHtml(t('subtitle'))}</div>
            </div>
          </div>
          <div class="actions">
            <div class="seg">
              <button class="seg-btn ${!state.fullTable ? 'active' : ''}" data-table="compact">${escapeHtml(t('compact'))}</button>
              <button class="seg-btn ${state.fullTable ? 'active' : ''}" data-table="full">${escapeHtml(t('full'))}</button>
            </div>
            <button class="btn" data-action="toggle-theme">${escapeHtml(dark ? t('themeLight') : t('themeDark'))}</button>
            <button class="btn" data-action="toggle-lang">${state.lang === 'zh' ? 'EN' : '中文'}</button>
            <button class="btn" data-action="show-native">${escapeHtml(t('nativeList'))}</button>
          </div>
        </div>

        <div class="grid">${basinHtml}${cellsHtml}</div>
        <div class="spotlight"></div>
        ${(!byAtomic.size && !otherGoogle.length) ? `<div class="empty-msg">${escapeHtml(t('noModels'))}</div>` : ''}
        ${legacyHtml}
        ${nonGoogleHtml}
        <div class="footer">
          <span class="footer-tip">${escapeHtml(t('tip'))}</span>
          <div class="footer-right">
            <span class="ver-tag">${WIDGET_VERSION}</span>
            ${(() => {
              const uv = getUpdateButtonView();
              return `<button type="button" class="update-btn ${uv.cls}" data-action="update-plugin" ${uv.disabled ? 'disabled' : ''} title="${escapeHtml(uv.title)}">${escapeHtml(uv.text)}</button>`;
            })()}
          </div>
        </div>
      </div>
    `;

    updateSpotlight(byAtomic, activeNum);
    const popoverEl = shadowRoot.querySelector('.popover');
    positionPopover(popoverEl, getLiveTrigger());
    startResizeTracking();
    if (!skipAnim && popoverEl) {
      // Force initial layout at scale(0.84) before transitioning to .is-open on next frame
      void popoverEl.offsetHeight;
      requestAnimationFrame(() => {
        popoverEl.classList.add('is-open');
      });
    }

    shadowRoot.querySelector('[data-action="close"]')?.addEventListener('click', () => closePeriodic(false));
    shadowRoot.querySelector('[data-action="show-native"]')?.addEventListener('click', () => closePeriodic(true));
    shadowRoot.querySelector('[data-action="update-plugin"]')?.addEventListener('click', ev => {
      void handleOneClickUpdate(Boolean(ev.shiftKey));
    });
    setTimeout(() => { if (state.open) void checkUpdateInBackground(); }, 450);
    shadowRoot.querySelector('[data-table="compact"]')?.addEventListener('click', () => {
      if (!state.fullTable) return;
      state.fullTable = false;
      localSet('ag-periodic-full', '0');
      render(true);
    });
    shadowRoot.querySelector('[data-table="full"]')?.addEventListener('click', () => {
      if (state.fullTable) return;
      state.fullTable = true;
      localSet('ag-periodic-full', '1');
      render(true);
    });
    shadowRoot.querySelector('[data-action="toggle-theme"]')?.addEventListener('click', () => {
      const next = isDarkTheme() ? 'light' : 'dark';
      state.themeMode = next;
      localSet('ag-periodic-theme', next);
      render(true);
    });
    shadowRoot.querySelector('[data-action="toggle-lang"]')?.addEventListener('click', () => {
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      localSet('ag-periodic-lang', state.lang);
      render(true);
    });

    const selectElementNum = async num => {
      const cellModels = byAtomic.get(num);
      if (!cellModels || !cellModels.length) return;
      const primary = cellModels[0];
      state.selectedElementNum = num;
      state.hoveredElementNum = null;
      const seq = ++state.selectionSeq;
      cancelPendingDebounce();
      if (primary.disabled) {
        state.optimisticEffort = null;
        syncActiveStatesInPlace();
        return;
      }
      const desiredEffort = primary.hasEffortGroup
        ? (getRememberedEffort(primary.modelBase, num) || primary.effort || null)
        : null;
      state.optimisticEffort = desiredEffort
        ? { modelBase: primary.modelBase, key: desiredEffort, seq }
        : null;
      for (const cell of shadowRoot.querySelectorAll('.cell')) {
        cell.classList.toggle('selected', Number(cell.dataset.num) === num);
      }
      const curA = E.parseModelInfo(state.currentLabel).element?.number || null;
      updateSpotlight(byAtomic, curA);
      await applyModelAndEffort(primary, desiredEffort, seq);
    };

    const setHoveredElement = num => {
      if (state.hoveredElementNum === num) return;
      state.hoveredElementNum = num;
      const curA = E.parseModelInfo(state.currentLabel).element?.number || null;
      updateSpotlight(byAtomic, curA);
    };

    const gridEl = shadowRoot.querySelector('.grid');
    const hoverTargets = Array.from(shadowRoot.querySelectorAll('.cell, .basin-chip')).map(el => ({
      el,
      num: Number(el.dataset.num || el.dataset.basinNum),
    }));

    // Split ONLY the narrow gap between adjacent elements (horizontal, vertical & inner corners) 50/50;
    // any open blank area (valley, basin padding, lanthanide blank slot, bottom-left corner) returns to the active model.
    gridEl?.addEventListener('mousemove', ev => {
      const direct = ev.target?.closest?.('.cell, .basin-chip');
      if (direct) {
        const directNum = Number(direct.dataset.num || direct.dataset.basinNum);
        if (directNum) setHoveredElement(directNum);
        return;
      }
      const x = ev.clientX;
      const y = ev.clientY;
      const MAX_GAP_X = 9;  // covers 3.5px cell gaps & 5px basin-chip gaps + hover scale
      const MAX_GAP_Y = 11; // covers 3.5px row gaps & 7.01px row7-to-row9 lanthanide gap + translateY(-2px)
      const ALIGN_TOL = 1.5; // absorbs subpixel / scale(1.08) edge offset between vertically/horizontally aligned neighbors
      let hasLeft = false;
      let hasRight = false;
      let hasTop = false;
      let hasBottom = false;
      let hasTL = false;
      let hasTR = false;
      let hasBL = false;
      let hasBR = false;
      let bestNum = null;
      let bestDistSq = MAX_GAP_Y * MAX_GAP_Y + MAX_GAP_X * MAX_GAP_X;

      for (const item of hoverTargets) {
        const r = item.el.getBoundingClientRect();
        const dx = x < r.left ? r.left - x : (x > r.right ? x - r.right : 0);
        const dy = y < r.top ? r.top - y : (y > r.bottom ? y - r.bottom : 0);

        // Inside cell/chip bounding rect (e.g. border-radius rounded corner): keep that element!
        if (dx === 0 && dy === 0) {
          setHoveredElement(item.num);
          return;
        }
        if (dx > MAX_GAP_X || dy > MAX_GAP_Y) continue;

        const cx = (r.left + r.right) * 0.5;
        const cy = (r.top + r.bottom) * 0.5;

        if (dy <= ALIGN_TOL) {
          if (cx < x) hasLeft = true;
          if (cx > x) hasRight = true;
        }
        if (dx <= ALIGN_TOL) {
          if (cy < y) hasTop = true;
          if (cy > y) hasBottom = true;
        }
        if (cx < x && cy < y) hasTL = true;
        if (cx > x && cy < y) hasTR = true;
        if (cx < x && cy > y) hasBL = true;
        if (cx > x && cy > y) hasBR = true;

        const d2 = dx * dx + dy * dy;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestNum = item.num;
        }
      }

      const inBridge = (hasLeft && hasRight)
        || (hasTop && hasBottom)
        || (hasTL && hasBR)
        || (hasTR && hasBL);

      if (inBridge && bestNum !== null) {
        setHoveredElement(bestNum);
      } else {
        setHoveredElement(null);
      }
    }, { passive: true });

    gridEl?.addEventListener('mouseleave', () => {
      setHoveredElement(null);
    });

    for (const chip of shadowRoot.querySelectorAll('.basin-chip')) {
      const num = Number(chip.dataset.basinNum);
      chip.addEventListener('mouseenter', () => setHoveredElement(num));
      chip.addEventListener('click', () => void selectElementNum(num));
    }

    for (const cell of shadowRoot.querySelectorAll('.cell')) {
      const num = Number(cell.dataset.num);
      cell.addEventListener('mouseenter', () => setHoveredElement(num));
      cell.addEventListener('click', () => void selectElementNum(num));
    }

    for (const btn of shadowRoot.querySelectorAll('[data-legacy-idx]')) {
      btn.addEventListener('click', async () => {
        const picked = otherGoogle[Number(btn.dataset.legacyIdx)];
        if (!picked) return;
        state.selectedElementNum = null;
        state.hoveredElementNum = null;
        await applyModelAndEffort(picked, null);
      });
    }
    for (const btn of shadowRoot.querySelectorAll('[data-nongoogle-idx]')) {
      btn.addEventListener('click', async () => {
        const picked = nonGoogle[Number(btn.dataset.nongoogleIdx)];
        if (!picked) return;
        if (picked.hasEffortGroup) {
          closePeriodic(true);
          return;
        }
        await applyModelAndEffort(picked, null);
        closePeriodic(false);
      });
    }
  }

  // Pre-hide native menu on pointerdown capture (BEFORE Base UI mounts the menu on pointerdown/mousedown!)
  function onDocumentPointerDownCapture(event) {
    if (Date.now() < state.bypassUntil) return;
    if (hostEl && (event.target === hostEl || hostEl.contains(event.target))) return;
    const triggers = findModelTriggers();
    const hit = triggers.find(tr => tr === event.target || tr.contains(event.target));
    if (!hit) return;
    const label = getTriggerModelText(hit);
    if (E.isGoogleModel(label)) {
      setNativeMenusHidden(true);
    } else {
      setNativeMenusHidden(false);
    }
  }

  function onDocumentClick(event) {
    if (Date.now() < state.bypassUntil) return;
    if (hostEl && (event.target === hostEl || hostEl.contains(event.target))) return;
    const triggers = findModelTriggers();
    const hit = triggers.find(tr => tr === event.target || tr.contains(event.target));
    if (!hit) return;

    const label = getTriggerModelText(hit);
    if (!E.isGoogleModel(label)) {
      setNativeMenusHidden(false);
      if (state.open) closePeriodic(false, true);
      return;
    }

    if (state.open) {
      closePeriodic(false);
      return;
    }

    if (state.closeTimer) {
      clearTimeout(state.closeTimer);
      state.closeTimer = null;
      state.closing = false;
    }

    state.activeTrigger = hit;
    state.currentLabel = label;
    rememberEffortFromLabel(state.currentLabel);
    const curParsed = E.parseModelInfo(state.currentLabel);
    state.selectedElementNum = curParsed.element ? curParsed.element.number : null;
    const openSessionId = ++state.openSessionId;
    const openSeq = state.selectionSeq;
    setNativeMenusHidden(true);

    const hadCachedModels = state.models.length > 0;
    if (hadCachedModels) {
      state.open = true;
      render(false);
    }

    void serializeNativeOp(async () => {
      if (state.openSessionId !== openSessionId) return;
      const panel = await ensureNativePanelOpen(true);
      if (!panel) {
        if (!hadCachedModels && !state.open) setNativeMenusHidden(false);
        return;
      }
      if (state.openSessionId !== openSessionId) return;

      state.models = parsePanelModels(panel);
      if (!hadCachedModels) {
        state.open = true;
        render(false);
      } else if (state.open && state.selectionSeq === openSeq && !isUserSelectionPending()) {
        syncActiveStatesInPlace();
      }

      const stillUntouched = () => (
        state.open
        && state.openSessionId === openSessionId
        && state.selectionSeq === openSeq
        && !state.pendingApply
        && !state.applyDebounceTimer
      );

      const { byAtomic } = groupedModels();
      const activeList = state.selectedElementNum ? (byAtomic.get(state.selectedElementNum) || []) : [];
      const activeModel = activeList[0];
      const needsEffortProbe = Boolean(
        stillUntouched()
        && activeModel?.hasEffortGroup
        && !activeModel?.disabled
        && (!state.effortsByBase.has(activeModel.modelBase) || !E.extractEffort(state.currentLabel)),
      );

      if (needsEffortProbe) {
        await readSubmenuEfforts(activeModel.modelBase, panel, () => !stillUntouched());
      }
      if (state.openSessionId === openSessionId && state.selectionSeq === openSeq && !state.pendingApply) {
        await closeNativeMenuAndWait(180);
      }
      if (stillUntouched() && !state.busy) {
        syncActiveStatesInPlace();
      }
    });
  }

  function onKeyDown(event) {
    if (!event.isTrusted || !state.open) return;
    if (event.key === 'Escape') {
      closePeriodic(false);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const dock = shadowRoot?.querySelector('.effort-dock');
      if (dock?.__nudge) {
        event.preventDefault();
        event.stopPropagation();
        dock.__nudge(event.key === 'ArrowRight' ? 1 : -1);
      }
    }
  }

  document.addEventListener('pointerdown', onDocumentPointerDownCapture, true);
  document.addEventListener('click', onDocumentClick, false);
  document.addEventListener('keydown', onKeyDown, true);

  window.__agPeriodicDispose = () => {
    if (state.closeTimer) clearTimeout(state.closeTimer);
    if (updateResetTimer) clearTimeout(updateResetTimer);
    for (const item of hostPending.values()) clearTimeout(item.timer);
    hostPending.clear();
    stopResizeTracking();
    cancelPendingDebounce();
    state.pendingApply = null;
    state.openSessionId++;
    setNativeMenusHidden(false);
    state.open = false;
    document.removeEventListener('pointerdown', onDocumentPointerDownCapture, true);
    document.removeEventListener('click', onDocumentClick, false);
    document.removeEventListener('keydown', onKeyDown, true);
    hostEl?.remove();
    delete window.__agPeriodicInstalled;
    delete window.__agPeriodicDispose;
  };
};
