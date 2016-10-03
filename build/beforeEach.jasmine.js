/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

function toEqualProps(util, customEqualityTesters) {
   return {
      compare: (actual, expected) => {
         const mismatchedActual = {};
         const mismatchedExpected = {};
         const actualSubset = {};
         let pass = true;
         let message;

         for (const propName in expected) {
            actualSubset[propName] = actual[propName];

            if (!util.equals(actual[propName], expected[propName], customEqualityTesters)) {
               pass = false;
               mismatchedActual[propName] = actual[propName];
               mismatchedExpected[propName] = expected[propName];
            }
         }

         if (pass) {
            message = 'Expected ' + JSON.stringify(actualSubset) +
               ' not to match ' + JSON.stringify(expected) + '.';
         } else {
            message = 'Expected ' + JSON.stringify(mismatchedActual) +
               ' to match ' + JSON.stringify(mismatchedExpected) + '.';
         }

         return {
            pass: pass,
            message: message
         };
      }
   };
}

beforeEach(() => {
   jasmine.addMatchers({
      toEqualProps
   });
});

module.exports = {
   toEqualProps
};
