/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';

type Props =  { [name: string]: any, calls?: any };

function toContainPTokenProps(util?: any, customEqualityTesters?: any) {
   return {
      compare: (callbackSpy: jasmine.Spy | Props | void, expectedProps: Props) => {
         let pass = true;
         let message = '';

         if (!callbackSpy) {
            throw new Error('Did not get a spy as expected.');
         }

         let actualProps: Props;

         if (callbackSpy.calls) {
            const args = callbackSpy.calls.allArgs();

            if (args.length !== 1 || args[0].length !== 1) {
               throw new Error('toContainPTokenProps() wanted one call with one argument. ' +
                  `Got ${args.length} calls with ${args[0] ? args[0].length : 0} arguments.`);
            }

            actualProps = args[0][0];
         } else {
            actualProps = callbackSpy;
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

function makeRangeless(item: void | Props): Props | void | null {
   const result: Props = {};

   if (item === null || item === undefined) {
      return item;
   }

   let props = item;

   if (typeof props !== 'object') {
      return props;
   }

   if (typeof props === 'object' && 'originalStr' in props) {
      return new SToken(props.str, props.originalStr, []);
   }

   if (Array.isArray(props)) {
      return props.map((element) => makeRangeless(element));
   }

   Object.keys(props).forEach((name) => {
      const value = props[name];

      if (typeof value === 'object' && 'originalStr' in value) {
         result[name] = new SToken(value.str, value.originalStr, []);
      } else if (Array.isArray(value)) {
         result[name] = value.map((element) => makeRangeless(element));
      } else if (typeof value === 'object') {
         result[name] = makeRangeless(value);
      } else {
         result[name] = props[name];
      }
   });

   return result;
}

function getTheOneArg(callback: jasmine.Spy) {
   if (callback.calls) {
      const args = callback.calls.allArgs();

      if (args.length !== 1 || args[0].length !== 1) {
         throw new Error('toEqualRangeless() wanted one call with one argument. ' +
            `Got ${args.length} calls with ${args[0] ? args[0].length : 0} arguments.`);
      }

      return args[0][0];
   }

   return callback;
}

function fixUndef(value: Array<any> | Props | void): string | Props {
   if (Array.isArray(value)) {
      return value.map((entry) => fixUndef(entry));
   } else if (typeof value === 'object') {
      const newObj: Props = {};

      Object.keys(value).forEach((key) => {
         const val: any = value[key];
         newObj[key] = fixUndef(val);
      });

      return newObj;
   } if (value === undefined) {
      return '•undefined•';
   }

   return value;
}

function toEqualRangeless(util: any, customEqualityTesters: any) {
   return {
      compare(callbackSpy: jasmine.Spy, expectedProps?: Props) {
         if (!callbackSpy) {
            throw new Error('Did not get a spy as expected.');
         }

         let pass = true;
         let def = 'Expected properties not to be found in callback, but they were.';
         let actual: Props = makeRangeless(getTheOneArg(callbackSpy)) || {};
         let expected: Props = makeRangeless(expectedProps) || {};
         let message = '';

         Object.keys(expected).forEach((propName) => {
            if (!actual.hasOwnProperty(propName)) {
               pass = false;
               message += `"${propName}" was not found in callback value.\n`;
               return;
            }

            let exp = expected[propName];
            const act = actual[propName];

            if ((typeof act === 'object' && 'originalStr' in act) && typeof exp === 'string') {
               exp = new SToken(exp, exp, []);
            }

            if (!util.equals(act, exp, customEqualityTesters)) {
               pass = false;
               // note JSON.stringify() loses properties that have undefined values
               message += `"${propName}"'s value did not match.\n` +
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
      toEqualRangeless: toEqualRangeless as any,
   });
});

module.exports = {
   toContainPTokenProps,
   toEqualRangeless,
};

declare global {
   namespace jasmine {
      interface Matchers<T> {
         toEqualRangeless(matcher: any): void;
         toContainPTokenProps(matcher: any): void;
      }
   }
}

export {
   toContainPTokenProps,
   toEqualRangeless,
}
