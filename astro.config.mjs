import { defineConfig } from 'astro/config';
import vite from './vite.config.mjs';

export default defineConfig({
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false }
  },
  vite,
  devToolbar: { enabled: false }
});
