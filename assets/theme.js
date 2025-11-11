const THEME_STORAGE_KEY = 'tikswap-theme';
const DARK = 'dark';
const LIGHT = 'light';

const prefersLight = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

const resolveInitialTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === DARK || stored === LIGHT) return stored;
  } catch {
    /* ignore */
  }
  return prefersLight() ? LIGHT : DARK;
};

const applyTheme = theme => {
  const next = theme === LIGHT ? LIGHT : DARK;
  document.body.dataset.theme = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const isLight = next === LIGHT;
    toggle.textContent = isLight ? '🌙' : '☀️';
    toggle.setAttribute(
      'aria-label',
      isLight ? '切換為深色模式' : '切換為亮色模式'
    );
    toggle.setAttribute('title', isLight ? '切換為深色模式' : '切換為亮色模式');
  }
};

const initThemeToggle = () => {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const current = document.body.dataset.theme === LIGHT ? LIGHT : DARK;
    const next = current === LIGHT ? DARK : LIGHT;
    applyTheme(next);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(resolveInitialTheme());
  initThemeToggle();
});
