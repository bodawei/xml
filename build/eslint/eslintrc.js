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
         parserOptions: {
            project: './tsconfig.json',
         },
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
         //   'comma-spacing': 'off',
         //   '@typescript-eslint/comma-spacing': baseStyleRules['comma-spacing'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/default-param-last.md
           // https://eslint.org/docs/rules/default-param-last
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
           'default-param-last': 'off',
           '@typescript-eslint/default-param-last': baseBestPracticesRules['default-param-last'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/dot-notation.md
           // https://eslint.org/docs/rules/dot-notation
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/best-practices.js
         //   'dot-notation': 'off',
         //   '@typescript-eslint/dot-notation': baseBestPracticesRules['dot-notation'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/func-call-spacing.md
           // https://eslint.org/docs/rules/func-call-spacing
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
           'func-call-spacing': 'off',
           '@typescript-eslint/func-call-spacing': baseStyleRules['func-call-spacing'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/indent.md
           // https://eslint.org/docs/rules/indent
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
         //   indent: 'off',
         //   '@typescript-eslint/indent': ['error', 3], // baseStyleRules.indent,

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/init-declarations.md
           // https://eslint.org/docs/rules/init-declarations
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/variables.js
           'init-declarations': 'off',
           '@typescript-eslint/init-declarations': baseVariablesRules['init-declarations'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/keyword-spacing.md
           // https://eslint.org/docs/rules/keyword-spacing
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
         //   'keyword-spacing': 'off',
         //   '@typescript-eslint/keyword-spacing': baseStyleRules['keyword-spacing'],

           // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/lines-between-class-members.md
           // https://eslint.org/docs/rules/lines-between-class-members
           // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
         //   'lines-between-class-members': 'off',
         //   '@typescript-eslint/lines-between-class-members':
         //     baseStyleRules['lines-between-class-members'],

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
           '@typescript-eslint/space-before-function-paren':
             baseStyleRules['space-before-function-paren'],
         },
         overrides: [ {
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
         },]
      },
   ],
};
