/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const OFF = 0;
// const WARN = 1;
const ERROR = 2;

module.exports = {
   extends: 'eslint:recommended',

   // Grouped by the groups found in http://eslint.org/docs/rules/index.html
   rules: {
      // Possible errors
      'comma-dangle': [ ERROR, 'always-multiline' ],
      'no-extra-parens': [ ERROR, 'functions' ],

      // Best practices
      'dot-location': [ ERROR, 'property' ],
      'dot-notation': [ ERROR, { allowKeywords: true } ],
      eqeqeq: ERROR,
      'no-alert': ERROR,
      'no-caller': ERROR,
      'no-case-declarations': OFF,
      'no-empty-pattern': ERROR,
      'no-eval': ERROR,
      'no-extend-native': ERROR,
      'no-extra-bind': ERROR,
      'no-implied-eval': ERROR,
      'no-iterator': ERROR,
      'no-labels': ERROR,
      'no-lone-blocks': ERROR,
      'no-loop-func': ERROR,
      'no-multi-spaces': ERROR,
      'no-multi-str': ERROR,
      'no-native-reassign': ERROR,
      'no-new-func': ERROR,
      'no-new-wrappers': ERROR,
      'no-octal-escape': ERROR,
      'no-proto': ERROR,
      'no-return-assign': ERROR,
      'no-script-url': ERROR,
      'no-self-compare': ERROR,
      'no-sequences': ERROR,
      'no-unused-expressions': ERROR,
      'no-useless-call': ERROR,
      'no-useless-concat': ERROR,
      'no-void': ERROR,
      'no-with': ERROR,
      radix: ERROR,
      yoda: [ ERROR, 'never' ],

      // Strict mode
      strict: [ ERROR, 'global' ],

      // Variables
      'no-catch-shadow': ERROR,
      'no-delete-var': ERROR,
      'no-label-var': ERROR,
      'no-shadow-restricted-names': ERROR,
      'no-undef-init': ERROR,

      // Node.js and CommonJS  (and Browserify)
      'global-require': ERROR,
      'no-process-exit': ERROR,

      // Stylistic Issues
      'array-bracket-spacing': [ ERROR, 'always' ],
      'block-spacing': [ ERROR, 'always' ],
      'brace-style': [ ERROR, '1tbs', { allowSingleLine: true } ],
      camelcase: [ ERROR, {
         properties: 'always',
      } ],
      'comma-spacing': [ ERROR, {
         before: false,
         after: true,
      } ],
      'comma-style': [ ERROR, 'last' ],
      'computed-property-spacing': [ ERROR, 'never' ],
      'eol-last': ERROR,
      'consistent-this': [ ERROR, 'self' ],
      'func-names': [ ERROR ],
      'func-style': [ ERROR, 'declaration' ],
      indent: [ ERROR, 3, { SwitchCase: 1 } ],
      'keyword-spacing': ERROR,
      'max-len': [ ERROR, {
         code: 120,
         tabWidth: 3,
      } ],
      // 'max-block-comment-len': [ ERROR, 72 ],
      'new-parens': ERROR,
      'no-array-constructor': ERROR,
      'no-lonely-if': ERROR,
      'no-multiple-empty-lines': [ ERROR, { max: 1 } ],
      'no-new-object': ERROR,
      'no-spaced-func': ERROR,
      'no-trailing-spaces': ERROR,
      'no-unneeded-ternary': ERROR,
      'operator-assignment': [ ERROR, 'always' ],
      'quote-props': [ ERROR, 'as-needed' ],
      quotes: [ ERROR, 'single' ],
      semi: ERROR,
      'semi-spacing': [ 2, {before: false, after: true} ],
      'space-before-blocks': [ ERROR, 'always' ],
      'space-before-function-paren': [ ERROR, 'never' ],
      'space-in-parens': [ ERROR, 'never' ],
      'space-infix-ops': ERROR,
      'space-unary-ops': [ ERROR, { words: true, nonwords: false } ],

      // ECMAScript 6
      'arrow-spacing': ERROR,
      'constructor-super': ERROR,
      'no-class-assign': ERROR,
      'no-const-assign': ERROR,
      'no-dupe-class-members': ERROR,
      'no-new-symbol': ERROR,
      'no-this-before-super': ERROR,
      'no-useless-constructor': ERROR,
      'no-var': ERROR,
      'prefer-rest-params': ERROR,
      'prefer-const': ERROR,
      'prefer-spread': ERROR,
      'template-curly-spacing': [ ERROR, 'never' ],
   },
   parserOptions: {
      sourceType: 'module',
   },
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
            './source/stringify/**/*.ts',
            './source/wellformedness/**/*.ts',
            './source/xToken/**/*.ts',

            './source/**/charRef*.ts',
            './source/**/parameterEntityReference*.ts',
            './source/token/bridge/section.ts',
            './source/token/conditional.ts',
            './source/token/common/externalId.ts',
         ],
         parser: '@typescript-eslint/parser',
         plugins: [
            '@typescript-eslint',
            'prettier',
         ],
         extends: [
            'plugin:prettier/recommended',
            'plugin:@typescript-eslint/eslint-recommended',
            'plugin:@typescript-eslint/recommended',
         ],
         rules: {
            'prettier/prettier': 'error',
            'no-unused-vars': 'off',
            // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin
            '@typescript-eslint/adjacent-overload-signatures': 'error',
            '@typescript-eslint/array-type': [ 'error', { default: 'array' } ],
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/ban-ts-comment': [ 'error', {
               'ts-expect-error': 'allow-with-description',
               'ts-ignore': true,
               'ts-nocheck': true,
               'ts-check': false,
               minimumDescriptionLength: 3,
            } ],
            '@typescript-eslint/ban-tslint-comment': 'error',
            '@typescript-eslint/ban-types': ['error', /* using the defaults */ ],
            '@typescript-eslint/class-literal-property-style': ["error", "fields"],
            '@typescript-eslint/consistent-type-assertions': ["error", { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }],
            "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
            '@typescript-eslint/consistent-type-imports': ["error", {
               prefer: 'type-imports',
               disallowTypeAnnotations: true,
            }],
            '@typescript-eslint/explicit-function-return-type': ['error', {
               allowExpressions: false,
               allowTypedFunctionExpressions: true,
               allowHigherOrderFunctions: true,
               allowConciseArrowFunctionExpressionsStartingWithVoid: true,             
            }],
            '@typescript-eslint/explicit-function-return-type': ['error', {
               allowExpressions: true,
               allowTypedFunctionExpressions: true,
               allowHigherOrderFunctions: true,
               allowConciseArrowFunctionExpressionsStartingWithVoid: true,
            }],
         },
         overrides: [
            {
               files: [
                  './source/**/*.test.ts',
               ],
               rules: {
                  '@typescript-eslint/no-non-null-assertion': [ 'off' ],
                  '@typescript-eslint/no-empty-function': [ 'off' ],
               },
               env: {
                  jasmine: true,
               },
            },
         ],
      },
   ],
};
