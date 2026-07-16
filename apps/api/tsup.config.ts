import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node20',
  outDir: 'dist',
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    // Keep Prisma client as external (needs generated client at runtime)
    '@prisma/client',
    // Native/binary modules
    'sharp',
    'bcryptjs',
    'ioredis',
    'redis',
    'firebase-admin',
    'passport-google-oauth20',
    'passport-microsoft',
  ],
  noExternal: [
    // Bundle workspace packages (they're raw .ts)
    '@house-os/config',
    '@house-os/types',
    '@house-os/database',
  ],
});
