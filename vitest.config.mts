/* Copyright ® 2026 by 柏大衛. All rights reserved. */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

const source = (path: string) => resolve(import.meta.dirname, 'source', path);

export default defineConfig({
   resolve: {
      alias: [
         { find: /^attFixer$/, replacement: source('attFixer') },
         { find: /^basic$/, replacement: source('basic') },
         { find: /^basic-test$/, replacement: source('basic/@test/helper') },
         { find: /^conformance$/, replacement: source('conformance') },
         { find: /^error$/, replacement: source('error') },
         { find: /^error-test$/, replacement: source('error/@test/helper') },
         { find: /^expand$/, replacement: source('expand') },
         { find: /^node$/, replacement: source('node') },
         { find: /^pToken$/, replacement: source('pToken') },
         { find: /^pTokenStream$/, replacement: source('pTokenStream') },
         { find: /^pToken-test$/, replacement: source('pToken/@test/helper') },
         { find: /^flat$/, replacement: source('flat') },
         { find: /^token$/, replacement: source('token') },
         { find: /^token-test$/, replacement: source('token/@test/helper') },
         { find: /^valid$/, replacement: source('valid') },
         { find: /^wellformedness$/, replacement: source('wellformedness') },
         { find: /^xToken$/, replacement: source('xToken') },
         { find: /^xTokenStream$/, replacement: source('xTokenStream') },
      ],
   },
   test: {
      clearMocks: true,
      environment: 'node',
      globals: true,
      pool: 'threads',
      testTimeout: 10_000,
      include: ['source/**/@test/**/*.jest.ts'],
      setupFiles: [
         './build/vitestSetup.ts',
         './source/basic/@test/helper/vitestSetup.ts',
         './source/pToken/@test/helper/vitestSetup.ts',
         './source/valid/@test/helper/vitestSetup.ts',
         './source/wellformedness/@test/helper/vitestSetup.ts',
      ],
      coverage: {
         provider: 'v8',
         reportsDirectory: 'temp/coverage-vitest',
         include: [
            'source/attFixer/**/*.ts',
            'source/basic/**/*.ts',
            'source/demo/**/*.ts',
            'source/expand/**/*Conditional*.ts',
            'source/pToken/**/*.ts',
            'source/flat/**/*.ts',
            'source/valid/**/*.ts',
            'source/wellformedness/**/*.ts',
            'source/xToken/**/*.ts',
         ],
         exclude: ['source/**/@test/**/*.ts'],
      },
   },
});
