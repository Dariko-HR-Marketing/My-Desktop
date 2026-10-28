// Generates src/styles/tokens.css from docs/design-tokens.json. Run: npm run tokens
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const px = (n) => `${n}px`;

const colorVars = (c, indent) =>
  Object.entries(c)
    .map(([k, v]) => `${indent}--${kebab(k)}: ${v};`)
    .join('\n');

export function buildTokensCss(t) {
  const typeVars = Object.entries(t.type)
    .flatMap(([name, s]) => [
      `  --fs-${name}: ${px(s.size)};`,
      `  --fw-${name}: ${s.weight};`,
      ...(s.lineHeight ? [`  --lh-${name}: ${s.lineHeight};`] : []),
      ...(s.letterSpacing ? [`  --ls-${name}: ${s.letterSpacing};`] : []),
    ])
    .join('\n');
  const space = t.space.map((v, i) => `  --space-${i + 1}: ${px(v)};`).join('\n');
  const radius = Object.entries(t.radius)
    .map(([k, v]) => `  --radius-${k}: ${px(v)};`)
    .join('\n');
  const shadow = Object.entries(t.shadow)
    .map(([k, v]) => `  --shadow-${k}: ${v};`)
    .join('\n');
  const apps = Object.entries(t.apps)
    .map(([k, v]) => `  --app-${k}: ${v};`)
    .join('\n');
  const groups = Object.entries(t.tabGroups)
    .map(([k, v]) => `  --tabgroup-${k}: ${v};`)
    .join('\n');
  const bp = Object.entries(t.breakpoints)
    .map(([k, v]) => `  --bp-${k}: ${px(v)};`)
    .join('\n');
  const s = t.size;

  return `/* GENERATED from docs/design-tokens.json by scripts/gen-tokens.mjs — do not edit by hand. */
:root {
  --font-sans: ${t.font.sans};
  --font-mono: ${t.font.mono};
${typeVars}
${space}
${radius}
${shadow}
${apps}
${groups}
${bp}
  --control-h: ${px(s.control.comfortable)};
  --row-h: ${px(s.row.comfortable)};
  --nav-item-h: ${px(s.navItem.comfortable)};
  --sidebar-w-full: ${px(s.sidebar.full)};
  --sidebar-w-collapsed: ${px(s.sidebar.collapsed)};
  --topbar-h: ${px(s.topbar)};
  --bottomnav-h: ${px(s.bottomNav)};
  --content-max: ${px(s.contentMax)};
  --drawer-w: ${px(s.drawer)};
  --palette-w: ${px(s.palette)};
  --motion-fast: ${t.motion.fast};
  --motion-base: ${t.motion.base};
  --easing: ${t.motion.easing};
  color-scheme: light;
${colorVars(t.color.light, '  ')}
}

:root[data-theme='light'] {
  color-scheme: light;
}

:root[data-theme='dark'] {
  color-scheme: dark;
${colorVars(t.color.dark, '  ')}
}

@media (prefers-color-scheme: dark) {
  :root[data-theme='system'] {
    color-scheme: dark;
${colorVars(t.color.dark, '    ')}
  }
}

:root[data-density='compact'] {
  --control-h: ${px(s.control.compact)};
  --row-h: ${px(s.row.compact)};
  --nav-item-h: ${px(s.navItem.compact)};
}
`;
}

const here = path.dirname(fileURLToPath(import.meta.url));
export const TOKENS_JSON = path.resolve(here, '../../../docs/design-tokens.json');
export const TOKENS_CSS = path.resolve(here, '../src/styles/tokens.css');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tokens = JSON.parse(fs.readFileSync(TOKENS_JSON, 'utf8'));
  fs.writeFileSync(TOKENS_CSS, buildTokensCss(tokens));
  console.log('tokens.css written');
}
