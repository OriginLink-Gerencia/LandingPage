const root = document.documentElement;
const theme = document.querySelector<HTMLButtonElement>('.theme-control')!;
function updateTheme(dark: boolean) {
  root.dataset.theme = dark ? 'dark' : 'light';
  theme.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  theme.title = theme.getAttribute('aria-label')!;
}
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

const form = document.querySelector<HTMLFormElement>('#pilot-form')!;
const submit = form.querySelector('button')!;
const status = form.querySelector('.form-status')!;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled || !form.reportValidity()) return;
  submit.disabled = true;
  status.textContent = 'Enviando tu solicitud…';
  try {
    const data = new URLSearchParams();
    new FormData(form).forEach((value, key) => data.set(key, String(value).trim()));
    const response = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: data, signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error();
    form.reset();
    status.textContent = 'Solicitud registrada. Gracias por tu interés en el piloto.';
  } catch {
    status.textContent = 'No pudimos confirmar el registro. Revisa tus datos y vuelve a intentarlo.';
  } finally {
    submit.disabled = false;
  }
});
