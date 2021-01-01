/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
const { rules: baseBestPracticesRules } = require('eslint-config-airbnb-base/rules/best-practices');
const { rules: baseErrorsRules } = require('eslint-config-airbnb-base/rules/errors');
const { rules: baseES6Rules } = require('eslint-config-airbnb-base/rules/es6');
const { rules: baseStyleRules } = require('eslint-config-airbnb-base/rules/style');
const { rules: baseVariablesRules } = require('eslint-config-airbnb-base/rules/variables');

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
   extends: [
   ],

   // Grouped by the groups found in http://eslint.org/docs/rules/index.html
   rules: {
      // Possible errors
      // 'comma-dangle': [ ERROR, 'always-multiline' ],
      // 'no-extra-parens': [ ERROR, 'functions' ],

      // // Best practices
      // 'dot-location': [ ERROR, 'property' ],
      // 'dot-notation': [ ERROR, { allowKeywords: true } ],
      // eqeqeq: ERROR,
      // 'no-alert': ERROR,
      // 'no-caller': ERROR,
      // 'no-case-declarations': OFF,
      // 'no-empty-pattern': ERROR,
      // 'no-eval': ERROR,
      // 'no-extend-native': ERROR,
      // 'no-extra-bind': ERROR,
      // 'no-implied-eval': ERROR,
      // 'no-iterator': ERROR,
      // 'no-labels': ERROR,
      // 'no-lone-blocks': ERROR,
      // 'no-loop-func': ERROR,
      // 'no-multi-spaces': ERROR,
      // 'no-multi-str': ERROR,
      // 'no-native-reassign': ERROR,
      // 'no-new-func': ERROR,
      // 'no-new-wrappers': ERROR,
      // 'no-octal-escape': ERROR,
      // 'no-proto': ERROR,
      // 'no-return-assign': ERROR,
      // 'no-script-url': ERROR,
      // 'no-self-compare': ERROR,
      // 'no-sequences': ERROR,
      // 'no-unused-expressions': ERROR,
      // 'no-useless-call': ERROR,
      // 'no-useless-concat': ERROR,
      // 'no-void': ERROR,
      // 'no-with': ERROR,
      // radix: ERROR,
      // yoda: [ ERROR, 'never' ],

      // // Strict mode
      // strict: [ ERROR, 'global' ],

      // // Variables
      // 'no-catch-shadow': ERROR,
      // 'no-delete-var': ERROR,
      // 'no-label-var': ERROR,
      // 'no-shadow-restricted-names': ERROR,
      // 'no-undef-init': ERROR,

      // // Node.js and CommonJS  (and Browserify)
      // 'global-require': ERROR,
      // 'no-process-exit': ERROR,

      // // Stylistic Issues
      // 'array-bracket-spacing': [ ERROR, 'always' ],
      // 'block-spacing': [ ERROR, 'always' ],
      // 'brace-style': [ ERROR, '1tbs', { allowSingleLine: true } ],
      // camelcase: [ ERROR, {
      //    properties: 'always',
      // } ],
      // 'comma-spacing': [ ERROR, {
      //    before: false,
      //    after: true,
      // } ],
      // 'comma-style': [ ERROR, 'last' ],
      // 'computed-property-spacing': [ ERROR, 'never' ],
      // 'eol-last': ERROR,
      // 'consistent-this': [ ERROR, 'self' ],
      // 'func-names': [ ERROR ],
      // 'func-style': [ ERROR, 'declaration' ],
      // indent: [ ERROR, 3, { SwitchCase: 1 } ],
      // 'keyword-spacing': ERROR,
      // 'max-len': [ ERROR, {
      //    code: 120,
      //    tabWidth: 3,
      // } ],
      // // 'max-block-comment-len': [ ERROR, 72 ],
      // 'new-parens': ERROR,
      // 'no-array-constructor': ERROR,
      // 'no-lonely-if': ERROR,
      // 'no-multiple-empty-lines': [ ERROR, { max: 1 } ],
      // 'no-new-object': ERROR,
      // 'no-spaced-func': ERROR,
      // 'no-trailing-spaces': ERROR,
      // 'no-unneeded-ternary': ERROR,
      // 'operator-assignment': [ ERROR, 'always' ],
      // 'quote-props': [ ERROR, 'as-needed' ],
      // quotes: [ ERROR, 'single' ],
      // semi: ERROR,
      // 'semi-spacing': [ 2, {before: false, after: true} ],
      // 'space-before-blocks': [ ERROR, 'always' ],
      // 'space-before-function-paren': [ ERROR, 'never' ],
      // 'space-in-parens': [ ERROR, 'never' ],
      // 'space-infix-ops': ERROR,
      // 'space-unary-ops': [ ERROR, { words: true, nonwords: false } ],

      // // ECMAScript 6
      // 'arrow-spacing': ERROR,
      // 'constructor-super': ERROR,
      // 'no-class-assign': ERROR,
      // 'no-const-assign': ERROR,
      // 'no-dupe-class-members': ERROR,
      // 'no-new-symbol': ERROR,
      // 'no-this-before-super': ERROR,
      // // 'no-useless-constructor': ERROR,
      // 'no-var': ERROR,
      // 'prefer-rest-params': ERROR,
      // 'prefer-const': ERROR,
      // 'prefer-spread': ERROR,
      // 'template-curly-spacing': [ ERROR, 'never' ],
   },
   // parserOptions: {
   //    sourceType: 'module',
   // },
   env: {
      browser: true,
      es6: true,
      node: true,
   },

   overrides: [
      {
         files: [
            './source/attFixer/**/*.ts',
            './source/basic/**/*.ts',
            './source/expand/**/*.ts',
            './source/conformance/**/*.ts',
            './source/pToken/**/*.ts',
            './source/sToken/**/*.ts',
            './source/stringify/**/*.ts',
            './source/valid/**/*.ts',
            './source/wellformedness/**/*.ts',
            './source/xToken/**/*.ts',

            './source/**/charRef*.ts',
            './source/**/parameterEntityReference*.ts',
            './source/token/bridge/section.ts',
            './source/token/conditional.ts',
            './source/token/common/externalId.ts',
         ],
         parser: '@typescript-eslint/parser',
         parserOptions: {
            project: './tsconfig.json',
            tsconfigRootDir: './',
            warnOnUnsupportedTypeScriptVersion: true,
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
          plugins: [
            '@typescript-eslint',
            'prettier',
         ],
         extends: [
            'plugin:prettier/recommended',
            'prettier',
            'prettier/react',
            'plugin:@typescript-eslint/eslint-recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:@typescript-eslint/recommended-requiring-type-checking',
         ],
         rules: {
            'prettier/prettier': 'error',
            'no-unused-vars': 'off',
            // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin
            '@typescript-eslint/adjacent-overload-signatures': 'error',
            '@typescript-eslint/array-type': [ 'error', { default: 'generic' } ],
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/ban-ts-comment': [ 'error' ],
            // , {
            //    'ts-expect-error': 'allow-with-description',
            //    'ts-ignore': true,
            //    'ts-nocheck': true,
            //    'ts-check': false,
            //    minimumDescriptionLength: 3,
            // } ],
            // '@typescript-eslint/ban-tslint-comment': 'error',
            '@typescript-eslint/ban-types': ['error', /* using the defaults */ ],
            '@typescript-eslint/class-literal-property-style': ["error", "fields"],
            '@typescript-eslint/consistent-type-assertions': ["error", { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }],
            "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
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
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-dynamic-delete.md
            //  // "@typescript-eslint/no-dynamic-delete": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-interface.md
            //  // "@typescript-eslint/no-empty-interface": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md
            //  // "@typescript-eslint/no-explicit-any": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-non-null-assertion.md
            //  // "@typescript-eslint/no-extra-non-null-assertion": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extraneous-class.md
            //  // "@typescript-eslint/no-extraneous-class": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-floating-promises.md
            //  // "@typescript-eslint/no-floating-promises": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-for-in-array.md
            //  // "@typescript-eslint/no-for-in-array": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-implied-eval.md
            //  // "@typescript-eslint/no-implied-eval": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-inferrable-types.md
            //  // "@typescript-eslint/no-inferrable-types": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-invalid-void-type.md
            //  // "@typescript-eslint/no-invalid-void-type": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-misused-new.md
            //  // "@typescript-eslint/no-misused-new": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-misused-promises.md
            //  // "@typescript-eslint/no-misused-promises": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-namespace.md
            //  // "@typescript-eslint/no-namespace": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-non-null-asserted-optional-chain.md
            //  // "@typescript-eslint/no-non-null-asserted-optional-chain": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-non-null-assertion.md
            //  // "@typescript-eslint/no-non-null-assertion": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-parameter-properties.md
            //  // "@typescript-eslint/no-parameter-properties": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-require-imports.md
            //  // "@typescript-eslint/no-require-imports": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-throw-literal.md
            //  // "@typescript-eslint/no-throw-literal": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-type-alias.md
            //  // "@typescript-eslint/no-type-alias": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-boolean-literal-compare.md
            //  // "@typescript-eslint/no-unnecessary-boolean-literal-compare": ["error"],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-condition.md
            //  '@typescript-eslint/no-unnecessary-condition': ['error'],
     
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
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-type-assertion.md
            //  '@typescript-eslint/no-unnecessary-type-assertion': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-assignment.md
            //  '@typescript-eslint/no-unsafe-assignment': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-call.md
            //  '@typescript-eslint/no-unsafe-call': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-member-access.md
            //  '@typescript-eslint/no-unsafe-member-access': ['error'],
     
            //  // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-return.md
            //  '@typescript-eslint/no-unsafe-return': ['error'],
     
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
     
             // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-reduce-type-parameter.md
             '@typescript-eslint/prefer-reduce-type-parameter': ['error'],
     
             // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-regexp-exec.md
             '@typescript-eslint/prefer-regexp-exec': ['error'],
     
             // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-string-starts-ends-with.md
             '@typescript-eslint/prefer-string-starts-ends-with': ['error'],
     
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

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/type-annotation-spacing.md
           '@typescript-eslint/type-annotation-spacing': [
             'error',
             {
               before: true,
               after: true,
               overrides: {
                 colon: { before: false, after: true },
                 /* other overrides available: colon, arrow, variable, parameter, property, returnType with { before: boolean, after: boolean } possible if you want different values for these cases  */
               },
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

          // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/unified-signatures.md
          '@typescript-eslint/unified-signatures': ['error'],

           //
           // Extension Rules
           // In some cases, ESLint provides a rule itself, but it doesn't support TypeScript syntax;
           // either it crashes, or it ignores the syntax, or it falsely reports against it. In these
           // cases, we create what we call an extension rule; a rule within our plugin that has the
           // same functionality, but also supports TypeScript.
           //

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/brace-style.md
           // https://eslint.org/docs/rules/brace-style
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           'brace-style': 'off',
           '@typescript-eslint/brace-style': baseStyleRules['brace-style'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/comma-spacing.md
           // https://eslint.org/docs/rules/comma-spacing
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           'comma-spacing': 'off',
           '@typescript-eslint/comma-spacing': baseStyleRules['comma-spacing'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/default-param-last.md
           // https://eslint.org/docs/rules/default-param-last
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'default-param-last': 'off',
           '@typescript-eslint/default-param-last': baseBestPracticesRules['default-param-last'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/dot-notation.md
           // https://eslint.org/docs/rules/dot-notation
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'dot-notation': 'off',
           '@typescript-eslint/dot-notation': baseBestPracticesRules['dot-notation'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/func-call-spacing.md
           // https://eslint.org/docs/rules/func-call-spacing
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           'func-call-spacing': 'off',
           '@typescript-eslint/func-call-spacing': baseStyleRules['func-call-spacing'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/indent.md
           // https://eslint.org/docs/rules/indent
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           indent: 'off',
         //   '@typescript-eslint/indent': ['error', 3], // baseStyleRules.indent,

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/init-declarations.md
           // https://eslint.org/docs/rules/init-declarations
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/variables.js
           'init-declarations': 'off',
           '@typescript-eslint/init-declarations': baseVariablesRules['init-declarations'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/keyword-spacing.md
           // https://eslint.org/docs/rules/keyword-spacing
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           'keyword-spacing': 'off',
           '@typescript-eslint/keyword-spacing': baseStyleRules['keyword-spacing'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/lines-between-class-members.md
           // https://eslint.org/docs/rules/lines-between-class-members
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           'lines-between-class-members': 'off',
           '@typescript-eslint/lines-between-class-members': baseStyleRules['lines-between-class-members'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-array-constructor.md
           // https://eslint.org/docs/rules/no-array-constructor
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           'no-array-constructor': 'off',
           '@typescript-eslint/no-array-constructor': baseStyleRules['no-array-constructor'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-dupe-class-members.md
           // https://eslint.org/docs/rules/no-dupe-class-members
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/es6.js
           'no-dupe-class-members': 'off',
           '@typescript-eslint/no-dupe-class-members': baseES6Rules['no-dupe-class-members'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-function.md
           // https://eslint.org/docs/rules/no-empty-function
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'no-empty-function': 'off',
           '@typescript-eslint/no-empty-function': baseBestPracticesRules['no-empty-function'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-parens.md
           // https://eslint.org/docs/rules/no-extra-parens
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/errors.js
           'no-extra-parens': 'off',
           '@typescript-eslint/no-extra-parens': baseErrorsRules['no-extra-parens'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-semi.md
           // https://eslint.org/docs/rules/no-extra-semi
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/errors.js
           'no-extra-semi': 'off',
           '@typescript-eslint/no-extra-semi': baseErrorsRules['no-extra-semi'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-invalid-this.md
           // https://eslint.org/docs/rules/no-invalid-this
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'no-invalid-this': 'off',
           '@typescript-eslint/no-invalid-this': baseBestPracticesRules['no-invalid-this'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-magic-numbers.md
           // https://eslint.org/docs/rules/no-magic-numbers
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'no-magic-numbers': 'off',
           '@typescript-eslint/no-magic-numbers': baseBestPracticesRules['no-magic-numbers'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-expressions.md
           // https://eslint.org/docs/rules/no-unused-expressions
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'no-unused-expressions': 'off',
           '@typescript-eslint/no-unused-expressions': baseBestPracticesRules['no-unused-expressions'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars.md
           // https://eslint.org/docs/rules/no-unused-vars
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/variables.js
           'no-unused-vars': 'off',
           '@typescript-eslint/no-unused-vars': baseVariablesRules['no-unused-vars'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md
           // https://eslint.org/docs/rules/no-use-before-define
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/variables.js
           'no-use-before-define': 'off',
           '@typescript-eslint/no-use-before-define': baseVariablesRules['no-use-before-define'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-useless-constructor.md
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/es6.js
           'no-useless-constructor': 'off',
           '@typescript-eslint/no-useless-constructor': baseES6Rules['no-useless-constructor'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/quotes.md\
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           quotes: 'off',
           '@typescript-eslint/quotes': baseStyleRules.quotes,

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/require-await.md
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'require-await': 'off',
           '@typescript-eslint/require-await': baseBestPracticesRules['require-await'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/return-await.md
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'no-return-await': 'off',
           '@typescript-eslint/return-await': baseBestPracticesRules['no-return-await'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/semi.md
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           semi: 'off',
           '@typescript-eslint/semi': baseStyleRules.semi,

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/space-before-function-paren.md
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           'space-before-function-paren': 'off',
           '@typescript-eslint/space-before-function-paren': baseStyleRules['space-before-function-paren'],
         },
         overrides: [ {
            files: [
               './source/**/*.test.ts',
            ],
            rules: {
               '@typescript-eslint/no-non-null-assertion': [ 'off' ],
               '@typescript-eslint/no-empty-function': [ 'off' ],
               '@typescript-eslint/no-explit-any': [ 'off' ],
            },
            env: {
               jasmine: true,
            },
         },]
      },
   ],
};
