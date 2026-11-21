import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInjectedSource } from '../compat/runtime-ui.mjs';
import { compareSemver, formatTag, UPDATE_FILES } from '../compat/updater.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const require = createRequire(import.meta.url);
const createElements = require('../compat/elements.cjs');
const E = createElements();

test('Periodic table contains all 118 elements with unique atomic numbers', () => {
  assert.equal(E.ELEMENTS.length, 118);
  assert.equal(E.BY_NUMBER.size, 118);
  assert.equal(E.BY_NUMBER.get(1).symbol, 'H');
  assert.equal(E.BY_NUMBER.get(6).symbol, 'C');
  assert.equal(E.BY_NUMBER.get(10).symbol, 'Ne');
  assert.equal(E.BY_NUMBER.get(18).symbol, 'Ar');
  assert.equal(E.BY_NUMBER.get(118).symbol, 'Og');
});

test('Google vs non-Google model classification keeps non-Google models untouched', () => {
  assert.equal(E.isGoogleModel('Gemini 4 Neon (Medium)'), true);
  assert.equal(E.isGoogleModel('Gemini 4 Carbon (High)'), true);
  assert.equal(E.isGoogleModel('Gemini 4 Hydrogen'), true);
  assert.equal(E.isGoogleModel('Gemini 4 Argon (Max)'), true);
  assert.equal(E.isGoogleModel('Gemini 3.8 Flash (High)'), true);

  // Non-Google models MUST return false
  assert.equal(E.isGoogleModel('Claude Sonnet 4.6'), false);
  assert.equal(E.isGoogleModel('Claude Opus 4.5 (High)'), false);
  assert.equal(E.isGoogleModel('GPT-OSS 120B'), false);
  assert.equal(E.isGoogleModel('o3-mini'), false);
  assert.equal(E.isGoogleModel('DeepSeek R1'), false);
});

test('Gemini 4 element matching and effort parsing', () => {
  const neon = E.parseModelInfo('Gemini 4 Neon (Medium)');
  assert.equal(neon.isGoogle, true);
  assert.equal(neon.element?.number, 10);
  assert.equal(neon.element?.symbol, 'Ne');
  assert.equal(neon.effort, 'medium');

  const carbon = E.parseModelInfo('Gemini 4 Carbon (High)');
  assert.equal(carbon.element?.number, 6);
  assert.equal(carbon.effort, 'high');

  const hydrogen = E.parseModelInfo('Gemini 4 Hydrogen (Low)');
  assert.equal(hydrogen.element?.number, 1);
  assert.equal(hydrogen.effort, 'low');

  const argon = E.parseModelInfo('Gemini 4 Argon (Max)');
  assert.equal(argon.element?.number, 18);
  assert.equal(argon.effort, 'max');

  const neonXHigh = E.parseModelInfo('Gemini 4 Neon (XHigh)');
  assert.equal(neonXHigh.element?.number, 10);
  assert.equal(neonXHigh.effort, 'xhigh');

  const neonZh = E.parseModelInfo('Gemini 4 Neon 极高');
  assert.equal(neonZh.element?.number, 10);
  assert.equal(neonZh.effort, 'xhigh');

  const legacy = E.parseModelInfo('Gemini 3.5 Pro');
  assert.equal(legacy.isGoogle, true);
  assert.equal(legacy.element, null);
});

test('Injected renderer bundle has valid JavaScript syntax', () => {
  const elementsCjs = readFileSync(join(ROOT, 'compat', 'elements.cjs'), 'utf8');
  const widgetCjs = readFileSync(join(ROOT, 'compat', 'periodic-widget.cjs'), 'utf8');
  const bundle = buildInjectedSource(elementsCjs, widgetCjs);
  assert.ok(bundle.includes('__agPeriodicElementsFactory'));
  // Validate JS syntax via Function constructor (does not execute)
  assert.doesNotThrow(() => new Function(bundle));
});

test('GitHub updater semver comparison and allowlist integrity', () => {
  assert.equal(compareSemver('1.3.0', '1.2.0'), 1);
  assert.equal(compareSemver('v1.3', '1.3.0'), 0);
  assert.equal(compareSemver('v1.2.1', '1.3.0'), -1);
  assert.equal(compareSemver('2.0.0', '1.9.9'), 1);
  assert.equal(formatTag('1.3.0'), 'v1.3');
  assert.equal(formatTag('1.3.2'), 'v1.3.2');
  assert.ok(UPDATE_FILES.includes('compat/periodic-widget.cjs'));
  assert.ok(UPDATE_FILES.includes('compat/updater.mjs'));
  assert.ok(UPDATE_FILES.every(p => !p.includes('..') && !p.startsWith('/')));
});
