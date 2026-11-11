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
| P7  | done   | Bring all pkg dependencies up to date.                                                  |
| P8  | done   | Try swapping oxfmt in for prettier.                                                     |
| P9  | done   | Bring oxlint into the picture.                                                          |
| P10 | idea   | Replace jest with with vitest                                                           |
| P11 | idea   | Kill jasmine, move those to vitest.                                                     |
| P12 | idea   | Switch to one of the mono repo systems so we can lock down cross "package" dependencies |
| P13 | idea   | Clarify/fix the impossible to "fix" core of the parsing loop                            |
| P14 | idea   | Make `xToken` lint-perfect on as near to the stock oxlint settings as possible          |
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

**P7 is complete as of 2026-11-08:** DEP-1 … DEP-13 and the final bumps are done (see the
progress log in `doc/dependencyUpgrade.md`), `npm outdated` is empty, and `npm audit` has 0
critical and 0 high. One follow-up remains, and it does not block closing P7: re-enabling three
lint rules that crash `ts7-eslint` (see below). `doc/dependencyUpgrade.md` holds the staged plan
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

`tsc` on TS 7 is clean. `ts7-eslint@0.2.1` (the
replacement for typescript-eslint, since TS 7 ships no compiler API) had three independent
problems, details in `doc/dependencyUpgrade.md`:

1. `ts-node` cannot run on TS 7. Solved: `@babel/register` plus `tsconfig-paths/register`
   (Jasmine and the two build scripts). Node's own type stripping alone is not an option (no
   path aliases).
2. `import-x` loads `@typescript-eslint/parser` by name and gets the real TS 7. Solved: dropped
   `import-x/parsers` and turned off `namespace`, `export`, `default`, `no-named-as-default`.
3. Three `ts7-eslint` rules crash (upstream bugs, a stack trace aborts the whole lint run, and
   `eslint-disable` comments do not help): `no-deprecated` (115 files, 0 findings on TS 6),
   `no-unnecessary-condition` (49 findings) and `no-unnecessary-type-assertion` (15 findings).
   They are turned off in `eslint.config.mjs` with a comment; the findings are deliberately not
   hand-fixed because verifying the types is expensive. **Re-enable them when `ts7-eslint`
   fixes the crashes**, or delete the block if we stay on TS 6.

Also learned: the peer-warning override must cover `@typescript-eslint/eslint-plugin` as well
as the parser, and `ts7-eslint` must load before `eslint-plugin-import-x` (it uses top-level
await, so `eslint.config.mjs` uses dynamic imports). Fallback if the swap stays blocked: remain
on TypeScript 6.0.x.

### Next actions

-  [x] Evaluate all the packages and put together a proposed order for upgrading
-  [x] Decide the TypeScript 7 approach (`ts7-eslint`, DEP-13)
-  [x] DEP-1 … DEP-5 (dead deps, Prettier 3, TypeScript 6.0, `@types/node` 26, typescript-eslint 8)
-  [x] DEP-6a (remove airbnb-base)
-  [x] DEP-6b (prune config; decisions on adopting stylistic/strict presets left open)
-  [x] DEP-6c (flat config on ESLint 9), 6d (ESLint 10 + import-x)
-  [x] DEP-7 … DEP-11 (Jest 30, Babel 8, iconv-lite, nodemon 3, Jasmine 7)
-  [x] DEP-12 (`properties-parser`)
-  [x] Swap `ts-node` for `@babel/register` (Jasmine and the two build scripts)
-  [x] `import-x` cleanup (dropped 4 parsing rules and the parsers setting; per-rule counts unchanged)
-  [x] Turn off `no-deprecated`, `no-unnecessary-condition`, `no-unnecessary-type-assertion` (they crash ts7-eslint)
-  [x] DEP-13 (TS 7 swap): `tsc` 6.5× faster (2.39 s → 0.37 s); details in `doc/dependencyUpgrade.md`
-  [x] Final bumps: `eslint-plugin-import-x` 4.18.1, `globals` 17.14.0; cleared the 2 high advisories (`braces`, `picomatch`)
-  [x] Follow-up: the three rules are on again, under oxlint rather than `ts7-eslint` (P9).

## P8: Try swapping oxfmt in for prettier

### Goal

Oxfmt claims basically prettier compatibility with greater speed

### Done when

formatting works and we have built in the preferred tool

### Current state

**Done 2026-11-08.** `prettier` and `eslint-plugin-prettier` are removed; `oxfmt` 0.77 formats
the repo from `.oxfmtrc.json` (migrated with `oxfmt --migrate=prettier`, identical options).
`eslint-config-prettier` stays, to switch off formatting rules that conflict with the formatter.

Measured on 649 `source/**/*.ts` files: `prettier --check` 2.2-2.5 s, `oxfmt --check` 0.25 s
(about 10x); a full rewrite of every file takes 2.2 s vs 0.09 s. Output is nearly identical: after
formatting, only 3 files differ, all in how a long union type argument is broken across lines
(oxfmt puts one `|` member per line). The 91 files that were already non-conforming under
prettier were left alone, so the non-conforming count is still 91. ESLint total dropped from 3249
to 2795, exactly the 454 `prettier/prettier` findings that no longer exist.

### Next actions

-  [x] Measure prettier performance, then try out oxfmt.
-  [x] oxfmt caused no concerns, so it replaces prettier.
-  [x] Reformatted the 91 non-conforming files in their own format-only commit (done with P9,
       because enabling oxfmt import sorting rewrites the whole tree anyway).

## P9: Try swapping oxlint

### Goal

oxlint is being touted as the newer bester faster eslint. It is not clear if the right answer is:
completely cut over to using oxlint, staying entirely with eslint, or some hybrid approach. We'd
like to explore all three routes: Get timings and number of lint errors from all eslint and all
oxlint. If we go completely oxlint, do we have the same number of lint errors? Do we get the same
rule coverage with oxlint as without? In a hybrid approach, do we put oxlint under eslint's
control or vice versa? Can oxlint use eslint rules to supplement those it ships with? Do things
like prettier, now oxfmt, provide lint rules of oxlint? In short, we know nothing about the
technical options for proceeding with an existing project.

### Done when

We have decided which path to pursue and have done it.

### Current state

**Done 2026-11-10.** Complete cutover. `eslint`, `eslint-config-prettier`,
`eslint-plugin-import-x`, `ts7-eslint`, `globals` and the unused local
`eslint-plugin-custom-rules` are gone, along with `eslint.config.mjs` and `build/eslint/`.
`oxlint` 1.93 reads `.oxlintrc.jsonc`; type-aware rules run through `oxlint-tsgolint`
(`"options": { "typeAware": true }`), which needs the TypeScript 7 toolchain from DEP-13.

`.oxlintrc.jsonc` was derived from `npx @oxlint/migrate --type-aware eslint.config.mjs` but is
hand-written: the generated file lost the typescript-eslint sets (it only converts explicit
`rules` entries, not `extends` presets) and filled the output with ~190 `@stylistic/*` entries
from `eslint-config-prettier` that oxlint has no rules for. Each group's rules are therefore
listed explicitly, extracted from `eslint --print-config` for one file per group.

**Timings** (whole repo, warm, this laptop):

| Command                             | ESLint 10 + ts7-eslint | oxlint 1.93 + tsgolint |
| ----------------------------------- | ---------------------- | ---------------------- |
| whole tree (647-649 `source/**/*.ts`) | 6.8-7.9 s            | 0.5 s (1.2 s cold)     |
| `lint:ci` subset (204 files)        | 2.3 s                  | 0.35 s                 |

**Findings.** 2795 under ESLint, 1785 under oxlint, and the difference is fully accounted for:

-  `sort-keys` 2351 -> 1285. The same 136 files, no file added or dropped: oxlint reports one
   finding per unsorted object, ESLint reported one per misplaced key.
-  All 18 other rules that both linters run report **identical** counts (439 findings in total).
-  `+46 no-unnecessary-condition` and `+15 no-unnecessary-type-assertion`: re-enabled, see below.
   `no-deprecated` reports 0, as it did on TypeScript 6.
-  `-3 import-x/order` and `-2` parse errors on `source/basic/extractor/*New.ts` (now in
   `ignorePatterns`, matching the `tsconfig.json` exclude).

**Rule coverage.** Of the 101 rules the ESLint config enabled, 90 exist in oxlint under the
`typescript/` or `import/` name, and 8 more exist as the plain core rule (oxlint folds the
TypeScript handling into `no-unused-vars`, `no-empty-function` and the like instead of shipping
a typescript-eslint extension rule). Three have no equivalent:

-  `import-x/order` - "won't be implemented", and `@oxlint/migrate --details` gives the reason:
   "Not implementing this in Oxlint as its behavior is covered very well by Oxfmt's import
   sorting." So the replacement is the formatter's `sortImports` option, not a lint rule. It is
   off by default and not enabled here; see the follow-up below. The rule was reporting 3
   findings, and import grouping is part of `doc/codingStyle.md`.
-  `import-x/no-extraneous-dependencies` - was on for the `basic`/`valid` Jest files only, 0 findings.
-  `@typescript-eslint/typedef` - every one of its options was `false`, so it reported nothing.

The three rules DEP-13 had to switch off because `ts7-eslint` crashed in them
(`no-deprecated`, `no-unnecessary-condition`, `no-unnecessary-type-assertion`) are on again:
oxlint-tsgolint runs all three without crashing. That closes the P7 follow-up item.

**Answers to the questions in the goal.** A hybrid is possible in either direction
(`eslint-plugin-oxlint` switches off the ESLint rules oxlint covers, and oxlint can load real
ESLint plugins through `jsPlugins`), but nothing here needed it: one `import/order` rule is not
worth keeping a second linter, a second config and ~75 packages for. oxfmt contributes no lint
rules; it just means no formatting rules have to be switched off, so `eslint-config-prettier`
went away with ESLint.

Two things were deliberately **not** done, to keep the cutover mechanical:

-  oxlint turns its `unicorn` and `oxc` plugins on by default, and defaults the `correctness`
   category to on. `.oxlintrc.jsonc` switches all of that off, so the configuration is exactly
   what ESLint was running. Turning any of it on is a separate decision.
-  The 70 `eslint-disable` comments in `source/` are left as they are. oxlint honours them
   (`respectEslintDisableDirectives` defaults to true); rewriting them to `oxlint-disable` would
   touch ~40 files for no behaviour change.

**Import ordering (done 2026-11-10, after the cutover).** `.oxfmtrc.json` now sets
`sortImports: true`, which is oxc's own answer to the `import-x/order` gap: the default `groups`
are `builtin`, `external`, `internal`/`subpath`, then `parent`/`sibling`/`index`, with newlines
between and an ascending case-insensitive sort inside each group, which is what `import-x/order`
was configured to do. The bare tsconfig aliases (`basic`, `pToken`, `token`, ...) classify as
`external`, so they share one alphabetised block with real packages, exactly as the ordered
modules already wrote them.

Evidence that the default matches the existing convention: `import-x/order` was only ever on for
`basic` and `valid`, and under `sortImports: true` those two change in 14 of 188 files (7%), all
of them a stray blank line inside a group or one import out of place. The rest of the tree, which
was never import-ordered, changes in 380 of 461 files (82%). Nothing in `source/` uses a
side-effect import, and `sortSideEffects` defaults to false anyway.

Rejected alternative: `{ partitionByNewline: true, newlinesBetween: false }` (317 files). It only
sorts within whatever blank-line blocks already exist, so it would not enforce the group order at
all. Note that `partitionByNewline: true` and `newlinesBetween: true` are rejected together, and
there is no zero-diff setting.

One script change that is not a straight translation: `lint` and `lint:all` no longer pass
`--fix`, and the fixing form moved to a new `lint:fix`. oxlint has fixers for rules ESLint only
had suggestions for, so `oxlint --fix source` rewrites 140 files (1785 findings down to 712):
`sort-keys` reorders object literals, and `no-unnecessary-type-assertion` strips `!` and
`as any`. The result still type-checks and the suites still pass, but that is not a diff anyone
should get from a `lint` command.

### Next actions

-  [x] Measure eslint performance for the whole repo.
-  [x] Measure oxlint performance for the whole repo.
-  [x] Explore the options (full cutover / stay / hybrid) and pick one: full cutover.
-  [ ] Optional: decide whether to turn on `correctness`, `unicorn` and `oxc`, and triage what
       they report.
-  [x] Replaced `import-x/order` with oxfmt's `sortImports`, on its own branch. See below.
-  [ ] Optional: `oxlint --type-check` can also report TypeScript compiler diagnostics, which
       could merge the Lint and Type check CI jobs. Not done: `npm run check:types` is the
       documented command and `tsc` is already 0.8 s.

## P14: Make `xToken` lint-perfect on close-to-stock oxlint settings

### Goal

`AGENTS.md` calls `source/xToken/` the canonical reference, "a finished version that could be
shipped". It should earn that: clean against a configuration that leans on oxlint's own defaults,
including the `unicorn` and `oxc` plugins and the `correctness` category, rather than against the
hand-trimmed rule list inherited from the ESLint config.

Depends on P8 and P9 landing first. Picking up stock settings is only cheap now that there is a
single linter with a single config to widen.

### Done when

`xToken` reports zero findings under whatever widened configuration this project settles on, and
that configuration is recorded in `.oxlintrc.jsonc` with the rules it deliberately leaves off and
why.

### Current state

Not started. Measured 2026-11-10 on the P9 branches, over `xToken`'s 76 files:

-  **Formatting is already perfect.** `oxfmt --check` is clean, as it now is for the whole tree.
-  **247 findings** under the committed config: 236 `sort-keys`, plus 9
   `no-unsafe-enum-comparison`, 1 `no-duplicate-type-constituents`, 1
   `switch-exhaustiveness-check`.
-  **255** on oxlint's actual defaults, i.e. adding the `unicorn` and `oxc` plugins and switching
   the `correctness` category on. The 8 new ones are all `no-misused-spread`, which the old ESLint
   config switched off deliberately: this code spreads token class instances into modified props
   objects (`{ ...pToken, externalId }`) and losing the prototype is the intent. At `correctness`
   only, `unicorn` contributes 0 and `oxc` 1 repo-wide.
-  **1376** with every non-nursery category on (49 distinct rules): eslint 672, typescript 306,
   import 215, unicorn 169, oxc 14.

So the gap is small on stock defaults and large only if every category is switched on. Most of
that 1376 comes from rules that contradict conventions this repo has already chosen, and those
are the easy "no" decisions:

| rule | n | why not |
| --- | --- | --- |
| `import/no-relative-parent-imports` | 140 | the codebase imports by relative path by design |
| `eslint/sort-imports` | 139 | sorts by binding name; oxfmt's `sortImports` owns ordering (P9) |
| `eslint/no-undefined` | 96 | `undefined` is used deliberately throughout the token model |
| `typescript/prefer-readonly-parameter-types` | 78 | known to be very noisy |
| `unicorn/filename-case` | 74 | wants kebab-case; `AGENTS.md` mandates camelCase |
| `import/no-named-export` | 70 | the whole public surface is named exports |
| `eslint/one-var`, `no-ternary`, `no-magic-numbers`, `max-lines-per-function`, `max-statements` | 139 | style opinions, not defects |

The candidates actually worth a decision are a much shorter list: `consistent-type-imports` (101,
auto-fixable), `explicit-member-accessibility` (59), `unicorn/switch-case-braces` (50,
auto-fixable), `no-unsafe-type-assertion` (35), `unicorn/no-zero-fractions` (18),
`init-declarations` (18), `func-style` (16), `consistent-type-exports` (10),
`unicorn/text-encoding-identifier-case` (6).

`sort-keys` alone is 236 of the current 247, and 1285 of the repo's 1785. **Decision: adopt it
and apply the fixer.** That was checked rather than assumed, on a scratch copy of the tree with
every other rule switched off (measured 2026-11-10):

-  Iterating `oxlint --fix` takes the repo from **1285 findings to 7**, rewriting 134 files. One
   pass is not enough: the fixer handles one object per pass, so a single run only reaches 257.
   It converges after four passes.
-  Afterwards `tsc` is clean, Jest passes 265 suites / 9768 tests including all **68 snapshots**,
   and Jasmine passes 336 specs.
-  **Object spreads are never reordered.** The only `...` lines the fixer touched were array
   spreads inside a property value that moved as a unit, so the deliberate
   `{ ...pToken, externalId }` pattern is untouched. That was the main semantic risk and it is
   not real.

The 7 that survive are all **computed-key tables**, in four files: `wellformedness/ContentChecker.ts`
(3), `wellformedness/checkMap.ts` (1), `conformance/@test/data/expectedCodes.ts` (2) and
`conformance/@test/build/buildTestData.ts` (1). The fixer cannot reorder `[ELEMENT_START_PTOKEN]:`
style keys because it cannot know the constant's value, and no option waives them: oxlint's
`sort-keys` accepts only `caseSensitive`, `natural`, `minKeys` and `allowLineSeparatedGroups` --
there is no `ignoreComputedKeys` (that option exists in ESLint, not here), and
`allowLineSeparatedGroups: true` still leaves all 7. They want 7
`oxlint-disable-next-line sort-keys` comments, which is the right answer regardless: those tables
are ordered by XML spec production order with comment-grouped sections, and sorting them by
constant name would destroy real information.

Also still open: `sort-keys` is currently scoped to the strict file set only, so `basic` and
`valid` are exempt. Widening it is part of this project.

### Next actions

-  [ ] Apply the `sort-keys` fixer repo-wide, in its own commit: run `oxlint --fix` to
       convergence (four passes), then `oxfmt`, then add the 7 `oxlint-disable-next-line`
       comments with a one-line reason each. Verified safe; see above.
-  [ ] Decide whether `sort-keys` should also cover `basic` and `valid`, which it exempts today.
-  [ ] Triage the shortlist above rule by rule; widen `.oxlintrc.jsonc` to match, recording the
       deliberate exclusions and their reasons the way the current config already does.
-  [ ] Fix the residue in `xToken` so it reports zero, including the 9 `no-unsafe-enum-comparison`
       and the 1 `switch-exhaustiveness-check` it reports today.
-  [ ] Decide whether `no-misused-spread` stays off, or whether the token-spreading pattern should
       be expressed in a way that does not need the rule off.
-  [ ] Only then consider holding other modules to the same bar.

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
