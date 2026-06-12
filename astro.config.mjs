// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';
import { esMX } from '@clerk/localizations';

export default defineConfig({
  site: 'https://trato.flouvia.com',
  output: 'server',

  integrations: [clerk({ localization: esMX, afterSignOutUrl: '/' })],

  adapter: vercel(),
});
