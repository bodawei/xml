# P7: Dependency upgrade plan

The staged plan for `ROADMAP.md` item **P7** (bring all package dependencies up to
date). `ROADMAP.md` remains the source of truth for P7's _status_; this file holds the
_order_ and the reasoning.

Stage IDs are stable: never renumber, never reuse. A dropped stage is marked
`withdrawn` and keeps its number.

**Scope rule for this project: P7 brings every dependency to its current best
practice, full stop.** Several later roadmap items would replace tools that P7
upgrades — P8 (oxfmt for prettier), P9 (oxlint), P10 (vitest for jest), P11 (delete
jasmine). That is explicitly _not_ a reason to skip or soften an upgrade here.
Experience on this repo is that problems are fewer when everything is current, and
replacement is a decision to make later, from a modern baseline rather than from a
four-year-old one. Where a stage notes a future project, it is context only and
changes nothing about the work.

## Measured baseline (2026-11-05)

Captured on this worktree with Node 26.0.0 / npm 11.12.1, after `npm ci` of the
committed `package-lock.json`.

| Measurement                             | Value                                                         |
| --------------------------------------- | ------------------------------------------------------------- |
| Installed packages                      | 930                                                           |
| `npm audit`                             | 59 vulns — 27 critical, 15 high, 10 moderate, 7 low           |
| `npm outdated`                          | 29 of 43 direct deps behind; 14 are a major behind            |
| Jest (`--coverage=false`)               | 265 suites / 9768 tests / 68 snapshots — all pass, 5.5s       |
| Jasmine (`build/jasmine.json`)          | 336 specs, 0 failures, 0.4s                                   |
| `npm run check:types`                   | 144 errors, **all** in `source/node/@test/data/flatDocs.json` |
| `npx prettier --check 'source/**/*.ts'` | 91 of 649 files non-conforming                                |
| `npx eslint source`                     | 3292 problems (3277 errors, 15 warnings)                      |

Lint problems by rule (the shape matters, because upgrades must not blur it):

| Count | Rule                                      |
| ----- | ----------------------------------------- |
| 2351  | `sort-keys`                               |
| 454   | `prettier/prettier`                       |
| 187   | `@typescript-eslint/no-explicit-any`      |
| 300   | all other `@typescript-eslint/*` combined |

Lint problems by module: `pToken` 1241, `expand` 489, `basic` 482, `xToken` 391,
`wellformedness` 374, `attFixer` 124, `flat` 122, `conformance` 69. `valid`, `token`,
`node` and `demo` are **clean** — those four are the regression tripwire for every
stage below.

Record these numbers in each PR description. "No new errors" is only checkable
against a number.

## Constraints that fix the order

These are the hard edges found while evaluating the packages. Each one is a published
peer range, an engine field, or a directly measured result — not a guess.

-  **C1** — `@types/node@26` declares `typeScriptVersion: "5.6"`. It cannot be used
   with TypeScript 4.6. TypeScript moves first.
-  **C2** — `@typescript-eslint@8` (latest) peers `typescript: ">=4.8.4 <6.1.0"`.
   TypeScript 7.0.2 is published and is _not_ lintable by it — it refuses at import
   with "typescript-eslint does not support TS 7.0." So **6.0.x is the ceiling for as
   long as typescript-eslint is in the tree.** P7 resolves this by replacing it in
   DEP-13; see **C11**.
-  **C3** — `eslint-plugin-prettier@5` peers `prettier: ">=3.0.0"`. Prettier,
   `eslint-plugin-prettier` and `eslint-config-prettier` must move in one commit.
-  **C4** — `eslint-config-airbnb-typescript@18` (latest) peers
   `@typescript-eslint/*: "^7.0.0"` and `eslint: "^8.56.0"`. It can never coexist with
   `@typescript-eslint@8`, so it has to be dropped _in_ the typescript-eslint stage,
   not after it.
-  **C5** — `eslint-config-airbnb-base@15` (latest) peers
   `eslint: "^7.32.0 || ^8.2.0"`. It blocks ESLint 9 and 10 and has no newer release.
-  **C6** — `eslint-plugin-import@2.32` peers `eslint: "... || ^8 || ^9"` — no ESLint 10. `eslint-plugin-import-x@4` peers `eslint: "^8.57.0 || ^9.0.0 || ^10.0.0"` and
   `@typescript-eslint/utils: "^8.56.0"`, so ESLint 10 is reachable only by swapping to
   `import-x`.
-  **C7** — `@typescript-eslint@8` still ships `dist/configs/eslintrc/*` alongside
   `dist/configs/flat/*`. The typescript-eslint major and the flat-config migration are
   therefore **separable**, which is what makes DEP-5 and DEP-6 distinct stages.
-  **C8** — `@babel/core@8` engines are `^22.18.0 || >=24.11.0`; `babel-jest@30` peers
   `@babel/core: "^7.11.0 || ^8.0.0-0"`. Babel 8 is permitted by Jest 30, but only
   after Jest 30 is in.
-  **C9** — `@types/jasmine@7` also declares `typeScriptVersion: "5.6"`. Like C1, the
   Jasmine stage is gated on the TypeScript bump.
-  **C10** — **Jasmine 7 has removed the `jsLoader` option entirely** (zero references
   in the shipped package). Its loader always calls `import()`, falling back to
   `require()` only on `ERR_UNKNOWN_FILE_EXTENSION`. Measured on Node 26: `import()` of
   a `.ts` file **succeeds** via native type stripping, so that fallback never fires;
   and a bare `tsconfig` path alias under native ESM fails with
   `ERR_MODULE_NOT_FOUND`, with `-r tsconfig-paths/register` making no difference
   because it is a CJS require hook. This is the single largest piece of hidden work in
   P7 — see DEP-11.
-  **C11** — `ts7-eslint@0.2.1` (the chosen TypeScript 7 linter, DEP-13) peers
   `eslint: "^9.0.0 || ^10.0.0"` and `typescript: "^7.0.0"`, engines `node >=22.15`
   (for `module.registerHooks`; Node 26 is fine). **It cannot run on ESLint 8**, so
   DEP-6 is a hard prerequisite for TypeScript 7, not merely a desirable cleanup. It is
   also `"type": "module"`, so the flat config has to be ESM.
-  **C12** — TypeScript 7 ships **no programmatic compiler API**: the `typescript`
   package root export is a version stub and only `./unstable/*` is exported. This is
   why typescript-eslint cannot simply widen its range, and why the swap in DEP-13 is a
   replacement rather than a version bump.

## Per-stage plan

Each stage is one PR against `main`. After every stage, run the full definition of
done from `AGENTS.md` and compare against the baseline table.

### DEP-1 — Delete dead dependencies

**No version changes. This is the highest-value, lowest-risk stage and it must go
first.**

A reference scan across the repo (excluding `node_modules` and the lockfiles) found
these direct devDependencies with **zero** references in any config, script or source
file:

| Package                                                           | Why it is dead                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `babel-polyfill`                                                  | Babel 6 era; nothing imports it                                                  |
| `babel-preset-env` (v1, not `@babel/preset-env`)                  | superseded by `@babel/preset-env` in `build/babelrc-ts.js`                       |
| `babel-preset-es2015` / `es2016` / `es2017` / `latest`            | all four deprecated by upstream; unreferenced                                    |
| `@babel/plugin-proposal-class-properties`                         | deprecated upstream; not in `build/babelrc-ts.js`                                |
| `@babel/plugin-proposal-object-rest-spread`                       | deprecated upstream; not in `build/babelrc-ts.js`                                |
| `@babel/cli`                                                      | no npm script invokes `babel`                                                    |
| `babel-plugin-istanbul`                                           | Jest's `coverageProvider: "babel"` pulls its own copy via `@jest/transform`      |
| `babel-plugin-module-resolver`                                    | aliases come from `jest.config.js` `moduleNameMapper` and `tsconfig-paths`       |
| `jasmine-ts`, `jasmine-console-reporter`, `jasmine-spec-reporter` | `build/jasmine.json` configures no reporter                                      |
| `jest-simple-dot-reporter`                                        | only appears in a commented-out `reporters` block in `jest.config.js`            |

**Do not remove `@types/jest`.** It looked dead (every `*.jest.ts` imports from
`@jest/globals`), but non-test helpers use the ambient `jest` namespace
(`source/basic/@test/helper/makeProblemMatcher.ts`), and the Jasmine specs run under
`ts-node`, which fails to compile without it (TS2503, and TS2339 in
`streamParsedReplacementText.test.ts`). Found by running Jasmine after removal; a text
search cannot see it. Re-evaluate in DEP-7 / DEP-11.

**Do not remove `@types/jasmine`.** The 58 Jasmine specs call bare `describe` / `it` /
`expect` globals and never import `jasmine`, so `tsc` needs the ambient types even
though a text search finds no reference.

**Measured effect (done):** 59 → 31 advisories, critical 27 → 1.

**Expected effect:** 26 of the 27 critical advisories live in this dead Babel 6
subtree (`babel-traverse` / `babel-template` / `babel-helper-*` /
`babel-plugin-transform-es2015-*`), reached only through
`babel-preset-es2015/2016/2017/latest` and `babel-preset-env@1`. `find-babel-config` →
`json5` (high) and `core-js@2` come out with them. The 27th critical is
`@babel/traverse` under `@babel/core@7.17`, which DEP-7 clears.

**Verify:** `npm run jest:all` **with** coverage (this is the one stage that can
plausibly break coverage instrumentation — check `temp/coverage-jest` is still
populated), Jasmine, `check:types`, and the audit count.

### DEP-2 — Prettier 3

`prettier` 2.6.2 → 3.9.10, `eslint-plugin-prettier` 4.0.0 → 5.5.7,
`eslint-config-prettier` 8.5.0 → 10.1.8. One commit, per **C3**. Stays on ESLint 8
(`eslint-plugin-prettier@5` peers `eslint >=8.0.0`; `eslint-config-prettier@10` peers
`eslint >=7`), so this is independent of the ESLint work.

This was measured directly: Prettier 3.9.10 against the repo's `.prettierrc.json`
flags **93** files versus Prettier 2's 91 — and the two new files are exactly:

-  `source/expand/utils/streamParsedReplacementText.ts`
-  `source/valid/common/ancestorPERefsValidate.ts`

Prettier 3 is very nearly a no-op for this codebase. Reformat those two files in this
PR. The second one matters: `valid` is currently lint-clean, so leaving it would open a
`prettier/prettier` error in a tripwire module.

Leave the other 91 pre-existing files alone. Whether to reformat the whole tree is a
separate question from upgrading the formatter, and mixing the two would bury this
stage's diff.

**Verify:** `prettier --check` is back to 91 non-conforming; eslint total drops by at
most the `prettier/prettier` delta and the four clean modules stay clean.

### DEP-3 — TypeScript 5.9, then 6.0

`typescript` 4.6.4 → 5.9.3 → 6.0.3, plus `ts-node` 10.7.0 → 10.9.2 and
`tsconfig-paths` 4.0.0 → 4.2.0 (both patch-level, and `ts-node` peers
`typescript >=2.7`).

Land 5.9 green as its own commit before going to 6.0.x — two hops in one PR, so that a
failure has an obvious bisect point. 6.0.x is as far as this stage goes, per **C2**;
TypeScript 7 arrives in DEP-13, coupled to the linter swap that makes it possible.

This is the stage with real unknown work in it. Going 4.6 → 6.0 crosses five majors
under `"strict": true` over 649 files; budget for new type errors rather than assuming
none.

While here, delete `"baseUrl": "./"` from `tsconfig.json`. Measured: removing it
produces byte-identical `tsc` output — the same 144 `flatDocs.json` errors and zero
`TS2307` module-resolution errors — because TypeScript has resolved `paths` relative to
the config file without `baseUrl` since 4.1, and this repo's 18 alias values are already
written that way. `baseUrl` is a legacy option on its way out, and dropping it now while
the type-check baseline is being re-verified is cheaper than doing it later.

Specific things to check, not assume:

-  `tsconfig.json` sets `"target": "es5"`. Confirm 6.0 still accepts it; if it has been
   dropped, raising the target is a behaviour change (it interacts with
   `downlevelIteration`, which this config also sets) and deserves its own commit.
-  `check:types` must still fail with exactly the 144 `flatDocs.json` errors and nothing
   else. That file is the documented baseline (`AGENTS.md`), and its `resolveJsonModule`
   failure belongs to P5, not P7. If the count changes, that is signal.
-  `@typescript-eslint@5.23` will begin emitting `warnOnUnsupportedTypeScriptVersion`
   noise, because 5.x predates TypeScript 5.9. That is expected and is cleared by DEP-5;
   do not chase it here.

### DEP-4 — `@types/node` 26

`@types/node` 17.0.33 → 26.6.6. Separate from DEP-3 because it is gated on it (**C1**)
and because it fails in a completely different way: Node's own typings have changed a
great deal in nine majors, so any errors here are about Node API surface (`Buffer`,
`stream`, `ArrayBufferLike` variance), not about the language.

`source/node/`, `source/basic/` (`STokenSource`) and the `stream`-facing code are where
to look. `source/node` is currently lint-clean — keep it so.

### DEP-5 — typescript-eslint 8, and exit airbnb-typescript

`@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` 5.23.0 → 8.72.1, and
**remove `eslint-config-airbnb-typescript`**. Per **C4** these are not two decisions;
airbnb-typescript's peer range makes them one.

Still on ESLint 8 and still eslintrc, per **C7**. That is deliberate: it keeps this
stage about rule names and keeps DEP-6 about config format.

Concrete edits to `build/eslint/eslintrc.js` (843 lines, 70 configured
`@typescript-eslint/*` rules):

1. `plugin:@typescript-eslint/recommended-requiring-type-checking` no longer exists.
   The v8 replacement is `plugin:@typescript-eslint/recommended-type-checked`. Both
   override blocks (around lines 43-50 and 125-130) use the old name.
2. Drop `'airbnb-typescript/base'` from the `extends` at line 50. Note the comment
   there: airbnb-typescript was also supplying `settings.import/resolver.typescript`,
   so that setting has to be written out explicitly or import resolution silently
   changes.
3. **16 configured rules no longer exist in v8** and will each raise "Definition for
   rule ... was not found". Verified against the v8 plugin's shipped rule set (136
   rules):

   Removed as formatting rules (moved to `@stylistic`, and Prettier owns formatting
   here anyway — delete these entries along with the matching `'rule': 'off'` core
   entries that precede them in the Extension Rules block at lines 674-828):
   `brace-style`, `comma-spacing`, `func-call-spacing`, `indent`, `keyword-spacing`,
   `lines-between-class-members`, `no-extra-parens`, `no-extra-semi`, `quotes`, `semi`,
   `space-before-function-paren`, `type-annotation-spacing`.

   Renamed or split — these need a decision, not a deletion:

   -  `ban-types` (line 152) split into `no-empty-object-type`,
      `no-unsafe-function-type` and `no-restricted-types`.
   -  `no-throw-literal` (line 477) became `only-throw-error`.
   -  `no-parameter-properties` (line 471) became `parameter-properties`.

   Already dead today: `@typescript-eslint/no-explit-any` (lines 73 and 834) is a typo
   for `no-explicit-any` and is set to `['off']`, so it has never done anything. Delete
   it.

4. The Extension Rules block sources its option values from
   `eslint-config-airbnb-base/rules/*` by direct `require` (lines 2-6). After step 3
   only the non-formatting extension rules still need those values —
   `default-param-last`, `dot-notation`, `init-declarations`, `no-array-constructor`,
   `no-dupe-class-members`, `no-empty-function`, `no-invalid-this`, `no-magic-numbers`,
   `no-unused-expressions`, `no-unused-vars`, `no-use-before-define`,
   `no-useless-constructor`, `require-await`, `return-await`. Leave the `require`s in
   place for now; DEP-6 has to inline them anyway.

**Expect the lint count to move in this stage**, because `recommended-type-checked` is
not the same rule set as `recommended-requiring-type-checking`. Re-baseline the
per-module table in the PR description and state which modules changed and why. The
four clean modules must stay clean.

**Switch to the single `typescript-eslint` meta-package** (which re-exports parser and
plugin) rather than keeping `parser` and `eslint-plugin` as separate dependencies. This
is no longer a tidiness preference: `ts7-eslint` deliberately mirrors that package's
flat API — `tseslint.config(...)`, `tseslint.configs.recommendedTypeChecked` — so
building DEP-6's config against it reduces DEP-13 to changing one import line. Do the
package switch here and the config shape in DEP-6.

One version note for DEP-13: `ts7-eslint@0.2.1` bundles the published
`@typescript-eslint/eslint-plugin@8.66.0`, not 8.72.1. The rule set therefore steps
slightly back at DEP-13. Check the 8.66 → 8.72 changelog for anything touching the 70
rules configured here; nothing in the current violation profile looks exposed, but it
should be a deliberate check rather than a surprise.

### DEP-6 — ESLint 10 and flat config

The largest stage, and now a **hard prerequisite for TypeScript 7**: `ts7-eslint`
requires ESLint 9 or 10 (**C11**), so DEP-13 cannot happen until this lands.

-  `eslint` 8.15.0 → 10.14.0 (engines `^20.19.0 || ^22.13.0 || >=24`; fine on Node 26).
-  **Remove `eslint-config-airbnb-base`** (**C5**) and inline the literal option values
   for the 14 extension rules listed in DEP-5 step 4. This is the irreducible work:
   there is no maintained airbnb config for flat config or for ESLint 9/10, so the
   values have to live in this repo.
-  **Replace `eslint-plugin-import` with `eslint-plugin-import-x@4`** (**C6**) and drop
   `eslint-import-resolver-typescript@2` in favour of `import-x`'s own TypeScript
   resolver. `plugin:import/recommended` becomes the `import-x` flat equivalent.
-  Convert `.eslintrc.json` + `build/eslint/eslintrc.js` to **`eslint.config.mjs`**. The
   existing config is already structured as `overrides` blocks, which map onto flat
   config's array of config objects fairly directly; the `env` block becomes
   `languageOptions.globals` from the `globals` package.
-  **Write it as ESM, in the `tseslint.config(...)` idiom**, not as CJS. `ts7-eslint` is
   `"type": "module"` and is consumed as
   `import tseslint from "ts7-eslint"` /
   `export default tseslint.config(tseslint.configs.recommendedTypeChecked, …)`
   (**C11**). Writing DEP-6's config that way against the `typescript-eslint`
   meta-package means DEP-13 is a one-line import change instead of a second rewrite.
   Note that `build/eslint/eslintrc.js` is CJS today and uses `require` for the airbnb
   rule values — those are being inlined in this stage anyway.
-  ESLint 10 removes the core formatting rules. The config currently sets 26 core rules,
   of which these 11 are formatting rules set to `'off'`: `brace-style`,
   `comma-spacing`, `func-call-spacing`, `indent`, `keyword-spacing`,
   `lines-between-class-members`, `no-extra-parens`, `no-extra-semi`, `quotes`, `semi`,
   `space-before-function-paren`. Delete them; they exist only to defer to the
   typescript-eslint extension rules that DEP-5 already removed.
-  `sort-keys` (2351 problems — 71% of the whole lint baseline) is not a formatting rule
   and survives. **Do not change its configuration in this stage.** It is the single
   best signal that the migration preserved behaviour.
-  The `--ext` flag does not exist under flat config. Update the `lint` and `lint:all`
   scripts in `package.json`, and the "Lint touched files" row in the `AGENTS.md`
   command table.

Sequence it as two commits in one PR: first the flat-config conversion on **ESLint 9**,
where `eslint-plugin-import@2.32` still works, then ESLint 10 plus the `import-x` swap.
That separates two independent failure modes — config format and plugin replacement —
so a regression points at one of them rather than both.

**Note the `--fix` hazard.** `AGENTS.md` warns that `npm run lint` is configured with
`--fix` and rewrites files. Validate every step of this stage with a bare
`npx eslint --config ./eslint.config.mjs source`, never through the npm script.

#### DEP-6 is delivered in parts

Decided after DEP-5, so each part is a reviewable PR with its own verification. Part IDs
are stable like stage IDs.

-  **DEP-6a** — Remove `eslint-config-airbnb-base` by inlining its option values. No
   behaviour change; verified by an identical finding-by-finding lint result.
-  **DEP-6b** — Prune the config: use the plugins' `recommended` sets and delete rules
   that merely restate them, so the config that gets converted is as small as possible.
   Do this _before_ the format conversion so there is less to port.
-  **DEP-6c** — Convert to `eslint.config.mjs` flat config on ESLint 9.
-  **DEP-6d** — ESLint 10, and `eslint-plugin-import` → `import-x`.

The bullet list above remains the full scope; 6a covers its airbnb item.

### DEP-7 — Jest 30 and Babel 7 latest

`jest` 28.1.0 → 30.5.2 and `@jest/globals` ^28.1.0 → ^30.5.2 together (engines
`^18.14.0 || ^20 || ^22 || >=24`; fine on Node 26). Independent of the
TypeScript/ESLint chain, so it can run in parallel with DEP-3 … DEP-6.

The thing to plan for: **Jest 29 changed the default snapshot format**
(`escapeString: false`, `printBasicPrototype: false`). The repo has **68 snapshots**.
Take the new format — it is the modern default, and for XML token snapshots
`escapeString: false` is markedly more readable. Run `jest -u` and **read the diff** in
review; do not pin the old format with `snapshotFormat` just to avoid churn, because
that is a legacy setting that would then live in `jest.config.js` indefinitely.

Also check: `coverageProvider: "babel"` still behaves (it is the reason DEP-1 keeps an
eye on coverage), and the `setupFilesAfterEnv` entries still load as `.ts`.

In the same PR, bump `@babel/core` / `@babel/preset-env` / `@babel/preset-typescript`
to latest **7.x**. That clears the last critical (`@babel/traverse`) plus the
`browserslist` and `core-js-compat` highs, and it gets Jest and Babel moving together
without taking on Babel 8's majors at the same time.

### DEP-8 — Babel 8

`@babel/core`, `@babel/preset-env`, `@babel/preset-typescript` 7.x → 8.x. Permitted by
`babel-jest@30` (**C8**), so this follows DEP-7.

Babel's whole job in this repo is the Jest transform, via `build/babelrc-ts.js`
(`preset-env` targeting `node: 'current'` plus `preset-typescript`). Nothing ships
through Babel, so the blast radius is the test run and coverage instrumentation.

Verify with `npm run jest:all` **with coverage** — `coverageProvider: "babel"` is the
part most likely to notice a Babel major.

### DEP-9 — `iconv-lite` 0.6.3 → 0.7.3

The only **runtime** dependency bump in P7, and the only stage that can change what the
library actually does. `iconv-lite` sits on the decoding path.

Give this its own PR with its own verification, even though it is a single
minor-version bump: the full Jest suite including the conformance corpus
(`source/conformance/`), plus the Jasmine integration specs. A decoding regression here
would be invisible in a lint or type-check pass.

`bcp47-validate@1.0.0` is already at latest and needs no bump, but note it for a future
supply-chain review: it is long unmaintained and the repo carries a local
`bcp47-validate.d.ts` shim for it.

### DEP-10 — `nodemon` 2 → 3

`nodemon` 2.0.16 → 3.1.14. Clears the remaining moderate advisories in its subtree. It
affects only `npm test`'s watch loop, and should be done alongside or just after
DEP-11, since DEP-11 rewrites the command nodemon executes.

### DEP-11 — Jasmine 7

`jasmine` 4.1.0 → 7.0.0, `jasmine-core` 4.1.1 → 7.0.2, `@types/jasmine` 4.0.3 → 7.0.0.
Three majors across 58 spec files and 336 specs. Gated on DEP-3 by **C9**.

**This stage is much bigger than the version numbers suggest, and it should be
scheduled as its own project-sized piece of work.** Per **C10**, all of the following
was verified rather than inferred:

-  Jasmine 7 has **removed the `jsLoader` option**. There are zero references to it in
   the shipped package. `build/jasmine.json` currently sets `"jsLoader": "require"`, and
   `AGENTS.md` documents that setting as load-bearing — without it, specs load through
   dynamic `import()`, which bypasses `ts-node` and `tsconfig-paths` and breaks the
   `basic` / `pToken` aliases. Jasmine 7 removes the knob that prevents this.
-  Jasmine 7's `Loader` always calls `import()` for non-`.json` paths, falling back to
   `require()` only on `ERR_UNKNOWN_FILE_EXTENSION`.
-  On Node 26, `import()` of a `.ts` file **succeeds** through native type stripping.
   So the `require()` fallback never fires. (Measured: a bare `import('./a.ts')` returns
   the module.)
-  Under that native ESM path, a bare `tsconfig` alias fails with
   `ERR_MODULE_NOT_FOUND`, and preloading `-r tsconfig-paths/register` changes nothing,
   because it is a CJS require hook and ESM resolution never consults it. (Measured on a
   minimal `paths` fixture.)

So the alias-resolution mechanism has to be **replaced**, not reconfigured. Every one
of the 58 spec files imports through aliases (`basic`, `pToken`, `node`, …), as does the
source they import, so editing the imports away is not a realistic option.

The verified fix is to run Jasmine under a loader that handles both TypeScript and
`tsconfig` `paths` under ESM. **`tsx` works** — on the same minimal fixture that failed
above, `tsx` resolved the alias correctly (`tsx` 4.23.15 on Node 26). So the `test`
script becomes roughly:

```
tsx ./node_modules/.bin/jasmine --config=./build/jasmine.json
```

replacing `ts-node -r tsconfig-paths/register ...`, with `nodemon` still wrapping it
(DEP-10). `@swc-node/register`'s ESM register hook is the alternative if `tsx` proves
awkward. Note that `ts-node`'s own ESM loader is **not** sufficient — it does not
resolve `tsconfig` `paths`, which is the actual failure here.

Keep `ts-node` and `tsconfig-paths` as dependencies regardless: `build:xmlconf` and
`build:flat` both still use them. Converting those two scripts to `tsx` as well is
reasonable tidying, but it is not required by this stage.

Also in this stage:

-  `build/jasmine.json` lists `source/wellformedness/@test/beforeJasmine.ts` as a
   helper, and **that file does not exist** (noted in `ROADMAP.md` P4). Jasmine 4
   tolerates it. Do not assume Jasmine 7 does — fix the config either way.
-  Remove the `jsLoader` key once the loader change is in, and **update the `AGENTS.md`
   note about it**, which will otherwise be actively misleading: it instructs future
   agents to keep a setting that no longer exists.
-  Re-verify the spec count is still exactly 336 with 0 failures. A loader change that
   silently fails to collect files is the realistic failure mode here, and a passing run
   of 0 specs looks like success.

### DEP-12 — `properties-parser`

Replace the deprecated `node-properties-parser@0.0.2` with its named successor,
`properties-parser`. One real reference: `build/tool/deriveLocale.js`, reached by the
`build:locale` npm script (`build/tool/doDerive.js`).

P5 separately questions whether `build:locale` is still live. That question does not
block this swap — do the swap, and if P5 later deletes the script, the dependency goes
with it.

### DEP-13 — TypeScript 7, via `ts7-eslint`

**Decided.** TypeScript 7 is not a version bump in this project; it is a decision about
which linter reads the type graph (**C12**), and the decision is to keep ESLint and
replace only typescript-eslint's compiler-facing layer with `ts7-eslint`.

This stage swaps `typescript-eslint` for `ts7-eslint@0.2.1` and takes `typescript`
6.0.3 → 7.0.2 **in one commit**. They are not separable: typescript-eslint refuses TS 7
at import, and `ts7-eslint` peers `typescript: "^7.0.0"`.

Prerequisites: DEP-3 (TypeScript 6.0.x green), DEP-5 (v8 rule names, meta-package) and
**DEP-6 (ESLint 9/10 + ESM flat config)** — the last is hard, per **C11**.

What `ts7-eslint` actually is, which is the reason it is a tolerable risk at 0.2.1: it
does not fork or patch anything. `@typescript-eslint/eslint-plugin`, `type-utils`,
`utils`, `scope-manager`, `types` and `visitor-keys` are the **published 8.66.0
packages, used unmodified**. What it rebuilds is the layers that touch the compiler —
a `ts-api` over `typescript/unstable/*`, a TSESTree converter, a parser, a `ts` namespace
shim of 168 members, and a module-resolution hook scoped to `@typescript-eslint` and
`ts-api-utils`. The project's own `import ts from "typescript"` is unaffected.

Its published verification is strong for a package this young, and is worth repeating
locally rather than trusting: an AST differential against `typescript@6.0.3` matching
1081 of 1081 nodes across 23 fixtures including the awkward constructs, and a
five-codebase lint benchmark of 5,686 findings with **100% agreement and 0
disagreements**. Performance is roughly at parity (1.03x faster overall).

Steps:

1. `npm i -D ts7-eslint typescript@7` and remove the `typescript-eslint` /
   `@typescript-eslint/*` direct dependencies. **Do not install
   `@typescript-eslint/eslint-plugin` separately** — `ts7-eslint` brings it and it has
   to load after the resolution hook, which the entry point arranges.
2. Add the documented peer-warning fix to `package.json`, because the bundled
   `@typescript-eslint/eslint-plugin@8.66.0` still declares `typescript <6.1.0`:

   ```json
   { "overrides": { "@typescript-eslint/parser": { "typescript": "$typescript" } } }
   ```

   The resolution is correct — one TypeScript on disk, no nested copy — but it fails
   under `--strict-peer-deps`.

3. In `eslint.config.mjs`, change the import from the `typescript-eslint` meta-package to
   `ts7-eslint`. The API is deliberately the same shape
   (`tseslint.config(...)`, `tseslint.configs.recommendedTypeChecked`, plus `base`,
   `recommended`, `strict`, `strictTypeChecked`, `stylistic`, `stylisticTypeChecked`),
   so if DEP-6 was written in that idiom this is one line.
4. Keep `parserOptions.project: "./tsconfig.json"` with
   `tsconfigRootDir: import.meta.dirname`. A `tsconfig.json` is **required** — TypeScript 7
   has no standalone parser, so there is no project-less mode.
5. Pin `typescript` to an exact version, not a range. `ts7-eslint` builds on
   `typescript/unstable/*`, which is explicitly expected to change.

Verification, beyond the usual definition of done:

-  **The lint count must be compared rule by rule against the DEP-6 baseline**, not just
   totalled. This is the one stage where the linter's view of the code changes rather
   than the code or the rules.
-  **Check the five promise/await rules specifically.** `ts7-eslint` reimplements
   `getAwaitedType` (neither TS 7.0 nor the 7.1 dev builds expose it), and a union mixing
   promises and non-promises comes back unchanged — a potential false _negative_. This
   repo enables `await-thenable`, `no-floating-promises`, `no-misused-promises`,
   `require-await` and `return-await`, and all five currently report **0** violations, so
   the check is simply that they still report 0 and that nothing was silently lost.
-  **Watch for the unknown-type-query warning.** A type query the compiler cannot answer
   is reported as unknown rather than aborting the run, and the first one prints a
   warning. That is the right trade, but it means a quiet degradation is possible — treat
   any such warning as a finding.
-  Lint **message text** can order union members differently, because TypeScript 7 prints
   types in its own order (`string | (string | Query)[] | Query` where 6 wrote
   `string | Query | (string | Query)[]`). Same rule, same location, same finding. Nothing
   here snapshots lint output, so this should be cosmetic — but it is why a rule-by-rule
   count comparison is more trustworthy than a text diff.
-  `check:types` now runs the native compiler. Confirm it still fails **only** on
   `flatDocs.json`. The error count may legitimately differ from 144, since this is a
   different compiler implementation — if so, record the new baseline and say so
   explicitly rather than treating it as noise.

**Keep the retreat cheap.** Because the rules and their configuration are identical
either way, reverting to `typescript-eslint` + TypeScript 6.0.x should stay a
dependency-and-one-import change rather than a config rewrite. Do not let
TS7-specific workarounds leak into the rule configuration; if something needs a
workaround, comment it with why, so the revert is mechanical.

### Alternatives considered for DEP-13

Recorded so the decision is not relitigated from memory.

-  **oxlint + `oxlint-tsgolint`** (oxlint 1.91.0, oxlint-tsgolint 7.0.2006). Requires
   TS 7.0+, runs type-aware rules in a Go binary on typescript-go, and is the only option
   where TS 7 is a supported configuration rather than a worked-around one. Checked
   against this repo and viable: the documented `baseUrl` restriction is a one-line
   deletion here (see DEP-3), `eslint/sort-keys` exists (2351 violations, 71% of the
   baseline), and `typescript/no-explicit-any` exists (187). Not chosen because it
   replaces the whole linter — absorbing P9, forcing P8's Prettier-vs-oxfmt question
   early, and discarding the rule configuration this repo has accumulated. Type-aware
   coverage is also incomplete and upstream's own counts disagree (docs say 59 of 61, the
   tsgolint README says 60 of 62, neither names the gaps). Note that `@oxlint/migrate`
   reads only flat configs, so DEP-6 remains the prerequisite if this is ever revisited.
-  **Stay at TypeScript 6.0.x.** The safe default: typescript-eslint stays official and
   supported, waiting for TS 7.1 support (typescript-eslint #12803). Still the fallback
   if DEP-13's verification does not come back clean.
-  **Hybrid: `typescript@7` for `tsc` plus `@typescript/typescript6` (6.0.2) for
   typescript-eslint's type information.** Unverified whether typescript-eslint can be
   pointed at it, and it would mean type-checking and linting reading two different
   compilers. Not pursued.

## Exit criteria

With DEP-11 upgrading Jasmine and DEP-13 taking TypeScript to 7, **P7's original
"`npm outdated` reports nothing out of date" becomes reachable after all** — there is no
longer an exception list. Only the audit criterion needs restating.

-  `npm audit` reports **0 critical and 0 high** advisories. This is the one relaxation
   from the original wording: a fully clean audit including moderate and low is not
   reliably achievable in a dev-only toolchain and should not gate the project.
-  `npm outdated` is **empty**. Every direct dependency is at latest, TypeScript
   included.
-  Both suites still pass at their baseline counts: 265 Jest suites / 9768 tests, 336
   Jasmine specs. Counts, not just exit codes.
-  `check:types` still fails **only** on `source/node/@test/data/flatDocs.json` (P5's
   baseline). The error count was 144 under TypeScript 4.6; if the native compiler
   reports a different number for the same file (DEP-13), record the new baseline
   explicitly rather than letting it drift.
-  `npx eslint source` reports no new errors against the per-stage re-baseline, and
   `valid`, `token`, `node` and `demo` are still clean.
-  Every removed dependency is accounted for: dead (DEP-1), replaced, or deliberately
   held with a reason.
-  `AGENTS.md` is updated where P7 invalidated it — at minimum the `jsLoader` note
   (DEP-11) and the lint command row (DEP-6).

## Suggested order, at a glance

```
DEP-1  dead deps            no version risk      ← do first; clears 26/27 criticals
DEP-2  prettier 3           2 files to reformat   (independent)
DEP-3  typescript 5.9 → 6.0 unknown type errors  ← gates DEP-4, DEP-5, DEP-11
DEP-4  @types/node 26       unknown type errors
DEP-5  typescript-eslint 8  16 rules to rewrite  ← gates DEP-6
DEP-6  eslint 10 + ESM flat largest stage        ← gates DEP-13 (hard, per C11)
DEP-7  jest 30 + babel 7.x  68 snapshots          (independent of the TS/ESLint chain)
DEP-8  babel 8              after DEP-7
DEP-9  iconv-lite           only runtime change  ← own PR, conformance suite
DEP-10 nodemon 3            trivial; pairs with DEP-11
DEP-11 jasmine 7            loader replacement   ← biggest hidden cost; see C10
DEP-12 properties-parser    small, independent
DEP-13 typescript 7         linter swap          ← last; ts7-eslint + TS 7 in one commit
```

The TypeScript/ESLint chain is strict and now ends at DEP-13:

```
DEP-3 → DEP-5 → DEP-6 → DEP-13
   └──→ DEP-4
   └──→ DEP-11 ↔ DEP-10
DEP-7 → DEP-8        (parallel to the whole chain)
```

DEP-1, DEP-2, DEP-9 and DEP-12 are independent of everything and can land in any order.

Rough effort shape, for scheduling: DEP-1, DEP-2, DEP-9, DEP-10, DEP-12 are small.
DEP-4, DEP-5, DEP-7, DEP-8 are medium and bounded. **DEP-3, DEP-6 and DEP-11 are the
three that can each consume a session or more** — unknown type errors, a config rewrite,
and a loader replacement respectively. DEP-13 is small in diff and large in
verification: one import, one dependency swap, and a rule-by-rule comparison of the
whole lint baseline under a different type checker.

## Progress log

### DEP-1 — done

59 → 31 advisories, critical 27 → 1. `@types/jest` was **kept**: the plan listed it as dead,
but non-test helpers use the ambient `jest` namespace and the Jasmine specs fail to
compile under `ts-node` without it. Found only by running Jasmine after removal.

### DEP-2 — done

Prettier 3.9.10. Non-conforming files back to 91, eslint total unchanged at 3292.

### DEP-3 — done (5.9.3, then 6.0.3)

Findings the plan did not anticipate:

-  **The 4.6 type-check baseline was masking real errors.** `tsc` reports no semantic
   errors while any syntax error exists, and `flatDocs.json` is a syntax error. About
   70 genuine type errors (mostly in tests) surfaced and were fixed.
-  **Import-path casing bugs** (33 errors, 10 files): imports that only resolved on a
   case-insensitive filesystem (`AttFixer`, `Warning`, `spaceXToken`, `wordListCheck`,
   ...). Fixed to match the tracked file names. These would have failed on Linux CI.
-  `tsconfig.json` changes: `skipLibCheck` (`@types/jest` and `@types/jasmine` conflict
   under TS 5.x), explicit `types` (TS 6 no longer auto-includes `@types/*`),
   `target` es5 → es2022 with **`useDefineForClassFields: false`** (the TS 6 default
   changes class-field semantics and broke 16 Jasmine specs), `ts-node.files: true` (so
   `bcp47-validate.d.ts` is seen), `baseUrl` and `downlevelIteration` removed.
   Two `paths` values (`attFixer`, `node`) lacked the leading `./` the plan assumed they
   had; fixed.
-  `source/basic/extractor/*New.ts` is excluded from type-checking: it is the unfinished
   P1 rewrite and does not type-check.
-  After TS 6.0 the `flatDocs.json` errors no longer appear. Cause not isolated. That
   file is expected to be unclean, so `AGENTS.md`'s known-failure note is left as is
   until this is understood.
-  Lint total 3292 → 3287 (basic −5, conformance −2, wellformedness +2 from new casts);
   `valid`, `token`, `node`, `demo` still clean.

### DEP-4 — done

`@types/node` 26.6.6. Zero new errors; it also cleared the one `Buffer` overload error
that 5.9 raised against `@types/node` 17.

### DEP-5 — done

`typescript-eslint` 8.72.1 (meta-package) replaces `@typescript-eslint/parser` and
`/eslint-plugin`; `eslint-config-airbnb-typescript` removed. Findings beyond the plan:

-  **`eslint` must move 8.15.0 → 8.57.1 in this stage.** `typescript-eslint@8` peers
   `eslint ^8.57`. Still the 8 line, still eslintrc.
-  **`tsconfigRootDir` must be absolute** in v8 (`'./'` was a parse error on every file);
   the config now uses `path.resolve(__dirname, '../..')`.
-  **`airbnb-typescript/base` also turned off `import/no-unresolved`, `import/named` and
   `import/no-named-as-default-member` for `.ts` files.** Dropping it without copying
   those turned on 266 false `no-unresolved` errors (and broke the clean `valid`
   module). They are now set explicitly in the first override, along with the
   `settings` block (`import/parsers`, `import/resolver.node`, `import/extensions`,
   `import/external-module-folders`).
-  Removed the 12 formatting rules and their core `'off'` pairs; `ban-types` →
   `no-empty-object-type` + `no-unsafe-function-type` + `no-wrapper-object-types`;
   `no-throw-literal` → `only-throw-error`; `no-parameter-properties` →
   `parameter-properties`; deleted the dead `no-explit-any` typo entries.

Lint re-baseline: 3287 → 3313. Per module (before → after): attFixer 124→127,
basic 477→470, conformance 67→73, expand 489→506, flat 122→123, pToken 1241→1232,
wellformedness 376→380, xToken 391→402; `valid`, `token`, `node`, `demo` stay at 0.
The increase is the stricter `recommended-type-checked` set (`no-unsafe-enum-comparison`,
`no-redundant-type-constituents`, `no-duplicate-type-constituents`, ...), not the
migration; `sort-keys` (2351) and `prettier/prettier` (454) are unchanged.

`npm audit` 31 → 35 (critical 1 and high 13 unchanged): four new moderates inside
`typescript-eslint`'s own `minimatch` / `brace-expansion` dependencies. Not gating, per the
exit criteria. `source/basic/extractor/*New.ts` (excluded from `tsconfig.json` in DEP-3)
now reports "file not found in project" under type-aware lint; it did before too and is
part of the baseline.

### DEP-6a — done

`eslint-config-airbnb-base` removed; the 14 extension rules now carry literal values
(four of them are `'off'` upstream: `init-declarations`, `no-invalid-this`,
`no-magic-numbers` and `require-await`). Lint result is identical
to the pre-change run on every one of the 3313 findings (file, line, column, rule).

### DEP-6b — pruned (no behaviour change); further pruning needs decisions

Method: compared the effective config of eight representative files before and after, and
the full lint result (file, line, column, rule, message) on all 3313 findings. Both
identical apart from rules that were `'off'` and are now simply unset.

Removed from the main override's `rules` (74 → 34 entries): the 25 `@typescript-eslint/*`
rules that merely restated `recommended-type-checked`, the 3 `ban-types` replacements added
in DEP-5 (also already in the preset), and every core-rule `'off'` that only existed to
pair with a typescript-eslint extension rule (the preset or ESLint's default already has
it off). Also removed: the `plugins`, `parser` and `warnOnUnsupportedTypeScriptVersion`
lines that the presets or defaults supply, the duplicate `eslint-recommended` / `recommended`
/ `prettier` entries in `extends` (`recommended-type-checked` and `prettier/recommended`
include them), and the stale airbnb-base comment.

What remains in the main override are rules that *do* something: `sort-keys`, the five
that change a preset option (`triple-slash-reference`, `unbound-method`,
`no-unused-expressions`, `no-unused-vars`, and `require-await: off`), and 28 that
add a rule the `recommended` set lacks. Of those 28, these are available in other
typescript-eslint presets, so the explicit entries could go if the whole preset is adopted:

-  `stylistic-type-checked` (23 rules): `adjacent-overload-signatures`, `array-type`,
   `class-literal-property-style`, `consistent-type-assertions`, `consistent-type-definitions`,
   `no-inferrable-types`, `prefer-regexp-exec`, `prefer-string-starts-ends-with`.
-  `strict-type-checked` (79 rules): `no-dynamic-delete`, `no-extraneous-class`,
   `no-invalid-void-type`, `no-non-null-assertion`, `no-unnecessary-boolean-literal-compare`,
   `no-unnecessary-condition`, `prefer-reduce-type-parameter`, `unified-signatures`.

Adopting either preset is **not** behaviour-neutral: `stylistic-type-checked` would also turn
on 11 rules this repo does not enable (`prefer-nullish-coalescing`, `prefer-optional-chain`,
`prefer-includes`, `prefer-for-of`, ...) and `strict-type-checked` ~16 more. That is a
decision for the maintainer, not part of a no-behaviour-change prune. Rules in no preset
(and so must stay): `parameter-properties`, `prefer-ts-expect-error`,
`switch-exhaustiveness-check`, `typedef`, `no-empty-interface`, plus the `sort-keys` and
`import/order` configuration.

The ~250 lines of commented-out rule documentation are untouched.

### DEP-6e — stylistic-type-checked preset adopted (maintainer decision, outside the DEP-6 scope)

`plugin:@typescript-eslint/stylistic-type-checked` added to the main override and the 7
explicit entries it duplicates removed. 129 new findings, all resolved in code, so the lint
total stays at 3313 with an unchanged per-rule distribution (nothing new is left to
clean up). By rule: `prefer-nullish-coalescing` 50, `consistent-indexed-object-style` 31,
`prefer-optional-chain` 18, `prefer-includes` 16, `prefer-for-of` 11, `prefer-function-type`
2, `non-nullable-type-assertion-style` 1.

`||` → `??` was reviewed per site rather than auto-applied: it differs only when the left
operand can be falsy but not nullish. Every site involves an object, an array, a string enum
(non-empty) or `ParseType.DOCUMENT` (0, which is also the fallback), so they are
equivalent. Two sites were *not* converted: the `encoding || DEFAULT_ENCODING` defaults in
`xmlDeclarationXToken` and `textDeclarationXToken`, where an empty encoding name should
still fall back to the default; they carry a documented `eslint-disable`. A third,
`inIngernalGeRef || embeddedChecker?.inSecondPassContxt || false`, was rewritten to
`a || (b ?? false)` to keep boolean semantics.

The first override (`basic`, `valid`) was left on `recommended-type-checked` only.
