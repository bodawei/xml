/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range } from '../../basic';
import SToken from '../SToken';

function toEqualSTokenText() {
   return {
      compare: (actualSToken: SToken | void, expectedStr: string) => {
         let pass = true;
         let message = '';

         if (!actualSToken) {
            throw new Error(`SToken with text "${expectedStr}" is undefined, but should not be.`);
         } else {
            const expected = toSTokenTextObj(expectedStr);

            if (actualSToken.str !== expected.str) {
               pass = false;
               message = 'SToken text values do not match.\n';
               message += `\tActual:   ${actualSToken.str}\n`;
               message += `\tExpected: ${expected.str}\n`;
            } else if (actualSToken.originalStr !== expected.originalStr) {
               pass = false;
               message = 'SToken original text values do not match.\n';
               message += `\tActual:   ${actualSToken.originalStr}\n`;
               message += `\tExpected: ${expected.originalStr}\n`;
            } else {
               pass = true;
               message = 'Expected text values in SToken not to match. ' +
                  `("${actualSToken.str}" and "${actualSToken.originalStr}").\n`;
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

function toEqualSTokenTexts() {
   return {
      compare: (actualArray: Array<any>, expectedTexts: Array<string>) => {
         let pass = true;
         let message = '';
         let mismatchIndex;

         if (!actualArray || !Array.isArray(actualArray)) {
            throw new Error('Expected array of strings or text/original texts, but got undefined or a non-array.');
         }

         // Frequently, we're going to want to just pass back the result of spy.calls.allArgs(), so just strip
         // off the inner array
         if (Array.isArray(actualArray[0])) {
            actualArray = actualArray.map((item) => { return item[0]; });
         }

         const expected = expectedTexts.map(toSTokenTextObj);

         const maxSearch = Math.min(actualArray.length, expected.length);
         for (let index = 0; index < maxSearch; index++) {
            if (actualArray[index].str !== expected[index].str ||
               actualArray[index].originalStr !== expected[index].originalStr) {
               mismatchIndex = index;
               break;
            }
         }

         if (actualArray.length !== expected.length) {
            pass = false;
            message = `Expected ${expected.length} STokens, but got ${actualArray.length}.\n`;
            message += `\tExpected: ${displaySTokenTexts(expected)}\n`;
            message += `\tActual:   ${displaySTokenTexts(actualArray)}\n`;
         } else {
            pass = mismatchIndex === undefined;

            if (mismatchIndex === undefined) {
               message = `Expected one or more SToken texts to not match: ${displaySTokenTexts(expected)}.`;
            } else {
               message = `The text of SToken ${mismatchIndex} ${displaySTokenTexts([ actualArray[mismatchIndex] ])}`;
               message += ` did not match ${displaySTokenTexts([ expected[mismatchIndex] ])}.`;
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

function displaySTokenTexts(objects: Array<SToken>) {
   return objects.map((obj) => {
      if (obj.str !== obj.originalStr) {
         return `"${obj.str}"/"${obj.originalStr}"`;
      } else {
         return `"${obj.str}"`;
      }
   }).join(', ');
}

function toSTokenTextObj(expectedStr: string | SToken): SToken {
   let expected = expectedStr;

   if (typeof expected === 'string') {
      expected = SToken.fromString(expected);
   }

   return expected;
}

function toEqualSTokenRange() {
   return {
      compare: (actualSToken: SToken, expectedRange: Range) => {
         let pass = true;
         let message = '';

         if (!actualSToken) {
            throw new Error('SToken is undefined, but should not be.');
         }

         if (expectedRange.equals(actualSToken.ranges[0])) {
            pass = true;
            message = `Expected range not to match. ("${actualSToken.ranges[0].toString()}").\n`;
         } else {
            pass = false;
            message = 'SToken range does not match.\n';
            message += `\tActual:   ${actualSToken.ranges[0].toString()}\n`;
            message += `\tExpected: ${expectedRange.toString()}\n`;
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
      toEqualSTokenText,
      toEqualSTokenTexts,
      toEqualSTokenRange,
   });

});

export {
   toEqualSTokenText,
   toEqualSTokenTexts,
   toEqualSTokenRange,
};
