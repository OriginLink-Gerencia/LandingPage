import { defineConfig } from 'astro/config';
import vite from './vite.config.mjs';

export default defineConfig({ vite, devToolbar: { enabled: false } });
