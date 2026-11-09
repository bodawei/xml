# Agent notes

This repository is **YAXT / XXUT / Something**, a TypeScript XML toolkit. It is organized as a
pipeline: `basic` → `pToken` → `token` / `xToken` / `flat` → `wellformedness` /
`valid`, with `node` and `demo` on top.

## Read first

-  `ROADMAP.md` — long-term projects and their current state.
-  `doc/codingStyle.md` and `doc/BEST-PRACTICES.md` — written conventions.
-  The `README.md` of the subsystem you are changing (`source/*/README.md`).

## Project tracking

-  `ROADMAP.md` is the source of truth for multi-session projects.
-  Read it before starting work. If a request does not fit an existing item, add an
   item or ask; do not silently expand scope.
-  At the end of a session, update only what actually changed: status, current state,
   and next action. Mark an item `done` only after its verification steps pass.
-  One-session tasks belong in `.context/todos.md` or the PR description, never in
   `ROADMAP.md`. `.context/` is local to a workspace and is not committed.

## Commands

| Purpose            | Command                                                      |
| ------------------ | ------------------------------------------------------------ |
| Jasmine specs      | `npm test` (nodemon; watches and reruns)                     |
| All Jest specs     | `npm run jest:all`                                           |
| One Jest spec      | `npx jest --config ./jest.config.js <path> --coverage=false` |
| Type-check         | `npm run check:types` (TypeScript 7; should report no errors) |
| Lint touched files | `npx eslint --config ./eslint.config.mjs <files>`            |
| Format check       | `npx oxfmt --check <files>`                                  |

## Known pre-existing failures

Do not treat these as regressions, and do not fix them as part of unrelated work:

-  `npm run lint` reports pre-existing errors, notably in `source/wellformedness/`,
   and some in `source/basic/` and `source/valid/`.
-  `@typescript-eslint/no-deprecated`, `no-unnecessary-condition` and
   `no-unnecessary-type-assertion` are turned off in `eslint.config.mjs` because they crash
   `ts7-eslint`. Do not "fix" that by turning them back on until `ts7-eslint` is fixed.
-  Do not run repo-wide `npm run lint` casually: it is configured with `--fix` and
   rewrites files.

## Code style

-  Canonical reference: `source/xToken/`. It has been carefully and thoroughly
   worked on by hand to be a "finished version" that could be shipped. Always use it
   as the standard for naming, formatting, and general code arrangement. When in
   doubt, ask before doing something different, or if something in that directory
   seems inconsistent.
-  `source/basic/` and `source/valid/` follow the same conventions and are the two
   modules under the strict ESLint configuration; use them for foundational patterns
   that `xToken` does not cover.
-  Match: the copyright header, camelCase filenames, 3-space indentation, import
   grouping (external, then internal aliases such as `basic` / `pToken` / `token`,
   then relative), declarations before logic with a blank line after, and a `@test/`
   directory containing `*.jest.ts` files.
-  Copyright header years: every source file starts with a comment of the form
   `/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */` (or a single year,
   `2021`). Whenever you touch a file, set the last year to the current year, keeping
   the first year: `2017-2021` becomes `2017-2026`, and a single `2021` becomes
   `2021-2026`. If you create a new file that has no such comment, add it as the first
   line with the current year alone (`/* Copyright ® 2026 by 柏大衛. All rights reserved. */`).
   Do this for files you edit by hand; do not mass-update untouched files.
-  `source/basic/extractor/*New.ts` is a mid-rewrite experiment; use completed files
   as the design model, not unfinished ones.
-  oxfmt (config in `.oxfmtrc.json`, Prettier-compatible) and ESLint are authoritative for formatting. Run them on the files you
   touch before finishing.
-  If the exemplar and `doc/codingStyle.md` disagree, the written doc wins.
-  Error and problem tokens must cite spec sections at the end of the message in the
   form `(§1.2.3)`.

## Tests

-  Jest specs live in `source/**/@test/**/*.jest.ts`. Add new tests as Jest.
-  Jasmine specs live in `source/**/*test.ts` and are run by `npm test`.
-  Do not add new Jasmine specs unless you are extending an existing Jasmine file.
-  The Jasmine scripts (and `build:xmlconf` / `build:flat`) run
   `node --no-experimental-strip-types --import ./build/babelRegister.mjs -r tsconfig-paths/register`.
   `babelRegister.mjs` compiles each `.ts` file with Babel as it is required (types are
   stripped, not checked; `npm run check:types` does that). Keep `--no-experimental-strip-types`:
   Jasmine 7 always tries `import()` first, and Node's native type stripping would load the
   `.ts` specs itself, bypassing the Babel hook and `tsconfig-paths` (aliases such as `basic`
   then fail). With it off, `import()` fails with `ERR_UNKNOWN_FILE_EXTENSION` and Jasmine
   falls back to `require()`. A `.ts` script run directly as the entry file has no such
   fallback, so the build scripts go through `build/runTs.cjs`.
-  Jasmine 7 throws on duplicate suite or spec names within a parent. Give each a
   unique name.
-  Import through the `tsconfig.json` path aliases rather than long relative paths.
   If you move a module, update the alias and the relevant `index.ts` export.

## Definition of done

-  Relevant specs pass: `npm run jest:all` and/or `npm test`.
-  `npx eslint --config ./eslint.config.mjs` passes for the files you touched (no new
   errors or warnings).
-  `npx oxfmt --check` passes for the files you touched.
-  Type-check your changes: `npm run check:types` should report no errors.
-  `ROADMAP.md` is updated if the work changed a project's state.
-  Commit messages follow the existing `fix(Area): ...` / `feat(Area): ...` pattern.
-  PRs target `main`.
