import { effectiveDensity, breakpointFor, type Density, type Theme } from './layout';

export function applyAppearance(
  theme: Theme,
  density: Density,
  fontSize: 'sm' | 'md' | 'lg' = 'md',
  width = window.innerWidth,
) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.density = effectiveDensity(breakpointFor(width), density);
  root.dataset.font = fontSize;
}
