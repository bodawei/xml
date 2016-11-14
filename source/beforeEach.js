/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const SyntaxError = require('./error/SyntaxError.js');

function toBeSyntaxError() {
   return {
      compare: (actual, expected) => {
         const typePass = actual instanceof SyntaxError;
         const codePass = actual.code === expected;
         let message;

         if (typePass && codePass) {
            message = 'Expected syntax error code ' + actual.code +
               ' not to match ' + expected + '.';
         } else {
            message = 'Expected syntax error code ' + actual.code +
               ' to match ' + expected + '.';
         }

         return {
            pass: typePass && codePass,
            message: message
         };
      }
   };
}

beforeEach(() => {

   jasmine.addMatchers({
      toBeSyntaxError
   });

});

module.exports = {
   toBeSyntaxError
};
