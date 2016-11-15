/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const SyntaxError = require('./error/SyntaxError.js');

function toBeSyntaxError() {
   return {
      compare: (actual, expected) => {
         const typePass = actual instanceof SyntaxError;
         const codePass = actual.id === expected;
         let message;

         if (typePass && codePass) {
            message = 'Expected syntax error code ' + actual.id +
               ' not to match ' + expected + '.';
         } else {
            message = 'Expected syntax error code ' + actual.id +
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
