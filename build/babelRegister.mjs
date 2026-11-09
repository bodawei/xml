/* Copyright ® 2026 by 柏大衛. All rights reserved. */

// Lets plain `node` run this repo's TypeScript (specs and build scripts) by compiling each .ts
// file with Babel as it is required. Used instead of ts-node, which cannot run on TypeScript 7
// because it needs the compiler API that TypeScript 7 no longer ships.
//
// It strips types and does no type-checking; `npm run check:types` does that. Babel's CommonJS
// output assigns `exports.x = x` (writable), which the Jasmine specs rely on for `spyOn`.
//
// Use with `--import ./build/babelRegister.mjs -r tsconfig-paths/register`, and keep
// `--no-experimental-strip-types` (see AGENTS.md).

import register from '@babel/register';

register({ extensions: ['.ts'] });
