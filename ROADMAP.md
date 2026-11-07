# Roadmap

Long-term, multi-session projects for YAXT / XXUT. One-session tasks belong in
`.context/todos.md` or the PR description.

Status: `idea` → `onhold` → `next` → `active` → `blocked` → `done`

Agents: read this before starting work. Update the overview row and the project's
`Current state` / `Next actions` when work changes them. Only mark something `done`
after its verification steps pass. The initial entries below were seeded from the
README goals and the current code; edit, reorder, or replace them as priorities change.

## Overview

| ID  | Status | Project                                                                                 |
| --- | ------ | --------------------------------------------------------------------------------------- |
| P7  | next   | Bring all pkg dependencies up to date.                                                  |
| P8  | idea   | Try swapping oxfmt in for prettier.                                                     |
| P9  | idea   | Bring oxlint into the picture.                                                          |
| P10 | idea   | Replace jest with with vitest                                                           |
| P11 | idea   | Kill jasmine, move those to vitest.                                                     |
| P12 | idea   | Switch to one of the mono repo systems so we can lock down cross "package" dependencies |
| P13 | idea   | Clarify/fix the impossible to "fix" core of the parsing loop                            |
| P1  | onhold | Finish the `basic` extractor rewrite                                                    |
| P2  | idea   | Support documents larger than memory                                                    |
| P3  | idea   | Browser build                                                                           |
| P6  | idea   | Documentation and public API                                                            |

## P7: Bring all package dependencies up to date

### Goal

The package dependencies and devDependencies are all about 4 years old. Bring them up to current best practices for each of the packages.

### Done when

`npm outdated` is empty and `npm audit` reports no critical or high advisories, with
both suites still passing at their baseline counts. Full criteria in
`doc/dependencyUpgrade.md`. The only relaxation from the original goal is the audit
line: a clean audit including moderate and low advisories is not reliably achievable
in a dev-only toolchain.

Scope rule: P7 modernizes every dependency regardless of whether a later project
(P8, P9, P10, P11) would replace the tool. Replacement is decided later, from a
current baseline rather than a four-year-old one.

### Current state

DEP-1 … DEP-12 are done (see the progress log in `doc/dependencyUpgrade.md`); DEP-13
(TypeScript 7) remains. `doc/dependencyUpgrade.md` holds the staged plan
(DEP-1 … DEP-13), the measured baseline, and the peer-range constraints that fix
the ordering.

Baseline as of 2026-11-05: 930 packages, 59 audit advisories (27 critical), 29 of 43
direct deps behind. Both suites pass (265 Jest suites / 9768 tests, 336 Jasmine
specs). 26 of the 27 criticals sit in unreferenced Babel 6 packages, so DEP-1 removes
them with no version changes.

Three stages can each take a session or more: DEP-3 (TypeScript 4.6 → 6.0, unknown
type errors), DEP-6 (ESLint 10 + ESM flat config, which also means dropping both
airbnb configs) and DEP-11 (Jasmine 7, which removed the `jsLoader` option this repo
depends on — the alias-resolution mechanism has to be replaced, not reconfigured).

TypeScript 7 is in scope, and is decided. It ships no programmatic compiler API, so
typescript-eslint refuses it outright; DEP-13 therefore replaces typescript-eslint
with `ts7-eslint`, which reruns the published 8.66.0 rules unmodified over a rebuilt
compiler layer. That makes DEP-6 a hard prerequisite, since `ts7-eslint` needs
ESLint 9 or 10. Alternatives considered (oxlint + tsgolint, staying at 6.0.x, a
`@typescript/typescript6` hybrid) are recorded in the plan so the choice is not
relitigated from memory.

**DEP-13 was attempted on 2026-11-06 and is blocked** (WIP on branch `bodawei/dep-13-wip`,
details in the DEP-13 section of `doc/dependencyUpgrade.md`). `tsc` on TS 7 is clean, but
three independent problems stand in the way:

1. `ts-node` cannot run on TS 7, so Jasmine dies. **Solved:** `@babel/register` (ESM-only in
   Babel 8, loaded with `--import`) plus `tsconfig-paths/register` ran all 336 specs on TS 7.
   Not yet tried on TS 6. Node's own type stripping alone is *not* an option (no path aliases).
2. `import-x` loads `@typescript-eslint/parser` by name and gets the real TS 7. **Solved:** drop
   `import-x/parsers` and turn off `namespace`, `export`, `default`, `no-named-as-default`. All had
   0 findings on TS 6 and `tsc` covers the same ground.
3. Three `ts7-eslint@0.2.1` rules crash (upstream bugs): `no-deprecated` (115 files, 0 baseline
   findings, so safe to turn off), `no-unnecessary-condition` (2 files, 49 baseline findings) and
   `no-unnecessary-type-assertion` (1 file, 15 findings). Open.

With those three rules and the `import-x` settings off, every other rule reproduces the TS 6
counts exactly (3264 = 3313 − 49). Also learned: the peer-warning override must cover
`@typescript-eslint/eslint-plugin` as well as the parser, and `ts7-eslint` must load before
`eslint-plugin-import-x` (top-level await, so use dynamic imports in `eslint.config.mjs`).

Plan to increment toward TS 7, each step its own PR on TS 6: (a) swap `ts-node` for
`@babel/register`; (b) the `import-x` cleanup; (c) fix the 64 existing `no-unnecessary-*`
findings by hand so those rules report 0 (35 are an unneeded `?.`; list reproduced by
`npx eslint --config ./eslint.config.mjs source --format unix | grep -E "no-unnecessary-(condition|type-assertion)"`);
(d) the TS 7 swap, turning off the three rules with a comment each so re-enabling is mechanical.
Fallback if (d) stays blocked: remain on TypeScript 6.0.x.

### Next actions

-  [x] Evaluate all the packages and put together a proposed order for upgrading
-  [x] Decide the TypeScript 7 approach (`ts7-eslint`, DEP-13)
-  [x] DEP-1 … DEP-5 (dead deps, Prettier 3, TypeScript 6.0, `@types/node` 26, typescript-eslint 8)
-  [x] DEP-6a (remove airbnb-base)
-  [x] DEP-6b (prune config; decisions on adopting stylistic/strict presets left open)
-  [x] DEP-6c (flat config on ESLint 9), 6d (ESLint 10 + import-x)
-  [x] DEP-7 … DEP-11 (Jest 30, Babel 8, iconv-lite, nodemon 3, Jasmine 7)
-  [x] DEP-12 (`properties-parser`)
-  [ ] Swap `ts-node` for `@babel/register` for Jasmine (verify 336 specs on TS 6 first)
-  [ ] `import-x` cleanup (drop 4 parsing rules and the parsers setting; counts must not change)
-  [ ] Hand-fix the 64 `no-unnecessary-condition` / `no-unnecessary-type-assertion` findings
-  [ ] DEP-13 (TS 7 swap); see the plan. One PR each, re-measuring the baseline table in
       every PR description.

## P8: Try swapping oxfmt in for prettier

### Goal

Oxfmt claims basically prettier compatibility with greater speed

### Done when

formatting works and we have built in the preferred tool

### Current state

This is unstarted

### Next actions

-  [ ] Measure prettier performance, then try out oxfmt to see its performance (consider making a prettier config change so it has to touch every file, and then do the same with oxfmt)
-  [ ] if oxfmt causes no concerns, then replace prettier with oxfmt.

## P1: Finish the `basic` extractor rewrite

**Goal:** Replace the legacy extractor classes with the `ExtractorNew` design, so
there is one extractor implementation and one set of tests.

**Done when:** `source/basic/extractor` contains only the new implementation, all
callers use it, and the Jest suite passes.

**Current state:** `ExtractorNew.ts` and `SpaceExtractorNew.ts` exist but are
incomplete. The legacy `Extractor.ts` and `SpaceExtractor.ts` are still the ones
used by the rest of the module.

**Next actions:**

-  [ ] Finish `ExtractorNew` and `SpaceExtractorNew` and add their Jest specs.
-  [ ] Port the remaining extractors (All, Char, Digit, Match, MultiMatch, Peek, Word).
-  [ ] Switch `defaultExtractors.ts` to the new classes.
-  [ ] Delete the legacy files and run `npm run jest:all`.

**Notes:** `source/basic/RANGES.md` records the open questions about ranges in
segments, and `source/basic/README.md` documents the token model.

## P2: Support documents larger than memory

**Goal:** Make the streaming pipeline usable for documents that cannot be held in
memory, as promised in the README.

**Done when:** A documented entry point can process a large document with bounded
memory, and a benchmark or test exercises that path.

**Current state:** The pipeline is stream-shaped, but `STokenSource` and parts of
the parsing/expansion path may retain the full document text.

**Next actions:**

-  [ ] Identify every place that buffers the full document.
-  [ ] Define the memory and back-pressure contract for the stream entry point.
-  [ ] Add a repeatable large-input benchmark.

## P3: Browser build

**Goal:** Make the toolkit usable in the browser as well as Node, as promised in
the README.

**Done when:** A browser bundle can parse and process a document in a browser test,
with no Node-only APIs on the core path.

**Current state:** The core still depends on Node-oriented pieces (for example
`stream` and `iconv-lite`) and there is no browser entry point or build.

**Next actions:**

-  [ ] Define supported environments and the intended browser entry point.
-  [ ] Inventory Node-only dependencies and decide replacements or adapters.
-  [ ] Add a minimal browser smoke test and a bundling step.

## P4: Consolidate the test suites on Jest

**Goal:** Have one test runner, so there is one convention and one command.

**Done when:** No Jasmine specs remain, `build/jasmine.json` is removed, and
`npm test` runs the Jest suite.

**Current state:** Jest covers most of the repo (`*.jest.ts`, 265 suites). Jasmine
still runs 336 specs via `npm test` and nodemon.

**Next actions:**

-  [ ] Inventory the remaining Jasmine files and their helpers.
-  [ ] Port them to `@test/*.jest.ts`, keeping the existing coverage.
-  [ ] Remove the Jasmine config, nodemon script, and the `--no-experimental-strip-types` workaround.
-  [ ] Update `AGENTS.md` and the README once the switch is complete.

**Notes:** none outstanding.

## P5: Toolchain modernization

**Goal:** A predictable toolchain with a supported Node version and a green
type-check/lint baseline.

**Done when:** The documented Node version is supported, `npm run check:types` is
green, and every npm script points at paths that exist.

**Current state:** The project is used on Node 26 but was written for Node 17-era
tooling. `check:types` fails on `source/node/@test/data/flatDocs.json`, the `check`
script references the removed `source/stringify` directory, and lint has a large
pre-existing error baseline.

**Next actions:**

-  [ ] Decide and document the supported Node version(s).
-  [ ] Fix or exclude the `flatDocs.json` type-check failure.
-  [ ] Repair or remove the stale scripts (`check`, `lint:all`, `build:locale`).
-  [ ] Reduce the lint baseline, starting with `source/basic` and `source/valid`.

## P6: Documentation and public API

**Goal:** A newcomer can understand what the project is, how the pipeline fits
together, and which APIs are public.

**Done when:** The root README explains the project and the architecture, and each
subsystem README is current.

**Current state:** The root README is mostly a title and a goals list ("What Is It"
is empty). Some subsystem docs are stale; for example, `source/conformance/README.md`
still describes a Jasmine `.test.ts` file.

**Next actions:**

-  [ ] Write the root architecture overview: modules, data flow, and entry points.
-  [ ] Update the conformance and node READMEs to match the current Jest layout.
-  [ ] Document the public API surface and what is internal.
