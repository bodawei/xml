import { describe, expect, it } from '@jest/globals';
import { SToken } from 'sToken';

type Props =  { [name: string]: any, calls?: any };

function makeRangeless(item: undefined | Props): Props | undefined | null {
   const result: Props = {};

   if (item === null || item === undefined) {
      return item;
   }

   if (typeof item !== 'object') {
      return item;
   }

   let props = item;

   if (props instanceof SToken) {
      return new SToken(props.str, props.originalStr, []);
   }

   if (Array.isArray(props)) {
      return props.map((element) => makeRangeless(element));
   }

   Object.keys(props).forEach((name) => {
      const value = props[name];

      if (value instanceof SToken) {
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

function getTheOneArg(callback: jest.MockedFunction<any>) {
   if (callback.mock?.calls) {
      const args = callback.mock.calls;

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

expect.extend({
   toEqualRangeless(callbackSpy: jest.MockedFunction<any>, expectedProps?: Props) {
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

         if (act instanceof SToken && typeof exp === 'string') {
            exp = new SToken(exp, exp, []);
         }

         if (!this.equals(act, exp)) {
            pass = false;
            // note JSON.stringify() loses properties that have undefined values
            message += `"${propName}"'s value did not match.\n` +
               `   ACTUAL:   ${JSON.stringify(fixUndef(act), undefined, 2)}\n` +
               `   EXPECTED: ${JSON.stringify(fixUndef(exp), undefined, 2)}\n`;
         }
      });


      return {
         pass,
         message: () => message || def,
      };
   }
});



declare global {
   namespace jest {
      interface Matchers<T> {
         toEqualRangeless(callbackSpy: jest.MockedFunction<any>, expectedProps?: Props): T;
      }
   }
}