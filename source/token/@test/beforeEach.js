/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from '../../sToken/index';

function toContainPTokenProps(util, customEqualityTesters) {
   return {
      compare: (callbackSpy, expectedProps) => {
         let pass = true;
         let message = '';

         if (!callbackSpy) {
            throw new Error('Did not get a spy as expected.');
         }

         let actualProps = callbackSpy;

         if (callbackSpy.calls) {
            const args = callbackSpy.calls.allArgs();

            if (args.length !== 1 || args[0].length !== 1) {
               throw new Error('toContainPTokenProps() wanted one call with one argument. ' +
                  `Got ${args.length} calls with ${args[0] ? args[0].length : 0} arguments.`);
            }

            actualProps = args[0][0];
         }

         Object.keys(expectedProps).forEach((propName) => {
            if (!actualProps.hasOwnProperty(propName)) {
               pass = false;
               message += `Did not find the property "${propName}" in callback value.\n`;
            }

            if (actualProps.hasOwnProperty(propName) &&
               !util.equals(actualProps[propName], expectedProps[propName], customEqualityTesters)) {
               pass = false;
               // note JSON.stringify() loses properties that have undefined values
               message += `${propName}'s value did not match.\n` +
                  `   Actual:   ${JSON.stringify(actualProps[propName])}\n` +
                  `   Expected: ${JSON.stringify(expectedProps[propName])}\n`;
            }
         });

         if (pass) {
            message = 'Expected properties not to be found in callback, but they were.';
         }

         return {
            pass,
            message,
         };
      },
   };
}

function makeRangeless(item) {
   const result = {};

   if (item === null || item === undefined) {
      return item;
   }

   if (item.calls) {
      const args = item.calls.allArgs();

      if (args.length !== 1 || args[0].length !== 1) {
         throw new Error('toContainPTokenProps() wanted one call with one argument. ' +
            `Got ${args.length} calls with ${args[0] ? args[0].length : 0} arguments.`);
      }

      item = args[0][0];
   }

   if (typeof item !== 'object') {
      return item;
   }

   Object.keys(item).forEach((name) => {
      const value = item[name];

      if (value instanceof SToken) {
         result[name] = new SToken(value.str, value.originalStr, []);
      } else if (Array.isArray(value)) {
         result[name] = value.map((element) => makeRangeless(element));
      } else if (typeof value === 'object') {
         result[name] = makeRangeless(value);
      } else {
         result[name] = item[name];
      }
   });

   return result;
}

function getTheOneArg(callback) {
   if (callback.calls) {
      const args = callback.calls.allArgs();

      if (args.length !== 1 || args[0].length !== 1) {
         throw new Error('toContainPTokenProps() wanted one call with one argument. ' +
            `Got ${args.length} calls with ${args[0] ? args[0].length : 0} arguments.`);
      }

      return args[0][0];
   }

   return callback;
}

function fixUndef(value) {
   if (Array.isArray(value)) {
      return value.map((entry) => fixUndef(entry));
   } else if (typeof value === 'object') {
      const newObj = {};

      Object.entries(value).forEach(([key, val]) => {
         newObj[key] = fixUndef(val);
      });

      return newObj;
   } if (value === undefined) {
      value = '•undefined•';
   }

   return value;
}

function toEqualRangeless(util, customEqualityTesters) {
   return {
      compare(callbackSpy, expectedProps) {
         if (!callbackSpy) {
            throw new Error('Did not get a spy as expected.');
         }

         let pass = true;
         let def = 'Expected properties not to be found in callback, but they were.';
         let actual = makeRangeless(getTheOneArg(callbackSpy));
         let expected = makeRangeless(expectedProps);
         let message = '';

         Object.keys(expected).forEach((propName) => {
            if (!actual.hasOwnProperty(propName)) {
               pass = false;
               message += `"${propName}" was not found in callback value.\n`;
               return;
            }

            let exp = expected[propName];
            const act = actual[propName];

            if (act instanceof SToken && typeof exp === 'string') {
               exp = new SToken(exp, exp, []);
            }

            if (!util.equals(act, exp, customEqualityTesters)) {
               pass = false;
               // note JSON.stringify() loses properties that have undefined values
               message += `${propName}'s value did not match.\n` +
                  `   Actual:   ${JSON.stringify(fixUndef(act))}\n` +
                  `   Expected: ${JSON.stringify(fixUndef(exp))}\n`;
            }
         });

         return {
            pass,
            message: message || def,
         };
      },
   };
}


beforeEach(() => {
   jasmine.addMatchers({
      toContainPTokenProps,
      toEqualRangeless,
   });

});

module.exports = {
   toContainPTokenProps,
   toEqualRangeless,
   makeRangeless,
};
