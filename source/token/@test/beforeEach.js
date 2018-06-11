/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

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

beforeEach(() => {
   jasmine.addMatchers({
      toContainPTokenProps,
   });

});

module.exports = {
   toContainPTokenProps,
};
