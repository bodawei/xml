/* Copyright ® 2026 by 柏大衛. All rights reserved. */

// Runs a TypeScript script with `require`, so it goes through the Babel hook from
// babelRegister.mjs. (Node would send a `.ts` entry file through its ESM loader, which fails.)
//
//   node --no-experimental-strip-types --import ./build/babelRegister.mjs \
//      -r tsconfig-paths/register ./build/runTs.cjs <script.ts> [args...]
//
// process.argv ends up as [node, script.ts, args...], as it did under ts-node.

const path = require('path');

process.argv.splice(1, 1);
require(path.resolve(process.argv[1]));
