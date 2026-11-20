// Self-contained main-world UI for Antigravity Periodic Model Selector (v1.0).
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
    selectedElementNum: null,
    hoveredElementNum: null,
    activeTrigger: null,
    currentLabel: '',
    bypassUntil: 0,
  };

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
    },
  };
  const t = key => (I18N[state.lang] || I18N.zh)[key] || key;

  function isDarkTheme() {
    if (state.themeMode === 'dark') return true;
    if (state.themeMode === 'light') return false;
    const html = document.documentElement;
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
    return E.cleanLabel(trigger.innerText || trigger.textContent || trigger.getAttribute('aria-label') || '');
  }

  function setNativeMenusHidden(hidden) {
    let style = document.getElementById(HIDE_STYLE_ID);
    if (hidden) {
      if (!style) {
        style = document.createElement('style');
        style.id = HIDE_STYLE_ID;
        style.textContent = `
          [role="menu"], [data-testid="model-selector-panel"] {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: none !important;
            animation: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else if (style) {
      style.remove();
    }
  }

  function closeNativeMenuIfOpen() {
    if (document.querySelector('[data-testid="model-selector-panel"], [role="menu"]')) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
    }
  }

  async function ensureNativePanelOpen(waitFirst = false) {
    let panel = document.querySelector('[data-testid="model-selector-panel"]');
    if (panel && panel.isConnected && hasBox(panel)) return panel;
    if (waitFirst) {
      for (let i = 0; i < 8; i++) {
        await sleep(20);
        panel = document.querySelector('[data-testid="model-selector-panel"]');
        if (panel && panel.isConnected && hasBox(panel)) return panel;
      }
    }
    const trig = state.activeTrigger || findModelTriggers()[0];
    if (!trig) return null;
    state.bypassUntil = Date.now() + 400;
    trig.click();
    for (let i = 0; i < 12; i++) {
      await sleep(25);
      panel = document.querySelector('[data-testid="model-selector-panel"]');
      if (panel && panel.isConnected && hasBox(panel)) return panel;
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
      out.push({
        ...parsed,
        label: modelBase,
        modelBase,
        rawText,
        effort: curEffort || parsed.effort,
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

  async function readSubmenuEfforts(modelBase) {
    const panel = await ensureNativePanelOpen();
    if (!panel) return [];
    const item = findMenuItemByBase(panel, modelBase);
    if (!item || item.getAttribute('aria-haspopup') !== 'menu') return [];

    item.focus();
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, bubbles: true, cancelable: true }));

    let nested = null;
    for (let i = 0; i < 10; i++) {
      await sleep(25);
      nested = document.querySelector('[role="menu"][data-nested]');
      if (nested && nested.querySelectorAll('[data-testid="model-selector-effort-option"]').length >= 1) break;
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
      state.effortsByBase.set(modelBase, options.map(({ key, label, checked }) => ({ key, label, checked })));
    }
    return options;
  }

  async function applyModelAndEffort(modelInfo, targetEffortKey = null) {
    if (state.busy || !modelInfo) return;
    if (modelInfo.disabled) {
      syncActiveStatesInPlace();
      return;
    }
    state.busy = true;
    try {
      setNativeMenusHidden(true);
      const panel = await ensureNativePanelOpen();
      if (!panel) return;

      if (modelInfo.hasEffortGroup) {
        const options = await readSubmenuEfforts(modelInfo.modelBase);
        if (options.length) {
          let chosen = targetEffortKey
            ? options.find(o => o.key === targetEffortKey)
            : (options.find(o => o.checked) || options.find(o => o.key === 'medium') || options[0]);
          if (!chosen) chosen = options[0];
          if (chosen?.radio) {
            chosen.radio.click();
            await sleep(80);
          }
          state.effortsByBase.set(
            modelInfo.modelBase,
            options.map(o => ({ key: o.key, label: o.label, checked: o.key === chosen.key })),
          );
          modelInfo.effort = chosen.key;
        }
      } else {
        const item = findMenuItemByBase(panel, modelInfo.modelBase);
        if (item) {
          item.click();
          await sleep(80);
        }
      }

      const trig = state.activeTrigger || findModelTriggers()[0];
      if (trig) state.currentLabel = getTriggerModelText(trig) || state.currentLabel;
      closeNativeMenuIfOpen();
    } finally {
      state.busy = false;
      if (state.open) syncActiveStatesInPlace();
    }
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
    let cached = state.effortsByBase.get(primary.modelBase) || [];
    if (cached.length < 2) {
      const defaultKeys = num === 10 ? ['low', 'medium', 'high', 'xhigh'] : ['low', 'medium', 'high'];
      cached = defaultKeys.map(k => ({
        key: k,
        label: EFFORT_PALETTE[k]?.zh || k,
        checked: (primary.effort || 'medium') === k,
      }));
    }
    const elInfo = E.BY_NUMBER.get(num);
    const elAccent = E.GEMINI_ELEMENT_META[num]?.accent || CATEGORY_TINT[elInfo?.category] || '#4F7DF3';
    const isActiveElement = E.parseModelInfo(state.currentLabel).element?.number === num;
    const curEffort = isActiveElement ? E.extractEffort(state.currentLabel) : primary.effort;

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
        shortLabel: state.lang === 'zh' ? (pal.zh || c.label) : (pal.en || c.label),
        hint: state.lang === 'zh' ? (pal.zhHint || '') : (pal.enHint || ''),
        color: st.color,
        grad: st.grad,
        gradOpacity: st.gradOpacity,
        glow: st.glow,
        active: curEffort ? c.key === curEffort : Boolean(c.checked),
        apply: () => void applyModelAndEffort(primary, c.key),
      };
    });
  }

  let hostEl = null;
  let shadowRoot = null;

  function ensureHost() {
    if (hostEl && hostEl.isConnected) return;
    hostEl = document.createElement('div');
    hostEl.id = HOST_ID;
    hostEl.style.cssText = 'position:fixed;inset:0;z-index:2147483640;pointer-events:none;visibility:visible;';
    document.body.appendChild(hostEl);
    shadowRoot = hostEl.attachShadow({ mode: 'open' });
  }

  function closePeriodic(openNativeAfter = false, immediate = false) {
    if (state.closeTimer) {
      clearTimeout(state.closeTimer);
      state.closeTimer = null;
    }
    state.open = false;
    state.selectedElementNum = null;
    state.hoveredElementNum = null;
    closeNativeMenuIfOpen();

    const finishClose = () => {
      state.closing = false;
      setNativeMenusHidden(false);
      if (shadowRoot) shadowRoot.innerHTML = '';
      if (openNativeAfter) {
        state.bypassUntil = Date.now() + 2000;
        const trig = state.activeTrigger || findModelTriggers()[0];
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

  function styles(dark) {
    const bg = dark
      ? 'linear-gradient(165deg, rgba(15, 18, 29, 0.96) 0%, rgba(10, 12, 20, 0.98) 100%)'
      : 'linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 247, 254, 0.99) 100%)';
    const cardBg = dark ? 'rgba(26, 31, 48, 0.72)' : 'rgba(241, 245, 253, 0.86)';
    const border = dark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.11)';
    const borderSoft = dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.07)';
    const fg = dark ? '#F4F7FF' : '#0F172A';
    const muted = dark ? '#94A3B8' : '#475569';
    const dim = dark ? 'rgba(148, 163, 184, 0.42)' : 'rgba(71, 85, 105, 0.46)';
    const shadow = dark
      ? '0 28px 72px rgba(0, 0, 0, 0.68), 0 0 0 1px rgba(255,255,255,0.06) inset'
      : '0 24px 64px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(255,255,255,0.88) inset';

    return `
      * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }
      .backdrop {
        position: fixed; inset: 0; pointer-events: auto; background: transparent;
      }
      .popover {
        position: fixed; pointer-events: auto;
        width: min(796px, calc(100vw - 24px));
        max-height: calc(100vh - 28px);
        overflow-y: auto;
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
      .logo-badge {
        width: 30px; height: 30px; border-radius: 9px;
        background: linear-gradient(135deg, #4285F4 0%, #8E6CFF 52%, #34A853 100%);
        box-shadow: 0 4px 14px rgba(66, 133, 244, 0.35);
        display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 14px; flex-shrink: 0;
      }
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
        display: flex; align-items: center; justify-content: space-between;
        font-size: 10.5px; color: ${muted}; margin-top: 8px;
      }
      .empty-msg { padding: 10px; text-align: center; font-size: 12px; color: ${muted}; }
    `;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function positionPopover(popoverEl, trigger) {
    if (!popoverEl) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Use offsetWidth/offsetHeight (unscaled layout size), NEVER getBoundingClientRect() which is shrunk by scale(0.26) at animation start!
    const pw = popoverEl.offsetWidth || Math.min(796, vw - 24);
    const ph = popoverEl.offsetHeight || 430;
    const rect = trigger && trigger.isConnected ? trigger.getBoundingClientRect() : null;

    let vx = Math.max(12, Math.round((vw - pw) / 2));
    if (!rect) {
      popoverEl.style.left = vx + 'px';
      popoverEl.style.bottom = '64px';
      popoverEl.style.top = 'auto';
      return;
    }

    vx = Math.max(12, Math.min(vw - pw - 12, Math.round(rect.left)));
    popoverEl.style.left = vx + 'px';
    const originX = Math.max(24, Math.min(pw - 24, Math.round((rect.left + rect.width / 2) - vx)));

    if (rect.top >= 260) {
      // Anchor bottom edge 8px above the model selector trigger so it NEVER gets cut off at the bottom!
      const bottomOffset = Math.max(12, Math.round(vh - rect.top + 8));
      popoverEl.style.bottom = bottomOffset + 'px';
      popoverEl.style.top = 'auto';
      popoverEl.style.maxHeight = Math.max(240, Math.round(rect.top - 20)) + 'px';
      popoverEl.style.setProperty('--origin-x', `${originX}px`);
      popoverEl.style.setProperty('--origin-y', '100%');
    } else {
      const topOffset = Math.max(12, Math.round(rect.bottom + 8));
      popoverEl.style.top = topOffset + 'px';
      popoverEl.style.bottom = 'auto';
      popoverEl.style.maxHeight = Math.max(240, Math.round(vh - rect.bottom - 20)) + 'px';
      popoverEl.style.setProperty('--origin-x', `${originX}px`);
      popoverEl.style.setProperty('--origin-y', '0%');
    }
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
      existingDock.__updateSteps?.(steps, activeIdx);
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
        <div class="effort-dock" style="--eff-color:${cur.color};--eff-grad:${cur.grad};--eff-grad-opacity:${cur.gradOpacity};--eff-glow:${cur.glow};--eff-ratio:${ratio};">
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

      let applyTimer = null;
      const scheduleApply = step => {
        if (!step) return;
        if (applyTimer) clearTimeout(applyTimer);
        // Wait 260ms so the CSS glide animation completes at 120fps on a 100% idle main thread
        // before triggering background React menu synchronization!
        applyTimer = setTimeout(() => {
          applyTimer = null;
          step.apply();
        }, 260);
      };

      dock.__updateSteps = (newSteps, newIdx) => {
        liveSteps = newSteps;
        ticks.forEach((b, i) => {
          if (newSteps[i]) b.textContent = newSteps[i].shortLabel;
        });
        if (!dock.classList.contains('dragging') && !applyTimer) {
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
        if (applyTimer) { clearTimeout(applyTimer); applyTimer = null; }
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
      <style>${styles(dark)}</style>
      <div class="backdrop" data-action="close"></div>
      <div class="popover ${skipAnim ? 'is-open no-anim' : ''}" role="dialog" aria-label="${escapeHtml(t('title'))}">
        <div class="header">
          <div class="title-wrap">
            <div class="logo-badge">⚛</div>
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
          <span>${escapeHtml(t('tip'))}</span>
          <span>v1.0</span>
        </div>
      </div>
    `;

    updateSpotlight(byAtomic, activeNum);
    const popoverEl = shadowRoot.querySelector('.popover');
    positionPopover(popoverEl, state.activeTrigger);
    if (!skipAnim && popoverEl) {
      // Force initial layout at scale(0.84) before transitioning to .is-open on next frame
      void popoverEl.offsetHeight;
      requestAnimationFrame(() => {
        popoverEl.classList.add('is-open');
      });
    }

    shadowRoot.querySelector('[data-action="close"]')?.addEventListener('click', () => closePeriodic(false));
    shadowRoot.querySelector('[data-action="show-native"]')?.addEventListener('click', () => closePeriodic(true));
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
      state.selectedElementNum = num;
      state.hoveredElementNum = null;
      await applyModelAndEffort(cellModels[0], null);
    };

    for (const chip of shadowRoot.querySelectorAll('.basin-chip')) {
      const num = Number(chip.dataset.basinNum);
      chip.addEventListener('mouseenter', () => {
        if (state.hoveredElementNum !== num) {
          state.hoveredElementNum = num;
          const curA = E.parseModelInfo(state.currentLabel).element?.number || null;
          updateSpotlight(byAtomic, curA);
        }
      });
      chip.addEventListener('mouseleave', () => {
        if (state.hoveredElementNum === num) {
          state.hoveredElementNum = null;
          const curA = E.parseModelInfo(state.currentLabel).element?.number || null;
          updateSpotlight(byAtomic, curA);
        }
      });
      chip.addEventListener('click', () => void selectElementNum(num));
    }

    for (const cell of shadowRoot.querySelectorAll('.cell')) {
      const num = Number(cell.dataset.num);
      cell.addEventListener('mouseenter', () => {
        if (state.hoveredElementNum !== num) {
          state.hoveredElementNum = num;
          const curA = E.parseModelInfo(state.currentLabel).element?.number || null;
          updateSpotlight(byAtomic, curA);
        }
      });
      cell.addEventListener('mouseleave', () => {
        if (state.hoveredElementNum === num) {
          state.hoveredElementNum = null;
          const curA = E.parseModelInfo(state.currentLabel).element?.number || null;
          updateSpotlight(byAtomic, curA);
        }
      });
      cell.addEventListener('click', () => void selectElementNum(num));
    }

    for (const btn of shadowRoot.querySelectorAll('[data-legacy-idx]')) {
      btn.addEventListener('click', async () => {
        const picked = otherGoogle[Number(btn.dataset.legacyIdx)];
        if (picked) await applyModelAndEffort(picked, null);
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
    const curParsed = E.parseModelInfo(state.currentLabel);
    state.selectedElementNum = curParsed.element ? curParsed.element.number : null;
    setNativeMenusHidden(true);

    const hadCachedModels = state.models.length > 0;
    if (hadCachedModels) {
      state.open = true;
      render(false);
    }

    void (async () => {
      const panel = await ensureNativePanelOpen(true);
      if (!panel) {
        if (!hadCachedModels) setNativeMenusHidden(false);
        return;
      }
      state.models = parsePanelModels(panel);
      if (!hadCachedModels) {
        state.open = true;
        render(false);
      } else if (state.open) {
        syncActiveStatesInPlace();
      }

      const { byAtomic } = groupedModels();
      const activeList = state.selectedElementNum ? (byAtomic.get(state.selectedElementNum) || []) : [];
      if (activeList[0]?.hasEffortGroup && !activeList[0]?.disabled) {
        await readSubmenuEfforts(activeList[0].modelBase);
        closeNativeMenuIfOpen();
        if (state.open) syncActiveStatesInPlace();
      } else {
        closeNativeMenuIfOpen();
      }
    })();
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
