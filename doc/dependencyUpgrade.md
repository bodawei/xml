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
   TypeScript 7.0.2 is published and is _not_ lintable. The TypeScript ceiling for P7
   is **6.0.x**. This is an external blocker, not a sequencing preference.
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
| `@types/jest`                                                     | every `*.jest.ts` imports from `@jest/globals` (220 files); nothing uses globals |
| `jasmine-ts`, `jasmine-console-reporter`, `jasmine-spec-reporter` | `build/jasmine.json` configures no reporter                                      |
| `jest-simple-dot-reporter`                                        | only appears in a commented-out `reporters` block in `jest.config.js`            |

**Do not remove `@types/jasmine`.** The 58 Jasmine specs call bare `describe` / `it` /
`expect` globals and never import `jasmine`, so `tsc` needs the ambient types even
though a text search finds no reference.

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
failure has an obvious bisect point. 6.0.x is the ceiling, per **C2**.

This is the stage with real unknown work in it. Going 4.6 → 6.0 crosses five majors
under `"strict": true` over 649 files; budget for new type errors rather than assuming
none.

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

Optional: v8 is distributed as a single `typescript-eslint` package that re-exports
parser and plugin. Switching to it is tidier, but it only pays off with flat config —
do it as part of DEP-6.

### DEP-6 — ESLint 10 and flat config

The largest stage.

-  `eslint` 8.15.0 → 10.14.0 (engines `^20.19.0 || ^22.13.0 || >=24`; fine on Node 26).
-  **Remove `eslint-config-airbnb-base`** (**C5**) and inline the literal option values
   for the 14 extension rules listed in DEP-5 step 4. This is the irreducible work:
   there is no maintained airbnb config for flat config or for ESLint 9/10, so the
   values have to live in this repo.
-  **Replace `eslint-plugin-import` with `eslint-plugin-import-x@4`** (**C6**) and drop
   `eslint-import-resolver-typescript@2` in favour of `import-x`'s own TypeScript
   resolver. `plugin:import/recommended` becomes the `import-x` flat equivalent.
-  Convert `.eslintrc.json` + `build/eslint/eslintrc.js` to `eslint.config.js`. The
   existing config is already structured as `overrides` blocks, which map onto flat
   config's array of config objects fairly directly; the `env` block becomes
   `languageOptions.globals` from the `globals` package.
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
`npx eslint --config ./eslint.config.js source`, never through the npm script.

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

## Open decision

One decision remains, and it is forced by an external constraint rather than by
sequencing.

**TypeScript 7.** Published as 7.0.2, and not lintable: `@typescript-eslint@8` caps at
`<6.1.0` (**C2**), and there is no newer typescript-eslint major — `latest` is 8.72.1,
with no `next` tag. Installing TypeScript 7 alongside it means an `ERESOLVE` peer
conflict to be forced with `--legacy-peer-deps` or an `overrides` entry, and a linter
running outside its supported range against 649 strict-mode files. TypeScript 7 also
appears to be a different compiler build rather than a routine major: its package ships
only a `tsc` bin, where 6.0.3 still ships `tsserver`.

Recommendation: cap P7 at TypeScript 6.0.x (DEP-3) and open a separate roadmap item for
TypeScript 7, gated on typescript-eslint support. That is not a decision to defer
modernization — it is the one place where "as modern as possible" and "lintable" are
genuinely incompatible today, and the lint baseline is worth more than the version
number.

## Exit criteria

These replace P7's original "`npm outdated` reports nothing out of date, and `npm audit`
shows no errors", which is not reachable as written.

-  `npm audit` reports **0 critical and 0 high** advisories. A fully clean audit
   including moderate and low is not reliably achievable in a dev-only toolchain and
   should not gate the project.
-  `npm outdated` is empty **except** for `typescript`, held at 6.0.x by
   `@typescript-eslint`'s peer range (**C2**), with that exception recorded here and in
   `ROADMAP.md`. Every other direct dependency is at latest.
-  Both suites still pass at their baseline counts: 265 Jest suites / 9768 tests, 336
   Jasmine specs. Counts, not just exit codes.
-  `check:types` still fails **only** on `source/node/@test/data/flatDocs.json` (P5's
   baseline), with the same 144 errors.
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
DEP-6  eslint 10 + flat     largest stage
DEP-7  jest 30 + babel 7.x  68 snapshots          (independent of the TS/ESLint chain)
DEP-8  babel 8              after DEP-7
DEP-9  iconv-lite           only runtime change  ← own PR, conformance suite
DEP-10 nodemon 3            trivial; pairs with DEP-11
DEP-11 jasmine 7            loader replacement   ← biggest hidden cost; see C10
DEP-12 properties-parser    small, independent
```

Dependency edges: DEP-3 → DEP-4, DEP-3 → DEP-5 → DEP-6, DEP-3 → DEP-11, DEP-7 → DEP-8,
DEP-11 ↔ DEP-10. DEP-1, DEP-2, DEP-9 and DEP-12 are independent of everything and can
land in any order.

Rough effort shape, for scheduling: DEP-1, DEP-2, DEP-9, DEP-10, DEP-12 are small.
DEP-4, DEP-5, DEP-7, DEP-8 are medium and bounded. **DEP-3, DEP-6 and DEP-11 are the
three that can each consume a session or more** — unknown type errors, a config
rewrite, and a loader replacement respectively.
