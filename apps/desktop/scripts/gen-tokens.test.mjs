import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildTokensCss, TOKENS_CSS, TOKENS_JSON } from './gen-tokens.mjs';

const tokens = JSON.parse(fs.readFileSync(TOKENS_JSON, 'utf8'));

describe('design tokens', () => {
  it('tokens.css is in sync with docs/design-tokens.json (run `npm run tokens`)', () => {
    expect(fs.readFileSync(TOKENS_CSS, 'utf8')).toBe(buildTokensCss(tokens));
  });

  it('defines light, dark, system and compact blocks', () => {
    const css = buildTokensCss(tokens);
    expect(css).toContain('--accent: #1D4ED8;');
    expect(css).toContain(":root[data-theme='dark']");
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('--control-h: 36px;');
  });

  it('dark and light define the same color keys', () => {
    expect(Object.keys(tokens.color.dark).sort()).toEqual(Object.keys(tokens.color.light).sort());
  });
});
