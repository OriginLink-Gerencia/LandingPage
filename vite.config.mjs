import pilot from './server/pilot.mjs';

export default {
  plugins: [pilot],
  server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.pilot-data/**'] } }
};
