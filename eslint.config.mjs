/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import-x';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Flat-config replacement for build/eslint/eslintrc.js (DEP-6c).
//
// `files` patterns are relative to this file. A `*.jest.ts` file in the stricter module groups
// below needs the intersection of two glob lists, so those are written as AND-arrays by
// `intersect()`.

const TS_PARSER_OPTIONS = {
   project: './tsconfig.json',
   sourceType: 'module',
   // typescript-eslint requires an absolute path.
   tsconfigRootDir: import.meta.dirname,
};

// Modules held to the `import-x/` rules and typescript-eslint's `recommended-type-checked` set.
const FOUNDATION_DIRS = ['basic', 'valid'];

// Modules (and individual files) held to the full recommended + stylistic + strict sets.
const STRICT_FILES = [
   'source/flat/**/*.ts',
   'source/xToken/**/*.ts',

   'source/attFixer/**/*.ts',
   'source/conformance/**/*.ts',
   'source/demo/**/*.ts',
   'source/expand/**/*.ts',
   'source/pToken/**/*.ts',
   'source/sToken/**/*.ts',
   'source/wellformedness/**/*.ts',

   'source/node/**/PToXTokenStream*.ts',
   'source/**/charRef*.ts',
   'source/**/parameterEntityReference*.ts',
   'source/token/bridge/section.ts',
   'source/token/conditional.ts',
   'source/token/common/externalId.ts',
];

const FOUNDATION_FILES = FOUNDATION_DIRS.map((dir) => `source/${dir}/**/*.ts`);

const JEST_FILES = ['source/**/*.jest.ts', 'source/**/beforeJest.ts'];
const STRICT_TEST_FILES = ['source/**/*.test.ts', 'source/**/*.jest.ts'];

/**
 * An eslintrc nested `overrides` entry applies to files matching both its own patterns and its
 * parent's. A flat `files` entry that is itself an array is an AND, so every (parent, child)
 * pair becomes one AND-array.
 */
function intersect(parents, children) {
   return parents.flatMap((parent) => children.map((child) => [parent, child]));
}

export default defineConfig([
   // Every TypeScript file gets the parser, the plugin and the environment globals, even those
   // outside the rule groups below. (`env: browser, es6, node` in the old config.)
   {
      files: ['**/*.ts'],
      languageOptions: {
         globals: { ...globals.browser, ...globals.node },
         parser: tseslint.parser,
         parserOptions: TS_PARSER_OPTIONS,
      },
      // ESLint 9 turned this on by default. It is off to keep the result identical to ESLint 8;
      // turning it on is a separate cleanup.
      linterOptions: { reportUnusedDisableDirectives: 'off' },
      plugins: { '@typescript-eslint': tseslint.plugin },
   },

   // basic and valid
   {
      files: FOUNDATION_FILES,
      extends: [
         prettierRecommended, // https://github.com/prettier/eslint-plugin-prettier
         importPlugin.flatConfigs.recommended, // https://www.npmjs.com/package/eslint-plugin-import-x
         // recommended-type-checked already includes `recommended` and `eslint-recommended`.
         tseslint.configs.recommendedTypeChecked,
      ],
      // These were supplied by eslint-config-airbnb-typescript/base, which DEP-5 removed.
      settings: {
         'import-x/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.d.ts'],
         'import-x/external-module-folders': ['node_modules', 'node_modules/@types'],
         'import-x/resolver': {
            node: {
               extensions: ['.mjs', '.js', '.json', '.ts', '.d.ts'],
            },
         },
      },
      rules: {
         // Also supplied by airbnb-typescript/base for .ts files: TypeScript already checks these.
         'import-x/named': 'off',
         'import-x/no-named-as-default-member': 'off',
         'import-x/no-unresolved': 'off',

         // These rules parse each imported file, which needs a TypeScript parser that import-x
         // loads by name (`import-x/parsers`). That cannot work with ts7-eslint (DEP-13): the name
         // resolves to the real typescript-eslint parser, which fails on TypeScript 7. TypeScript
         // already checks all of them, and they reported nothing here. `import-x/no-duplicates`
         // and `import-x/order` do not parse imports and stay on.
         'import-x/default': 'off',
         'import-x/export': 'off',
         'import-x/namespace': 'off',
         'import-x/no-named-as-default': 'off',

         'import-x/order': [
            'error',
            {
               alphabetize: { caseInsensitive: true, order: 'asc' },
               groups: [
                  'builtin',
                  'external',
                  'internal',
                  'parent',
                  'sibling',
                  'index',
                  'object',
                  'type',
               ],
               'newlines-between': 'always',
               warnOnUnassignedImports: true,
            },
         ],
      },
   },
   {
      files: intersect(FOUNDATION_FILES, JEST_FILES),
      rules: {
         '@typescript-eslint/no-empty-function': 'off',
         '@typescript-eslint/no-non-null-assertion': 'off',
         '@typescript-eslint/no-unsafe-argument': 'off',
         '@typescript-eslint/no-unsafe-call': 'off',
         // Don't let the @jest/globals import mess up the reporting.
         'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
   },

   // The rest of the modules
   {
      files: STRICT_FILES,
      extends: [
         // Includes the `prettier` plugin, `eslint-config-prettier` and `prettier/prettier`.
         prettierRecommended,
         // Each includes the ones before it; `recommended` and `eslint-recommended` come first.
         tseslint.configs.recommendedTypeChecked,
         tseslint.configs.stylisticTypeChecked,
         tseslint.configs.strictTypeChecked,
      ],
      rules: {
         // https://eslint.org/docs/rules/sort-keys
         'sort-keys': ['error', 'asc', { caseSensitive: false, minKeys: 2, natural: true }],

         // strict-type-checked: numbers in template strings are harmless.
         '@typescript-eslint/restrict-template-expressions': [
            'error',
            // The strict-type-checked options, except for allowNumber.
            {
               allowAny: false,
               allowBoolean: false,
               allowNullish: false,
               allowNumber: true,
               allowRegExp: false,
            },
         ],

         // strict-type-checked: this codebase deliberately spreads token (class instance) data
         // into a modified props object, e.g. `{ ...pToken, externalId }`. The token classes are
         // plain data holders, so losing the prototype is the intent.
         '@typescript-eslint/no-misused-spread': 'off',

         '@typescript-eslint/array-type': ['error', { default: 'generic' }],
         '@typescript-eslint/consistent-type-assertions': [
            'error',
            { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
         ],
         '@typescript-eslint/default-param-last': 'error',
         '@typescript-eslint/no-dupe-class-members': 'error',
         '@typescript-eslint/no-empty-function': [
            'error',
            { allow: ['arrowFunctions', 'functions', 'methods'] },
         ],
         '@typescript-eslint/no-empty-interface': ['error'],
         '@typescript-eslint/no-unused-expressions': [
            'error',
            { allowShortCircuit: false, allowTaggedTemplates: false, allowTernary: false },
         ],
         '@typescript-eslint/no-unused-vars': [
            'error',
            { args: 'after-used', ignoreRestSiblings: true, vars: 'all' },
         ],
         '@typescript-eslint/no-use-before-define': [
            'error',
            { classes: true, functions: true, variables: true },
         ],
         '@typescript-eslint/parameter-properties': ['error'],
         '@typescript-eslint/prefer-ts-expect-error': ['error'],
         '@typescript-eslint/require-await': 'off',
         '@typescript-eslint/return-await': 'error',
         '@typescript-eslint/switch-exhaustiveness-check': ['error'],
         '@typescript-eslint/triple-slash-reference': [
            'error',
            { lib: 'never', path: 'never', types: 'never' },
         ],
         '@typescript-eslint/typedef': [
            'error',
            {
               arrayDestructuring: false,
               arrowParameter: false,
               memberVariableDeclaration: false,
               objectDestructuring: false,
               parameter: false,
               propertyDeclaration: false,
               variableDeclaration: false,
               variableDeclarationIgnoreFunction: false,
            },
         ],
         '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
      },
   },
   {
      files: intersect(STRICT_FILES, STRICT_TEST_FILES),
      languageOptions: {
         globals: globals.jasmine,
      },
      rules: {
         '@typescript-eslint/no-empty-function': 'off',
         '@typescript-eslint/no-non-null-assertion': 'off',
         '@typescript-eslint/no-unsafe-call': 'off',
      },
   },
   // Turned off because ts7-eslint 0.2.1 (the TypeScript 7 linter, DEP-13) crashes in these rules
   // instead of reporting. They are off now so the TypeScript 7 move is mechanical. RE-ENABLE them
   // when ts7-eslint fixes the crashes, or if we stay on TypeScript 6 (delete this block).
   //
   // - no-deprecated: "getNodeId requires a RemoteNode" on ~115 files. 0 findings on TypeScript 6.
   // - no-unnecessary-condition: "checker.getTypeOfPropertyOfType is not a function".
   //   49 findings on TypeScript 6, left unfixed deliberately: verifying that the types are right
   //   is expensive, and some of this code is of uncertain lineage.
   // - no-unnecessary-type-assertion: "ts.canHaveModifiers is not a function". 15 findings on
   //   TypeScript 6, all auto-fixable.
   {
      files: ['**/*.ts'],
      rules: {
         '@typescript-eslint/no-deprecated': 'off',
         '@typescript-eslint/no-unnecessary-condition': 'off',
         '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      },
   },
]);
