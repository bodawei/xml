/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

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

function toMatchClasses() {
   return {
      compare: (actualObjects, expectedConstructors) => {
         let pass = true;
         let message = '';
         let mismatchIndex;

         const maxSearch = Math.min(actualObjects.length, expectedConstructors.length);
         for (let index = 0; index < maxSearch; index++) {
            if (actualObjects[index].constructor !== expectedConstructors[index]) {
               mismatchIndex = index;
               break;
            }
         }

         if (actualObjects.length !== expectedConstructors.length) {
            pass = false;
            message = `Expected ${expectedConstructors.length} objects, but got ${actualObjects.length}.`;
            message += `\n\tActual:   ${actualObjects.map((object) => object.constructor.name).join(', ')}\n`;
            message += `\tExpected: ${expectedConstructors.map((constr) => constr.name).join(', ')}\n`;
         } else {
            pass = mismatchIndex === undefined;

            if (pass) {
               const types = expectedConstructors.map((constr) => constr.name);
               message = `Expected one or more object types to not match: ${types.join()}.`;
            } else {
               message = `The type of object ${mismatchIndex} (${actualObjects[mismatchIndex].constructor.name})`;
               message += ` did not match ${expectedConstructors[mismatchIndex].name}.`;
            }
         }

         return {
            pass,
            message
         };
      }
   };
}

beforeEach(() => {
   jasmine.addMatchers({
      toBeSyntaxError,
      toMatchClasses
   });

});

module.exports = {
   toBeSyntaxError,
   toMatchClasses
};
