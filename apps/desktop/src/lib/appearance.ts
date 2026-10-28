import { effectiveDensity, breakpointFor, type Density, type Theme } from './layout';

export function applyAppearance(theme: Theme, density: Density, width = window.innerWidth) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.density = effectiveDensity(breakpointFor(width), density);
}
