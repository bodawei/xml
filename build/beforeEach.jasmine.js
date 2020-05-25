/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

function toEqualShallowDifferent(util, customEqualityTesters) {
   return {
      compare: (actual, expected) => {
         let pass = actual !== expected;
         let message;

         if (!pass) {
            message = `Actual and expected are the same instance: ${JSON.stringify(actual)}`;
         } else if (!util.equals(actual, expected, customEqualityTesters)) {
            pass = false;
            message = `Actual is the same value as expected, but they are not identical (actual: ${JSON.stringify(actual)} and expected: ${JSON.stringify(expected)}).`;
         } else {
            message = `Actual is the same value as expected (${JSON.stringify(actual)}) and they are equal.`;
         }

         return {
            pass: pass,
            message: message,
         };
      },
   };
}

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

function toEqualShape(util, customEqualityTesters) {
   return {
      compare: (actual, expected) => {
         let pass = true;
         let message = '';
         const mismatch = {};
         const extra = [];

         const actualKeys = Object.keys(actual);
         const expectedKeys = Object.keys(expected);

         expectedKeys.forEach((key) => {
            if (actualKeys.indexOf(key) !== -1) {
               const actualValue = actual[key];
               const expectedValue = expected[key];

               if (actualValue !== expectedValue) {
                  mismatch[key] = [ actualValue, expectedValue ];
                  pass = false;
               }
            } else {
               mismatch[key] = [ undefined, expected[key] ];
               pass = false;
            }
         });

         actualKeys.forEach((key) => {
            if (expectedKeys.indexOf(key) === -1) {
               extra.push(key);
               pass = false;
            }
         });

         if (pass) {
            message = 'Values did not mismatch (both were: ' + JSON.stringify(actual, undefined, 2) + ')\n';
         } else {
            const mismatchKeys = Object.keys(mismatch);

            if (mismatchKeys.length > 0) {
               message += 'Property mismatches:\n';
               mismatchKeys.forEach((key) => {
                  message += `\t${key}: ${mismatch[key][0]}  (Expected: ${mismatch[key][1]})\n`;
               });
            }

            if (extra.length > 0) {
               message += 'Extra properties in actual:\n';

               extra.forEach((key) => {
                  message += `\t${key}: ${actual[key]}\n`;
               });
            }
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
            message = 'Expected instance to be an instance of ' + expected.name + '. Found ' + actual.constructor.name;
         }

         return {
            pass: pass,
            message: message,
         };
      },
   };
}

console.json = function json() {
   if (arguments.length === 1) {
      console.debug(JSON.stringify(arguments[0], undefined, 3));
      return;
   }

   for (let index = 0; index < arguments.length; index++) {
      console.debug(`ARG ${index}: ${JSON.stringify(arguments[index], undefined, 3)}`);
   }
};

beforeEach(() => {
   jasmine.addMatchers({
      toEqualProps,
      toEqualShape,
      toBeInstanceOf,
      toEqualShallowDifferent,
   });
});

module.exports = {
   toEqualProps,
   toEqualShape,
   toBeInstanceOf,
   toEqualShallowDifferent,
};
