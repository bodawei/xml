/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

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
            message: message,
         };
      },
   };
}

function toBeInstanceOf() {
   return {
      compare: (actual, expected) => {
         if (typeof expected !== 'function') {
            throw new Error('Must pass a function to the second argument of the .toBeInstanceOf() jasmine matcher.');
         }
         if (typeof actual !== 'object' && typeof actual !== 'function') {
            throw new Error('Must pass an object to the first argument of the .toBeInstanceOf() jasmine matcher.');
         }

         const pass = (actual instanceof expected);
         let message;

         // We can't report the instance name in IE11
         if (pass) {
            message = 'Expected instance not to be an instance of ' + expected.name + '.';
         } else {
            message = 'Expected instance to be an instance of ' + expected.name + '.';
         }

         return {
            pass: pass,
            message: message,
         };
      },
   };
}

console.json = function json() {
   const args = arguments;

   if (arguments.length === 1) {
      console.debug(JSON.stringify(arguments[0], undefined, 4));
   } else {
      for (let index = 0; index < arguments.length; index++) {
         console.debug(`@ INDEX ${index}: ${JSON.stringify(arguments[index], undefined, 4)}`);
      }
   }
}


beforeEach(() => {
   jasmine.addMatchers({
      toEqualProps,
      toBeInstanceOf,
   });
});

module.exports = {
   toEqualProps,
   toBeInstanceOf,
};
