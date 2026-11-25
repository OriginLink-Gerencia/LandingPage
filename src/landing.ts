import { defaultLocale, languageTags, translate, type Locale, type MessageKey } from './i18n';

const root = document.documentElement;
const theme = document.querySelector<HTMLButtonElement>('.theme-control')!;
const languageControl = document.querySelector<HTMLAnchorElement>('.language-control')!;
const localeUrls = { es: languageControl.dataset.esUrl!, en: languageControl.dataset.enUrl! };
const form = document.querySelector<HTMLFormElement>('#pilot-form')!;
const submit = form.querySelector('button')!;
const status = form.querySelector('.form-status')!;
const formLocale = form.querySelector<HTMLInputElement>('input[name="locale"]');
const localizedText = document.querySelectorAll<HTMLElement>('[data-i18n]');
const localizedLabels = document.querySelectorAll<HTMLElement>('[data-i18n-label]');
const localizedImages = document.querySelectorAll<HTMLElement>('[data-i18n-image]');
const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')!;
let locale: Locale = root.lang === languageTags.en ? 'en' : defaultLocale;
let formStatus: 'sending' | 'success' | 'error' | undefined;

function updateTheme(dark: boolean) {
  root.dataset.theme = dark ? 'dark' : 'light';
  const t = translate(locale);
  const label = dark ? t.light : t.dark;
  theme.setAttribute('aria-label', label);
  theme.title = label;
}

function updateFormStatus(next: typeof formStatus) {
  formStatus = next;
  status.textContent = next ? translate(locale)[next] : '';
}

function applyLanguage(next: Locale) {
  locale = next;
  const t = translate(locale);
  const alternate = locale === 'es' ? 'en' : 'es';
  root.lang = languageTags[locale];
  document.title = t.title;
  description.content = t.description;
  for (const element of localizedText) element.textContent = t[element.dataset.i18n as MessageKey];
  for (const element of localizedLabels) element.setAttribute('aria-label', t[element.dataset.i18nLabel as MessageKey]);
  for (const figure of localizedImages) figure.querySelector('img')!.alt = t[figure.dataset.i18nImage as MessageKey];
  if (formLocale) formLocale.value = locale;
  updateFormStatus(formStatus);
  updateTheme(root.dataset.theme === 'dark');
  languageControl.href = localeUrls[alternate];
  languageControl.hreflang = languageTags[alternate];
  languageControl.lang = languageTags[alternate];
  languageControl.textContent = alternate.toUpperCase();
  languageControl.setAttribute('aria-label', alternate === 'en' ? 'English' : 'Español');
}

languageControl.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  const next = locale === 'es' ? 'en' : 'es';
  history.pushState(null, '', localeUrls[next] + location.search + location.hash);
  applyLanguage(next);
});
window.addEventListener('popstate', () => {
  const next = location.pathname.replace(/\/$/, '') === localeUrls.en.replace(/\/$/, '') ? 'en' : defaultLocale;
  if (next !== locale) applyLanguage(next);
});

const preference = matchMedia('(prefers-color-scheme: dark)');
let explicitTheme = false;
try { explicitTheme = ['light', 'dark'].includes(localStorage.getItem('originlink-theme') || ''); } catch {}
updateTheme(root.dataset.theme ? root.dataset.theme === 'dark' : preference.matches);
theme.addEventListener('click', () => {
  explicitTheme = true;
  updateTheme(root.dataset.theme !== 'dark');
  try { localStorage.setItem('originlink-theme', root.dataset.theme!); } catch {}
});
preference.addEventListener('change', event => { if (!explicitTheme) updateTheme(event.matches); });

const menu = document.querySelector<HTMLDetailsElement>('.mobile-nav')!;
menu.addEventListener('click', event => {
  if ((event.target as Element).closest('a')) menu.open = false;
});
document.addEventListener('click', event => {
  if (!menu.contains(event.target as Node)) menu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.open) {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }
});

const card = document.querySelector<HTMLElement>('.forecast-card')!;
card.addEventListener('change', event => {
  const input = event.target as HTMLInputElement;
  if (input.name !== 'weeks') return;
  const stock = 36;
  const demand = 39 * Number(input.value);
  document.getElementById('quantity')!.textContent = String(demand - stock);
  document.getElementById('consumption')!.textContent = demand + ' kg';
  card.style.setProperty('--stock-share', (100 * stock / demand) + '%');
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled || !form.reportValidity()) return;
  submit.disabled = true;
  updateFormStatus('sending');
  try {
    const data = new URLSearchParams();
    new FormData(form).forEach((value, key) => data.set(key, String(value).trim()));
    const response = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: data, signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error();
    form.reset();
    updateFormStatus('success');
  } catch {
    updateFormStatus('error');
  } finally {
    submit.disabled = false;
  }
});
