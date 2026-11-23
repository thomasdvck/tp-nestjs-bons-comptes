import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Vitest : même API que Jest (describe / it / expect / vi).
const config = defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2022',
      },
      module: {
        type: 'es6',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
  },
});

export default config;
