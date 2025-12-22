import { browser } from '$app/environment';
import { init, register, getLocaleFromNavigator, locale } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./en.json'));
register('es', () => import('./es.json'));

init({
  fallbackLocale: defaultLocale,
  initialLocale: browser ? getLocaleFromNavigator() ?? defaultLocale : defaultLocale,
});

export { locale };

export function setLocale(newLocale: 'en' | 'es') {
  locale.set(newLocale);
  if (browser) {
    localStorage.setItem('bingo-locale', newLocale);
  }
}

export function initLocaleFromStorage() {
  if (browser) {
    const stored = localStorage.getItem('bingo-locale');
    if (stored === 'en' || stored === 'es') {
      locale.set(stored);
    }
  }
}
