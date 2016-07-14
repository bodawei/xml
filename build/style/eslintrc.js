/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const OFF = 0;
// const WARN = 1;
const ERROR = 2;

module.exports = {
   extends: 'eslint:recommended',

   // Grouped by the groups found in http://eslint.org/docs/rules/index.html
   rules: {
      // Possible errors
      'comma-dangle': [ ERROR, 'never' ],
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
         properties: 'always'
      } ],
      'comma-spacing': [ ERROR, {
         before: false,
         after: true
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
         tabWidth: 3
      } ],
      'max-block-comment-len': [ ERROR, 72 ],
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
      'template-curly-spacing': [ ERROR, 'never' ]
   },
   env: {
      browser: true,
      es6: true,
      node: true
   }
};
