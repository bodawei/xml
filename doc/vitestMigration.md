# Replacing Jest with Vitest (ROADMAP P10)

This records the exploratory migration from Jest 30 to Vitest 5: what changed, what
the two runners cost, and what is left for a human to decide.

## Verdict

The migration works. All 265 suites and all 9768 tests pass under Vitest, with the
same inline snapshots and the same coverage picture. The diff is large but almost
entirely mechanical: imports, `jest.*` → `vi.*`, the removal of Jest's `done`
callback in favour of promises, and four automock fixes.

Vitest is **not faster than Jest here on full runs** with its default settings. On
the default `forks` pool it is about twice as slow without coverage and about 50%
slower with coverage. Switching to `pool: 'threads'` closes most of the gap. For
incremental watch runs the picture reverses, and Vitest is the faster runner; see
`Watch mode` below.

Whether that trade is worth it is the decision P10 is waiting for. The exploration
branch can be merged as-is, or reverted, without affecting the rest of the roadmap.

## Environment

-  Apple M4, 10 logical CPUs, macOS.
-  Node 26.0.0, npm 11.12.1.
-  Jest 30.5.2 (the `HEAD` before this branch) versus Vitest 5.1.0.
-  Wall-clock figures are `/usr/bin/time -p` around the npm script, so they include
   Node and npm startup. Each figure is a separate run; the machine was busy with
   other work, so the spread matters more than a single number.

## Timings

The full suite is 265 test files and 9768 tests either way.

| Runner                     | Coverage | Runs (wall clock, s) |
| -------------------------- | -------- | -------------------- |
| Jest (baseline)            | babel    | 25.52 (cold), 17.49, 16.51 |
| Vitest, default `forks`    | v8       | 27.50 (cold), 25.22, 24.84 |
| Vitest, `pool: 'threads'`  | v8       | 22.61, 20.57, 22.41        |
| Jest (baseline)            | none     | 13.58, 10.32, 10.60  |
| Vitest, default `forks`    | none     | 19.83, 18.98, 20.31  |
| Vitest, `pool: 'threads'`  | none     | 14.06, 14.62, 13.45  |

Vitest reports its own duration a little lower than the wall clock; the table uses
wall clock for an apples-to-apples comparison with Jest.

The default `forks` pool spawns one process per test file (265 starts, about 320 ms
each). `pool: 'threads'` reuses threads and is what the committed config now uses.
`isolate: false` was also tried and is not usable: 46 files and 181 tests failed
because module state leaks between files.

Coverage takes a bigger toll under Vitest's v8 provider than under Jest's Babel
provider. With `threads`, coverage costs Vitest about 7 s; it costs Jest about 6 s.
The suites are otherwise close.

## Watch mode

The picture reverses for incremental runs. These were measured with a small pty
harness that writes a file, waits for the next run to finish, and records the wall
clock from the write to the runner's completion line. Same machine, same edits;
coverage rows use each runner's documented script.

| Edit                           | Files rerun | Vitest      | Jest        |
| ------------------------------ | ----------- | ----------- | ----------- |
| one test file                  | 1           | 0.27-0.39 s | 0.52-0.68 s |
| `xToken` source file           | 9           | 2.8-4.0 s   | 7.2-10.8 s  |
| one test file, coverage        | 1           | 0.41-0.49 s | 3.5-6.9 s   |
| `xToken` source file, coverage | 9           | 3.5-4.8 s   | 2.7-3.2 s   |
| `basic` barrel export          | ~all        | 9.0-14.4 s  | 5.9-17.2 s  |

Vitest keeps the Vite module graph and transformed modules hot, so a test-file edit
is roughly twice as fast without coverage and much faster with coverage. A source
edit stays fast while the affected subgraph is small. But most `basic` (and some
`xToken`) modules are re-exported through a barrel, so editing one invalidates
almost every test file (`basic` is imported by nearly the whole suite). There both
runners behave like a full run and Vitest has no advantage.

Startup differs too: `vitest --watch` runs the whole suite once when it starts
(about 6-7 s here), while `jest --watch` on a clean tree starts idle with "No tests
found related to files changed since last commit" and only runs suites related to
changes.

Caveat: these runs overlapped with heavy external load (load average above 50 for
part of the session), so treat the figures as orders of magnitude. The direction was
consistent across repeated edits and matches the public reports.

## Coverage

Same include/exclude rules, different instrumentation:

| Provider            | Statements | Branches | Functions | Lines  |
| ------------------- | ---------- | -------- | --------- | ------ |
| Jest (babel)        | 98.18      | 98.40    | 98.57     | 98.18  |
| Vitest (v8)         | 98.09      | 98.31    | 98.46     | 98.08  |

The roughly 0.1 point difference is expected from v8 function/statement accounting,
not from lost tests. Output goes to `temp/coverage-vitest` instead of
`temp/coverage-jest`.

## What changed

Configuration:

-  `jest.config.js` is replaced by `vitest.config.mts`. The `moduleNameMapper`
   aliases became `resolve.alias`, `testMatch` became `test.include`, and
   `setupFilesAfterEnv` became `test.setupFiles`. `globals: true` keeps the existing
   style where most specs use bare `describe` / `it` / `expect`.
-  `test.pool` is `'threads'` (see above), `clearMocks` stays on, and the coverage
   provider is `v8` with the old `collectCoverageFrom` list carried over.
-  `testTimeout` is 10 s instead of Jest's 5 s. The heaviest conformance tests can
   exceed 5 s when many workers share a loaded machine, which showed up as random
   one-test failures while measuring.
-  The five `beforeJest.ts` setup files are now `vitestSetup.ts`.
-  `tsconfig.json` uses `vitest/globals` and `vite/client` instead of `jest`, and
   `build/vitestSetup.ts` replaces `build/beforeJest.ts`.
-  `package.json` drops `jest`, `@jest/globals` and `@types/jest`, adds `vitest` and
   `@vitest/coverage-v8`, and renames `jest:all` / `jest` to `vitest:all` / `vitest`.
-  The CI job is now `Vitest` and runs `npm run vitest:all`.

Specs:

-  Every `@jest/globals` import becomes `vitest`; `jest.fn`, `jest.mock`,
   `jest.spyOn`, `jest.restoreAllMocks` and `jest.resetAllMocks` become the `vi.*`
   equivalents in 177 `vi.mock`, 60 `vi.spyOn` and 48 `vi.fn` call sites.
-  `jest.Mock` and `jest.MockedFunction` type references became `Mock` and
   `MockedFunction` imported from `vitest`.
-  Vitest 5 throws on Jest's `done` callback ("done() callback is deprecated"). 404
   tests were rewritten from `it(name, (done) => { ... })` to
   `it(name, () => new Promise<void>((done) => { ... }))`, which keeps the existing
   `done()` calls as the promise resolver. This is the bulk of the diff.
-  Tests that call `mockImplementation()` with no argument (10 sites) now pass an
   explicit `() => undefined`.

Automock differences (six failing tests, four fixes):

-  `pToXTokenStream`: construct the expected `TextXToken` once and reuse the
   instance, instead of constructing two auto-mocked instances and comparing them.
-  `pTokenLiteralParser`: partially mock `../token/text` so `TextPToken` stays real
   while `parseText` is still a mock. Vitest's auto-mocked instances carry a
   per-instance `constructor` property, so two of them are never structurally equal.
-  `attListDeclaration`: the mocked `WordListPToken` now uses a constructable
   function implementation. `mockReturnValue` cannot be used when the mock is called
   with `new`.
-  `elementStartXToken` / `elementEmptyXToken`: same constructable-function fix for
   the mocked `AttributeX`.

Other differences:

-  Vite's JSON loader rejects the lone surrogate escape `\ud800` in
   `source/conformance/@test/data/xmlconf.json`, which Node's `JSON.parse` accepts.
   That file is loaded with `?raw` and parsed by hand; `vite/client` supplies the
   module type.
-  Vitest gives `vi.spyOn` a proper `MockedFunction` type, so a number of
   `as MockedFunction<...>` assertions on spies are unnecessary and were removed.
-  All 68 inline snapshots matched unchanged. Test files are still named
   `*.jest.ts`, because `.test.ts` is taken by the Jasmine specs.

## Open questions for the human

1. Keep the migration or revert it? The branch is self-contained if reverted.
2. Rename `*.jest.ts` to something runner-neutral (for example `*.vitest.ts`)
   before merging, or wait for P11 to settle the naming of the merged suite?
3. Stay with Vitest's `v8` coverage provider (the Vitest default) or add
   `@vitest/coverage-istanbul` for numbers closer to Jest's Babel provider?
4. Keep `pool: 'threads'`? It is faster and all tests pass, but Vitest's own
   default is `forks` for isolation robustness.
