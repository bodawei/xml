/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const path = require('path');

// typescript-eslint 8 requires an absolute tsconfigRootDir.
const ROOT = path.resolve(__dirname, '../..');

const OFF = 0;
// const WARN = 1;
const ERROR = 2;

module.exports = {

   parser: '@typescript-eslint/parser',
   parserOptions: {
      project: './tsconfig.json',
      sourceType: 'module',
   },
   plugins: [
      '@typescript-eslint',
   ],
   rules: {
      // 'max-block-comment-len': [ ERROR, 72 ],
   },
   env: {
      browser: true,
      es6: true,
      node: true,
   },

   overrides: [
      {
         files: [
            './source/basic/**/*.ts',
            './source/valid/**/*.ts',
         ],
         parserOptions: {
            project: './tsconfig.json',
            tsconfigRootDir: ROOT,
         },
         extends: [
            'plugin:prettier/recommended', // https://github.com/prettier/eslint-plugin-prettier
            'plugin:import/recommended', // https://www.npmjs.com/package/eslint-plugin-import
            // recommended-type-checked already includes `recommended` and `eslint-recommended`.
            'plugin:@typescript-eslint/recommended-type-checked',
           ],
         // These were supplied by eslint-config-airbnb-typescript/base, which DEP-5 removed.
         settings: {
            'import/parsers': {
               '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
            },
            'import/resolver': {
               node: {
                  extensions: ['.mjs', '.js', '.json', '.ts', '.d.ts'],
               },
            },
            'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.d.ts'],
            'import/external-module-folders': ['node_modules', 'node_modules/@types'],
         },
         rules: {
            // Also supplied by airbnb-typescript/base for .ts files: TypeScript already checks these.
            'import/named': 'off',
            'import/no-named-as-default-member': 'off',
            'import/no-unresolved': 'off',
            "import/order": ['error', {
               groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
               'newlines-between': 'always',
               alphabetize: {
                  order: 'asc',
                  caseInsensitive: true,
               },
               warnOnUnassignedImports: true
            }],
         },
         overrides: [ {
            files: [
               './source/**/*.jest.ts',
               './source/**/beforeJest.ts',
            ],
            rules: {
               '@typescript-eslint/no-non-null-assertion': [ 'off' ],
               '@typescript-eslint/no-empty-function': [ 'off' ],
               '@typescript-eslint/no-unsafe-argument': [ 'off' ],
               '@typescript-eslint/no-unsafe-call': [ 'off' ],
               "import/no-extraneous-dependencies": [
                  //  Don't let the @jest/globals import mess up the reporting
                  'error' , { devDependencies: true }
               ],
            },
         },]
      },

      {
         files: [
            './source/flat/**/*.ts',
            './source/xToken/**/*.ts',

            './source/attFixer/**/*.ts',
            './source/conformance/**/*.ts',
            './source/demo/**/*.ts',
            './source/expand/**/*.ts',
            './source/pToken/**/*.ts',
            './source/sToken/**/*.ts',
            './source/wellformedness/**/*.ts',

            './source/node/**/PToXTokenStream*.ts',
            './source/**/charRef*.ts',
            './source/**/parameterEntityReference*.ts',
            './source/token/bridge/section.ts',
            './source/token/conditional.ts',
            './source/token/common/externalId.ts',
         ],
         parserOptions: {
            project: './tsconfig.json',
            tsconfigRootDir: ROOT,
          },
          settings: {
            'import/parsers': {
              '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
            },
            'import/resolver': {
              node: {
                extensions: ['.ts', '.tsx'],
              },
            },
            'import/extensions': ['.ts', '.mjs'],
          },
         extends: [
            // Includes the `prettier` plugin, `eslint-config-prettier` and `prettier/prettier`.
            'plugin:prettier/recommended',
            // Includes `recommended` and `eslint-recommended`, the parser and the plugin.
            'plugin:@typescript-eslint/recommended-type-checked',
            'plugin:@typescript-eslint/stylistic-type-checked',
            'plugin:@typescript-eslint/strict-type-checked',
         ],
         rules: {
            // https://eslint.org/docs/rules/sort-keys
            'sort-keys': ['error', 'asc', { caseSensitive: false, minKeys: 2, natural: true }],

            // strict-type-checked: numbers in template strings are harmless.
            '@typescript-eslint/restrict-template-expressions': [
               'error',
               // The strict-type-checked options, except for allowNumber.
               { allowAny: false, allowBoolean: false, allowNullish: false, allowNumber: true, allowRegExp: false },
            ],

            // strict-type-checked: this codebase deliberately spreads token (class instance) data
            // into a modified props object, e.g. `{ ...pToken, externalId }`. The token classes are
            // plain data holders, so losing the prototype is the intent.
            '@typescript-eslint/no-misused-spread': 'off',

            '@typescript-eslint/array-type': [ 'error', { default: 'generic' } ],
            // , {
            //    'ts-expect-error': 'allow-with-description',
            //    'ts-ignore': true,
            //    'ts-nocheck': true,
            //    'ts-check': false,
            //    minimumDescriptionLength: 3,
            // } ],
            // '@typescript-eslint/ban-tslint-comment': 'error',
            '@typescript-eslint/consistent-type-assertions': ["error", { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }],
            // '@typescript-eslint/consistent-type-imports': ["error", {
            //    prefer: 'type-imports',
            //    disallowTypeAnnotations: true,
            // }],
            // '@typescript-eslint/explicit-function-return-type': ['error' ],
            // , {
            //    allowExpressions: false,
            //    allowTypedFunctionExpressions: false,
            //    allowHigherOrderFunctions: true,
            //    allowConciseArrowFunctionExpressionsStartingWithVoid: true,
            // }],
            // '@typescript-eslint/explicit-member-accessibility': ['error', {
            //    // defaults
            //    accessibility: 'explicit',
            //    ignoredMethodNames: [],
            //    overrides: {
            //      accessors: 'explicit',
            //      constructors: 'explicit',
            //      methods: 'explicit',
            //      properties: 'explicit',
            //      parameterProperties: 'explicit',
            //    }
            // }],
            // '@typescript-eslint/explicit-module-boundary-types': ['error', {
            //    allowArgumentsExplicitlyTypedAsAny: true,
            //    allowDirectConstAssertionInArrowFunctions: true,
            //    allowedNames: [],
            //    allowHigherOrderFunctions: true,
            //    allowTypedFunctionExpressions: false,
            // }],

            
            // FRM WORK

            // 'import/extensions': [
            //    // This says: do not allow filename extensions for .js, .ts, etc files in import statements
            //    'error',
            //    'ignorePackages',
            //    {
            //      js: 'never',
            //      ts: 'never',
            //      jsx: 'never',
            //      tsx: 'never',
            //    },
            //  ],
            //  // Override a couple airbnb defaults: require named exports and require .tsx for JSX files
            //  'import/no-default-export': ['error'],
            //  'import/prefer-default-export': 'off',
            //  'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
     
            //  // All Typescript eslint rules follow
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/adjacent-overload-signatures.md
            //  '@typescript-eslint/adjacent-overload-signatures': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/array-type.md
            //  '@typescript-eslint/array-type': [
            //    'error',
            //    {
            //      default: 'generic',
            //      readonly: 'generic',
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/await-thenable.md
            //  '@typescript-eslint/await-thenable': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-ts-comment.md
            //  '@typescript-eslint/ban-ts-comment': [
            //    'error',
            //    {
            //      'ts-expect-error': 'allow-with-description',
            //      'ts-ignore': 'allow-with-description',
            //      'ts-nocheck': 'allow-with-description',
            //      'ts-check': 'allow-with-description',
            //      minimumDescriptionLength: 15,
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-types.md
            //  '@typescript-eslint/ban-types': ['error'], // using all the defaults
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/class-literal-property-style.md
            //  '@typescript-eslint/class-literal-property-style': ['error', 'getters'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-assertions.md
            //  '@typescript-eslint/consistent-type-assertions': [
            //    'error',
            //    { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-definitions.md
            //  '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-function-return-type.md
            //  '@typescript-eslint/explicit-function-return-type': [
            //    'error',
            //    {
            //      allowExpressions: true,
            //      allowTypedFunctionExpressions: true,
            //      allowHigherOrderFunctions: true,
            //      allowConciseArrowFunctionExpressionsStartingWithVoid: true,
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-member-accessibility.md
            //  '@typescript-eslint/explicit-member-accessibility': [
            //    'error',
            //    { accessibility: 'explicit' },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-module-boundary-types.md
            //  '@typescript-eslint/explicit-module-boundary-types': [
            //    'error',
            //    {
            //      allowArgumentsExplicitlyTypedAsAny: false,
            //      allowDirectConstAssertionInArrowFunctions: true,
            //      allowedNames: [],
            //      allowHigherOrderFunctions: true,
            //      allowTypedFunctionExpressions: true,
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/member-delimiter-style.md
            //  '@typescript-eslint/member-delimiter-style': [
            //    'error',
            //    {
            //      multiline: {
            //        delimiter: 'semi',
            //        requireLast: true,
            //      },
            //      singleline: {
            //        delimiter: 'semi',
            //        requireLast: false,
            //      },
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/member-ordering.md
            //  '@typescript-eslint/member-ordering': [
            //    'error',
            //    // This is the default configuration for this rule
            //    {
            //      default: [
            //        // Index signature
            //        'signature',
     
            //        // Fields
            //        'public-static-field',
            //        'protected-static-field',
            //        'private-static-field',
     
            //        'public-decorated-field',
            //        'protected-decorated-field',
            //        'private-decorated-field',
     
            //        'public-instance-field',
            //        'protected-instance-field',
            //        'private-instance-field',
     
            //        'public-abstract-field',
            //        'protected-abstract-field',
            //        'private-abstract-field',
     
            //        'public-field',
            //        'protected-field',
            //        'private-field',
     
            //        'static-field',
            //        'instance-field',
            //        'abstract-field',
     
            //        'decorated-field',
     
            //        'field',
     
            //        // Constructors
            //        'public-constructor',
            //        'protected-constructor',
            //        'private-constructor',
     
            //        'constructor',
     
            //        // Methods
            //        'public-static-method',
            //        'protected-static-method',
            //        'private-static-method',
     
            //        'public-decorated-method',
            //        'protected-decorated-method',
            //        'private-decorated-method',
     
            //        'public-instance-method',
            //        'protected-instance-method',
            //        'private-instance-method',
     
            //        'public-abstract-method',
            //        'protected-abstract-method',
            //        'private-abstract-method',
     
            //        'public-method',
            //        'protected-method',
            //        'private-method',
     
            //        'static-method',
            //        'instance-method',
            //        'abstract-method',
     
            //        'decorated-method',
     
            //        'method',
            //      ],
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/method-signature-style.md
            //  '@typescript-eslint/method-signature-style': ['error', 'property'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md
            //  '@typescript-eslint/naming-convention': [
            //    'error',
            //    // This is NOT the default
            //    {
            //      selector: 'default',
            //      format: ['strictCamelCase'],
            //      leadingUnderscore: 'forbid',
            //      trailingUnderscore: 'forbid',
            //    },
            //    {
            //      selector: 'variable',
            //      format: ['strictCamelCase', 'UPPER_CASE'],
            //      types: ['boolean'],
            //      prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
            //      leadingUnderscore: 'forbid',
            //      trailingUnderscore: 'forbid',
            //    },
            //    {
            //      selector: 'variable',
            //      format: ['strictCamelCase', 'StrictPascalCase', 'UPPER_CASE'],
            //      leadingUnderscore: 'forbid',
            //      trailingUnderscore: 'forbid',
            //    },
            //    {
            //      selector: 'variableLike',
            //      format: ['strictCamelCase', 'UPPER_CASE'],
            //      leadingUnderscore: 'forbid',
            //      trailingUnderscore: 'forbid',
            //    },
            //    {
            //      selector: 'enumMember',
            //      format: ['UPPER_CASE'],
            //      leadingUnderscore: 'forbid',
            //      trailingUnderscore: 'forbid',
            //    },
            //    {
            //      selector: 'typeLike',
            //      format: ['StrictPascalCase'],
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-base-to-string.md
            //  '@typescript-eslint/no-base-to-string': [
            //    'error',
            //    // This is the default
            //    {
            //      ignoredTypeNames: ['RegExp'],
            //    },
            //  ],
     
             // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-interface.md
             "@typescript-eslint/no-empty-interface": ["error"],
     
             // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/parameter-properties.md
             "@typescript-eslint/parameter-properties": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-type-alias.md
            //  "@typescript-eslint/no-type-alias": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-qualifier.md
            //  '@typescript-eslint/no-unnecessary-qualifier': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-type-arguments.md
            //  '@typescript-eslint/no-unnecessary-type-arguments': [
            //    'error' /* 
            //    {
            //      typesToIgnore: [] 
            //    },
            //    */,
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars-experimental.md
            //  // ???
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-var-requires.md
            //  '@typescript-eslint/no-var-requires': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-as-const.md
            //  '@typescript-eslint/prefer-as-const': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-for-of.md
            //  '@typescript-eslint/prefer-for-of': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-function-type.md
            //  '@typescript-eslint/prefer-function-type': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-includes.md
            //  '@typescript-eslint/prefer-includes': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-namespace-keyword.md
            //  '@typescript-eslint/prefer-namespace-keyword': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-nullish-coalescing.md
            //  '@typescript-eslint/prefer-nullish-coalescing': [
            //    'error',
            //    {
            //      // not the default
            //      ignoreConditionalTests: false,
            //      ignoreMixedLogicalExpressions: false,
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-optional-chain.md
            //  '@typescript-eslint/prefer-optional-chain': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-readonly.md
            //  '@typescript-eslint/prefer-readonly': ['error', { onlyInlineLambdas: false }],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-readonly-parameter-types.md
            //  '@typescript-eslint/prefer-readonly-parameter-types': [
            //    'error',
            //    {
            //      // NOT the default
            //      checkParameterProperties: true,
            //    },
            //  ],
     
             // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-ts-expect-error.md
             '@typescript-eslint/prefer-ts-expect-error': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/promise-function-async.md
            //  '@typescript-eslint/promise-function-async': [
            //    'error',
            //    {
            //      allowAny: true,
            //      allowedPromiseNames: [],
            //      checkArrowFunctions: true,
            //      checkFunctionDeclarations: true,
            //      checkFunctionExpressions: true,
            //      checkMethodDeclarations: true,
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/require-array-sort-compare.md
            //  '@typescript-eslint/require-array-sort-compare': ['off'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/restrict-plus-operands.md
            //  '@typescript-eslint/restrict-plus-operands': [
            //    'error',
            //    {
            //      checkCompoundAssignments: true,
            //    },
            //  ],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/restrict-template-expressions.md
            //  '@typescript-eslint/restrict-template-expressions': [
            //    'error',
            //    {
            //      allowNumber: true,
            //      allowBoolean: true,
            //      allowAny: false,
            //      allowNullish: false,
            //    },
            //  ],
     
             // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/strict-boolean-expressions.md
            //  '@typescript-eslint/strict-boolean-expressions': [
            //    'error',
            //    {
            //      allowString: false,
            //      allowNumber: false,
            //      allowNullableObject: false,
            //      allowNullableBoolean: false,
            //      allowNullableString: false,
            //      allowNullableNumber: false,
            //      allowAny: false,
            //    },
            //  ],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/switch-exhaustiveness-check.md
           '@typescript-eslint/switch-exhaustiveness-check': ['error'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/triple-slash-reference.md
           '@typescript-eslint/triple-slash-reference': [
             'error',
             {
               path: 'never',
               types: 'never',
               lib: 'never',
             },
           ],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/typedef.md
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

          // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/unbound-method.md
          '@typescript-eslint/unbound-method': [
            'error',
            {
              ignoreStatic: true,
            },
          ],

           //
           // Extension Rules
           // Option values were copied verbatim from eslint-config-airbnb-base@15 when that
           // package was removed (P7 DEP-6); the airbnb URLs below are provenance only.
           // In some cases, ESLint provides a rule itself, but it doesn't support TypeScript syntax;
           // either it crashes, or it ignores the syntax, or it falsely reports against it. In these
           // cases, we create what we call an extension rule; a rule within our plugin that has the
           // same functionality, but also supports TypeScript.
           //

           '@typescript-eslint/default-param-last': 'error',

           '@typescript-eslint/no-dupe-class-members': 'error',

           '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],

           '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: false, allowTernary: false, allowTaggedTemplates: false }],

           '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],

           '@typescript-eslint/no-use-before-define': ['error', { functions: true, classes: true, variables: true }],

           '@typescript-eslint/require-await': 'off',

           '@typescript-eslint/return-await': 'error',
         },
         overrides: [ {
            files: [
               './source/**/*.test.ts',
               './source/**/*.jest.ts',
            ],
            rules: {
               '@typescript-eslint/no-non-null-assertion': [ 'off' ],
               '@typescript-eslint/no-empty-function': [ 'off' ],
               '@typescript-eslint/no-unsafe-call': [ 'off' ],
            },
            env: {
               jasmine: true,
            },
         },]
      },
   ],
};
